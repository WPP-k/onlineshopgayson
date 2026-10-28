import { prisma } from "@/lib/prisma";
import { OrderManagerClient, OrderData } from "./OrderManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const rawOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          address: true,
        },
      },
      items: true,
    },
  });

  const orders: OrderData[] = rawOrders.map((o) => ({
    id: o.id,
    userId: o.userId,
    user: o.user
      ? {
          id: o.user.id,
          name: o.user.name,
          username: o.user.username,
          phone: o.user.phone,
          address: o.user.address,
        }
      : null,
    totalAmount: o.totalAmount,
    status: o.status,
    deliveryType: o.deliveryType,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    shippingAddress: o.shippingAddress,
    latitude: o.latitude,
    longitude: o.longitude,
    paymentMethod: o.paymentMethod,
    pickupTime: o.pickupTime,
    notes: o.notes,
    slipImage: o.slipImage,
    slipUploadedAt: o.slipUploadedAt?.toISOString() || null,
    paymentVerifiedAt: o.paymentVerifiedAt?.toISOString() || null,
    paymentVerifiedBy: o.paymentVerifiedBy || null,
    paymentRejectReason: o.paymentRejectReason || null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      price: i.price,
    })),
  }));

  return <OrderManagerClient orders={orders} />;
}
