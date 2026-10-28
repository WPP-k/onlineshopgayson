"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Search product by barcode (SKU, productCode, or ID)
export async function searchProductByBarcode(barcode: string) {
  try {
    const trimmed = barcode?.trim();
    if (!trimmed) {
      return { error: "กรุณาระบุรหัสบาร์โค้ด" };
    }

    // Try finding by SKU (barcode), productCode (รหัสสินค้า), or ID
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: trimmed },
          { productCode: trimmed },
          { id: trimmed },
        ],
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return { notFound: true, barcode: trimmed };
    }

    return { success: true, product };
  } catch (error: any) {
    console.error("searchProductByBarcode error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการค้นหาสินค้า" };
  }
}

// 2. Update stock / price from Handheld
export async function updateProductFromHandheld({
  productId,
  stockDelta,
  exactStock,
  newPrice,
}: {
  productId: string;
  stockDelta?: number;
  exactStock?: number;
  newPrice?: number;
}) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { error: "ไม่พบข้อมูลสินค้า" };
    }

    const dataToUpdate: any = {};

    if (typeof exactStock === "number") {
      dataToUpdate.stock = Math.max(0, exactStock);
    } else if (typeof stockDelta === "number") {
      dataToUpdate.stock = Math.max(0, product.stock + stockDelta);
    }

    if (typeof newPrice === "number" && !isNaN(newPrice) && newPrice >= 0) {
      dataToUpdate.price = newPrice;
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: {
        category: true,
      },
    });

    // Revalidate paths safely
    revalidatePath("/admin/products");
    revalidatePath("/handheld");
    revalidatePath("/store/fulfillment");
    revalidatePath("/");

    return {
      success: true,
      product: updated,
      message: `อัปเดตสต็อกเป็น ${updated.stock} ชิ้นเรียบร้อย`,
    };
  } catch (error: any) {
    console.error("updateProductFromHandheld error:", error);
    return { error: error.message || "ไม่สามารถอัปเดตสต็อกได้" };
  }
}

// 3. Create new product from Handheld (with productCode, unit, toteCode)
export async function createNewProductFromHandheld(formData: FormData) {
  try {
    const sku = formData.get("sku")?.toString().trim();
    const productCode = formData.get("productCode")?.toString().trim() || null;
    const name = formData.get("name")?.toString().trim();
    const priceStr = formData.get("price")?.toString().trim();
    const costPriceStr = formData.get("costPrice")?.toString().trim();
    const stockStr = formData.get("stock")?.toString().trim();
    const unit = formData.get("unit")?.toString().trim() || "PC";
    const toteCode = formData.get("toteCode")?.toString().trim() || null;
    const categoryId = formData.get("categoryId")?.toString().trim() || null;
    const image =
      formData.get("image")?.toString().trim() ||
      "📦";

    if (!sku || !name || !priceStr) {
      return { error: "กรุณาระบุบาร์โค้ด (SKU), ชื่อสินค้า และราคาขาย" };
    }

    // Check if barcode already exists
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ sku }, { id: sku }, ...(productCode ? [{ productCode }] : [])],
      },
    });

    if (existing) {
      return { error: `บาร์โค้ดหรือรหัสสินค้านี้มีอยู่ในระบบแล้ว (${existing.name})` };
    }

    const price = parseFloat(priceStr);
    const costPrice = costPriceStr ? parseFloat(costPriceStr) : null;
    const stock = stockStr ? parseInt(stockStr, 10) : 0;

    const created = await prisma.product.create({
      data: {
        sku,
        productCode,
        name,
        price: isNaN(price) ? 0 : price,
        costPrice: costPrice !== null && !isNaN(costPrice) ? costPrice : null,
        stock: isNaN(stock) ? 0 : stock,
        unit,
        toteCode,
        categoryId: categoryId || undefined,
        image,
        status: "ACTIVE",
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/handheld");
    revalidatePath("/");

    return {
      success: true,
      product: created,
      message: `บันทึกสินค้า "${created.name}" เข้าสู่ระบบเรียบร้อย`,
    };
  } catch (error: any) {
    console.error("createNewProductFromHandheld error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการบันทึกสินค้าใหม่" };
  }
}

// 4. Get categories list for selection
export async function getCategoriesList() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("getCategoriesList error:", error);
    return [];
  }
}

// ==========================================
// TOTE RECEIVING SYSTEM (ระบบตรวจรับสินค้าใน Tote)
// ==========================================

export interface ToteItemData {
  id: string;
  itemSeq: number;
  name: string;
  productCode: string;
  barcode: string;
  quantity: number;
  receivedQty: number;
  unit: string;
  isVerified: boolean;
}

export interface ToteData {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  items: ToteItemData[];
}

// 5. Get all Totes with items
export async function getTotesList(): Promise<ToteData[]> {
  try {
    if (!(prisma as any).tote) {
      console.warn("prisma.tote is not initialized yet");
      return [];
    }
    const totes = await prisma.tote.findMany({
      orderBy: { code: "asc" },
      include: {
        items: {
          orderBy: { itemSeq: "asc" },
        },
      },
    });

    return totes.map((t) => ({
      id: t.id,
      code: t.code,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      items: t.items.map((i) => ({
        id: i.id,
        itemSeq: i.itemSeq,
        name: i.name,
        productCode: i.productCode,
        barcode: i.barcode,
        quantity: i.quantity,
        receivedQty: i.receivedQty,
        unit: i.unit,
        isVerified: i.isVerified,
      })),
    }));
  } catch (error) {
    console.error("getTotesList error:", error);
    return [];
  }
}

