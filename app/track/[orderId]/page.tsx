import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import TrackClient from "../TrackClient";

export const metadata = {
  title: "รายละเอียดการติดตามสินค้า",
  description: "ติดตามสถานะการจัดส่งพัสดุแบบเรียลไทม์ onlineshop",
};

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function TrackOrderIdPage({ params }: Props) {
  const { orderId } = await params;

  let initialOrder = null;
  if (orderId) {
    const rawOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        rider: true,
        user: true,
      },
    });

    if (rawOrder) {
      initialOrder = {
        id: rawOrder.id,
        totalAmount: rawOrder.totalAmount,
        status: rawOrder.status,
        deliveryType: rawOrder.deliveryType || "DELIVERY",
        customerName: rawOrder.customerName || rawOrder.user?.name || "ลูกค้าทั่วไป",
        customerPhone: rawOrder.customerPhone || rawOrder.user?.phone || "-",
        shippingAddress: rawOrder.shippingAddress || rawOrder.user?.address || "ไม่ระบุที่อยู่",
        latitude: rawOrder.latitude || null,
        longitude: rawOrder.longitude || null,
        paymentMethod: rawOrder.paymentMethod || "CASH",
        pickupTime: rawOrder.pickupTime || null,
        notes: rawOrder.notes || null,
        slipImage: rawOrder.slipImage || null,
        deliveryStatus: rawOrder.deliveryStatus || "PENDING",
        deliveredAt: rawOrder.deliveredAt ? rawOrder.deliveredAt.toISOString() : null,
        paymentVerifiedAt: rawOrder.paymentVerifiedAt ? rawOrder.paymentVerifiedAt.toISOString() : null,
        customerReceivedStatus: rawOrder.customerReceivedStatus || null,
        customerConfirmedAt: rawOrder.customerConfirmedAt ? rawOrder.customerConfirmedAt.toISOString() : null,
        customerFeedback: rawOrder.customerFeedback || null,
        createdAt: rawOrder.createdAt ? rawOrder.createdAt.toISOString() : new Date().toISOString(),
        items: rawOrder.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
        })),
        rider: rawOrder.rider
          ? {
              id: rawOrder.rider.id,
              name: rawOrder.rider.name,
              phone: rawOrder.rider.phone,
              vehicle: rawOrder.rider.vehicle,
              rating: rawOrder.rider.rating,
              completedJobs: rawOrder.rider.completedJobs,
              image: rawOrder.rider.image,
              status: rawOrder.rider.status,
            }
          : null,
      };
    }
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8 text-gray-500 text-sm">
          กำลังโหลดข้อมูลสถานะจัดส่ง...
        </div>
      }
    >
      <TrackClient initialQuery={orderId} initialOrder={initialOrder} />
    </Suspense>
  );
}
