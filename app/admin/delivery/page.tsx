import { prisma } from "@/lib/prisma";
import { getDeliverySetting } from "@/lib/delivery";
import { DeliveryManagerClient } from "./DeliveryManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  // 1. Fetch all riders
  const rawRiders = await prisma.rider.findMany({
    orderBy: { createdAt: "asc" },
  });

  // 2. Fetch delivery settings
  const deliverySetting = await getDeliverySetting();

  // 3. Fetch delivery orders (where deliveryType is DELIVERY)
  const rawOrders = await prisma.order.findMany({
    where: {
      deliveryType: "DELIVERY",
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      rider: true,
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
    createdAt: r.createdAt.toISOString(),
  }));

  const orders = rawOrders.map((o) => ({
    id: o.id,
    customerName: o.customerName || o.user?.name || "ลูกค้าทั่วไป",
    customerPhone: o.customerPhone || o.user?.phone || "-",
    shippingAddress: o.shippingAddress || o.user?.address || "ไม่ระบุที่อยู่",
    latitude: o.latitude,
    longitude: o.longitude,
    distanceKm: o.distanceKm,
    subdistrict: o.subdistrict,
    totalAmount: o.totalAmount,
    status: o.status,
    deliveryStatus: o.deliveryStatus || "PENDING",
    paymentMethod: o.paymentMethod || "CASH",
    riderId: o.riderId,
    riderName: o.rider?.name || null,
    riderPhone: o.rider?.phone || null,
    notes: o.notes,
    customerReceivedStatus: o.customerReceivedStatus,
    customerConfirmedAt: o.customerConfirmedAt ? o.customerConfirmedAt.toISOString() : null,
    customerFeedback: o.customerFeedback,
    createdAt: o.createdAt.toISOString(),
    deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    items: o.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      quantity: it.quantity,
      price: it.price,
    })),
  }));

  return (
    <DeliveryManagerClient
      initialRiders={riders}
      initialOrders={orders}
      initialSetting={deliverySetting}
    />
  );
}
