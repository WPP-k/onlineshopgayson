import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, promotions });
  } catch (error: any) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load promotions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productId,
      name,
      type,
      discountPrice,
      discountPercent,
      badgeText,
      description,
      isActive = true,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "กรุณาเลือกสินค้าที่ต้องการจัดโปรโมชัน" },
        { status: 400 }
      );
    }

    if (!type || !["BUY_1_GET_1", "BUY_2_GET_1", "DISCOUNT"].includes(type)) {
      return NextResponse.json(
        { error: "ประเภทโปรโมชันไม่ถูกต้อง (ต้องเป็น BUY_1_GET_1, BUY_2_GET_1 หรือ DISCOUNT)" },
        { status: 400 }
      );
    }

    if (type === "DISCOUNT" && (typeof discountPrice !== "number" || discountPrice <= 0)) {
      return NextResponse.json(
        { error: "กรุณาระบุราคาโปรโมชันลดราคาที่มากกว่า 0" },
        { status: 400 }
      );
    }

    // Upsert promotion for the product
    const promo = await prisma.promotion.upsert({
      where: { productId },
      create: {
        productId,
        name: name || (type === "BUY_1_GET_1" ? "ซื้อ 1 แถม 1" : type === "BUY_2_GET_1" ? "ซื้อ 2 แถม 1" : "สินค้าลดราคา"),
        type,
        discountPrice: type === "DISCOUNT" ? discountPrice : null,
        discountPercent: type === "DISCOUNT" ? discountPercent : null,
        badgeText: badgeText || (type === "BUY_1_GET_1" ? "ซื้อ 1 แถม 1" : type === "BUY_2_GET_1" ? "ซื้อ 2 แถม 1" : "ลดราคา"),
        description: description || null,
        isActive: Boolean(isActive),
      },
      update: {
        name: name || (type === "BUY_1_GET_1" ? "ซื้อ 1 แถม 1" : type === "BUY_2_GET_1" ? "ซื้อ 2 แถม 1" : "สินค้าลดราคา"),
        type,
        discountPrice: type === "DISCOUNT" ? discountPrice : null,
        discountPercent: type === "DISCOUNT" ? discountPercent : null,
        badgeText: badgeText || (type === "BUY_1_GET_1" ? "ซื้อ 1 แถม 1" : type === "BUY_2_GET_1" ? "ซื้อ 2 แถม 1" : "ลดราคา"),
        description: description || null,
        isActive: Boolean(isActive),
      },
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

    return NextResponse.json({ success: true, promotion: promo });
  } catch (error: any) {
    console.error("Error creating/updating promotion:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save promotion" },
      { status: 500 }
    );
  }
}
