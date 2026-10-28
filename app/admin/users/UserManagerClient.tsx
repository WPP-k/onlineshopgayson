"use client";

import { useState } from "react";
import { User, ShieldCheck, Edit, Trash2, X, Plus, Eye, EyeOff, KeyRound, Truck, Star, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";
import { updateUser, createUser, deleteUser, updateAdmin, createAdmin, deleteAdmin } from "./actions";
import { createRider, updateRiderInfo, updateRiderStatus, deleteRider } from "@/app/admin/delivery/actions";
import moment from "moment";
import "moment/locale/th";

export interface UserItem {
  id: string;
  name: string | null;
  username: string;
  plainPassword?: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
  ordersCount: number;
}

export interface RiderItem {
  id: string;
  name: string;
  phone: string;
  vehicle: string | null;
  status: string;
  rating: number;
  completedJobs: number;
  createdAt: string;
  ordersCount?: number;
}

export interface AdminItem {
  id: string;
  name: string | null;
  username: string;
  plainPassword?: string | null;
  role: string;
  createdAt: string;
}

interface Props {
  users: UserItem[];
  riders: RiderItem[];
  admins: AdminItem[];
}

export function UserManagerClient({ users, riders: initialRiders, admins }: Props) {
  moment.locale("th");

  const [activeTab, setActiveTab] = useState<"users" | "riders" | "admins">("users");
  const [riders, setRiders] = useState<RiderItem[]>(initialRiders);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility maps
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [visibleAdminPasswords, setVisibleAdminPasswords] = useState<Record<string, boolean>>({});

  // Toggle password view for a user row
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Toggle password view for an admin row
  const toggleAdminPasswordVisibility = (adminId: string) => {
    setVisibleAdminPasswords((prev) => ({
      ...prev,
      [adminId]: !prev[adminId],
    }));
  };

  // User Edit form state
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Admin Edit form state
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [editAdminUsername, setEditAdminUsername] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [showEditAdminPassword, setShowEditAdminPassword] = useState(false);

  // Open Edit User
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword(user.plainPassword || "");
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
    setEditAddress(user.address || "");
    setShowEditPassword(false);
  };

  // Open Edit Admin
  const handleOpenEditAdmin = (admin: AdminItem) => {
    setEditingAdmin(admin);
    setEditAdminUsername(admin.username);
    setEditAdminPassword(admin.plainPassword || "");
    setEditAdminName(admin.name || "");
    setShowEditAdminPassword(false);
  };

  // Submit Update User
  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("id", editingUser.id);
    formData.set("username", editUsername);
    formData.set("password", editPassword);
    formData.set("name", editName);
    formData.set("phone", editPhone);
    formData.set("address", editAddress);

    const res = await updateUser(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      alert("อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว");
      setEditingUser(null);
    }
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await createUser(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      alert("เพิ่มผู้ใช้งานใหม่เรียบร้อยแล้ว");
      setIsAddingUser(false);
      form.reset();
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserItem) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${user.username}" (${user.name || ""})? การลบนี้จะไม่สามารถย้อนกลับได้`)) {
      const formData = new FormData();
      formData.set("id", user.id);
      const res = await deleteUser(formData);
      if (res?.error) {
        alert("เกิดข้อผิดพลาด: " + res.error);
      } else {
        alert("ลบผู้ใช้เรียบร้อยแล้ว");
      }
    }
  };

  // Submit Update Admin
  const handleUpdateAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("id", editingAdmin.id);
    formData.set("username", editAdminUsername);
    formData.set("password", editAdminPassword);
    formData.set("name", editAdminName);

    const res = await updateAdmin(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      alert("อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว");
      setEditingAdmin(null);
    }
  };

  // Submit Create Admin
  const handleCreateAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await createAdmin(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      alert("เพิ่มผู้ดูแลระบบใหม่เรียบร้อยแล้ว");
      setIsAddingAdmin(false);
      form.reset();
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (admin: AdminItem) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ดูแลระบบ "${admin.username}" (${admin.name || ""})?`)) {
      const formData = new FormData();
      formData.set("id", admin.id);
      const res = await deleteAdmin(formData);
      if (res?.error) {
        alert("เกิดข้อผิดพลาด: " + res.error);
      } else {
        alert("ลบผู้ดูแลระบบเรียบร้อยแล้ว");
      }
    }
  };

  // Rider state
  const [editingRider, setEditingRider] = useState<RiderItem | null>(null);
  const [isAddingRider, setIsAddingRider] = useState(false);
  const [editRiderName, setEditRiderName] = useState("");
  const [editRiderPhone, setEditRiderPhone] = useState("");
  const [editRiderVehicle, setEditRiderVehicle] = useState("");
  const [editRiderStatus, setEditRiderStatus] = useState("AVAILABLE");

  // Open Edit Rider
  const handleOpenEditRider = (rider: RiderItem) => {
    setEditingRider(rider);
    setEditRiderName(rider.name);
    setEditRiderPhone(rider.phone);
    setEditRiderVehicle(rider.vehicle || "");
    setEditRiderStatus(rider.status);
  };

  // Submit Update Rider
  const handleUpdateRiderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRider) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("id", editingRider.id);
    formData.set("name", editRiderName);
    formData.set("phone", editRiderPhone);
    formData.set("vehicle", editRiderVehicle);
    formData.set("status", editRiderStatus);

    const res = await updateRiderInfo(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      alert("บันทึกข้อมูลพนักงานส่งสินค้าเรียบร้อยแล้ว");
      setRiders((prev) =>
        prev.map((r) =>
          r.id === editingRider.id
            ? {
                ...r,
                name: editRiderName,
                phone: editRiderPhone,
                vehicle: editRiderVehicle,
                status: editRiderStatus,
              }
            : r
        )
      );
      setEditingRider(null);
    }
  };

  // Submit Create Rider
  const handleCreateRiderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await createRider(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      alert("เพิ่มพนักงานส่งสินค้าใหม่เรียบร้อยแล้ว");
      setIsAddingRider(false);
      window.location.reload();
    }
  };

  // Delete Rider
  const handleDeleteRider = async (rider: RiderItem) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน "${rider.name}"?`)) {
      const res = await deleteRider(rider.id);
      if (res?.error) {
        alert("เกิดข้อผิดพลาด: " + res.error);
      } else {
        alert("ลบพนักงานส่งสินค้าเรียบร้อยแล้ว");
        setRiders((prev) => prev.filter((r) => r.id !== rider.id));
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ฐานข้อมูลแยกอิสระระหว่างบัญชีผู้ใช้งานทั่วไป (User), พนักงานส่ง (Rider) และผู้ดูแลระบบ (Admin)
          </p>
        </div>

        {activeTab === "users" && (
          <button
            onClick={() => setIsAddingUser(true)}
            className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้ใหม่</span>
          </button>
        )}

        {activeTab === "riders" && (
          <button
            onClick={() => setIsAddingRider(true)}
            className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มพนักงานส่ง</span>
          </button>
        )}

        {activeTab === "admins" && (
          <button
            onClick={() => setIsAddingAdmin(true)}
            className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้ดูแลระบบใหม่</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        {/* Tab 1: User */}
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "users"
              ? "border-[#b90000] text-[#b90000]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>ผู้ใช้งานทั่วไป (User)</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === "users" ? "bg-red-100 text-[#b90000]" : "bg-gray-100 text-gray-600"
          }`}>
            {users.length}
          </span>
        </button>

        {/* Tab 2: พนักงานส่ง (Rider) - ตรงกลางตามที่ระบุ */}
        <button
          onClick={() => setActiveTab("riders")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "riders"
              ? "border-[#b90000] text-[#b90000]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>พนักงานส่ง (Rider)</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === "riders" ? "bg-red-100 text-[#b90000]" : "bg-gray-100 text-gray-600"
          }`}>
            {riders.length}
          </span>
        </button>

        {/* Tab 3: Admin */}
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "admins"
              ? "border-[#b90000] text-[#b90000]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ผู้ดูแลระบบ (Admin)</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === "admins" ? "bg-red-100 text-[#b90000]" : "bg-gray-100 text-gray-600"
          }`}>
            {admins.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Users Table */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">ชื่อ</th>
                  <th className="p-4">ไอดี (Username)</th>
                  <th className="p-4">รหัสผ่าน (Password)</th>
                  <th className="p-4">เบอร์โทร</th>
                  <th className="p-4">ที่อยู่</th>
                  <th className="p-4">วันที่สมัคร</th>
                  <th className="p-4 text-center">คำสั่งซื้อ</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isPwVisible = !!visiblePasswords[u.id];
                  return (
                    <tr key={u.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">
                        {u.name || "-"}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded font-bold">
                          {u.username}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                          <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-mono text-xs font-semibold text-gray-800">
                            {isPwVisible ? (u.plainPassword || "••••••") : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer transition-colors"
                            title={isPwVisible ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {u.phone || "-"}
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={u.address || ""}>
                        {u.address || "-"}
                      </td>
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {moment(u.createdAt).format("LL")}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
                          {u.ordersCount}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลผู้ใช้ (ไอดี, รหัสผ่าน ฯลฯ)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบผู้ใช้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      ยังไม่มีบัญชีผู้ใช้งานทั่วไปในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Riders Table (ตรงกลาง) */}
      {activeTab === "riders" && (
        <div className="space-y-4">
          {/* Quick info banner */}
          <div className="bg-red-50/70 border border-red-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-gray-800">
              <span className="text-xl">🛵</span>
              <div>
                <p className="font-bold text-gray-900">ระบบจัดการงานจัดส่งสินค้า (Delivery Dispatch)</p>
                <p className="text-gray-500">สามารถมอบหมายออเดอร์ให้คนขับ และติดตามสถานะนำจ่ายได้ที่หน้าจัดส่งสินค้า</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/delivery"
                className="bg-[#b90000] hover:bg-red-800 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ไปหน้าจ่ายงานจัดส่ง</span>
              </Link>
              <Link
                href="/rider"
                target="_blank"
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold px-3 py-2 rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดจอมือถือคนขับ</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">พนักงานส่งสินค้า</th>
                    <th className="p-4">เบอร์โทรศัพท์</th>
                    <th className="p-4">ยานพาหนะ / ทะเบียน</th>
                    <th className="p-4">สถานะการทำงาน</th>
                    <th className="p-4 text-center">งานสำเร็จ</th>
                    <th className="p-4 text-center">คะแนน</th>
                    <th className="p-4">วันที่ลงทะเบียน</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {riders.map((r) => {
                    const statusConfig = {
                      AVAILABLE: { label: "🟢 พร้อมรับงาน", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      BUSY: { label: "🟠 กำลังวิ่งงาน", bg: "bg-amber-50 text-amber-700 border-amber-200" },
                      OFFLINE: { label: "⚪ พักงาน", bg: "bg-gray-100 text-gray-600 border-gray-200" },
                    }[r.status] || { label: r.status, bg: "bg-gray-100 text-gray-600 border-gray-200" };

                    return (
                      <tr key={r.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-xs shrink-0">
                              🛵
                            </div>
                            <span className="font-bold text-sm text-gray-900">{r.name}</span>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-gray-700">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{r.phone}</span>
                          </span>
                        </td>

                        <td className="p-4 text-gray-600 font-medium">
                          {r.vehicle || "ไม่ได้ระบุพาหนะ"}
                        </td>

                        <td className="p-4">
                          <select
                            value={r.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              await updateRiderStatus(r.id, newStatus);
                              setRiders((prev) =>
                                prev.map((item) => (item.id === r.id ? { ...item, status: newStatus } : item))
                              );
                            }}
                            className={`font-bold px-2.5 py-1 rounded-full border text-[11px] cursor-pointer focus:outline-none transition-all ${statusConfig.bg}`}
                          >
                            <option value="AVAILABLE">🟢 พร้อมรับงาน</option>
                            <option value="BUSY">🟠 กำลังวิ่งงาน</option>
                            <option value="OFFLINE">⚪ พักงาน</option>
                          </select>
                        </td>

                        <td className="p-4 text-center">
                          <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                            {r.completedJobs} ออเดอร์
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{r.rating.toFixed(1)}</span>
                          </span>
                        </td>

                        <td className="p-4 text-gray-400">
                          {moment(r.createdAt).format("LL")}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditRider(r)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลพนักงาน"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRider(r)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบพนักงาน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {riders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-400">
                        ยังไม่มีพนักงานส่งสินค้าในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Admins Table */}
      {activeTab === "admins" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">ชื่อผู้ดูแลระบบ</th>
                  <th className="p-4">ไอดีผู้ใช้ (Username)</th>
                  <th className="p-4">รหัสผ่าน (Password)</th>
                  <th className="p-4">บทบาท (Role)</th>
                  <th className="p-4">วันที่สร้าง</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((a) => {
                  const isPwVisible = !!visibleAdminPasswords[a.id];
                  return (
                    <tr key={a.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">
                        {a.name || "Administrator"}
                      </td>
                      <td className="p-4 font-mono text-sm font-bold text-gray-800">
                        {a.username}
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                          <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-mono text-xs font-semibold text-gray-800">
                            {isPwVisible ? (a.plainPassword || "••••••") : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAdminPasswordVisibility(a.id)}
                            className="text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer transition-colors"
                            title={isPwVisible ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block bg-red-100 text-red-700 text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          ADMIN
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {moment(a.createdAt).format("LL")}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditAdmin(a)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล Admin (ไอดี, รหัสผ่าน ฯลฯ)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(a)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบ Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Edit User (Edit ID/Username, Password, Name, etc.) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  แก้ไขข้อมูลผู้ใช้งาน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ไอดีผู้ใช้ (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="กรอกไอดีผู้ใช้งาน (Username) ลูกค้า"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
                <span className="text-xs text-gray-400 mt-0.5 block">ไอดีสำหรับใช้ล็อกอินเข้าสู่ระบบ</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="text-xs text-[#b90000] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showEditPassword ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}</span>
                  </button>
                </div>
                <input
                  type={showEditPassword ? "text" : "password"}
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="ตั้งรหัสผ่านใหม่หรือคงรหัสเดิม"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล / ชื่อแสดง
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุลลูกค้า"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="กรอกเบอร์โทรศัพท์ลูกค้า"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="กรอกที่อยู่จัดส่งของลูกค้า"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New User */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  เพิ่มผู้ใช้งานใหม่
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ไอดีผู้ใช้ (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="กรอกไอดีผู้ใช้งาน (Username) ลูกค้า"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="password"
                  required
                  placeholder="กรอกรหัสผ่านเริ่มต้น"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ-นามสกุล / ชื่อแสดง
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="กรอกชื่อ-นามสกุลลูกค้า"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="กรอกเบอร์โทรศัพท์ลูกค้า"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่
                </label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="กรอกที่อยู่จัดส่งของลูกค้า"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "เพิ่มผู้ใช้งาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Admin */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  แก้ไขข้อมูลผู้ดูแลระบบ (Admin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateAdminSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ไอดีผู้ดูแลระบบ (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editAdminUsername}
                  onChange={(e) => setEditAdminUsername(e.target.value)}
                  placeholder="กรอกไอดีผู้ดูแลระบบ (Username)"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
                <span className="text-xs text-gray-400 mt-0.5 block">ไอดีสำหรับใช้ล็อกอินเข้าสู่ระบบจัดการร้านค้า</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEditAdminPassword(!showEditAdminPassword)}
                    className="text-xs text-[#b90000] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showEditAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showEditAdminPassword ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}</span>
                  </button>
                </div>
                <input
                  type={showEditAdminPassword ? "text" : "password"}
                  required
                  value={editAdminPassword}
                  onChange={(e) => setEditAdminPassword(e.target.value)}
                  placeholder="ตั้งรหัสผ่านใหม่หรือคงรหัสเดิม"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ดูแลระบบ / ตำแหน่ง
                </label>
                <input
                  type="text"
                  value={editAdminName}
                  onChange={(e) => setEditAdminName(e.target.value)}
                  placeholder="กรอกชื่อหรือตำแหน่งผู้ดูแลระบบ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Admin */}
      {isAddingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  เพิ่มผู้ดูแลระบบใหม่ (Admin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAdmin(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAdminSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ไอดี Admin (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="กรอกไอดีผู้ดูแลระบบ (Username)"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
                <span className="text-xs text-gray-400 mt-0.5 block">ไอดีสำหรับใช้ล็อกอินเข้าสู่ระบบจัดการร้านค้า</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="password"
                  required
                  placeholder="กรอกรหัสผ่านเริ่มต้น"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ดูแลระบบ / ตำแหน่ง
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="กรอกชื่อหรือตำแหน่งผู้ดูแลระบบ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingAdmin(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "เพิ่ม Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Rider */}
      {editingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-sm">
                  🛵
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  แก้ไขข้อมูลพนักงานส่งสินค้า
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRider(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateRiderSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล พนักงานส่ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRiderName}
                  onChange={(e) => setEditRiderName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุลพนักงานส่งของ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editRiderPhone}
                  onChange={(e) => setEditRiderPhone(e.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์พนักงานส่งของ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ยานพาหนะ / ทะเบียน
                </label>
                <input
                  type="text"
                  value={editRiderVehicle}
                  onChange={(e) => setEditRiderVehicle(e.target.value)}
                  placeholder="กรอกยานพาหนะและเลขทะเบียนรถ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  สถานะการทำงาน
                </label>
                <select
                  value={editRiderStatus}
                  onChange={(e) => setEditRiderStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                >
                  <option value="AVAILABLE">🟢 พร้อมรับงาน (Available)</option>
                  <option value="BUSY">🟠 กำลังวิ่งงาน (Busy)</option>
                  <option value="OFFLINE">⚪ พักงาน (Offline)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Rider */}
      {isAddingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center font-bold text-sm">
                  🛵
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  เพิ่มพนักงานส่งสินค้าใหม่ (Rider)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingRider(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRiderSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล พนักงานส่ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="กรอกชื่อ-นามสกุลพนักงานส่งของ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="กรอกเบอร์โทรศัพท์พนักงานส่งของ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ยานพาหนะ / ทะเบียน
                </label>
                <input
                  type="text"
                  name="vehicle"
                  placeholder="กรอกยานพาหนะและเลขทะเบียนรถ"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  สถานะเริ่มต้น
                </label>
                <select
                  name="status"
                  defaultValue="AVAILABLE"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent bg-white"
                >
                  <option value="AVAILABLE">🟢 พร้อมรับงาน (Available)</option>
                  <option value="BUSY">🟠 กำลังวิ่งงาน (Busy)</option>
                  <option value="OFFLINE">⚪ พักงาน (Offline)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingRider(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#b90000] hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "เพิ่มพนักงานส่ง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
