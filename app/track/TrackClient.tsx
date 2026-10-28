"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { 
  Search, 
  Truck, 
  Store, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Package, 
  ChevronRight, 
  ExternalLink, 
  RefreshCw, 
  Receipt, 
  Home, 
  Star, 
  Copy, 
  Check, 
  Navigation,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  X,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import moment from "moment";
import "moment/locale/th";
import dynamic from "next/dynamic";
import { confirmOrderReceiptByCustomer } from "@/app/admin/delivery/actions";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
      กำลังโหลดแผนที่จัดส่ง...
    </div>
  ),
});

moment.locale("th");

interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: string | null;
  rating: number;
  completedJobs: number;
  image: string | null;
  status: string;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string; // PENDING, WAITING_VERIFICATION, PAID, SHIPPED, DELIVERED, CANCELLED
  deliveryType: string | null; // DELIVERY, PICKUP
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  paymentMethod: string | null;
  pickupTime: string | null;
  notes: string | null;
  slipImage: string | null;
  deliveryStatus: string | null; // PENDING, ASSIGNED, DELIVERING, DELIVERED, CANCELLED
  deliveredAt: string | null;
  paymentVerifiedAt: string | null;
  customerReceivedStatus: string | null; // RECEIVED, NOT_RECEIVED
  customerConfirmedAt: string | null;
  customerFeedback: string | null;
  createdAt: string;
  items: OrderItem[];
  rider: Rider | null;
}

interface Props {
  initialQuery?: string;
  initialOrder?: Order | null;
  recentOrders?: Order[];
  userDisplayName?: string | null;
}

