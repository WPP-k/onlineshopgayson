import { Suspense } from "react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import TrackClient from "./TrackClient";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-mvp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ติดตามสถานะการจัดส่งสินค้า | ร้านเกษรบ้านป่าเวียง",
  description: "ระบบติดตามสถานะการจัดส่งพัสดุและสินค้าแบบเรียลไทม์ ร้านเกษรบ้านป่าเวียง",
};

function serializeOrder(o: any) {
  if (!o) return null;
  return {
    id: o.id,
    totalAmount: o.totalAmount,
    status: o.status,
    deliveryType: o.deliveryType || "DELIVERY",
    customerName: o.customerName || o.user?.name || "ลูกค้าทั่วไป",
    customerPhone: o.customerPhone || o.user?.phone || "-",
    shippingAddress: o.shippingAddress || o.user?.address || "ไม่ระบุที่อยู่",
    latitude: o.latitude || null,
    longitude: o.longitude || null,
    paymentMethod: o.paymentMethod || "CASH",
    pickupTime: o.pickupTime || null,
    notes: o.notes || null,
    slipImage: o.slipImage || null,
    deliveryStatus: o.deliveryStatus || "PENDING",
    deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    paymentVerifiedAt: o.paymentVerifiedAt ? o.paymentVerifiedAt.toISOString() : null,
    customerReceivedStatus: o.customerReceivedStatus || null,
    customerConfirmedAt: o.customerConfirmedAt ? o.customerConfirmedAt.toISOString() : null,
    customerFeedback: o.customerFeedback || null,
    createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
    items: (o.items || []).map((it: any) => ({
      id: it.id,
      productName: it.productName,
      quantity: it.quantity,
      price: it.price,
    })),
    rider: o.rider
      ? {
          id: o.rider.id,
          name: o.rider.name,
          phone: o.rider.phone,
          vehicle: o.rider.vehicle,
          rating: o.rider.rating,
          completedJobs: o.rider.completedJobs,
          image: o.rider.image,
          status: o.rider.status,
        }
      : null,
  };
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryParam =
    typeof resolvedParams.orderId === "string"
      ? resolvedParams.orderId
      : typeof resolvedParams.phone === "string"
      ? resolvedParams.phone
      : typeof resolvedParams.q === "string"
      ? resolvedParams.q
      : "";

  let initialLatestOrder: any = null;
  let recentOrders: any[] = [];
  let userDisplayName: string | null = null;

  // 1. If explicit query parameter is provided
  if (queryParam) {
    const rawOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id: queryParam },
          { id: { contains: queryParam } },
          { customerPhone: { contains: queryParam } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        rider: true,
        user: true,
      },
    });

    if (rawOrder) {
      initialLatestOrder = serializeOrder(rawOrder);
      recentOrders = [initialLatestOrder];
    }
  } else {
    // 2. No query parameter provided (Direct visit to /track)
    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          role?: string;
          username: string;
        };

        const orderConditions: any[] = [];

        if (decoded.role === "ADMIN") {
          let admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
          if (!admin && decoded.username) {
            admin = await prisma.admin.findUnique({ where: { username: decoded.username } });
          }
          if (!admin) {
            admin = await prisma.admin.findFirst();
          }

          if (admin) {
            userDisplayName = admin.name || "Administrator";
            const adminPhone = (admin as any).phone || null;
            if (admin.id) orderConditions.push({ userId: admin.id });
            if (adminPhone) orderConditions.push({ customerPhone: adminPhone });
            if (admin.name) orderConditions.push({ customerName: admin.name });
            if (admin.username) orderConditions.push({ customerName: admin.username });
            orderConditions.push({ customerName: "Administrator" });
          }
        } else {
          const user = await prisma.user.findUnique({ where: { id: decoded.id } });
          if (user) {
            userDisplayName = user.name || user.username;
            orderConditions.push({ userId: user.id });
            if (user.phone) orderConditions.push({ customerPhone: user.phone });
            if (user.name) orderConditions.push({ customerName: user.name });
          }
        }

        if (orderConditions.length > 0) {
          const rawOrders = await prisma.order.findMany({
            where: {
              OR: orderConditions,
            },
            include: {
              items: true,
              rider: true,
              user: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          });

          if (rawOrders.length > 0) {
            initialLatestOrder = serializeOrder(rawOrders[0]);
            recentOrders = rawOrders.map(serializeOrder);
          }
        }
      } catch (err) {
        // Invalid or expired token
      }
    }

    // 3. Fallback: If still no user orders found, get the most recent order in system
    if (!initialLatestOrder) {
      const fallbackOrder = await prisma.order.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          rider: true,
          user: true,
        },
      });

      if (fallbackOrder) {
        initialLatestOrder = serializeOrder(fallbackOrder);
        recentOrders = [initialLatestOrder];
      }
    }
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8 text-gray-500 text-sm">
          กำลังโหลดระบบติดตามพัสดุ...
        </div>
      }
    >
      <TrackClient
        initialQuery={queryParam}
        initialOrder={initialLatestOrder}
        recentOrders={recentOrders}
        userDisplayName={userDisplayName}
      />
    </Suspense>
  );
}
