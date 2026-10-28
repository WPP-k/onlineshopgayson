"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Plus, Minus, Check, ArrowLeft, ShieldCheck, Truck, RefreshCw, Barcode as BarcodeIcon, Tag, PackageCheck, AlertCircle, LogIn } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthModalStore } from "@/store/useAuthModalStore";
import { ProductCard } from "@/components/ProductCard";

interface Category {
  id: string;
  name: string;
}

interface ProductType {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  image: string;
  stock: number;
  minStock: number;
  unit: string | null;
  category: Category | null;
  createdAt: string;
  promotion?: {
    id: string;
    name?: string | null;
    type: string;
    discountPrice?: number | null;
    badgeText?: string | null;
    description?: string | null;
    isActive?: boolean;
  } | null;
}

interface Props {
  product: ProductType;
  relatedProducts: ProductType[];
}

export function ProductDetailClient({ product, relatedProducts }: Props) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const openAuthModal = useAuthModalStore((state) => state.openAuthModal);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const maxStock = Math.max(product.stock, 0);
  const isOutOfStock = product.stock <= 0;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (val > maxStock) {
      setQuantity(maxStock);
    } else {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!user) {
      openAuthModal({
        message: `กรุณาเข้าสู่ระบบก่อนเพิ่ม "${product.name}" ลงในตะกร้าสินค้า`,
        redirectUrl: `/products/${product.id}`,
      });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      promotion: product.promotion,
    }, quantity);

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (!user) {
      openAuthModal({
        message: `กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า "${product.name}"`,
        redirectUrl: `/products/${product.id}`,
      });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      promotion: product.promotion,
    }, quantity);
    router.push("/cart");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#b90000] transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>หน้าหลัก</span>
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <span className="text-gray-600 font-medium">{product.category.name}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-semibold truncate max-w-xs sm:max-w-md">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-10 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left: Product Image */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full aspect-square max-w-md bg-gray-50 rounded-2xl border border-gray-100 p-6 flex items-center justify-center relative overflow-hidden group shadow-inner">
              {product.image?.startsWith("http") || product.image?.startsWith("data:image") || product.image?.startsWith("/") ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
                  }}
                />
              ) : (
                <div className="text-8xl select-none">{product.image || "📦"}</div>
              )}

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.promotion && product.promotion.isActive !== false && (
                  <>
                    {product.promotion.type === "BUY_1_GET_1" && (
                      <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        🔥 {product.promotion.badgeText || "ซื้อ 1 แถม 1"}
                      </span>
                    )}
                    {product.promotion.type === "BUY_2_GET_1" && (
                      <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        🎁 {product.promotion.badgeText || "ซื้อ 2 แถม 1"}
                      </span>
                    )}
                    {product.promotion.type === "DISCOUNT" && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        🏷️ {product.promotion.badgeText || "ลดพิเศษ"}
                      </span>
                    )}
                  </>
                )}
                {product.category && (
                  <span className="bg-white/95 backdrop-blur-xs text-[#b90000] border border-red-100 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    {product.category.name}
                  </span>
                )}
                {isOutOfStock ? (
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    สินค้าหมด
                  </span>
                ) : (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    มีสินค้าพร้อมส่ง
                  </span>
                )}
              </div>
            </div>

            {/* Barcode & SKU info box */}
            {product.sku && (
              <div className="mt-4 w-full max-w-md bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <BarcodeIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">รหัสบาร์โค้ดสินค้า:</span>
                </div>
                <span className="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded border border-gray-200">
                  {product.sku}
                </span>
              </div>
            )}
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="border-b border-gray-100 pb-5 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#b90000] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                  ร้านเกษรบ้านป่าเวียง
                </span>
                {product.unit && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    หน่วย: {product.unit}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-3">
                {product.name}
              </h1>

              {/* Price Display */}
              {product.promotion && product.promotion.isActive !== false && product.promotion.type === "DISCOUNT" && product.promotion.discountPrice ? (
                <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-[#b90000] text-white px-2.5 py-0.5 rounded-full">
                      {product.promotion.badgeText || "ลดราคาพิเศษ"}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      ประหยัดทันที ฿{(product.price - product.promotion.discountPrice).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-gray-600">ราคาพิเศษ:</span>
                    <span className="text-3xl sm:text-4xl font-black text-[#b90000]">
                      ฿{product.promotion.discountPrice.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ฿{product.price.toLocaleString("th-TH")}
                    </span>
                    <span className="text-xs text-gray-500">
                      / {product.unit || "ชิ้น"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-gray-600">ราคาขาย:</span>
                    <span className="text-3xl sm:text-4xl font-black text-[#b90000]">
                      ฿{product.price.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-500">
                      / {product.unit || "ชิ้น"}
                    </span>
                  </div>
                  {product.promotion && product.promotion.isActive !== false && (
                    <div className="pt-1 text-xs font-bold text-red-600 flex items-center gap-1.5">
                      <span>✨ โปรโมชัน:</span>
                      <span>{product.promotion.description || product.promotion.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-3 mb-6 text-sm">
              <span className="text-gray-500 font-medium">สถานะสต็อก:</span>
              {isOutOfStock ? (
                <span className="flex items-center gap-1.5 text-red-600 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  สินค้าหมดชั่วคราว
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  พร้อมส่งคงเหลือ {product.stock} {product.unit || "ชิ้น"}
                </span>
              )}
            </div>

            {/* Quantity Selector (เพิ่มลดสินค้า) */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-800 mb-2.5">
                เลือกจำนวน ({product.unit || "ชิ้น"}):
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-gray-50 overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={isOutOfStock || quantity <= 1}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="ลดจำนวน"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={maxStock}
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={isOutOfStock}
                    className="w-14 h-11 text-center font-bold text-base text-gray-900 bg-white border-x-2 border-gray-200 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={isOutOfStock || quantity >= maxStock}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="เพิ่มจำนวน"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  ราคารวม: <span className="font-extrabold text-[#b90000] text-base">฿{(product.price * quantity).toLocaleString("th-TH")}</span>
                </div>
              </div>
            </div>

            {/* Notice if not logged in */}
            {!user && (
              <div className="mb-5 p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    สามารถดูสินค้าได้ตามปกติ แต่หากต้องการสั่งซื้อหรือเพิ่มลงตะกร้า กรุณาเข้าสู่ระบบ
                  </span>
                </div>
                <Link
                  href={`/login?redirect=/products/${product.id}`}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#b90000] hover:bg-red-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shrink-0 transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              </div>
            )}

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isAdded
                    ? "bg-emerald-600 text-white shadow-emerald-200 scale-[1.02]"
                    : "bg-red-50 text-[#b90000] hover:bg-red-100 border-2 border-[#b90000]/30 active:scale-95"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>เพิ่มลงรถเข็นแล้ว!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 text-[#b90000]" />
                    <span>เพิ่มลงรถเข็น</span>
                  </>
                )}
              </button>

              {/* Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base bg-[#b90000] hover:bg-red-800 text-white transition-all duration-200 shadow-md shadow-red-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>ซื้อสินค้าทันที</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100 text-center">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <ShieldCheck className="w-5 h-5 text-[#b90000]" />
                <span className="text-[11px] font-bold text-gray-800">สินค้าแท้ 100%</span>
                <span className="text-[10px] text-gray-400">คัดสรรคุณภาพ</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <Truck className="w-5 h-5 text-[#b90000]" />
                <span className="text-[11px] font-bold text-gray-800">จัดส่งรวดเร็ว</span>
                <span className="text-[10px] text-gray-400">ส่งถึงบ้าน / รับที่ร้าน</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <RefreshCw className="w-5 h-5 text-[#b90000]" />
                <span className="text-[11px] font-bold text-gray-800">ร้านเกษรบ้านป่าเวียง</span>
                <span className="text-[10px] text-gray-400">สินค้าคุณภาพ มาตรฐานชุมชน</span>
              </div>
            </div>

            {/* Product Description */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#b90000]" />
                รายละเอียดสินค้า
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {product.description ||
                  `สินค้าคุณภาพ ${product.name} จากร้านเกษรบ้านป่าเวียง สินค้าสดใหม่ มีมาตรฐาน บรรจุภัณฑ์สะอาด ปลอดภัย สามารถสั่งซื้อออนไลน์และเลือกจัดส่งถึงบ้าน หรือรับสินค้าที่หน้าร้านได้ทันที`}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                สินค้าอื่นๆ ที่คุณอาจสนใจ
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {product.category ? `สินค้าในหมวดหมู่ ${product.category.name}` : "สินค้าแนะนำสำหรับคุณ"}
              </p>
            </div>
            <Link
              href="/"
              className="text-xs sm:text-sm font-bold text-[#b90000] hover:underline"
            >
              ดูสินค้าทั้งหมด &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  image: p.image || "🛒",
                }}
                createdAt={p.createdAt}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
