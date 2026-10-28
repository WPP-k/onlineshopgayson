"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { 
  Store, 
  MapPin, 
  Truck, 
  Navigation, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Phone,
  AlertTriangle,
  Info,
  Layers,
} from "lucide-react";

export interface DeliveryMapProps {
  // Store info
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;

  // Delivery Boundary
  maxDistanceKm?: number; // Radius in km

  // Customer info
  customerLat?: number | null;
  customerLng?: number | null;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;

  // Rider & Status info
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  deliveryStatus?: string; // PENDING, ASSIGNED, DELIVERING, DELIVERED, CANCELLED
  orderStatus?: string;    // PENDING, PAID, SHIPPED, DELIVERED
  deliveryType?: string;   // DELIVERY, PICKUP

  // Interactive controls
  height?: string;
  showControls?: boolean;
  showLegend?: boolean;
  allowPinDrop?: boolean;
  onCustomerLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

// Generate realistic intermediate road waypoints between two coordinates
function generateCurvedRoute(
  start: [number, number],
  end: [number, number],
  numPoints: number = 20
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Subtle natural detour curve
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  
  // Perpendicular offset for road-like curvature
  const perpLat = -dLng * 0.18;
  const perpLng = dLat * 0.18;
  const controlPoint: [number, number] = [midLat + perpLat, midLng + perpLng];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier interpolation
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlPoint[0] + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlPoint[1] + t * t * lng2;
    points.push([lat, lng]);
  }

  return points;
}

