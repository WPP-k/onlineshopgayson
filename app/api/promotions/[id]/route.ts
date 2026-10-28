import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice;
    if (body.badgeText !== undefined) updateData.badgeText = body.badgeText;
    if (body.description !== undefined) updateData.description = body.description;

    const updated = await prisma.promotion.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            unit: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, promotion: updated });
  } catch (error: any) {
    console.error("Error updating promotion:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update promotion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.promotion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Promotion deleted" });
  } catch (error: any) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
