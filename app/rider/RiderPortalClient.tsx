"use client";

import { useState } from "react";
import { 
  Truck, 
  Phone, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  AlertCircle,
  Package, 
  ArrowLeft,
  Star,
  Check,
  RotateCw,
  ShoppingBag,
  ExternalLink,
  PlusCircle,
  Undo2,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { 
  updateOrderDeliveryStatus, 
  updateRiderStatus,
  claimOrderByRider,
  releaseOrderByRider
} from "@/app/admin/delivery/actions";

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: string | null;
  status: string;
  rating: number;
  completedJobs: number;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  deliveryStatus: string;
  paymentMethod: string;
  riderId: string | null;
  notes: string | null;
  createdAt: string;
  deliveredAt: string | null;
  items: OrderItem[];
}

interface Props {
  riders: Rider[];
  orders: Order[];
}

export function RiderPortalClient({ riders, orders: initialOrders }: Props) {
  const [activeRiderId, setActiveRiderId] = useState<string>(riders[0]?.id || "");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [claimingOrderId, setClaimingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const activeRider = riders.find((r) => r.id === activeRiderId) || riders[0];

  // Available orders for open pickup (unassigned & not completed/cancelled)
  const availableOrders = orders.filter(
    (o) => (!o.riderId || o.riderId === "") && o.deliveryStatus !== "DELIVERED" && o.deliveryStatus !== "CANCELLED"
  );

  // Active rider's orders
  const riderOrders = orders.filter((o) => o.riderId === activeRiderId);
  const activeOrders = riderOrders.filter(
    (o) => o.deliveryStatus === "ASSIGNED" || o.deliveryStatus === "DELIVERING"
  );
  const completedOrders = riderOrders.filter((o) => o.deliveryStatus === "DELIVERED");

  // Determine initial tab: if no active orders but new orders are waiting, open "available" tab
  const [activeTab, setActiveTab] = useState<"available" | "active" | "history">(() => {
    const hasActive = initialOrders.some(
      (o) => o.riderId === riders[0]?.id && (o.deliveryStatus === "ASSIGNED" || o.deliveryStatus === "DELIVERING")
    );
    const hasAvailable = initialOrders.some(
      (o) => (!o.riderId || o.riderId === "") && o.deliveryStatus !== "DELIVERED" && o.deliveryStatus !== "CANCELLED"
    );
    return !hasActive && hasAvailable ? "available" : "active";
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Rider claims an order
  const handleClaimOrder = async (orderId: string) => {
    if (!activeRiderId) {
      alert("กรุณาเลือกโปรไฟล์ไรเดอร์ก่อนรับงาน");
      return;
    }
    setClaimingOrderId(orderId);
    try {
      const res = await claimOrderByRider(orderId, activeRiderId);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, riderId: activeRiderId, deliveryStatus: "ASSIGNED" }
              : o
          )
        );
        showToast(res.message || "รับออเดอร์สำเร็จ! เริ่มจัดส่งได้เลย", "success");
        setActiveTab("active");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาดในการรับงาน: " + err.message, "error");
    } finally {
      setClaimingOrderId(null);
    }
  };

  // Rider releases an assigned order back to pool
  const handleReleaseOrder = async (orderId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการสละสิทธิ์และคืนออเดอร์นี้กลับสู่รายการรับงานใหม่?")) {
      return;
    }
    setUpdatingOrderId(orderId);
    try {
      const res = await releaseOrderByRider(orderId, activeRiderId);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, riderId: null, deliveryStatus: "PENDING" }
              : o
          )
        );
        showToast(res.message || "คืนออเดอร์สู่รายการรับงานใหม่เรียบร้อยแล้ว", "success");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle status update (Delivering / Delivered)
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await updateOrderDeliveryStatus(orderId, nextStatus);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  deliveryStatus: nextStatus,
                  deliveredAt: nextStatus === "DELIVERED" ? new Date().toISOString() : o.deliveredAt,
                }
              : o
          )
        );
        showToast(
          nextStatus === "DELIVERED" 
            ? "🎉 ยินดีด้วย! จัดส่งสินค้าและปิดงานเรียบร้อยแล้ว" 
            : "🛵 อัปเดตสถานะ: กำลังออกไปส่งสินค้า",
          "success"
        );
        if (nextStatus === "DELIVERED") {
          setActiveTab("history");
        }
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!activeRider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center text-gray-500">
        ไม่พบข้อมูลพนักงานส่งสินค้าในระบบ
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 px-4 w-full max-w-md animate-in fade-in slide-in-from-top duration-300">
          <div
            className={`p-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border ${
              toastMessage.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20"
                : "bg-red-600 text-white border-red-500 shadow-red-900/20"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1 text-xs leading-snug">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Mobile-Container Frame */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-xl border-x border-gray-200">
        {/* Top Header */}
        <header className="bg-[#b90000] text-white p-4 sticky top-0 z-30 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="โลโก้ร้านเกษรบ้านป่าเวียง"
                className="w-9 h-9 rounded-full object-contain bg-white p-0.5 shadow-sm border border-white/60 shrink-0"
              />
              <div>
                <h1 className="font-extrabold text-base leading-tight flex items-center gap-1.5">
                  ระบบไรเดอร์ <span>🛵</span>
                </h1>
                <p className="text-[10px] text-red-200">ร้านเกษรบ้านป่าเวียง</p>
              </div>
            </div>

            <Link
              href="/admin/delivery"
              className="text-[11px] bg-red-900/80 hover:bg-red-900 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors border border-red-700/50"
            >
              หน้าแอดมิน
            </Link>
          </div>

          {/* Rider Profile Switcher Bar */}
          <div className="bg-red-950/40 rounded-2xl p-3 flex items-center justify-between gap-2 border border-red-800/60 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-red-400/40">
                {activeRider.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <select
                  value={activeRiderId}
                  onChange={(e) => setActiveRiderId(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer truncate max-w-[150px] appearance-none underline decoration-dotted decoration-red-400"
                >
                  {riders.map((r) => (
                    <option key={r.id} value={r.id} className="text-gray-900 font-semibold">
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-red-200 truncate">{activeRider.vehicle || "มอเตอร์ไซค์"}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                ⭐ {activeRider.rating.toFixed(1)}
              </span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                {activeRider.completedJobs} งาน
              </span>
            </div>
          </div>
        </header>

        {/* 3-Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-white sticky top-[138px] z-20 shadow-xs">
          {/* Tab 1: รับงานใหม่ */}
          <button
            onClick={() => setActiveTab("available")}
            className={`py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer relative ${
              activeTab === "available"
                ? "border-[#b90000] text-[#b90000] bg-red-50/25"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>รับงานใหม่</span>
            {availableOrders.length > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#b90000] text-white animate-pulse">
                {availableOrders.length}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-gray-100 text-gray-400">
                0
              </span>
            )}
          </button>

          {/* Tab 2: งานที่ต้องส่ง */}
          <button
            onClick={() => setActiveTab("active")}
            className={`py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "active"
                ? "border-[#b90000] text-[#b90000] bg-red-50/25"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>งานที่ต้องส่ง</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "active" ? "bg-[#b90000] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {activeOrders.length}
            </span>
          </button>

          {/* Tab 3: ส่งสำเร็จแล้ว */}
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "history"
                ? "border-[#b90000] text-[#b90000] bg-red-50/25"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>สำเร็จแล้ว</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "history" ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {completedOrders.length}
            </span>
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 space-y-4 bg-gray-50 overflow-y-auto pb-12">
          {/* ========================================================= */}
          {/* TAB 1: Available Orders for Self-Claim                    */}
          {/* ========================================================= */}
          {activeTab === "available" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-3 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-200 shrink-0" />
                  <div>
                    <h2 className="font-extrabold text-xs">งานที่เปิดรับสำหรับไรเดอร์</h2>
                    <p className="text-[10px] text-amber-100">
                      แตะปุ่ม &quot;กดรับออเดอร์นี้&quot; เพื่อรับงานจัดส่งด้วยตัวเองได้ทันที
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full shrink-0">
                  {availableOrders.length} งาน
                </span>
              </div>

              {availableOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200/80 shadow-xs space-y-3">
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                    📦
                  </div>
                  <h3 className="font-bold text-sm text-gray-800">ไม่มีงานใหม่ที่เปิดรับในขณะนี้</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    เมื่อมีลูกค้าสั่งซื้อแบบจัดส่งถึงบ้าน (Delivery) รายการจะปรากฏที่นี่เพื่อให้ไรเดอร์กดรับงานได้ทันที
                  </p>
                </div>
              ) : (
                availableOrders.map((order) => {
                  const isClaiming = claimingOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl shadow-md border-2 border-amber-300 overflow-hidden space-y-3 p-4 transition-all hover:border-amber-400"
                    >
                      {/* Card Header: Order ID & Open Tag */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black text-gray-800 bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                              รอคนส่ง
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            สั่งซื้อ: {new Date(order.createdAt).toLocaleDateString("th-TH")} •{" "}
                            {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            น.
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-gray-900 block">
                            ฿{order.totalAmount.toLocaleString("th-TH")}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น
                          </span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900">{order.customerName}</h4>
                            <p className="text-xs text-gray-500">{order.customerPhone}</p>
                          </div>

                          <a
                            href={`tel:${order.customerPhone}`}
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shrink-0"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>โทร</span>
                          </a>
                        </div>

                        {/* Address */}
                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-1.5">
                          <div className="flex items-start gap-2 text-xs text-gray-800 leading-relaxed">
                            <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span className="font-medium">{order.shippingAddress}</span>
                          </div>

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              order.shippingAddress
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 pt-0.5"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>ดูแผนที่ปลายทาง</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {order.notes && (
                          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100">
                            💬 หมายเหตุ: {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Items Preview */}
                      <div className="py-2 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">
                          รายการสินค้า ({order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น):
                        </span>
                        <div className="space-y-1">
                          {order.items.map((it) => (
                            <div key={it.id} className="text-xs flex justify-between text-gray-700">
                              <span>• {it.productName}</span>
                              <span className="font-bold">x {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Method Badge */}
                      <div className="border-t border-gray-100 pt-2.5">
                        {order.paymentMethod === "COD" ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-bold text-amber-900">
                                เก็บเงินสดปลายทาง (COD)
                              </span>
                            </div>
                            <span className="text-sm font-black text-amber-900">
                              ฿{order.totalAmount.toLocaleString("th-TH")}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-bold text-green-900">
                                ชำระเงินเรียบร้อยแล้ว
                              </span>
                            </div>
                            <span className="text-xs font-bold text-green-800">ไม่ต้องเก็บเงิน</span>
                          </div>
                        )}
                      </div>

                      {/* Primary Claim Action Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleClaimOrder(order.id)}
                          disabled={isClaiming}
                          className="w-full py-3.5 bg-gradient-to-r from-red-600 via-[#b90000] to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isClaiming ? (
                            <>
                              <RotateCw className="w-4 h-4 animate-spin" />
                              <span>กำลังรับงาน...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg">🛵</span>
                              <span>กดรับออเดอร์นี้</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: Active Delivery Tasks for Selected Rider           */}
          {/* ========================================================= */}
          {activeTab === "active" && (
            <div className="space-y-4">
              {activeOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200/80 shadow-xs space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                    🎉
                  </div>
                  <h3 className="font-bold text-sm text-gray-800">ไม่มีงานค้างส่งในขณะนี้</h3>
                  <p className="text-xs text-gray-500">
                    คุณไม่มีงานที่ค้างส่ง สามารถไปที่แท็บ &quot;รับงานใหม่&quot; เพื่อเลือกรับออเดอร์ที่เปิดรับได้
                  </p>
                  {availableOrders.length > 0 && (
                    <button
                      onClick={() => setActiveTab("available")}
                      className="mt-2 inline-flex items-center gap-1.5 bg-[#b90000] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-red-800 transition-colors cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>ดูงานที่เปิดรับ ({availableOrders.length})</span>
                    </button>
                  )}
                </div>
              ) : (
                activeOrders.map((order) => {
                  const isDelivering = order.deliveryStatus === "DELIVERING";
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden space-y-3 p-4"
                    >
                      {/* Card Header: Order ID & Status */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div>
                          <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            เวลาสั่งซื้อ:{" "}
                            {new Date(order.createdAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            น.
                          </span>
                        </div>

                        {isDelivering ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 animate-pulse">
                            <Truck className="w-3 h-3" />
                            <span>กำลังไปส่ง</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                            <Clock className="w-3 h-3" />
                            <span>ได้รับมอบหมายแล้ว</span>
                          </span>
                        )}
                      </div>

                      {/* Customer Info & Action Buttons */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900">{order.customerName}</h4>
                            <p className="text-xs text-gray-500">{order.customerPhone}</p>
                          </div>

                          {/* Call Button */}
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shrink-0"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>โทร</span>
                          </a>
                        </div>

                        {/* Address & Navigation */}
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                          <div className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                            <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span className="font-medium">{order.shippingAddress}</span>
                          </div>

                          {/* Navigation Button */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              order.shippingAddress
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 pt-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>เปิดแผนที่นำทาง (Google Maps)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {order.notes && (
                          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100">
                            💬 หมายเหตุจากลูกค้า: {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Items Preview */}
                      <div className="py-2 border-t border-gray-100">
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">
                          สินค้าที่ต้องจัดส่ง ({order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น):
                        </span>
                        <div className="space-y-1">
                          {order.items.map((it) => (
                            <div key={it.id} className="text-xs flex justify-between text-gray-700">
                              <span>• {it.productName}</span>
                              <span className="font-bold">x {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Alert Box */}
                      <div className="border-t border-gray-100 pt-3">
                        {order.paymentMethod === "COD" ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Banknote className="w-5 h-5 text-amber-600" />
                              <div>
                                <span className="text-xs font-bold text-amber-900 block">
                                  เก็บเงินสดปลายทาง (COD)
                                </span>
                                <span className="text-[10px] text-amber-700">กรุณารับเงินจากลูกค้า</span>
                              </div>
                            </div>
                            <span className="text-base font-black text-amber-900">
                              ฿{order.totalAmount.toLocaleString("th-TH")}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <div>
                                <span className="text-xs font-bold text-green-900 block">
                                  ชำระเงินเรียบร้อยแล้ว
                                </span>
                                <span className="text-[10px] text-green-700">ไม่ต้องเรียกเก็บเงิน</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-green-800">
                              ฿{order.totalAmount.toLocaleString("th-TH")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Rider */}
                      <div className="pt-2 space-y-2">
                        {!isDelivering ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "DELIVERING")}
                              disabled={isUpdating}
                              className="w-full py-3 bg-[#b90000] hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
                            >
                              <Truck className="w-4 h-4" />
                              <span>รับสินค้าจากร้านแล้ว กำลังออกไปส่ง</span>
                            </button>

                            {/* Release back to open pool button */}
                            <button
                              onClick={() => handleReleaseOrder(order.id)}
                              disabled={isUpdating}
                              className="w-full py-2 text-center text-xs font-medium text-gray-500 hover:text-red-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>สละสิทธิ์ / คืนงานใหม่อีกครั้ง</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm("ยืนยันว่าจัดส่งสินค้าถึงมือลูกค้าและได้รับเงินเรียบร้อยแล้ว?")) {
                                handleUpdateStatus(order.id, "DELIVERED");
                              }
                            }}
                            disabled={isUpdating}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>ส่งมอบสินค้าสำเร็จแล้ว (ปิดงาน)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: Completed History                                  */}
          {/* ========================================================= */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {completedOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-200/80 shadow-xs space-y-2">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                    📦
                  </div>
                  <h3 className="font-bold text-sm text-gray-800">ยังไม่มีประวัติการส่งสำเร็จ</h3>
                  <p className="text-xs text-gray-500">
                    รายการสินค้าที่คุณส่งสำเร็จจะแสดงรวบรวมไว้ที่นี่
                  </p>
                </div>
              ) : (
                completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 shadow-2xs border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                          สำเร็จ
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 mt-1">{order.customerName}</p>
                      <p className="text-[10px] text-gray-400">
                        {order.deliveredAt
                          ? new Date(order.deliveredAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) + " น."
                          : "ส่งสำเร็จ"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-gray-900 block">
                        ฿{order.totalAmount.toLocaleString("th-TH")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
