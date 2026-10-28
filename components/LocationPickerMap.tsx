"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Clock, Loader2, AlertCircle, CheckCircle2, Store } from "lucide-react";

export interface LocationPickerMapProps {
  lat?: number | null;
  lng?: number | null;
  onChange?: (lat: number, lng: number) => void;
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  maxDistanceKm?: number;
  distanceKm?: number | null;
  isOutOfRange?: boolean;
  onSwitchToPickup?: () => void;
  title?: string;
  subtitle?: string;
  height?: string;
  className?: string;
}

export default function LocationPickerMap({
  lat = 18.371368,
  lng = 99.593594,
  onChange,
  storeLat = 18.564567,
  storeLng = 99.458904,
  storeName = "ร้านเกษรบ้านป่าเวียง",
  maxDistanceKm = 5,
  distanceKm = null,
  isOutOfRange = false,
  onSwitchToPickup,
  title = "ตำแหน่งจัดส่ง",
  subtitle = "คลิกบนแผนที่หรือลากหมุดเพื่อปรับพิกัด",
  height = "380px",
  className = "",
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const storeMarkerRef = useRef<any>(null);
  const boundaryCircleRef = useRef<any>(null);

  // Fallback defaults to Lampang if coordinates are null
  const defaultLat = 18.371368;
  const defaultLng = 99.593594;

  const [currentLat, setCurrentLat] = useState<number>(lat ?? defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(lng ?? defaultLng);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Storing onChange in a ref to prevent recreating map on parent re-renders
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync external props with internal state and marker without reinitializing map
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
      const formattedLat = parseFloat(lat.toFixed(6));
      const formattedLng = parseFloat(lng.toFixed(6));
      setCurrentLat(formattedLat);
      setCurrentLng(formattedLng);

      if (customerMarkerRef.current) {
        const cur = customerMarkerRef.current.getLatLng();
        if (Math.abs(cur.lat - formattedLat) > 0.000001 || Math.abs(cur.lng - formattedLng) > 0.000001) {
          customerMarkerRef.current.setLatLng([formattedLat, formattedLng]);
        }
      }
    }
  }, [lat, lng]);

  // Request GPS Location (ใช้ตำแหน่งปัจจุบัน)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการดึงตำแหน่ง GPS");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLoadingLocation(false);
        const { latitude, longitude } = pos.coords;
        const formattedLat = parseFloat(latitude.toFixed(6));
        const formattedLng = parseFloat(longitude.toFixed(6));

        setCurrentLat(formattedLat);
        setCurrentLng(formattedLng);

        if (customerMarkerRef.current) {
          customerMarkerRef.current.setLatLng([formattedLat, formattedLng]);
        }

        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.setView([formattedLat, formattedLng], 14, { animate: false });
          } catch {}
        }

        if (onChangeRef.current) {
          onChangeRef.current(formattedLat, formattedLng);
        }
      },
      (err) => {
        setIsLoadingLocation(false);
        console.warn("Geolocation error:", err);
        alert("ไม่สามารถเข้าถึงตำแหน่ง GPS ของคุณได้ กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initialize Leaflet Map (Runs ONCE on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapContainerRef.current) return;

        LRef.current = L;

        // Clean up stale instance safely
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
          mapInstanceRef.current = null;
        }

        if ((mapContainerRef.current as any)?._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const initialLat = lat ?? defaultLat;
        const initialLng = lng ?? defaultLng;

        // Calculate initial center between customer and store
        const centerLat = (initialLat + storeLat) / 2;
        const centerLng = (initialLng + storeLng) / 2;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 11,
          zoomControl: false,
        });

        // 1. OpenStreetMap Tile Layer (Exact match with screenshot)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Zoom control at bottom right (matching screenshot)
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // 2. ขอบเขตการจัดส่งของร้าน (Dashed blue circle + badge matching Image 1)
        const radiusMeters = (maxDistanceKm || 5) * 1000;
        const boundaryCircle = L.circle([storeLat, storeLng], {
          radius: radiusMeters,
          color: "#2563eb",
          weight: 2.5,
          dashArray: "8, 8",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
        }).addTo(map);

        // Floating Badge / Tooltip "รัศมีจัดส่ง X กม." directly next to the store pin (Image 1 replica)
        boundaryCircle.bindTooltip(
          `<div style="
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            background: #ffffff;
            padding: 5px 11px;
            border-radius: 9px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.18);
            border: 1px solid #e2e8f0;
            white-space: nowrap;
            letter-spacing: -0.2px;
          ">
            รัศมีจัดส่ง ${maxDistanceKm} กม.
          </div>`,
          {
            permanent: true,
            direction: "left",
            offset: [-22, 0],
            className: "custom-delivery-radius-tooltip",
          }
        );
        boundaryCircleRef.current = boundaryCircle;

        // 3. Red Pin with text "ร้าน" (Store marker - exact replica of screenshot)
        const storeIconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
            <div style="
              width: 38px;
              height: 38px;
              background: #e11d48;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 13px;
              color: #ffffff;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">
              ร้าน
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #e11d48; margin-top: -2px;"></div>
            <div style="width: 6px; height: 6px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 2px;"></div>
          </div>
        `;

        const storeIcon = L.divIcon({
          html: storeIconHtml,
          className: "custom-store-pin",
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const storeMarker = L.marker([storeLat, storeLng], {
          icon: storeIcon,
          zIndexOffset: 500,
        }).addTo(map);

        storeMarker.bindPopup(`
          <div style="font-family: inherit; padding: 4px; font-size: 12px; text-align: center;">
            <b style="color: #e11d48; font-size: 13px;">🏪 ${storeName}</b>
            <div style="color: #4b5563; margin-top: 2px;">ขอบเขตการจัดส่ง: <b>รัศมี ${maxDistanceKm} กม.</b></div>
          </div>
        `);
        storeMarkerRef.current = storeMarker;

        // 4. Blue Pin (Customer / Selected delivery marker - exact replica of screenshot)
        const customerIconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
            <div style="
              width: 32px;
              height: 32px;
              background: #2563eb;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              border: 2px solid #ffffff;
            ">
              <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
            </div>
            <div style="width: 6px; height: 6px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 2px; filter: blur(0.5px);"></div>
          </div>
        `;

        const customerIcon = L.divIcon({
          html: customerIconHtml,
          className: "custom-customer-pin",
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const customerMarker = L.marker([initialLat, initialLng], {
          icon: customerIcon,
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        // Handle Pin Dragging (Do NOT call setLatLng inside dragend)
        customerMarker.on("dragend", (e: any) => {
          const pos = e.target.getLatLng();
          const formattedLat = parseFloat(pos.lat.toFixed(6));
          const formattedLng = parseFloat(pos.lng.toFixed(6));

          setCurrentLat(formattedLat);
          setCurrentLng(formattedLng);

          if (onChangeRef.current) {
            onChangeRef.current(formattedLat, formattedLng);
          }
        });

        customerMarkerRef.current = customerMarker;

        // Handle Map Click to Reposition
        map.on("click", (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          const formattedLat = parseFloat(clickLat.toFixed(6));
          const formattedLng = parseFloat(clickLng.toFixed(6));

          setCurrentLat(formattedLat);
          setCurrentLng(formattedLng);

          if (customerMarkerRef.current) {
            customerMarkerRef.current.setLatLng([formattedLat, formattedLng]);
          }

          if (onChangeRef.current) {
            onChangeRef.current(formattedLat, formattedLng);
          }
        });

        mapInstanceRef.current = map;

        // Safely adjust size and initial bounds without animation crashes
        map.whenReady(() => {
          setTimeout(() => {
            if (!isMounted || !mapInstanceRef.current) return;
            mapInstanceRef.current.invalidateSize();
            try {
              const bounds = L.latLngBounds([
                [initialLat, initialLng],
                [storeLat, storeLng],
              ]);
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false });
            } catch {}
          }, 150);
        });

      } catch (err) {
        console.error("Failed to initialize location picker map:", err);
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
  }, [storeLat, storeLng, storeName, maxDistanceKm]);

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-sm space-y-4 ${className}`}>
      {/* 1. Header (Title, Subtitle, Distance Badge & ใช้ตำแหน่งปัจจุบัน button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">{title}</h3>
            {distanceKm !== null && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isOutOfRange
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                ระยะทาง {distanceKm} กม.
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          className="self-start sm:self-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
        >
          {isLoadingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span>{isLoadingLocation ? "กำลังดึงพิกัด..." : "ใช้ตำแหน่งปัจจุบัน"}</span>
        </button>
      </div>

      {/* 2. Unified Status / Alert Banner (Inside the card directly above map) */}
      {distanceKm !== null && (
        <div>
          {isOutOfRange ? (
            <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>พิกัดของคุณอยู่ห่างจากร้าน {distanceKm} กม. (เกินระยะส่งสูงสุด {maxDistanceKm} กม.)</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed pl-6">
                ขออภัยครับ ที่อยู่ของคุณอยู่นอกพื้นที่จัดส่ง กรุณาเปลี่ยนเป็น <strong>"รับสินค้าที่หน้าร้าน"</strong> เพื่อสั่งซื้อสินค้าต่อได้ทันที
              </p>
              {onSwitchToPickup && (
                <div className="pl-6 pt-0.5">
                  <button
                    type="button"
                    onClick={onSwitchToPickup}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>เปลี่ยนเป็นรับที่หน้าร้าน</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  อยู่ในพื้นที่จัดส่ง! ระยะทาง <strong>{distanceKm} กม.</strong> จากร้านเกษรบ้านป่าเวียง (ส่งฟรี)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Map Canvas (OpenStreetMap with Red "ร้าน" marker, Blue Dashed Boundary, and Blue Customer Marker) */}
      <div
        className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-2xs relative bg-gray-50"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* 4. Bottom Coordinates Display (LAT & LNG Cards matching screenshot) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* LAT Box */}
        <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1">
            LAT
          </span>
          <span className="text-lg sm:text-xl font-black text-gray-900 font-mono tracking-tight block">
            {currentLat ? currentLat.toFixed(6) : "18.371368"}
          </span>
        </div>

        {/* LNG Box */}
        <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1">
            LNG
          </span>
          <span className="text-lg sm:text-xl font-black text-gray-900 font-mono tracking-tight block">
            {currentLng ? currentLng.toFixed(6) : "99.593594"}
          </span>
        </div>
      </div>
    </div>
  );
}
