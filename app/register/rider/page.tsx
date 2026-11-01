"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Truck, 
  ArrowLeft, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Car
} from "lucide-react";
import { registerRiderByInvite } from "@/app/admin/users/actions";

const VEHICLE_OPTIONS = [
  "รถจักรยานยนต์ (มอเตอร์ไซค์)",
  "รถกระบะ / รถบรรทุกเล็ก",
  "รถยนต์ส่วนบุคคล",
  "รถสามล้อ / ซาเล้ง",
  "อื่นๆ"
];

function RiderRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_OPTIONS[0]);
  const [plateNumber, setPlateNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password) {
      setErrorMessage("กรุณากรอก Username และรหัสผ่าน");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setErrorMessage("กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("username", username.trim());
      formData.set("password", password);
      formData.set("name", name.trim());
      formData.set("phone", phone.trim());
      formData.set("vehicleType", vehicleType);
      formData.set("plateNumber", plateNumber.trim());

      const res = await registerRiderByInvite(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white shadow-xs py-3.5 border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-red-600 group">
            <img
              src="/logo.png"
              alt="โลโก้ร้านเกษรบ้านป่าเวียง"
              className="h-10 w-10 object-contain rounded-full shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-[#b90000]">
                ร้านเกษรบ้านป่าเวียง
              </span>
              <span className="text-xs font-bold text-gray-700 bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                Rider Registration
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#b90000] bg-gray-50 hover:bg-red-50 px-3.5 py-1.5 rounded-xl border border-gray-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner ring-1 ring-white/30 shrink-0 text-2xl">
                🛵
              </div>
              <div>
                <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 fill-amber-950" />
                  คำเชิญพนักงานส่งของ
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  ลงทะเบียนพนักงานส่งสินค้าใหม่ (Rider)
                </h1>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  กรุณากรอกข้อมูลเพื่อลงทะเบียนเป็นไรเดอร์ของร้านเกษรบ้านป่าเวียง
                </p>
              </div>
            </div>
          </div>

          {/* Success Screen */}
          {success ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  ลงทะเบียนพนักงานส่งสำเร็จ!
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  ยินดีต้อนรับคุณ <strong>{name}</strong> เข้าสู่ทีมส่งสินค้าของร้านเกษรบ้านป่าเวียง สามารถเริ่มรับงานส่งของได้ทันที
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/rider"
                  className="w-full bg-[#b90000] hover:bg-red-800 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all text-center block"
                >
                  เข้าสู่หน้ารับงานส่งของ (Rider Portal)
                </Link>
                <Link
                  href="/"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-2xl transition-all text-center block"
                >
                  ไปยังหน้าแรกของร้านค้า
                </Link>
              </div>
            </div>
          ) : (
            /* Register Form */
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Username */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ไอดีเข้าสู่ระบบ (Username) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="font-mono text-gray-400 text-xs font-bold absolute left-3.5 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น somjit_rider"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* 2. Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่านสำหรับไรเดอร์"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2.1 Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ยืนยันรหัสผ่านอีกครั้ง <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านเดิมซ้ำอีกครั้ง"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-mono"
                  />
                </div>
              </div>

              {/* 3. Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ-นามสกุล พนักงานส่ง <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น สมจิต ใจดี"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* 4. Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 080-676-8667"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* 5. ยานพาหนะ (Drop-Down) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ยานพาหนะ (เลือกจากรายการ) <span className="text-red-500">*</span>
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 outline-none transition-all cursor-pointer font-medium"
                >
                  {VEHICLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. ป้ายทะเบียนรถ */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ป้ายทะเบียนรถ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="เช่น 1กข 1234 ลำปาง"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#b90000] hover:bg-red-800 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>{isSubmitting ? "กำลังบันทึกข้อมูล..." : "ยืนยันการลงทะเบียนเป็นพนักงานส่งสินค้า"}</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-400 text-center pt-2">
                * หลังจากลงทะเบียนแล้ว บัญชีจะปรากฏในระบบส่งของของร้านเกษรบ้านป่าเวียงทันที
              </p>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}

export default function RiderRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-gray-400">กำลังโหลด...</div>}>
      <RiderRegisterContent />
    </Suspense>
  );
}
