"use client";

import { Header } from "@/components/Header";
import { useCartStore, calculateItemDiscount } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthModalStore } from "@/store/useAuthModalStore";
import { Trash2, Minus, Plus, AlertCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthModalStore((state) => state.openAuthModal);
  const { items, addItem, decreaseItem, updateQuantity, removeItem, getSubtotal, getDiscount, getTotal, clearCart } = useCartStore();

  return (
    <div className="flex flex-col w-full bg-[#f5f5f5] min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full pb-24">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ตะกร้าสินค้า</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded p-12 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-6xl">🛒</span>
            </div>
            <h2 className="text-xl font-medium text-gray-600 mb-4">ตะกร้าของคุณยังว่างเปล่า</h2>
            <Link 
              href="/" 
              className="bg-[#b90000] text-white px-8 py-3 rounded hover:bg-red-800 transition-colors font-medium"
            >
              ไปช้อปปิ้งกันเลย
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cart Items List */}
            <div className="flex-grow">
              <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b text-gray-500 font-medium text-sm">
                  <div className="col-span-6">สินค้า</div>
                  <div className="col-span-2 text-center">ราคาต่อชิ้น</div>
                  <div className="col-span-2 text-center">จำนวน</div>
                  <div className="col-span-1 text-center">ราคารวม</div>
                  <div className="col-span-1 text-center">แอคชั่น</div>
                </div>
                
                {items.map((item) => {
                  const itemDiscount = calculateItemDiscount(item);
                  const itemNetTotal = item.price * item.quantity - itemDiscount;

                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b items-center hover:bg-gray-50 transition-colors">
                      {/* Product Info */}
                      <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center text-4xl shrink-0 overflow-hidden relative">
                          {item.image?.startsWith("http") || item.image?.startsWith("data:image") || item.image?.startsWith("/") ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
                              }}
                            />
                          ) : (
                            item.image
                          )}
                        </div>
                        <div className="flex flex-col">
                          <Link href={`/products/${item.id}`} className="text-gray-800 font-medium hover:text-[#b90000] line-clamp-2">
                            {item.name}
                          </Link>
                          
                          {/* Promotion Badges and Tips in Cart */}
                          {item.promotion && item.promotion.isActive !== false && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {item.promotion.type === "BUY_1_GET_1" && (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                  🔥 {item.promotion.badgeText || "ซื้อ 1 แถม 1"}
                                </span>
                              )}
                              {item.promotion.type === "BUY_2_GET_1" && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                  🎁 {item.promotion.badgeText || "ซื้อ 2 แถม 1"}
                                </span>
                              )}
                              {item.promotion.type === "DISCOUNT" && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                  🏷️ {item.promotion.badgeText || "ลดราคาพิเศษ"}
                                </span>
                              )}

                              {item.promotion.type === "BUY_1_GET_1" && (
                                item.quantity >= 2 ? (
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    🎉 แถมฟรี x{Math.floor(item.quantity / 2)} ชิ้น (ประหยัด ฿{(Math.floor(item.quantity / 2) * item.price).toLocaleString('th-TH')})
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    💡 สั่งเพิ่มอีก 1 ชิ้น เพื่อรับฟรี 1 ชิ้น!
                                  </span>
                                )
                              )}

                              {item.promotion.type === "BUY_2_GET_1" && (
                                item.quantity >= 3 ? (
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    🎉 แถมฟรี x{Math.floor(item.quantity / 3)} ชิ้น (ประหยัด ฿{(Math.floor(item.quantity / 3) * item.price).toLocaleString('th-TH')})
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    💡 สั่งเพิ่มอีก {3 - (item.quantity % 3)} ชิ้น เพื่อรับฟรี 1 ชิ้น!
                                  </span>
                                )
                              )}

                              {item.promotion.type === "DISCOUNT" && item.promotion.discountPrice && (
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  (ลดเหลือ ฿{item.promotion.discountPrice.toLocaleString('th-TH')}/ชิ้น ประหยัด ฿{((item.price - item.promotion.discountPrice) * item.quantity).toLocaleString('th-TH')})
                                </span>
                              )}
                            </div>
                          )}

                          <span className="text-xs text-gray-500 mt-1">สินค้าคุณภาพจากร้านเกษรบ้านป่าเวียง</span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="col-span-1 md:col-span-2 text-center md:text-gray-600 font-medium hidden md:block">
                        {item.promotion?.type === "DISCOUNT" && item.promotion.discountPrice ? (
                          <div>
                            <span className="text-red-600 font-bold">฿{item.promotion.discountPrice.toLocaleString('th-TH')}</span>
                            <span className="text-xs text-gray-400 line-through block">฿{item.price.toLocaleString('th-TH')}</span>
                          </div>
                        ) : (
                          <span>฿{item.price.toLocaleString('th-TH')}</span>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center items-center">
                        <div className="flex items-center border rounded">
                          <button 
                            onClick={() => decreaseItem(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 h-8 text-center text-gray-800 border-x outline-none focus:ring-1 focus:ring-[#b90000]"
                            min="1"
                          />
                          <button 
                            onClick={() => addItem(item)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Total Price */}
                      <div className="col-span-1 md:col-span-1 flex justify-between md:block md:text-center font-bold text-[#b90000]">
                         <span className="md:hidden text-gray-500 font-medium">รวม:</span>
                         <div>
                           <span>฿{itemNetTotal.toLocaleString('th-TH')}</span>
                           {itemDiscount > 0 && (
                             <span className="text-[10px] text-emerald-600 block font-normal">
                               (ลด -฿{itemDiscount.toLocaleString('th-TH')})
                             </span>
                           )}
                         </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                          title="ลบสินค้า"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <Link href="/" className="text-gray-600 hover:text-[#b90000] font-medium text-sm flex items-center gap-1">
                  &lt; ซื้อสินค้าต่อ
                </Link>
                <button 
                  onClick={clearCart}
                  className="text-gray-500 hover:text-red-600 text-sm font-medium underline"
                >
                  ล้างตะกร้าทั้งหมด
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[350px] shrink-0">
               <div className="bg-white rounded shadow-sm p-6 sticky top-24">
                 <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">สรุปการสั่งซื้อ</h2>
                 
                 <div className="flex justify-between items-center mb-3 text-gray-600">
                    <span>มูลค่าสินค้า ({items.reduce((acc, item) => acc + item.quantity, 0)} ชิ้น)</span>
                    <span>฿{getSubtotal().toLocaleString('th-TH')}</span>
                 </div>
                 
                 <div className="flex justify-between items-center mb-4 text-gray-600">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                      🏷️ ส่วนลดโปรโมชัน
                    </span>
                    <span className={`font-bold ${getDiscount() > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                      {getDiscount() > 0 ? `- ฿${getDiscount().toLocaleString('th-TH')}` : "฿0"}
                    </span>
                 </div>

                 <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-end">
                       <span className="font-bold text-gray-800">ยอดรวมสุทธิ</span>
                       <span className="text-2xl font-bold text-[#b90000]">฿{getTotal().toLocaleString('th-TH')}</span>
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">รวมภาษีมูลค่าเพิ่มแล้ว</p>
                 </div>

                  {!user && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อสินค้า</span>
                    </div>
                  )}

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
                    className="w-full flex items-center justify-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] text-center cursor-pointer"
                  >
                    {!user ? "เข้าสู่ระบบเพื่อสั่งซื้อสินค้า" : "ดำเนินการสั่งซื้อสินค้า"}
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
