"use client";

import { useAuthModalStore } from "@/store/useAuthModalStore";
import { X, LogIn, UserPlus, ShieldCheck, ShoppingBag, Truck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export function AuthRequiredModal() {
  const { isOpen, message, redirectUrl, closeAuthModal } = useAuthModalStore();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const loginHref = `/login?redirect=${encodeURIComponent(redirectUrl || "/")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Background click to close */}
      <div 
        className="absolute inset-0" 
        onClick={closeAuthModal} 
        aria-hidden="true" 
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Decorative Header */}
        <div className="bg-gradient-to-br from-red-700 via-[#b90000] to-rose-600 text-white p-6 pt-7 text-center relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-lg pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-400/20 rounded-full blur-md pointer-events-none" />

          {/* Logo */}
          <div className="w-20 h-20 mx-auto rounded-full bg-white p-1 shadow-lg ring-4 ring-white/30 flex items-center justify-center mb-3">
            <img
              src="/logo.png"
              alt="โลโก้ร้านเกษรบ้านป่าเวียง"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-white">
            กรุณาเข้าสู่ระบบก่อนสั่งซื้อ
          </h3>
          <p className="text-xs text-red-100 mt-1">
            ร้านเกษรบ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block mb-0.5">แจ้งเตือนสำหรับผู้เยี่ยมชม:</span>
              <span>{message}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            ท่านสามารถเข้าชมสินค้าและราคาในร้านได้ตามปกติ แต่หากต้องการเพิ่มสินค้าลงในรถเข็นหรือสั่งซื้อ กรุณาเข้าสู่ระบบด้วยบัญชีของคุณครับ
          </p>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <Link
              href={loginHref}
              onClick={closeAuthModal}
              className="w-full bg-gradient-to-r from-red-700 via-[#b90000] to-red-700 hover:from-red-800 hover:to-red-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm text-center"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </Link>

            <Link
              href="/register"
              onClick={closeAuthModal}
              className="w-full bg-red-50 hover:bg-red-100 text-[#b90000] border border-red-200 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs text-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>ยังไม่มีบัญชี? สมัครสมาชิกใหม่ (ฟรี)</span>
            </Link>

            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full text-xs text-gray-400 hover:text-gray-600 font-medium py-1.5 transition-colors cursor-pointer"
            >
              ดูสินค้าต่อ (ยังไม่เข้าสู่ระบบ)
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-[#b90000]" />
              <span>ส่งถึงบ้าน</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ปลอดภัย 100%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-[#b90000]" />
              <span>ของแท้ราคาส่ง</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
