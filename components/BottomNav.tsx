"use client";

import Link from "next/link";
import { Home, Ticket, Search, Bell, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export function BottomNav() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 w-full max-w-lg bg-[#e5e5e5] border-t border-gray-300 z-50 px-2 py-2 pb-safe">
      <div className="flex justify-between items-center text-xs text-gray-700">
        <Link href="/" className="flex flex-col items-center gap-1 w-1/5 hover:text-red-600 transition-colors">
          <Home className="h-6 w-6" />
          <span>หน้าหลัก</span>
        </Link>
        
        <Link href="/coupons" className="flex flex-col items-center gap-1 w-1/5 hover:text-red-600 transition-colors">
          <Ticket className="h-6 w-6" />
          <span>คูปองของฉัน</span>
        </Link>

        <Link href="/search" className="flex flex-col items-center gap-1 w-1/5 hover:text-red-600 transition-colors">
          <Search className="h-6 w-6" />
          <span>ค้นหา</span>
        </Link>

        <Link href="/notifications" className="flex flex-col items-center gap-1 w-1/5 hover:text-red-600 transition-colors">
          <Bell className="h-6 w-6" />
          <span>การแจ้งเตือน</span>
        </Link>

        <Link href="/cart" className="flex flex-col items-center gap-1 w-1/5 hover:text-red-600 transition-colors relative">
          <ShoppingCart className="h-6 w-6" />
          <span>ตะกร้าของฉัน</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
