"use client";

import { Header } from "@/components/Header";
import { 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#b90000] via-red-700 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="bg-white/20 backdrop-blur-md text-amber-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-white/20 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
                ฝ่ายบริการลูกค้า & สอบถามข้อมูล
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
                ติดต่อสอบถามร้านเกษรบ้านป่าเวียง
              </h1>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                มีข้อสงสัยเกี่ยวกับสินค้า ติดตามการจัดส่ง หรือสั่งซื้อสินค้าจำนวนมาก สามารถติดต่อหรือแชทพูดคุยกับเจ้าของร้านได้โดยตรงครับ
              </p>
            </div>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-chat-widget"));
              }}
              className="bg-white hover:bg-amber-50 text-[#b90000] font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-[#b90000] animate-bounce" />
              <span>เปิดหน้าต่างแชทกับร้านค้า</span>
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: เบอร์โทรศัพท์ */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#b90000] flex items-center justify-center font-bold text-xl ring-2 ring-red-100 shadow-2xs">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">โทรศัพท์ติดต่อโดยตรง</h3>
                <p className="text-xs text-gray-500 mt-0.5">โทรสอบถามได้ตลอดเวลาทำการ</p>
              </div>
              <p className="text-lg font-black text-[#b90000] font-mono">089-851-0807</p>
            </div>
            <a
              href="tel:0898510807"
              className="mt-4 w-full bg-red-50 hover:bg-red-100 text-[#b90000] font-bold text-xs py-2.5 rounded-xl transition-colors text-center block"
            >
              โทรออกทันที
            </a>
          </div>

          {/* Card 2: เวลาเปิด-ปิด */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl ring-2 ring-amber-100 shadow-2xs">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">เวลาทำการหน้าร้าน</h3>
                <p className="text-xs text-gray-500 mt-0.5">เปิดให้บริการทุกวันไม่มีวันหยุด</p>
              </div>
              <p className="text-lg font-black text-gray-800">07:00 - 20:00 น.</p>
            </div>
            <div className="mt-4 px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center">
              🟢 หน้าร้านเปิดพร้อมให้บริการ
            </div>
          </div>

          {/* Card 3: ที่อยู่และพิกัด */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl ring-2 ring-blue-100 shadow-2xs">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">ที่ตั้งร้านค้า</h3>
                <p className="text-xs text-gray-500 mt-0.5">ต.ทุ่งกว๋าว อ.เมืองปาน</p>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                33 หมู่ 11 บ้านป่าเวียง ตำบลทุ่งกว๋าว อำเภอเมืองปาน จังหวัดลำปาง 52240
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=18.564567,99.458904"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2.5 rounded-xl transition-colors text-center block"
            >
              เปิดดูใน Google Maps
            </a>
          </div>

        </div>

        {/* Interactive Live Chat Prompt */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <span>💬 แชทสดคุยกับเจ้าของร้าน (Live Chat)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  ตอบกลับรวดเร็ว
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
                ท่านสามารถกดปุ่มสีแดงมุมขวาล่าง หรือกดปุ่มด้านล่างนี้เพื่อเปิดหน้าต่างพูดคุยกับเจ้าของร้านได้ทันที ไม่ต้องรอสาย!
              </p>
            </div>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-chat-widget"));
              }}
              className="w-full sm:w-auto bg-[#b90000] hover:bg-red-800 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>เริ่มแชทคุยกับร้านค้าตอนนี้</span>
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-4">
          <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <span>คำถามที่พบบ่อย (FAQ)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#b90000]" />
                ระยะเวลาจัดส่งสินค้านานไหม?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                จัดส่งถึงหน้าบ้านภายใน 30-45 นาที สำหรับพื้นที่ตำบลทุ่งกว๋าวและตำบลใกล้เคียงในอำเภอเมืองปาน
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                มีเงื่อนไขยอดซื้อขั้นต่ำและค่าส่งอย่างไร?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                สั่งซื้อครบ 50 บาทขึ้นไป จัดส่งฟรี! หากสั่งซื้อไม่ถึง 50 บาท มีค่าจัดส่งเพียง 10 บาทเท่านั้น
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                ชำระเงินทางไหนได้บ้าง?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                รองรับการสแกนจ่ายผ่านพร้อมเพย์ (QR PromptPay), โอนเงินผ่านธนาคาร, และเก็บเงินสดปลายทาง
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                สามารถสั่งแล้วไปรับเองที่หน้าร้านได้หรือไม่?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                ได้ครับ! สามารถเลือกประเภทการจัดส่งเป็น "รับสินค้าที่หน้าร้าน" พนักงานจะจัดเตรียมของรอให้เข้ามารับได้ทันที
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
