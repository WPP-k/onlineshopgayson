"use client";

import { User, Search, ShoppingCart, CheckCircle2, ChevronDown, ShoppingBag, ShieldCheck, LogOut, Truck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

import { useEffect, useState, useRef } from "react";

export function Header() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const { user, setUser } = useAuthStore();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        // Keep persisted state on temporary network issue
      }
    };
    fetchUser();
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout?scope=user', { method: 'POST' });
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="bg-[#b90000] w-full text-white sticky top-0 z-50 shadow-md">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 md:gap-8">
          
          {/* Logo requested by user */}
          <Link href="/" className="flex items-center gap-2.5 md:gap-3.5 shrink-0 group">
            <div className="bg-white rounded-full p-0.5 flex items-center justify-center shadow-md overflow-hidden shrink-0 border-2 border-white ring-2 ring-red-300/40">
              <img
                src="/logo.png"
                alt="โลโก้ร้านเกษรบ้านป่าเวียง"
                className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight">ร้านเกษรบ้านป่าเวียง</span>
              <span className="text-[10px] md:text-xs text-white/90 font-medium tracking-wide">ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง</span>
            </div>
          </Link>

          {/* Search Bar - Takes full width on mobile, middle on desktop */}
          <div className="w-full md:flex-grow md:w-auto order-3 md:order-2 max-w-4xl flex flex-col">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get("q") as string;
                if (q && q.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
                }
              }}
              className="flex w-full bg-white rounded p-1 shadow-sm"
            >
              <input 
                type="text" 
                name="q"
                placeholder="ค้นหาสินค้า หรือร้านค้า" 
                className="flex-grow px-3 py-1.5 md:py-0 text-gray-700 outline-none text-sm placeholder-gray-500"
              />
              <button type="submit" className="bg-[#b90000] hover:bg-red-800 transition-colors text-white px-5 py-1.5 rounded flex items-center justify-center">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Auth & Shopping Cart */}
          <div className="shrink-0 flex items-center gap-2.5 md:gap-4 md:pr-4 order-2 md:order-3">
            {/* Auth Section with Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 md:gap-2.5 p-1 rounded-2xl hover:bg-red-800/60 transition-all cursor-pointer select-none text-left"
                  title="คลิกเพื่อเปิดเมนูผู้ใช้งาน"
                >
                  <div className="w-9 h-9 rounded-full bg-white text-red-600 flex items-center justify-center overflow-hidden shadow-sm shrink-0 ring-2 ring-white/30 hover:ring-white transition-all">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col hidden sm:flex leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold leading-tight max-w-[120px] truncate text-white">
                        {user.name}
                      </span>
                      {user.role === 'ADMIN' && (
                        <span className="text-[9px] bg-red-900 text-red-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-red-200 flex items-center gap-0.5 font-medium mt-0.5">
                      <span>บัญชีของฉัน</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isUserDropdownOpen ? "rotate-180 text-white" : "text-red-200"
                        }`}
                      />
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu Modal */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/80 -mt-2 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name ? user.name.slice(0, 1).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate font-mono">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Items */}
                    <div className="p-2 space-y-1">
                      {/* Menu 1: ข้อมูลส่วนตัวและที่อยู่ */}
                      <Link
                        href="/profile?tab=info"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-[#b90000] rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-[#b90000]" />
                        <span>ข้อมูลส่วนตัวและที่อยู่</span>
                      </Link>

                      {/* Menu 2: ประวัติการสั่งซื้อ */}
                      <Link
                        href="/profile?tab=orders"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-[#b90000] rounded-xl transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-gray-400 group-hover:text-[#b90000]" />
                        <span>ประวัติการสั่งซื้อ</span>
                      </Link>

                      {/* Menu 3: ติดตามพัสดุ */}
                      <Link
                        href="/track"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-[#b90000] rounded-xl transition-colors"
                      >
                        <Truck className="w-4 h-4 text-gray-400 group-hover:text-[#b90000]" />
                        <span>ติดตามพัสดุ</span>
                      </Link>

                      {/* Menu 4: แชทกับร้าน */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          window.dispatchEvent(new CustomEvent('open-chat-widget'));
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-[#b90000] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-[#b90000]" />
                        <span>แชทกับร้าน</span>
                      </button>

                      {/* Menu 5 (Admin Only) */}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#b90000] bg-red-50/80 hover:bg-red-100 rounded-xl transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#b90000]" />
                          <span>จัดการระบบหลังบ้าน (Admin)</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Divider */}
                    <div className="pt-1.5 mt-1 border-t border-gray-100 px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-2xl hover:bg-red-800/60 transition-all cursor-pointer select-none text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center border border-white/30">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col hidden sm:flex leading-tight">
                    <span className="text-xs font-semibold leading-tight flex items-center gap-0.5">
                      เข้าสู่ระบบ
                      <ChevronDown className="w-3 h-3 text-white/80" />
                    </span>
                    <span className="text-[10px] text-white/80 leading-tight">สมัครสมาชิก</span>
                  </div>
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 space-y-1">
                      <Link
                        href="/login"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-[#b90000] hover:bg-red-800 rounded-xl transition-colors justify-center shadow-xs"
                      >
                        <User className="w-4 h-4" />
                        <span>เข้าสู่ระบบ</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors justify-center"
                      >
                        <span>ยังไม่มีบัญชี? สมัครสมาชิก</span>
                      </Link>
                      
                      <div className="my-1.5 border-t border-gray-100" />
                      
                      {/* Menu: ติดตามพัสดุ */}
                      <Link
                        href="/track"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-[#b90000] rounded-xl transition-colors"
                      >
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span>ติดตามพัสดุ</span>
                      </Link>

                      {/* Menu: แชทกับร้าน */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          window.dispatchEvent(new CustomEvent('open-chat-widget'));
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-[#b90000] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span>แชทกับร้าน</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart */}
            <Link href="/cart" className="relative p-2 text-white hover:text-white/80 transition-colors border-l border-white/20 pl-3 md:pl-6">
              <ShoppingCart className="h-6 w-6 md:h-8 md:w-8" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-1 md:right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] md:text-[11px] font-bold leading-none text-[#b90000] transform translate-x-1/2 -translate-y-1/4 bg-white rounded-full border-2 border-[#b90000]">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}

