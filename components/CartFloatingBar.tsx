"use client";

import { useState } from "react";
import { useCartStore, calculateItemDiscount } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthModalStore } from "@/store/useAuthModalStore";
import { 
  ShoppingBag, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  Package,
  Sparkles
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function CartFloatingBar() {
  const { items, addItem, decreaseItem, removeItem, clearCart, getTotal, getDiscount } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthModalStore((state) => state.openAuthModal);
  const router = useRouter();
  const pathname = usePathname();

  // State to toggle seeing what items are in the cart
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Requirement: "ถ้าไปหน้าอื่นแล้วจะไม่แสดง" และ "ถ้าไม่ได้ล็อคอิน ไม่สามารถซื้อสินค้าหรือเพิ่มลงตะกร้าได้"
  if (!user || pathname !== "/" || items.length === 0) {
    return null;
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getTotal();
  const totalDiscount = getDiscount();

  return (
    <div className="fixed bottom-16 md:bottom-4 left-0 right-0 w-full z-40 px-3 md:px-4 pointer-events-none pb-2 md:pb-0">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.18)] pointer-events-auto border-2 border-[#b90000] overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Top Decorative / Toggle Handle Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-[#b90000] to-red-700 text-white px-4 py-2 flex items-center justify-between cursor-pointer select-none text-xs hover:bg-red-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 animate-bounce" />
            <span className="font-extrabold text-sm">ตะกร้าสินค้าของคุณ ({totalItems} ชิ้น)</span>
            {totalDiscount > 0 && (
              <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 fill-amber-950" />
                ประหยัด ฿{totalDiscount.toLocaleString("th-TH")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-white/90">
            <span>{isExpanded ? "ย่อรายการสินค้า" : "แตะเพื่อดูสินค้า / เพิ่ม-ลด-ทิ้ง"}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Expandable Items List ("แสดงว่ามีสินค้าอะไรบ้าง เพิ่ม-ลด ทิ้ง") */}
        {isExpanded && (
          <div className="bg-gray-50/70 border-b border-gray-100 flex flex-col max-h-72 sm:max-h-80 overflow-hidden">
            {/* Action Bar inside expanded view */}
            <div className="px-4 py-2 bg-gray-100/80 border-b border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
              <span className="font-bold text-gray-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#b90000]" />
                รายการสินค้าในตะกร้า ({items.length} ชนิด):
              </span>
              <button
                type="button"
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                title="ลบสินค้าทั้งหมดออกจากตะกร้า"
              >
                <Trash2 className="w-3 h-3" />
                <span>ทิ้งทั้งหมด</span>
              </button>
            </div>

            {/* Scrollable list of items */}
            <div className="overflow-y-auto divide-y divide-gray-100 p-2 sm:p-3 space-y-2">
              {items.map((item) => {
                const itemDiscount = calculateItemDiscount(item);
                const itemTotal = item.price * item.quantity - itemDiscount;

                return (
                  <div
                    key={item.id}
                    className="bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 flex items-center gap-3 shadow-2xs hover:border-red-200 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {item.name}
                        </h4>
                        {item.promotion?.badgeText && (
                          <span className="bg-red-50 text-[#b90000] border border-red-200 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            {item.promotion.badgeText}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="text-gray-500 font-medium">
                          ฿{item.price.toLocaleString("th-TH")} / ชิ้น
                        </span>
                        <span className="font-extrabold text-[#b90000]">
                          รวม ฿{itemTotal.toLocaleString("th-TH")}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls (เพิ่ม-ลด) & Trash Button (ทิ้ง) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quantity Stepper (เพิ่ม-ลด) */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => decreaseItem(item.id)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold transition-all active:scale-90 cursor-pointer shadow-2xs"
                          title="ลดจำนวน"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-7 text-center font-black text-xs sm:text-sm text-gray-900">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => addItem(item, 1)}
                          className="w-7 h-7 rounded-lg bg-[#b90000] hover:bg-red-700 text-white flex items-center justify-center font-bold transition-all active:scale-90 cursor-pointer shadow-2xs"
                          title="เพิ่มจำนวน"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Trash / Delete Button (ทิ้ง) */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                        title="ทิ้งสินค้านี้ออกจากตะกร้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary & Checkout Action Bar (Always Visible) */}
        <div className="p-3 sm:p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Price & Summary Info */}
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  รวม {totalItems} รายการ
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  {isExpanded ? "ย่อรายการ" : "ดูสินค้าทั้งหมด"}
                </button>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-[#b90000]">
                  ฿{totalPrice.toLocaleString("th-TH")}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">(ราคารวมสุทธิ)</span>
              </div>
            </div>
          </div>

          {/* Action Button: Buy Now */}
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal({
                    message: "กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อสินค้า",
                    redirectUrl: "/checkout",
                  });
                  return;
                }
                router.push("/checkout");
              }}
              className="w-full sm:w-48 bg-[#b90000] hover:bg-red-800 text-white font-extrabold text-base sm:text-lg py-2.5 sm:py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ซื้อตอนนี้</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
