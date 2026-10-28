import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Printer, CheckCircle2, Store, Truck, Phone, MapPin, Calendar, Clock, ShoppingBag } from "lucide-react";
import { ReceiptPrintButton } from "./ReceiptPrintButton";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-[#b90000] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลใบเสร็จรับเงิน</h1>
          <p className="text-gray-500 text-sm mb-6">คำสั่งซื้อนี้อาจไม่มีอยู่ในระบบ หรือถูกยกเลิกแล้ว</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#b90000] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const customerName = order.customerName || order.user?.name || order.user?.username || "ลูกค้าทั่วไป";
  const customerPhone = order.customerPhone || order.user?.phone || "-";
  const shippingAddress = order.shippingAddress || order.user?.address || "-";

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-4 print:p-0 print:bg-white text-gray-900">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/profile?tab=orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#b90000] transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้าคำสั่งซื้อ</span>
        </Link>

        <ReceiptPrintButton />
      </div>

      {/* Main Printable Receipt Card */}
      <div
        id="printable-receipt"
        className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200/80 p-8 sm:p-10 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
      >
        {/* Receipt Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="inline-flex items-center gap-3 text-[#b90000] mb-1">
            <img
              src="/logo.png"
              alt="โลโก้ร้านเกษรบ้านป่าเวียง"
              className="w-12 h-12 rounded-full object-contain shadow-xs shrink-0"
            />
            <div className="text-left">
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 block leading-tight">
                ร้านเกษรบ้านป่าเวียง
              </span>
              <span className="text-[11px] text-gray-500 font-medium">ของกินของใช้ สินค้าเกษตร คุณภาพดี</span>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-700">33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง 52240</p>
          <p className="text-xs text-gray-500 mt-0.5">สินค้าอุปโภคบริโภค ราคาสบายกระเป๋า บริการจัดส่งถึงบ้านและรับที่ร้าน</p>

          <div className="mt-4 pt-3 border-t border-dashed border-gray-200 inline-block text-xs font-mono">
            <span className="font-bold text-gray-800 text-sm">ใบเสร็จรับเงิน / ใบส่งสินค้า</span>
            <div className="text-gray-500 mt-1">
              เลขที่: <span className="font-bold text-gray-900 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="text-gray-400 text-[11px] mt-0.5">
              วันที่พิมพ์/สั่งซื้อ: {formattedDate} น.
            </div>
          </div>
        </div>

        {/* Customer & Fulfillment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-gray-200 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] text-gray-500">ข้อมูลผู้สั่งซื้อ</h3>
            <p className="font-semibold text-gray-900 text-sm">{customerName}</p>
            <p className="text-gray-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>เบอร์ติดต่อ: {customerPhone}</span>
            </p>
            {order.user?.username && (
              <p className="text-gray-400 text-[11px]">
                บัญชีผู้ใช้: @{order.user.username}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] text-gray-500">การจัดส่งและรับสินค้า</h3>
            {order.deliveryType === "PICKUP" ? (
              <div className="text-blue-900">
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200 mb-1">
                  <Store className="w-3 h-3" /> รับสินค้าที่หน้าร้าน
                </span>
                <p className="text-gray-600">จุดรับ: ร้านเกษรบ้านป่าเวียง</p>
                {order.pickupTime && (
                  <p className="text-gray-600 font-medium">เวลานัดรับ: {order.pickupTime}</p>
                )}
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1 bg-red-50 text-[#b90000] font-bold px-2 py-0.5 rounded border border-red-200 mb-1">
                  <Truck className="w-3 h-3" /> บริการจัดส่งถึงบ้าน (Delivery)
                </span>
                <p className="text-gray-600 leading-relaxed">
                  ที่อยู่: {shippingAddress}
                </p>
              </div>
            )}
            {order.notes && (
              <p className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 text-[11px] mt-1">
                หมายเหตุ: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="py-5 border-b border-gray-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px]">
                <th className="py-2.5 w-10 text-center">#</th>
                <th className="py-2.5">รายการสินค้า</th>
                <th className="py-2.5 text-right w-24">ราคา/หน่วย</th>
                <th className="py-2.5 text-center w-20">จำนวน</th>
                <th className="py-2.5 text-right w-28">ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                  <td className="py-3 font-semibold text-gray-900">{item.productName}</td>
                  <td className="py-3 text-right text-gray-600">฿{item.price.toLocaleString("th-TH", { minimumFractionDigits: item.price % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 text-center font-bold text-gray-800">{item.quantity}</td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    ฿{(item.price * item.quantity).toLocaleString("th-TH", { minimumFractionDigits: (item.price * item.quantity) % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="py-5 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>รวมจำนวนสินค้า:</span>
            <span className="font-semibold">{order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>ค่าจัดส่ง:</span>
            <span className="font-semibold text-green-700">ฟรี (โปรโมชั่นร้านเกษรบ้านป่าเวียง)</span>
          </div>
          <div className="flex justify-between items-baseline pt-3 border-t border-gray-200 text-base font-bold text-gray-900">
            <span className="text-sm">ยอดเงินสุทธิทั้งสิ้น:</span>
            <span className="text-2xl font-black text-[#b90000]">
              ฿{order.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: order.totalAmount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-1">
            <span>สถานะการชำระเงิน:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {order.status === "PAID" || order.status === "DELIVERED" ? "ชำระเงินเรียบร้อยแล้ว" : "รอชำระเงินปลายทาง / หน้าร้าน"}
            </span>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="pt-6 border-t border-dashed border-gray-200 text-center text-[11px] text-gray-400 space-y-1">
          <p className="font-medium text-gray-600">ขอขอบคุณที่ไว้วางใจอุดหนุน "ร้านเกษรบ้านป่าเวียง"</p>
          <p>สินค้ามีปัญหาหรือต้องการสอบถามเพิ่มเติม โทร: 081-234-5678</p>
          <p className="font-mono text-[10px] text-gray-400">REF: {order.id}</p>
        </div>
      </div>
    </div>
  );
}
