"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const icon = (formData.get("icon") as string) || (formData.get("image") as string) || "Tag";

    if (!name?.trim()) return { error: "กรุณาระบุชื่อหมวดหมู่" };

    await prisma.category.create({
      data: {
        name: name.trim(),
        image: icon.trim() || "Tag",
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่" };
  }
}

export async function deleteCategory(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "ไม่พบรหัสหมวดหมู่" };

    // Check if category has products
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return { error: "ไม่สามารถลบหมวดหมู่ได้เนื่องจากมีสินค้าอยู่ในหมวดหมู่นี้" };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "เกิดข้อผิดพลาดในการลบหมวดหมู่" };
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const icon = (formData.get("icon") as string) || (formData.get("image") as string);

    if (!id || !name?.trim()) return { error: "ข้อมูลไม่ครบถ้วน กรุณากรอกชื่อหมวดหมู่" };

    const updateData: { name: string; image?: string | null } = {
      name: name.trim(),
    };

    if (icon) {
      updateData.image = icon.trim();
    }

    await prisma.category.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่" };
  }
}
