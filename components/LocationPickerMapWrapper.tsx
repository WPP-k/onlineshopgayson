"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { LocationPickerMapProps } from "./LocationPickerMap";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-5 w-28 bg-gray-200 animate-pulse rounded-md"></div>
          <div className="h-3 w-48 bg-gray-100 animate-pulse rounded-md mt-1"></div>
        </div>
        <div className="h-8 w-32 bg-blue-50 animate-pulse rounded-2xl"></div>
      </div>
      <div className="h-[380px] w-full bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs text-gray-500 font-semibold">กำลังโหลดแผนที่ตำแหน่งจัดส่ง...</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-gray-50 border border-gray-100 rounded-2xl"></div>
        <div className="h-16 bg-gray-50 border border-gray-100 rounded-2xl"></div>
      </div>
    </div>
  ),
});

export default function LocationPickerMapWrapper(props: LocationPickerMapProps) {
  return <LocationPickerMap {...props} />;
}
