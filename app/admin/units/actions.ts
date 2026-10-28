"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createUnit(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name) return { error: "กรุณาระบุชื่อหน่วยนับ" };

    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing) return { error: "มีหน่วยนับนี้อยู่แล้ว" };

    await prisma.unit.create({
      data: { name },
    });

    revalidatePath("/admin/units");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create unit" };
  }
}

export async function updateUnit(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;

    if (!id || !name) return { error: "ข้อมูลไม่ครบถ้วน" };

    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing && existing.id !== id) return { error: "มีหน่วยนับนี้อยู่แล้ว" };

    await prisma.unit.update({
      where: { id },
      data: { name },
    });

    revalidatePath("/admin/units");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update unit" };
  }
}

export async function deleteUnit(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Missing ID" };

    // Since product stores unit as String, it's safe to delete a unit from the Unit table
    // It won't cascade delete products, it just removes it from the options dropdown.
    await prisma.unit.delete({
      where: { id },
    });

    revalidatePath("/admin/units");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete unit" };
  }
}