// Calculate Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export default function DeliveryMap({
  storeLat = 18.564567,
  storeLng = 99.458904,
  storeName = "ร้านเกษรบ้านป่าเวียง",
  storeAddress = "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน จ.ลำปาง 52240",
  storePhone = "089-851-0807",
  maxDistanceKm = 5,
  customerLat,
  customerLng,
  customerName = "ลูกค้า",
  customerPhone,
  customerAddress = "ที่อยู่จัดส่ง",
  riderName,
  riderPhone,
  riderVehicle = "รถจักรยานยนต์",
  deliveryStatus = "PENDING",
  orderStatus,
  deliveryType = "DELIVERY",
  height = "380px",
  showControls = true,
  showLegend = true,
  allowPinDrop = false,
  onCustomerLocationChange,
  className = "",
}: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Markers & Layer references
  const storeMarkerRef = useRef<any>(null);
  const boundaryCircleRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);

  // Map layer type (Default to OpenStreetMap as shown in screenshot!)
  const [mapType, setMapType] = useState<"osm" | "satellite">("osm");

  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [distanceFromStore, setDistanceFromStore] = useState<number | null>(null);
  const [isWithinBoundary, setIsWithinBoundary] = useState<boolean>(true);

  const animFrameRef = useRef<number | null>(null);
  const routePointsRef = useRef<[number, number][]>([]);

  const hasCustomerCoords = typeof customerLat === "number" && typeof customerLng === "number" && !isNaN(customerLat) && !isNaN(customerLng);

  // Calculate distance
  useEffect(() => {
    if (hasCustomerCoords && customerLat && customerLng) {
      const dist = calculateDistance(storeLat, storeLng, customerLat, customerLng);
      setDistanceFromStore(dist);
      setIsWithinBoundary(dist <= maxDistanceKm);
    } else {
      setDistanceFromStore(null);
      setIsWithinBoundary(true);
    }
  }, [storeLat, storeLng, customerLat, customerLng, maxDistanceKm, hasCustomerCoords]);

  // Initial progress calculation based on status
  const getInitialProgress = useCallback(() => {
    if (deliveryStatus === "DELIVERED" || orderStatus === "DELIVERED") return 1.0;
    if (deliveryStatus === "DELIVERING" || orderStatus === "SHIPPED") return 0.65;
    if (deliveryStatus === "ASSIGNED") return 0.25;
    return 0.05; // At store
  }, [deliveryStatus, orderStatus]);

  // Callbacks and flags stored in refs to avoid recreating the map on every parent re-render
  const onLocationChangeRef = useRef(onCustomerLocationChange);
  const allowPinDropRef = useRef(allowPinDrop);

  useEffect(() => {
    onLocationChangeRef.current = onCustomerLocationChange;
  }, [onCustomerLocationChange]);

  useEffect(() => {
    allowPinDropRef.current = allowPinDrop;
  }, [allowPinDrop]);

  // Helper to create HTML icon
  const createHtmlIcon = useCallback((L: any, html: string, anchor: [number, number] = [0, 0]) => {
    return L.divIcon({
      html,
      className: "custom-leaflet-div-icon",
      iconSize: [0, 0],
      iconAnchor: anchor,
    });
  }, []);

  // Switch Tile Layer (OpenStreetMap vs Satellite)
  const switchTileLayer = useCallback((type: "osm" | "satellite", map: any, L: any) => {
    if (tileLayerRef.current) {
      try { map.removeLayer(tileLayerRef.current); } catch {}
    }
    if (labelsLayerRef.current) {
      try { map.removeLayer(labelsLayerRef.current); } catch {}
    }

    if (type === "satellite") {
      // 🛰️ High-resolution Satellite Imagery (Esri World Imagery)
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
      // 🗺️ Standard OpenStreetMap (Exact match with user screenshot!)
      tileLayerRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, []);

  // Initialize Map (Mount only)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapContainerRef.current) return;

        LRef.current = L;

        // Clean up stale Leaflet instance or ID on container
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
          mapInstanceRef.current = null;
        }

        if ((mapContainerRef.current as any)?._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const centerLat = hasCustomerCoords && customerLat ? (storeLat + customerLat) / 2 : storeLat;
        const centerLng = hasCustomerCoords && customerLng ? (storeLng + customerLng) / 2 : storeLng;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: hasCustomerCoords ? 11 : 12,
          zoomControl: false,
        });

        // Set OpenStreetMap Tile Layer
        switchTileLayer(mapType, map, L);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        mapInstanceRef.current = map;

        // Force Leaflet to update its container dimensions
        map.whenReady(() => {
          map.invalidateSize();
        });
        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 100);
        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 400);

        // Automatic ResizeObserver
        if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
          const ro = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          });
          ro.observe(mapContainerRef.current);
        }

        // Handle click for pin drop if enabled
        map.on("click", (e: any) => {
          if (allowPinDropRef.current && onLocationChangeRef.current) {
            const { lat, lng } = e.latlng;
            onLocationChangeRef.current(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
          }
        });

        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to initialize Leaflet map:", err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Handle Map Type Change
  useEffect(() => {
    if (mapInstanceRef.current && LRef.current && isLoaded) {
      switchTileLayer(mapType, mapInstanceRef.current, LRef.current);
    }
  }, [mapType, isLoaded, switchTileLayer]);

  // Update Layers (Store, Boundary Circle, Customer, Vehicle, Route)
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !LRef.current) return;

    const L = LRef.current;
    const map = mapInstanceRef.current;

    // 1. Store Marker - exact replica of user screenshot (Red circular badge with bold "ร้าน")
    if (storeMarkerRef.current) {
      map.removeLayer(storeMarkerRef.current);
    }

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

    const storeMarker = L.marker([storeLat, storeLng], {
      icon: createHtmlIcon(L, storeIconHtml, [0, 0]),
      zIndexOffset: 500,
    }).addTo(map);

    storeMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; padding: 4px; min-width: 220px;">
        <div style="font-weight: 800; color: #e11d48; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
          🏬 ${storeName}
        </div>
        <p style="color: #4b5563; margin: 0 0 4px 0; font-size: 11px;">${storeAddress}</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #1e40af; margin-top: 6px;">
          📍 ขอบเขตจัดส่ง: รัศมีไม่เกิน <b>${maxDistanceKm} กม.</b>
        </div>
        <div style="margin-top: 6px; font-size: 11px; color: #6b7280;">
          📞 โทร: <b>${storePhone}</b>
        </div>
      </div>
    `);

    storeMarkerRef.current = storeMarker;

    // 2. Boundary Circle (Dashed blue circle + permanent floating tooltip - exact replica of user screenshot)
    if (boundaryCircleRef.current) {
      map.removeLayer(boundaryCircleRef.current);
    }

    const radiusMeters = (maxDistanceKm || 5) * 1000;
    const boundaryCircle = L.circle([storeLat, storeLng], {
      radius: radiusMeters,
      color: "#2563eb",
      weight: 2.5,
      dashArray: "8, 8",
      fillColor: "#3b82f6",
      fillOpacity: 0.08,
    }).addTo(map);

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

    // 3. Customer Marker (Teardrop blue pin with white inner circle - exact replica of user screenshot)
    if (customerMarkerRef.current) {
      map.removeLayer(customerMarkerRef.current);
      customerMarkerRef.current = null;
    }

    if (hasCustomerCoords && customerLat && customerLng) {
      const isOk = (distanceFromStore ?? 0) <= maxDistanceKm;

      const customerIconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: ${allowPinDrop ? "grab" : "pointer"}; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
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

      const customerMarker = L.marker([customerLat, customerLng], {
        icon: createHtmlIcon(L, customerIconHtml, [0, 0]),
        draggable: allowPinDrop,
        zIndexOffset: 450,
      }).addTo(map);

      if (allowPinDrop) {
        customerMarker.on("dragend", (e: any) => {
          if (onLocationChangeRef.current) {
            const { lat, lng } = e.target.getLatLng();
            onLocationChangeRef.current(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
          }
        });
      }

      customerMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; padding: 4px; min-width: 220px;">
          <div style="font-weight: 800; color: #1e3a8a; font-size: 13px; margin-bottom: 2px;">
            🏠 ตำแหน่งผู้รับ: ${customerName}
          </div>
          ${customerPhone ? `<p style="color: #4b5563; margin: 0 0 2px 0; font-size: 11px;">📞 ${customerPhone}</p>` : ""}
          <p style="color: #4b5563; margin: 0 0 4px 0; font-size: 11px;">📍 ${customerAddress}</p>
          <div style="background: ${isOk ? "#eff6ff" : "#fff7ed"}; border: 1px solid ${isOk ? "#bfdbfe" : "#fed7aa"}; border-radius: 6px; padding: 4px 8px; font-size: 11px; color: ${isOk ? "#1e40af" : "#9a3412"};">
            ระยะทางจากร้าน: <b>${distanceFromStore ?? "-"} กม.</b><br/>
            สถานะ: <b>${isOk ? "✅ อยู่ในรัศมีจัดส่ง (ส่งฟรี)" : "⚠️ อยู่นอกพื้นที่จัดส่ง"}</b>
          </div>
        </div>
      `);

      customerMarkerRef.current = customerMarker;

      // 4. Route Polyline
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
      }

      const route = generateCurvedRoute([storeLat, storeLng], [customerLat, customerLng], 30);
      routePointsRef.current = route;

      const polyline = L.polyline(route, {
        color: "#2563eb",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "8, 8",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      routePolylineRef.current = polyline;

      // 5. Delivery Vehicle Marker (🛵 Rider pin when in transit)
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
      }

      if (deliveryType === "DELIVERY") {
        const initProg = getInitialProgress();
        setSimulationProgress(initProg);

        const pointIndex = Math.min(
          Math.floor(initProg * (route.length - 1)),
          route.length - 1
        );
        const vehiclePos = route[pointIndex] || [storeLat, storeLng];

        const vehicleIconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
            <div style="
              width: 38px;
              height: 38px;
              background: #e11d48;
              color: white;
              border: 3px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 4px 10px rgba(225,29,72,0.45);
            ">
              🛵
            </div>
            <div style="
              background: #1e293b;
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 9999px;
              white-space: nowrap;
              margin-top: 3px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.25);
              border: 1px solid rgba(255,255,255,0.4);
            ">
              ${riderName ? riderName : "รถจัดส่ง"}
            </div>
          </div>
        `;

        const vehicleMarker = L.marker(vehiclePos, {
          icon: createHtmlIcon(L, vehicleIconHtml, [0, 0]),
          zIndexOffset: 1200,
        }).addTo(map);

        vehicleMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; padding: 4px; min-width: 200px;">
            <div style="font-weight: 800; color: #e11d48; font-size: 13px; margin-bottom: 2px;">
              🛵 พนักงานจัดส่งสินค้า
            </div>
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #1e293b;">
              ${riderName || "พนักงานส่งของของร้าน"}
            </p>
            ${riderPhone ? `<p style="margin: 2px 0; color: #4b5563; font-size: 11px;">📞 ${riderPhone}</p>` : ""}
            <p style="margin: 0; color: #64748b; font-size: 11px;">ยานพาหนะ: ${riderVehicle || "มอเตอร์ไซค์"}</p>
          </div>
        `);

        vehicleMarkerRef.current = vehicleMarker;
      }

      // Auto fit map bounds to comfortably show both pins
      try {
        const bounds = L.latLngBounds([
          [storeLat, storeLng],
          [customerLat, customerLng],
        ]);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 13 });
      } catch (err) {}
    } else {
      map.setView([storeLat, storeLng], 12);
    }
  }, [
    isLoaded,
    storeLat,
    storeLng,
    storeName,
    storeAddress,
    storePhone,
    maxDistanceKm,
    customerLat,
    customerLng,
    customerName,
    customerPhone,
    customerAddress,
    riderName,
    riderPhone,
    riderVehicle,
    deliveryType,
    allowPinDrop,
    distanceFromStore,
    hasCustomerCoords,
    createHtmlIcon,
    getInitialProgress,
  ]);

  // Handle Simulation
  const toggleSimulation = () => {
    if (isSimulating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      startSimulation();
    }
  };

  const startSimulation = () => {
    const route = routePointsRef.current;
    if (!route || route.length < 2) return;

    let currentStep = Math.floor(simulationProgress * (route.length - 1));
    const totalSteps = route.length - 1;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = time - lastTime;
      if (dt > 120) {
        lastTime = time;
        currentStep += 1;
        if (currentStep > totalSteps) {
          currentStep = 0;
        }

        const progress = currentStep / totalSteps;
        setSimulationProgress(progress);

        const newPos = route[currentStep];
        if (vehicleMarkerRef.current && newPos) {
          vehicleMarkerRef.current.setLatLng(newPos);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const resetSimulation = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSimulating(false);
    const initProg = getInitialProgress();
    setSimulationProgress(initProg);

    const route = routePointsRef.current;
    if (route && vehicleMarkerRef.current) {
      const pointIndex = Math.min(
        Math.floor(initProg * (route.length - 1)),
        route.length - 1
      );
      const vehiclePos = route[pointIndex] || [storeLat, storeLng];
      vehicleMarkerRef.current.setLatLng(vehiclePos);
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 flex flex-col space-y-3.5 transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none shadow-2xl p-4 overflow-auto" : ""
      } ${className}`}
    >
      {/* Top Header Row matching user's screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-base sm:text-lg text-gray-900 tracking-tight">
              ตำแหน่งการจัดส่งสินค้า
            </h3>
            {distanceFromStore !== null && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-0.5 rounded-full border border-emerald-200">
                ระยะทาง {distanceFromStore} กม.
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {allowPinDrop
              ? "ลากหมุดสีน้ำเงินหรือแตะบนแผนที่เพื่อปรับตำแหน่งที่จัดส่งให้แม่นยำยิ่งขึ้น"
              : "แสดงตำแหน่งร้านค้า ขอบเขตรัศมีจัดส่ง และตำแหน่งปลายทางของลูกค้า"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          {/* Tile Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 border border-gray-200 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setMapType("osm")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                mapType === "osm"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              title="แผนที่ OpenStreetMap (เหมือนในรูป)"
            >
              🗺️ แผนที่
            </button>
            <button
              type="button"
              onClick={() => setMapType("satellite")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                mapType === "satellite"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              title="ภาพถ่ายดาวเทียม"
            >
              🛰️ ดาวเทียม
            </button>
          </div>

          {/* Simulation Toggle */}
          {hasCustomerCoords && deliveryType === "DELIVERY" && (
            <button
              type="button"
              onClick={toggleSimulation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                isSimulating
                  ? "bg-amber-500 hover:bg-amber-600 text-gray-950"
                  : "bg-[#b90000] hover:bg-red-800 text-white shadow-2xs"
              }`}
              title="จำลองการเดินทางของรถจัดส่งสินค้า"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSimulating ? "หยุด" : "จำลองการส่ง"}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors cursor-pointer border border-gray-200"
            title={isFullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* In-Range / Out-of-Range Banner matching screenshot */}
      {distanceFromStore !== null && (
        <div
          className={`p-3 px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all ${
            isWithinBoundary
              ? "bg-[#f0fdf4] text-emerald-800 border-emerald-200"
              : "bg-[#fffbeb] text-amber-800 border-amber-200"
          }`}
        >
          {isWithinBoundary ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                อยู่ในพื้นที่จัดส่ง! ระยะทาง {distanceFromStore} กม. จาก{storeName} (ส่งฟรี)
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                ระยะทาง {distanceFromStore} กม. จาก{storeName} (เกินรัศมีบริการ {maxDistanceKm} กม.)
              </span>
            </>
          )}
        </div>
      )}

      {/* Map Canvas Frame */}
      <div 
        className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner" 
        style={{ 
          height: isFullscreen ? "calc(100vh - 240px)" : height,
          minHeight: isFullscreen ? "calc(100vh - 240px)" : height,
        }}
      >
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-0" 
        />

        {/* Simulation progress bar overlay */}
        {isSimulating && (
          <div className="absolute bottom-3 left-3 right-16 z-10 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md text-gray-900 p-2.5 px-4 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-3">
              <span className="text-xs font-bold shrink-0">กำลังเดินทาง...</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#b90000] h-full rounded-full transition-all duration-100"
                  style={{ width: `${Math.round(simulationProgress * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold shrink-0 text-[#b90000]">
                {Math.round(simulationProgress * 100)}%
              </span>
              <button
                type="button"
                onClick={resetSimulation}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors"
                title="เริ่มใหม่"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom LAT / LNG Cards matching exact screenshot */}
      {hasCustomerCoords && typeof customerLat === "number" && typeof customerLng === "number" && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="block text-[10px] font-black text-gray-400 tracking-wider">LAT</span>
            <span className="block text-base sm:text-lg font-black text-gray-900 font-mono mt-0.5">
              {customerLat.toFixed(6)}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="block text-[10px] font-black text-gray-400 tracking-wider">LNG</span>
            <span className="block text-base sm:text-lg font-black text-gray-900 font-mono mt-0.5">
              {customerLng.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-1">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#e11d48] border-2 border-white shadow-xs"></span>
              <span className="text-gray-700">หมุดร้านค้า ({storeName})</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="inline-block w-4 h-2 border-2 border-blue-600 border-dashed rounded-xs bg-blue-50"></span>
              <span className="text-gray-700">รัศมีจัดส่ง ({maxDistanceKm} กม.)</span>
            </div>
            {hasCustomerCoords && (
              <div className="flex items-center gap-1.5 font-medium">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></span>
                <span className="text-gray-700">หมุดลูกค้า ({customerName})</span>
              </div>
            )}
          </div>

          <span className="text-[11px] text-gray-400">
            * คำนวณระยะทางแบบเส้นตรงตามพิกัดดาวเทียม GPS
          </span>
        </div>
      )}
    </div>
  );
}
