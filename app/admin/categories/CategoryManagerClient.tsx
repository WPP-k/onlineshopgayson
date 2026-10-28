"use client";

import { useState } from "react";
import { 
  PlusCircle, Layers, Trash2, Edit2, Check, X, Tag,
  Cookie, GlassWater, Utensils, ConciergeBell, Sparkles, 
  Bath, Milk, ShoppingBag, Sun, Bone, Wheat, Coffee, 
  Smile, Database, Home, LucideIcon, Search,
  Apple, Fish, Package
} from "lucide-react";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const CATEGORY_ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "Cookie", label: "ขนม", icon: Cookie },
  { key: "GlassWater", label: "น้ำ", icon: GlassWater },
  { key: "Utensils", label: "เครื่องปรุง", icon: Utensils },
  { key: "ConciergeBell", label: "มาม่า", icon: ConciergeBell },
  { key: "Sparkles", label: "ผงซักฟอก", icon: Sparkles },
  { key: "Bath", label: "สบู่", icon: Bath },
  { key: "Milk", label: "นม", icon: Milk },
  { key: "ShoppingBag", label: "ของใช้ส่วนตัว", icon: ShoppingBag },
  { key: "Sun", label: "ครีม", icon: Sun },
  { key: "Bone", label: "อาหารสัตว์", icon: Bone },
  { key: "Wheat", label: "ข้าวสาร", icon: Wheat },
  { key: "Coffee", label: "เครื่องดื่ม", icon: Coffee },
  { key: "Smile", label: "ยาสีฟัน", icon: Smile },
  { key: "Database", label: "อาหารกระป๋อง", icon: Database },
  { key: "Home", label: "ของใช้ในบ้าน", icon: Home },
  { key: "Apple", label: "ผลไม้ / ผัก", icon: Apple },
  { key: "Fish", label: "อาหารสด", icon: Fish },
  { key: "Package", label: "สินค้าทั่วไป", icon: Package },
  { key: "Tag", label: "ทั่วไป", icon: Tag },
];

export const ICON_MAP: Record<string, LucideIcon> = {
  Cookie,
  GlassWater,
  Utensils,
  ConciergeBell,
  Sparkles,
  Bath,
  Milk,
  ShoppingBag,
  Sun,
  Bone,
  Wheat,
  Coffee,
  Smile,
  Database,
  Home,
  Apple,
  Fish,
  Package,
  Tag,
};

export function resolveCategoryIcon(name: string, imageOrKey?: string | null): LucideIcon {
  if (imageOrKey && ICON_MAP[imageOrKey]) {
    return ICON_MAP[imageOrKey];
  }
  const defaultKeys: Record<string, string> = {
    "ขนม": "Cookie",
    "น้ำ": "GlassWater",
    "เครื่องปรุง": "Utensils",
    "มาม่า": "ConciergeBell",
    "ผงซักฟอก": "Sparkles",
    "สบู่": "Bath",
    "นม": "Milk",
    "ของใช้ส่วนตัว": "ShoppingBag",
    "ครีม": "Sun",
    "อาหารสัตว์": "Bone",
    "ข้าวสาร": "Wheat",
    "เครื่องดื่ม": "Coffee",
    "ยาสีฟัน": "Smile",
    "อาหารกระป๋อง": "Database",
    "ของใช้ในบ้าน": "Home",
  };
  const key = defaultKeys[name];
  if (key && ICON_MAP[key]) return ICON_MAP[key];

  return Tag;
}

interface CategoryData {
  id: string;
  name: string;
  image: string | null;
  _count: { products: number };
}

