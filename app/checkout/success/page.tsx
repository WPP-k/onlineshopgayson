"use client";

import { useEffect, useState, Suspense } from "react";
import { Header } from "@/components/Header";
import { 
  CheckCircle2, 
  Truck, 
  Store, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Clock, 
  ArrowRight, 
  ShoppingBag,
  Home,
  Receipt,
  QrCode,
  Upload,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Helper function to compress slip image to base64
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("1791032721");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSlipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;

    setUploadingSlip(true);
    try {
      const base64 = await compressImageFile(file);
      const res = await fetch("/api/checkout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          slipImage: base64,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder((prev: any) => ({
          ...prev,
          slipImage: base64,
          status: "WAITING_VERIFICATION",
        }));
        alert("✅ อัปโหลดสลิปเรียบร้อยแล้ว แอดมินจะทำการตรวจสอบยอดเงินครับ");
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการอัปโหลดสลิป");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูลสลิป");
    } finally {
      setUploadingSlip(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/checkout?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            setOrder(data.order);
          }
        }
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">สั่งซื้อสินค้าสำเร็จ!</h1>
      <p className="text-gray-500 text-sm mb-6">
        ขอบคุณสำหรับการสั่งซื้อ ระบบได้บันทึกคำสั่งซื้อของคุณเรียบร้อยแล้ว
      </p>
      
      {/* Order Info Card */}
      <div className="bg-gray-50/80 rounded-2xl p-5 sm:p-6 text-left border border-gray-100 space-y-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-3">
          <span className="text-xs font-semibold text-gray-500">หมายเลขคำสั่งซื้อ</span>
          <span className="font-mono text-xs font-bold text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
            {orderId || "ORD-" + Math.floor(100000 + Math.random() * 900000)}
          </span>
        </div>

        {/* Fulfillment Method Display */}
        <div className="border-b border-gray-200/70 pb-3">
          <span className="text-xs font-semibold text-gray-500 block mb-1.5">รูปแบบการรับสินค้า</span>
          {order?.deliveryType === "PICKUP" ? (
            <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-800 text-sm">
                <Store className="w-4 h-4 text-blue-600" />
                <span>รับสินค้าที่หน้าร้าน (Store Pickup)</span>
              </div>
              <p className="text-blue-900 font-medium">
                🏬 สถานที่: ร้านเกษรบ้านป่าเวียง
              </p>
              {order.customerName && (
                <p className="text-blue-700">
                  👤 ผู้มารับ: {order.customerName} {order.customerPhone && `(โทร ${order.customerPhone})`}
                </p>
              )}
              {order.pickupTime && (
                <p className="text-blue-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>เวลานัดรับ: {order.pickupTime}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50/60 border border-red-200/70 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#b90000] text-sm">
                <Truck className="w-4 h-4 text-[#b90000]" />
                <span>จัดส่งถึงที่ (Delivery)</span>
              </div>
              {order?.customerName && (
                <p className="text-gray-800 font-medium">
                  👤 ผู้รับ: {order.customerName} {order.customerPhone && `(โทร ${order.customerPhone})`}
                </p>
              )}
              {order?.shippingAddress && (
                <p className="text-gray-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                  <span>{order.shippingAddress}</span>
                </p>
              )}
              <p className="text-green-700 font-medium pt-0.5">
                🚚 พนักงานจะจัดส่งสินค้าให้ถึงที่หมาย
              </p>
            </div>
          )}
        </div>

        {/* QR Code / Transfer Payment Status */}
        {(order?.paymentMethod === "PROMPTPAY" || order?.paymentMethod === "TRANSFER" || order?.slipImage) && (
          <div className="border-b border-gray-200/70 pb-4">
            <span className="text-xs font-semibold text-gray-500 block mb-2">สถานะการชำระเงิน</span>
            {order.status === "PAID" ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ชำระเงินสำเร็จ (แอดมินตรวจสอบยอดเงินเข้าบัญชีและยืนยันการสั่งซื้อแล้ว)</span>
                </div>
                <p className="text-emerald-700">ทางร้านกำลังจัดเตรียมสินค้าเพื่อดำเนินการจัดส่งต่อไป</p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50/70 to-blue-50/40 border-2 border-amber-300 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>รอแอดมินตรวจสอบสลิปและยืนยันการสั่งซื้อ</span>
                  </div>
                  {order?.slipImage ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> แนบสลิปแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      ยังไม่ได้แนบสลิป
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-xs">
                  {order?.slipImage
                    ? "คุณได้แนบสลิปโอนเงินเรียบร้อยแล้ว แอดมินจะตรวจสอบยอดเงินเข้าบัญชีกสิกรไทย (179-1-03272-1) เมื่อตรวจสอบยอดเงินเข้าเรียบร้อย แอดมินจะกดยืนยันการสั่งซื้อทันที"
                    : "กรุณาโอนเงินและแนบสลิปหลักฐานการโอนเงิน เพื่อให้แอดมินตรวจสอบยอดเงินและกดยืนยันการสั่งซื้อ"}
                </p>

                {/* Attached Slip View or Upload */}
                {order?.slipImage ? (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <div className="w-16 h-20 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                      <img src={order.slipImage} alt="สลิปที่แนบ" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>แนบสลิปแล้ว รอแอดมินยืนยัน</span>
                      </div>
                      <p className="text-[11px] text-gray-500">คุณสามารถเปลี่ยนรูปสลิปใหม่ได้หากต้องการ</p>
                      <label className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded cursor-pointer transition-colors border border-blue-200">
                        <Upload className="w-3 h-3" />
                        <span>{uploadingSlip ? "กำลังส่ง..." : "เปลี่ยนรูปสลิป"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipChange}
                          className="hidden"
                          disabled={uploadingSlip}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3.5 rounded-xl border border-dashed border-gray-300">
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-amber-300 hover:border-[#b90000] rounded-xl bg-amber-50/40 hover:bg-red-50/30 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="hidden"
                        disabled={uploadingSlip}
                      />
                      <Upload className="w-5 h-5 text-amber-600 mb-1" />
                      <span className="text-xs font-bold text-gray-800">
                        {uploadingSlip ? "กำลังอัปโหลดสลิป..." : "คลิกเพื่อแนบสลิปโอนเงิน"}
                      </span>
                    </label>
                  </div>
                )}

                {order?.paymentMethod === "PROMPTPAY" ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-blue-200">
                    <img
                      src="/promptpay-qr.jpg"
                      alt="PromptPay QR"
                      className="w-36 h-auto rounded-lg object-contain shadow-xs shrink-0 border border-gray-100"
                    />
                    <div className="space-y-1.5 text-gray-700 text-xs flex-1">
                      <div className="font-bold text-blue-800 text-sm">Thai QR Payment (พร้อมเพย์)</div>
                      <div>ชื่อผู้รับเงิน: <span className="font-bold text-gray-900">นาย วัชรพงษ์พันธ์ กัญญา</span></div>
                      <div>ธนาคาร: <span className="font-bold text-emerald-800">กสิกรไทย (KBANK)</span></div>
                      <div className="text-red-700 font-bold text-base pt-1">
                        ยอดเงินที่โอน: ฿{order?.totalAmount?.toLocaleString("th-TH")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                    <div className="font-bold text-emerald-800 text-sm">โอนผ่านธนาคาร กสิกรไทย</div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>ธนาคาร:</span>
                      <span className="font-bold text-gray-900">ธนาคารกสิกรไทย (KBANK)</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>ชื่อบัญชี:</span>
                      <span className="font-bold text-gray-900">นาย วัชรพงษ์พันธ์ กัญญา</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>เลขที่บัญชี:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                          179-1-03272-1
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {copiedAccount ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-green-600">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอก</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-red-700 font-bold text-base pt-1 border-t border-gray-100 flex justify-between items-baseline">
                      <span>ยอดเงินที่โอน:</span>
                      <span>฿{order?.totalAmount?.toLocaleString("th-TH")}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Amount & Status */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs text-gray-500 block">ยอดรวมสุทธิ</span>
            <span className="text-xl font-extrabold text-[#b90000]">
              ฿{order?.totalAmount ? order.totalAmount.toLocaleString('th-TH') : "..."}
            </span>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            order?.status === "PAID"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : order?.status === "WAITING_VERIFICATION"
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
          }`}>
            {order?.status === "PAID"
              ? "ชำระเงินสำเร็จ"
              : order?.status === "WAITING_VERIFICATION"
              ? "รอตรวจสอบยอดเงินเข้า"
              : order?.paymentMethod === "PROMPTPAY"
              ? "รอชำระเงิน/แนบสลิป"
              : "รอชำระเงินปลายทาง/หน้าร้าน"}
          </span>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {orderId && (
          <Link 
            href={`/track?orderId=${orderId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>ติดตามสถานะจัดส่งสินค้า</span>
          </Link>
        )}
        {orderId && (
          <Link 
            href={`/receipt/${orderId}`} 
            target="_blank"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>พิมพ์ใบเสร็จรับเงิน</span>
          </Link>
        )}
        <Link 
          href="/profile?tab=orders" 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl transition-all text-sm"
        >
          <ShoppingBag className="w-4 h-4 text-gray-600" />
          <span>ดูประวัติการสั่งซื้อ</span>
        </Link>
        <Link 
          href="/" 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          <Home className="w-4 h-4" />
          <span>กลับสู่หน้าหลัก</span>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="flex flex-col w-full bg-[#f8f9fa] min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Suspense fallback={<div className="text-center py-12 text-gray-400">กำลังโหลดข้อมูลคำสั่งซื้อ...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
