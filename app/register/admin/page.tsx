"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  User, 
  Lock, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { registerAdminByInvite } from "@/app/admin/users/actions";

function AdminRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteCode = searchParams.get("invite") || searchParams.get("token") || searchParams.get("code");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password) {
      setErrorMessage("กรุณากรอกไอดีและรหัสผ่านให้ครบถ้วน");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("รหัสผ่านควรมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("username", username.trim());
      formData.set("password", password);
      formData.set("name", name.trim() || "ผู้ดูแลระบบ");
      formData.set("phone", phone.trim());

      const res = await registerAdminByInvite(formData);
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
                Admin Invite
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
          <div className="bg-gradient-to-r from-red-800 via-[#b90000] to-rose-700 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner ring-1 ring-white/30 shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 fill-amber-950" />
                  คำเชิญจากผู้ดูแลระบบ
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  ลงทะเบียนผู้ดูแลระบบใหม่ (Admin)
                </h1>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  กรุณากรอกข้อมูลส่วนตัวเพื่อสร้างบัญชีผู้ดูแลระบบร้านค้า
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
                  ลงทะเบียนผู้ดูแลระบบสำเร็จ!
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  บัญชีผู้ดูแลระบบ <strong>{username}</strong> ได้รับการสร้างเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบเพื่อจัดการร้านค้าได้ทันที
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="w-full bg-[#b90000] hover:bg-red-800 text-white font-extrabold text-sm py-3 rounded-2xl shadow-md transition-all text-center block"
                >
                  ไปหน้าเข้าสู่ระบบ (Login)
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

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่งผู้ดูแล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น คุณวิชัย แอดมินจัดการสินค้า"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Username */}
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
                    placeholder="ตั้งชื่อไอดีภาษาอังกฤษ เช่น vichai_admin"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  ใช้สำหรับล็อกอินเข้าหน้าจัดการหลังบ้าน Admin
                </span>
              </div>

              {/* Password */}
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
                    placeholder="กำหนดรหัสผ่าน"
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

              {/* Confirm Password */}
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

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 089-xxx-xxxx"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl outline-none transition-all placeholder:text-gray-400"
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
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? "กำลังบันทึกข้อมูล..." : "ยืนยันการลงทะเบียนเป็น Admin"}</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-400 text-center pt-2">
                * บัญชีนี้จะได้รับสิทธิ์การดูแลและจัดการระบบร้านค้าเกษรบ้านป่าเวียง
              </p>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-gray-400">กำลังโหลด...</div>}>
      <AdminRegisterContent />
    </Suspense>
  );
}
