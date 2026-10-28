import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductManagerClient } from "./ProductManagerClient";

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  let initialTab: "add" | "list" | "lowstock" = "list";
  if (params?.tab === "add") initialTab = "add";
  if (params?.tab === "lowstock") initialTab = "lowstock";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const units = await prisma.unit.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลสินค้า...</div>}>
      <ProductManagerClient products={products} categories={categories} units={units} initialTab={initialTab} />
    </Suspense>
  );
}
