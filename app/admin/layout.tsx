import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, Users } from 'lucide-react';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

import { AdminSidebarNav } from './AdminSidebarNav';
import { AdminSidebarFooter } from './AdminSidebarFooter';

export const metadata = {
  title: {
    template: "%s | onlineshop",
    default: "⚙️ [Admin] ระบบจัดการร้านค้า | onlineshop",
  },
  description: "ระบบจัดการ onlineshop",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const authToken = cookieStore.get('auth_token')?.value;

  let validAdmin = false;
  for (const t of [adminToken, authToken]) {
    if (!t) continue;
    try {
      const decoded = jwt.verify(t, JWT_SECRET) as { role?: string; name: string };
      if (decoded.role === 'ADMIN') {
        validAdmin = true;
        break;
      }
    } catch {}
  }

  if (!validAdmin) {
    redirect('/login?redirect=/admin');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#b90000] text-white flex flex-col">
        <div className="p-4 sm:p-5 border-b border-red-800 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="โลโก้ร้านเกษรบ้านป่าเวียง"
            className="w-11 h-11 rounded-full object-contain bg-white p-0.5 shadow-md shrink-0 border border-white/80"
          />
          <div className="min-w-0">
            <h2 className="text-base font-black leading-tight text-white truncate">ร้านเกษรบ้านป่าเวียง</h2>
            <span className="text-[10px] font-bold text-red-200 bg-red-950/60 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-red-700/50">
              Admin Panel
            </span>
          </div>
        </div>
        <AdminSidebarNav />
        <AdminSidebarFooter />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
