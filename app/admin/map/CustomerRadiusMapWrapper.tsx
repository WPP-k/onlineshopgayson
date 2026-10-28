"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { CustomerRadiusMapProps } from "@/components/CustomerRadiusMap";

const CustomerRadiusMap = dynamic(() => import("@/components/CustomerRadiusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-gray-200 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      <span className="text-sm text-gray-600 font-bold">กำลังโหลดแผนที่ตำแหน่งลูกค้าและขอบเขตระยะของร้าน...</span>
    </div>
  ),
});

export default function CustomerRadiusMapWrapper(props: CustomerRadiusMapProps) {
  return <CustomerRadiusMap {...props} />;
}
