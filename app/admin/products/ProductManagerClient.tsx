"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Edit, X, Plus, Image as ImageIcon, Upload, RefreshCw, ScanBarcode, ZoomIn, Copy, Check, Search, Filter, ArrowUpDown, AlertTriangle, ChevronDown, Layers, PlusCircle } from "lucide-react";
import { addProduct, updateProduct, updateStock, deleteProduct } from "./actions";
import { Barcode } from "@/components/Barcode";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  sku: string | null;
  name: string;
  costPrice?: number | null;
  price: number;
  stock: number;
  minStock: number;
  image: string;
  categoryId: string | null;
  unit?: string | null;
  category?: Category | null;
}

interface Unit {
  id: string;
  name: string;
}

interface Props {
  products: Product[];
  categories: Category[];
  units: Unit[];
  initialTab?: "add" | "list" | "lowstock";
}

// Helper to generate a 13-digit standard EAN barcode
const generateRandomBarcode = (): string => {
  const prefix = "885"; // Thailand prefix
  let random = "";
  for (let i = 0; i < 9; i++) {
    random += Math.floor(Math.random() * 10);
  }
  const code = prefix + random;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + (checkDigit === 10 ? 0 : checkDigit);
};

// Helper function to compress and convert image to base64 Data URL
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 800; // Resize to max 800px for optimal performance
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress as JPEG
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export function ProductManagerClient({ products, categories, units, initialTab = "list" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab"); 

  const activeView: "add" | "list" | "lowstock" = tabParam === "add" ? "add" : (tabParam === "lowstock" ? "lowstock" : (tabParam === "list" ? "list" : initialTab as any));

  const handleViewChange = (newView: "add" | "list" | "lowstock") => {
    router.push(`/admin/products?tab=${newView}`);
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImage, setEditImage] = useState<string>("");
  const [editBarcode, setEditBarcode] = useState<string>("");
  const [addImage, setAddImage] = useState<string>("");
  const [addBarcode, setAddBarcode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal for enlarging product image or barcode
  const [previewModal, setPreviewModal] = useState<{
    type: "image" | "barcode";
    title: string;
    image?: string | null;
    barcode?: string | null;
    price?: number;
    category?: string | null;
  } | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewModal(null);
      }
    };
    if (previewModal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [previewModal]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "IN_STOCK">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "STOCK_ASC" | "NAME_ASC">("NEWEST");

  // Filter and Sort calculation
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = products
    .filter((p) => {
      // Search query (matches name or barcode/sku)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        if (!matchName && !matchSku) return false;
      }

      // Category filter
      if (selectedCategory !== "ALL") {
        if (p.categoryId !== selectedCategory) return false;
      }

      // Stock status filter
      if (activeView === "lowstock") {
        if (p.stock > p.minStock) return false; // low stock or out of stock
      } else {
        if (stockFilter === "LOW_STOCK") {
          if (p.stock > p.minStock || p.stock <= 0) return false;
        } else if (stockFilter === "OUT_OF_STOCK") {
          if (p.stock > 0) return false;
        } else if (stockFilter === "IN_STOCK") {
          if (p.stock <= 0) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "PRICE_ASC") return a.price - b.price;
      if (sortBy === "PRICE_DESC") return b.price - a.price;
      if (sortBy === "STOCK_ASC") return a.stock - b.stock;
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name, "th");
      return 0; // Default order
    });

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Handle open edit modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditImage(p.image || "");
    setEditBarcode(p.sku || "");
  };

  // Handle Add Product File Upload
  const handleAddFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await processImageFile(file);
      setAddImage(base64);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการโหลดรูปภาพ");
    }
  };

  // Handle Edit Product File Upload
  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await processImageFile(file);
      setEditImage(base64);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการโหลดรูปภาพ");
    }
  };

  // Handle Add Product Submit
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("image", addImage || "");
    formData.set("sku", addBarcode.trim());

    const res = await addProduct(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      form.reset();
      setAddImage("");
      setAddBarcode("");
      const stockInput = form.elements.namedItem("stock") as HTMLInputElement;
      if (stockInput) stockInput.value = "10";
      if (addFileInputRef.current) addFileInputRef.current.value = "";
      alert("บันทึกสินค้าเรียบร้อยแล้ว");
    }
  };

  // Handle Edit Product Submit
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("image", editImage || "");
    formData.set("sku", editBarcode.trim());

    const res = await updateProduct(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error);
    } else {
      setEditingProduct(null);
    }
  };

  // Handle Delete with Confirmation
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${name}"?`)) {
      const formData = new FormData();
      formData.append("id", id);
      await deleteProduct(formData);
    }
  };

  // Handle quick stock adjustment
  const handleStockAdjust = async (id: string, adjust: number) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("adjust", adjust.toString());
    await updateStock(formData);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {activeView === "add" ? "เพิ่มสินค้า" : activeView === "lowstock" ? "สินค้าใกล้หมด" : "รายการสินค้า"}
        </h1>

        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-xs">
          จำนวนสินค้าทั้งหมด: <span className="font-bold text-[#b90000]">{products.length}</span> รายการ
        </div>
      </div>

      {/* Section 1: เพิ่มสินค้า (แสดงเฉพาะเมื่อ activeView === "add") */}
      {activeView === "add" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#b90000] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">เพิ่มสินค้าใหม่</h2>
          </div>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-8 gap-4 items-end">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">บาร์โค้ดสินค้า</label>
                <button
                  type="button"
                  onClick={() => setAddBarcode(generateRandomBarcode())}
                  className="text-[11px] text-[#b90000] hover:text-red-800 flex items-center gap-0.5 font-semibold hover:underline cursor-pointer"
                  title="สุ่มสร้างรหัสบาร์โค้ด 13 หลักอัตโนมัติ"
                >
                  <ScanBarcode className="w-3.5 h-3.5" />
                  <span>สุ่มสร้าง</span>
                </button>
              </div>
              <input
                type="text"
                name="sku"
                value={addBarcode}
                onChange={(e) => setAddBarcode(e.target.value)}
                placeholder="กรอกรหัสบาร์โค้ดสินค้า (13 หลัก)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent font-mono"
              />
              {addBarcode && (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewModal({
                        type: "barcode",
                        title: "ตัวอย่างบาร์โค้ดสินค้าใหม่",
                        barcode: addBarcode,
                      })
                    }
                    className="cursor-pointer hover:scale-105 transition-transform"
                    title="คลิกเพื่อขยายบาร์โค้ด"
                  >
                    <Barcode value={addBarcode} height={26} width={1.1} fontSize={10} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                placeholder="กรอกชื่อสินค้า"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคาทุน (บาท)</label>
              <input
                type="number"
                name="costPrice"
                min="0"
                step="0.01"
                placeholder="0.00"
                defaultValue="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สต็อก (จำนวน) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="stock"
                required
                min="0"
                defaultValue="10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
              <select
                name="unit"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
              >
                {units.map(unit => (
                  <option key={unit.id} value={unit.name}>{unit.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                name="categoryId"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
              >
                <option value="">-- ไม่ระบุ --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            

            <div>
              <label className="block text-sm font-bold text-red-500 mb-1">MIN</label>
              <input
                type="number"
                name="minStock"
                required
                min="0"
                defaultValue="5"
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#b90000] hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm flex items-center justify-center gap-1"
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกสินค้า"}
              </button>
            </div>
          </div>

          {/* Image Input & Preview section for Add Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-2">รูปภาพสินค้า</label>
            <div className="flex flex-wrap items-center gap-4">
              {/* Preview Box */}
              <div
                onClick={() => {
                  if (addImage) {
                    setPreviewModal({
                      type: "image",
                      title: "ตัวอย่างรูปภาพสินค้าใหม่",
                      image: addImage,
                    });
                  }
                }}
                className={`w-16 h-16 bg-white rounded-lg border border-gray-300 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0 relative group ${
                  addImage ? "cursor-pointer hover:ring-2 hover:ring-red-200" : ""
                }`}
                title={addImage ? "คลิกเพื่อขยายรูปภาพ" : undefined}
              >
                {addImage?.startsWith("http") || addImage?.startsWith("data:image") ? (
                  <>
                    <img src={addImage} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </>
                ) : (
                  <ImageIcon className="w-7 h-7 text-gray-400" />
                )}
              </div>

              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={addFileInputRef}
                  onChange={handleAddFileChange}
                  accept="image/*"
                  className="hidden"
                  id="add-image-upload"
                />
                <label
                  htmlFor="add-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4 text-[#b90000]" />
                  อัปโหลดรูปภาพจากเครื่อง
                </label>

                {addImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddImage("");
                      if (addFileInputRef.current) addFileInputRef.current.value = "";
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline cursor-pointer"
                  >
                    ลบรูป
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
      )}

      {/* Section 2: รายการสินค้า & ค้นหา (แสดงทั้งในหน้าเพิ่มสินค้าและหน้ารายการสินค้า) */}
      <div className="space-y-6">
          {/* Search, Filter & Stock Quick-Action Toolbar */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า หรือ สแกนบาร์โค้ดสินค้าที่นี่..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="ล้างข้อความค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#b90000] text-gray-700"
              >
                <option value="ALL">📦 ทุกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="relative min-w-[150px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#b90000] text-gray-700"
              >
                <option value="NEWEST">⏱️ ล่าสุด</option>
                <option value="PRICE_ASC">💰 ราคา: ต่ำ ➔ สูง</option>
                <option value="PRICE_DESC">💎 ราคา: สูง ➔ ต่ำ</option>
                <option value="STOCK_ASC">📉 สต็อก: น้อย ➔ มาก</option>
                <option value="NAME_ASC">🔤 ชื่อสินค้า: ก-ฮ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills & Result Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> ตัวกรอง:
            </span>

            <button
              type="button"
              onClick={() => setStockFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stockFilter === "ALL"
                  ? "bg-[#b90000] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด ({products.length})
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("LOW_STOCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                stockFilter === "LOW_STOCK"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>สต็อกใกล้หมด ≤ 5</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  stockFilter === "LOW_STOCK" ? "bg-amber-700 text-white" : "bg-white text-amber-700"
                }`}
              >
                {lowStockCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stockFilter === "OUT_OF_STOCK"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              }`}
            >
              สินค้าหมด ({outOfStockCount})
            </button>

            <button
              type="button"
              onClick={() => setStockFilter("IN_STOCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stockFilter === "IN_STOCK"
                  ? "bg-green-600 text-white shadow-xs"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              }`}
            >
              มีสินค้า ({products.length - outOfStockCount})
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            แสดง <span className="font-bold text-gray-900">{filteredProducts.length}</span> จากทั้งหมด {products.length} รายการ
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-700 text-center w-24">
                  <div>รูปภาพสินค้า</div>
                  <div className="text-[10px] text-gray-400 font-normal">(คลิกเพื่อขยาย)</div>
                </th>
                <th className="p-4 font-semibold text-gray-700 text-center w-48">
                  <div>บาร์โค้ดสินค้า</div>
                  <div className="text-[10px] text-gray-400 font-normal">(คลิกเพื่อขยาย)</div>
                </th>
                <th className="p-4 font-semibold text-gray-700">ชื่อสินค้า</th>
                <th className="p-4 font-semibold text-gray-700 w-36">หมวดหมู่</th>
                <th className="p-4 font-semibold text-gray-700 w-28 text-right">ราคาทุน</th>
                <th className="p-4 font-semibold text-gray-700 w-28 text-right">ราคาขาย</th>
                <th className="p-4 font-semibold text-gray-700 w-28 text-right">กำไร</th>
                <th className="p-4 font-semibold text-gray-700 w-24 text-center">หน่วยนับ</th>
                <th className="p-4 font-semibold text-gray-700 w-36 text-center">สต็อก</th>
                <th className="p-4 font-semibold text-gray-700 w-32 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          type: "image",
                          title: p.name,
                          image: p.image,
                          price: p.price,
                          category: p.category?.name,
                        })
                      }
                      className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shadow-inner group relative cursor-pointer hover:border-[#b90000] hover:ring-2 hover:ring-red-200 transition-all active:scale-95"
                      title="คลิกเพื่อขยายดูรูปภาพขนาดใหญ่"
                    >
                      {p.image?.startsWith("http") || p.image?.startsWith("data:image") ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-2xl select-none group-hover:scale-110 transition-transform duration-200">
                          {p.image || "📦"}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    {p.sku ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewModal({
                            type: "barcode",
                            title: p.name,
                            barcode: p.sku,
                            price: p.price,
                            category: p.category?.name,
                          })
                        }
                        className="inline-flex flex-col items-center justify-center group cursor-pointer hover:scale-105 transition-all p-1 rounded-lg hover:ring-2 hover:ring-red-200 active:scale-95"
                        title="คลิกเพื่อขยายดูบาร์โค้ดขนาดใหญ่"
                      >
                        <div className="relative">
                          <Barcode value={p.sku} height={26} width={1.1} fontSize={10} />
                          <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 bg-[#b90000] text-white p-0.5 rounded-full shadow transition-opacity">
                            <ZoomIn className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-900 block">{p.name}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {p.category?.name ? (
                      <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200">
                        {p.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-medium text-gray-600">
                    ฿{(p.costPrice ?? 0).toLocaleString("th-TH", { minimumFractionDigits: (p.costPrice ?? 0) % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900">
                    ฿{p.price.toLocaleString("th-TH", { minimumFractionDigits: p.price % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right">
                    {(() => {
                      const profit = p.price - (p.costPrice ?? 0);
                      return (
                        <span className={`inline-block font-semibold text-xs px-2 py-0.5 rounded-md ${
                          profit > 0 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : profit < 0 
                              ? "bg-red-50 text-red-600 border border-red-200" 
                              : "text-gray-400"
                        }`}>
                          {profit >= 0 ? "+" : ""}฿{profit.toLocaleString("th-TH", { minimumFractionDigits: profit % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200">
                      {p.unit || "ชิ้น"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(p.id, -1)}
                        className="w-7 h-7 bg-gray-100 hover:bg-red-100 hover:text-[#b90000] rounded-md flex items-center justify-center font-bold text-gray-600 transition-colors border border-gray-300 active:scale-95"
                        title="ลดสต็อก 1 ชิ้น"
                      >
                        -
                      </button>
                      <span
                        className={`w-10 text-center font-bold text-sm ${
                          p.stock <= 5 ? "text-red-600 animate-pulse" : "text-gray-800"
                        }`}
                      >
                        {p.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(p.id, 1)}
                        className="w-7 h-7 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded-md flex items-center justify-center font-bold text-gray-600 transition-colors border border-gray-300 active:scale-95"
                        title="เพิ่มสต็อก 1 ชิ้น"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไขสินค้า"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบสินค้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-base font-medium">ยังไม่มีรายการสินค้าในระบบ</p>
                    <p className="text-sm">กรอกแบบฟอร์มด้านบนเพื่อเพิ่มสินค้าชิ้นแรกของคุณ</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-400">
                    <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      ไม่พบสินค้าตามเงื่อนไขที่ค้นหาหรือตัวกรอง
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("ALL");
                        setStockFilter("ALL");
                        setSortBy("NEWEST");
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลสินค้า</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <input type="hidden" name="id" value={editingProduct.id} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">บาร์โค้ดสินค้า</label>
                    <button
                      type="button"
                      onClick={() => setEditBarcode(generateRandomBarcode())}
                      className="text-[11px] text-[#b90000] hover:text-red-800 flex items-center gap-0.5 font-semibold hover:underline cursor-pointer"
                      title="สุ่มสร้างรหัสบาร์โค้ด 13 หลักอัตโนมัติ"
                    >
                      <ScanBarcode className="w-3.5 h-3.5" />
                      <span>สุ่มสร้าง</span> 
                    </button> 
                  </div>
                  <input
                    type="text"
                    name="sku"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    placeholder="กรอกรหัสบาร์โค้ดสินค้า หรือ สแกนบาร์โค้ด"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent font-mono"
                  />
                  {editBarcode && (
                    <div className="mt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewModal({
                            type: "barcode",
                            title: editingProduct.name,
                            barcode: editBarcode,
                            price: editingProduct.price,
                            category: editingProduct.category?.name,
                          })
                        }
                        className="cursor-pointer hover:scale-105 transition-transform"
                        title="คลิกเพื่อขยายบาร์โค้ด"
                      >
                        <Barcode value={editBarcode} height={26} width={1.1} fontSize={10} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <select
                    name="categoryId"
                    defaultValue={editingProduct.categoryId || ""}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
                  <select
                    name="unit"
                    defaultValue={editingProduct.unit || ""}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
                  >
                    {units.map(unit => (
                      <option key={unit.id} value={unit.name}>{unit.name}</option>
                    ))}
                    {editingProduct.unit && !units.some(u => u.name === editingProduct.unit) && (
                      <option value={editingProduct.unit}>{editingProduct.unit} (ข้อมูลเดิม)</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingProduct.name}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
                />
              </div>

              {/* Image Section in Edit Modal */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">รูปภาพสินค้า</label>
                <div className="flex items-center gap-4">
                  {/* Current / New Image Preview */}
                  <div
                    onClick={() => {
                      if (editImage) {
                        setPreviewModal({
                          type: "image",
                          title: editingProduct.name,
                          image: editImage,
                          price: editingProduct.price,
                          category: editingProduct.category?.name,
                        });
                      }
                    }}
                    className={`w-20 h-20 bg-white rounded-xl border border-gray-300 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0 relative group ${
                      editImage ? "cursor-pointer hover:ring-2 hover:ring-red-200" : ""
                    }`}
                    title={editImage ? "คลิกเพื่อขยายรูปภาพ" : undefined}
                  >
                    {editImage?.startsWith("http") || editImage?.startsWith("data:image") ? (
                      <>
                        <img src={editImage} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* File Upload Button */}
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditFileChange}
                      accept="image/*"
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label
                      htmlFor="edit-image-upload"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#b90000]" />
                      เลือกรูปใหม่จากคอมพิวเตอร์
                    </label>

                    {editImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditImage("");
                          if (editFileInputRef.current) editFileInputRef.current.value = "";
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline cursor-pointer"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาทุน (บาท)</label>
                  <input
                    type="number"
                    name="costPrice"
                    min="0"
                    step="0.01"
                    defaultValue={editingProduct.costPrice ?? 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={editingProduct.price}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สต็อก (จำนวน) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    defaultValue={editingProduct.stock}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b90000] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-red-500 mb-1">MIN</label>
                  <input
                    type="number"
                    name="minStock"
                    required
                    min="0"
                    defaultValue={editingProduct.minStock ?? 5}
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#b90000] hover:bg-red-800 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image / Barcode Zoom & Lightbox Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md sm:max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/90">
              <div className="pr-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b90000] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  {previewModal.type === "image" ? "รูปภาพสินค้า" : "บาร์โค้ดสินค้า (CODE128)"}
                </span>
                <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                  {previewModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
                title="ปิด (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center justify-center bg-gray-50/40">
              {previewModal.type === "image" ? (
                <div className="w-full max-h-[60vh] flex items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-200 shadow-inner p-3">
                  {previewModal.image?.startsWith("http") || previewModal.image?.startsWith("data:image") ? (
                    <img
                      src={previewModal.image}
                      alt={previewModal.title}
                      className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-sm"
                    />
                  ) : (
                    <span className="text-8xl py-12 select-none">{previewModal.image || "📦"}</span>
                  )}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                  {previewModal.barcode ? (
                    <>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center overflow-x-auto max-w-full">
                        <Barcode
                          value={previewModal.barcode}
                          height={80}
                          width={2.2}
                          fontSize={16}
                          className="px-4 py-2 border-0 shadow-none"
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <span className="font-mono text-lg font-extrabold text-gray-900 tracking-widest bg-gray-100 px-3.5 py-1.5 rounded-lg border border-gray-200">
                          {previewModal.barcode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (previewModal.barcode) {
                              navigator.clipboard.writeText(previewModal.barcode);
                              setCopiedBarcode(true);
                              setTimeout(() => setCopiedBarcode(false), 2000);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-gray-200"
                        >
                          {copiedBarcode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-600 font-bold">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>คัดลอกรหัส</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 text-center">
                        💡 สามารถใช้เครื่องยิงบาร์โค้ดหรือกล้องมือถือสแกนจากหน้าจอนี้ได้โดยตรง
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm py-4">ไม่มีข้อมูลบาร์โค้ด</p>
                  )}
                </div>
              )}

              {/* Product Info Bar */}
              <div className="w-full mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>{previewModal.category ? `หมวดหมู่: ${previewModal.category}` : "สินค้าทั่วไป"}</span>
                {previewModal.price !== undefined && (
                  <span className="font-extrabold text-green-600 text-base">
                    ฿{previewModal.price.toLocaleString("th-TH")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
