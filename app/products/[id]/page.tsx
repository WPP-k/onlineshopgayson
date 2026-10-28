import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { ProductDetailClient } from "./ProductDetailClient";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      promotion: true,
    },
  });

  if (!product) {
    return (
      <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 text-[#b90000] rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบสินค้าที่คุณต้องการ</h1>
            <p className="text-gray-500 text-sm mb-6">
              สินค้านี้อาจถูกลบหรือไม่มีอยู่ในระบบร้านค้าแล้ว
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าร้านค้า</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch related products (same category or newest, up to 6 products)
  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      promotion: true,
    },
  });

  const serializedProduct = {
    ...product,
    createdAt: product.createdAt.toISOString(),
  };

  const serializedRelated = relatedProducts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
      <Header />
      <main className="w-full flex-grow">
        <ProductDetailClient
          product={serializedProduct}
          relatedProducts={serializedRelated}
        />
      </main>
    </div>
  );
}
