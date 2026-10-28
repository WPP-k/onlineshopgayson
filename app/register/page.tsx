"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Home, 
  UserPlus, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  AtSign,
  ShieldCheck,
  Store
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  // Account details
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Address details - ให้ลูกค้ากรอกใส่เอง
  const [subAddress, setSubAddress] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setErrorMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const fullAddress = [
        subAddress.trim(),
        subDistrict.trim(),
        district.trim(),
        province.trim(),
        zipCode.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          address: fullAddress,
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        router.push("/");
      } else {
        setErrorMessage(data.error || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white shadow-xs py-3.5 border-b border-gray-100 sticky top-0 z-30">
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
              <span className="text-xs sm:text-sm font-bold text-gray-700 bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                สมัครสมาชิก
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

      {/* Main Register Form Container */}
      <main className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-700 via-[#b90000] to-rose-600 text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner shrink-0 border border-white/30">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>สมัครสมาชิกใหม่</span>
                  <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    FREE REGISTER
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  สร้างบัญชีเพื่อสั่งซื้อสินค้าออนไลน์ สะสมสิทธิพิเศษ และจัดส่งถึงบ้านจากร้านเกษรบ้านป่าเวียง
                </p>
              </div>
            </div>

            {/* Background Graphic Accents */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-amber-400/10 pointer-events-none blur-xl"></div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Section 1: Account Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-900 font-extrabold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-red-50 text-[#b90000] flex items-center justify-center text-xs">
                    1
                  </div>
                  <span>ข้อมูลบัญชีผู้ใช้งาน (Account Information)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      ชื่อ - นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="กรอกชื่อ-นามสกุลลูกค้า"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                      />
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="กรอกเบอร์โทรศัพท์ลูกค้า"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      ไอดีผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="กรอกไอดีผู้ใช้งาน / อีเมลลูกค้า"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                      />
                      <AtSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      รหัสผ่าน (Password) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="กรอกรหัสผ่านเข้าสู่ระบบ"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Shipping Address */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-900 font-extrabold text-sm">
                    <div className="w-6 h-6 rounded-lg bg-red-50 text-[#b90000] flex items-center justify-center text-xs">
                      2
                    </div>
                    <span>ที่อยู่สำหรับจัดส่งสินค้า (Delivery Address)</span>
                  </div>
                  <span className="text-[11px] text-gray-400 hidden sm:inline">
                    ใช้สำหรับส่งพัสดุถึงหน้าบ้านคุณ
                  </span>
                </div>

                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-3 text-xs text-red-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#b90000] shrink-0" />
                  <span>
                    <strong>ร้านเกษรบ้านป่าเวียง:</strong> ให้บริการจัดส่งใน ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง และพื้นที่รัศมีใกล้เคียง
                  </span>
                </div>

                {/* SubAddress (บ้านเลขที่, หมู่, ซอย, ถนน) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    บ้านเลขที่, หมู่, ซอย, ถนน หรือจุดสังเกต <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="กรอกบ้านเลขที่, หมู่, ซอย, ถนน หรือจุดสังเกต"
                      value={subAddress}
                      onChange={(e) => setSubAddress(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                    />
                    <Home className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* 4 Location Columns: Subdistrict, District, Province, Zipcode (ลูกค้ากรอกใส่เอง) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      ตำบล / แขวง
                    </label>
                    <input
                      type="text"
                      placeholder="กรอกตำบล / แขวง"
                      value={subDistrict}
                      onChange={(e) => setSubDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      อำเภอ / เขต
                    </label>
                    <input
                      type="text"
                      placeholder="กรอกอำเภอ / เขต"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      จังหวัด
                    </label>
                    <input
                      type="text"
                      placeholder="กรอกจังหวัด"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      รหัสไปรษณีย์
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="กรอกรหัสไปรษณีย์"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#b90000] hover:bg-red-800 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
                >
                  <span>{loading ? "กำลังบันทึกข้อมูล..." : "สมัครสมาชิกทันที"}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัยตามมาตรฐานความปลอดภัย</span>
                </div>
              </div>
            </form>

            {/* Footer: Link to Login */}
            <div className="pt-4 border-t border-gray-100 text-center text-xs">
              <span className="text-gray-500">มีบัญชีผู้ใช้งานอยู่แล้ว? </span>
              <Link
                href="/login"
                className="text-[#b90000] font-black hover:underline inline-flex items-center gap-0.5"
              >
                <span>เข้าสู่ระบบที่นี่</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
