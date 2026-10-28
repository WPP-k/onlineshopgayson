import { Header } from "@/components/Header";
import { PromotionSectionClient } from "@/components/PromotionSectionClient";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Sparkles, Tag, Flame } from "lucide-react";

export const metadata = {
  title: "สินค้าโปรโมชัน & ลดราคาพิเศษ | ร้านเกษรบ้านป่าเวียง",
  description: "รวมรายการสินค้าโปรโมชัน ซื้อ 1 แถม 1, ซื้อ 2 แถม 1 และลดราคาพิเศษ จากร้านเกษรบ้านป่าเวียง",
};

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const products = await prisma.product.findMany({
    where: {
      promotion: {
        isActive: true,
      },
    },
    include: {
      promotion: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#b90000] bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <span className="text-xs text-gray-400">
            สินค้าโปรโมชันทั้งหมด {products.length} รายการ
          </span>
        </div>

        {/* Hero Banner */}
        <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                รวมสินค้าโปรโมชัน & ลดราคาพิเศษ
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-white/90">
              ซื้อ 1 แถม 1, ซื้อ 2 แถม 1 และลดราคาพิเศษ คุ้มค่าที่สุดจากร้านเกษรบ้านป่าเวียง
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>อัปเดตโปรโมชันล่าสุดทุกวัน</span>
          </div>
        </div>

        {/* Promotion Section Client */}
        {products.length > 0 ? (
          <PromotionSectionClient products={products} />
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 space-y-3 border border-gray-200">
            <Tag className="w-12 h-12 mx-auto text-gray-300" />
            <p className="font-bold text-gray-600">ยังไม่มีสินค้าจัดโปรโมชันในขณะนี้</p>
            <p className="text-xs">โปรดติดตามโปรโมชันใหม่ๆ จากทางร้านเร็วๆ นี้</p>
          </div>
        )}
      </main>
    </div>
  );
}
