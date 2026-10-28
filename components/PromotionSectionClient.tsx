"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Tag, Sparkles, Flame, Gift, Percent } from "lucide-react";

interface ProductWithPromo {
  id: string;
  name: string;
  price: number;
  image: string;
  createdAt: string | Date;
  promotion?: {
    id?: string;
    type: string;
    discountPrice?: number | null;
    discountPercent?: number | null;
    badgeText?: string | null;
    name?: string | null;
    isActive?: boolean;
  } | null;
}

export function PromotionSectionClient({ products }: { products: ProductWithPromo[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  if (!products || products.length === 0) return null;

  const buy1get1Count = products.filter(p => p.promotion?.type === "BUY_1_GET_1").length;
  const buy2get1Count = products.filter(p => p.promotion?.type === "BUY_2_GET_1").length;
  const discountCount = products.filter(p => p.promotion?.type === "DISCOUNT").length;

  const filteredProducts = products.filter((p) => {
    if (activeFilter === "ALL") return true;
    return p.promotion?.type === activeFilter;
  });

  return (
    <div id="promotions" className="mt-8 scroll-mt-24 space-y-4">
      {/* Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-red-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
            🏷️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                สินค้าโปรโมชัน & ลดราคาพิเศษ
              </h2>
              <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                {products.length} รายการ
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              เลือกซื้อสินค้าราคาพิเศษ ทั้งโปรโมชัน 1 แถม 1, 2 แถม 1 และลดราคาสินค้าโดนใจ
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === "ALL"
                ? "bg-[#b90000] text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ทั้งหมด ({products.length})</span>
          </button>

          {buy1get1Count > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("BUY_1_GET_1")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "BUY_1_GET_1"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>1 แถม 1 ({buy1get1Count})</span>
            </button>
          )}

          {buy2get1Count > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("BUY_2_GET_1")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "BUY_2_GET_1"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>2 แถม 1 ({buy2get1Count})</span>
            </button>
          )}

          {discountCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("DISCOUNT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "DISCOUNT"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>ลดราคาพิเศษ ({discountCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 bg-gradient-to-br from-red-50/70 via-amber-50/40 to-white p-4 rounded-3xl border-2 border-red-200/80 shadow-sm ring-4 ring-red-100/40">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image || '🛒',
              promotion: product.promotion,
            }}
            createdAt={typeof product.createdAt === 'string' ? product.createdAt : product.createdAt.toISOString()}
          />
        ))}
      </div>
    </div>
  );
}
