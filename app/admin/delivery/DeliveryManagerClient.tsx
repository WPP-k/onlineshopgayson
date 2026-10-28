"use client";

import { useState } from "react";
import { 
  Truck, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Search, 
  Plus, 
  X, 
  ExternalLink, 
  AlertCircle, 
  Star, 
  Trash2,
  ChevronDown,
  Bike,
  Navigation,
  Loader2,
  Package,
  Sliders,
  Save,
  Check
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/th";
import { 
  assignRiderToOrder, 
  updateOrderDeliveryStatus, 
  createRider, 
  updateRiderStatus, 
  deleteRider 
} from "./actions";
import CustomerRadiusMapWrapper from "../map/CustomerRadiusMapWrapper";

export interface RiderData {
  id: string;
  name: string;
  phone: string;
  vehicle: string | null;
  status: string;
  rating: number;
  completedJobs: number;
  createdAt: string;
}

export interface DeliveryOrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface DeliveryOrderData {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  subdistrict?: string | null;
  totalAmount: number;
  status: string;
  deliveryStatus: string; // PENDING, ASSIGNED, DELIVERING, DELIVERED, CANCELLED
  paymentMethod: string;
  riderId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  notes: string | null;
  customerReceivedStatus?: string | null;
  customerConfirmedAt?: string | null;
  customerFeedback?: string | null;
  createdAt: string;
  deliveredAt: string | null;
  items: DeliveryOrderItem[];
}

export interface DeliverySettingData {
  id: string;
  enabled: boolean;
  maxDistanceKm: number;
  storeLat: number;
  storeLng: number;
  storeAddress: string;
  storePhone: string;
  allowedSubdistricts: string;
  minOrderAmount: number;
  deliveryFee: number;
}

interface Props {
  initialRiders: RiderData[];
  initialOrders: DeliveryOrderData[];
  initialSetting?: DeliverySettingData | null;
}

const RIDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  AVAILABLE: {
    label: "พร้อมรับงาน",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  BUSY: {
    label: "กำลังวิ่งงาน",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  OFFLINE: {
    label: "พักงาน / ออฟไลน์",
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: {
    label: "รอมอบหมาย",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  ASSIGNED: {
    label: "มอบหมายแล้ว",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  DELIVERING: {
    label: "กำลังนำจ่าย",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  DELIVERED: {
    label: "จัดส่งสำเร็จ",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export function DeliveryManagerClient({ initialRiders, initialOrders, initialSetting }: Props) {
  moment.locale("th");

  const [riders, setRiders] = useState<RiderData[]>(initialRiders);
  const [orders, setOrders] = useState<DeliveryOrderData[]>(initialOrders);

  // Settings State
  const [setting, setSetting] = useState<DeliverySettingData>(
    initialSetting || {
      id: "default",
      enabled: true,
      maxDistanceKm: 5.0,
      storeLat: 18.564567,
      storeLng: 99.458904,
      storeAddress: "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240",
      storePhone: "089-851-0807",
      allowedSubdistricts: "ทุ่งกว๋าว,เมืองปาน,บ้านขอ,หัวเมือง,แจ้ซ้อน,บ้านค่า,บ้านสา,บ้านเป้า,บ้านเอื้อม",
      minOrderAmount: 50.0,
      deliveryFee: 10.0,
    }
  );
  const [isSavingSetting, setIsSavingSetting] = useState(false);
  const [saveSettingSuccess, setSaveSettingSuccess] = useState(false);
  const [settingError, setSettingError] = useState("");
  const [customSubdistrictInput, setCustomSubdistrictInput] = useState("");

  // Tabs: 'dispatch' (จัดการจัดส่ง) | 'riders' (ข้อมูลพนักงาน) | 'map' (แผนที่ตำแหน่งลูกค้า & ขอบเขต) | 'settings' (จำกัดพื้นที่ส่ง)
  const [activeTab, setActiveTab] = useState<"dispatch" | "riders" | "map" | "settings">("dispatch");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSetting(true);
    setSettingError("");
    setSaveSettingSuccess(false);

    try {
      const res = await fetch("/api/delivery-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSettingSuccess(true);
        setSetting(data.setting);
        setTimeout(() => setSaveSettingSuccess(false), 3000);
      } else {
        setSettingError(data.error || "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
      }
    } catch (err: any) {
      setSettingError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSavingSetting(false);
    }
  };

  const handleToggleSubdistrict = (sub: string) => {
    const list = setting.allowedSubdistricts
      .split(",")
      .map((s) => s.trim().replace(/^ต\./, ""))
      .filter(Boolean);
    let nextList: string[];
    if (list.includes(sub)) {
      nextList = list.filter((s) => s !== sub);
    } else {
      nextList = [...list, sub];
    }
    setSetting({ ...setting, allowedSubdistricts: nextList.join(",") });
  };

  const handleAddCustomSubdistrict = () => {
    const trimmed = customSubdistrictInput.trim().replace(/^ต\./, "");
    if (!trimmed) return;
    const list = setting.allowedSubdistricts
      .split(",")
      .map((s) => s.trim().replace(/^ต\./, ""))
      .filter(Boolean);
    if (!list.includes(trimmed)) {
      setSetting({
        ...setting,
        allowedSubdistricts: [...list, trimmed].join(","),
      });
    }
    setCustomSubdistrictInput("");
  };

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("ALL");

  // Selection states for assigning
  const [selectedRiderMap, setSelectedRiderMap] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal: Add New Rider
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);
  const [isSubmittingRider, setIsSubmittingRider] = useState(false);
  const [riderFormError, setRiderFormError] = useState("");

  // Statistics
  const totalRiders = riders.length;
  const availableRiders = riders.filter((r) => r.status === "AVAILABLE").length;
  const pendingOrders = orders.filter((o) => o.deliveryStatus === "PENDING").length;
  const deliveringOrders = orders.filter((o) => o.deliveryStatus === "DELIVERING" || o.deliveryStatus === "ASSIGNED").length;
  const deliveredOrders = orders.filter((o) => o.deliveryStatus === "DELIVERED").length;

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (deliveryFilter !== "ALL" && o.deliveryStatus !== deliveryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchAddress = o.shippingAddress.toLowerCase().includes(q);
      const matchRider = o.riderName?.toLowerCase().includes(q) || false;
      return matchId || matchCustomer || matchPhone || matchAddress || matchRider;
    }
    return true;
  });

  // Handle Assign Rider
  const handleAssignRider = async (orderId: string) => {
    const riderId = selectedRiderMap[orderId];
    if (!riderId) {
      alert("กรุณาเลือกพนักงานส่งสินค้าก่อนกดยืนยัน");
      return;
    }

    setProcessingId(orderId);
    const res = await assignRiderToOrder(orderId, riderId);
    setProcessingId(null);

    if (res.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      const riderObj = riders.find((r) => r.id === riderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                riderId,
                riderName: riderObj?.name || null,
                riderPhone: riderObj?.phone || null,
                deliveryStatus: "ASSIGNED",
              }
            : o
        )
      );
      // Update rider status locally
      setRiders((prev) =>
        prev.map((r) => (r.id === riderId ? { ...r, status: "BUSY" } : r))
      );
    }
  };

  // Handle Change Delivery Status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setProcessingId(orderId);
    const res = await updateOrderDeliveryStatus(orderId, newStatus);
    setProcessingId(null);

    if (res.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                deliveryStatus: newStatus,
                deliveredAt: newStatus === "DELIVERED" ? new Date().toISOString() : o.deliveredAt,
              }
            : o
        )
      );
    }
  };

  // Handle Create Rider
  const handleCreateRiderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRiderFormError("");
    setIsSubmittingRider(true);

    const formData = new FormData(e.currentTarget);
    const res = await createRider(formData);
    setIsSubmittingRider(false);

    if (res.error) {
      setRiderFormError(res.error);
    } else {
      setIsAddRiderOpen(false);
      window.location.reload();
    }
  };

  // Handle Delete Rider
  const handleDeleteRider = async (riderId: string, riderName: string) => {
    if (!confirm(`คุณต้องการลบพนักงาน "${riderName}" ออกจากระบบใช่หรือไม่?`)) return;

    const res = await deleteRider(riderId);
    if (res.error) {
      alert("ไม่สามารถลบได้: " + res.error);
    } else {
      setRiders((prev) => prev.filter((r) => r.id !== riderId));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#b90000] flex items-center justify-center font-black shadow-inner shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                จัดการพนักงานและการจัดส่งสินค้า
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-[#b90000]">
                Delivery System
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              มอบหมายงานให้พนักงานส่ง ติดตามความคืบหน้านำจ่ายสินค้า และตรวจสอบประวัติการส่ง
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Link to Rider Portal */}
          <Link
            href="/rider"
            target="_blank"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            title="เปิดหน้าจอมือถือสำหรับคนขับส่งของ"
          >
            <Navigation className="w-4 h-4" />
            <span>เปิดหน้าจอมือถือคนขับ (Rider View)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setIsAddRiderOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#b90000] hover:bg-red-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มพนักงานส่ง</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">พนักงานทั้งหมด</span>
            <span className="text-xl font-black text-gray-900">{totalRiders} คน</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">พร้อมวิ่งงาน</span>
            <span className="text-xl font-black text-emerald-600">{availableRiders} คน</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">รอมอบหมายงาน</span>
            <span className="text-xl font-black text-rose-600">{pendingOrders} บิล</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">กำลังจัดส่ง</span>
            <span className="text-xl font-black text-purple-600">{deliveringOrders} บิล</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">จัดส่งสำเร็จ</span>
            <span className="text-xl font-black text-green-700">{deliveredOrders} บิล</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2 overflow-x-auto">
        {/* Tab 1: รายการจัดส่ง & มอบหมายงาน */}
        <button
          onClick={() => setActiveTab("dispatch")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "dispatch"
              ? "bg-[#b90000] text-white shadow-sm"
              : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>รายการจัดส่ง & มอบหมายงาน (Dispatch)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "dispatch" ? "bg-red-800 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {orders.length}
          </span>
        </button>

        {/* Tab 2: รายชื่อพนักงานส่งสินค้า */}
        <button
          onClick={() => setActiveTab("riders")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "riders"
              ? "bg-[#b90000] text-white shadow-sm"
              : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>รายชื่อพนักงานส่งสินค้า (Riders)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "riders" ? "bg-red-800 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {riders.length}
          </span>
        </button>

        {/* Tab 3: แผนที่ตำแหน่งลูกค้า & ขอบเขตร้าน (ย้ายมาไว้ข้างจำกัดพื้นที่จัดส่ง) */}
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "map"
              ? "bg-[#166534] text-white shadow-sm"
              : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-300" />
          <span>📍 แผนที่ตำแหน่งลูกค้า & ขอบเขตร้าน</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === "map" ? "bg-emerald-900 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {orders.filter((o) => o.latitude && o.longitude).length}
          </span>
        </button>

        {/* Tab 4: จำกัดพื้นที่จัดส่ง */}
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "settings"
              ? "bg-[#b90000] text-white shadow-sm"
              : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>⚙️ จำกัดพื้นที่จัดส่ง (Area Settings)</span>
          {setting.enabled ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              จำกัด {setting.maxDistanceKm} กม.
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
              ปิดใช้งาน
            </span>
          )}
        </button>
      </div>

      {/* TAB 0: Customer Radius Map */}
      {activeTab === "map" && (
        <div className="pt-2">
          <CustomerRadiusMapWrapper
            orders={orders}
            storeLat={setting.storeLat}
            storeLng={setting.storeLng}
            storeName="ร้านเกษรบ้านป่าเวียง"
            storeAddress={setting.storeAddress}
            storePhone={setting.storePhone}
            maxDistanceKm={setting.maxDistanceKm}
          />
        </div>
      )}

      {/* TAB 1: Dispatch & Delivery Orders */}
      {activeTab === "dispatch" && (
        <div className="space-y-4">
          {/* Filter & Search */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { key: "ALL", label: "ทั้งหมด", count: orders.length },
                { key: "PENDING", label: "รอมอบหมาย", count: pendingOrders },
                { key: "ASSIGNED", label: "มอบหมายแล้ว", count: orders.filter((o) => o.deliveryStatus === "ASSIGNED").length },
                { key: "DELIVERING", label: "กำลังนำส่ง", count: orders.filter((o) => o.deliveryStatus === "DELIVERING").length },
                { key: "DELIVERED", label: "จัดส่งสำเร็จ", count: deliveredOrders },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDeliveryFilter(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    deliveryFilter === tab.key
                      ? "bg-[#b90000] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      deliveryFilter === tab.key ? "bg-red-800 text-white" : "bg-white text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส, ลูกค้า, เบอร์โทร, ที่อยู่..."
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">คำสั่งซื้อ</th>
                    <th className="p-4">ข้อมูลผู้รับ & ที่อยู่จัดส่ง</th>
                    <th className="p-4">ยอดเงิน & การชำระ</th>
                    <th className="p-4">พนักงานส่ง (Rider)</th>
                    <th className="p-4 text-center">สถานะการนำจ่าย</th>
                    <th className="p-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const statusCfg = DELIVERY_STATUS_CONFIG[order.deliveryStatus] || DELIVERY_STATUS_CONFIG.PENDING;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Order ID & Time */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {moment(order.createdAt).format("DD/MM/YY HH:mm น.")}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {order.items.length} รายการ ({order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น)
                          </div>
                        </td>

                        {/* Customer & Address */}
                        <td className="p-4 max-w-xs">
                          <p className="font-bold text-sm text-gray-900">{order.customerName}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{order.customerPhone}</span>
                          </div>
                          <div className="flex items-start gap-1 text-xs text-gray-500 mt-1 leading-relaxed">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{order.shippingAddress}</span>
                          </div>
                          {(order.subdistrict || (order.distanceKm !== null && order.distanceKm !== undefined)) && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {order.subdistrict && (
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                  ต.{order.subdistrict}
                                </span>
                              )}
                              {order.distanceKm !== null && order.distanceKm !== undefined && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                  📍 {order.distanceKm} กม.
                                </span>
                              )}
                              {order.latitude && order.longitude && (
                                <a
                                  href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>แผนที่</span>
                                </a>
                              )}
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-100">
                              หมายเหตุ: {order.notes}
                            </p>
                          )}
                        </td>

                        {/* Total & Payment */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-black text-base text-[#b90000]">
                            ฿{order.totalAmount.toLocaleString("th-TH")}
                          </span>
                          <div className="mt-1">
                            {order.paymentMethod === "COD" ? (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                                💵 เก็บเงินปลายทาง
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full inline-block">
                                ✅ ชำระเงินแล้ว
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assigned Rider */}
                        <td className="p-4 whitespace-nowrap">
                          {order.riderId ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-xs">
                                  🛵
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{order.riderName}</p>
                                  <p className="text-[11px] text-gray-500">{order.riderPhone}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedRiderMap[order.id] || ""}
                                onChange={(e) =>
                                  setSelectedRiderMap({
                                    ...selectedRiderMap,
                                    [order.id]: e.target.value,
                                  })
                                }
                                className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#b90000]"
                              >
                                <option value="">-- เลือกคนขับ --</option>
                                {riders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} ({r.status === "AVAILABLE" ? "ว่าง" : "วิ่งงาน"})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignRider(order.id)}
                                disabled={processingId === order.id}
                                className="px-2.5 py-1.5 bg-[#b90000] hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                มอบหมาย
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Delivery Status Dropdown */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={order.deliveryStatus}
                              disabled={processingId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`appearance-none text-xs font-bold px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none transition-all ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} disabled:opacity-50`}
                            >
                              <option value="PENDING">รอมอบหมาย</option>
                              <option value="ASSIGNED">มอบหมายแล้ว</option>
                              <option value="DELIVERING">กำลังนำจ่าย</option>
                              <option value="DELIVERED">จัดส่งสำเร็จ</option>
                              <option value="CANCELLED">ยกเลิก</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                          </div>
                          {order.customerReceivedStatus === "RECEIVED" && (
                            <span className="block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              ✓ ลูกค้ายืนยันรับแล้ว
                            </span>
                          )}
                          {order.customerReceivedStatus === "NOT_RECEIVED" && (
                            <span
                              className="block mt-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse"
                              title={order.customerFeedback || "ลูกค้าระบุว่ายังไม่ได้รับพัสดุ"}
                            >
                              ⚠️ ลูกค้าแจ้งยังไม่ได้รับ
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center whitespace-nowrap">
                          {order.riderId && order.deliveryStatus !== "DELIVERED" && (
                            <button
                              onClick={() => {
                                const newRiderId = prompt(
                                  `เปลี่ยนพนักงานส่งสินค้า\nกรุณาเลือกรหัสพนักงาน:\n${riders
                                    .map((r) => `${r.id}: ${r.name}`)
                                    .join("\n")}`
                                );
                                if (newRiderId && riders.some((r) => r.id === newRiderId)) {
                                  setSelectedRiderMap({
                                    ...selectedRiderMap,
                                    [order.id]: newRiderId,
                                  });
                                  handleAssignRider(order.id);
                                }
                              }}
                              className="text-[11px] text-gray-600 hover:text-[#b90000] underline font-medium cursor-pointer"
                            >
                              เปลี่ยนคนส่ง
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 text-xs">
                        ไม่พบรายการจัดส่งตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Riders Management */}
      {activeTab === "riders" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {riders.map((rider) => {
              const statusCfg = RIDER_STATUS_CONFIG[rider.status] || RIDER_STATUS_CONFIG.AVAILABLE;

              return (
                <div
                  key={rider.id}
                  className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 hover:border-red-100 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                        🛵
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900">{rider.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{rider.phone}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRider(rider.id, rider.name)}
                      className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                      title="ลบพนักงาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vehicle Info */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-gray-800">
                      <Truck className="w-3.5 h-3.5 text-gray-500" />
                      <span>{rider.vehicle || "ไม่ได้ระบุพาหนะ"}</span>
                    </div>
                  </div>

                  {/* Work Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">งานที่ส่งสำเร็จ</span>
                      <span className="font-extrabold text-sm text-gray-800">
                        {rider.completedJobs} ออเดอร์
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">คะแนนบริการ</span>
                      <span className="font-extrabold text-sm text-amber-500 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{rider.rating.toFixed(1)} / 5.0</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">สถานะการทำงาน:</span>
                    <select
                      value={rider.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await updateRiderStatus(rider.id, newStatus);
                        setRiders((prev) =>
                          prev.map((r) => (r.id === rider.id ? { ...r, status: newStatus } : r))
                        );
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none transition-all ${statusCfg.bg} ${statusCfg.text}`}
                    >
                      <option value="AVAILABLE">🟢 พร้อมรับงาน</option>
                      <option value="BUSY">🟠 กำลังวิ่งงาน</option>
                      <option value="OFFLINE">⚪ พักงาน</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Delivery Area & Restriction Settings */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#b90000]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  ตั้งค่าการจำกัดพื้นที่จัดส่ง (Delivery Area Settings)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                กำหนดรัศมีระยะทางสูงสุด (GPS) และรายชื่อตำบลที่ให้บริการส่ง เพื่อควบคุมพื้นที่ในการจัดส่งสินค้า
              </p>
            </div>

            {saveSettingSuccess && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
              </div>
            )}
          </div>

          {settingError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{settingError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* 1. Toggle Limit System */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="space-y-0.5">
                <span className="font-bold text-gray-900 text-sm block">
                  เปิดใช้งานการจำกัดพื้นที่จัดส่ง (Enable Delivery Restriction)
                </span>
                <span className="text-xs text-gray-500 block">
                  เมื่อเปิดใช้งาน ลูกค้าที่อยู่นอกรัศมีหรือนอกตำบลที่กำหนดจะไม่สามารถเลือกจัดส่งถึงที่ได้ และระบบจะแนะนำให้รับสินค้าที่หน้าร้านแทน
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  onChange={(e) => setSetting({ ...setting, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b90000]"></div>
              </label>
            </div>

            {/* 2. Maximum Delivery Radius */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-bold text-gray-900">
                    รัศมีระยะทางจัดส่งสูงสุด (กิโลเมตร) *
                  </label>
                  <span className="text-xs text-gray-500">
                    คำนวณจากพิกัด GPS ตำแหน่งของลูกค้า เทียบกับพิกัดร้านค้า
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[5, 10, 15, 20].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setSetting({ ...setting, maxDistanceKm: km })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        setting.maxDistanceKm === km
                          ? "bg-[#b90000] text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {km} กม.
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-44">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    required
                    value={setting.maxDistanceKm}
                    onChange={(e) =>
                      setSetting({ ...setting, maxDistanceKm: parseFloat(e.target.value) || 10 })
                    }
                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#b90000]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">กม.</span>
                </div>
                <span className="text-xs text-gray-500">
                  (ปัจจุบัน: จัดส่งภายในระยะทางไม่เกิน <strong>{setting.maxDistanceKm} กิโลเมตร</strong> จากร้าน)
                </span>
              </div>
            </div>

            {/* 3. Store Location (Coordinates & Address) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    พิกัดที่ตั้งร้านค้า (จุดศูนย์กลางในการคำนวณระยะทาง)
                  </h4>
                  <span className="text-xs text-gray-500">
                    ใช้เป็นจุดอ้างอิงเพื่อคำนวณระยะทางแบบ Haversine Formula ไปยังพิกัด GPS ของลูกค้า
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSetting({
                        ...setting,
                        storeLat: 18.564567,
                        storeLng: 99.458904,
                        storeAddress: "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240",
                      })
                    }
                    className="px-3 py-1.5 bg-red-50 text-[#b90000] hover:bg-red-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    📍 ใช้พิกัดร้านเกษรบ้านป่าเวียง
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ละติจูด (Latitude) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={setting.storeLat}
                    onChange={(e) =>
                      setSetting({ ...setting, storeLat: parseFloat(e.target.value) || 18.564567 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#b90000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ลองจิจูด (Longitude) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={setting.storeLng}
                    onChange={(e) =>
                      setSetting({ ...setting, storeLng: parseFloat(e.target.value) || 99.458904 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-none focus:border-[#b90000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ที่อยู่ร้านค้า (แสดงให้ลูกค้าและพนักงานเห็น)
                </label>
                <input
                  type="text"
                  value={setting.storeAddress}
                  onChange={(e) => setSetting({ ...setting, storeAddress: e.target.value })}
                  placeholder="กรอกที่อยู่หรือที่ตั้งร้านค้าเกษรบ้านป่าเวียง"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <a
                  href={`https://www.google.com/maps?q=${setting.storeLat},${setting.storeLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ตรวจสอบตำแหน่งพิกัดร้านใน Google Maps ({setting.storeLat}, {setting.storeLng})</span>
                </a>
              </div>
            </div>

            {/* 4. Allowed Subdistricts in Lampang */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  ตำบลที่เปิดให้บริการจัดส่ง (อ.เมืองปาน และพื้นที่ใกล้เคียง)
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  ลูกค้าในหน้าชำระเงินสามารถเลือกตำบลเหล่านี้ได้ หากอยู่นอกตำบลที่เลือก ระบบจะแจ้งเตือนว่าอยู่นอกพื้นที่จัดส่ง
                </p>
              </div>

              {/* Subdistricts chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "ทุ่งกว๋าว",
                  "เมืองปาน",
                  "บ้านขอ",
                  "หัวเมือง",
                  "แจ้ซ้อน",
                  "บ้านค่า",
                  "บ้านสา",
                  "บ้านเป้า",
                  "บ้านเอื้อม",
                ].map((sub) => {
                  const list = setting.allowedSubdistricts
                    .split(",")
                    .map((s) => s.trim().replace(/^ต\./, ""));
                  const isChecked = list.includes(sub);

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleToggleSubdistrict(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                          : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <span>{isChecked ? "✅" : "⚪"}</span>
                      <span>ต.{sub}</span>
                      {sub === "ทุ่งกว๋าว" && <span className="text-[10px] text-emerald-600 font-bold">(ร้าน)</span>}
                    </button>
                  );
                })}

                {/* Extra custom subdistricts from setting */}
                {setting.allowedSubdistricts
                  .split(",")
                  .map((s) => s.trim().replace(/^ต\./, ""))
                  .filter(
                    (s) =>
                      s &&
                      ![
                        "ทุ่งกว๋าว",
                        "เมืองปาน",
                        "บ้านขอ",
                        "หัวเมือง",
                        "แจ้ซ้อน",
                        "บ้านค่า",
                        "บ้านสา",
                        "บ้านเป้า",
                        "บ้านเอื้อม",
                      ].includes(s)
                  )
                  .map((customSub) => (
                    <button
                      key={customSub}
                      type="button"
                      onClick={() => handleToggleSubdistrict(customSub)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1.5"
                    >
                      <span>✅</span>
                      <span>ต.{customSub}</span>
                      <span className="text-red-500 hover:text-red-700 font-bold">✕</span>
                    </button>
                  ))}
              </div>

              {/* Add Custom Subdistrict */}
              <div className="flex items-center gap-2 max-w-sm pt-2">
                <input
                  type="text"
                  value={customSubdistrictInput}
                  onChange={(e) => setCustomSubdistrictInput(e.target.value)}
                  placeholder="พิมพ์ชื่อตำบลเพิ่มเติม..."
                  className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubdistrict}
                  className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  + เพิ่มตำบล
                </button>
              </div>
            </div>

            {/* 5. Minimum Order Amount & Delivery Fee */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>เงื่อนไขยอดสั่งซื้อขั้นต่ำ & ค่าจัดส่ง</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  กำหนดราคาขั้นต่ำเพื่อรับสิทธิ์ส่งฟรี และค่าจัดส่งกรณีที่ลูกค้าสั่งซื้อไม่ถึงยอดขั้นต่ำ
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5.1 Minimum Order for Free Delivery */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900">
                    ยอดสั่งซื้อขั้นต่ำสำหรับ &ldquo;ส่งฟรี&rdquo; (บาท) *
                  </label>
                  <p className="text-[11px] text-gray-500">
                    ซื้อครบยอดนี้ขึ้นไป จัดส่งฟรีทันที (฿0)
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={setting.minOrderAmount}
                      onChange={(e) =>
                        setSetting({ ...setting, minOrderAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#b90000]"
                      placeholder="50"
                    />
                    <span className="text-xs font-semibold text-gray-500 shrink-0">บาท</span>
                  </div>
                </div>

                {/* 5.2 Delivery Fee for Sub-minimum Orders */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1.5">
                  <label className="block text-xs font-bold text-amber-950">
                    ค่าจัดส่งกรณีซื้อไม่ถึงขั้นต่ำ (บาท) *
                  </label>
                  <p className="text-[11px] text-amber-850">
                    หากยอดซื้อไม่ถึงขั้นต่ำ คิดค่าส่งอัตรานี้ (ค่าเริ่มต้น 10 บาท)
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={setting.deliveryFee}
                      onChange={(e) =>
                        setSetting({ ...setting, deliveryFee: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-amber-950 focus:outline-none focus:border-[#b90000]"
                      placeholder="10"
                    />
                    <span className="text-xs font-semibold text-amber-900 shrink-0">บาท</span>
                  </div>
                </div>
              </div>

              {/* Rule Explanation Banner */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  ตัวอย่างการคำนวณจริงเมื่อเปิดใช้งานจำกัดพื้นที่:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-900/90 pl-1">
                  <li>ลูกค้าซื้อครบ <strong className="text-emerald-700">฿{setting.minOrderAmount}</strong> ขึ้นไป ➔ <strong className="text-emerald-700">จัดส่งฟรี (฿0)</strong></li>
                  <li>ลูกค้าซื้อต่ำกว่า <strong className="text-amber-800">฿{setting.minOrderAmount}</strong> ➔ <strong className="text-amber-900">คิดค่าจัดส่ง ฿{setting.deliveryFee || 10} บาท</strong> (สั่งซื้อได้ตามปกติ)</li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSavingSetting}
                className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSavingSetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าพื้นที่จัดส่ง</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add New Rider */}
      {isAddRiderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#b90000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold text-base">เพิ่มพนักงานส่งสินค้าใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRiderOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-red-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRiderSubmit} className="p-6 space-y-4">
              {riderFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{riderFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ-นามสกุล พนักงาน *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="กรอกชื่อ-นามสกุลพนักงานส่งของ"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="กรอกเบอร์โทรศัพท์พนักงานส่งของ"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ยานพาหนะและเลขทะเบียน
                </label>
                <input
                  type="text"
                  name="vehicle"
                  placeholder="กรอกยานพาหนะและเลขทะเบียนรถ"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  สถานะการทำงานเริ่มต้น
                </label>
                <select
                  name="status"
                  defaultValue="AVAILABLE"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#b90000]"
                >
                  <option value="AVAILABLE">พร้อมรับงาน (Available)</option>
                  <option value="OFFLINE">พักงาน (Offline)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRiderOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRider}
                  className="px-5 py-2 bg-[#b90000] hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmittingRider && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
}
