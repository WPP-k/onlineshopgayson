"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  className?: string;
  displayValue?: boolean;
}

export function Barcode({
  value,
  height = 32,
  width = 1.2,
  fontSize = 11,
  className = "",
  displayValue = true,
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width,
        height,
        displayValue,
        fontSize,
        font: "monospace",
        textMargin: 2,
        margin: 2,
        background: "transparent",
        lineColor: "#111827",
      });
    } catch (e) {
      console.warn("Barcode render error:", e);
    }
  }, [value, width, height, fontSize, displayValue]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
}
