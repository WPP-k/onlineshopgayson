"use client";

import { Printer } from "lucide-react";

export function ReceiptPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-[#b90000] hover:bg-red-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer active:scale-95"
    >
      <Printer className="w-4 h-4" />
      <span>พิมพ์ใบเสร็จรับเงิน</span>
    </button>
  );
}
