"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-mvp";

export async function updateProfile(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role?: string; username?: string };
    let userId = decoded.id;

    const name = formData.get("name")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim() || null;
    const address = formData.get("address")?.toString().trim() || null;
    const newPassword = formData.get("newPassword")?.toString().trim();

    if (!name) {
      return { error: "กรุณาระบุชื่อ-นามสกุล" };
    }

    const updateData: any = {
      name,
      phone,
      address,
    };

    if (newPassword && newPassword.length >= 6) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
      updateData.plainPassword = newPassword;
    }

    if (decoded.role === "ADMIN") {
      // Find admin by ID, fallback to username or first admin
      let admin = await prisma.admin.findUnique({ where: { id: userId } });
      if (!admin && decoded.username) {
        admin = await prisma.admin.findUnique({ where: { username: decoded.username } });
      }
      if (!admin) {
        admin = await prisma.admin.findFirst();
      }
      if (admin) {
        userId = admin.id;
      }

      try {
        await prisma.admin.update({
          where: { id: userId },
          data: updateData,
        });
      } catch (err: any) {
        console.warn("Prisma admin.update failed, using raw query fallback:", err?.message);
        if (updateData.password) {
          await prisma.$executeRawUnsafe(
            `UPDATE Admin SET name = ?, phone = ?, address = ?, password = ?, plainPassword = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            updateData.name,
            updateData.phone,
            updateData.address,
            updateData.password,
            updateData.plainPassword,
            userId
          );
        } else {
          await prisma.$executeRawUnsafe(
            `UPDATE Admin SET name = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            updateData.name,
            updateData.phone,
            updateData.address,
            userId
          );
        }
      }
    } else {
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user && decoded.username) {
        user = await prisma.user.findUnique({ where: { username: decoded.username } });
      }
      if (user) {
        userId = user.id;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, message: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}
