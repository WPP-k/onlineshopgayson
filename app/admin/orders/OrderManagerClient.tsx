"use client";

import { useState } from "react";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  DollarSign, 
  Eye, 
  Trash2, 
  X, 
  Copy, 
  Check, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Calendar,
  ChevronDown,
  Store,
  QrCode,
  ZoomIn,
  AlertCircle,
  FileCheck,
  CreditCard,
  Banknote,
  ExternalLink
} from "lucide-react";
import { updateOrderStatus, deleteOrder, verifyPayment } from "./actions";
import moment from "moment";
import "moment/locale/th";

export interface OrderItemData {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface UserData {
  id: string;
  name: string | null;
  username: string;
  phone: string | null;
  address: string | null;
}

export interface OrderData {
  id: string;
  userId: string | null;
  user: UserData | null;
  totalAmount: number;
  status: string;
  deliveryType?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  notes?: string | null;
  slipImage?: string | null;
  slipUploadedAt?: string | null;
  paymentVerifiedAt?: string | null;
  paymentVerifiedBy?: string | null;
  paymentRejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemData[];
}

interface Props {
  orders: OrderData[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  WAITING_VERIFICATION: {
    label: "รอตรวจสลิปโอนเงิน",
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-300",
    icon: Clock,
  },
  PENDING: {
    label: "รอชำระเงิน",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    icon: Clock,
  },
  PAID: {
    label: "ชำระเงินแล้ว",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Truck,
  },
  DELIVERED: {
    label: "จัดส่งสำเร็จ",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "ยกเลิกแล้ว",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
};

export function OrderManagerClient({ orders }: Props) {
  moment.locale("th");

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingSlipImage, setViewingSlipImage] = useState<string | null>(null);

  // Summary statistics
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const waitingVerificationCount = orders.filter(
    (o) =>
      o.status === "WAITING_VERIFICATION" ||
      ((o.paymentMethod === "PROMPTPAY" || o.paymentMethod === "TRANSFER") && o.status === "PENDING")
  ).length;
  const pendingCount = orders.filter(
    (o) => o.status === "PENDING" && o.paymentMethod !== "PROMPTPAY" && o.paymentMethod !== "TRANSFER"
  ).length;
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  // Filter orders by tab and search
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === "WAITING_VERIFICATION") {
      const isWaiting =
        order.status === "WAITING_VERIFICATION" ||
        ((order.paymentMethod === "PROMPTPAY" || order.paymentMethod === "TRANSFER") && order.status === "PENDING");
      if (!isWaiting) return false;
    } else if (activeTab === "PENDING") {
      // Show pending orders (excluding those with promptpay / transfer waiting for verification)
      if (
        order.status !== "PENDING" ||
        order.paymentMethod === "PROMPTPAY" ||
        order.paymentMethod === "TRANSFER"
      )
        return false;
    } else if (activeTab !== "ALL" && order.status !== activeTab) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchUser =
        order.user?.name?.toLowerCase().includes(q) ||
        order.user?.username?.toLowerCase().includes(q) ||
        order.user?.phone?.toLowerCase().includes(q);
      const matchItems = order.items.some((item) =>
        item.productName.toLowerCase().includes(q)
      );

      return matchId || matchUser || matchItems;
    }

