"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Store,
  Navigation,
  Search,
  X,
  Phone,
  ExternalLink,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronRight,
  Filter,
  Eye,
  Info,
  Building2
} from "lucide-react";

export interface CustomerOrderPin {
  id: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number | null;
  totalAmount: number;
  deliveryStatus: string; // PENDING, ASSIGNED, DELIVERING, DELIVERED, CANCELLED
  orderStatus?: string;
  createdAt: string;
  riderName?: string | null;
  riderPhone?: string | null;
}

export interface CustomerRadiusMapProps {
  orders: CustomerOrderPin[];
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  maxDistanceKm?: number;
  onUpdateOrderCoords?: (orderId: string, lat: number, lng: number) => Promise<any>;
}

// Calculate Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export default function CustomerRadiusMap({
  orders = [],
  storeLat = 18.564567,
  storeLng = 99.458904,
  storeName = "ร้านเกษรบ้านป่าเวียง",
  storeAddress = "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง 52240",
  storePhone = "089-851-0807",
  maxDistanceKm = 5,
  onUpdateOrderCoords,
}: CustomerRadiusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const tileLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<"satellite" | "streets">("streets");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "in_boundary" | "out_boundary" | "PENDING" | "DELIVERING" | "DELIVERED">("all");
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderPin | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute orders with valid coordinates and distance
  const validOrders = useMemo(() => {
    return orders
      .filter((o) => typeof o.latitude === "number" && typeof o.longitude === "number" && !isNaN(o.latitude) && !isNaN(o.longitude))
      .map((o, idx) => {
        const dist = o.distanceKm ?? calculateDistance(storeLat, storeLng, o.latitude!, o.longitude!);
        const isWithin = dist <= maxDistanceKm;
        return {
          ...o,
          pinNumber: idx + 1,
          computedDist: dist,
          isWithin,
        };
      });
  }, [orders, storeLat, storeLng, maxDistanceKm]);

  // Statistics
  const totalPins = validOrders.length;
  const inBoundaryCount = validOrders.filter((o) => o.isWithin).length;
  const outBoundaryCount = validOrders.filter((o) => !o.isWithin).length;
  const deliveredCount = validOrders.filter((o) => o.deliveryStatus === "DELIVERED").length;
  const deliveringCount = validOrders.filter((o) => o.deliveryStatus === "DELIVERING" || o.deliveryStatus === "ASSIGNED").length;
  const pendingCount = validOrders.filter((o) => o.deliveryStatus === "PENDING" || !o.deliveryStatus).length;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return validOrders.filter((o) => {
      // Filter tab
      if (selectedFilter === "in_boundary" && !o.isWithin) return false;
      if (selectedFilter === "out_boundary" && o.isWithin) return false;
      if (selectedFilter === "PENDING" && o.deliveryStatus !== "PENDING" && o.deliveryStatus) return false;
      if (selectedFilter === "DELIVERING" && o.deliveryStatus !== "DELIVERING" && o.deliveryStatus !== "ASSIGNED") return false;
      if (selectedFilter === "DELIVERED" && o.deliveryStatus !== "DELIVERED") return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = o.customerName?.toLowerCase().includes(q);
        const matchPhone = o.customerPhone?.toLowerCase().includes(q);
        const matchAddr = o.shippingAddress?.toLowerCase().includes(q);
        const matchPin = o.pinNumber.toString().includes(q);
        const matchId = o.id.toLowerCase().includes(q);
        return matchName || matchPhone || matchAddr || matchPin || matchId;
      }
      return true;
    });
  }, [validOrders, selectedFilter, searchTerm]);

  // Determine pin color based on order status and boundary
  const getPinColor = (order: (typeof validOrders)[0]) => {
    if (!order.isWithin) {
      return {
        bg: "#dc2626", // Red for out of boundary
        border: "#991b1b",
        label: "นอกเขตจัดส่ง",
        badgeBg: "bg-red-50 text-red-700 border-red-200",
      };
    }
    if (order.deliveryStatus === "DELIVERED") {
      return {
        bg: "#16a34a", // Green for delivered
        border: "#14532d",
        label: "จัดส่งสำเร็จ",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (order.deliveryStatus === "DELIVERING" || order.deliveryStatus === "ASSIGNED") {
      return {
        bg: "#2563eb", // Blue for delivering
        border: "#1e3a8a",
        label: "กำลังจัดส่ง",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    // Default PENDING
    return {
      bg: "#f59e0b", // Yellow / Orange for pending
      border: "#b45309",
      label: "รอมอบหมาย",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    };
  };

  const labelsLayerRef = useRef<any>(null);

  // Switch Tile Layer
  const setTileLayer = (type: "satellite" | "streets", map: any, L: any) => {
    if (tileLayerRef.current) {
      try { map.removeLayer(tileLayerRef.current); } catch {}
    }
    if (labelsLayerRef.current) {
      try { map.removeLayer(labelsLayerRef.current); } catch {}
    }

    if (type === "satellite") {
      // 🛰️ Esri World Imagery (Satellite)
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      ).addTo(map);

      // Roads & place names overlay
      labelsLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      // 🗺️ Modern Navigation Streets (CartoDB Voyager)
      tileLayerRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapContainerRef.current) return;

        LRef.current = L;

        // Clean up stale instance
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
          mapInstanceRef.current = null;
        }

        if ((mapContainerRef.current as any)?._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [storeLat, storeLng],
          zoom: 14,
          zoomControl: false,
        });

        // Set initial tile layer
        setTileLayer(mapType, map, L);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoaded(true);

        map.whenReady(() => {
          map.invalidateSize();
        });

        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 200);
      } catch (err) {
        console.error("Map init error:", err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [storeLat, storeLng]);

  // Handle Map Type Change
  useEffect(() => {
    if (mapInstanceRef.current && LRef.current) {
      setTileLayer(mapType, mapInstanceRef.current, LRef.current);
    }
  }, [mapType]);

  // Render Markers and Boundary Circle on map
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;
    const L = LRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: any) => {
      try {
        map.removeLayer(m);
      } catch {}
    });
    markersRef.current = {};

    // 1. Add Store Delivery Boundary Circle
    const boundaryRadiusMeters = maxDistanceKm * 1000;
    const boundaryCircle = L.circle([storeLat, storeLng], {
      radius: boundaryRadiusMeters,
      color: "#22c55e",
      weight: 2.5,
      opacity: 0.9,
      dashArray: "6, 8",
      fillColor: "#22c55e",
      fillOpacity: 0.12,
    }).addTo(map);

    boundaryCircle.bindTooltip(
      `<div class="text-xs font-bold text-emerald-800 bg-white/95 px-2.5 py-1 rounded-full shadow border border-emerald-300">
        🎯 ขอบเขตระยะของร้าน: ${maxDistanceKm} กม.
      </div>`,
      { permanent: false, direction: "top", offset: [0, -10] }
    );
    markersRef.current["__boundary"] = boundaryCircle;

    // 2. Add Store Marker (Distinctive Store Badge)
    const storeIconHtml = `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor:pointer;">
        <div style="background: linear-gradient(135deg, #b90000 0%, #7f1d1d 100%); color: white; padding: 6px 12px; border-radius: 9999px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 6px; border: 2.5px solid #ffffff; white-space: nowrap;">
          <span style="font-size: 14px;">🏪</span>
          <span>${storeName}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 8px solid #b90000; margin-top: -1px;"></div>
        <div style="width: 8px; height: 8px; background: #b90000; border-radius: 50%; border: 2px solid #ffffff; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    const storeIcon = L.divIcon({
      html: storeIconHtml,
      className: "custom-store-pin",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const storeMarker = L.marker([storeLat, storeLng], { icon: storeIcon, zIndexOffset: 1000 }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: inherit; padding: 4px; min-width: 200px;">
        <div style="font-weight: 800; font-size: 14px; color: #b90000; margin-bottom: 4px;">🏪 ${storeName}</div>
        <div style="font-size: 12px; color: #4b5563; margin-bottom: 6px;">${storeAddress}</div>
        <div style="font-size: 12px; color: #1f2937; margin-bottom: 4px;">📞 <b>โทร:</b> ${storePhone}</div>
        <div style="font-size: 11px; background: #ecfdf5; color: #065f46; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #a7f3d0; margin-top: 6px;">
          🎯 ขอบเขตจัดส่งฟรี: รัศมี ${maxDistanceKm} กม.
        </div>
      </div>
    `);
    markersRef.current["__store"] = storeMarker;

    // 3. Add Customer Pins (Matching the exact look from the reference image)
    validOrders.forEach((order) => {
      if (!order.latitude || !order.longitude) return;
      const color = getPinColor(order);

      // Teardrop pin with number inside, matching the reference image!
      const pinHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor:pointer;" title="หมุดที่ ${order.pinNumber}: ${order.customerName}">
          <div style="
            width: 36px;
            height: 36px;
            background: ${color.bg};
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
          ">
            <span style="
              transform: rotate(45deg);
              color: #ffffff;
              font-weight: 900;
              font-size: 13px;
              font-family: monospace, sans-serif;
              text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            ">${order.pinNumber}</span>
          </div>
          <div style="
            width: 6px;
            height: 6px;
            background: rgba(0,0,0,0.4);
            border-radius: 50%;
            margin-top: 2px;
            filter: blur(1px);
          "></div>
        </div>
      `;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: "custom-customer-pin",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([order.latitude, order.longitude], { icon: pinIcon }).addTo(map);

      // Popup content
      const popupHtml = `
        <div style="font-family: inherit; padding: 2px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: ${color.bg}; color: white; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;">${order.pinNumber}</span>
              <span style="font-weight: 800; font-size: 14px; color: #111827;">${order.customerName}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; background: ${order.isWithin ? '#ecfdf5' : '#fef2f2'}; color: ${order.isWithin ? '#065f46' : '#991b1b'}; padding: 2px 6px; border-radius: 9999px; border: 1px solid ${order.isWithin ? '#a7f3d0' : '#fecaca'};">
              ${order.isWithin ? 'ในขอบเขต' : 'เกินขอบเขต'}
            </span>
          </div>
          <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px; line-height: 1.4;">
            📍 ${order.shippingAddress}
          </div>
          <div style="font-size: 12px; color: #1f2937; margin-bottom: 6px;">
            📞 <b>โทร:</b> ${order.customerPhone ? `<a href="tel:${order.customerPhone}" style="color: #2563eb; text-decoration: underline;">${order.customerPhone}</a>` : '-'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 11px;">
            <span style="color: #6b7280;">ระยะห่างจากร้าน:</span>
            <span style="font-weight: 800; color: ${order.isWithin ? '#16a34a' : '#dc2626'}; font-size: 12px;">${order.computedDist} กม.</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 8px;">
            <span style="color: #6b7280;">ยอดสั่งซื้อ:</span>
            <span style="font-weight: 800; color: #111827; font-size: 13px;">฿${order.totalAmount.toLocaleString("th-TH")}</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="https://www.google.com/maps/dir/?api=1&origin=${storeLat},${storeLng}&destination=${order.latitude},${order.longitude}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #2563eb; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>🧭 นำทาง</span>
            </a>
            ${order.customerPhone ? `
              <a href="tel:${order.customerPhone}" style="background: #16a34a; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-decoration: none; display: flex; align-items: center; justify-content: center;">
                📞 โทร
              </a>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        setSelectedOrder(order);
      });

      markersRef.current[order.id] = marker;
    });
  }, [validOrders, storeLat, storeLng, storeName, storeAddress, storePhone, maxDistanceKm, isLoaded]);

  // Focus and open marker for a specific order
  const focusOrder = (order: (typeof validOrders)[0]) => {
    setSelectedOrder(order);
    if (!mapInstanceRef.current || !order.latitude || !order.longitude) return;

    mapInstanceRef.current.flyTo([order.latitude, order.longitude], 16, {
      duration: 1.2,
    });

    const marker = markersRef.current[order.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 700);
    }
  };

  // Center Store
  const centerStore = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([storeLat, storeLng], 14, { duration: 1 });
    const storeMarker = markersRef.current["__store"];
    if (storeMarker) {
      setTimeout(() => storeMarker.openPopup(), 600);
    }
  };

  // Fit All Bounds
  const fitAll = () => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const points: [number, number][] = [[storeLat, storeLng]];
    validOrders.forEach((o) => {
      if (o.latitude && o.longitude) {
        points.push([o.latitude, o.longitude]);
      }
    });

    const bounds = LRef.current.latLngBounds(points);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? "fixed inset-0 z-50 bg-white p-4 overflow-y-auto" : ""}`}>
      {/* 1. Header (Green/Theme header matching reference screenshot) */}
      <div className="bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d] rounded-2xl p-5 text-white shadow-lg border border-emerald-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white text-[#166534] rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            📍
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">แผนที่ตำแหน่งลูกค้า & ขอบเขตระยะของร้าน</h2>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              ค้นหาตำแหน่งลูกค้า ปักหมุด และตรวจสอบรัศมีการจัดส่งของร้านเกษรบ้านป่าเวียง
            </p>
          </div>
        </div>

        {/* Quick controls on header */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setMapType(mapType === "satellite" ? "streets" : "satellite")}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-xs"
            title="สลับมุมมองดาวเทียม / แผนที่ถนน"
          >
            <Layers className="w-4 h-4 text-emerald-200" />
            <span>{mapType === "satellite" ? "🛰️ ภาพดาวเทียม" : "🗺️ แผนที่ถนน"}</span>
          </button>
          <button
            onClick={fitAll}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-xs"
            title="ดูหมุดทั้งหมด"
          >
            <Compass className="w-4 h-4 text-emerald-200" />
            <span>ดูหมุดทั้งหมด</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all border border-white/20 shadow-xs"
            title="ขยายเต็มจอ"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards (Matching reference screenshot: 84 ถัง / 82 จุด / 2 ถัง) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Total Pins */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs text-center flex flex-col justify-center items-center">
          <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-baseline justify-center gap-1">
            <span>{totalPins}</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-500">จุด</span>
          </div>
          <p className="text-xs font-bold text-gray-600 mt-1">หมุดลูกค้าทั้งหมด</p>
        </div>

        {/* Within Boundary */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs text-center flex flex-col justify-center items-center">
          <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight flex items-baseline justify-center gap-1">
            <span>{inBoundaryCount}</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-700">จุด</span>
          </div>
          <p className="text-xs font-bold text-emerald-800 mt-1">ในขอบเขต (≤ {maxDistanceKm} กม.)</p>
        </div>

        {/* Out of Boundary */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-red-200/80 shadow-xs text-center flex flex-col justify-center items-center">
          <div className="text-3xl sm:text-4xl font-black text-red-600 tracking-tight flex items-baseline justify-center gap-1">
            <span>{outBoundaryCount}</span>
            <span className="text-xs sm:text-sm font-semibold text-red-700">จุด</span>
          </div>
          <p className="text-xs font-bold text-red-700 mt-1">นอกขอบเขต (&gt; {maxDistanceKm} กม.)</p>
        </div>
      </div>

      {/* Status sub-line (Exact text style from reference: ปกติ 45 | ผิดปกติ 0 | รอทำความสะอาด 39) */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-center text-xs font-bold text-gray-700 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="text-emerald-700">🟢 สำเร็จ {deliveredCount} จุด</span>
        <span className="text-gray-300">|</span>
        <span className="text-blue-700">🔵 กำลังส่ง {deliveringCount} จุด</span>
        <span className="text-gray-300">|</span>
        <span className="text-amber-700">🟡 รอมอบหมาย {pendingCount} จุด</span>
        <span className="text-gray-300">|</span>
        <span className="text-red-700">🔴 นอกเขต {outBoundaryCount} จุด</span>
      </div>

      {/* 3. Map Card & Container */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-md overflow-hidden relative">
        {/* Map Header bar inside card */}
        <div className="px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-gray-900">แผนที่ตำแหน่งลูกค้า</span>
            <span className="text-xs text-gray-500 font-medium">
              (พิกัดร้าน: {storeLat.toFixed(4)}, {storeLng.toFixed(4)})
            </span>
          </div>
          <div className="text-xs font-bold text-gray-700">
            แสดงหมุด <span className="text-emerald-700 font-extrabold text-sm">{filteredOrders.length}</span> จุด
          </div>
        </div>

        {/* Map View Wrapper */}
        <div className="relative w-full" style={{ height: isFullscreen ? "calc(100vh - 280px)" : "560px" }}>
          {/* Floating Search Bar on Top of Map (Matching screenshot: 🔍 019 - 019 ✕) */}
          <div className="absolute top-4 left-4 right-4 sm:left-6 sm:w-80 z-[1000]">
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/90 flex items-center px-3.5 py-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="🔍 ค้นหาชื่อ, เบอร์, เลขหมุด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Suggestions */}
            {searchTerm.trim().length > 0 && (
              <div className="mt-1.5 max-h-56 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-200 divide-y divide-gray-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.slice(0, 6).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        focusOrder(o);
                        setSearchTerm("");
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {o.pinNumber}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-gray-900 truncate">{o.customerName}</p>
                          <p className="text-[10px] text-gray-500 truncate">{o.shippingAddress}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${o.isWithin ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {o.computedDist} กม.
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-gray-400">ไม่พบหมุดลูกค้าที่ค้นหา</div>
                )}
              </div>
            )}
          </div>

          {/* Floating Controls (Top Right on Map) */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={centerStore}
              className="p-2.5 bg-white/95 hover:bg-white text-gray-800 rounded-xl shadow-md border border-gray-200 transition-all active:scale-95 flex items-center justify-center"
              title="ไปยังพิกัดร้านค้า"
            >
              <Store className="w-4 h-4 text-[#b90000]" />
            </button>
            <button
              onClick={() => setMapType(mapType === "satellite" ? "streets" : "satellite")}
              className="p-2.5 bg-white/95 hover:bg-white text-gray-800 rounded-xl shadow-md border border-gray-200 transition-all active:scale-95 flex items-center justify-center"
              title="สลับแผนที่ถนน / ดาวเทียม"
            >
              <Layers className="w-4 h-4 text-emerald-700" />
            </button>
            <button
              onClick={fitAll}
              className="p-2.5 bg-white/95 hover:bg-white text-gray-800 rounded-xl shadow-md border border-gray-200 transition-all active:scale-95 flex items-center justify-center"
              title="ซูมพอดีหมุดทั้งหมด"
            >
              <Compass className="w-4 h-4 text-blue-700" />
            </button>
          </div>

          {/* Actual Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Legend Card (Bottom Left - EXACTLY like the user's reference screenshot!) */}
          <div className="absolute bottom-16 sm:bottom-14 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-xl border border-gray-200/90 text-xs w-44 sm:w-48 pointer-events-auto">
            <div className="font-extrabold text-gray-900 border-b border-gray-100 pb-1.5 mb-2 flex items-center justify-between">
              <span>สีหมุดตำแหน่งลูกค้า</span>
              <span className="text-[10px] text-gray-400 font-normal">สถานะ</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a] border border-[#14532d] shadow-2xs shrink-0"></span>
                <span>จัดส่งสำเร็จ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border border-[#1e3a8a] shadow-2xs shrink-0"></span>
                <span>กำลังจัดส่ง</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] border border-[#b45309] shadow-2xs shrink-0"></span>
                <span>รอมอบหมายจัดส่ง</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#dc2626] border border-[#991b1b] shadow-2xs shrink-0"></span>
                <span>นอกขอบเขต (&gt; {maxDistanceKm} กม.)</span>
              </div>
            </div>
          </div>

          {/* Floating Bottom Info Tip (Exact position as reference screenshot) */}
          <div className="absolute bottom-3 left-4 right-4 sm:left-auto sm:right-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl py-1.5 px-3.5 shadow-md border border-gray-200/80 text-[11px] font-semibold text-gray-600 flex items-center gap-2 pointer-events-auto">
            <span className="text-emerald-700 shrink-0">🎯</span>
            <span className="truncate">
              ขอบเขตระยะของร้าน รัศมี <b>{maxDistanceKm} กม.</b> (คลิกที่หมุดลูกค้าเพื่อดูข้อมูลหรือนำทาง)
            </span>
          </div>
        </div>

        {/* 4. Bottom Order List & Filter Bar */}
        <div className="p-4 sm:p-5 border-t border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-700">กรองรายการลูกค้า:</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: `ทั้งหมด (${totalPins})` },
                { id: "in_boundary", label: `ในเขต (${inBoundaryCount})` },
                { id: "out_boundary", label: `นอกเขต (${outBoundaryCount})` },
                { id: "PENDING", label: `รอมอบหมาย (${pendingCount})` },
                { id: "DELIVERING", label: `กำลังส่ง (${deliveringCount})` },
                { id: "DELIVERED", label: `สำเร็จ (${deliveredCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                    selectedFilter === tab.id
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((o) => {
                const color = getPinColor(o);
                const isSelected = selectedOrder?.id === o.id;

                return (
                  <div
                    key={o.id}
                    onClick={() => focusOrder(o)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 hover:shadow-md ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: color.bg }}
                          className="w-6 h-6 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs"
                        >
                          {o.pinNumber}
                        </span>
                        <div>
                          <p className="font-extrabold text-sm text-gray-900 leading-tight">{o.customerName}</p>
                          <p className="text-[11px] text-gray-500">{o.customerPhone || "ไม่มีเบอร์"}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${color.badgeBg}`}>
                        {color.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-1">📍 {o.shippingAddress}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">ระยะห่าง:</span>
                        <span className={`font-black ${o.isWithin ? "text-emerald-700" : "text-red-600"}`}>
                          {o.computedDist} กม.
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          ฿{o.totalAmount.toLocaleString("th-TH")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusOrder(o);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูหมุด</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-gray-400">
                ไม่มีรายการลูกค้าที่ตรงกับเงื่อนไขการค้นหา
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