// 6. Scan to verify an item inside a Tote
export async function verifyToteItemScan(toteId: string, barcodeOrCode: string) {
  try {
    const trimmed = barcodeOrCode?.trim();
    if (!trimmed) {
      return { error: "กรุณาระบุบาร์โค้ดหรือรหัสสินค้า" };
    }

    // Find item inside this Tote matching barcode OR productCode
    const item = await prisma.toteItem.findFirst({
      where: {
        toteId,
        OR: [{ barcode: trimmed }, { productCode: trimmed }],
      },
    });

    if (!item) {
      return {
        notFound: true,
        message: `ไม่พบสินค้าบาร์โค้ด "${trimmed}" ใน Tote นี้`,
      };
    }

    const newReceivedQty = item.receivedQty + 1;
    const isNowVerified = newReceivedQty >= item.quantity;

    // Update ToteItem
    const updatedItem = await prisma.toteItem.update({
      where: { id: item.id },
      data: {
        receivedQty: newReceivedQty,
        isVerified: isNowVerified,
      },
    });

    // Also update product stock in Product table
    const matchedProduct = await prisma.product.findFirst({
      where: {
        OR: [{ sku: item.barcode }, { productCode: item.productCode }],
      },
    });

    if (matchedProduct) {
      await prisma.product.update({
        where: { id: matchedProduct.id },
        data: {
          stock: { increment: 1 },
          toteCode: (await prisma.tote.findUnique({ where: { id: toteId } }))?.code,
        },
      });
    }

    revalidatePath("/handheld");
    revalidatePath("/admin/products");

    return {
      success: true,
      item: updatedItem,
      message: `ตรวจรับ "${updatedItem.name}" (${newReceivedQty}/${updatedItem.quantity} ${updatedItem.unit})`,
    };
  } catch (error: any) {
    console.error("verifyToteItemScan error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการตรวจรับ" };
  }
}

// 7. Toggle manual checkbox for a Tote Item
export async function toggleToteItemVerified(itemId: string) {
  try {
    const item = await prisma.toteItem.findUnique({ where: { id: itemId } });
    if (!item) return { error: "ไม่พบรายการ" };

    const newVerified = !item.isVerified;
    const newQty = newVerified ? item.quantity : 0;

    const updated = await prisma.toteItem.update({
      where: { id: itemId },
      data: {
        isVerified: newVerified,
        receivedQty: newQty,
      },
    });

    // Sync product stock
    const matchedProduct = await prisma.product.findFirst({
      where: {
        OR: [{ sku: item.barcode }, { productCode: item.productCode }],
      },
    });

    if (matchedProduct) {
      const delta = newVerified ? item.quantity - item.receivedQty : -item.receivedQty;
      if (delta !== 0) {
        await prisma.product.update({
          where: { id: matchedProduct.id },
          data: {
            stock: { increment: delta },
          },
        });
      }
    }

    revalidatePath("/handheld");
    revalidatePath("/admin/products");

    return { success: true, item: updated };
  } catch (error: any) {
    console.error("toggleToteItemVerified error:", error);
    return { error: error.message || "ไม่สามารถอัปเดตสถานะได้" };
  }
}

// 8. Accept / Complete whole Tote
export async function acceptAllTote(toteId: string) {
  try {
    const items = await prisma.toteItem.findMany({ where: { toteId } });

    for (const item of items) {
      if (!item.isVerified) {
        const remaining = item.quantity - item.receivedQty;
        await prisma.toteItem.update({
          where: { id: item.id },
          data: {
            isVerified: true,
            receivedQty: item.quantity,
          },
        });

        // Add remaining into Product table
        const matched = await prisma.product.findFirst({
          where: { OR: [{ sku: item.barcode }, { productCode: item.productCode }] },
        });

        if (matched && remaining > 0) {
          await prisma.product.update({
            where: { id: matched.id },
            data: { stock: { increment: remaining } },
          });
        }
      }
    }

    await prisma.tote.update({
      where: { id: toteId },
      data: { status: "COMPLETED" },
    });

    revalidatePath("/handheld");
    revalidatePath("/admin/products");

    return { success: true, message: "ตรวจรับสินค้าใน Tote ครบทั้งหมดเรียบร้อย" };
  } catch (error: any) {
    console.error("acceptAllTote error:", error);
    return { error: error.message || "เกิดข้อผิดพลาด" };
  }
}

// 9. Create a new Tote
export async function createNewTote(toteCode: string) {
  try {
    const trimmed = toteCode.trim().toUpperCase();
    if (!trimmed) return { error: "กรุณาระบุรหัส Tote" };

    const existing = await prisma.tote.findUnique({ where: { code: trimmed } });
    if (existing) return { error: `มี Tote รหัส "${trimmed}" ในระบบแล้ว` };

    const created = await prisma.tote.create({
      data: {
        code: trimmed,
        status: "PENDING",
      },
    });

    revalidatePath("/handheld");
    return { success: true, tote: created };
  } catch (error: any) {
    console.error("createNewTote error:", error);
    return { error: error.message || "ไม่สามารถสร้าง Tote ได้" };
  }
}
