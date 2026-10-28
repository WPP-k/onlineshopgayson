import { prisma } from "@/lib/prisma";
import { RiderPortalClient } from "./RiderPortalClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "🛵 [Rider] ระบบพนักงานส่งของ",
  description: "ระบบรับงานและติดตามจัดส่งสินค้าสำหรับไรเดอร์ ร้านเกษรบ้านป่าเวียง",
};

export default async function RiderPage() {
  const rawRiders = await prisma.rider.findMany({
    orderBy: { createdAt: "asc" },
  });

  const rawOrders = await prisma.order.findMany({
    where: {
      deliveryType: "DELIVERY",
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      user: {
        select: { id: true, name: true, phone: true, address: true },
      },
    },
  });

  const riders = rawRiders.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    vehicle: r.vehicle,
    status: r.status,
    rating: r.rating,
    completedJobs: r.completedJobs,
  }));

  const orders = rawOrders.map((o) => ({
    id: o.id,
    customerName: o.customerName || o.user?.name || "ลูกค้าทั่วไป",
    customerPhone: o.customerPhone || o.user?.phone || "-",
    shippingAddress: o.shippingAddress || o.user?.address || "ไม่ระบุที่อยู่",
    totalAmount: o.totalAmount,
    status: o.status,
    deliveryStatus: o.deliveryStatus || "PENDING",
    paymentMethod: o.paymentMethod || "CASH",
    riderId: o.riderId,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    items: o.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      quantity: it.quantity,
      price: it.price,
    })),
  }));

  return <RiderPortalClient riders={riders} orders={orders} />;
}
