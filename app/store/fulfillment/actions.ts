"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface FulfillmentOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sku: string;
  image: string;
  currentStock: number;
}

export interface FulfillmentOrder {
  id: string;
  totalAmount: number;
  status: string;
  deliveryType: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  paymentMethod: string | null;
  pickupTime: string | null;
  notes: string | null;
  deliveryStatus: string | null;
  createdAt: string;
  items: FulfillmentOrderItem[];
  riderName?: string | null;
  riderPhone?: string | null;
}

// Fetch recent online orders with product barcode data for store fulfillment
export async function getStoreFulfillmentOrders(): Promise<FulfillmentOrder[]> {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: true,
        rider: true,
      },
    });

    // Gather all distinct productIds to fetch barcodes and images in a single batch
    const productIds = Array.from(
      new Set(orders.flatMap((o) => o.items.map((i) => i.productId)).filter(Boolean))
    );

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, image: true, stock: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return orders.map((o) => {
      const items: FulfillmentOrderItem[] = o.items.map((item) => {
        const prod = productMap.get(item.productId);
        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          sku: prod?.sku || item.productId,
          image: prod?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
          currentStock: prod?.stock ?? 0,
        };
      });

      return {
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        deliveryType: o.deliveryType,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentMethod,
        pickupTime: o.pickupTime,
        notes: o.notes,
        deliveryStatus: o.deliveryStatus,
        createdAt: o.createdAt.toISOString(),
        items,
        riderName: o.rider?.name,
        riderPhone: o.rider?.phone,
      };
    });
  } catch (error) {
    console.error("getStoreFulfillmentOrders error:", error);
    return [];
  }
}

// Update order status from fulfillment screen
export async function updateFulfillmentOrderStatus(
  orderId: string,
  status: string,
  deliveryStatus?: string
) {
  try {
    const updateData: any = { status };
    if (deliveryStatus) {
      updateData.deliveryStatus = deliveryStatus;
    }
    if (status === "DELIVERED" || deliveryStatus === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath("/store/fulfillment");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/delivery");
    revalidatePath("/profile");
    revalidatePath("/track");

    return { success: true };
  } catch (error: any) {
    console.error("updateFulfillmentOrderStatus error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการปรับสถานะ" };
  }
}
