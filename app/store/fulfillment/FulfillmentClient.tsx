"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Barcode } from "@/components/Barcode";
import {
  FulfillmentOrder,
  FulfillmentOrderItem,
  updateFulfillmentOrderStatus,
} from "./actions";
import {
  Store,
  Truck,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  RefreshCw,
  ScanLine,
  ChevronRight,
  Package,
  Layers,
  MapPin,
  Calendar,
  X,
  Tablet,
  Check,
  Home,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import moment from "moment";
import "moment/locale/th";

moment.locale("th");

interface Props {
  initialOrders: FulfillmentOrder[];
}

export function FulfillmentClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<FulfillmentOrder[]>(initialOrders);
  const [filterTab, setFilterTab] = useState<"NEW" | "PICKING" | "READY" | "ALL">("NEW");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<"ALL" | "DELIVERY" | "PICKUP">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pick checklist state: mapping orderId -> set of picked item IDs
  const [pickedItems, setPickedItems] = useState<Record<string, Record<string, boolean>>>({});

  // Barcode Zoom Modal
  const [zoomedBarcode, setZoomedBarcode] = useState<{
    value: string;
    title: string;
    subtitle?: string;
    quantity?: number;
  } | null>(null);

  // Real-time clock on iPad
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const update = () => setCurrentTime(moment().format("HH:mm:ss"));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh orders every 20 seconds for store display
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/store/fulfillment-orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
      }
    } catch (e) {
      console.warn("Refresh failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Toggle item picked checkbox
  const toggleItemPicked = (orderId: string, itemId: string) => {
    setPickedItems((prev) => {
      const orderPicked = { ...(prev[orderId] || {}) };
      orderPicked[itemId] = !orderPicked[itemId];
      return { ...prev, [orderId]: orderPicked };
    });
  };

  // Mark Order as "กำลังจัดเตรียม" (PICKING) or "จัดของเสร็จแล้ว / พร้อมส่ง" (READY)
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
    newDeliveryStatus?: string
  ) => {
    const res = await updateFulfillmentOrderStatus(orderId, newStatus, newDeliveryStatus);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                deliveryStatus: newDeliveryStatus || o.deliveryStatus,
              }
            : o
        )
      );
    } else {
      alert("ไม่สามารถปรับสถานะได้: " + res.error);
    }
  };

  // Filter orders based on status & delivery type
  const filteredOrders = orders.filter((o) => {
    // Delivery Type filter
    if (deliveryTypeFilter !== "ALL" && o.deliveryType !== deliveryTypeFilter) {
      return false;
    }

    // Status Tab filter
    if (filterTab === "NEW") {
      return (
        (o.status === "PENDING" || o.status === "PAID") &&
        o.deliveryStatus !== "PICKING" &&
        o.deliveryStatus !== "READY_FOR_PICKUP" &&
        o.deliveryStatus !== "DELIVERED"
      );
    }
    if (filterTab === "PICKING") {
      return (
        (o.deliveryStatus === "PICKING" || o.deliveryStatus === "ASSIGNED") &&
        o.status !== "DELIVERED"
      );
    }
    if (filterTab === "READY") {
      return (
        (o.deliveryStatus === "READY_FOR_PICKUP" ||
          o.deliveryStatus === "DELIVERING" ||
          o.status === "SHIPPED") &&
        o.status !== "DELIVERED" &&
        o.deliveryStatus !== "DELIVERED"
      );
    }
    return true; // ALL
  });

  const countNew = orders.filter(
    (o) =>
      (deliveryTypeFilter === "ALL" || o.deliveryType === deliveryTypeFilter) &&
      (o.status === "PENDING" || o.status === "PAID") &&
      o.deliveryStatus !== "PICKING" &&
      o.deliveryStatus !== "READY_FOR_PICKUP" &&
      o.deliveryStatus !== "DELIVERED"
  ).length;

  const countPicking = orders.filter(
    (o) =>
      (deliveryTypeFilter === "ALL" || o.deliveryType === deliveryTypeFilter) &&
      (o.deliveryStatus === "PICKING" || o.deliveryStatus === "ASSIGNED") &&
      o.status !== "DELIVERED"
  ).length;

  const countReady = orders.filter(
    (o) =>
      (deliveryTypeFilter === "ALL" || o.deliveryType === deliveryTypeFilter) &&
      (o.deliveryStatus === "READY_FOR_PICKUP" ||
        o.deliveryStatus === "DELIVERING" ||
        o.status === "SHIPPED") &&
      o.status !== "DELIVERED" &&
      o.deliveryStatus !== "DELIVERED"
  ).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* 1. Header Bar: iPad / Store Mode */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                  จอหน้าร้าน / iPad FULFILLMENT
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ระบบจัดการออเดอร์ขายออนไลน์ & แสดงบาร์โค้ดสินค้าประจำหน้าร้าน
              </p>
            </div>
          </div>

          {/* Clock & Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-amber-400 font-mono text-sm font-bold shadow-inner">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{currentTime || "00:00:00"}</span>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors shadow-sm"
              title="รีเฟรชข้อมูลออเดอร์"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>

            {/* Quick Switch to Handheld Terminal */}
            <Link
              href="/handheld"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
              title="สลับไปโหมดเครื่อง Handheld"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">เครื่อง Handheld</span>
            </Link>

            {/* Back to Admin */}
            <Link
              href="/admin/orders"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors"
              title="ระบบจัดการคำสั่งซื้อหลังบ้าน"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Filter & Navigation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 sticky top-[57px] z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterTab("NEW")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterTab === "NEW"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>รอหยิบสินค้า</span>
              {countNew > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterTab === "NEW" ? "bg-slate-950 text-amber-400" : "bg-red-500 text-white"
                  }`}
                >
                  {countNew}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab("PICKING")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterTab === "PICKING"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>กำลังจัดของ</span>
              {countPicking > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterTab === "PICKING" ? "bg-slate-950 text-blue-300" : "bg-blue-500 text-white"
                  }`}
                >
                  {countPicking}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab("READY")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                filterTab === "READY"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>
                {deliveryTypeFilter === "PICKUP"
                  ? "พร้อมให้รับหน้าร้าน"
                  : deliveryTypeFilter === "DELIVERY"
                  ? "พร้อมส่งมอบ"
                  : "พร้อมส่งมอบ / รับหน้าร้าน"}
              </span>
              {countReady > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterTab === "READY" ? "bg-slate-950 text-emerald-300" : "bg-emerald-500 text-white"
                  }`}
                >
                  {countReady}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterTab === "ALL"
                  ? "bg-slate-700 text-white shadow-md"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              ทั้งหมด ({orders.length})
            </button>
          </div>

          {/* Delivery Type Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end sm:self-auto text-xs">
            <button
              onClick={() => setDeliveryTypeFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                deliveryTypeFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ทุกช่องทาง
            </button>
            <button
              onClick={() => setDeliveryTypeFilter("DELIVERY")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                deliveryTypeFilter === "DELIVERY"
                  ? "bg-red-950 text-red-300 border border-red-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>ส่งถึงที่</span>
            </button>
            <button
              onClick={() => setDeliveryTypeFilter("PICKUP")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                deliveryTypeFilter === "PICKUP"
                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Store className="w-3 h-3" />
              <span>รับหน้าร้าน</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Order Cards List */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-800/40 rounded-3xl border border-slate-800 p-16 text-center flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-300 mb-1">
              ไม่มีออเดอร์ในหมวดหมู่นี้
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              เมื่อมีลูกค้าสั่งซื้อสินค้าออนไลน์ ออเดอร์และบาร์โค้ดสินค้าจะปรากฏที่หน้านี้โดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const isDelivery = order.deliveryType === "DELIVERY";
              const orderPickMap = pickedItems[order.id] || {};
              const pickedCount = order.items.filter((item) => orderPickMap[item.id]).length;
              const allPicked = order.items.length > 0 && pickedCount === order.items.length;

              return (
                <div
                  key={order.id}
                  className={`bg-slate-800/90 rounded-3xl border-2 transition-all shadow-xl overflow-hidden flex flex-col ${
                    allPicked
                      ? "border-emerald-500/70 ring-1 ring-emerald-500/30"
                      : "border-slate-700/80 hover:border-slate-600"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-slate-900/80 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Order Info & Badges */}
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                            isDelivery
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isDelivery ? <Truck className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                          <span>{isDelivery ? "ส่งถึงที่ (Delivery)" : "รับหน้าร้าน (Store Pickup)"}</span>
                        </span>

                        {order.status === "DELIVERED" || order.deliveryStatus === "DELIVERED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{isDelivery ? "จัดส่งสำเร็จแล้ว" : "ลูกค้ารับสินค้าแล้ว"}</span>
                          </span>
                        ) : order.deliveryStatus === "READY_FOR_PICKUP" || order.status === "SHIPPED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{isDelivery ? "พร้อมส่งมอบ (รอไรเดอร์)" : "พร้อมให้รับหน้าร้าน"}</span>
                          </span>
                        ) : order.deliveryStatus === "PICKING" ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                            <span>กำลังจัดของ</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            รอเริ่มจัดของ
                          </span>
                        )}

                        <span className="text-xs font-mono text-slate-400">
                          {moment(order.createdAt).format("HH:mm น.")}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>ลูกค้า: {order.customerName || "ลูกค้าทั่วไป"}</span>
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="text-xs text-blue-400 hover:underline font-mono flex items-center gap-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.customerPhone}</span>
                          </a>
                        )}
                      </div>

                      {order.pickupTime && (
                        <p className="text-xs text-amber-300/90 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>เวลามารับ: {order.pickupTime}</span>
                        </p>
                      )}

                      {isDelivery && order.shippingAddress && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="truncate">{order.shippingAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* Right: หมายเลขคำสั่งซื้อ */}
                    <div className="flex flex-col sm:items-end items-start shrink-0">
                      <div className="bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs flex flex-col sm:items-end items-start">
                        <span className="text-[11px] text-slate-400 font-medium">
                          หมายเลขคำสั่งซื้อ
                        </span>
                        <span className="text-sm sm:text-base font-black font-mono text-white tracking-wider">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Items List with Barcodes */}
                  <div className="p-4 sm:p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-1 border-b border-slate-700/60">
                      <span>รายการสินค้าที่ต้องหยิบ ({order.items.length} รายการ)</span>
                      <div className="flex items-center gap-2">
                        <span className={allPicked ? "text-emerald-400" : "text-slate-400"}>
                          หยิบแล้ว {pickedCount}/{order.items.length}
                        </span>
                        {!allPicked && order.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const map: Record<string, boolean> = {};
                              order.items.forEach((i) => {
                                map[i.id] = true;
                              });
                              setPickedItems((prev) => ({ ...prev, [order.id]: map }));
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            หยิบทั้งหมด
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const isPicked = !!orderPickMap[item.id];

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isPicked
                                ? "bg-emerald-950/20 border-emerald-600/40 opacity-80"
                                : "bg-slate-900/60 border-slate-700"
                            }`}
                          >
                            {/* Product Info & Checkbox */}
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleItemPicked(order.id, item.id)}
                                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                                  isPicked
                                    ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                                    : "bg-slate-800 border-slate-600 text-transparent hover:border-emerald-500"
                                }`}
                                title={isPicked ? "ยกเลิก" : "ทำเครื่องหมายว่าหยิบแล้ว"}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </button>

                              <div className="w-12 h-12 rounded-xl bg-black border border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
                                {item.image?.startsWith("http") || item.image?.startsWith("data:image") ? (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl select-none">
                                    {item.image || "📦"}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h4
                                  className={`text-sm font-bold truncate leading-tight ${
                                    isPicked ? "line-through text-slate-400" : "text-white"
                                  }`}
                                >
                                  {item.productName}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-mono text-amber-400 font-bold">
                                    ฿{item.price.toLocaleString()}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    SKU: {item.sku}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quantity & Barcode Display */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                              {/* Big Quantity Badge */}
                              <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black px-3 py-1 rounded-xl text-sm font-mono shrink-0">
                                x {item.quantity}
                              </div>

                              {/* Barcode Render for Handheld Gun Scanning! */}
                              <div
                                onClick={() =>
                                  setZoomedBarcode({
                                    value: item.sku,
                                    title: item.productName,
                                    subtitle: `SKU: ${item.sku}`,
                                    quantity: item.quantity,
                                  })
                                }
                                className="bg-white p-1 rounded-xl border border-slate-300 shadow-md cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all flex flex-col items-center"
                                title="คลิกเพื่อขยายบาร์โค้ดเต็มจอ"
                              >
                                <Barcode
                                  value={item.sku}
                                  height={26}
                                  width={1.2}
                                  fontSize={9}
                                  className="bg-transparent border-0 shadow-none"
                                />
                                <span className="text-[9px] text-slate-500 font-sans flex items-center gap-0.5">
                                  <Maximize2 className="w-2.5 h-2.5" /> แตะขยาย
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer: Summary & Fulfillment Actions */}
                  <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-xs text-slate-400">ยอดรวมทั้งสิ้น:</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        ฿{order.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({order.paymentMethod === "COD" ? "เก็บเงินปลายทาง" : "ชำระเงินแล้ว"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                      {/* State A: Delivered / Completed */}
                      {order.status === "DELIVERED" || order.deliveryStatus === "DELIVERED" ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/50 px-3.5 py-2 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{isDelivery ? "จัดส่งสำเร็จเรียบร้อยแล้ว" : "ลูกค้ารับสินค้าเรียบร้อยแล้ว"}</span>
                        </div>
                      ) : order.deliveryStatus === "READY_FOR_PICKUP" || order.status === "SHIPPED" ? (
                        /* State B: Ready (พร้อมให้รับหน้าร้าน / พร้อมส่งมอบ) */
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "PAID", "PICKING")}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border border-slate-700"
                            title="ย้อนกลับไปสถานะกำลังจัดของ"
                          >
                            จัดของใหม่
                          </button>

                          {!isDelivery ? (
                            /* Store Pickup: Handed over to customer */
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED", "DELIVERED")}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 cursor-pointer flex items-center gap-1.5 ring-2 ring-emerald-400/50 hover:scale-[1.02]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ ลูกค้ารับสินค้าแล้ว (เสร็จสิ้น)</span>
                            </button>
                          ) : (
                            /* Delivery: Handed over to rider */
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED", "DELIVERED")}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <Truck className="w-4 h-4" />
                              <span>✓ ส่งมอบสินค้าให้ไรเดอร์แล้ว</span>
                            </button>
                          )}
                        </>
                      ) : (
                        /* State C: New or Picking (รอจัดของ / กำลังจัดของ) */
                        <>
                          {order.deliveryStatus !== "PICKING" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.id, order.status, "PICKING")}
                              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>กำลังจัดของ</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order.id,
                                "SHIPPED",
                                "READY_FOR_PICKUP"
                              )
                            }
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                              allPicked
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400"
                                : "bg-amber-600 hover:bg-amber-500 text-slate-950 font-black"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isDelivery
                                ? allPicked
                                  ? "✓ หยิบครบแล้ว (พร้อมส่งมอบ)"
                                  : "จัดของเสร็จสิ้น (พร้อมส่ง)"
                                : allPicked
                                ? "✓ หยิบครบแล้ว (พร้อมให้รับหน้าร้าน)"
                                : "จัดของเสร็จสิ้น (พร้อมให้รับหน้าร้าน)"}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. MODAL: Full-screen High-Contrast Barcode Zoom */}
      {zoomedBarcode && (
        <div
          onClick={() => setZoomedBarcode(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 border-4 border-slate-300"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                สแกนบาร์โค้ดผ่านหน้าจอ (Barcode Scanner)
              </span>
              <button
                type="button"
                onClick={() => setZoomedBarcode(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Product Title / Quantity */}
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {zoomedBarcode.title}
              </h3>
              {zoomedBarcode.subtitle && (
                <p className="text-xs font-mono text-slate-500">{zoomedBarcode.subtitle}</p>
              )}
              {zoomedBarcode.quantity && (
                <div className="inline-block bg-amber-500 text-slate-950 font-black text-sm px-3 py-0.5 rounded-full mt-1">
                  จำนวนที่สั่ง: x {zoomedBarcode.quantity} ชิ้น
                </div>
              )}
            </div>

            {/* Giant High-Contrast Barcode */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 flex justify-center shadow-inner py-6">
              <Barcode
                value={zoomedBarcode.value}
                height={75}
                width={2.2}
                fontSize={16}
                className="w-full flex justify-center bg-transparent border-0 shadow-none"
              />
            </div>

            <p className="text-xs text-slate-500">
              * จอภาพได้รับการปรับความสว่างและขอบขาวให้เครื่อง Handheld / หัวอ่านเลเซอร์ยิงได้แม่นยำที่สุด
            </p>

            <button
              type="button"
              onClick={() => setZoomedBarcode(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
