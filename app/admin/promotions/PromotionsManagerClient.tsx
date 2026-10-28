"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Tag,
  Plus,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Gift,
  Flame,
  Percent,
  TrendingDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  unit: string | null;
  sku: string | null;
}

interface Promotion {
  id: string;
  productId: string;
  name: string;
  type: string; // "BUY_1_GET_1" | "BUY_2_GET_1" | "DISCOUNT"
  discountPrice: number | null;
  discountPercent: number | null;
  badgeText: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  product: Product;
}

interface Props {
  initialPromotions: Promotion[];
  allProducts: Product[];
}

export default function PromotionsManagerClient({
  initialPromotions,
  allProducts,
}: Props) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState<"BUY_1_GET_1" | "BUY_2_GET_1" | "DISCOUNT">("BUY_1_GET_1");
  const [discountPrice, setDiscountPrice] = useState<string>("");
  const [badgeText, setBadgeText] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Status & Alerts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Product search inside modal
  const [modalProductSearch, setModalProductSearch] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPromo(null);
    setSelectedProductId(allProducts[0]?.id || "");
    setPromoType("BUY_1_GET_1");
    setPromoName("ซื้อ 1 แถม 1 สุดคุ้ม");
    setBadgeText("ซื้อ 1 แถม 1");
    setDiscountPrice("");
    setDescription("");
    setIsActive(true);
    setFormError("");
    setModalProductSearch("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setSelectedProductId(promo.productId);
    setPromoType(promo.type as any);
    setPromoName(promo.name || "");
    setBadgeText(promo.badgeText || "");
    setDiscountPrice(promo.discountPrice ? promo.discountPrice.toString() : "");
    setDescription(promo.description || "");
    setIsActive(promo.isActive);
    setFormError("");
    setModalProductSearch("");
    setIsModalOpen(true);
  };

  // Handle promo type change to suggest smart names and badges
  const handlePromoTypeChange = (type: "BUY_1_GET_1" | "BUY_2_GET_1" | "DISCOUNT") => {
    setPromoType(type);
    const selectedProd = allProducts.find((p) => p.id === selectedProductId);

    if (type === "BUY_1_GET_1") {
      setPromoName("ซื้อ 1 แถม 1 สุดคุ้ม");
      setBadgeText("ซื้อ 1 แถม 1");
      setDescription(selectedProd ? `ซื้อ ${selectedProd.name} 1 ชิ้น แถมฟรีอีก 1 ชิ้นทันที` : "");
    } else if (type === "BUY_2_GET_1") {
      setPromoName("ซื้อ 2 แถม 1 สุดคุ้ม");
      setBadgeText("ซื้อ 2 แถม 1");
      setDescription(selectedProd ? `ซื้อ ${selectedProd.name} 2 ชิ้น แถมฟรีอีก 1 ชิ้นทันที` : "");
    } else if (type === "DISCOUNT") {
      setPromoName("สินค้าลดราคาพิเศษ");
      setBadgeText("ลดพิเศษ");
      if (selectedProd && !discountPrice) {
        // Suggest price: approx 15% discount
        const suggested = Math.max(1, Math.round(selectedProd.price * 0.85));
        setDiscountPrice(suggested.toString());
        setBadgeText(`ลด ฿${selectedProd.price - suggested}`);
        setDescription(`ลดราคาพิเศษเหลือ ฿${suggested} (ปกติ ฿${selectedProd.price})`);
      }
    }
  };

  // When selected product changes in modal
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = allProducts.find((p) => p.id === prodId);
    if (!prod) return;

    if (promoType === "DISCOUNT") {
      const suggested = Math.max(1, Math.round(prod.price * 0.85));
      setDiscountPrice(suggested.toString());
      setBadgeText(`ลด ฿${prod.price - suggested}`);
      setDescription(`ลดราคาพิเศษเหลือ ฿${suggested} (ปกติ ฿${prod.price})`);
    } else if (promoType === "BUY_1_GET_1") {
      setDescription(`ซื้อ ${prod.name} 1 ชิ้น แถมฟรีอีก 1 ชิ้นทันที`);
    } else if (promoType === "BUY_2_GET_1") {
      setDescription(`ซื้อ ${prod.name} 2 ชิ้น แถมฟรีอีก 1 ชิ้นทันที`);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (promo: Promotion) => {
    const newStatus = !promo.isActive;
    // Optimistic UI update
    setPromotions((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, isActive: newStatus } : p))
    );

    try {
      const res = await fetch(`/api/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      showNotification(newStatus ? "เปิดใช้งานโปรโมชันแล้ว" : "ปิดการใช้งานโปรโมชันแล้ว");
    } catch (err) {
      console.error(err);
      // Revert on error
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: !newStatus } : p))
      );
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะโปรโมชัน");
    }
  };

  // Delete Promotion
  const handleDeletePromo = async (promo: Promotion) => {
    if (!confirm(`คุณต้องการลบโปรโมชัน "${promo.name}" สำหรับสินค้า "${promo.product.name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/promotions/${promo.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
        showNotification("ลบโปรโมชันเรียบร้อยแล้ว");
      } else {
        alert("ไม่สามารถลบโปรโมชันได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedProductId) {
      setFormError("กรุณาเลือกสินค้า");
      return;
    }

    const selectedProd = allProducts.find((p) => p.id === selectedProductId);
    if (!selectedProd) {
      setFormError("ไม่พบสินค้าที่เลือก");
      return;
    }

    let parsedDiscountPrice: number | null = null;
    if (promoType === "DISCOUNT") {
      parsedDiscountPrice = parseFloat(discountPrice);
      if (isNaN(parsedDiscountPrice) || parsedDiscountPrice <= 0) {
        setFormError("กรุณากรอกราคาโปรโมชันที่มากกว่า 0");
        return;
      }
      if (parsedDiscountPrice >= selectedProd.price) {
        setFormError(`ราคาโปรโมชัน (${parsedDiscountPrice}฿) ต้องน้อยกว่าราคาปกติ (${selectedProd.price}฿)`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        productId: selectedProductId,
        name: promoName.trim() || "โปรโมชันพิเศษ",
        type: promoType,
        discountPrice: parsedDiscountPrice,
        badgeText: badgeText.trim() || null,
        description: description.trim() || null,
        isActive,
      };

      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update local list
        setPromotions((prev) => {
          const index = prev.findIndex((p) => p.id === data.promotion.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.promotion;
            return updated;
          } else {
            return [data.promotion, ...prev];
          }
        });

        setIsModalOpen(false);
        showNotification("บันทึกโปรโมชันสำเร็จแล้ว");
      } else {
        setFormError(data.error || "เกิดข้อผิดพลาดในการบันทึกโปรโมชัน");
      }
    } catch (err) {
      console.error(err);
      setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering
  const filteredPromotions = promotions.filter((promo) => {
    // Type filter
    if (filterType === "BUY_1_GET_1" && promo.type !== "BUY_1_GET_1") return false;
    if (filterType === "BUY_2_GET_1" && promo.type !== "BUY_2_GET_1") return false;
    if (filterType === "DISCOUNT" && promo.type !== "DISCOUNT") return false;
    if (filterType === "ACTIVE" && !promo.isActive) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProdName = promo.product.name.toLowerCase().includes(q);
      const matchPromoName = promo.name.toLowerCase().includes(q);
      const matchBadge = promo.badgeText?.toLowerCase().includes(q);
      if (!matchProdName && !matchPromoName && !matchBadge) return false;
    }

    return true;
  });

  // Calculate quick stats
  const totalCount = promotions.length;
  const activeCount = promotions.filter((p) => p.isActive).length;
  const bogoCount = promotions.filter((p) => p.type === "BUY_1_GET_1").length;
  const buy2get1Count = promotions.filter((p) => p.type === "BUY_2_GET_1").length;
  const discountCount = promotions.filter((p) => p.type === "DISCOUNT").length;

  const currentSelectedProduct = allProducts.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#b90000] flex items-center justify-center font-bold">
              🏷️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                จัดการโปรโมชันสินค้า (Promotions Manager)
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                สร้างและจัดโปรโมชัน <strong>ซื้อ 1 แถม 1</strong>, <strong>ซื้อ 2 แถม 1</strong> และ <strong>ลดราคาสินค้า</strong> เพื่อกระตุ้นยอดขาย
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-bold px-5 py-3 rounded-2xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างโปรโมชันใหม่</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. All */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 block">โปรโมชันทั้งหมด</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-gray-900">{totalCount}</span>
            <span className="text-xs text-emerald-600 font-bold">เปิดใช้ {activeCount}</span>
          </div>
        </div>

        {/* 2. Buy 1 Get 1 */}
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600">
            <span>🔥</span>
            <span>ซื้อ 1 แถม 1</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-red-600">{bogoCount}</span>
            <span className="text-[11px] text-gray-400">รายการ</span>
          </div>
        </div>

        {/* 3. Buy 2 Get 1 */}
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
            <span>🎁</span>
            <span>ซื้อ 2 แถม 1</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-700">{buy2get1Count}</span>
            <span className="text-[11px] text-gray-400">รายการ</span>
          </div>
        </div>

        {/* 4. Discount */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
            <span>🏷️</span>
            <span>สินค้าลดราคา</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700">{discountCount}</span>
            <span className="text-[11px] text-gray-400">รายการ</span>
          </div>
        </div>

        {/* 5. Active Rate */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-emerald-700 block">สถานะการทำงาน</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">
              {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%
            </span>
            <span className="text-[11px] text-gray-400">ออนไลน์</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "ทั้งหมด" },
            { id: "BUY_1_GET_1", label: "🔥 ซื้อ 1 แถม 1" },
            { id: "BUY_2_GET_1", label: "🎁 ซื้อ 2 แถม 1" },
            { id: "DISCOUNT", label: "🏷️ ลดราคาพิเศษ" },
            { id: "ACTIVE", label: "🟢 กำลังเปิดใช้" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? "bg-[#b90000] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อสินค้าหรือโปร..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">สินค้า</th>
                <th className="p-4">ประเภทโปรโมชัน</th>
                <th className="p-4">ราคา / เงื่อนไข</th>
                <th className="p-4">ป้ายโปรโมชัน</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 pr-6 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredPromotions.map((promo) => {
                const prod = promo.product;

                return (
                  <tr key={promo.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Product */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {prod.image?.startsWith("http") || prod.image?.startsWith("data:image") ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{prod.image || "📦"}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block line-clamp-1 hover:text-[#b90000]">
                            {prod.name}
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            สต็อกคงเหลือ: {prod.stock} {prod.unit || "ชิ้น"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Promotion Type */}
                    <td className="p-4">
                      {promo.type === "BUY_1_GET_1" && (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-xl text-xs font-bold">
                          🔥 ซื้อ 1 แถม 1
                        </span>
                      )}
                      {promo.type === "BUY_2_GET_1" && (
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl text-xs font-bold">
                          🎁 ซื้อ 2 แถม 1
                        </span>
                      )}
                      {promo.type === "DISCOUNT" && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                          🏷️ สินค้าลดราคา
                        </span>
                      )}
                    </td>

                    {/* Price & Benefit */}
                    <td className="p-4">
                      {promo.type === "DISCOUNT" && promo.discountPrice ? (
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-[#b90000] text-sm">
                              ฿{promo.discountPrice.toLocaleString("th-TH")}
                            </span>
                            <span className="text-gray-400 line-through text-[11px]">
                              ฿{prod.price.toLocaleString("th-TH")}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            ประหยัด ฿{(prod.price - promo.discountPrice).toLocaleString("th-TH")}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-gray-800 text-sm">
                            ฿{prod.price.toLocaleString("th-TH")}
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            {promo.type === "BUY_1_GET_1" ? "ชิ้นที่ 2 ฟรีทันที" : promo.type === "BUY_2_GET_1" ? "ชิ้นที่ 3 ฟรีทันที" : ""}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Badge Text */}
                    <td className="p-4">
                      <span className="inline-block bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-200">
                        {promo.badgeText || "-"}
                      </span>
                      {promo.description && (
                        <span className="text-[10px] text-gray-400 block mt-0.5 line-clamp-1 max-w-[200px]">
                          {promo.description}
                        </span>
                      )}
                    </td>

                    {/* Toggle Active Status */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(promo)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          promo.isActive ? "bg-[#b90000]" : "bg-gray-200"
                        }`}
                        title={promo.isActive ? "คลิกเพื่อปิดใช้งาน" : "คลิกเพื่อเปิดใช้งาน"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            promo.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(promo)}
                          className="p-1.5 text-gray-500 hover:text-[#b90000] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขโปรโมชัน"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบโปรโมชัน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPromotions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 text-xs">
                    ไม่พบรายการโปรโมชันตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Promotion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="bg-[#b90000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingPromo ? "แก้ไขโปรโมชันสินค้า" : "สร้างโปรโมชันสินค้าใหม่"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-red-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Choose Product */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  เลือกสินค้าที่ต้องการจัดโปรโมชัน *
                </label>
                
                {/* Search product filter inside modal */}
                <input
                  type="text"
                  value={modalProductSearch}
                  onChange={(e) => setModalProductSearch(e.target.value)}
                  placeholder="พิมพ์ค้นหาสินค้าในร้าน..."
                  className="w-full px-3 py-1.5 mb-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />

                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  disabled={Boolean(editingPromo)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000] cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {allProducts
                    .filter((p) =>
                      modalProductSearch.trim()
                        ? p.name.toLowerCase().includes(modalProductSearch.toLowerCase())
                        : true
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ราคาปกติ ฿{p.price} (สต็อก: {p.stock})
                      </option>
                    ))}
                </select>

                {currentSelectedProduct && (
                  <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3 text-xs">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {currentSelectedProduct.image?.startsWith("http") || currentSelectedProduct.image?.startsWith("data:image") ? (
                        <img src={currentSelectedProduct.image} alt={currentSelectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{currentSelectedProduct.image || "📦"}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">{currentSelectedProduct.name}</span>
                      <span className="text-gray-500 text-[11px]">
                        ราคาปกติ: <strong>฿{currentSelectedProduct.price}</strong> / {currentSelectedProduct.unit || "ชิ้น"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Choose Promotion Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  เลือกประเภทโปรโมชัน (Promotion Type) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Type 1: BUY_1_GET_1 */}
                  <button
                    type="button"
                    onClick={() => handlePromoTypeChange("BUY_1_GET_1")}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      promoType === "BUY_1_GET_1"
                        ? "bg-red-50 border-red-500 text-red-800 shadow-xs ring-2 ring-red-200"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">🔥</span>
                    <span className="font-bold text-xs block">ซื้อ 1 แถม 1</span>
                    <span className="text-[10px] text-gray-400 block">Buy 1 Get 1</span>
                  </button>

                  {/* Type 2: DISCOUNT */}
                  <button
                    type="button"
                    onClick={() => handlePromoTypeChange("DISCOUNT")}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      promoType === "DISCOUNT"
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-2 ring-amber-200"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">🏷️</span>
                    <span className="font-bold text-xs block">ลดราคาพิเศษ</span>
                    <span className="text-[10px] text-gray-400 block">Discount</span>
                  </button>

                  {/* Type 3: BUY_2_GET_1 */}
                  <button
                    type="button"
                    onClick={() => handlePromoTypeChange("BUY_2_GET_1")}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      promoType === "BUY_2_GET_1"
                        ? "bg-purple-50 border-purple-500 text-purple-900 shadow-xs ring-2 ring-purple-200"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">🎁</span>
                    <span className="font-bold text-xs block">ซื้อ 2 แถม 1</span>
                    <span className="text-[10px] text-gray-400 block">Buy 2 Get 1</span>
                  </button>
                </div>
              </div>

              {/* If DISCOUNT: Discount Price Input */}
              {promoType === "DISCOUNT" && (
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-900">
                      ราคาโปรโมชันลดพิเศษ (บาท) *
                    </label>
                    {currentSelectedProduct && (
                      <span className="text-[11px] text-gray-500">
                        ราคาปกติ: ฿{currentSelectedProduct.price}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="กรอกราคาพิเศษหลังลด (บาท)"
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#b90000]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">บาท</span>
                  </div>
                  {currentSelectedProduct && parseFloat(discountPrice) > 0 && (
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center justify-between">
                      <span>ลูกค้าจะประหยัด:</span>
                      <span>฿{(currentSelectedProduct.price - parseFloat(discountPrice)).toLocaleString("th-TH")} บาท / ชิ้น</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Badge Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ข้อความบนป้าย (Badge Text) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="กรอกข้อความบนป้ายโปรโมชัน"
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                  />
                  {/* Quick suggestion buttons */}
                  {promoType === "BUY_1_GET_1" && (
                    <button
                      type="button"
                      onClick={() => setBadgeText("ซื้อ 1 แถม 1")}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-[11px] font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      1 แถม 1
                    </button>
                  )}
                  {promoType === "BUY_2_GET_1" && (
                    <button
                      type="button"
                      onClick={() => setBadgeText("ซื้อ 2 แถม 1")}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-[11px] font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      2 แถม 1
                    </button>
                  )}
                  {promoType === "DISCOUNT" && (
                    <button
                      type="button"
                      onClick={() => setBadgeText("ลดราคาพิเศษ")}
                      className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-[11px] font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      ลดพิเศษ
                    </button>
                  )}
                </div>
              </div>

              {/* 4. Promotion Name / Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อโปรโมชัน (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="กรอกชื่อแคมเปญโปรโมชัน"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
              </div>

              {/* 5. Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  คำอธิบายโปรโมชัน (แสดงในหน้ารายละเอียดและตะกร้า)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="กรอกคำอธิบายหรือเงื่อนไขโปรโมชัน"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
              </div>

              {/* 6. Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="font-bold text-gray-900 text-xs block">เปิดใช้งานโปรโมชันทันที</span>
                  <span className="text-[11px] text-gray-500 block">
                    แสดงป้ายโปรโมชันบนหน้าร้านและคำนวณส่วนลดในตะกร้าทันที
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b90000]"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#b90000] hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPromo ? "บันทึกการแก้ไข" : "บันทึกโปรโมชัน"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
