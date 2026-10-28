"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  ShoppingBag,
  MapPin,
  Phone,
  Calendar,
  Lock,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  ChevronRight,
  LogOut,
  Save,
  Printer,
  X,
  FileText,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Store,
  RotateCcw,
  Check,
  Plus,
  QrCode,
  Upload,
  ZoomIn,
  Loader2,
  Copy
} from "lucide-react";
import { updateProfile } from "./actions";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

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

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
  stock?: number;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  deliveryType?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  paymentMethod?: string | null;
  pickupTime?: string | null;
  notes?: string | null;
  slipImage?: string | null;
  slipUploadedAt?: string | null;
  paymentVerifiedAt?: string | null;
  paymentRejectReason?: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
}

interface Props {
  user: UserProfile;
  orders: Order[];
}

export function ProfileClient({ user, orders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState<"orders" | "info">(() =>
    tabParam === "info" ? "info" : "orders"
  );

  useEffect(() => {
    if (tabParam === "info") {
      setActiveTab("info");
    } else if (tabParam === "orders") {
      setActiveTab("orders");
    }
  }, [tabParam]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  // Re-order states
  const addItem = useCartStore((state) => state.addItem);
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);
  const [reorderedItemId, setReorderedItemId] = useState<string | null>(null);

  const handleReorderAll = (order: Order) => {
    order.items.forEach((item) => {
      addItem(
        {
          id: item.productId,
          name: item.productName,
          price: item.price,
          image: item.image || "🛒",
        },
        item.quantity
      );
    });
    setReorderedOrderId(order.id);
    setReorderNotice(
      `เพิ่มสินค้าทั้ง ${order.items.length} รายการจากคำสั่งซื้อ #${order.id.slice(-8).toUpperCase()} ลงในตะกร้าแล้ว!`
    );
    setTimeout(() => {
      setReorderedOrderId(null);
    }, 2000);
  };

  const handleReorderSingleItem = (item: OrderItem) => {
    addItem(
      {
        id: item.productId,
        name: item.productName,
        price: item.price,
        image: item.image || "🛒",
      },
      item.quantity || 1
    );
    setReorderedItemId(item.id);
    setReorderNotice(`เพิ่ม "${item.productName}" ลงในตะกร้าแล้ว!`);
    setTimeout(() => {
      setReorderedItemId(null);
    }, 2000);
  };

  // Slip upload & view states
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  useEffect(() => {
    setOrdersList(orders);
  }, [orders]);
  const [viewingSlipImage, setViewingSlipImage] = useState<string | null>(null);
  const [viewingQrOrder, setViewingQrOrder] = useState<Order | null>(null);
  const [copiedProfileAccount, setCopiedProfileAccount] = useState(false);
  const [uploadingSlipOrderId, setUploadingSlipOrderId] = useState<string | null>(null);

  const handleCopyProfileAccount = () => {
    navigator.clipboard.writeText("1791032721");
    setCopiedProfileAccount(true);
    setTimeout(() => setCopiedProfileAccount(false), 2000);
  };

  const handleUploadSlip = async (orderId: string, file: File) => {
    setUploadingSlipOrderId(orderId);
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
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, slipImage: base64, status: "WAITING_VERIFICATION", paymentRejectReason: null }
              : o
          )
        );
        alert("✅ อัปโหลดสลิปเรียบร้อยแล้ว แอดมินจะดำเนินการตรวจสอบยอดเงินเข้าให้ครับ");
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการอัปโหลดสลิป");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูลสลิป");
    } finally {
      setUploadingSlipOrderId(null);
    }
  };

  // Form states
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("address", address);
    if (newPassword) {
      formData.append("newPassword", newPassword);
    }

    const res = await updateProfile(formData);
    setIsSaving(false);

    if (res?.error) {
      setSaveMessage({ type: "error", text: res.error });
    } else {
      setSaveMessage({ type: "success", text: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!" });
      setNewPassword("");
      setUser({ ...user, name, phone, address, role: user.role });
    }
  };

  // Filter orders
  const filteredOrders = ordersList.filter((o) => {
    if (statusFilter === "ALL") return true;
    return o.status === statusFilter;
  });

  const totalSpent = ordersList
    .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING_VERIFICATION":
        return { label: "รอแอดมินตรวจสอบยอดเงิน", icon: Clock, cls: "bg-amber-100 text-amber-800 border-amber-300" };
      case "PAID":
        return { label: "ชำระเงินแล้ว", icon: CheckCircle2, cls: "bg-green-100 text-green-800 border-green-200" };
      case "PENDING":
        return { label: "รอชำระเงิน", icon: Clock, cls: "bg-amber-100 text-amber-800 border-amber-200" };
      case "SHIPPED":
        return { label: "จัดส่งแล้ว", icon: Truck, cls: "bg-blue-100 text-blue-800 border-blue-200" };
      case "DELIVERED":
        return { label: "ได้รับสินค้าแล้ว", icon: PackageCheck, cls: "bg-purple-100 text-purple-800 border-purple-200" };
      default:
        return { label: status, icon: Clock, cls: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#b90000] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าร้านหลัก</span>
          </Link>
          <span className="text-xs text-gray-400">
            หน้าหลัก / บัญชีผู้ใช้ / {activeTab === "orders" ? "ประวัติการสั่งซื้อ" : "ข้อมูลส่วนตัว"}
          </span>
        </div>

        {/* User Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b90000] to-red-800 text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    {user.name || user.username}
                  </h1>
                  {user.role === "ADMIN" && (
                    <span className="bg-red-100 text-[#b90000] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> ผู้ดูแลระบบ
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-mono">
                  ไอดีผู้ใช้: <strong>{user.username}</strong>
                  {user.phone && <span className="ml-3 text-gray-600">📞 {user.phone}</span>}
                </p>
                <p className="text-[11px] text-gray-400">
                  สมาชิกตั้งแต่: {user.createdAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-center">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#b90000] text-xs font-bold rounded-xl transition-all border border-red-200 shadow-2xs"
                >
                  จัดการหลังบ้าน
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-[#b90000] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>

          {/* Quick Statistics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="bg-gray-50 p-3.5 rounded-2xl">
              <span className="text-[11px] text-gray-500 font-medium">คำสั่งซื้อทั้งหมด</span>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                {orders.length} <span className="text-xs font-normal text-gray-500">ออเดอร์</span>
              </p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-2xl">
              <span className="text-[11px] text-gray-500 font-medium">ยอดสั่งซื้อสะสม</span>
              <p className="text-xl font-extrabold text-[#b90000] mt-0.5">
                ฿{totalSpent.toLocaleString("th-TH")}
              </p>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[11px] text-gray-500 font-medium">ที่อยู่จัดส่งเริ่มต้น</span>
              <p className="text-xs font-semibold text-gray-800 mt-1 truncate" title={user.address || "ยังไม่ได้ระบุ"}>
                {user.address || "ยังไม่ได้ระบุที่อยู่"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ประวัติการสั่งซื้อ</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "orders" ? "bg-red-800 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "info"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>ข้อมูลส่วนตัวและที่อยู่</span>
          </button>
        </div>

        {/* TAB 1: ประวัติการสั่งซื้อ */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-2xs">
              {[
                { key: "ALL", label: `ทั้งหมด (${ordersList.length})` },
                { key: "WAITING_VERIFICATION", label: `รอตรวจยอดเงิน (${ordersList.filter((o) => o.status === "WAITING_VERIFICATION").length})` },
                { key: "PAID", label: `ชำระเงินแล้ว (${ordersList.filter((o) => o.status === "PAID").length})` },
                { key: "PENDING", label: `รอชำระเงิน (${ordersList.filter((o) => o.status === "PENDING").length})` },
                { key: "SHIPPED", label: `จัดส่งแล้ว (${ordersList.filter((o) => o.status === "SHIPPED").length})` },
                { key: "DELIVERED", label: `สำเร็จแล้ว (${ordersList.filter((o) => o.status === "DELIVERED").length})` },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    statusFilter === f.key
                      ? "bg-[#b90000] text-white shadow-xs font-bold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#b90000] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">ยังไม่มีประวัติการสั่งซื้อ</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    เมื่อคุณทำการสั่งซื้อสินค้า รายการคำสั่งซื้อจะแสดงขึ้นที่นี่
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b90000] hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <span>เลือกซื้อสินค้าหน้าร้าน</span> →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 hover:border-red-100 transition-all space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-gray-900">
                              #{order.id.slice(-8).toUpperCase()}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{badge.label}</span>
                            </span>
                            {order.deliveryType === "PICKUP" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                                <Store className="w-3 h-3" />
                                <span>รับหน้าร้าน</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-red-50 text-[#b90000] border-red-200">
                                <Truck className="w-3 h-3" />
                                <span>จัดส่งถึงที่</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            วันที่สั่งซื้อ: {order.createdAt}
                          </p>
                          {order.deliveryType === "PICKUP" ? (
                            <p className="text-xs text-blue-700 font-medium">
                              🏪 นัดรับที่ร้านเกษรบ้านป่าเวียง {order.pickupTime ? `(${order.pickupTime})` : ""}
                            </p>
                          ) : (order.shippingAddress || user.address) ? (
                            <p className="text-xs text-gray-500 truncate max-w-md">
                              📍 ส่งที่: {order.shippingAddress || user.address}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/track?orderId=${order.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                            title="ติดตามสถานะการจัดส่งพัสดุแบบเรียลไทม์"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>ติดตามสถานะ</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleReorderAll(order)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 ${
                              reorderedOrderId === order.id
                                ? "bg-emerald-600 text-white"
                                : "bg-[#b90000] hover:bg-red-800 text-white"
                            }`}
                            title="เพิ่มสินค้าทุกรายการในออเดอร์นี้ลงในตะกร้า"
                          >
                            {reorderedOrderId === order.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>เพิ่มลงตะกร้าแล้ว</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>สั่งซื้ออีกครั้ง</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(order)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#b90000] bg-gray-50 hover:bg-red-50 border border-gray-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>ดูใบเสร็จ</span>
                          </button>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="divide-y divide-gray-50">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-gray-50/60 p-2 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold shrink-0">
                                {item.image?.startsWith("http") || item.image?.startsWith("data:image") ? (
                                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xl">{item.image || "🛍️"}</span>
                                )}
                              </div>
                              <div>
                                <Link
                                  href={`/products/${item.productId}`}
                                  className="font-bold text-gray-900 hover:text-[#b90000] transition-colors line-clamp-1"
                                  title="คลิกเพื่อดูรายละเอียดสินค้า"
                                >
                                  {item.productName}
                                </Link>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  ฿{item.price.toLocaleString("th-TH")} x {item.quantity} ชิ้น
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-gray-900">
                                ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleReorderSingleItem(item)}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 border ${
                                  reorderedItemId === item.id
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "text-[#b90000] bg-red-50 hover:bg-[#b90000] hover:text-white border-red-200"
                                }`}
                                title="สั่งซื้อสินค้านี้อีกครั้ง"
                              >
                                {reorderedItemId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>เพิ่มแล้ว</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    <span>ซื้อซ้ำ</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Payment Method & Slip Verification section */}
                      {(order.paymentMethod === "PROMPTPAY" || order.paymentMethod === "TRANSFER" || order.slipImage) && (
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-800">
                                  การชำระเงิน: {order.paymentMethod === "TRANSFER" ? "โอนผ่านธนาคาร กสิกรไทย" : "สแกน QR Code พร้อมเพย์"}
                                </span>
                                {order.status === "PAID" ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✅ แอดมินตรวจสอบยอดเงินแล้ว
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                                    ⏳ รอแอดมินตรวจสอบยอดเงินเข้า
                                  </span>
                                )}
                              </div>
                              {order.paymentRejectReason && order.status !== "PAID" && (
                                <p className="text-[11px] text-red-600 font-semibold mt-1">
                                  ข้อความจากแอดมิน: {order.paymentRejectReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {order.status !== "PAID" && (
                              <button
                                type="button"
                                onClick={() => setViewingQrOrder(order)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{order.paymentMethod === "TRANSFER" ? "ดูเลขบัญชีกสิกรไทย" : "ดู QR Code พร้อมเพย์"}</span>
                              </button>
                            )}

                            {order.slipImage && (
                              <button
                                type="button"
                                onClick={() => setViewingSlipImage(order.slipImage!)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                                <span>ดูสลิป</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Summary Footer */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="text-gray-500">
                          รวมสินค้า {order.items.reduce((s, it) => s + it.quantity, 0)} ชิ้น
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-gray-600 font-medium">ยอดสุทธิ:</span>
                          <span className="text-lg font-black text-[#b90000]">
                            ฿{order.totalAmount.toLocaleString("th-TH")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ข้อมูลส่วนตัวและที่อยู่ */}
        {activeTab === "info" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#b90000] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ข้อมูลส่วนตัวและที่อยู่จัดส่ง</h2>
                <p className="text-xs text-gray-500">
                  อัปเดตชื่อ เบอร์โทร และที่อยู่สำหรับการจัดส่งสินค้าของคุณ
                </p>
              </div>
            </div>

            {saveMessage && (
              <div
                className={`mb-5 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  saveMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {saveMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{saveMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Username (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ไอดีผู้ใช้งาน (Username / Email)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 cursor-not-allowed"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  * ไอดีผู้ใช้งานไม่สามารถเปลี่ยนแปลงได้
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุลลูกค้า"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90000] text-sm bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์ลูกค้า"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90000] text-sm bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ที่อยู่จัดส่งสินค้า
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="กรอกบ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90000] text-sm bg-white resize-none"
                  />
                </div>
              </div>

              {/* Change Password (Optional) */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b90000] text-sm bg-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#b90000] hover:bg-red-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "กำลังบันทึกข้อมูล..." : "บันทึกการเปลี่ยนแปลง"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: ใบเสร็จรับเงินแบบย่อ */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 print:p-0 print:bg-white print:static print:inset-auto">
            <div 
              id="printable-receipt"
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none print:w-full print:rounded-none"
            >
              <div className="bg-[#b90000] text-white p-5 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-bold text-base">ใบเสร็จรับเงิน (Receipt)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-red-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="text-center pb-3 border-b border-dashed border-gray-200">
                  <h4 className="font-black text-base text-gray-900">ร้านเกษรบ้านป่าเวียง</h4>
                  <p className="text-gray-500">ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง</p>
                  <p className="text-gray-400 mt-1 font-mono text-[11px]">
                    เลขที่คำสั่งซื้อ: #{selectedReceipt.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-gray-400 text-[11px]">วันที่: {selectedReceipt.createdAt}</p>
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-left text-[11px] text-gray-600 space-y-0.5">
                    <p>
                      <span className="font-semibold text-gray-800">รูปแบบการรับ: </span>
                      {selectedReceipt.deliveryType === "PICKUP" ? "🏪 รับสินค้าที่หน้าร้าน (ร้านเกษรบ้านป่าเวียง)" : "🛵 จัดส่งถึงที่"}
                    </p>
                    {(selectedReceipt.customerName || user.name) && (
                      <p>
                        <span className="font-semibold text-gray-800">ผู้รับ: </span>
                        {selectedReceipt.customerName || user.name} {selectedReceipt.customerPhone ? `(${selectedReceipt.customerPhone})` : (user.phone ? `(${user.phone})` : "")}
                      </p>
                    )}
                    {selectedReceipt.deliveryType === "PICKUP" && selectedReceipt.pickupTime && (
                      <p>
                        <span className="font-semibold text-gray-800">เวลานัดรับ: </span>
                        {selectedReceipt.pickupTime}
                      </p>
                    )}
                    {selectedReceipt.deliveryType !== "PICKUP" && (selectedReceipt.shippingAddress || user.address) && (
                      <p>
                        <span className="font-semibold text-gray-800">ที่อยู่จัดส่ง: </span>
                        {selectedReceipt.shippingAddress || user.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 py-2">
                  {selectedReceipt.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-800">
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} x ฿{item.price.toLocaleString("th-TH")}
                        </p>
                      </div>
                      <span className="font-bold">
                        ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-gray-800">ยอดรวมทั้งสิ้น:</span>
                  <span className="text-xl font-black text-[#b90000]">
                    ฿{selectedReceipt.totalAmount.toLocaleString("th-TH")}
                  </span>
                </div>

                <div className="pt-2 flex flex-col gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-2.5 bg-[#b90000] hover:bg-red-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์ใบเสร็จรับเงิน</span>
                  </button>
                  <Link
                    href={`/receipt/${selectedReceipt.id}`}
                    target="_blank"
                    className="text-center text-xs text-gray-500 hover:text-[#b90000] font-semibold py-1 hover:underline"
                  >
                    เปิดดูและพิมพ์ใบเสร็จเต็มหน้า &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification for Re-order */}
        {reorderNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-200 border border-gray-800 max-w-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">{reorderNotice}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">คุณสามารถไปที่หน้าตะกร้าเพื่อตรวจสอบและชำระเงินได้ทันที</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                className="bg-[#b90000] hover:bg-red-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shadow-sm"
              >
                ดูตะกร้าสินค้า
              </Link>
              <button
                type="button"
                onClick={() => setReorderNotice(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
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
                  สลิปหลักฐานการโอนเงินที่แนบไว้
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
                <span>หลักฐานการโอนเงินเข้าบัญชีร้านเกษรบ้านป่าเวียง (กสิกรไทย)</span>
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

        {/* QR Code & Kasikorn Bank Details Modal */}
        {viewingQrOrder && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setViewingQrOrder(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  {viewingQrOrder.paymentMethod === "TRANSFER"
                    ? "ข้อมูลการโอนเงินผ่าน ธ.กสิกรไทย"
                    : "สแกน QR Code พร้อมเพย์"}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingQrOrder(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {viewingQrOrder.paymentMethod === "PROMPTPAY" ? (
                  /* PromptPay QR View */
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex flex-col items-center">
                      <img
                        src="/promptpay-qr.jpg"
                        alt="PromptPay QR"
                        className="w-48 h-auto rounded-xl object-contain shadow-xs border border-gray-200 bg-white p-2"
                      />
                      <span className="text-[11px] text-gray-600 font-medium mt-2">
                        🔒 สแกนจ่ายด้วยแอปทุกธนาคาร (PromptPay / K+)
                      </span>
                    </div>

                    <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                      <span className="font-bold text-gray-800">ยอดเงินที่ต้องสแกนจ่าย:</span>
                      <span className="text-xl font-black text-[#b90000]">
                        ฿{viewingQrOrder.totalAmount.toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Bank Transfer View */
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                      <div className="flex justify-between items-center text-gray-600">
                        <span>ธนาคารผู้รับเงิน:</span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                          ธนาคารกสิกรไทย (KBANK)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>ชื่อบัญชี:</span>
                        <span className="font-bold text-gray-900">นาย วัชรพงษ์พันธ์ กัญญา</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>เลขที่บัญชี:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-0.5 rounded">
                            179-1-03272-1
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyProfileAccount}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {copiedProfileAccount ? (
                              <>
                                <Check className="w-3 h-3 text-green-600" />
                                <span className="text-green-600 font-bold">คัดลอกแล้ว!</span>
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
                    </div>

                    <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                      <span className="font-bold text-gray-800">ยอดเงินที่ต้องโอน:</span>
                      <span className="text-xl font-black text-[#b90000]">
                        ฿{viewingQrOrder.totalAmount.toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Instruction - No slip needed */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-950">ไม่ต้องแนบสลิป</span>
                    <span>เมื่อโอนเงินแล้ว แอดมินจะตรวจสอบยอดเงินเข้าในระบบธนาคาร และจัดเตรียมสินค้าให้ท่านทันที</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewingQrOrder(null)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 rounded-lg cursor-pointer transition-colors text-xs"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

