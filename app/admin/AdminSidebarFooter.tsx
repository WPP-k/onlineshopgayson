"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function AdminSidebarFooter() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout?scope=admin', { method: 'POST' });
      router.push('/login?redirect=/admin');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 border-t border-red-800 space-y-1">
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-100 hover:text-white hover:bg-red-800 transition-colors text-sm font-medium"
      >
        <Store className="w-5 h-5 text-red-200" />
        <span>กลับหน้าร้าน</span>
      </Link>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-200 hover:text-white hover:bg-red-800 transition-colors text-sm font-medium cursor-pointer text-left"
      >
        <LogOut className="w-5 h-5" />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  );
}
