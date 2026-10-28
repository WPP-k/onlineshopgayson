"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore, Product } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthModalStore } from "@/store/useAuthModalStore";
import { useState } from "react";
import moment from "moment";
import "moment/locale/th";

export function ProductCard({ product, createdAt }: { product: Product; createdAt: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthModalStore((state) => state.openAuthModal);
  const [added, setAdded] = useState(false);

  // Set moment locale to Thai
  moment.locale('th');

  const promo = product.promotion && product.promotion.isActive !== false ? product.promotion : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal({
        message: `กรุณาเข้าสู่ระบบก่อนเพิ่ม "${product.name}" ลงในตะกร้าสินค้า`,
        redirectUrl: `/products/${product.id}`,
      });
      return;
    }
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group relative">
      {/* Promotion Badge */}
      {promo && (
        <>
          {promo.type === "BUY_1_GET_1" && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <span>🔥</span>
              <span>{promo.badgeText || "ซื้อ 1 แถม 1"}</span>
            </div>
          )}
          {promo.type === "BUY_2_GET_1" && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <span>🎁</span>
              <span>{promo.badgeText || "ซื้อ 2 แถม 1"}</span>
            </div>
          )}
          {promo.type === "DISCOUNT" && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              <span>🏷️</span>
              <span>{promo.badgeText || "ลดพิเศษ"}</span>
            </div>
          )}
        </>
      )}

      <Link href={`/products/${product.id}`} className="block relative h-48 w-full bg-gray-50 flex items-center justify-center border-b border-gray-100 p-4 overflow-hidden">
        {product.image?.startsWith('http') || product.image?.startsWith('data:image') || product.image?.startsWith('/') ? (
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
            }}
          />
        ) : (
          <div className="text-gray-400 font-medium text-4xl select-none group-hover:scale-105 transition-transform duration-300">
            {product.image || "📦"}
          </div>
        )}
      </Link>
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2 hover:text-[#b90000] transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-1">
          เพิ่มเมื่อ {moment(createdAt).fromNow()}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-2">
          {promo?.type === "DISCOUNT" && promo.discountPrice ? (
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold text-[#b90000]">
                  ฿{promo.discountPrice.toLocaleString('th-TH')}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ฿{product.price.toLocaleString('th-TH')}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">
                ประหยัด ฿{(product.price - promo.discountPrice).toLocaleString('th-TH')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold text-gray-900">
                ฿{product.price.toLocaleString('th-TH')}
              </span>
              {promo && (
                <span className="text-[10px] text-red-600 font-bold">
                  {promo.type === "BUY_1_GET_1" ? "ชิ้นที่ 2 ฟรี ฿0" : promo.type === "BUY_2_GET_1" ? "ชิ้นที่ 3 ฟรี ฿0" : ""}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex items-center justify-center text-white rounded-full p-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-90 cursor-pointer ${
              added ? "bg-emerald-600 scale-105" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm"
            }`}
            title="เพิ่มลงรถเข็น"
            aria-label="Add to cart"
          >
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
