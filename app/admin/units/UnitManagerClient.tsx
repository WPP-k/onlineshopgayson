"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Edit2, Check, X, Box } from "lucide-react";
import { createUnit, deleteUnit, updateUnit } from "./actions";

interface UnitData {
  id: string;
  name: string;
}

export default function UnitManagerClient({ units }: { units: UnitData[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    
    const res = await createUnit(formData);
    setLoading(false);
    
    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setName("");
      alert("เพิ่มหน่วยนับสำเร็จ");
    }
  };

  const handleStartEdit = (unit: UnitData) => {
    setEditId(unit.id);
    setEditName(unit.name);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    
    setSavingEdit(true);
    const formData = new FormData();
    formData.set("id", editId);
    formData.set("name", editName.trim());
    
    const res = await updateUnit(formData);
    setSavingEdit(false);
    
    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setEditId(null);
      setEditName("");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบหน่วยนับนี้?")) {
      const formData = new FormData();
      formData.set("id", id);
      const res = await deleteUnit(formData);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Box className="w-8 h-8 text-[#b90000]" />
        <h1 className="text-2xl font-extrabold text-gray-900">จัดการหน่วยนับสินค้า</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-600" /> เพิ่มหน่วยนับใหม่
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหน่วยนับ *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#b90000] focus:border-[#b90000]"
                  placeholder="กรอกชื่อหน่วยนับสินค้า (ชิ้น, แพ็ค, ลัง, กล่อง, ขวด)"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#b90000] text-white py-2 rounded-lg font-bold hover:bg-red-800 disabled:bg-gray-400 transition-colors"
              >
                {loading ? "กำลังบันทึก..." : "เพิ่มหน่วยนับ"}
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
                  <th className="p-4 border-b">ชื่อหน่วยนับ</th>
                  <th className="p-4 border-b text-center w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {editId === unit.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="border border-[#b90000] rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#b90000] w-full max-w-[200px]"
                          autoFocus
                        />
                      ) : (
                        <span>{unit.name}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {editId === unit.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              disabled={savingEdit}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-colors"
                              title="บันทึก"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                              title="ยกเลิก"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(unit)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              title="แก้ไขชื่อหน่วยนับ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(unit.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="ลบหน่วยนับ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {units.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-gray-500">
                      ยังไม่มีหน่วยนับในระบบ
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
