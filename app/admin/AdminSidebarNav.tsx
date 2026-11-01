"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  ChevronDown,
  PlusCircle,
  Layers,
  Truck,
  ScanLine,
  Tablet,
  AlertTriangle,
  Tag,
  MessageCircle,
} from "lucide-react";

function SidebarNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const isProductsActive = pathname.startsWith("/admin/products");
  const [isProductsOpen, setIsProductsOpen] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/admin/chat/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadChatCount(data.unreadCount || 0);
        }
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => clearInterval(interval);
  }, []);

  // Keep dropdown open if on products page
  useEffect(() => {
    if (isProductsActive) {
      setIsProductsOpen(true);
    }
  }, [isProductsActive]);

  return (
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {/* 1. ภาพรวม */}
      <Link
        href="/admin"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname === "/admin"
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <LayoutDashboard className="w-5 h-5 shrink-0" />
        <span>ภาพรวม</span>
      </Link>

      {/* 2. จัดการคำสั่งซื้อ */}
      <Link
        href="/admin/orders"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname.startsWith("/admin/orders")
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <ShoppingCart className="w-5 h-5 shrink-0" />
        <span>จัดการคำสั่งซื้อ</span>
      </Link>

      {/* 2.1 แชทกับลูกค้า (Live Chat) */}
      <Link
        href="/admin/chat"
        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
          pathname.startsWith("/admin/chat")
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 shrink-0 text-amber-300" />
          <span>แชทกับลูกค้า</span>
        </div>
        {unreadChatCount > 0 && (
          <span className="bg-amber-400 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full shadow-2xs animate-bounce">
            {unreadChatCount}
          </span>
        )}
      </Link>

      {/* 3. จัดการสินค้า (Dropdown Menu แบ่งเป็น เพิ่มสินค้าใหม่ & รายการสินค้า) */}
      <div className="space-y-1">
        <div
          onClick={() => setIsProductsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer select-none ${
            isProductsActive
              ? "bg-red-900/60 text-white font-medium"
              : "text-red-100 hover:bg-red-800 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 shrink-0" />
            <span>จัดการสินค้า</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isProductsOpen ? "rotate-180 text-white" : "text-red-300"
            }`}
          />
        </div>

        {/* Dropdown Items */}
        {isProductsOpen && (
          <div className="pl-3 pr-1 py-1 space-y-1 bg-red-950/20 rounded-xl">
            {/* เมนูย่อย 1: เพิ่มสินค้า */}
            <Link
              href="/admin/products?tab=add"
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs rounded-lg transition-all ${
                isProductsActive && currentTab === "add"
                  ? "bg-white text-[#b90000] font-bold shadow-xs"
                  : "text-red-100 hover:bg-red-800/80 hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>เพิ่มสินค้าใหม่</span>
            </Link>

            {/* เมนูย่อย 2: รายการสินค้า */}
            <Link
              href="/admin/products?tab=list"
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs rounded-lg transition-all ${
                isProductsActive && (currentTab === "list" || (!currentTab && isProductsActive))
                  ? "bg-white text-[#b90000] font-bold shadow-xs"
                  : "text-red-100 hover:bg-red-800/80 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>รายการสินค้า</span>
            </Link>

            {/* เมนูย่อย 3: หมวดหมู่สินค้า */}
            <Link
              href="/admin/categories"
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs rounded-lg transition-all ${
                pathname.startsWith("/admin/categories")
                  ? "bg-white text-[#b90000] font-bold shadow-xs"
                  : "text-red-100 hover:bg-red-800/80 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>เพิ่มหมวดหมู่สินค้า</span>
            </Link>
            
            {/* เมนูย่อย 4: หน่วยนับสินค้า */}
            <Link
              href="/admin/units"
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs rounded-lg transition-all ${
                pathname.startsWith("/admin/units")
                  ? "bg-white text-[#b90000] font-bold shadow-xs"
                  : "text-red-100 hover:bg-red-800/80 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>เพิ่มหน่วยนับสินค้า</span>
            </Link>

            {/* เมนูย่อย 5: จัดการโปรโมชัน */}
            <Link
              href="/admin/promotions"
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs rounded-lg transition-all ${
                pathname.startsWith("/admin/promotions")
                  ? "bg-white text-[#b90000] font-bold shadow-xs"
                  : "text-red-100 hover:bg-red-800/80 hover:text-white"
              }`}
            >
              <Tag className="w-4 h-4 shrink-0 text-amber-300" />
              <span>จัดการโปรโมชัน</span>
            </Link>
          </div>
        )}
      </div>

      {/* 4. จัดการผู้ใช้งาน */}
      <Link
        href="/admin/users"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname.startsWith("/admin/users")
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <Users className="w-5 h-5 shrink-0" />
        <span>จัดการผู้ใช้งาน</span>
      </Link>

      {/* 5. รายงาน */}
      <Link
        href="/admin/reports"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname.startsWith("/admin/reports")
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <BarChart3 className="w-5 h-5 shrink-0" />
        <span>รายงาน</span>
      </Link>

      {/* 6. จัดการป้ายโฆษณา */}
      <Link
        href="/admin/banners"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname.startsWith("/admin/banners")
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <Layers className="w-5 h-5 shrink-0" />
        <span>จัดการป้ายโฆษณา</span>
      </Link>

      {/* 7. พนักงานส่งสินค้า & แผนที่จัดส่ง */}
      <Link
        href="/admin/delivery"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname.startsWith("/admin/delivery")
            ? "bg-red-900 text-white font-semibold shadow-inner"
            : "text-red-100 hover:bg-red-800 hover:text-white"
        }`}
      >
        <Truck className="w-5 h-5 shrink-0" />
        <span>พนักงานส่งสินค้า</span>
      </Link>

      {/* หน้าร้าน & คลังสินค้า Section */}
      <div className="pt-4 mt-4 border-t border-red-800/60">
        <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-red-300/80 block mb-2">
          ระบบหน้าร้าน & คลังสินค้า
        </span>

        {/* เครื่อง Handheld */}
        <Link
          href="/handheld"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-xs font-semibold ${
            pathname.startsWith("/handheld")
              ? "bg-red-900 text-white shadow-inner"
              : "text-red-100 hover:bg-red-800 hover:text-white"
          }`}
        >
          <ScanLine className="w-4 h-4 shrink-0 text-amber-400" />
          <span>📱 เครื่อง Handheld (คลัง/สต็อก)</span>
        </Link>

        {/* จอ iPad หน้าร้าน */}
        <Link
          href="/store/fulfillment"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-xs font-semibold ${
            pathname.startsWith("/store/fulfillment")
              ? "bg-red-900 text-white shadow-inner"
              : "text-red-100 hover:bg-red-800 hover:text-white"
          }`}
        >
          <Tablet className="w-4 h-4 shrink-0 text-amber-400" />
          <span>📟 จอ iPad หน้าร้าน (บาร์โค้ด)</span>
        </Link>
      </div>
    </nav>
  );
}

export function AdminSidebarNav() {
  return (
    <Suspense fallback={<div className="flex-1 px-4 py-6" />}>
      <SidebarNavContent />
    </Suspense>
  );
}