export default function CategoryManagerClient({ categories }: { categories: CategoryData[] }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("Tag");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Edit State
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("Tag");
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    const n = val.toLowerCase().trim();
    for (const item of CATEGORY_ICONS) {
      if (n.includes(item.label.toLowerCase()) || n === item.label.toLowerCase()) {
        setSelectedIcon(item.key);
        break;
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("icon", selectedIcon);
    
    const res = await createCategory(formData);
    setLoading(false);
    
    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setName("");
      setSelectedIcon("Tag");
      alert("เพิ่มหมวดหมู่สำเร็จ");
    }
  };

  const handleStartEdit = (cat: CategoryData) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.image && ICON_MAP[cat.image] ? cat.image : "Tag");
    setShowEditIconPicker(false);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditIcon("Tag");
    setShowEditIconPicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    
    setSavingEdit(true);
    const formData = new FormData();
    formData.set("id", editId);
    formData.set("name", editName.trim());
    formData.set("icon", editIcon);
    
    const res = await updateCategory(formData);
    setSavingEdit(false);
    
    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setEditId(null);
      setEditName("");
      setEditIcon("Tag");
      setShowEditIconPicker(false);
    }
  };

  const handleDelete = async (id: string, count: number) => {
    if (count > 0) {
      alert("ไม่สามารถลบได้เนื่องจากมีสินค้าอยู่ในหมวดหมู่นี้");
      return;
    }
    if (confirm("ยืนยันการลบหมวดหมู่?")) {
      const formData = new FormData();
      formData.set("id", id);
      const res = await deleteCategory(formData);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const CurrentSelectedIcon = ICON_MAP[selectedIcon] || Tag;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 text-[#b90000] rounded-2xl flex items-center justify-center shadow-xs border border-red-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการหมวดหมู่สินค้า</h1>
            <p className="text-xs text-gray-500">จัดการชื่อและไอคอนหมวดหมู่สินค้า</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-red-50 text-[#b90000] font-bold text-xs px-3 py-1.5 rounded-xl border border-red-100">
            ทั้งหมด {categories.length} หมวดหมู่
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Add Category Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 sticky top-6 space-y-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-600" />
              <span>เพิ่มหมวดหมู่ใหม่</span>
            </h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-200 focus:border-[#b90000] outline-none transition-all font-medium"
                  placeholder="เช่น ขนม, เครื่องดื่ม, ของใช้ในบ้าน"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">เลือกไอคอนหมวดหมู่</label>
                  <div className="flex items-center gap-1.5 text-xs text-[#b90000] font-bold bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                    <CurrentSelectedIcon className="w-3.5 h-3.5" />
                    <span>{CATEGORY_ICONS.find(i => i.key === selectedIcon)?.label || "ไอคอน"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-200 max-h-48 overflow-y-auto">
                  {CATEGORY_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedIcon(item.key)}
                        className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-red-100 text-[#b90000] border-2 border-[#b90000] shadow-xs scale-105"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-5 h-5" strokeWidth={1.8} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-[#b90000] hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "กำลังบันทึก..." : "เพิ่มหมวดหมู่"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Category List */}
        <div className="md:col-span-2 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาหมวดหมู่..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#b90000]"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50/80 text-gray-600 font-bold text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="p-4">ชื่อหมวดหมู่</th>
                  <th className="p-4 text-center">จำนวนสินค้า</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat) => {
                  const IconComponent = resolveCategoryIcon(cat.name, cat.image);
                  const isEditing = editId === cat.id;
                  const EditIconComp = ICON_MAP[editIcon] || Tag;

                  return (
                    <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {/* Clean Category Icon Box (No Photos) */}
                          <div className="w-12 h-12 bg-red-50 text-[#b90000] rounded-2xl flex items-center justify-center shrink-0 border border-red-100 shadow-2xs">
                            <IconComponent className="w-6 h-6" strokeWidth={1.8} />
                          </div>

                          {/* Category Name & Edit Input */}
                          <div className="flex-grow min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="border-2 border-[#b90000] rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-200 font-bold flex-grow"
                                  placeholder="ชื่อหมวดหมู่"
                                  autoFocus
                                />
                                
                                {/* Icon button to change icon in edit mode */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setShowEditIconPicker(!showEditIconPicker)}
                                    className="h-9 px-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#b90000] flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                    title="เปลี่ยนไอคอน"
                                  >
                                    <EditIconComp className="w-4 h-4" strokeWidth={1.8} />
                                    <span className="hidden sm:inline">เปลี่ยนไอคอน</span>
                                  </button>

                                  {showEditIconPicker && (
                                    <div className="absolute right-0 mt-2 p-2 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 grid grid-cols-5 gap-1.5 w-60">
                                      {CATEGORY_ICONS.map((item) => {
                                        const ItemIcon = item.icon;
                                        const isSel = editIcon === item.key;
                                        return (
                                          <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => {
                                              setEditIcon(item.key);
                                              setShowEditIconPicker(false);
                                            }}
                                            className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                              isSel
                                                ? "bg-red-50 text-[#b90000] ring-2 ring-[#b90000] font-bold"
                                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                            }`}
                                            title={item.label}
                                          >
                                            <ItemIcon className="w-4 h-4" strokeWidth={1.8} />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-800 text-sm block">
                                {cat.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="bg-red-50 text-[#b90000] border border-red-100 px-3 py-1 rounded-full font-bold text-xs shadow-2xs">
                          {cat._count.products}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-xl transition-colors cursor-pointer"
                                title="บันทึก"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer"
                                title="ยกเลิก"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(cat)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-xl transition-colors cursor-pointer"
                                title="แก้ไขหมวดหมู่"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat.id, cat._count.products)}
                                disabled={cat._count.products > 0}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title={cat._count.products > 0 ? `ไม่สามารถลบได้ มีสินค้า ${cat._count.products} รายการ` : "ลบหมวดหมู่"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-400">
                      <Layers className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="font-bold text-gray-600">ไม่พบหมวดหมู่สินค้า</p>
                      <p className="text-xs">ลองค้นหาด้วยคำอื่น หรือเพิ่มหมวดหมู่ใหม่</p>
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
