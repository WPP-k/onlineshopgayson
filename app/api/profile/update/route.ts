import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string; role?: string };
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 });
    }

    const body = await request.json().catch(async () => {
      const fd = await request.formData();
      return {
        name: fd.get("name")?.toString(),
        phone: fd.get("phone")?.toString(),
        address: fd.get("address")?.toString(),
      };
    });

    const { name, phone, address } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    if (decoded.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } else {
      try {
        await prisma.admin.update({
          where: { id: userId },
          data: updateData,
        });
      } catch (err: any) {
        console.warn("Prisma admin.update failed in route, using raw SQL:", err?.message);
        await prisma.$executeRawUnsafe(
          `UPDATE Admin SET name = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          updateData.name || null,
          updateData.phone || null,
          updateData.address || null,
          userId
        );
      }
    }

    return NextResponse.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
