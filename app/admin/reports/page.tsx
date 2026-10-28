import { prisma } from "@/lib/prisma";
import { ReportClient } from "./ReportClient";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { sku: 'asc' }
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const units = await prisma.unit.findMany({
    orderBy: { name: 'asc' }
  });

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "SHIPPED", "DELIVERED"] }
    },
    include: {
      items: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return <ReportClient products={products} categories={categories} units={units} orders={orders} />;
}
