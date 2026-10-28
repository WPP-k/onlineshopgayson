"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Barcode } from "@/components/Barcode";
import {
  searchProductByBarcode,
  updateProductFromHandheld,
  createNewProductFromHandheld,
  verifyToteItemScan,
  toggleToteItemVerified,
  acceptAllTote,
  createNewTote,
  ToteData,
  ToteItemData,
} from "./actions";
import {
  ScanLine,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Tablet,
  Home,
  Camera,
  Layers,
  Sparkles,
  Search,
  PackagePlus,
  X,
  History,
  Box,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductItem {
  id: string;
  sku: string | null;
  productCode?: string | null;
  unit?: string | null;
  toteCode?: string | null;
  name: string;
  price: number;
  costPrice: number | null;
  stock: number;
  image: string;
  status: string;
  category?: Category | null;
}

interface Props {
  categories: Category[];
  initialTotes: ToteData[];
}

export function HandheldClient({ categories, initialTotes }: Props) {
  // Main Navigation Mode: 'TOTE' (ตรวจรับสินค้าใน Tote) or 'SCAN' (สแกนค้นหา/จัดการเดี่ยว)
  const [activeMode, setActiveMode] = useState<"TOTE" | "SCAN">("TOTE");

  // TOTE RECEIVING STATE
  const [totes, setTotes] = useState<ToteData[]>(initialTotes);
  const [selectedToteId, setSelectedToteId] = useState<string>(
    initialTotes[0]?.id || ""
  );
  const [toteScanInput, setToteScanInput] = useState("");
  const [isToteScanning, setIsToteScanning] = useState(false);
  const [newToteCode, setNewToteCode] = useState("");
  const [isAddingToteModal, setIsAddingToteModal] = useState(false);

  // SINGLE SCAN STATE
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductItem | null>(null);
  const [recentScans, setRecentScans] = useState<ProductItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Audio mute toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // New product registration modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Quick edit price & stock
  const [customStockInput, setCustomStockInput] = useState("");
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Camera scan fallback modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const toteInputRef = useRef<HTMLInputElement>(null);

  // Refocus input
  const refocusInput = () => {
    setTimeout(() => {
      if (!isRegisterModalOpen && !isCameraOpen && !isAddingToteModal) {
        if (activeMode === "TOTE") {
          toteInputRef.current?.focus();
        } else {
          barcodeInputRef.current?.focus();
        }
      }
    }, 100);
  };

  useEffect(() => {
    refocusInput();
  }, [activeMode, selectedToteId, isRegisterModalOpen, isCameraOpen, isAddingToteModal]);

  // Web Audio Synthesizer Beeps
  const playBeep = (freq = 880, type: OscillatorType = "sine", duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // audio autoplay policy
    }
  };

  const playSuccessBeep = () => {
    playBeep(987.77, "sine", 0.08); // B5
    setTimeout(() => playBeep(1318.51, "sine", 0.12), 90); // E6
  };

  const playErrorBeep = () => {
    playBeep(261.63, "sawtooth", 0.2); // Low buzzer
  };

  const currentTote = totes.find((t) => t.id === selectedToteId) || totes[0];

  // ==========================================
  // TOTE SCANNING HANDLERS
  // ==========================================

  // Scan item in current Tote
  const handleToteScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = toteScanInput.trim();
    if (!query || !currentTote) return;

    setIsToteScanning(true);
    setStatusMessage(null);

    const res = await verifyToteItemScan(currentTote.id, query);
    setIsToteScanning(false);

    if (res.success && res.item) {
      playSuccessBeep();
      setStatusMessage({ type: "success", text: res.message || "ตรวจรับสินค้าสำเร็จ" });
      // Update local tote item
      setTotes((prev) =>
        prev.map((t) =>
          t.id === currentTote.id
            ? {
                ...t,
                items: t.items.map((i) => (i.id === res.item.id ? res.item : i)),
              }
            : t
        )
      );
    } else {
      playErrorBeep();
      setStatusMessage({
        type: "error",
        text: res.message || `ไม่พบรหัสหรือบาร์โค้ด "${query}" ใน Tote นี้`,
      });
    }

    setToteScanInput("");
    refocusInput();
  };

  // Toggle manual checkmark in Tote Table
  const handleToggleToteItem = async (itemId: string) => {
    const res = await toggleToteItemVerified(itemId);
    if (res.success && res.item) {
      playSuccessBeep();
      setTotes((prev) =>
        prev.map((t) =>
          t.id === currentTote?.id
            ? {
                ...t,
                items: t.items.map((i) => (i.id === itemId ? res.item : i)),
              }
            : t
        )
      );
    } else {
      playErrorBeep();
      alert("เกิดข้อผิดพลาด: " + (res.error || ""));
    }
  };

  // Accept / Complete entire Tote
  const handleAcceptEntireTote = async () => {
    if (!currentTote) return;
    if (
      !confirm(
        `ยืนยันการรับสินค้าทั้งหมดใน Tote รหัส "${currentTote.code}" เข้าสู่คลังร้านค้า?`
      )
    ) {
      return;
    }

    const res = await acceptAllTote(currentTote.id);
    if (res.success) {
      playSuccessBeep();
      alert(res.message || "ตรวจรับสินค้าใน Tote เรียบร้อยแล้ว");
      setTotes((prev) =>
        prev.map((t) =>
          t.id === currentTote.id
            ? {
                ...t,
                status: "COMPLETED",
                items: t.items.map((i) => ({
                  ...i,
                  isVerified: true,
                  receivedQty: i.quantity,
                })),
              }
            : t
        )
      );
    } else {
      playErrorBeep();
      alert("เกิดข้อผิดพลาด: " + res.error);
    }
  };

  // Create new Tote
  const handleCreateToteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToteCode.trim()) return;
    const res = await createNewTote(newToteCode);
    if (res.success && res.tote) {
      playSuccessBeep();
      const newT: ToteData = {
        id: res.tote.id,
        code: res.tote.code,
        status: res.tote.status,
        createdAt: new Date().toISOString(),
        items: [],
      };
      setTotes((prev) => [...prev, newT]);
      setSelectedToteId(newT.id);
      setIsAddingToteModal(false);
      setNewToteCode("");
    } else {
      playErrorBeep();
      alert(res.error || "เกิดข้อผิดพลาด");
    }
  };

  // ==========================================
  // SINGLE SCAN HANDLERS
  // ==========================================

  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    setIsSearching(true);
    setStatusMessage(null);

    const res = await searchProductByBarcode(barcode);
    setIsSearching(false);

    if (res.error) {
      playErrorBeep();
      setStatusMessage({ type: "error", text: res.error });
    } else if (res.notFound) {
      playErrorBeep();
      setUnregisteredBarcode(barcode);
      setIsRegisterModalOpen(true);
      setStatusMessage({
        type: "info",
        text: `ไม่พบบาร์โค้ด "${barcode}" ในฐานข้อมูล - พร้อมลงทะเบียนใหม่`,
      });
    } else if (res.product) {
      playSuccessBeep();
      const p = res.product as ProductItem;
      setCurrentProduct(p);
      setCustomStockInput(p.stock.toString());
      setCustomPriceInput(p.price.toString());
      setStatusMessage({
        type: "success",
        text: `พบสินค้า: ${p.name} (คงเหลือ ${p.stock} ${p.unit || "ชิ้น"})`,
      });

      setRecentScans((prev) => {
        const filtered = prev.filter((item) => item.id !== p.id);
        return [p, ...filtered].slice(0, 8);
      });
    }

    setBarcodeInput("");
    refocusInput();
  };

  const handleStockDelta = async (delta: number) => {
    if (!currentProduct) return;
    setIsUpdating(true);
    const res = await updateProductFromHandheld({
      productId: currentProduct.id,
      stockDelta: delta,
    });
    setIsUpdating(false);

    if (res.success && res.product) {
      playSuccessBeep();
      const updated = res.product as ProductItem;
      setCurrentProduct(updated);
      setCustomStockInput(updated.stock.toString());
      setStatusMessage({
        type: "success",
        text: `${delta > 0 ? `+${delta}` : delta} ${updated.unit || "ชิ้น"} -> สต็อกปัจจุบัน ${updated.stock} ${updated.unit || "ชิ้น"}`,
      });

      setRecentScans((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } else {
      playErrorBeep();
      setStatusMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
    }
    refocusInput();
  };

  const handleSaveCustomStock = async () => {
    if (!currentProduct) return;
    const stockVal = parseInt(customStockInput, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      alert("กรุณาระบุจำนวนสต็อกที่ถูกต้อง");
      return;
    }

    setIsUpdating(true);
    const res = await updateProductFromHandheld({
      productId: currentProduct.id,
      exactStock: stockVal,
    });
    setIsUpdating(false);

    if (res.success && res.product) {
      playSuccessBeep();
      const updated = res.product as ProductItem;
      setCurrentProduct(updated);
      setStatusMessage({
        type: "success",
        text: `ปรับสต็อกเป็น ${updated.stock} ${updated.unit || "ชิ้น"} เรียบร้อย`,
      });
    } else {
      playErrorBeep();
      setStatusMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
    }
    refocusInput();
  };

  const handleSaveCustomPrice = async () => {
    if (!currentProduct) return;
    const priceVal = parseFloat(customPriceInput);
    if (isNaN(priceVal) || priceVal < 0) {
      alert("กรุณาระบุราคาที่ถูกต้อง");
      return;
    }

    setIsUpdating(true);
    const res = await updateProductFromHandheld({
      productId: currentProduct.id,
      newPrice: priceVal,
    });
    setIsUpdating(false);

    if (res.success && res.product) {
      playSuccessBeep();
      const updated = res.product as ProductItem;
      setCurrentProduct(updated);
      setStatusMessage({
        type: "success",
        text: `ปรับราคาขายเป็น ฿${updated.price.toLocaleString()} เรียบร้อย`,
      });
    } else {
      playErrorBeep();
      setStatusMessage({ type: "error", text: res.error || "เกิดข้อผิดพลาด" });
    }
    refocusInput();
  };

  const handleRegisterProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRegistering(true);
    const formData = new FormData(e.currentTarget);

    const res = await createNewProductFromHandheld(formData);
    setIsRegistering(false);

    if (res.success && res.product) {
      playSuccessBeep();
      const created = res.product as ProductItem;
      setCurrentProduct(created);
      setCustomStockInput(created.stock.toString());
      setCustomPriceInput(created.price.toString());
      setIsRegisterModalOpen(false);
      setStatusMessage({
        type: "success",
        text: `ลงทะเบียนสินค้า "${created.name}" เข้าฐานข้อมูลเรียบร้อย`,
      });

      setRecentScans((prev) => [created, ...prev.filter((i) => i.id !== created.id)].slice(0, 8));
    } else {
      playErrorBeep();
      alert("เกิดข้อผิดพลาด: " + (res.error || "ไม่สามารถบันทึกได้"));
    }
    refocusInput();
  };

  // Camera Barcode Scanning Handler
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      alert("ไม่สามารถเข้าถึงกล้องถ่ายภาพได้ กรุณาใช้การพิมพ์บาร์โค้ดหรือเครื่องสแกน");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    refocusInput();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans pb-12 select-none">
      {/* 1. Header Bar: Handheld Mode */}
      <header className="bg-black/85 border-b border-gray-800 px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>HANDHELD TERMINAL</span>
                <span className="text-[10px] bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                  ONLINE
                </span>
              </h1>
              <p className="text-[10px] text-gray-400">ระบบเก็บข้อมูล & เติมสต็อกสินค้า</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-gray-800 border-gray-700 text-amber-400 hover:bg-gray-700"
                  : "bg-gray-800/40 border-gray-800 text-gray-500"
              }`}
              title={soundEnabled ? "เปิดเสียงอยู่" : "ปิดเสียง"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Switch to Store iPad view */}
            <Link
              href="/store/fulfillment"
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="สลับไปหน้าจอ iPad หน้าร้าน"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">จอ iPad หน้าร้าน</span>
            </Link>

            {/* Admin Home */}
            <Link
              href="/admin"
              className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors"
              title="กลับหน้าจัดการร้านค้า"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Top Mode Switcher: "Tote Receiving" vs "Single Scan" */}
      <div className="bg-gray-950/80 border-b border-gray-800 px-4 py-2 sticky top-[51px] z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveMode("TOTE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === "TOTE"
                  ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📋 รายการสินค้าใน Tote</span>
            </button>

            <button
              onClick={() => setActiveMode("SCAN")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === "SCAN"
                  ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>🔍 สแกนค้นหา & เช็คสต็อกเดี่ยว</span>
            </button>
          </div>

          <button
            type="button"
            onClick={startCamera}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700 shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เปิดกล้อง</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-4 py-4 flex-1 flex flex-col gap-4">
        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-700/60 text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-red-950/70 border-red-700/60 text-red-300"
                : "bg-blue-950/70 border-blue-700/60 text-blue-300"
            }`}
          >
            {statusMessage.type === "success" && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
            {statusMessage.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />}
            {statusMessage.type === "info" && <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: รายการสินค้าใน TOTE (ตรงตามกระดาษใบส่งของเป๊ะๆ) */}
        {/* ============================================================== */}
        {activeMode === "TOTE" && (
          <div className="space-y-4">
            {/* Tote Selector & Fast Scan Input */}
            <section className="bg-gray-800 rounded-2xl p-4 border border-gray-700 shadow-xl space-y-3">
              {/* Tote Selection Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>เลือกลัง Tote ที่ต้องการตรวจรับ:</span>
                    </h2>
                  </div>
                </div>

                {/* Tote Select Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedToteId}
                    onChange={(e) => {
                      setSelectedToteId(e.target.value);
                      refocusInput();
                    }}
                    className="bg-black/70 border border-gray-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-red-500"
                  >
                    {totes.map((t) => {
                      const verifiedCount = t.items.filter((i) => i.isVerified).length;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.code} ({verifiedCount}/{t.items.length} รายการ){" "}
                          {t.status === "COMPLETED" ? "✓ ครบแล้ว" : ""}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsAddingToteModal(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                    title="เพิ่ม Tote ใหม่"
                  >
                    + เพิ่ม Tote
                  </button>
                </div>
              </div>

              {/* Fast Barcode/ProductCode Laser Scan Input inside Current Tote */}
              <form onSubmit={handleToteScanSubmit} className="space-y-2">
                <label className="text-xs font-bold text-gray-300 tracking-wider flex items-center gap-1.5 uppercase">
                  <ScanLine className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>
                    ยิงบาร์โค้ด หรือ รหัสสินค้าใน Tote นี้ ({currentTote?.code})
                  </span>
                </label>

                <div className="relative flex items-center">
                  <input
                    ref={toteInputRef}
                    type="text"
                    value={toteScanInput}
                    onChange={(e) => setToteScanInput(e.target.value)}
                    placeholder="ยิงบาร์โค้ด 13 หลัก หรือ รหัสสินค้า 8 หลัก..."
                    className="w-full bg-black/70 border-2 border-red-500/80 focus:border-red-400 text-white text-base font-mono rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-red-500/20 shadow-inner placeholder:text-gray-500 tracking-wider"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isToteScanning || !toteScanInput.trim()}
                    className="absolute right-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    {isToteScanning ? "กำลังตรวจ..." : "ตรวจรับ"}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  * ช่องค้นหา Auto-focus ตลอดเวลา ยิงด้วยเลเซอร์เพื่อตรวจรับได้ต่อเนื่องทันที
                </p>
              </form>
            </section>

            {/* Official Tote Items Sheet Table (ตามแบบในกระดาษใบส่งของ) */}
            {currentTote && (
              <section className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
                {/* Sheet Title Bar */}
                <div className="bg-gray-900 px-5 py-3 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="text-amber-400">รายการสินค้าใน Tote</span>
                      <span className="bg-amber-950 text-amber-300 border border-amber-800/80 font-mono text-xs px-2 py-0.5 rounded-md">
                        {currentTote.code}
                      </span>
                      {currentTote.status === "COMPLETED" && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          ✓ ตรวจรับครบแล้ว
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      รวม {currentTote.items.length} รายการ (ตรวจรับแล้ว{" "}
                      {currentTote.items.filter((i) => i.isVerified).length}/
                      {currentTote.items.length})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAcceptEntireTote}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยืนยันรับเข้าสต็อกทั้ง Tote</span>
                  </button>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/50 border-b border-gray-700 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="p-3 text-center w-12">ลำดับ</th>
                        <th className="p-3 min-w-[180px]">รายการสินค้า</th>
                        <th className="p-3 font-mono">รหัสสินค้า</th>
                        <th className="p-3 font-mono">บาร์โค้ด</th>
                        <th className="p-3 text-center">จำนวน</th>
                        <th className="p-3 text-center">หน่วย</th>
                        <th className="p-3 text-center">ตรวจรับ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/60">
                      {currentTote.items.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            item.isVerified
                              ? "bg-emerald-950/30 hover:bg-emerald-950/40 text-emerald-200"
                              : "hover:bg-gray-700/40 text-gray-200"
                          }`}
                        >
                          {/* 1. ลำดับ */}
                          <td className="p-3 text-center font-bold text-gray-400">
                            {item.itemSeq}
                          </td>

                          {/* 2. รายการสินค้า */}
                          <td className="p-3 font-semibold">
                            <span
                              className={item.isVerified ? "text-white" : "text-gray-100"}
                            >
                              {item.name}
                            </span>
                          </td>

                          {/* 3. รหัสสินค้า */}
                          <td className="p-3 font-mono font-bold text-amber-400">
                            {item.productCode}
                          </td>

                          {/* 4. บาร์โค้ด */}
                          <td className="p-3 font-mono text-gray-300">
                            <div className="flex flex-col gap-0.5">
                              <span className="tracking-wider">{item.barcode}</span>
                              <div className="bg-white px-1 py-0.5 rounded w-fit scale-90 origin-left border border-gray-400">
                                <Barcode
                                  value={item.barcode}
                                  height={18}
                                  width={0.9}
                                  fontSize={8}
                                  displayValue={false}
                                  className="bg-transparent border-0 shadow-none p-0"
                                />
                              </div>
                            </div>
                          </td>

                          {/* 5. จำนวน (ที่ส่งมา / รับแล้ว) */}
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-black text-xs px-2 py-0.5 rounded-md bg-black/40 border border-gray-700">
                              <span
                                className={
                                  item.receivedQty >= item.quantity
                                    ? "text-emerald-400 font-bold"
                                    : "text-amber-400"
                                }
                              >
                                {item.receivedQty}
                              </span>
                              <span className="text-gray-500">/</span>
                              <span className="text-white">{item.quantity}</span>
                            </div>
                          </td>

                          {/* 6. หน่วย */}
                          <td className="p-3 text-center font-bold font-mono">
                            <span className="bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-[11px] text-gray-300">
                              {item.unit}
                            </span>
                          </td>

                          {/* 7. ตรวจรับ (ปากกาขีดถูก / Checkbox) */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleToteItem(item.id)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto border ${
                                item.isVerified
                                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                                  : "bg-gray-900 border-gray-600 text-transparent hover:border-emerald-500"
                              }`}
                              title={item.isVerified ? "ยกเลิกตรวจรับ" : "ติ๊กตรวจรับ"}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {currentTote.items.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400">
                            ยังไม่มีรายการสินค้าใน Tote นี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: สแกนค้นหา & เติมสต็อกเดี่ยว (Single Scan & Stock Intake) */}
        {/* ============================================================== */}
        {activeMode === "SCAN" && (
          <div className="space-y-4">
            {/* Barcode Scanner Input Box */}
            <section className="bg-gray-800/90 rounded-2xl p-4 border border-gray-700 shadow-xl">
              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 tracking-wider flex items-center gap-1.5 uppercase">
                    <ScanLine className="w-4 h-4 text-red-400 animate-pulse" />
                    <span>สแกนบาร์โค้ด หรือ รหัสสินค้า (Laser Gun / Scan Box)</span>
                  </label>
                </div>

                <div className="relative flex items-center">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัสสินค้าแล้วกด Enter..."
                    className="w-full bg-black/70 border-2 border-red-500/80 focus:border-red-400 text-white text-base font-mono rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-red-500/20 shadow-inner placeholder:text-gray-500 tracking-wider"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !barcodeInput.trim()}
                    className="absolute right-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    {isSearching ? (
                      <span>กำลังค้น...</span>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>ค้นหา</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>* ช่องค้นหา Auto-focus ตลอดเวลา รองรับการยิงต่อเนื่อง</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUnregisteredBarcode("");
                      setIsRegisterModalOpen(true);
                    }}
                    className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มสินค้าใหม่เข้าคลัง</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Scanned Product Card (When Found) */}
            {currentProduct ? (
              <section className="bg-gray-800 rounded-2xl border border-gray-700 p-5 shadow-2xl space-y-4">
                {/* Header / Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-900 border border-gray-700 shrink-0 shadow-md flex items-center justify-center">
                    {currentProduct.image?.startsWith("http") ||
                    currentProduct.image?.startsWith("data:image") ? (
                      <img
                        src={currentProduct.image}
                        alt={currentProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl select-none">
                        {currentProduct.image || "📦"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {currentProduct.category && (
                        <span className="bg-red-950 text-red-300 border border-red-800/50 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {currentProduct.category.name}
                        </span>
                      )}
                      {currentProduct.productCode && (
                        <span className="bg-amber-950 text-amber-300 border border-amber-800/60 font-mono text-[10px] px-2 py-0.5 rounded">
                          รหัส: {currentProduct.productCode}
                        </span>
                      )}
                      <span className="bg-gray-900 text-gray-400 font-mono text-[10px] px-2 py-0.5 rounded border border-gray-700">
                        บาร์โค้ด: {currentProduct.sku || currentProduct.id}
                      </span>
                      {currentProduct.unit && (
                        <span className="bg-gray-900 text-gray-300 font-mono text-[10px] px-2 py-0.5 rounded border border-gray-700">
                          หน่วย: {currentProduct.unit}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-white truncate leading-snug">
                      {currentProduct.name}
                    </h2>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <span className="text-xl font-black text-amber-400">
                        ฿{currentProduct.price.toLocaleString()}
                      </span>
                      {currentProduct.costPrice && (
                        <span className="text-xs text-gray-400">
                          ทุน ฿{currentProduct.costPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barcode Display */}
                {currentProduct.sku && (
                  <div className="bg-white p-2.5 rounded-xl border border-gray-300 flex justify-center shadow-inner">
                    <Barcode
                      value={currentProduct.sku}
                      height={36}
                      width={1.4}
                      fontSize={11}
                      className="w-full flex justify-center bg-transparent border-0 shadow-none"
                    />
                  </div>
                )}

                {/* Stock Display & Quick Intake Buttons */}
                <div className="bg-gray-900/90 rounded-xl p-4 border border-gray-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      จำนวนสต็อกคงเหลือในคลัง
                    </span>
                    <div
                      className={`text-lg font-black font-mono px-3 py-1 rounded-lg border ${
                        currentProduct.stock <= 5
                          ? "bg-red-900/40 border-red-500 text-red-400"
                          : "bg-emerald-900/40 border-emerald-500 text-emerald-400"
                      }`}
                    >
                      {currentProduct.stock} {currentProduct.unit || "ชิ้น"}
                    </div>
                  </div>

                  {/* Quick Add/Subtract Buttons for Fast Receiving */}
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold mb-2">
                      ⚡ เติมสต็อกรับสินค้าเข้าคลังด่วน (Quick Intake):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStockDelta(1)}
                        className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> 1
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStockDelta(5)}
                        className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> 5
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStockDelta(10)}
                        className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> 10
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStockDelta(20)}
                        className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> 20
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStockDelta(50)}
                        className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2 rounded-lg text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> รับเข้ายกลัง (50)
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || currentProduct.stock <= 0}
                        onClick={() => handleStockDelta(-1)}
                        className="bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-600 text-red-400 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" /> ตัดของออก (-1)
                      </button>
                    </div>
                  </div>

                  {/* Exact Stock Override & Price Override */}
                  <div className="pt-2 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 font-semibold block mb-1">
                        ระบุยอดสต็อกใหม่โดยตรง:
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={customStockInput}
                          onChange={(e) => setCustomStockInput(e.target.value)}
                          className="w-full bg-black/60 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={handleSaveCustomStock}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-400 font-semibold block mb-1">
                        ปรับราคาขายหน้าร้าน (฿):
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          value={customPriceInput}
                          onChange={(e) => setCustomPriceInput(e.target.value)}
                          className="w-full bg-black/60 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={handleSaveCustomPrice}
                          className="bg-amber-600 hover:bg-amber-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <div className="bg-gray-800/40 rounded-2xl border border-gray-800 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-14 h-14 rounded-full bg-gray-800 text-gray-500 flex items-center justify-center mb-3">
                  <ScanLine className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-gray-300 mb-1">
                  พร้อมรับการสแกนบาร์โค้ด
                </h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  ใช้หัวอ่านบาร์โค้ดเลเซอร์ หรือกล้องมือถือ เพื่อค้นหาหรือปรับสต็อก
                </p>
              </div>
            )}

            {/* Recent Scans Log */}
            {recentScans.length > 0 && (
              <section className="bg-gray-800/60 rounded-2xl border border-gray-700/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-red-400" />
                    <span>สินค้าที่สแกนล่าสุด ({recentScans.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRecentScans([])}
                    className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    ล้างประวัติ
                  </button>
                </div>

                <div className="divide-y divide-gray-700/50">
                  {recentScans.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentProduct(item);
                        setCustomStockInput(item.stock.toString());
                        setCustomPriceInput(item.price.toString());
                        playSuccessBeep();
                      }}
                      className="py-2.5 flex items-center justify-between hover:bg-gray-700/40 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-black border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image?.startsWith("http") ||
                          item.image?.startsWith("data:image") ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base select-none">
                              {item.image || "📦"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400">
                            {item.productCode ? `รหัส: ${item.productCode} | ` : ""}
                            {item.sku || item.id}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {item.stock} {item.unit || "ชิ้น"}
                        </span>
                        <p className="text-[10px] text-amber-400">
                          ฿{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Register New Product (เหมือนฐานข้อมูลใน Tote) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700 bg-gray-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    ลงทะเบียนสินค้าใหม่เข้าฐานข้อมูล
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    บันทึกข้อมูลคล้ายฐานข้อมูลร้านค้า / Tote
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  refocusInput();
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterProductSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    บาร์โค้ด (Barcode) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    defaultValue={unregisteredBarcode}
                    placeholder="กรอกรหัสบาร์โค้ดสินค้า (13 หลัก)"
                    className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    รหัสสินค้า (Product Code)
                  </label>
                  <input
                    type="text"
                    name="productCode"
                    placeholder="กรอกรหัสสินค้า"
                    className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  รายการสินค้า (ชื่อสินค้า) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="กรอกชื่อรายการสินค้า"
                  className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    หน่วยนับ (Unit)
                  </label>
                  <select
                    name="unit"
                    defaultValue="PC"
                    className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="PC">PC (ชิ้น/ขวด/ถุง)</option>
                    <option value="PAC">PAC (แพ็ค)</option>
                    <option value="BOX">BOX (ลัง/กล่อง)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    รหัส Tote (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="toteCode"
                    placeholder="กรอกรหัส Tote จัดสินค้า"
                    className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-red-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  หมวดหมู่สินค้า
                </label>
                <select
                  name="categoryId"
                  className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    ราคาขาย (฿) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    name="price"
                    required
                    placeholder="กรอกราคาขาย (บาท)"
                    className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    ราคาทุน (฿)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    name="costPrice"
                    placeholder="กรอกราคาทุน (บาท)"
                    className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  จำนวนสต็อกเริ่มต้น
                </label>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  defaultValue="10"
                  className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    refocusInput();
                  }}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-xs font-semibold text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isRegistering ? "กำลังบันทึก..." : "บันทึกสินค้า"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Tote */}
      {isAddingToteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-700">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-400" />
                <span>เพิ่มลัง Tote ใหม่</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddingToteModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateToteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  รหัส Tote สำหรับจัดสินค้า
                </label>
                <input
                  type="text"
                  required
                  value={newToteCode}
                  onChange={(e) => setNewToteCode(e.target.value)}
                  placeholder="กรอกรหัส Tote สำหรับจัดสินค้า"
                  className="w-full bg-black/60 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 uppercase focus:outline-none focus:border-red-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingToteModal(false)}
                  className="px-3 py-1.5 border border-gray-600 rounded-lg text-xs text-gray-300 hover:bg-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  สร้าง Tote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Camera Scanner */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden p-4 space-y-3 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1">
                <Camera className="w-4 h-4 text-red-500" />
                <span>กล้องสแกนบาร์โค้ด</span>
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border-2 border-red-500 flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse" />
            </div>

            <p className="text-[11px] text-gray-400">
              ส่องกล้องไปที่บาร์โค้ด หรือพิมพ์รหัสบาร์โค้ดในช่องค้นหา
            </p>

            <button
              type="button"
              onClick={stopCamera}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg text-xs"
            >
              ปิดกล้อง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
