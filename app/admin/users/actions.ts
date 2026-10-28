"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUser(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  const username = (formData.get("username") as string)?.trim();
  const name = (formData.get("name") as string)?.trim() || null;
  const password = (formData.get("password") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!id || !username) {
    return { error: "กรุณาระบุไอดีผู้ใช้ (Username)" };
  }

  try {
    // Check if username is taken by another user or admin
    const [existingUserWithSameName, existingAdminWithSameName] = await Promise.all([
      prisma.user.findFirst({
        where: {
          username,
          NOT: { id },
        },
      }),
      prisma.admin.findUnique({
        where: { username },
      }),
    ]);

    if (existingUserWithSameName || existingAdminWithSameName) {
      return { error: `ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น` };
    }

    const dataToUpdate: any = {
      username,
      name,
      phone,
      address,
    };

    // If new password is provided, update both hashed password and plainPassword
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
      dataToUpdate.plainPassword = password;
    }

    await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Update user error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้" };
  }
}

export async function createUser(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const name = (formData.get("name") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!username || !password) {
    return { error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" };
  }

  try {
    const [existingUser, existingAdmin] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.admin.findUnique({ where: { username } }),
    ]);

    if (existingUser || existingAdmin) {
      return { error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        plainPassword: password,
        name,
        phone,
        address,
        role: "USER",
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน" };
  }
}

export async function deleteUser(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) return { error: "ไม่พบรหัสผู้ใช้" };

  try {
    // Delete related orders / items if necessary
    const userOrders = await prisma.order.findMany({ where: { userId: id } });
    const orderIds = userOrders.map((o) => o.id);

    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.order.deleteMany({
        where: { userId: id },
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการลบผู้ใช้" };
  }
}

export async function createAdmin(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const name = (formData.get("name") as string)?.trim() || null;

  if (!username || !password) {
    return { error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่านสำหรับ Admin" };
  }

  try {
    const [existingAdmin, existingUser] = await Promise.all([
      prisma.admin.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingAdmin || existingUser) {
      return { error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        plainPassword: password,
        name,
        role: "ADMIN",
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Create admin error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการสร้าง Admin" };
  }
}

export async function updateAdmin(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  const username = (formData.get("username") as string)?.trim();
  const name = (formData.get("name") as string)?.trim() || null;
  const password = (formData.get("password") as string)?.trim();

  if (!id || !username) {
    return { error: "กรุณาระบุไอดีผู้ใช้ Admin" };
  }

  try {
    const [existingAdminWithSameName, existingUserWithSameName] = await Promise.all([
      prisma.admin.findFirst({
        where: {
          username,
          NOT: { id },
        },
      }),
      prisma.user.findUnique({
        where: { username },
      }),
    ]);

    if (existingAdminWithSameName || existingUserWithSameName) {
      return { error: `ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น` };
    }

    const dataToUpdate: any = {
      username,
      name,
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
      dataToUpdate.plainPassword = password;
    }

    await prisma.admin.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Update admin error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล Admin" };
  }
}

export async function deleteAdmin(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) return { error: "ไม่พบรหัสผู้ดูแลระบบ" };

  try {
    const adminCount = await prisma.admin.count();
    if (adminCount <= 1) {
      return { error: "ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบอย่างน้อย 1 บัญชีในระบบ" };
    }

    await prisma.admin.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete admin error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการลบ Admin" };
  }
}
