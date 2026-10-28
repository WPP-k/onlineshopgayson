"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface Unit {
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
  category: Category | null;
  unit: string | null;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  totalAmount: number;
  createdAt: Date;
  items: OrderItem[];
}

interface Props {
  products: Product[];
  categories: Category[];
  units: Unit[];
  orders: Order[];
}

// Format numbers without unnecessary trailing .00 Satang
const formatMoney = (val: number) => {
  return val.toLocaleString("th-TH", {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

export function ReportClient({ products, categories, units, orders }: Props) {
  const [activeTab, setActiveTab] = useState<"sales" | "profit" | "products" | "categories" | "units">("profit");

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const printDate = now.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + " " + now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit"
  });

  // Lookup map for products
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  // Metrics for Sales & Profit
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;

  const productSalesMap = new Map<string, {
    id: string;
    sku: string | null;
    name: string;
    category: string;
    unit: string;
    costPrice: number;
    price: number;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    stock: number;
    minStock: number;
  }>();
  
  products.forEach(p => {
    productSalesMap.set(p.id, {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category?.name || "-",
      unit: p.unit || "ชิ้น",
      costPrice: p.costPrice ?? 0,
      price: p.price,
      quantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin: 0,
      stock: p.stock,
      minStock: p.minStock
    });
  });

  let totalSalesCost = 0;
  let totalSoldQuantity = 0;

  orders.forEach(o => {
    o.items.forEach(item => {
      const prod = productMap.get(item.productId);
      const unitCost = prod?.costPrice ?? 0;
      const itemRev = item.price * item.quantity;
      const itemCost = unitCost * item.quantity;

      totalSalesCost += itemCost;
      totalSoldQuantity += item.quantity;

      const existing = productSalesMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += itemRev;
        existing.cost += itemCost;
        existing.profit += (itemRev - itemCost);
        existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      }
    });
  });

  const totalGrossProfit = totalSales - totalSalesCost;
  const overallProfitMargin = totalSales > 0 ? (totalGrossProfit / totalSales) * 100 : 0;

  // Inventory Valuation (สต็อกคงเหลือ)
  const totalInventoryCost = products.reduce((sum, p) => sum + (p.stock * (p.costPrice ?? 0)), 0);
  const totalInventoryRetailValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalInventoryPotentialProfit = totalInventoryRetailValue - totalInventoryCost;
  const totalInventoryMargin = totalInventoryRetailValue > 0 ? (totalInventoryPotentialProfit / totalInventoryRetailValue) * 100 : 0;

  // Filter lists
  const topSelling = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .filter(p => p.quantity > 0)
    .slice(0, 10);

  const topProfitableProducts = Array.from(productSalesMap.values())
    .filter(p => p.quantity > 0)
    .sort((a, b) => b.profit - a.profit);

  const lowStock = Array.from(productSalesMap.values())
    .filter(p => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen print:p-0 print:m-0 print:max-w-none print:bg-white print:text-black">
      {/* Header (Hidden when printing) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
        <div>
          <p className="text-xs font-bold text-red-700 tracking-wider uppercase mb-1">Store Reports & Profit Analysis</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">รายงานสรุปข้อมูลร้านค้า</h1>
          <p className="text-sm text-gray-500">รายงานยอดขาย ราคาทุน รายงานกำไร และสต็อกสินค้า</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("profit")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "profit"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            📊 รายงานกำไร
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "sales"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            💰 สรุปยอดขาย
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "products"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            📦 สินค้า & ราคาทุน
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "categories"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            หมวดหมู่สินค้า
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "units"
                ? "bg-[#b90000] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            หน่วยนับสินค้า
          </button>
          <button
            onClick={handlePrint}
            className="ml-2 px-6 py-2 rounded-lg text-sm font-bold bg-[#111827] text-white hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>🖨️ พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* Report Header for Print */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {activeTab === "profit" && "รายงานวิเคราะห์กำไรและต้นทุน (Profit Analysis Report)"}
              {activeTab === "sales" && "รายงานสรุปยอดขาย (Sales Summary Report)"}
              {activeTab === "products" && "รายงานสินค้า ราคาทุน และราคาขาย (Catalog & Cost Report)"}
              {activeTab === "categories" && "รายงานหมวดหมู่สินค้า (Category Report)"}
              {activeTab === "units" && "รายงานหน่วยนับสินค้า (Unit Report)"}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === "profit" && "แสดงรายละเอียดต้นทุนขาย กำไรสุทธิ และผลประกอบการแยกตามรายการสินค้า"}
              {activeTab === "sales" && "แสดงสรุปยอดขาย จำนวนออเดอร์ และอันดับสินค้าขายดี"}
              {activeTab === "products" && "แสดงรายการสินค้า ราคาทุน ราคาขาย กำไรต่อหน่วย สต็อก และจุดสั่งซื้อ MIN"}
              {activeTab === "categories" && "แสดงหมวดหมู่สินค้าทั้งหมดที่เปิดใช้งานในระบบ"}
              {activeTab === "units" && "แสดงหน่วยนับสินค้าทั้งหมดที่มีในระบบ"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">
              {activeTab === "profit" ? "ยอดกำไรสุทธิรวม" : "จำนวนทั้งหมด"}
            </p>
            <p className="text-2xl font-bold text-[#b90000] mb-1">
              {activeTab === "profit" && `฿${formatMoney(totalGrossProfit)}`}
              {activeTab === "sales" && `${totalOrders} รายการ`}
              {activeTab === "products" && `${products.length} รายการ`}
              {activeTab === "categories" && `${categories.length} หมวดหมู่`}
              {activeTab === "units" && `${units.length} หน่วยนับ`}
            </p>
            <p className="text-xs text-gray-400">พิมพ์เมื่อ {printDate}</p>
          </div>
        </div>

        {/* 1. PROFIT REPORT TAB */}
        {activeTab === "profit" && (
          <div className="space-y-8">
            {/* KPI Cards: Sales vs Cost vs Gross Profit */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">สรุปผลประกอบการจากการขายจริง</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-1">ยอดขายรวม (Revenue)</p>
                  <p className="text-2xl font-extrabold text-blue-900">฿{formatMoney(totalSales)}</p>
                  <p className="text-[11px] text-blue-600 mt-1">จาก {totalOrders} ออเดอร์ ({totalSoldQuantity} ชิ้น)</p>
                </div>
                <div className="bg-orange-50/70 p-5 rounded-2xl border border-orange-100">
                  <p className="text-xs font-medium text-orange-700 mb-1">ต้นทุนสินค้ารวม (Cost)</p>
                  <p className="text-2xl font-extrabold text-orange-900">฿{formatMoney(totalSalesCost)}</p>
                  <p className="text-[11px] text-orange-600 mt-1">คำนวณจากราคาทุนสินค้า</p>
                </div>
                <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-700 mb-1">กำไรสุทธิรวม (Gross Profit)</p>
                  <p className="text-2xl font-extrabold text-emerald-800">
                    {totalGrossProfit >= 0 ? "+" : ""}฿{formatMoney(totalGrossProfit)}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1">ยอดขาย หัก ต้นทุนสินค้า</p>
                </div>
                <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-100">
                  <p className="text-xs font-medium text-purple-700 mb-1">อัตรากำไร (Margin)</p>
                  <p className="text-2xl font-extrabold text-purple-900">
                    {overallProfitMargin.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-purple-600 mt-1">เปอร์เซ็นต์กำไรต่อยอดขาย</p>
                </div>
              </div>
            </div>

            {/* Inventory Cost & Profit Potential */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ประมาณการมูลค่าและกำไรจากสต็อกคงเหลือ (Inventory Valuation)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">มูลค่าต้นทุนสต็อกทั้งหมด</p>
                  <p className="text-xl font-bold text-gray-800">฿{formatMoney(totalInventoryCost)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">เงินทุนที่จมอยู่ในสินค้าคงคลัง</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">มูลค่าขายสต็อกทั้งหมด</p>
                  <p className="text-xl font-bold text-gray-800">฿{formatMoney(totalInventoryRetailValue)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">ยอดขายหากจำหน่ายสินค้าหมด</p>
                </div>
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 mb-1">กำไรคาดการณ์ในสต็อก ({totalInventoryMargin.toFixed(1)}%)</p>
                  <p className="text-xl font-bold text-emerald-700">฿{formatMoney(totalInventoryPotentialProfit)}</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">กำไรที่จะได้รับเมื่อขายหมดสต็อก</p>
                </div>
              </div>
            </div>

            {/* Profit by Product Table */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-base font-bold text-gray-900">สรุปกำไรแยกตามรายการสินค้าที่ขายได้</h3>
                <span className="text-xs text-gray-500">เรียงตามสินค้าที่สร้างกำไรสูงสุด</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                      <th className="py-3 px-3 font-semibold text-gray-600 w-12 text-center">อันดับ</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">บาร์โค้ด</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">ชื่อสินค้า</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-center">จำนวนขาย</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-right">ราคาทุน</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-right">ราคาขาย</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-right">ยอดขายรวม</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-right">ต้นทุนรวม</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-right">กำไรสุทธิ</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-right">อัตรากำไร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProfitableProducts.length > 0 ? (
                      topProfitableProducts.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-gray-700">{idx + 1}</td>
                          <td className="py-3 px-3 text-xs font-mono text-gray-500">{p.sku || "-"}</td>
                          <td className="py-3 px-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="py-3 px-3 text-center font-bold text-blue-700">{p.quantity} {p.unit}</td>
                          <td className="py-3 px-3 text-right text-gray-600">฿{formatMoney(p.costPrice)}</td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900">฿{formatMoney(p.price)}</td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">฿{formatMoney(p.revenue)}</td>
                          <td className="py-3 px-3 text-right text-orange-700">฿{formatMoney(p.cost)}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            {p.profit >= 0 ? "+" : ""}฿{formatMoney(p.profit)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              p.margin >= 30 ? "bg-emerald-100 text-emerald-800" :
                              p.margin >= 15 ? "bg-blue-100 text-blue-800" :
                              p.margin >= 0 ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {p.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-400">
                          ยังไม่มีรายการขายในระบบ หรือออเดอร์ยังไม่ได้เปลี่ยนสถานะเป็นชำระเงินแล้ว
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {topProfitableProducts.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                        <td colSpan={3} className="py-3 px-3 text-gray-900">รวมทั้งหมด ({topProfitableProducts.length} สินค้า)</td>
                        <td className="py-3 px-3 text-center text-blue-700">{totalSoldQuantity} ชิ้น</td>
                        <td colSpan={2}></td>
                        <td className="py-3 px-3 text-right text-gray-900">฿{formatMoney(totalSales)}</td>
                        <td className="py-3 px-3 text-right text-orange-700">฿{formatMoney(totalSalesCost)}</td>
                        <td className="py-3 px-3 text-right text-emerald-700">฿{formatMoney(totalGrossProfit)}</td>
                        <td className="py-3 px-3 text-right text-purple-700">{overallProfitMargin.toFixed(1)}%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. SALES SUMMARY TAB */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600 mb-1">ยอดขายรวม</p>
                <p className="text-2xl font-bold text-blue-900">฿{formatMoney(totalSales)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-sm text-green-600 mb-1">จำนวนออเดอร์</p>
                <p className="text-2xl font-bold text-green-900">{totalOrders} <span className="text-sm font-normal text-green-700">รายการ</span></p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-600 mb-1">สินค้าที่ขายได้</p>
                <p className="text-2xl font-bold text-purple-900">{topSelling.reduce((acc, curr) => acc + curr.quantity, 0)} <span className="text-sm font-normal text-purple-700">ชิ้น</span></p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-sm text-orange-600 mb-1">สินค้าใกล้หมด</p>
                <p className="text-2xl font-bold text-orange-900">{lowStock.length} <span className="text-sm font-normal text-orange-700">รายการ</span></p>
              </div>
            </div>

            <div className="hidden print:flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-4">
              <div>
                <p className="text-xs text-gray-500">ยอดขายรวมทั้งหมด</p>
                <p className="text-xl font-bold text-gray-900">฿{formatMoney(totalSales)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">จำนวนออเดอร์ทั้งหมด</p>
                <p className="text-xl font-bold text-gray-900">{totalOrders} รายการ</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">10 อันดับสินค้าขายดี</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">อันดับ</th>
                    <th className="py-3 px-4 font-semibold text-gray-600">ชื่อสินค้า</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">จำนวนที่ขายได้</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">ยอดขาย (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topSelling.length > 0 ? topSelling.map((p, index) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-center font-bold text-gray-900">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-4 text-right font-medium">{p.quantity}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">฿{formatMoney(p.revenue)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        ยังไม่มีข้อมูลการขาย
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 mt-8">สินค้าใกล้หมด/หมดสต็อก</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-3 px-4 font-semibold text-gray-600 w-16 text-center">ลำดับ</th>
                    <th className="py-3 px-4 font-semibold text-gray-600">ชื่อสินค้า</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">สต็อกคงเหลือ</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 text-right">จุดสั่งซื้อ (MIN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStock.length > 0 ? lowStock.map((p, index) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-center font-bold text-gray-900">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                      <td className={`py-3 px-4 text-right font-bold ${p.stock <= 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.stock}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{p.minStock}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        สินค้าอยู่ในระดับปกติทั้งหมด
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PRODUCTS & COST REPORT TAB */}
        {activeTab === "products" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="py-3.5 px-2 font-semibold text-gray-700 w-14 text-center">ลำดับ</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700">รหัสบาร์โค้ด</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700">ชื่อสินค้า</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700">หมวดหมู่</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700 text-center">หน่วย</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700 text-right">ราคาทุน</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700 text-right">ราคาขาย</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700 text-right">กำไร</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700 text-right">สต็อก</th>
                  <th className="py-3.5 px-2 font-semibold text-gray-700 text-right">ขั้นต่ำ (MIN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p, index) => {
                  const unitCost = p.costPrice ?? 0;
                  const unitProfit = p.price - unitCost;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 text-center font-bold text-gray-900">{index + 1}</td>
                      <td className="py-3 px-2 text-xs font-mono text-gray-600">{p.sku || "-"}</td>
                      <td className="py-3 px-2 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-2 text-gray-600">{p.category?.name || "-"}</td>
                      <td className="py-3 px-2 text-center text-gray-600">{p.unit || "-"}</td>
                      <td className="py-3 px-2 text-right text-gray-600 font-medium">฿{formatMoney(unitCost)}</td>
                      <td className="py-3 px-2 text-right font-bold text-gray-900">฿{formatMoney(p.price)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-semibold text-xs px-2 py-0.5 rounded ${
                          unitProfit > 0 ? "bg-emerald-50 text-emerald-700" :
                          unitProfit < 0 ? "bg-red-50 text-red-700" : "text-gray-400"
                        }`}>
                          {unitProfit >= 0 ? "+" : ""}฿{formatMoney(unitProfit)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-gray-900">{p.stock}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{p.minStock}</td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      ไม่มีรายการสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="py-4 px-4 font-semibold text-gray-600 w-24 text-center">ลำดับ</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">ชื่อหมวดหมู่</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">รหัสอ้างอิง (ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((c, index) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 text-center font-bold text-gray-900">{index + 1}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-4 px-4 text-gray-500 font-mono text-xs">{c.id}</td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      ไม่มีรายการหมวดหมู่
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. UNITS TAB */}
        {activeTab === "units" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="py-4 px-4 font-semibold text-gray-600 w-24 text-center">ลำดับ</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">ชื่อหน่วยนับ</th>
                  <th className="py-4 px-4 font-semibold text-gray-600">รหัสอ้างอิง (ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {units.map((u, index) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 text-center font-bold text-gray-900">{index + 1}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">{u.name}</td>
                    <td className="py-4 px-4 text-gray-500 font-mono text-xs">{u.id}</td>
                  </tr>
                ))}
                {units.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      ไม่มีรายการหน่วยนับ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          /* Show only the printable area */
          .bg-white.p-8.rounded-3xl, .bg-white.p-8.rounded-3xl * {
            visibility: visible;
          }
          .bg-white.p-8.rounded-3xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
}