export default function TrackClient({
  initialQuery = "",
  initialOrder = null,
  recentOrders = [],
  userDisplayName = null,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryFromUrl =
    searchParams.get("orderId") ||
    searchParams.get("phone") ||
    searchParams.get("q") ||
    initialQuery;

  const [searchQuery, setSearchQuery] = useState(
    queryFromUrl || (initialOrder ? initialOrder.id : "")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [recentOrdersList, setRecentOrdersList] = useState<Order[]>(recentOrders);

  // Customer receipt confirmation states
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [deliverySetting, setDeliverySetting] = useState<{
    storeLat: number;
    storeLng: number;
    storeAddress: string;
    storePhone: string;
    maxDistanceKm: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.setting) {
          setDeliverySetting(data.setting);
        }
      })
      .catch((err) => console.error("Error loading delivery settings:", err));
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTracking = useCallback(async (q: string, silent = false) => {
    if (!q || !q.trim()) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(`/api/track?query=${encodeURIComponent(q.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (!silent) {
          setError(data.error || "ไม่พบข้อมูลคำสั่งซื้อ");
          setOrder(null);
          setOrdersList([]);
        }
      } else {
        if (data.multiple && data.orders) {
          setOrdersList(data.orders);
          setOrder(null);
        } else if (data.order) {
          setOrder(data.order);
          setOrdersList([]);
        }
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load from URL (only if queryFromUrl is explicitly provided and differs from initialOrder)
  useEffect(() => {
    if (queryFromUrl && (!initialOrder || initialOrder.id !== queryFromUrl)) {
      setSearchQuery(queryFromUrl);
      fetchTracking(queryFromUrl);
    }
  }, [queryFromUrl, initialOrder, fetchTracking]);

  // Auto-refresh when order is active
  useEffect(() => {
    if (!autoRefresh || !order) return;
    if (order.status === "DELIVERED" || order.status === "CANCELLED") return;

    const interval = setInterval(() => {
      fetchTracking(order.id, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, order, fetchTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/track?orderId=${encodeURIComponent(searchQuery.trim())}`);
    fetchTracking(searchQuery);
  };

  const selectOrderFromList = (selected: Order) => {
    setOrder(selected);
    setSearchQuery(selected.id);
    setOrdersList([]);
    router.push(`/track?orderId=${selected.id}`);
  };

  // Customer confirmation handler
  const handleConfirmReceipt = async (
    status: "RECEIVED" | "NOT_RECEIVED",
    customFeedback?: string
  ) => {
    if (!order) return;
    setConfirmingStatus(true);
    try {
      const fb = customFeedback !== undefined ? customFeedback : feedbackText;
      const res = await confirmOrderReceiptByCustomer(order.id, status, fb);
      if (res.error) {
        showToast(res.error, "error");
      } else {
        const nowIso = new Date().toISOString();
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                customerReceivedStatus: status,
                customerConfirmedAt: nowIso,
                customerFeedback: fb || null,
                status: status === "RECEIVED" ? "DELIVERED" : prev.status,
              }
            : null
        );
        setShowFeedbackModal(false);
        setFeedbackText("");
        showToast(res.message || "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + (err.message || "ไม่สามารถเชื่อมต่อได้"), "error");
    } finally {
      setConfirmingStatus(false);
    }
  };

  // Helper to determine status progress step (1 to 5)
  const getDeliveryProgress = (ord: Order) => {
    const isPickup = ord.deliveryType === "PICKUP";

    if (ord.status === "CANCELLED") {
      return { step: 0, isCancelled: true };
    }

    if (isPickup) {
      if (ord.status === "DELIVERED") return { step: 5, isCancelled: false };
      if (ord.status === "SHIPPED") return { step: 4, isCancelled: false };
      if (ord.status === "PAID") return { step: 3, isCancelled: false };
      if (ord.paymentMethod === "CASH_STORE") return { step: 2, isCancelled: false };
      return { step: 1, isCancelled: false };
    } else {
      // Delivery
      if (ord.deliveryStatus === "DELIVERED" || ord.status === "DELIVERED") return { step: 5, isCancelled: false };
      if (ord.deliveryStatus === "DELIVERING" || ord.status === "SHIPPED") return { step: 4, isCancelled: false };
      if (ord.deliveryStatus === "ASSIGNED") return { step: 3, isCancelled: false };
      if (ord.status === "PAID" || ord.paymentMethod === "COD") return { step: 2, isCancelled: false };
      return { step: 1, isCancelled: false };
    }
  };

  const currentProgress = order ? getDeliveryProgress(order) : { step: 1, isCancelled: false };

  // Stepper steps definitions
  const deliverySteps = [
    {
      num: 1,
      title: "สั่งซื้อสำเร็จ",
      desc: "ระบบบันทึกคำสั่งซื้อเรียบร้อยแล้ว",
      time: order ? moment(order.createdAt).format("D MMM HH:mm น.") : "",
    },
    {
      num: 2,
      title: order?.paymentMethod === "COD" ? "รับออเดอร์ปลายทาง" : "ชำระเงินเรียบร้อย",
      desc:
        order?.paymentMethod === "COD"
          ? "ชำระเงินสดกับพนักงานเมื่อได้รับสินค้า"
          : order?.status === "PAID" ||
            (currentProgress.step >= 2 && order?.status !== "WAITING_VERIFICATION")
          ? "แอดมินยืนยันยอดเงินเรียบร้อยแล้ว"
          : "รอแอดมินตรวจสอบยอดเงินเข้าบัญชี",
      time: order?.paymentVerifiedAt ? moment(order.paymentVerifiedAt).format("D MMM HH:mm น.") : "",
    },
    {
      num: 3,
      title: order?.rider ? `มอบหมายไรเดอร์แล้ว` : "กำลังเตรียมสินค้า",
      desc: order?.rider
        ? `พนักงานส่ง: ${order.rider.name} (${order.rider.vehicle || "รถจักรยานยนต์"})`
        : "ทางร้านเกษรบ้านป่าเวียงกำลังจัดเตรียมและแพ็กสินค้า",
      time: "",
    },
    {
      num: 4,
      title: "ไรเดอร์กำลังนำส่ง",
      desc:
        currentProgress.step >= 4
          ? "พนักงานกำลังเดินทางไปส่งสินค้าตามที่อยู่ของคุณ"
          : "รอพนักงานเริ่มออกเดินทาง",
      time: "",
    },
    {
      num: 5,
      title: "จัดส่งสินค้าสำเร็จ",
      desc:
        currentProgress.step >= 5
          ? order?.deliveredAt
            ? `จัดส่งถึงปลายทางเมื่อ ${moment(order.deliveredAt).format("D MMM HH:mm น.")}`
            : "จัดส่งสินค้าสำเร็จเรียบร้อยแล้ว"
          : "พนักงานจะโทรแจ้งก่อนถึงที่หมาย",
      time: order?.deliveredAt ? moment(order.deliveredAt).format("D MMM HH:mm น.") : "",
    },
  ];

  const pickupSteps = [
    {
      num: 1,
      title: "สั่งซื้อสำเร็จ",
      desc: "ระบบบันทึกคำสั่งซื้อเรียบร้อยแล้ว",
      time: order ? moment(order.createdAt).format("D MMM HH:mm น.") : "",
    },
    {
      num: 2,
      title: order?.paymentMethod === "CASH_STORE" ? "ชำระเงินสดหน้าร้าน" : "ชำระเงินเรียบร้อย",
      desc:
        order?.paymentMethod === "CASH_STORE"
          ? "ชำระเงินสดเมื่อมารับสินค้าที่ร้านเกษรบ้านป่าเวียง"
          : order?.status === "PAID"
          ? "แอดมินยืนยันยอดเงินเรียบร้อยแล้ว"
          : "รอแอดมินตรวจสอบยอดเงินโอน",
      time: order?.paymentVerifiedAt ? moment(order.paymentVerifiedAt).format("D MMM HH:mm น.") : "",
    },
    {
      num: 3,
      title: "กำลังเตรียมสินค้า",
      desc: "พนักงานร้านเกษรบ้านป่าเวียงกำลังรวบรวมสินค้าตามรายการ",
      time: "",
    },
    {
      num: 4,
      title: "พร้อมให้เข้ารับที่ร้าน",
      desc: order?.pickupTime
        ? `เวลานัดรับ: ${order.pickupTime} ที่ร้านเกษรบ้านป่าเวียง`
        : "สินค้าพร้อมแล้ว สามารถมารับได้ที่เคาน์เตอร์ร้านเกษรบ้านป่าเวียง",
      time: "",
    },
    {
      num: 5,
      title: "รับสินค้าเรียบร้อย",
      desc:
        currentProgress.step >= 5
          ? "ลูกค้ารับสินค้าเรียบร้อยแล้ว ขอบคุณที่ใช้บริการครับ"
          : "แจ้งชื่อหรือเบอร์โทรที่เคาน์เตอร์เมื่อมารับสินค้า",
      time: order?.deliveredAt ? moment(order.deliveredAt).format("D MMM HH:mm น.") : "",
    },
  ];

  const activeSteps = order?.deliveryType === "PICKUP" ? pickupSteps : deliverySteps;

  return (
    <div className="flex flex-col w-full bg-[#f8f9fa] min-h-screen">
      <Header />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border ${
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
            <span className="text-xs leading-snug">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Modal for "ยังไม่ได้รับสินค้า" */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-gray-900">รายงาน: ยังไม่ได้รับสินค้า</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              กรุณาเลือกสาเหตุหรือระบุรายละเอียดเพิ่มเติม เพื่อให้ทางร้านเกษรบ้านป่าเวียงและไรเดอร์ประสานงานตรวจสอบทันที:
            </p>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "ยังไม่มีไรเดอร์ติดต่อมา",
                "ไม่พบพัสดุที่จุดรับสินค้า",
                "ไรเดอร์กดจบงานแต่ยังไม่ถึง",
                "จัดส่งผิดตำแหน่ง/ผิดบ้าน",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFeedbackText(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                    feedbackText === tag
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder="พิมพ์รายละเอียดเพิ่มเติม เช่น จุดที่ฝากวางไว้ หรือเบอร์ติดต่อสำรอง..."
              className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 font-medium"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={confirmingStatus}
                onClick={() =>
                  handleConfirmReceipt("NOT_RECEIVED", feedbackText || "ยังไม่ได้รับสินค้า")
                }
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-900/20 cursor-pointer disabled:opacity-50"
              >
                {confirmingStatus ? "กำลังส่ง..." : "ยืนยันส่งรายงาน"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#b90000] flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>หน้าแรก</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-bold text-gray-800">ติดตามสถานะจัดส่งสินค้า</span>
          </div>

          <Link
            href="/profile?tab=orders"
            className="hover:text-[#b90000] font-semibold text-gray-600 transition-colors"
          >
            ประวัติคำสั่งซื้อของฉัน →
          </Link>
        </div>

        {/* Hero Search Box Card */}
        <div className="bg-gradient-to-r from-red-900 via-[#b90000] to-red-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
            <Truck className="w-64 h-64 text-white" />
          </div>

          <div className="max-w-2xl relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
              <Truck className="w-3.5 h-3.5" />
              <span>ระบบติดตามพัสดุและสถานะจัดส่ง ร้านเกษรบ้านป่าเวียง</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ติดตามสถานะการจัดส่งสินค้า
            </h1>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              กรอกหมายเลขคำสั่งซื้อ (เช่น <span className="font-mono underline">ORD-XXXXXX</span> หรือรหัสคำสั่งซื้อ) หรือค้นหาด้วย <span className="underline">เบอร์โทรศัพท์</span> ของผู้รับสินค้า
            </p>

            <form onSubmit={handleSearch} className="pt-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="กรอกหมายเลขคำสั่งซื้อ หรือ เบอร์โทรศัพท์..."
                  className="w-full bg-white text-gray-900 placeholder-gray-400 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium shadow-md focus:outline-none focus:ring-4 focus:ring-red-400/40"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 hover:bg-black text-white font-bold px-7 py-3.5 rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังค้นหา...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>ตรวจสอบสถานะ</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Recent Orders Switcher (Requirement 1) */}
        {recentOrdersList.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#b90000]" />
                <span>
                  คำสั่งซื้อล่าสุด{userDisplayName ? `ของคุณ (${userDisplayName})` : ""}:
                </span>
              </span>
              <span className="text-[11px] text-gray-400">คลิกเพื่อสลับดูออเดอร์</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {recentOrdersList.map((ord) => {
                const isSelected = order?.id === ord.id;
                const isDelivered =
                  ord.deliveryStatus === "DELIVERED" || ord.status === "DELIVERED";
                const isDelivering =
                  ord.deliveryStatus === "DELIVERING" || ord.status === "SHIPPED";

                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => selectOrderFromList(ord)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                      isSelected
                        ? "bg-red-50 text-[#b90000] border-red-300 ring-2 ring-red-200"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isDelivered
                          ? "bg-emerald-500"
                          : isDelivering
                          ? "bg-blue-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="font-mono">#{ord.id.slice(-6).toUpperCase()}</span>
                    <span className="text-gray-300">|</span>
                    <span>฿{ord.totalAmount.toLocaleString("th-TH")}</span>
                    {ord.deliveryType === "PICKUP" ? (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-normal">
                        รับที่ร้าน
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-normal">
                        ส่งถึงบ้าน
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl flex items-start gap-3.5 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-900 text-sm">ค้นหาไม่สำเร็จ</h4>
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              <div className="pt-1 text-[11px] text-red-600">
                💡 หากคุณเข้าสู่ระบบอยู่ สามารถเปิดดูออเดอร์ทั้งหมดได้ที่หน้า{" "}
                <Link href="/profile?tab=orders" className="underline font-bold">
                  ประวัติการสั่งซื้อ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Orders Found (Searched by phone) */}
        {ordersList.length > 0 && !order && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  พบคำสั่งซื้อของคุณทั้งหมด {ordersList.length} รายการ
                </h3>
                <p className="text-xs text-gray-500">
                  คลิกที่คำสั่งซื้อที่ต้องการเพื่อดูสถานะการจัดส่งแบบละเอียด
                </p>
              </div>
              <span className="text-xs font-bold bg-red-50 text-[#b90000] px-3 py-1 rounded-full">
                เบอร์โทร: {searchQuery}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {ordersList.map((ord) => {
                const prog = getDeliveryProgress(ord);
                return (
                  <div
                    key={ord.id}
                    onClick={() => selectOrderFromList(ord)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-red-50/40 p-3 rounded-2xl transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-gray-900 group-hover:text-[#b90000]">
                          {ord.id}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {moment(ord.createdAt).format("D MMM YYYY HH:mm น.")}
                        </span>
                        {ord.deliveryType === "PICKUP" ? (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                            รับที่หน้าร้าน
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                            จัดส่งถึงที่
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 truncate max-w-lg">
                        {ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right shrink-0">
                      <div>
                        <div className="font-black text-sm text-[#b90000]">
                          ฿{ord.totalAmount.toLocaleString("th-TH")}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prog.step === 5
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : prog.step >= 3
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {prog.step === 5
                            ? "จัดส่งสำเร็จ"
                            : prog.step === 4
                            ? "กำลังนำส่ง"
                            : prog.step === 3
                            ? "เตรียมสินค้า"
                            : "รอชำระเงิน/ตรวจสลิป"}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Single Order Tracking View */}
        {order && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Order Header Info Bar */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">หมายเลขคำสั่งซื้อ:</span>
                    <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                      {order.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(order.id)}
                      className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      title="คัดลอกรหัสคำสั่งซื้อ"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {order.deliveryType === "PICKUP" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <Store className="w-3 h-3 text-blue-600" />
                        <span>รับที่หน้าร้านเกษรบ้านป่าเวียง</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#b90000] border border-red-200">
                        <Truck className="w-3 h-3 text-[#b90000]" />
                        <span>จัดส่งถึงบ้าน (Delivery)</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    สั่งซื้อเมื่อ: {moment(order.createdAt).format("D MMMM YYYY เวลา HH:mm น.")}
                  </p>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fetchTracking(order.id)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loading ? "animate-spin text-[#b90000]" : "text-gray-500"
                      }`}
                    />
                    <span>รีเฟรชสถานะ</span>
                  </button>

                  <Link
                    href={`/receipt/${order.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#b90000] hover:bg-red-800 px-3.5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>ใบเสร็จรับเงิน</span>
                  </Link>
                </div>
              </div>

              {/* Status Highlight Banner */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  currentProgress.step === 5
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                    : currentProgress.step === 4
                    ? "bg-blue-50/80 border-blue-300 text-blue-950"
                    : currentProgress.step === 3
                    ? "bg-purple-50/80 border-purple-300 text-purple-950"
                    : "bg-amber-50/80 border-amber-300 text-amber-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      currentProgress.step === 5
                        ? "bg-emerald-600 text-white"
                        : currentProgress.step === 4
                        ? "bg-blue-600 text-white animate-pulse"
                        : currentProgress.step === 3
                        ? "bg-purple-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {currentProgress.step === 5 ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Truck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">
                      {activeSteps[currentProgress.step - 1]?.title || "กำลังดำเนินการ"}
                    </h3>
                    <p className="text-xs opacity-80 leading-relaxed">
                      {activeSteps[currentProgress.step - 1]?.desc || ""}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-[11px] font-semibold opacity-70 block">
                    อัปเดตล่าสุดเมื่อ {moment(lastRefreshed).format("HH:mm:ss น.")}
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer mt-0.5 opacity-90 select-none">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded accent-[#b90000]"
                    />
                    <span>อัปเดตสถานะอัตโนมัติ (Live)</span>
                  </label>
                </div>
              </div>

              {/* Visual Stepper Timeline */}
              <div className="pt-6 pb-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
                  ขั้นตอนการจัดส่ง (Delivery Timeline)
                </h4>

                {/* Horizontal Stepper for Desktop, Vertical for Mobile */}
                <div className="relative">
                  {/* Connecting line */}
                  <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-gray-200 z-0">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((currentProgress.step - 1) / (activeSteps.length - 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2 relative z-10">
                    {activeSteps.map((s) => {
                      const isDone =
                        currentProgress.step > s.num || currentProgress.step === 5;
                      const isCurrent =
                        currentProgress.step === s.num && currentProgress.step !== 5;

                      return (
                        <div
                          key={s.num}
                          className="flex md:flex-col items-start md:items-center text-left md:text-center gap-3.5 md:gap-2"
                        >
                          {/* Step Circle */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                              isDone
                                ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                                : isCurrent
                                ? "bg-[#b90000] text-white shadow-md ring-4 ring-red-100 animate-bounce"
                                : "bg-gray-100 text-gray-400 border border-gray-200"
                            }`}
                          >
                            {isDone ? <Check className="w-5 h-5" /> : s.num}
                          </div>

                          <div className="space-y-0.5 flex-1">
                            <span
                              className={`text-xs font-bold block ${
                                isDone
                                  ? "text-emerald-800"
                                  : isCurrent
                                  ? "text-[#b90000]"
                                  : "text-gray-400"
                              }`}
                            >
                              {s.title}
                            </span>
                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                              {s.desc}
                            </p>
                            {s.time && (
                              <span className="text-[10px] text-gray-400 font-mono block pt-0.5">
                                {s.time}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* REQUIREMENT 2: Customer Confirmation Card When Arrived / Delivered       */}
            {/* ========================================================================= */}
            {currentProgress.step === 5 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border-2 border-emerald-400 space-y-4 animate-in fade-in duration-300">
                {!order.customerReceivedStatus ? (
                  // State 1: Prompt customer to confirm
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl shrink-0 ring-4 ring-emerald-100">
                        📦
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base sm:text-lg text-gray-900">
                            สินค้านำส่งถึงปลายทางแล้ว — กรุณายืนยันการรับสินค้า
                          </h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                            รอยืนยันจากคุณ
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          ไรเดอร์ได้จัดส่งสินค้าถึงปลายทางเรียบร้อยแล้ว กรุณาตรวจสอบความถูกต้องของสินค้าและกดปุ่มยืนยันด้านล่างเพื่อความสมบูรณ์ของคำสั่งซื้อ
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {/* Green Confirm Button */}
                      <button
                        type="button"
                        disabled={confirmingStatus}
                        onClick={() => handleConfirmReceipt("RECEIVED")}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {confirmingStatus ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>กำลังบันทึก...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            <span>ได้รับสินค้าเรียบร้อยแล้ว</span>
                          </>
                        )}
                      </button>

                      {/* Red/Outline Not Received Button */}
                      <button
                        type="button"
                        disabled={confirmingStatus}
                        onClick={() => setShowFeedbackModal(true)}
                        className="w-full py-3.5 px-4 bg-red-50 hover:bg-red-100/80 active:scale-[0.98] text-red-700 border border-red-200 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span>ยังไม่ได้รับสินค้า (แจ้งเรื่อง)</span>
                      </button>
                    </div>
                  </div>
                ) : order.customerReceivedStatus === "RECEIVED" ? (
                  // State 2: Customer confirmed RECEIVED
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-emerald-950 text-base">
                            ลูกค้ายืนยันว่า: ได้รับสินค้าเรียบร้อยแล้ว
                          </h4>
                          <span className="text-[10px] font-bold bg-emerald-200/90 text-emerald-900 px-2.5 py-0.5 rounded-full">
                            ยืนยันสำเร็จ
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800">
                          {order.customerConfirmedAt
                            ? `ยืนยันเมื่อ ${moment(order.customerConfirmedAt).format(
                                "D MMMM YYYY เวลา HH:mm น."
                              )}`
                            : "บันทึกการยืนยันเรียบร้อยแล้ว"}
                        </p>
                        <p className="text-[11px] text-emerald-700 pt-0.5">
                          ขอบคุณที่เลือกซื้อสินค้ากับร้านเกษรบ้านป่าเวียง โอกาสหน้ายินดีให้บริการใหม่ครับ ❤️
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/receipt/${order.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100/60 border border-emerald-300 px-4 py-2.5 rounded-xl transition-all shadow-2xs shrink-0"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>ดูใบเสร็จรับเงิน</span>
                    </Link>
                  </div>
                ) : (
                  // State 3: Customer reported NOT_RECEIVED
                  <div className="space-y-4 bg-red-50/80 p-5 rounded-2xl border border-red-200">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-red-950 text-base">
                            แจ้งเรื่อง: ยังไม่ได้รับสินค้า
                          </h4>
                          <span className="text-[10px] font-bold bg-red-200 text-red-900 px-2.5 py-0.5 rounded-full">
                            อยู่ระหว่างตรวจสอบ
                          </span>
                        </div>
                        <p className="text-xs text-red-800">
                          {order.customerConfirmedAt
                            ? `แจ้งเรื่องเมื่อ ${moment(order.customerConfirmedAt).format(
                                "D MMMM YYYY เวลา HH:mm น."
                              )}`
                            : "บันทึกรายงานปัญหาเรียบร้อย"}
                        </p>
                        {order.customerFeedback && (
                          <p className="text-xs text-red-900 bg-white/90 p-2.5 rounded-xl border border-red-200 font-medium">
                            💬 รายละเอียดที่แจ้ง: &quot;{order.customerFeedback}&quot;
                          </p>
                        )}
                        <p className="text-[11px] text-red-700 leading-relaxed pt-1">
                          ระบบส่งเรื่องไปยังร้านเกษรบ้านป่าเวียงและไรเดอร์แล้ว เจ้าหน้าที่จะเร่งตรวจสอบและติดต่อกลับโดยเร็วที่สุด หรือสามารถโทรติดต่อร้านได้ทันทีที่{" "}
                          <strong>089-851-0807</strong>
                        </p>
                      </div>
                    </div>

                    {/* Change status back to received if it arrived */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-red-200/60">
                      <span className="text-[11px] text-gray-500">
                        หากได้รับพัสดุในภายหลังแล้ว สามารถกดยืนยันใหม่ได้:
                      </span>
                      <button
                        type="button"
                        disabled={confirmingStatus}
                        onClick={() => handleConfirmReceipt("RECEIVED")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ได้รับสินค้าแล้ว (เปลี่ยนสถานะ)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Two Columns: Left (Rider & Location) | Right (Items & Summary) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Rider Information Card (if Delivery mode) */}
                {order.deliveryType !== "PICKUP" && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-[#b90000] flex items-center justify-center font-bold">
                          <Truck className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">ข้อมูลพนักงานจัดส่ง (Rider)</h4>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {order.rider ? "มีพนักงานรับงานแล้ว" : "อยู่ระหว่างการจัดหาไรเดอร์"}
                      </span>
                    </div>

                    {order.rider ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#b90000] to-red-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 overflow-hidden">
                            {order.rider.image ? (
                              <img
                                src={order.rider.image}
                                alt={order.rider.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              order.rider.name.slice(0, 1)
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-black text-gray-900 text-base">{order.rider.name}</h5>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                พนักงานประจำร้านเกษรบ้านป่าเวียง
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                              <span>
                                ยานพาหนะ:{" "}
                                <span className="font-semibold text-gray-800">
                                  {order.rider.vehicle || "รถจักรยานยนต์"}
                                </span>
                              </span>
                              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {order.rider.rating ? order.rider.rating.toFixed(1) : "5.0"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Call button */}
                        <a
                          href={`tel:${order.rider.phone}`}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                          <span>โทรหาไรเดอร์ ({order.rider.phone})</span>
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">ทางร้านกำลังจัดเตรียมพนักงานส่งสินค้า</span>
                          <span>เมื่อร้านค้ายืนยันออเดอร์แล้ว จะมอบหมายพนักงานส่งสินค้าที่พร้อมที่สุดนำส่งให้อย่างรวดเร็วครับ</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Live Delivery Tracking Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#b90000]" />
                      {order.deliveryType === "PICKUP"
                        ? "แผนที่จุดรับสินค้าหน้าร้าน & ขอบเขตบริการ"
                        : "แผนที่ติดตามการจัดส่งสินค้า (Live Delivery Map)"}
                    </span>
                    {order.latitude && order.longitude ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>มีพิกัด GPS ปลายทาง</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">
                        (แสดงตำแหน่งร้านและขอบเขตรัศมีให้บริการ)
                      </span>
                    )}
                  </div>

                  <DeliveryMap
                    storeLat={deliverySetting?.storeLat || 18.564567}
                    storeLng={deliverySetting?.storeLng || 99.458904}
                    storeName="ร้านเกษรบ้านป่าเวียง"
                    storeAddress={deliverySetting?.storeAddress}
                    storePhone={deliverySetting?.storePhone}
                    maxDistanceKm={deliverySetting?.maxDistanceKm || 5}
                    customerLat={order.latitude}
                    customerLng={order.longitude}
                    customerName={order.customerName || "ลูกค้า"}
                    customerPhone={order.customerPhone || undefined}
                    customerAddress={order.shippingAddress || "ที่อยู่จัดส่ง"}
                    riderName={order.rider?.name}
                    riderPhone={order.rider?.phone}
                    riderVehicle={order.rider?.vehicle || "รถจักรยานยนต์"}
                    deliveryStatus={order.deliveryStatus || "PENDING"}
                    orderStatus={order.status}
                    deliveryType={order.deliveryType || "DELIVERY"}
                    height="420px"
                    showControls={true}
                    showLegend={true}
                  />
                </div>

                {/* Shipping Address / Pickup Store Info */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        {order.deliveryType === "PICKUP" ? (
                          <Store className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {order.deliveryType === "PICKUP"
                          ? "ข้อมูลสาขาที่รับสินค้า"
                          : "ที่อยู่ปลายทางสำหรับจัดส่ง"}
                      </h4>
                    </div>

                    {order.latitude && order.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>เปิดใน Google Maps</span>
                      </a>
                    )}
                  </div>

                  {order.deliveryType === "PICKUP" ? (
                    <div className="space-y-2 text-xs text-gray-700 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                      <div className="font-bold text-blue-900 text-sm">🏬 ร้านเกษรบ้านป่าเวียง</div>
                      <p className="text-gray-600">
                        📍 33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240
                      </p>
                      <div className="flex items-center gap-4 pt-1 text-gray-700">
                        <span>
                          👤 ผู้มารับ:{" "}
                          <strong className="text-gray-900">{order.customerName || "-"}</strong>
                        </span>
                        <span>
                          📞 โทร:{" "}
                          <strong className="text-gray-900">{order.customerPhone || "-"}</strong>
                        </span>
                      </div>
                      {order.pickupTime && (
                        <div className="pt-1 text-[#b90000] font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>เวลานัดรับสินค้า: {order.pickupTime}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-gray-700 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-sm">
                          {order.customerName || "ลูกค้า"}
                        </span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{order.customerPhone || "-"}</span>
                        </a>
                      </div>

                      <p className="text-gray-600 leading-relaxed">
                        📍 {order.shippingAddress || "ไม่ได้ระบุที่อยู่จัดส่งโดยละเอียด"}
                      </p>

                      {order.notes && (
                        <div className="pt-2 border-t border-gray-200/60 text-gray-600">
                          <span className="font-bold text-gray-800">📝 หมายเหตุ:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Items & Payment Details (1 col) */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-bold text-gray-900 text-sm">รายการสินค้า</h4>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="flex-1 truncate">
                          <span className="font-bold text-gray-800 block truncate">
                            {item.productName}
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            จำนวน: {item.quantity} ชิ้น
                          </span>
                        </div>
                        <div className="font-bold text-gray-900 shrink-0">
                          ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>วิธีการชำระเงิน:</span>
                      <span className="font-bold text-gray-900">
                        {order.paymentMethod === "PROMPTPAY"
                          ? "สแกน QR Code พร้อมเพย์"
                          : order.paymentMethod === "TRANSFER"
                          ? "โอนผ่านธนาคาร กสิกรไทย"
                          : order.paymentMethod === "COD"
                          ? "เก็บเงินปลายทาง (COD)"
                          : "เงินสดหน้าร้าน"}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                      <span className="font-bold text-gray-900 text-sm">ยอดชำระสุทธิ:</span>
                      <span className="font-black text-xl text-[#b90000]">
                        ฿{order.totalAmount.toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Need Help Card */}
                <div className="bg-red-50/50 rounded-3xl p-5 border border-red-100 text-xs space-y-2 text-gray-700">
                  <span className="font-bold text-red-900 block text-sm">ต้องการความช่วยเหลือ?</span>
                  <p className="text-gray-600 leading-relaxed">
                    หากมีข้อสงสัยเกี่ยวกับสินค้าหรือการจัดส่ง สามารถติดต่อร้านเกษรบ้านป่าเวียงได้โดยตรง
                  </p>
                  <a
                    href="tel:0898510807"
                    className="inline-flex items-center gap-1.5 font-bold text-[#b90000] hover:underline pt-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>โทรติดต่อร้าน: 089-851-0807</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#b90000] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
