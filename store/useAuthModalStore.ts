import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  message: string;
  redirectUrl: string;
  openAuthModal: (options?: { message?: string; redirectUrl?: string }) => void;
  closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  message: "กรุณาเข้าสู่ระบบบัญชีผู้ใช้งานเพื่อสั่งซื้อสินค้าหรือเพิ่มสินค้าลงในตะกร้า",
  redirectUrl: "/",
  openAuthModal: (options) =>
    set({
      isOpen: true,
      message: options?.message || "กรุณาเข้าสู่ระบบบัญชีผู้ใช้งานเพื่อสั่งซื้อสินค้าหรือเพิ่มสินค้าลงในตะกร้า",
      redirectUrl: options?.redirectUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"),
    }),
  closeAuthModal: () => set({ isOpen: false }),
}));
