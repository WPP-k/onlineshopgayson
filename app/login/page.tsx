"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  UserPlus, 
  Phone, 
  CheckCircle2,
  Store,
  Loader2,
  HelpCircle,
  X
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);

        // If user is Admin or redirect was explicitly set to /admin, go to admin
        if (data.user.role === "ADMIN" || redirectParam.startsWith("/admin")) {
          window.location.href = redirectParam || "/admin";
        } else {
          window.location.href = redirectParam || "/";
        }
      } else {
        setErrorMessage(data.error || "ไอดีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-red-50/80 overflow-hidden backdrop-blur-sm transition-all duration-300">
        
        {/* Card Header with Store Brand Gradient */}
        <div className="bg-gradient-to-br from-red-700 via-[#b90000] to-rose-600 text-white p-7 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle Background Graphic Accents */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/15 rounded-full blur-lg pointer-events-none"></div>
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/5 to-black/20 pointer-events-none"></div>

          {/* Logo with White Ring */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative group mb-3">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white p-1 shadow-xl ring-4 ring-white/30 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <img
                  src="/logo.png"
                  alt="โลโก้ร้านเกษรบ้านป่าเวียง"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                OFFICIAL
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              ร้านเกษรบ้านป่าเวียง
            </h1>
            <p className="text-xs text-red-100 font-medium mt-0.5">
              ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง
            </p>

            {/* Context Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-white/95 border border-white/20">
              {redirectParam.startsWith("/admin") ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>🔐 เข้าสู่ระบบผู้ดูแลร้านค้า (Admin)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>เข้าสู่ระบบเพื่อสั่งซื้อสินค้า</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-5 bg-white">
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#b90000]" />
                  <span>ไอดีผู้ใช้งาน (Username)</span>
                </span>
                <span className="text-[11px] text-gray-400 font-normal">ชื่อผู้ใช้หรืออีเมล</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="กรอกไอดีผู้ใช้งาน หรือ อีเมล"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#b90000] focus:ring-4 focus:ring-red-500/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#b90000]" />
                  <span>รหัสผ่าน (Password)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-semibold transition-colors"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="กรอกรหัสผ่านเข้าสู่ระบบ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#b90000] focus:ring-4 focus:ring-red-500/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 transition-all outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#b90000] focus:ring-red-400 border-gray-300 accent-[#b90000] cursor-pointer"
                />
                <span className="text-xs text-gray-600 font-medium">จดจำฉันไว้ในระบบ</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ปลอดภัย 100%</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-700 via-[#b90000] to-red-700 hover:from-red-800 hover:via-red-700 hover:to-red-800 active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">หรือ</span>
            </div>
          </div>

          {/* Register Callout */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500 font-medium">ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่?</p>
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 text-[#b90000] font-bold text-xs transition-all shadow-2xs group"
            >
              <UserPlus className="w-4 h-4 text-[#b90000] group-hover:scale-110 transition-transform" />
              <span>สมัครสมาชิกใหม่ (เปิดบัญชีฟรี)</span>
            </Link>
          </div>

        </div>

      </div>

      {/* Trust & Features Footer */}
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <Truck className="w-4 h-4 text-[#b90000] mx-auto mb-1" />
          <span className="text-[11px] font-bold text-gray-700 block">จัดส่งถึงบ้าน</span>
          <span className="text-[10px] text-gray-400">ในพื้นที่รวดเร็ว</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <Store className="w-4 h-4 text-[#b90000] mx-auto mb-1" />
          <span className="text-[11px] font-bold text-gray-700 block">สินค้าครบครัน</span>
          <span className="text-[10px] text-gray-400">ของกินของใช้</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <span className="text-[11px] font-bold text-gray-700 block">มั่นใจ ปลอดภัย</span>
          <span className="text-[10px] text-gray-400">ดูแลทุกคำสั่งซื้อ</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#b90000] flex items-center justify-center mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-gray-900 mb-1">
              ลืมรหัสผ่านหรือไอดีผู้ใช้?
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              หากท่านลืมรหัสผ่าน สามารถติดต่อผู้ดูแลร้านเกษรบ้านป่าเวียงโดยตรงเพื่อขอรีเซ็ตรหัสผ่านได้ทันทีครับ
            </p>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5 text-xs text-gray-700 mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#b90000]" />
                <span className="font-bold">ร้านเกษรบ้านป่าเวียง</span>
              </div>
              <div className="text-[11px] text-gray-500 pl-6">
                ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง
              </div>
              <div className="flex items-center gap-2 pl-0 pt-1 text-gray-800 font-semibold">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>โทร/ไลน์: ติดต่อเจ้าหน้าที่หน้าร้าน</span>
              </div>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-[#b90000] hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/40 via-stone-50/60 to-amber-50/40 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Decorative Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-200/25 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none translate-y-1/2"></div>

      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-xs py-3.5 border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-red-600 group">
            <img
              src="/logo.png"
              alt="โลโก้ร้านเกษรบ้านป่าเวียง"
              className="h-10 w-10 object-contain rounded-full shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#b90000]">
                ร้านเกษรบ้านป่าเวียง
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-700 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full border border-red-100">
                เข้าสู่ระบบ
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#b90000] bg-gray-50 hover:bg-red-50 px-3.5 py-1.5 rounded-xl border border-gray-200 hover:border-red-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </header>

      {/* Login Form Container */}
      <main className="flex-grow flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <Suspense 
          fallback={
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
              <Loader2 className="w-8 h-8 text-[#b90000] animate-spin mb-2" />
              <div className="text-gray-500 text-xs font-semibold">กำลังโหลดแบบฟอร์ม...</div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* Simple Footer Note */}
      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-white/60 backdrop-blur-xs relative z-10">
        <p>© ร้านเกษรบ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง 52240</p>
      </footer>

    </div>
  );
}
