"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addBanner(formData: FormData) {
  try {
    const image = formData.get("image") as string;
    const isActive = formData.get("isActive") === "true";
    const order = parseInt(formData.get("order") as string, 10) || 0;

    if (!image) return { error: "กรุณาอัปโหลดรูปภาพ" };

    await prisma.banner.create({
      data: {
        image,
        isActive,
        order,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create banner" };
  }
}

export async function updateBannerStatus(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";

    if (!id) return { error: "Missing ID" };

    await prisma.banner.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update banner" };
  }
}

export async function deleteBanner(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Missing ID" };

    await prisma.banner.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete banner" };
  }
}
