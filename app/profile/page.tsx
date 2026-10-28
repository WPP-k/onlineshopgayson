import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./ProfileClient";
import { Header } from "@/components/Header";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-mvp";

export const dynamic = "force-dynamic";

import { Suspense } from "react";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login?redirect=/profile");
  }

  let decoded: { id: string; role?: string; username: string };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    redirect("/login?redirect=/profile");
  }

  let userProfile = null;
  let userOrders: any[] = [];

  if (decoded.role === "ADMIN") {
    let admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin && decoded.username) {
      admin = await prisma.admin.findUnique({
        where: { username: decoded.username },
      });
    }

    if (!admin) {
      admin = await prisma.admin.findFirst();
    }

    if (!admin) {
      redirect("/login?redirect=/profile");
    }

    let adminPhone = (admin as any).phone || null;
    let adminAddress = (admin as any).address || null;

    if (!adminPhone && !adminAddress) {
      try {
        const rawAdmin = (await prisma.$queryRawUnsafe(
          `SELECT phone, address FROM Admin WHERE id = ? LIMIT 1`,
          decoded.id
        )) as any[];
        if (rawAdmin && rawAdmin[0]) {
          adminPhone = rawAdmin[0].phone || null;
          adminAddress = rawAdmin[0].address || null;
        }
      } catch {}
    }

    // Admin orders can be linked by userId, customerPhone, or customerName
    const orderConditions: any[] = [];
    if (admin.id) orderConditions.push({ userId: admin.id });
    if (adminPhone) orderConditions.push({ customerPhone: adminPhone });
    if (admin.name) orderConditions.push({ customerName: admin.name });
    if (admin.username) orderConditions.push({ customerName: admin.username });
    orderConditions.push({ customerName: "Administrator" });

    const orders = await prisma.order.findMany({
      where: {
        OR: orderConditions,
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    userProfile = {
      id: admin.id,
      username: admin.username,
      name: admin.name || "Administrator",
      phone: adminPhone,
      address: adminAddress,
      role: "ADMIN",
      createdAt: new Date(admin.createdAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    userOrders = orders;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      redirect("/login?redirect=/profile");
    }

    userProfile = {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      phone: user.phone || null,
      address: user.address || null,
      role: user.role || "USER",
      createdAt: new Date(user.createdAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    userOrders = user.orders;
  }

  const allProductIds = Array.from(new Set(userOrders.flatMap((o) => o.items.map((it: any) => it.productId))));
  const productMap = new Map<string, { image: string; stock: number }>();
  if (allProductIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, image: true, stock: true },
    });
    products.forEach((p) => productMap.set(p.id, { image: p.image || "🛒", stock: p.stock }));
  }

  const formattedOrders = userOrders.map((o) => ({
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
    slipImage: o.slipImage,
    slipUploadedAt: o.slipUploadedAt ? o.slipUploadedAt.toISOString() : null,
    paymentVerifiedAt: o.paymentVerifiedAt ? o.paymentVerifiedAt.toISOString() : null,
    paymentRejectReason: o.paymentRejectReason || null,
    createdAt: new Date(o.createdAt).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: o.items.map((it: any) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      price: it.price,
      image: productMap.get(it.productId)?.image || "🛒",
      stock: productMap.get(it.productId)?.stock ?? 99,
    })),
  }));

  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>}>
        <ProfileClient user={userProfile} orders={formattedOrders} />
      </Suspense>
    </>
  );
}
