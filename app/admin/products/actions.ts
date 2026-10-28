"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  const sku = (formData.get("sku") as string)?.trim() || null;
  const name = (formData.get("name") as string)?.trim();
  const costPrice = parseFloat(formData.get("costPrice") as string) || 0;
  const price = parseFloat(formData.get("price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string, 10) || 0;
  const minStock = parseInt(formData.get("minStock") as string, 10) || 5;
  const image = (formData.get("image") as string)?.trim() || "";
  const categoryId = (formData.get("categoryId") as string) || null;
  const unit = (formData.get("unit") as string)?.trim() || "PC";

  if (!name) return { error: "กรุณาระบุชื่อสินค้า" };

  try {
    if (sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku }
      });
      if (existingProduct) {
        return { error: `บาร์โค้ดนี้มีอยู่ในระบบแล้ว (สินค้า: ${existingProduct.name})` };
      }
    }

    await prisma.product.create({
      data: {
        sku,
        name,
        costPrice,
        price,
        stock,
        minStock,
        image,
        categoryId: categoryId || null,
        unit,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Add product error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้า" };
  }
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const sku = (formData.get("sku") as string)?.trim() || null;
  const name = (formData.get("name") as string)?.trim();
  const costPrice = parseFloat(formData.get("costPrice") as string) || 0;
  const price = parseFloat(formData.get("price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string, 10) || 0;
  const minStock = parseInt(formData.get("minStock") as string, 10) || 5;
  const image = (formData.get("image") as string)?.trim() || "";
  const categoryId = (formData.get("categoryId") as string) || null;
  const unit = (formData.get("unit") as string)?.trim() || "PC";

  if (!id || !name) return { error: "ข้อมูลไม่ครบถ้วน" };

  try {
    if (sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku }
      });
      if (existingProduct && existingProduct.id !== id) {
        return { error: `บาร์โค้ดนี้ถูกใช้งานโดยสินค้าอื่นแล้ว (สินค้า: ${existingProduct.name})` };
      }
    }

    await prisma.product.update({
      where: { id },
      data: {
        sku,
        name,
        costPrice,
        price,
        stock,
        minStock,
        image,
        categoryId: categoryId || null,
        unit,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Update product error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการแก้ไขสินค้า" };
  }
}

export async function updateStock(formData: FormData) {
  const id = formData.get("id") as string;
  const adjust = parseInt(formData.get("adjust") as string, 10);

  if (!id || isNaN(adjust)) return;

  try {
    await prisma.product.update({
      where: { id },
      data: { stock: { increment: adjust } },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
  } catch (error) {
    console.error("Update stock error:", error);
  }
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath("/");
  } catch (error) {
    console.error("Delete product error:", error);
  }
}