    return true;
  });

  // Handle status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("status", newStatus);

    const res = await updateOrderStatus(formData);
    setIsUpdating(null);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  // Handle verify payment for QR Code / Bank Transfer
  const handleVerifyPayment = async (orderId: string, action: "APPROVE" | "REJECT") => {
    let reason: string | undefined;
    if (action === "REJECT") {
      const input = prompt("กรุณาระบุเหตุผลการปฏิเสธ หรือข้อความแจ้งเตือนลูกค้า (เช่น สลิปไม่ชัด, ยอดเงินไม่ตรง, ยอดไม่เข้า):", "ยอดเงินยังไม่เข้าบัญชีร้าน หรือสลิปไม่ถูกต้อง กรุณาตรวจสอบหรือโอนใหม่อีกครั้ง");
      if (input === null) return; // user cancelled prompt
      reason = input.trim();
    }

    setIsUpdating(orderId);
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("action", action);
    if (reason) formData.set("rejectReason", reason);

    const res = await verifyPayment(formData);
    setIsUpdating(null);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      const newStatus = action === "APPROVE" ? "PAID" : "PENDING";
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          paymentVerifiedAt: action === "APPROVE" ? new Date().toISOString() : null,
          paymentVerifiedBy: action === "APPROVE" ? "Admin" : null,
          paymentRejectReason: action === "REJECT" ? (reason || "สลิปไม่ถูกต้อง หรือยอดเงินยังไม่เข้าบัญชี") : null,
        });
      }
      alert(action === "APPROVE" ? "✅ อนุมัติการชำระเงินเรียบร้อยแล้ว (เปลี่ยนสถานะเป็น ชำระแล้ว)" : "แจ้งปฏิเสธสลิปเรียบร้อยแล้ว");
    }
  };

  // Handle order deletion
  const handleDeleteOrder = async (order: OrderData) => {
    if (
      confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งซื้อ #${order.id.slice(-6).toUpperCase()}? การลบนี้จะไม่สามารถย้อนกลับได้`
      )
    ) {
      const formData = new FormData();
      formData.set("orderId", order.id);
      const res = await deleteOrder(formData);
      if (res?.error) {
        alert("เกิดข้อผิดพลาด: " + res.error);
      } else {
        alert("ลบคำสั่งซื้อเรียบร้อยแล้ว");
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(null);
        }
      }
    }
  };

  // Copy order ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-[#b90000]" />
            จัดการคำสั่งซื้อ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ติดตามรายการสั่งซื้อ ตรวจสอบสลิปการโอน QR Code และพิมพ์ใบเสร็จ/ใบปะหน้าพัสดุ
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#b90000] flex items-center justify-center font-bold">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 block">ออเดอร์ทั้งหมด</span>
            <span className="text-2xl font-extrabold text-gray-900">{totalOrders}</span>
          </div>
        </div>

        {/* Waiting Verification (QR PromptPay) */}
        <div 
          onClick={() => setActiveTab("WAITING_VERIFICATION")}
          className={`p-5 rounded-2xl shadow-xs border transition-all cursor-pointer flex items-center gap-4 ${
            waitingVerificationCount > 0 
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-200" 
              : "bg-white border-gray-100"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            waitingVerificationCount > 0 ? "bg-amber-500 text-white animate-pulse" : "bg-amber-50 text-amber-600"
          }`}>
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-800 block">รอตรวจสลิป QR</span>
              {waitingVerificationCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </div>
            <span className="text-2xl font-black text-amber-700">{waitingVerificationCount}</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 block">ยอดขายสุทธิ</span>
            <span className="text-2xl font-extrabold text-green-600">
              ฿{totalRevenue.toLocaleString("th-TH")}
            </span>
          </div>
        </div>

        {/* Pending Cash */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 block">รอชำระเงิน</span>
            <span className="text-2xl font-extrabold text-yellow-600">{pendingCount}</span>
          </div>
        </div>

        {/* Shipped & Delivered */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 block">กำลังจัดส่ง / สำเร็จ</span>
            <span className="text-2xl font-extrabold text-purple-600">
              {shippedCount + deliveredCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { key: "ALL", label: "ทั้งหมด", count: totalOrders },
              { key: "WAITING_VERIFICATION", label: "🔔 รอตรวจยอดเงินโอน", count: waitingVerificationCount, alert: waitingVerificationCount > 0 },
              { key: "PENDING", label: "รอชำระ", count: pendingCount },
              { key: "PAID", label: "ชำระแล้ว", count: paidCount },
              { key: "SHIPPED", label: "จัดส่งแล้ว", count: shippedCount },
              { key: "DELIVERED", label: "สำเร็จ", count: deliveredCount },
              { key: "CANCELLED", label: "ยกเลิก", count: orders.filter((o) => o.status === "CANCELLED").length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-[#b90000] text-white shadow-xs"
                    : tab.alert
                    ? "bg-amber-100 text-amber-900 border border-amber-300 font-black animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.key ? "bg-red-800 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสคำสั่งซื้อ, ลูกค้า, สินค้า..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">รหัสคำสั่งซื้อ</th>
                <th className="p-4">วันที่สั่งซื้อ</th>
                <th className="p-4">ลูกค้า / ผู้รับ</th>
                <th className="p-4">การชำระเงิน / สลิป</th>
                <th className="p-4">รายการสินค้า</th>
                <th className="p-4 text-right">ยอดรวม</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = cfg.icon;
                const totalItemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <tr key={order.id} className="hover:bg-red-50/20 transition-colors">
                    {/* Order ID */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(order.id)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded cursor-pointer transition-colors"
                          title="คัดลอกรหัสเต็ม"
                        >
                          {copiedId === order.id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                      <div>{moment(order.createdAt).format("LL")}</div>
                      <div className="text-gray-400 text-[11px]">
                        {moment(order.createdAt).format("HH:mm น.")}
                      </div>
                    </td>

                    {/* Customer & Fulfillment */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">
                          {order.customerName || order.user?.name || order.user?.username || "ลูกค้าทั่วไป"}
                        </span>
                        {order.deliveryType === "PICKUP" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            <Store className="w-3 h-3" />
                            <span>รับหน้าร้าน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#b90000] border border-red-200 shrink-0">
                            <Truck className="w-3 h-3" />
                            <span>จัดส่งถึงที่</span>
                          </span>
                        )}
                      </div>
                      {(order.customerPhone || order.user?.phone) && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{order.customerPhone || order.user?.phone}</span>
                        </div>
                      )}
                      {order.deliveryType === "PICKUP" && order.pickupTime && (
                        <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>เวลารับ: {order.pickupTime}</span>
                        </div>
                      )}
                      {order.deliveryType !== "PICKUP" && (order.shippingAddress || order.user?.address) && (
                        <div className="text-[11px] text-gray-500 flex flex-col items-start gap-1 mt-0.5 max-w-[220px]" title={order.shippingAddress || order.user?.address || ""}>
                          <div className="flex items-start gap-1 truncate w-full">
                            <MapPin className="w-3 h-3 shrink-0 text-gray-400 mt-0.5" />
                            <span className="truncate">{order.shippingAddress || order.user?.address}</span>
                          </div>
                          {(order.latitude && order.longitude) && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:underline flex items-center gap-1 font-medium bg-blue-50 px-1.5 py-0.5 rounded"
                              onClick={(e) => e.stopPropagation()}
                            >
                              📍 พิกัด GPS
                            </a>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Payment & Slip Column */}
                    <td className="p-4">
                      <div className="space-y-1">
                        {order.paymentMethod === "PROMPTPAY" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <QrCode className="w-3 h-3" />
                            <span>PromptPay QR</span>
                          </span>
                        ) : order.paymentMethod === "TRANSFER" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            <CreditCard className="w-3 h-3" />
                            <span>โอนเงินผ่านบัญชี</span>
                          </span>
                        ) : order.paymentMethod === "COD" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            <Banknote className="w-3 h-3" />
                            <span>เก็บเงินปลายทาง</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Banknote className="w-3 h-3" />
                            <span>เงินสดหน้าร้าน</span>
                          </span>
                        )}

                        {/* Slip badge */}
                        {order.slipImage ? (
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingSlipImage(order.slipImage!);
                              }}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                order.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 animate-pulse"
                              }`}
                              title="คลิกเพื่อดูสลิปโอนเงิน"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>{order.status === "PAID" ? "ดูสลิปที่อนุมัติ" : "📷 มีสลิป (ตรวจเงิน)"}</span>
                            </button>
                          </div>
                        ) : (order.paymentMethod === "PROMPTPAY" || order.paymentMethod === "TRANSFER") && order.status !== "PAID" ? (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block font-medium">
                            รอตรวจยอดเข้า K+
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="p-4">
                      <div className="text-xs text-gray-700 font-medium">
                        {order.items.length > 0 ? (
                          <span>
                            {order.items[0].productName}
                            {order.items.length > 1 && (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                + อีก {order.items.length - 1} รายการ
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        รวม {totalItemsCount} ชิ้น
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 text-right">
                      <span className="font-extrabold text-sm text-green-600">
                        ฿{order.totalAmount.toLocaleString("th-TH")}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-4 text-center">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          disabled={isUpdating === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`appearance-none text-xs font-bold px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none transition-all ${cfg.bg} ${cfg.text} ${cfg.border} disabled:opacity-50`}
                        >
                          <option value="WAITING_VERIFICATION">รอตรวจเงินโอน</option>
                          <option value="PENDING">รอชำระเงิน</option>
                          <option value="PAID">ชำระเงินแล้ว</option>
                          <option value="SHIPPED">จัดส่งแล้ว</option>
                          <option value="DELIVERED">จัดส่งสำเร็จ</option>
                          <option value="CANCELLED">ยกเลิกแล้ว</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.status === "WAITING_VERIFICATION" && (
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(order.id, "APPROVE")}
                            disabled={isUpdating === order.id}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                            title="ตรวจเงินเข้าแล้ว - คลิกเพื่อยืนยันการสั่งซื้อ"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ยืนยันการสั่งซื้อ</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ดูรายละเอียด & พิมพ์ใบเสร็จ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบคำสั่งซื้อ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    ไม่พบคำสั่งซื้อตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Print Modal (Printable receipt / packing slip) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    รายละเอียดคำสั่งซื้อ #{selectedOrder.id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-gray-500">
                    รหัสเต็ม: <span className="font-mono">{selectedOrder.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Area */}
            <div id="printable-order" className="p-6 sm:p-8 overflow-y-auto flex-1 text-gray-900">
              {/* Store & Receipt Title (for print) */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#b90000]">MY-SHOP STORE</h2>
                    <p className="text-xs text-gray-500 mt-0.5">ใบเสร็จรับเงิน / ใบส่งสินค้า (Receipt & Slip)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-gray-800">
                      #{selectedOrder.id.slice(-6).toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {moment(selectedOrder.createdAt).format("LL [เวลา] HH:mm น.")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-gray-500" /> ข้อมูลผู้สั่งซื้อ / ผู้รับ
                  </h4>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.customerName || selectedOrder.user?.name || selectedOrder.user?.username || "ลูกค้าทั่วไป"}
                  </p>
                  {(selectedOrder.customerPhone || selectedOrder.user?.phone) && (
                    <p className="text-gray-600 mt-0.5">
                      เบอร์โทร: <span className="font-mono font-medium">{selectedOrder.customerPhone || selectedOrder.user?.phone}</span>
                    </p>
                  )}
                  {selectedOrder.user?.username && (
                    <p className="text-gray-400 mt-0.5">
                      บัญชี: @{selectedOrder.user.username}
                    </p>
                  )}
                  {selectedOrder.notes && (
                    <p className="text-amber-700 mt-1 bg-amber-50 p-1.5 rounded border border-amber-100">
                      📝 หมายเหตุ: {selectedOrder.notes}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                    {selectedOrder.deliveryType === "PICKUP" ? (
                      <>
                        <Store className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-blue-700">รูปแบบ: รับสินค้าที่หน้าร้าน</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-[#b90000]" />
                        <span className="text-[#b90000]">รูปแบบ: จัดส่งถึงที่ (Delivery)</span>
                      </>
                    )}
                  </h4>
                  {selectedOrder.deliveryType === "PICKUP" ? (
                    <div className="space-y-1 text-gray-700">
                      <p>📍 จุดรับ: ร้านเกษรบ้านป่าเวียง</p>
                      {selectedOrder.pickupTime && (
                        <p className="font-medium text-blue-700">🕒 เวลานัดรับ: {selectedOrder.pickupTime}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedOrder.shippingAddress || selectedOrder.user?.address || "ไม่ระบุที่อยู่จัดส่ง"}
                      </p>
                      {(selectedOrder.latitude && selectedOrder.longitude) && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.latitude},${selectedOrder.longitude}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b90000] hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          ดูพิกัดบน Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Verification Box for QR Code PromptPay or Transfer (hidden when printing) */}
              {(selectedOrder.paymentMethod === "PROMPTPAY" || selectedOrder.paymentMethod === "TRANSFER" || selectedOrder.slipImage) && (
                <div className="mb-6 p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 print:hidden space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                          <span>
                            ตรวจสอบการโอนเงิน ({selectedOrder.paymentMethod === "TRANSFER" ? "โอนผ่านธนาคาร กสิกรไทย" : "QR Code พร้อมเพย์"})
                          </span>
                        </h4>
                        <p className="text-xs text-amber-800">
                          {selectedOrder.status === "PAID"
                            ? "✅ แอดมินตรวจสอบและยืนยันยอดเงินเข้าบัญชีเรียบร้อยแล้ว"
                            : "⚠️ ลูกค้าโอนเงินเข้าบัญชี กรุณาตรวจสอบยอดเงินเข้าในแอปธนาคาร K-Plus ก่อนอนุมัติ"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {selectedOrder.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ตรวจสอบผ่านแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-200 text-amber-900 text-xs font-black rounded-full border border-amber-400 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>รอแอดมินตรวจเงินเข้า</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account detail & Total Amount check */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-amber-200 text-xs">
                    <div className="space-y-1">
                      <span className="text-gray-500 font-medium block">บัญชีปลายทางที่เงินควรเข้า:</span>
                      <span className="font-bold text-gray-900 text-sm block">นาย วัชรพงษ์พันธ์ กัญญา</span>
                      <div className="text-gray-700 font-medium">
                        ธนาคารกสิกรไทย (K+) เลขที่ <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">179-1-03272-1</span>
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        พร้อมเพย์: <span className="font-mono">004999204835549</span>
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4 space-y-1">
                      <span className="text-gray-500 font-medium block">ยอดเงินที่ต้องตรงกัน:</span>
                      <span className="text-2xl font-black text-[#b90000] block">
                        ฿{selectedOrder.totalAmount.toLocaleString("th-TH")}
                      </span>
                      {selectedOrder.slipUploadedAt && (
                        <span className="text-[11px] text-gray-500 block">
                          แนบสลิป: {moment(selectedOrder.slipUploadedAt).format("D MMM YYYY [เวลา] HH:mm น.")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slip Preview and Action Buttons */}
                  {selectedOrder.slipImage ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
                      <div
                        className="relative group cursor-pointer w-32 h-44 bg-gray-100 rounded-xl overflow-hidden border border-gray-300 shrink-0 shadow-sm"
                        onClick={() => setViewingSlipImage(selectedOrder.slipImage!)}
                      >
                        <img
                          src={selectedOrder.slipImage}
                          alt="สลิปโอนเงิน"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                          <ZoomIn className="w-5 h-5" />
                          <span>ดูรูปสลิปใหญ่</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 w-full">
                        <div>
                          <h5 className="font-bold text-gray-800 text-sm">สลิปหลักฐานการโอนเงินของลูกค้า</h5>
                          <p className="text-xs text-gray-500">
                            คลิกที่รูปภาพเพื่อเปิดดูสลิปขนาดใหญ่ และเปรียบเทียบกับยอดเงินในแอปธนาคาร
                          </p>
                        </div>

                        {/* Admin Action Buttons */}
                        {selectedOrder.status !== "PAID" && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(selectedOrder.id, "APPROVE")}
                              disabled={isUpdating === selectedOrder.id}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>ตรวจสลิปแล้ว - ยืนยันการสั่งซื้อ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(selectedOrder.id, "REJECT")}
                              disabled={isUpdating === selectedOrder.id}
                              className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>ปฏิเสธสลิป / แจ้งโอนใหม่</span>
                            </button>
                          </div>
                        )}

                        {selectedOrder.paymentVerifiedAt && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 inline-block font-medium">
                            ✅ ได้รับการยืนยันเงินเข้าเมื่อ {moment(selectedOrder.paymentVerifiedAt).format("D MMM YYYY HH:mm น.")} โดย {selectedOrder.paymentVerifiedBy || "Admin"}
                          </div>
                        )}

                        {selectedOrder.paymentRejectReason && (
                          <div className="text-[11px] text-red-800 bg-red-50 px-3 py-2 rounded-xl border border-red-200 block font-medium">
                            ❌ สาเหตุที่ปฏิเสธ: {selectedOrder.paymentRejectReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-amber-300 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            รอตรวจสอบยอดเงินโอนเข้าบัญชีกสิกรไทย (179-1-03272-1)
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                            กรุณาเปิดแอปธนาคารกสิกรไทย (K-Plus) และตรวจเช็คว่ามียอดเงินโอนเข้า <span className="font-bold text-[#b90000]">฿{selectedOrder.totalAmount.toLocaleString("th-TH")}</span> ในบัญชี <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1 rounded">179-1-03272-1</span> หรือยัง
                          </p>
                        </div>
                      </div>

                      {selectedOrder.status !== "PAID" && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(selectedOrder.id, "APPROVE")}
                            disabled={isUpdating === selectedOrder.id}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ตรวจเงินเข้าแล้ว - ยืนยันการสั่งซื้อ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(selectedOrder.id, "REJECT")}
                            disabled={isUpdating === selectedOrder.id}
                            className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>ไม่พบยอดเงินเข้า / ยกเลิก</span>
                          </button>
                        </div>
                      )}

                      {selectedOrder.paymentVerifiedAt && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 block font-medium">
                          ✅ ได้รับการยืนยันเงินเข้าเมื่อ {moment(selectedOrder.paymentVerifiedAt).format("D MMM YYYY HH:mm น.")} โดย {selectedOrder.paymentVerifiedBy || "Admin"}
                        </div>
                      )}

                      {selectedOrder.paymentRejectReason && (
                        <div className="text-[11px] text-red-800 bg-red-50 px-3 py-2 rounded-xl border border-red-200 block font-medium">
                          ❌ สาเหตุที่ปฏิเสธ: {selectedOrder.paymentRejectReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Order Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                    <tr>
                      <th className="p-3">สินค้า</th>
                      <th className="p-3 text-right">ราคาต่อชิ้น</th>
                      <th className="p-3 text-center">จำนวน</th>
                      <th className="p-3 text-right">รวมเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-3 font-medium text-gray-800">{item.productName}</td>
                        <td className="p-3 text-right">฿{item.price.toLocaleString("th-TH")}</td>
                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-gray-600">
                        ยอดรวมสุทธิ (Net Total):
                      </td>
                      <td className="p-3 text-right text-base text-[#b90000]">
                        ฿{selectedOrder.totalAmount.toLocaleString("th-TH")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Status Update inside Modal (hidden when printed) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">สถานะคำสั่งซื้อ:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#b90000]"
                  >
                    <option value="WAITING_VERIFICATION">รอตรวจสลิปโอนเงิน (Waiting Verification)</option>
                    <option value="PENDING">รอชำระเงิน (Pending)</option>
                    <option value="PAID">ชำระเงินแล้ว (Paid)</option>
                    <option value="SHIPPED">จัดส่งแล้ว (Shipped)</option>
                    <option value="DELIVERED">จัดส่งสำเร็จ (Delivered)</option>
                    <option value="CANCELLED">ยกเลิกแล้ว (Cancelled)</option>
                  </select>
                </div>

                <span className="text-xs text-gray-400">
                  อัปเดตล่าสุด: {moment(selectedOrder.updatedAt).fromNow()}
                </span>
              </div>
            </div>

            {/* Modal Footer (Action buttons) */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#b90000] hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบเสร็จ / ใบปะหน้า</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Viewing Slip Image */}
      {viewingSlipImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setViewingSlipImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#b90000]" />
                สลิปหลักฐานการโอนเงิน
              </span>
              <button
                type="button"
                onClick={() => setViewingSlipImage(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-gray-900/5">
              <img 
                src={viewingSlipImage} 
                alt="สลิปการโอนเงินขนาดใหญ่" 
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow"
              />
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>ตรวจสอบ วันที่, เวลา, ชื่อบัญชี และยอดโอนให้ตรงกับรายการสั่งซื้อ</span>
              <button
                type="button"
                onClick={() => setViewingSlipImage(null)}
                className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
