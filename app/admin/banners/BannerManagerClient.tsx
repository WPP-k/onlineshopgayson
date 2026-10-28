"use client";

import { useState, useRef } from "react";
import { PlusCircle, Image as ImageIcon, Trash2, Power, Upload } from "lucide-react";
import { addBanner, updateBannerStatus, deleteBanner } from "./actions";

interface BannerData {
  id: string;
  image: string;
  isActive: boolean;
  order: number;
}

export default function BannerManagerClient({ banners }: { banners: BannerData[] }) {
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await processImageFile(file);
      setImage(base64);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการโหลดรูปภาพ");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert("กรุณาอัปโหลดรูปภาพโฆษณา");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.set("image", image);
    formData.set("isActive", "true");
    formData.set("order", banners.length.toString());
    
    const res = await addBanner(formData);
    setLoading(false);
    
    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setImage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("เพิ่มป้ายโฆษณาสำเร็จ");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("isActive", (!currentStatus).toString());
    await updateBannerStatus(formData);
  };

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบป้ายโฆษณานี้?")) {
      const formData = new FormData();
      formData.set("id", id);
      const res = await deleteBanner(formData);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ImageIcon className="w-8 h-8 text-[#b90000]" />
        <h1 className="text-2xl font-extrabold text-gray-900">จัดการป้ายโฆษณา (Banner)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-600" /> เพิ่มโฆษณาใหม่
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ (แนะนำขนาด 1200x400px)</label>
                
                {image ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-300 mb-3 h-32">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImage("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors mb-3"
                  >
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</span>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !image}
                className="w-full bg-[#b90000] text-white py-2 rounded-lg font-bold hover:bg-red-800 disabled:bg-gray-400 transition-colors"
              >
                {loading ? "กำลังบันทึก..." : "บันทึกป้ายโฆษณา"}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase">
                <tr>
                  <th className="p-4 border-b">รูปภาพโฆษณา</th>
                  <th className="p-4 border-b text-center">สถานะ</th>
                  <th className="p-4 border-b text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="w-48 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          banner.isActive 
                            ? "bg-green-50 text-green-700 hover:bg-green-100" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {banner.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="ลบป้ายโฆษณา"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      ยังไม่มีป้ายโฆษณาในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
