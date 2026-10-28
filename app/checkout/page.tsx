"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Truck, 
  Store, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  Upload,
  Copy,
  Check,
  Plus,
  Trash2,
  Home,
  Building2,
  Sparkles,
  Save,
  X,
  Navigation,
} from "lucide-react";
import { calculateDistanceKm } from "@/lib/distance";
import dynamic from "next/dynamic";
import LocationPickerMapWrapper from "@/components/LocationPickerMapWrapper";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
      กำลังโหลดแผนที่ขอบเขตจัดส่ง...
    </div>
  ),
});

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getTotal, clearCart } = useCartStore();

  // Fulfillment method: 'DELIVERY' | 'PICKUP'
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");

  // Customer & Shipping Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("ภายใน 1-2 ชั่วโมง (วันนี้)");
  const [customPickupTime, setCustomPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  // GPS Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Delivery Settings & Restriction
  const [deliverySetting, setDeliverySetting] = useState<any>(null);
  const [subdistrict, setSubdistrict] = useState<string>("ทุ่งกว๋าว");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isLocationOutOfRange, setIsLocationOutOfRange] = useState<boolean>(false);

  // Delivery Fee calculation
  // เมื่อเปิดใช้งานจำกัดพื้นที่:
  // - ซื้อครบยอดขั้นต่ำที่ระบุไว้ (minOrderAmount) -> ส่งฟรี (0 บาท)
  // - ซื้อไม่ถึงยอดขั้นต่ำที่ระบุไว้ -> คิดค่าส่ง 10 บาท (หรือตามที่ระบุใน deliveryFee)
  const getDeliveryFee = useCallback(() => {
    if (deliveryType !== "DELIVERY") return 0;
    if (!deliverySetting || !deliverySetting.enabled) return 0;
    const subtotal = getSubtotal();
    const minOrder = typeof deliverySetting.minOrderAmount === "number" ? deliverySetting.minOrderAmount : 0;
    if (minOrder > 0 && subtotal < minOrder) {
      return typeof deliverySetting.deliveryFee === "number" && deliverySetting.deliveryFee > 0
        ? deliverySetting.deliveryFee
        : 10;
    }
    return 0;
  }, [deliveryType, deliverySetting, getSubtotal]);

  // Final Total payable (including delivery fee)
  const getFinalTotal = useCallback(() => {
    return Math.max(0, getTotal() + getDeliveryFee());
  }, [getTotal, getDeliveryFee]);

  // Saved Addresses & New Address Management
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string;
    label?: string;
    name: string;
    phone: string;
    subdistrict: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    isDefault?: boolean;
  }>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("profile");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(false);
  const [newAddressLabel, setNewAddressLabel] = useState<string>("บ้าน");
  const [saveToProfile, setSaveToProfile] = useState<boolean>(true);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState<string>("");
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  // Address Selector & Form Modal State (Matching Images 2, 3, 4)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [modalView, setModalView] = useState<"list" | "form">("list");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [modalName, setModalName] = useState<string>("");
  const [modalPhone, setModalPhone] = useState<string>("");
  const [modalSubdistrict, setModalSubdistrict] = useState<string>("ทุ่งกว๋าว");
  const [modalAddress, setModalAddress] = useState<string>("");
  const [modalLabel, setModalLabel] = useState<string>("ที่บ้าน");
  const [modalLat, setModalLat] = useState<number>(18.790388);
  const [modalLng, setModalLng] = useState<number>(98.530349);
  const [modalDistanceKm, setModalDistanceKm] = useState<number | null>(null);
  const [isModalOutOfRange, setIsModalOutOfRange] = useState<boolean>(false);
  const [modalIsDefault, setModalIsDefault] = useState<boolean>(true);
  const [modalFormError, setModalFormError] = useState<string>("");

  // Fetch Delivery Setting on mount
  useEffect(() => {
    async function loadDeliverySettings() {
      try {
        const res = await fetch("/api/delivery-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.setting) {
            setDeliverySetting(data.setting);
          }
        }
      } catch (err) {
        console.error("Failed to load delivery settings:", err);
      }
    }
    loadDeliverySettings();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("❌ เบราว์เซอร์ของคุณไม่รองรับ GPS");
      return;
    }
    
    setIsLocating(true);
    setGpsStatus("กำลังดึงตำแหน่งปัจจุบัน (GPS)...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);

        const storeLat = deliverySetting?.storeLat || 18.564567;
        const storeLng = deliverySetting?.storeLng || 99.458904;
        const dist = calculateDistanceKm(storeLat, storeLng, lat, lng);
        setDistanceKm(dist);

        const maxDist = deliverySetting?.maxDistanceKm || 10;
        if (deliverySetting?.enabled && dist > maxDist) {
          setIsLocationOutOfRange(true);
          setGpsStatus(`⚠️ อยู่นอกพื้นที่จัดส่ง (ห่างจากร้าน ${dist} กม. เกินพิกัด ${maxDist} กม.)`);
        } else {
          setIsLocationOutOfRange(false);
          setGpsStatus(`✅ ดึงตำแหน่งปัจจุบันสำเร็จ (ห่างจากร้าน ${dist} กม. อยู่ในรัศมีจัดส่ง)`);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error(error);
        setGpsStatus("❌ ไม่สามารถดึงตำแหน่งได้ กรุณาเปิดสิทธิ์ Location ในเบราว์เซอร์");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Auto-detect current location on initial mount if not yet specified
  useEffect(() => {
    if (deliveryType === "DELIVERY" && !latitude && !longitude && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);

          const storeLat = deliverySetting?.storeLat || 18.564567;
          const storeLng = deliverySetting?.storeLng || 99.458904;
          const dist = calculateDistanceKm(storeLat, storeLng, lat, lng);
          setDistanceKm(dist);

          const maxDist = deliverySetting?.maxDistanceKm || 10;
          if (deliverySetting?.enabled && dist > maxDist) {
            setIsLocationOutOfRange(true);
            setGpsStatus(`⚠️ พิกัดปัจจุบันอยู่นอกพื้นที่จัดส่ง (${dist} กม.)`);
          } else {
            setIsLocationOutOfRange(false);
            setGpsStatus(`📍 ตรวจพบตำแหน่งปัจจุบันของคุณ (${dist} กม. จากร้านเกษรบ้านป่าเวียง)`);
          }
        },
        () => {
          // Silently handle if permission is not yet granted
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 }
      );
    }
  }, [deliveryType, deliverySetting, latitude, longitude]);

  const handleMapLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);

    if (deliverySetting?.storeLat && deliverySetting?.storeLng) {
      const dist = calculateDistanceKm(
        deliverySetting.storeLat,
        deliverySetting.storeLng,
        lat,
        lng
      );
      setDistanceKm(dist);

      if (deliverySetting.enabled && dist > deliverySetting.maxDistanceKm) {
        setIsLocationOutOfRange(true);
        setGpsStatus(`⚠️ อยู่นอกพื้นที่จัดส่ง (ห่างจากร้าน ${dist} กม. เกินพิกัด ${deliverySetting.maxDistanceKm} กม.)`);
      } else {
        setIsLocationOutOfRange(false);
        setGpsStatus(`✅ ปักหมุดสำเร็จ (ระยะทาง ${dist} กม. อยู่ในรัศมีจัดส่ง)`);
      }
    } else {
      setGpsStatus("✅ ปักหมุดตำแหน่งจัดส่งสำเร็จ");
    }
  }, [deliverySetting]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("COD"); // COD, CASH_STORE, PROMPTPAY, TRANSFER
  const [slipImage, setSlipImage] = useState<string>("");
  const [isProcessingSlip, setIsProcessingSlip] = useState(false);
  const slipFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("1791032721");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingSlip(true);
    try {
      const base64 = await compressImageFile(file);
      setSlipImage(base64);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการโหลดรูปภาพสลิป");
    } finally {
      setIsProcessingSlip(false);
    }
  };

  const renderSlipUpload = () => {
    return (
      <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <Upload className="w-4 h-4 text-[#b90000]" />
            <span>แนบสลิปหลักฐานการโอนเงิน <span className="text-red-500 font-bold">*</span></span>
          </div>
          {slipImage ? (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> แนบสลิปแล้ว
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              จำเป็นต้องแนบ
            </span>
          )}
        </div>

        {slipImage ? (
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-emerald-400 shadow-xs">
            <div className="w-16 h-20 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
              <img
                src={slipImage}
                alt="สลิปที่แนบ"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>แนบรูปสลิปเรียบร้อย</span>
              </div>
              <p className="text-[11px] text-gray-500">
                แอดมินจะตรวจสอบสลิปนี้เมื่อท่านกดยืนยันการสั่งซื้อ
              </p>
              <div className="flex items-center gap-2 pt-1">
                <label className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-blue-200">
                  <span>เปลี่ยนรูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipUpload}
                    className="hidden"
                    disabled={isProcessingSlip}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSlipImage("")}
                  className="text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors border border-red-200 cursor-pointer"
                >
                  ลบรูป
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-[#b90000] rounded-xl bg-white hover:bg-red-50/20 cursor-pointer transition-all group">
            <input
              type="file"
              accept="image/*"
              onChange={handleSlipUpload}
              className="hidden"
              disabled={isProcessingSlip}
            />
            {isProcessingSlip ? (
              <div className="flex items-center gap-2 text-xs text-gray-600 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#b90000]" />
                <span>กำลังประมวลผลรูปสลิป...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-1">
                <div className="w-9 h-9 rounded-full bg-red-50 text-[#b90000] group-hover:scale-110 flex items-center justify-center mb-1.5 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-800">
                  คลิกเพื่ออัปโหลดสลิปโอนเงิน
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  รองรับไฟล์รูปภาพ JPG, PNG จากแอปธนาคาร
                </span>
              </div>
            )}
          </label>
        )}
      </div>
    );
  };

  // Loading & validation states
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Apply a selected saved address
  const applyAddress = useCallback((addr: any) => {
    if (!addr) return;
    setSelectedAddressId(addr.id);
    setIsAddingNewAddress(false);
    if (addr.name) setCustomerName(addr.name);
    if (addr.phone) setCustomerPhone(addr.phone);
    if (addr.subdistrict) setSubdistrict(addr.subdistrict);
    if (addr.address && addr.address !== "ยังไม่ได้ระบุที่อยู่โปรไฟล์") {
      setShippingAddress(addr.address);
    } else {
      setShippingAddress("");
    }
    if (typeof addr.latitude === "number" && typeof addr.longitude === "number") {
      handleMapLocationChange(addr.latitude, addr.longitude);
    }
  }, [handleMapLocationChange]);

  // Fetch logged in user profile & localStorage addresses
  useEffect(() => {
    async function loadUserData() {
      // 1. Read localStorage saved addresses
      let localList: any[] = [];
      try {
        const raw = localStorage.getItem("my_shop_saved_addresses");
        if (raw) {
          localList = JSON.parse(raw);
        }
      } catch {}

      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const userName = data.user.name || "";
            const userPhone = data.user.phone || "";
            const userAddress = data.user.address || "";

            // Profile item
            const profileItem = {
              id: "profile",
              label: "ที่บ้าน",
              name: userName || "ลูกค้า",
              phone: userPhone,
              subdistrict: "ทุ่งกว๋าว",
              address: userAddress || "",
              isDefault: localList.length === 0,
            };

            const existingIndex = localList.findIndex((a) => a.id === "profile");
            let merged = [...localList];
            if (existingIndex >= 0) {
              if (userAddress) merged[existingIndex] = profileItem;
            } else if (userAddress || userName) {
              merged = [profileItem, ...localList];
            }

            setSavedAddresses(merged);

            // Select active address: preferred default or first valid address
            const active = merged.find((a) => a.isDefault && a.address) || merged.find((a) => a.address) || merged[0];
            if (active) {
              applyAddress(active);
            } else {
              if (userName) setCustomerName(userName);
              if (userPhone) setCustomerPhone(userPhone);
            }
            return;
          }
        }
        // If not authenticated, redirect to login
        router.replace("/login?redirect=/checkout");
        return;
      } catch (e) {
        console.error("Failed to load user info:", e);
        router.replace("/login?redirect=/checkout");
        return;
      }
      if (localList.length > 0) {
        const active = localList.find((a) => a.isDefault) || localList[0];
        applyAddress(active);
      }
    }
    loadUserData();
  }, [applyAddress]);

  // Handle Map Pin movement inside Modal
  const handleModalMapLocationChange = useCallback((lat: number, lng: number) => {
    setModalLat(lat);
    setModalLng(lng);

    if (deliverySetting?.storeLat && deliverySetting?.storeLng) {
      const dist = calculateDistanceKm(
        deliverySetting.storeLat,
        deliverySetting.storeLng,
        lat,
        lng
      );
      setModalDistanceKm(dist);

      if (deliverySetting.enabled && dist > deliverySetting.maxDistanceKm) {
        setIsModalOutOfRange(true);
      } else {
        setIsModalOutOfRange(false);
      }
    }
  }, [deliverySetting]);

  // Open modal to add a brand new address
  const handleOpenCreateAddress = () => {
    setEditingAddressId(null);
    setModalName(customerName || "");
    setModalPhone(customerPhone || "");
    setModalSubdistrict(subdistrict || "ทุ่งกว๋าว");
    setModalAddress("");
    setModalLabel("ที่บ้าน");
    const initLat = latitude || deliverySetting?.storeLat || 18.564567;
    const initLng = longitude || deliverySetting?.storeLng || 99.458904;
    setModalLat(initLat);
    setModalLng(initLng);
    if (deliverySetting?.storeLat && deliverySetting?.storeLng) {
      const dist = calculateDistanceKm(deliverySetting.storeLat, deliverySetting.storeLng, initLat, initLng);
      setModalDistanceKm(dist);
      setIsModalOutOfRange(deliverySetting.enabled && dist > deliverySetting.maxDistanceKm);
    }
    setModalIsDefault(savedAddresses.length === 0);
    setModalFormError("");
    setModalView("form");
    setIsAddressModalOpen(true);
  };

  // Open modal to edit an existing address
  const handleOpenEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setModalName(addr.name || "");
    setModalPhone(addr.phone || "");
    setModalSubdistrict(addr.subdistrict || "ทุ่งกว๋าว");
    setModalAddress(addr.address && addr.address !== "ยังไม่ได้ระบุที่อยู่โปรไฟล์" ? addr.address : "");
    setModalLabel(addr.label || "ที่บ้าน");
    const editLat = typeof addr.latitude === "number" ? addr.latitude : (latitude || deliverySetting?.storeLat || 18.564567);
    const editLng = typeof addr.longitude === "number" ? addr.longitude : (longitude || deliverySetting?.storeLng || 99.458904);
    setModalLat(editLat);
    setModalLng(editLng);
    if (deliverySetting?.storeLat && deliverySetting?.storeLng) {
      const dist = calculateDistanceKm(deliverySetting.storeLat, deliverySetting.storeLng, editLat, editLng);
      setModalDistanceKm(dist);
      setIsModalOutOfRange(deliverySetting.enabled && dist > deliverySetting.maxDistanceKm);
    }
    setModalIsDefault(!!addr.isDefault);
    setModalFormError("");
    setModalView("form");
    setIsAddressModalOpen(true);
  };

  // Save address from Modal (either new or edited)
  const handleSaveModalAddress = async () => {
    if (!modalName.trim()) {
      setModalFormError("กรุณากรอกชื่อ-นามสกุลผู้รับสินค้า");
      return;
    }
    if (!modalPhone.trim()) {
      setModalFormError("กรุณากรอกเบอร์โทรศัพท์ติดต่อ");
      return;
    }
    if (!modalAddress.trim()) {
      setModalFormError("กรุณากรอกรายละเอียดที่อยู่จัดส่ง");
      return;
    }

    setIsSavingAddress(true);
    setModalFormError("");

    const targetId = editingAddressId || `addr_${Date.now()}`;
    const newItem = {
      id: targetId,
      label: modalLabel || "ที่บ้าน",
      name: modalName.trim(),
      phone: modalPhone.trim(),
      subdistrict: modalSubdistrict,
      address: modalAddress.trim(),
      latitude: modalLat,
      longitude: modalLng,
      isDefault: modalIsDefault,
    };

    let updatedList: any[];
    if (editingAddressId) {
      updatedList = savedAddresses.map((item) => {
        if (item.id === editingAddressId) {
          return newItem;
        }
        if (modalIsDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      });
    } else {
      updatedList = [
        newItem,
        ...savedAddresses.map((item) => (modalIsDefault ? { ...item, isDefault: false } : item)),
      ];
    }

    setSavedAddresses(updatedList);
    try {
      localStorage.setItem("my_shop_saved_addresses", JSON.stringify(updatedList));
    } catch {}

    // Apply to checkout state immediately
    applyAddress(newItem);

    // If modalIsDefault, sync with database profile
    if (modalIsDefault) {
      try {
        await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: modalName.trim(),
            phone: modalPhone.trim(),
            address: modalAddress.trim(),
          }),
        });
      } catch (err) {
        console.warn("Could not sync profile:", err);
      }
    }

    setIsSavingAddress(false);
    setIsAddressModalOpen(false);
    setAddressSuccessMsg(editingAddressId ? "✅ แก้ไขที่อยู่จัดส่งเรียบร้อยแล้ว" : "✅ เพิ่มที่อยู่ใหม่เรียบร้อยแล้ว");
    setTimeout(() => setAddressSuccessMsg(""), 3500);
  };

  // Start adding a new delivery address
  const handleStartAddNewAddress = () => {
    handleOpenCreateAddress();
  };

  // Cancel adding new address and revert
  const handleCancelAddNewAddress = () => {
    setIsAddingNewAddress(false);
    if (savedAddresses.length > 0) {
      const target = savedAddresses.find((a) => a.id !== "new" && a.id === selectedAddressId) || savedAddresses.find((a) => a.id !== "new") || savedAddresses[0];
      applyAddress(target);
    }
  };

  // Save new address to localStorage and profile
  const handleSaveNewAddress = async () => {
    handleSaveModalAddress();
  };

  // Delete an address from saved addresses
  const handleDeleteAddress = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(updated);
    try {
      localStorage.setItem("my_shop_saved_addresses", JSON.stringify(updated));
    } catch {}
    if (selectedAddressId === id && updated.length > 0) {
      applyAddress(updated[0]);
    }
  };

  // Update payment method default when changing delivery type
  const handleDeliveryTypeChange = (type: "DELIVERY" | "PICKUP") => {
    setDeliveryType(type);
    if (type === "DELIVERY") {
      setPaymentMethod("COD");
    } else {
      setPaymentMethod("CASH_STORE");
    }
    setFormError("");
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (items.length === 0) {
      setFormError("ไม่มีสินค้าในตะกร้า กรุณาเลือกซื้อสินค้าก่อนทำรายการ");
      return;
    }

    if (!customerName.trim()) {
      setFormError(deliveryType === "DELIVERY" ? "กรุณาระบุชื่อผู้รับสินค้า" : "กรุณาระบุชื่อผู้มารับสินค้า");
      return;
    }

    if (!customerPhone.trim()) {
      setFormError("กรุณาระบุเบอร์โทรศัพท์สำหรับติดต่อ");
      return;
    }

    if (deliveryType === "DELIVERY" && !shippingAddress.trim()) {
      setFormError("กรุณาระบุที่อยู่จัดส่งสินค้าโดยละเอียด");
      return;
    }

    if (deliveryType === "DELIVERY" && deliverySetting?.enabled) {
      if (subdistrict === "OTHER") {
        setFormError("ขออภัยครับ พื้นที่จัดส่งที่เลือกอยู่นอกเขตให้บริการ กรุณาเลือก 'รับสินค้าที่หน้าร้าน' แทนครับ");
        return;
      }

      if (isLocationOutOfRange || (distanceKm !== null && distanceKm > deliverySetting.maxDistanceKm)) {
        setFormError(`ขออภัยครับ พิกัดของคุณอยู่ห่างจากร้าน ${distanceKm} กม. ซึ่งเกินระยะทางที่ร้านกำหนดไว้ (${deliverySetting.maxDistanceKm} กม.) กรุณาเลือก 'รับสินค้าที่หน้าร้าน' แทนครับ`);
        return;
      }
    }

    const finalPickupTime = pickupTime === "custom" ? customPickupTime : pickupTime;
    if (deliveryType === "PICKUP" && pickupTime === "custom" && !customPickupTime.trim()) {
      setFormError("กรุณาระบุเวลาที่สะดวกมารับสินค้า");
      return;
    }

    if ((paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && !slipImage) {
      setFormError("กรุณาแนบสลิปหลักฐานการโอนเงินก่อนกดยืนยันการสั่งซื้อ");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items,
        deliveryType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: deliveryType === "DELIVERY" ? shippingAddress.trim() : null,
        latitude: deliveryType === "DELIVERY" ? latitude : null,
        longitude: deliveryType === "DELIVERY" ? longitude : null,
        subdistrict: deliveryType === "DELIVERY" ? subdistrict : null,
        distanceKm: deliveryType === "DELIVERY" ? distanceKm : null,
        pickupTime: deliveryType === "PICKUP" ? finalPickupTime : null,
        paymentMethod,
        notes: notes.trim() || null,
        slipImage: (paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") ? (slipImage || null) : null,
        discountAmount: getDiscount(),
        deliveryFee: getDeliveryFee(),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        clearCart();
        router.push(`/checkout/success?orderId=${data.orderId}`);
      } else {
        setFormError(data.error || "เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col w-full bg-[#f8f9fa] min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
              🛒
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสินค้าในตะกร้า</h1>
            <p className="text-gray-500 text-sm mb-6">
              คุณยังไม่ได้เพิ่มสินค้าลงในตะกร้า หรือคำสั่งซื้อได้รับการประมวลผลแล้ว
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปเลือกซื้อสินค้า
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#f8f9fa] min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back link & Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-200 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปตะกร้า</span>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">การสั่งซื้อและชำระเงิน</h1>
              <p className="text-xs text-gray-500 mt-0.5">เลือกรูปแบบการรับสินค้าและกรอกข้อมูลผู้รับ</p>
            </div>
          </div>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="font-medium">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Fulfillment & Recipient Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: Fulfillment Option Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#b90000] text-white text-xs flex items-center justify-center font-bold">1</span>
                <span>เลือกรูปแบบการรับสินค้า (Fulfillment Method)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: จัดส่งถึงที่ */}
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange("DELIVERY")}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    deliveryType === "DELIVERY"
                      ? "border-[#b90000] bg-red-50/40 shadow-md ring-2 ring-red-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          deliveryType === "DELIVERY"
                            ? "bg-[#b90000] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-base block">จัดส่งถึงที่</span>
                        <span className="text-xs text-gray-500">ส่งตรงถึงบ้าน / ที่ทำงาน</span>
                      </div>
                    </div>
                    {deliveryType === "DELIVERY" && (
                      <CheckCircle2 className="w-5 h-5 text-[#b90000]" />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">เงื่อนไขจัดส่ง</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {deliverySetting?.enabled && deliverySetting?.minOrderAmount > 0
                        ? `ครบ ฿${deliverySetting.minOrderAmount} ส่งฟรี (ต่ำกว่าคิด ฿${deliverySetting.deliveryFee || 10})`
                        : "จัดส่งฟรีในพื้นที่"}
                    </span>
                  </div>
                </button>

                {/* Option 2: รับหน้าร้าน */}
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange("PICKUP")}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    deliveryType === "PICKUP"
                      ? "border-[#b90000] bg-red-50/40 shadow-md ring-2 ring-red-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          deliveryType === "PICKUP"
                            ? "bg-[#b90000] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-base block">รับสินค้าหน้าร้าน</span>
                        <span className="text-xs text-gray-500">รับด้วยตนเองที่ร้านเกษรบ้านป่าเวียง</span>
                      </div>
                    </div>
                    {deliveryType === "PICKUP" && (
                      <CheckCircle2 className="w-5 h-5 text-[#b90000]" />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">จุดรับสินค้า</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">หน้าร้านเกษรบ้านป่าเวียง</span>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 2: Delivery or Pickup Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#b90000] text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>
                    {deliveryType === "DELIVERY"
                      ? "ข้อมูลที่อยู่สำหรับจัดส่งสินค้า"
                      : "ข้อมูลสำหรับรับสินค้าที่หน้าร้าน"}
                  </span>
                </h2>
                {deliveryType === "DELIVERY" && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalView("list");
                      setIsAddressModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#b90000] border border-red-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มที่อยู่ใหม่</span>
                  </button>
                )}
              </div>

              {/* Success Notification */}
              {addressSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{addressSuccessMsg}</span>
                </div>
              )}

              {/* Delivery Address Card (Matching Images 2 & 3) */}
              {deliveryType === "DELIVERY" && (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setModalView("list");
                      setIsAddressModalOpen(true);
                    }}
                    className="p-4 bg-white rounded-2xl border border-gray-200/90 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {customerName ? (
                              <>
                                <span>{customerName}</span>
                                {customerPhone && (
                                  <span className="text-gray-900 font-bold">, {customerPhone}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">ยังไม่ได้ระบุชื่อและเบอร์โทรผู้รับ</span>
                            )}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalView("list");
                              setIsAddressModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer hover:underline"
                          >
                            แก้ไข
                          </button>
                        </div>

                        <div className="mt-1.5 flex items-baseline flex-wrap gap-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100 shrink-0">
                            {savedAddresses.find((a) => a.id === selectedAddressId)?.label || "ที่บ้าน"}
                          </span>
                          <span className="text-gray-700 break-words">
                            {shippingAddress
                              ? `${shippingAddress} ต.${subdistrict || "ทุ่งกว๋าว"} อ.เมืองปาน จ.ลำปาง`
                              : "ยังไม่ได้ระบุที่อยู่จัดส่ง กรุณากดเพื่อเลือกหรือเพิ่มที่อยู่จัดส่ง"}
                          </span>
                        </div>

                        {/* Store and Radius info */}
                        {deliverySetting && deliverySetting.enabled && (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-1">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>จัดส่งจาก: ร้านเกษรบ้านป่าเวียง</span>
                            </div>
                            {distanceKm !== null && (
                              <span className={`font-semibold ${isLocationOutOfRange ? "text-red-600" : "text-emerald-700"}`}>
                                {isLocationOutOfRange
                                  ? `⚠️ อยู่นอกพื้นที่ (${distanceKm} กม. / สูงสุด ${deliverySetting.maxDistanceKm} กม.)`
                                  : `✅ อยู่ในรัศมีจัดส่ง (${distanceKm} กม.)`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Out of range alert if needed */}
                  {deliverySetting && deliverySetting.enabled && isLocationOutOfRange && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold block text-red-900">อยู่นอกพื้นที่จัดส่ง</span>
                        <p className="text-[11px] leading-relaxed">
                          ระยะทางจากร้านเกษรบ้านป่าเวียง ({distanceKm} กม.) เกินรัศมีจัดส่ง {deliverySetting.maxDistanceKm} กม. กรุณากดแก้ไขเพื่อปักหมุดใหม่ หรือเปลี่ยนเป็น <strong>"รับสินค้าที่หน้าร้าน"</strong> ครับ
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeliveryTypeChange("PICKUP")}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#b90000] hover:bg-red-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mt-1"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>เปลี่ยนเป็นรับสินค้าที่หน้าร้านเกษรบ้านป่าเวียง</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Customer Current Location & Interactive Map Section */}
                  <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-3.5 shadow-2xs">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                            <span>ตำแหน่งปัจจุบันของลูกค้า (พิกัดจัดส่งบนแผนที่)</span>
                            {latitude && longitude && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            แสดงตำแหน่งปัจจุบันของคุณและรัศมีขอบเขตให้บริการจัดส่งของร้านเกษรบ้านป่าเวียง
                          </p>
                        </div>
                      </div>

                      {/* Button to detect current GPS location */}
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span>กำลังดึงพิกัด...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            <span>📍 ดึงตำแหน่งปัจจุบัน (GPS)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Coordinates & Distance info pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-3 rounded-xl border border-gray-200/90 shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap text-gray-700">
                        <span className="font-semibold text-gray-600">พิกัดปัจจุบัน:</span>
                        {latitude && longitude ? (
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">ยังไม่ได้ระบุพิกัด GPS</span>
                        )}

                        {distanceKm !== null && (
                          <span className="text-gray-500">
                            • ห่างจากร้าน: <strong className="text-gray-900">{distanceKm} กม.</strong>
                          </span>
                        )}
                      </div>

                      {/* Distance status pill */}
                      {distanceKm !== null && deliverySetting && (
                        <div>
                          {isLocationOutOfRange ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              <span>เกินรัศมีจัดส่ง ({deliverySetting.maxDistanceKm} กม.)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>อยู่ในเขตพื้นที่จัดส่ง</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* GPS message bar */}
                    {gpsStatus && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                          gpsStatus.includes("✅") || gpsStatus.includes("📍")
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                            : gpsStatus.includes("⚠️")
                            ? "bg-amber-50/80 border-amber-200 text-amber-800"
                            : "bg-red-50/80 border-red-200 text-red-800"
                        }`}
                      >
                        <span className="text-sm">ℹ️</span>
                        <span>{gpsStatus}</span>
                      </div>
                    )}

                    {/* Interactive Map */}
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                      <LocationPickerMapWrapper
                        lat={latitude || deliverySetting?.storeLat || 18.564567}
                        lng={longitude || deliverySetting?.storeLng || 99.458904}
                        onChange={handleMapLocationChange}
                        storeLat={deliverySetting?.storeLat || 18.564567}
                        storeLng={deliverySetting?.storeLng || 99.458904}
                        storeName="ร้านเกษรบ้านป่าเวียง"
                        maxDistanceKm={deliverySetting?.maxDistanceKm || 10}
                        distanceKm={distanceKm}
                        isOutOfRange={isLocationOutOfRange}
                        title="ตำแหน่งปัจจุบันของคุณ"
                        subtitle="ลากหมุดสีน้ำเงินหรือแตะบนแผนที่เพื่อปรับตำแหน่งที่จัดส่งให้แม่นยำยิ่งขึ้น"
                        height="300px"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notice & Inputs for Store Pickup */}
              {deliveryType === "PICKUP" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/70 text-blue-900 text-xs leading-relaxed space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-blue-800 text-sm">
                      <Store className="w-4 h-4" />
                      <span>ข้อมูลสถานที่รับสินค้า: ร้านเกษรบ้านป่าเวียง</span>
                    </div>
                    <p className="text-blue-700">
                      📍 ที่อยู่: 33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240
                    </p>
                    <p className="text-blue-700">
                      🕒 เวลาทำการ: เปิดบริการทุกวัน 06:00 - 21:00 น.
                    </p>
                    <p className="text-blue-700">
                      📞 โทรศัพท์ร้าน: 085-626-1023 
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        ชื่อ-นามสกุล ผู้มารับสินค้า *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="กรอกชื่อ-นามสกุลลูกค้า"
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800"
                        />
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        เบอร์โทรศัพท์ติดต่อ *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="กรอกเบอร์โทรศัพท์ลูกค้า"
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800"
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      วันและเวลาที่สะดวกมารับสินค้า *
                    </label>
                    <div className="relative">
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800 appearance-none cursor-pointer"
                      >
                        <option value="ภายใน 1-2 ชั่วโมง (วันนี้)">ภายใน 1-2 ชั่วโมง (วันนี้ทันที)</option>
                        <option value="ช่วงบ่ายวันนี้ (13:00 - 16:00 น.)">ช่วงบ่ายวันนี้ (13:00 - 16:00 น.)</option>
                        <option value="ช่วงเย็นวันนี้ (17:00 - 20:00 น.)">ช่วงเย็นวันนี้ (17:00 - 20:00 น.)</option>
                        <option value="วันพรุ่งนี้ช่วงเช้า (08:00 - 12:00 น.)">วันพรุ่งนี้ช่วงเช้า (08:00 - 12:00 น.)</option>
                        <option value="วันพรุ่งนี้ช่วงบ่าย/เย็น (13:00 - 19:00 น.)">วันพรุ่งนี้ช่วงบ่าย/เย็น (13:00 - 19:00 น.)</option>
                        <option value="custom">ระบุวันและเวลาอื่นๆ...</option>
                      </select>
                      <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>

                    {pickupTime === "custom" && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          required
                          value={customPickupTime}
                          onChange={(e) => setCustomPickupTime(e.target.value)}
                          placeholder="กรอกวันที่และเวลาที่สะดวกมารับสินค้า"
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    deliveryType === "DELIVERY"
                      ? "กรอกหมายเหตุเพิ่มเติม หรือคำแนะนำการจัดส่งถึงพนักงาน"
                      : "กรอกหมายเหตุเพิ่มเติม หรือชื่อผู้มารับสินค้าแทน"
                  }
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#b90000] focus:ring-2 focus:ring-red-100 transition-all text-gray-800"
                />
              </div>
            </div>

            {/* STEP 3: Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#b90000] text-white text-xs flex items-center justify-center font-bold">3</span>
                <span>เลือกวิธีการชำระเงิน</span>
              </h2>

              <div className="space-y-3">
                {deliveryType === "DELIVERY" ? (
                  <>
                    {/* Cash on Delivery */}
                    <label
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "COD"
                          ? "border-[#b90000] bg-red-50/40 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="COD"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          className="accent-[#b90000] w-4 h-4 cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">ชำระเงินสดปลายทาง (COD)</span>
                          <span className="text-xs text-gray-500">ชำระเงินสดกับพนักงานส่งสินค้าเมื่อได้รับสินค้า</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">เงินสด</span>
                    </label>

                    {/* PromptPay QR */}
                    <div
                      className={`rounded-2xl border-2 transition-all overflow-hidden ${
                        paymentMethod === "PROMPTPAY"
                          ? "border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <label
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setPaymentMethod("PROMPTPAY")}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PROMPTPAY"
                            checked={paymentMethod === "PROMPTPAY"}
                            onChange={() => setPaymentMethod("PROMPTPAY")}
                            className="accent-blue-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">สแกน QR Code พร้อมเพย์</span>
                            <span className="text-xs text-gray-500">สแกนจ่ายผ่านแอปทุกธนาคาร (กสิกรไทย 179-1-03272-1)</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">PromptPay</span>
                      </label>

                      {/* QR Code Container nested directly with the QR option */}
                      {paymentMethod === "PROMPTPAY" && (
                        <div className="px-5 pb-5 pt-2 border-t border-blue-100 bg-gradient-to-b from-blue-50/40 to-white animate-in fade-in duration-200">
                          <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                            {/* QR Code Image */}
                            <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-blue-200 flex flex-col items-center shrink-0">
                              <img
                                src="/promptpay-qr.jpg"
                                alt="Thai QR Payment PromptPay"
                                className="w-48 sm:w-52 h-auto rounded-xl object-contain shadow-xs"
                              />
                              <span className="text-[11px] text-gray-600 font-semibold mt-2 flex items-center gap-1">
                                🔒 K+ สแกนได้ด้วยแอปทุกธนาคาร
                              </span>
                            </div>

                            {/* Details & Instruction */}
                            <div className="flex-1 space-y-3 w-full text-xs">
                              <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>ประเภทการชำระ:</span>
                                  <span className="font-bold text-blue-700">Thai QR Payment (พร้อมเพย์)</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>ชื่อผู้รับเงิน:</span>
                                  <span className="font-bold text-gray-900">นาย วัชรพงษ์พันธ์ กัญญา</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>ธนาคาร:</span>
                                  <span className="font-bold text-emerald-800">กสิกรไทย (KBANK)</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>หมายเลขอ้างอิง:</span>
                                  <span className="font-mono text-gray-700">004999204835549</span>
                                </div>
                              </div>

                              <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-gray-800 block">ยอดเงินที่ต้องสแกนจ่าย:</span>
                                  <span className="text-[11px] text-gray-500">รวมทั้งสิ้น (รวมค่าจัดส่งถ้ามี)</span>
                                </div>
                                <span className="text-2xl font-black text-[#b90000]">
                                  ฿{getFinalTotal().toLocaleString("th-TH")}
                                </span>
                              </div>

                              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block text-blue-950">วิธีชำระเงิน</span>
                                  <span>สแกน QR Code แล้วแนบสลิปโอนเงินด้านล่าง จากนั้นกด "ยืนยันการสั่งซื้อ" แอดมินจะตรวจสอบเพื่ออนุมัติคำสั่งซื้อ</span>
                                </div>
                              </div>

                              {renderSlipUpload()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bank Transfer */}
                    <div
                      className={`rounded-2xl border-2 transition-all overflow-hidden ${
                        paymentMethod === "TRANSFER"
                          ? "border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-100"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <label
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setPaymentMethod("TRANSFER")}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="TRANSFER"
                            checked={paymentMethod === "TRANSFER"}
                            onChange={() => setPaymentMethod("TRANSFER")}
                            className="accent-emerald-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">โอนผ่านธนาคาร กสิกรไทย (179-1-03272-1)</span>
                            <span className="text-xs text-gray-500">โอนเข้าบัญชี นาย วัชรพงษ์พันธ์ กัญญา (ธนาคารกสิกรไทย)</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">กสิกรไทย</span>
                      </label>

                      {/* Bank Details Container directly inside Transfer option */}
                      {paymentMethod === "TRANSFER" && (
                        <div className="px-5 pb-5 pt-2 border-t border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white animate-in fade-in duration-200">
                          <div className="space-y-3 pt-2 text-xs">
                            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2.5">
                              <div className="flex justify-between items-center text-gray-600">
                                <span>ธนาคารผู้รับเงิน:</span>
                                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
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
                                  <span className="font-mono font-bold text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                    179-1-03272-1
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCopyAccount}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                    title="คัดลอกเลขบัญชี 1791032721"
                                  >
                                    {copiedAccount ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-green-600 font-bold">คัดลอกแล้ว!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>คัดลอก</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-gray-800 block">ยอดเงินที่ต้องโอน:</span>
                                <span className="text-[11px] text-gray-500">รวมทั้งสิ้น (รวมค่าจัดส่งถ้ามี)</span>
                              </div>
                              <span className="text-2xl font-black text-[#b90000]">
                                ฿{getFinalTotal().toLocaleString("th-TH")}
                              </span>
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-emerald-950">วิธีชำระเงิน</span>
                                <span>โอนเงินเข้าบัญชี แล้วแนบสลิปโอนเงินด้านล่าง จากนั้นกด "ยืนยันการสั่งซื้อ" แอดมินจะตรวจสอบเพื่ออนุมัติคำสั่งซื้อ</span>
                              </div>
                            </div>

                            {renderSlipUpload()}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Store Pickup Cash */}
                    <label
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        paymentMethod === "CASH_STORE"
                          ? "border-[#b90000] bg-red-50/40 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH_STORE"
                          checked={paymentMethod === "CASH_STORE"}
                          onChange={() => setPaymentMethod("CASH_STORE")}
                          className="accent-[#b90000] w-4 h-4 cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">ชำระเงินสดที่เคาน์เตอร์ร้าน</span>
                          <span className="text-xs text-gray-500">ชำระเงินสดเมื่อมารับสินค้าที่ร้านเกษรบ้านป่าเวียง</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">เงินสดหน้าร้าน</span>
                    </label>

                    {/* PromptPay at Store */}
                    <div
                      className={`rounded-2xl border-2 transition-all overflow-hidden ${
                        paymentMethod === "PROMPTPAY"
                          ? "border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <label
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setPaymentMethod("PROMPTPAY")}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PROMPTPAY"
                            checked={paymentMethod === "PROMPTPAY"}
                            onChange={() => setPaymentMethod("PROMPTPAY")}
                            className="accent-blue-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">สแกน QR Code พร้อมเพย์</span>
                            <span className="text-xs text-gray-500">สแกน QR Code โอนเงินเข้า กสิกรไทย 179-1-03272-1</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">PromptPay</span>
                      </label>

                      {paymentMethod === "PROMPTPAY" && (
                        <div className="px-5 pb-5 pt-2 border-t border-blue-100 bg-gradient-to-b from-blue-50/40 to-white animate-in fade-in duration-200">
                          <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-blue-200 flex flex-col items-center shrink-0">
                              <img
                                src="/promptpay-qr.jpg"
                                alt="Thai QR Payment PromptPay"
                                className="w-48 sm:w-52 h-auto rounded-xl object-contain shadow-xs"
                              />
                              <span className="text-[11px] text-gray-600 font-semibold mt-2 flex items-center gap-1">
                                🔒 K+ สแกนได้ด้วยแอปทุกธนาคาร
                              </span>
                            </div>

                            <div className="flex-1 space-y-3 w-full text-xs">
                              <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>ประเภทการชำระ:</span>
                                  <span className="font-bold text-blue-700">Thai QR Payment (พร้อมเพย์)</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>ชื่อผู้รับเงิน:</span>
                                  <span className="font-bold text-gray-900">นาย วัชรพงษ์พันธ์ กัญญา</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                  <span>หมายเลขอ้างอิง:</span>
                                  <span className="font-mono text-gray-700">004999204835549</span>
                                </div>
                              </div>

                              <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-gray-800 block">ยอดเงินที่ต้องสแกนจ่าย:</span>
                                  <span className="text-[11px] text-gray-500">รวมทั้งสิ้น (รวมค่าจัดส่งถ้ามี)</span>
                                </div>
                                <span className="text-2xl font-black text-[#b90000]">
                                  ฿{getFinalTotal().toLocaleString("th-TH")}
                                </span>
                              </div>

                              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block text-blue-950">วิธีชำระเงิน</span>
                                  <span>สแกน QR Code แล้วแนบสลิปโอนเงินด้านล่าง จากนั้นกด "ยืนยันการสั่งซื้อ" แอดมินจะตรวจสอบเพื่ออนุมัติคำสั่งซื้อ</span>
                                </div>
                              </div>

                              {renderSlipUpload()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bank Transfer at Store */}
                    <div
                      className={`rounded-2xl border-2 transition-all overflow-hidden ${
                        paymentMethod === "TRANSFER"
                          ? "border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-100"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <label
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setPaymentMethod("TRANSFER")}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="TRANSFER"
                            checked={paymentMethod === "TRANSFER"}
                            onChange={() => setPaymentMethod("TRANSFER")}
                            className="accent-emerald-600 w-4 h-4 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">โอนผ่านธนาคาร กสิกรไทย (179-1-03272-1)</span>
                            <span className="text-xs text-gray-500">โอนเข้าบัญชีก่อนมารับสินค้าที่ร้านเกษรบ้านป่าเวียง</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">กสิกรไทย</span>
                      </label>

                      {paymentMethod === "TRANSFER" && (
                        <div className="px-5 pb-5 pt-2 border-t border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white animate-in fade-in duration-200">
                          <div className="space-y-3 pt-2 text-xs">
                            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2.5">
                              <div className="flex justify-between items-center text-gray-600">
                                <span>ธนาคารผู้รับเงิน:</span>
                                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
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
                                  <span className="font-mono font-bold text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                    179-1-03272-1
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCopyAccount}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                    title="คัดลอกเลขบัญชี 1791032721"
                                  >
                                    {copiedAccount ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-green-600 font-bold">คัดลอกแล้ว!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>คัดลอก</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-gray-800 block">ยอดเงินที่ต้องโอน:</span>
                                <span className="text-[11px] text-gray-500">รวมทั้งสิ้น (รวมค่าจัดส่งถ้ามี)</span>
                              </div>
                              <span className="text-2xl font-black text-[#b90000]">
                                ฿{getFinalTotal().toLocaleString("th-TH")}
                              </span>
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block text-emerald-950">วิธีชำระเงิน</span>
                                <span>โอนเงินเข้าบัญชี แล้วแนบสลิปโอนเงินด้านล่าง จากนั้นกด "ยืนยันการสั่งซื้อ" แอดมินจะตรวจสอบเพื่ออนุมัติคำสั่งซื้อ</span>
                              </div>
                            </div>

                            {renderSlipUpload()}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Confirm (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="font-bold text-gray-900 text-base">สรุปรายการสั่งซื้อ</h3>
                <span className="text-xs bg-red-50 text-[#b90000] font-bold px-2.5 py-1 rounded-lg">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น
                </span>
              </div>

              {/* Items Mini List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-50">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 pt-2 first:pt-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                      {item.image?.startsWith("http") || item.image?.startsWith("data:image") || item.image?.startsWith("/") ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
                          }}
                        />
                      ) : (
                        item.image || "📦"
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {item.quantity} x ฿{item.price.toLocaleString("th-TH")}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-gray-900 shrink-0">
                      ฿{(item.price * item.quantity).toLocaleString("th-TH")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>มูลค่าสินค้า</span>
                  <span>฿{getSubtotal().toLocaleString("th-TH")}</span>
                </div>

                {getDiscount() > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>🏷️ ส่วนลดโปรโมชัน</span>
                    <span className="font-bold text-emerald-600">- ฿{getDiscount().toLocaleString("th-TH")}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>รูปแบบการรับสินค้า</span>
                  <span className="font-bold text-gray-800">
                    {deliveryType === "DELIVERY" ? "🛵 จัดส่งถึงที่" : "🏪 รับที่หน้าร้าน"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>ค่าบริการจัดส่ง</span>
                  {deliveryType === "PICKUP" ? (
                    <span className="font-bold text-emerald-600">ฟรี (รับหน้าร้าน)</span>
                  ) : getDeliveryFee() === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-600">ฟรี (฿0)</span>
                      {deliverySetting?.enabled && deliverySetting?.minOrderAmount > 0 && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">
                          ครบขั้นต่ำ ฿{deliverySetting.minOrderAmount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-700">฿{getDeliveryFee().toLocaleString("th-TH")}</span>
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">
                        ไม่ถึงขั้นต่ำ ฿{deliverySetting?.minOrderAmount || 50}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-minimum Delivery Notice / Suggestion */}
                {deliveryType === "DELIVERY" && deliverySetting?.enabled && getDeliveryFee() > 0 && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">💡</span>
                    <div>
                      <span>
                        ซื้อสินค้าเพิ่มอีก{" "}
                        <strong className="text-amber-950 font-bold">
                          ฿{Math.max(0, (deliverySetting.minOrderAmount || 50) - getSubtotal()).toLocaleString("th-TH")}
                        </strong>{" "}
                        เพื่อรับสิทธิ์ส่งฟรี! (ปัจจุบันคิดค่าจัดส่ง ฿{getDeliveryFee()})
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-gray-900">ยอดรวมสุทธิ</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#b90000]">
                      ฿{getFinalTotal().toLocaleString("th-TH")}
                    </span>
                    <span className="text-[10px] text-gray-400 block">รวมภาษีและค่าจัดส่งแล้ว</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#b90000] hover:bg-red-800 disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึกคำสั่งซื้อ...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>ยืนยันการสั่งซื้อ</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="pt-2 text-center border-t border-gray-100 space-y-1.5 text-[11px] text-gray-400">
                <div className="flex items-center justify-center gap-1.5 text-gray-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>สินค้าแท้ มาตรฐานร้านเกษรบ้านป่าเวียง</span>
                </div>
                <p>ตรวจสอบสินค้าเมื่อได้รับ และรับใบเสร็จทุกครั้ง</p>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* ========================================================================= */}
      {/* Address Selection & Management Modal (Matches Images 2, 3, 4)             */}
      {/* ========================================================================= */}
      {isAddressModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddressModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* VIEW 1: ADDRESS LIST (IMAGE 4) */}
            {modalView === "list" && (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="p-1 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base font-bold text-gray-900">
                      กรุณาเลือกที่อยู่ในการจัดส่ง
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Top Action: + เพิ่มที่อยู่ใหม่ (Matching Image 4) */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={handleOpenCreateAddress}
                    className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/60 text-blue-600 font-bold text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>เพิ่มที่อยู่ใหม่</span>
                  </button>
                </div>

                {/* Address List */}
                <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-gray-100">
                  {savedAddresses.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p>ยังไม่มีที่อยู่ที่บันทึกไว้</p>
                      <button
                        type="button"
                        onClick={handleOpenCreateAddress}
                        className="mt-3 text-xs text-blue-600 font-bold underline cursor-pointer"
                      >
                        กดที่นี่เพื่อเพิ่มที่อยู่แรกของคุณ
                      </button>
                    </div>
                  ) : (
                    savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            applyAddress(addr);
                            setIsAddressModalOpen(false);
                          }}
                          className={`pt-3 first:pt-0 p-3 rounded-xl transition-all cursor-pointer relative group ${
                            isSelected
                              ? "bg-blue-50/50 ring-1 ring-blue-300 border border-blue-200 shadow-2xs"
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-gray-900 text-sm truncate">
                                  <span>{addr.name || "ไม่ระบุชื่อ"}</span>
                                  {addr.phone && (
                                    <span className="text-gray-900 font-bold">, {addr.phone}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditAddress(addr);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold hover:underline cursor-pointer px-1 py-0.5"
                                  >
                                    แก้ไข
                                  </button>
                                  {savedAddresses.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteAddress(e, addr.id)}
                                      className="text-gray-300 hover:text-red-500 p-0.5 rounded transition cursor-pointer"
                                      title="ลบที่อยู่นี้"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                                {addr.address && addr.address !== "ยังไม่ได้ระบุที่อยู่โปรไฟล์"
                                  ? `${addr.address} ต.${addr.subdistrict || "ทุ่งกว๋าว"} อ.เมืองปาน จ.ลำปาง`
                                  : "ยังไม่ได้ระบุรายละเอียดที่อยู่"}
                              </p>

                              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                {/* Label badge: e.g. ที่บ้าน */}
                                <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-100">
                                  {addr.label || "ที่บ้าน"}
                                </span>

                                {/* Default badge: e.g. ที่อยู่เริ่มต้น */}
                                {addr.isDefault && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-500 font-medium text-[10px] border border-red-200">
                                    ที่อยู่เริ่มต้น
                                  </span>
                                )}

                                {isSelected && (
                                  <span className="ml-auto text-[11px] font-bold text-blue-600 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> ใช้งานอยู่
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* VIEW 2: ADD NEW / EDIT ADDRESS FORM */}
            {modalView === "form" && (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalView("list")}
                      className="p-1 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base font-bold text-gray-900">
                      {editingAddressId ? "แก้ไขที่อยู่จัดส่ง" : "เพิ่มที่อยู่ใหม่"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Scrollable Area */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                  {modalFormError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{modalFormError}</span>
                    </div>
                  )}

                  {/* Label Pills */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      ป้ายกำกับที่อยู่
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { label: "ที่บ้าน", icon: Home },
                        { label: "ที่ทำงาน", icon: Building2 },
                        { label: "คอนโด", icon: Building2 },
                        { label: "อื่นๆ", icon: MapPin },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isCurrent = modalLabel === item.label;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setModalLabel(item.label)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        ชื่อ-นามสกุล ผู้รับ *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={modalName}
                          onChange={(e) => setModalName(e.target.value)}
                          placeholder="กรอกชื่อ-นามสกุล"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800"
                        />
                        <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        เบอร์โทรศัพท์ติดต่อ *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={modalPhone}
                          onChange={(e) => setModalPhone(e.target.value)}
                          placeholder="กรอกเบอร์โทรศัพท์"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800"
                        />
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                    </div>
                  </div>

                  {/* Subdistrict */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      ตำบล / พื้นที่จัดส่ง (อ.เมืองปาน) *
                    </label>
                    <div className="relative">
                      <select
                        value={modalSubdistrict}
                        onChange={(e) => setModalSubdistrict(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800 cursor-pointer appearance-none"
                      >
                        {(deliverySetting?.allowedSubdistricts
                          ? deliverySetting.allowedSubdistricts.split(",").map((s: string) => s.trim().replace(/^ต\./, "")).filter(Boolean)
                          : ["ทุ่งกว๋าว", "เมืองปาน", "บ้านขอ", "หัวเมือง", "แจ้ซ้อน", "บ้านค่า", "บ้านสา", "บ้านเป้า", "บ้านเอื้อม"]
                        ).map((sub: string) => (
                          <option key={sub} value={sub}>
                            {sub === "ทุ่งกว๋าว" ? `ต.${sub} (โซนร้านเกษรบ้านป่าเวียง)` : `ต.${sub}`}
                          </option>
                        ))}
                        <option value="OTHER">⚠️ ตำบลอื่นๆ / นอกเขตพื้นที่ให้บริการจัดส่ง</option>
                      </select>
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <span className="absolute right-3 top-3 pointer-events-none text-xs text-gray-400">▼</span>
                    </div>
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      ที่อยู่โดยละเอียด (บ้านเลขที่, หมู่, ซอย, ถนน) *
                    </label>
                    <div className="relative">
                      <textarea
                        required
                        rows={2}
                        value={modalAddress}
                        onChange={(e) => setModalAddress(e.target.value)}
                        placeholder="เช่น 33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง 52240"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800"
                      />
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 select-none">
                      <input
                        type="checkbox"
                        checked={modalIsDefault}
                        onChange={(e) => setModalIsDefault(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-400 cursor-pointer"
                      />
                      <span className="font-medium">ตั้งเป็นที่อยู่เริ่มต้น (ที่อยู่หลัก)</span>
                    </label>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalView("list")}
                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveModalAddress}
                    disabled={isSavingAddress}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingAddress ? "กำลังบันทึก..." : "บันทึกที่อยู่"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
