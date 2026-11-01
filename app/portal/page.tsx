import Link from "next/link";
import { 
  Users, 
  ShieldCheck, 
  Truck, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle2, 
  Store, 
  Radio, 
  MapPin, 
  Package, 
  Smartphone,
  Sparkles,
  Info
} from "lucide-react";

export const metadata = {
  title: "🌐 ศูนย์รวมทางเข้าระบบแบ่งตามบทบาท (Admin, User, Rider)",
  description: "ทางเข้าใช้งานระบบพร้อมกันสำหรับลูกค้า แอดมิน และไรเดอร์ onlineshop",
};

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#b90000] text-white py-4 px-4 sm:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-white rounded-xl p-1.5 flex items-center justify-center text-red-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight block">ร้านเกษรบ้านป่าเวียง</span>
              <span className="text-[10px] text-white/80 block">ระบบจำลองการทำงานหลายบทบาทพร้อมกัน (Multi-Role Simulation)</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-medium px-3.5 py-1.5 rounded-full transition-colors"
          >
            ← กลับหน้าร้าน
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-red-900 via-[#b90000] to-red-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ระบบเปิดใช้งานพร้อมกัน 3 หน้าต่าง</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ศูนย์รวมการเข้าสู่ระบบแบ่งตามบทบาท
            </h1>
            <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
              คุณสามารถเปิดใช้งาน <strong>ลูกค้า (User)</strong>, <strong>แอดมิน (Admin)</strong>, และ <strong>คนขับส่งของ (Rider)</strong> พร้อมๆ กันในเครื่องคอมพิวเตอร์เครื่องเดียวเพื่อทดสอบขั้นตอนการซื้อขาย จัดส่ง และติดตามสินค้าได้อย่างสมบูรณ์แบบ
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 text-[180px] select-none pointer-events-none font-black">
            RMUTL
          </div>
        </div>

        {/* 3 Main Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: User / Customer */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl">🛒</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  แท็บที่ 1: หน้าลูกค้า
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                  ลูกค้า / ผู้ใช้งาน (User)
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  สำหรับเลือกชมสินค้า สั่งซื้อสินค้า ใช้โปรโมชัน 1 แถม 1 และปักหมุด GPS ที่อยู่จัดส่ง
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">URL หน้าเว็บ:</span>
                  <code className="font-mono font-bold text-gray-800">localhost:3000</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ชื่อบนแท็บ:</span>
                  <span className="font-semibold text-blue-700 text-[11px]">🛒 [ลูกค้า] ร้านเกษรฯ</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>ค้นหาสินค้า / หมวดหมู่</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>โปรโมชันซื้อ 1 แถม 1 & สินค้าลดราคา</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>ปักหมุดที่อยู่บนแผนที่พร้อมคำนวณระยะทาง</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="http://localhost:3000/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer group-hover:scale-[1.02]"
              >
                <span>เปิดหน้าต่างลูกค้า (แท็บ 1)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Admin */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 hover:shadow-xl hover:border-red-200 transition-all flex flex-col justify-between group ring-2 ring-[#b90000]/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl">⚙️</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#b90000] border border-red-200">
                    แท็บที่ 2: หน้าแอดมิน
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    แนะนำ 127.0.0.1
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-900 group-hover:text-[#b90000] transition-colors">
                  ผู้ดูแลระบบ (Admin Panel)
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  สำหรับตรวจสอบคำสั่งซื้อ ยืนยันยอดชำระเงิน มอบหมายงานให้ไรเดอร์ และจัดโปรโมชัน
                </p>
              </div>

              <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">URL แนะนำ:</span>
                  <code className="font-mono font-bold text-red-700">127.0.0.1:3000/admin</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ชื่อบนแท็บ:</span>
                  <span className="font-semibold text-red-700 text-[11px]">⚙️ [Admin] ระบบจัดการ</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>ดูออเดอร์ใหม่แบบเรียลไทม์</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>จ่ายงานมอบหมายคนขับส่งของ (Rider)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>ตั้งค่าพิกัดร้าน รัศมีการส่ง และโปรโมชัน</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <a
                href="http://127.0.0.1:3000/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#b90000] hover:bg-red-800 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer group-hover:scale-[1.02]"
              >
                <span>เปิดหน้าต่าง Admin (แนะนำ: 127.0.0.1)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="http://localhost:3000/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[11px] transition-all"
              >
                <span>หรือเปิดผ่าน localhost:3000/admin</span>
              </a>
            </div>
          </div>

          {/* Card 3: Rider */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl">🛵</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  แท็บที่ 3: หน้าคนขับ
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">
                  พนักงานจัดส่ง (Rider Portal)
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  สำหรับคนขับรับงานจัดส่ง ดูพิกัดและที่อยู่ลูกค้า อัปเดตสถานะ "กำลังจัดส่ง" และ "ส่งสำเร็จ"
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">URL หน้าเว็บ:</span>
                  <code className="font-mono font-bold text-gray-800">localhost:3000/rider</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ชื่อบนแท็บ:</span>
                  <span className="font-semibold text-emerald-700 text-[11px]">🛵 [Rider] ระบบส่งของ</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>เลือกโปรไฟล์คนขับได้ทันที</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>ดูรายการสินค้าและเบอร์โทรลูกค้า</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>กดปุ่มอัปเดตสถานะนำส่งถึงลูกค้า</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="http://localhost:3000/rider"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer group-hover:scale-[1.02]"
              >
                <span>เปิดหน้าต่าง Rider (แท็บ 3)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Secondary Services Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Card 4: Live Tracking */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
                📦
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">ระบบติดตามสถานะพัสดุ (Live Track)</h3>
                <p className="text-xs text-gray-500 font-mono">localhost:3000/track</p>
              </div>
            </div>
            <a
              href="http://localhost:3000/track"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>เปิดแท็บติดตาม</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Card 5: Handheld */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg">
                📱
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">เครื่องสแกนบาร์โค้ดคลังสินค้า (Handheld)</h3>
                <p className="text-xs text-gray-500 font-mono">localhost:3000/handheld</p>
              </div>
            </div>
            <a
              href="http://localhost:3000/handheld"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>เปิดแท็บ Handheld</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Workflow Walkthrough */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-sm">
              📋
            </div>
            <h2 className="text-base font-bold text-gray-900">
              ขั้นตอนทดสอบทั้งระบบพร้อมกัน (Delivery Flow Simulation)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-gray-600">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
              <span className="font-extrabold text-[#b90000] block text-sm">1. สั่งซื้อสินค้า</span>
              <span className="font-bold text-gray-800 block">แท็บลูกค้า (User)</span>
              <p className="text-[11px] leading-relaxed">
                เข้าซื้อสินค้า เลือกจัดส่งถึงบ้าน ปักหมุด GPS ที่อยู่ และกดชำระเงิน
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
              <span className="font-extrabold text-[#b90000] block text-sm">2. จ่ายงานไรเดอร์</span>
              <span className="font-bold text-gray-800 block">แท็บแอดมิน (Admin)</span>
              <p className="text-[11px] leading-relaxed">
                เห็นออเดอร์ใหม่เข้ามา กดมอบหมายงานให้คนขับ (Rider)
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
              <span className="font-extrabold text-[#b90000] block text-sm">3. นำส่งสินค้า</span>
              <span className="font-bold text-gray-800 block">แท็บคนขับ (Rider)</span>
              <p className="text-[11px] leading-relaxed">
                ไรเดอร์รับงาน กดปุ่ม "กำลังจัดส่ง" และนำของไปส่งตามพิกัด
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
              <span className="font-extrabold text-emerald-600 block text-sm">4. ส่งมอบสำเร็จ</span>
              <span className="font-bold text-gray-800 block">แท็บคนขับ + ติดตาม</span>
              <p className="text-[11px] leading-relaxed">
                ไรเดอร์กด "ส่งสำเร็จ" สถานะในหน้าแอดมินและหน้าติดตามพัสดุจะอัปเดตทันที
              </p>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-950">
              เคล็ดลับทำไมถึงแนะนำให้เปิด Admin ด้วย 127.0.0.1:3000/admin ?
            </span>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              เพราะเว็บเบราว์เซอร์อย่าง Google Chrome หรือ Microsoft Edge จะแยกพื้นที่จัดเก็บคุกกี้ (Cookie) และการล็อกอินระหว่าง <strong>localhost</strong> กับ <strong>127.0.0.1</strong> ออกจากกันโดยสมบูรณ์ ทำให้คุณสามารถล็อกอินเป็นลูกค้าในหน้า <code>localhost:3000</code> และล็อกอินเป็นแอดมินในหน้า <code>127.0.0.1:3000/admin</code> ได้พร้อมกัน 100% โดยที่ทั้งสองบัญชีจะไม่ทับซ้อนหรือหลุดออกจากระบบครับ!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
