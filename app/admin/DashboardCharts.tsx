"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ExternalLink,
  DollarSign
} from "lucide-react";

export interface ChartDayData {
  date: string;       // YYYY-MM-DD
  label: string;      // e.g. "16 ก.ย."
  dayOfWeek: string;  // e.g. "พุธ"
  sales: number;
  orders: number;
}

export interface ChartMonthData {
  month: string;      // e.g. "ก.ย."
  fullLabel: string;  // e.g. "กันยายน 2026"
  sales: number;
  orders: number;
}

export interface StatusCount {
  status: string;
  label: string;
  count: number;
  amount: number;
  color: string;
  bgLight: string;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  totalRevenue: number;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  itemCount: number;
  createdAt: string;
}

interface DashboardChartsProps {
  last7Days: ChartDayData[];
  last30Days: ChartDayData[];
  monthlyData: ChartMonthData[];
  statusDistribution: StatusCount[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  summary: {
    totalSales: number;
    orderCount: number;
    productCount: number;
    userCount: number;
    avgOrderValue: number;
  };
}

export function DashboardCharts({
  last7Days,
  last30Days,
  monthlyData,
  statusDistribution,
  topProducts,
  recentOrders,
  summary,
}: DashboardChartsProps) {
  // Time period filter: '7d' | '30d' | 'month'
  const [period, setPeriod] = useState<"7d" | "30d" | "month">("7d");
  // Metric toggle: 'both' | 'sales' | 'orders'
  const [metric, setMetric] = useState<"both" | "sales" | "orders">("both");
  // Hovered item for tooltip
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active chart dataset
  const activeDataset = useMemo(() => {
    if (period === "7d") return last7Days;
    if (period === "30d") return last30Days;
    return monthlyData.map((m) => ({
      date: m.month,
      label: m.month,
      dayOfWeek: m.fullLabel,
      sales: m.sales,
      orders: m.orders,
    }));
  }, [period, last7Days, last30Days, monthlyData]);

  // Max values for scale
  const maxSales = useMemo(() => {
    const max = Math.max(...activeDataset.map((d) => d.sales), 100);
    return Math.ceil(max / 50) * 50;
  }, [activeDataset]);

  const maxOrders = useMemo(() => {
    const max = Math.max(...activeDataset.map((d) => d.orders), 5);
    return Math.ceil(max / 2) * 2;
  }, [activeDataset]);

  // Total sales and orders for the selected period
  const periodTotalSales = useMemo(
    () => activeDataset.reduce((sum, d) => sum + d.sales, 0),
    [activeDataset]
  );
  const periodTotalOrders = useMemo(
    () => activeDataset.reduce((sum, d) => sum + d.orders, 0),
    [activeDataset]
  );

  // Total orders for status donut chart
  const totalStatusOrders = useMemo(
    () => statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1,
    [statusDistribution]
  );

  return (
    <div className="space-y-8">
      {/* 1. Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: ยอดขายรวม */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              ยอดขายรวม
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#b90000] flex items-center justify-center font-bold">
              ฿
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              ฿{summary.totalSales.toLocaleString("th-TH")}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ยอดชำระแล้วเฉลี่ย ฿{summary.avgOrderValue.toFixed(0)} / ออเดอร์</span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-red-50 rounded-full opacity-30 group-hover:scale-110 transition-transform pointer-events-none" />
        </div>

        {/* Card 2: ออเดอร์ทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              ออเดอร์ทั้งหมด
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {summary.orderCount.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-gray-500">รายการ</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>อัปเดตแบบเรียลไทม์</span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-blue-50 rounded-full opacity-30 group-hover:scale-110 transition-transform pointer-events-none" />
        </div>

        {/* Card 3: สินค้าในระบบ */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              สินค้าในระบบ
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {summary.productCount.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-gray-500">รายการ</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <Link
              href="/admin/products?tab=list"
              className="text-[#b90000] hover:underline flex items-center gap-0.5"
            >
              <span>จัดการสินค้า</span> →
            </Link>
          </div>
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-amber-50 rounded-full opacity-30 group-hover:scale-110 transition-transform pointer-events-none" />
        </div>

        {/* Card 4: ผู้ใช้งานทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              ผู้ใช้งานทั้งหมด
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {summary.userCount.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-gray-500">บัญชี</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <Link
              href="/admin/users"
              className="text-[#b90000] hover:underline flex items-center gap-0.5"
            >
              <span>จัดการผู้ใช้งาน</span> →
            </Link>
          </div>
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-purple-50 rounded-full opacity-30 group-hover:scale-110 transition-transform pointer-events-none" />
        </div>
      </div>

      {/* 2. Main Analytics Chart: กราฟยอดขายและจำนวนคำสั่งซื้อ */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-[#b90000] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                กราฟแนวโน้มการสั่งซื้อและยอดขาย
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              แสดงสถิติยอดขาย (฿) และปริมาณการสั่งซื้อ (ออเดอร์) ตามช่วงเวลา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetric("both")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  metric === "both"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setMetric("sales")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  metric === "sales"
                    ? "bg-[#b90000] text-white shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>ยอดขาย (฿)</span>
              </button>
              <button
                type="button"
                onClick={() => setMetric("orders")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  metric === "orders"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-300" />
                <span>ออเดอร์</span>
              </button>
            </div>

            {/* Time Period Filter */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPeriod("7d")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === "7d"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setPeriod("30d")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === "30d"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                30 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  period === "month"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                รายเดือน
              </button>
            </div>
          </div>
        </div>

        {/* Period Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">ยอดขายช่วงนี้</span>
            <p className="text-lg font-bold text-[#b90000]">
              ฿{periodTotalSales.toLocaleString("th-TH")}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">จำนวนออเดอร์ช่วงนี้</span>
            <p className="text-lg font-bold text-blue-600">
              {periodTotalOrders} รายการ
            </p>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">เฉลี่ยต่อวัน</span>
            <p className="text-lg font-bold text-gray-800">
              ฿{(periodTotalSales / Math.max(activeDataset.length, 1)).toFixed(0)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">ความถี่การซื้อ</span>
            <p className="text-lg font-bold text-gray-800">
              {(periodTotalOrders / Math.max(activeDataset.length, 1)).toFixed(1)} ออเดอร์/วัน
            </p>
          </div>
        </div>

        {/* Interactive SVG Bar & Line Chart */}
        <div className="relative pt-4 pb-2">
          {/* Legend */}
          <div className="flex items-center justify-end gap-5 mb-4 text-xs font-medium">
            {(metric === "both" || metric === "sales") && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#b90000]" />
                <span className="text-gray-700">ยอดขาย (บาท)</span>
              </div>
            )}
            {(metric === "both" || metric === "orders") && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-500" />
                <span className="text-gray-700">จำนวนออเดอร์</span>
              </div>
            )}
          </div>

          {/* Chart Canvas */}
          <div className="h-64 sm:h-72 w-full flex items-end gap-1 sm:gap-2 px-2 border-b border-gray-200">
            {activeDataset.map((item, index) => {
              const salesHeightPercent = maxSales > 0 ? (item.sales / maxSales) * 100 : 0;
              const ordersHeightPercent = maxOrders > 0 ? (item.orders / maxOrders) * 100 : 0;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-30 bg-gray-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                      <div className="font-bold text-amber-300 mb-1">
                        {item.dayOfWeek ? `${item.dayOfWeek} ` : ""}{item.label}
                      </div>
                      <div className="flex items-center gap-2 text-gray-200">
                        <span>ยอดขาย:</span>
                        <span className="font-bold text-white">฿{item.sales.toLocaleString("th-TH")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-200">
                        <span>ออเดอร์:</span>
                        <span className="font-bold text-white">{item.orders} รายการ</span>
                      </div>
                      {/* Arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
                    </div>
                  )}

                  {/* Bars Container */}
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                    {/* Bar 1: Sales (Red) */}
                    {(metric === "both" || metric === "sales") && (
                      <div
                        style={{ height: `${Math.max(salesHeightPercent, item.sales > 0 ? 6 : 2)}%` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                          item.sales > 0
                            ? isHovered
                              ? "bg-red-600 shadow-sm"
                              : "bg-[#b90000] hover:bg-red-700"
                            : "bg-gray-100"
                        }`}
                      />
                    )}

                    {/* Bar 2: Orders (Blue) */}
                    {(metric === "both" || metric === "orders") && (
                      <div
                        style={{ height: `${Math.max(ordersHeightPercent, item.orders > 0 ? 6 : 2)}%` }}
                        className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${
                          item.orders > 0
                            ? isHovered
                              ? "bg-blue-700 shadow-sm"
                              : "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-100"
                        }`}
                      />
                    )}
                  </div>

                  {/* X-axis Label */}
                  <div className="mt-3 text-[10px] sm:text-[11px] font-semibold text-gray-500 text-center truncate max-w-full">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Secondary Section: Status Distribution + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: สัดส่วนสถานะคำสั่งซื้อ (Donut Chart & Breakdown) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">สัดส่วนสถานะออเดอร์</h3>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              สถานะคำสั่งซื้อทั้งหมด {totalStatusOrders} รายการ
            </p>

            {/* Circular Donut Visual */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f3f4f6"
                    strokeWidth="12"
                  />
                  {/* Status Segments */}
                  {(() => {
                    let accumulatedPercent = 0;
                    const circumference = 2 * Math.PI * 40; // ~251.32

                    return statusDistribution.map((item, idx) => {
                      if (item.count === 0) return null;
                      const percent = item.count / totalStatusOrders;
                      const strokeDasharray = `${percent * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedPercent * circumference;
                      accumulatedPercent += percent;

                      return (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Donut Center Info */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {totalStatusOrders}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">ออเดอร์</span>
                </div>
              </div>
            </div>

            {/* Status Legend List */}
            <div className="space-y-2.5 mt-6">
              {statusDistribution.map((item, idx) => {
                const percent = Math.round((item.count / totalStatusOrders) * 100);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-medium">{item.count} รายการ</span>
                      <span className="font-bold text-gray-900 w-10 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="mt-6 w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>ดูหน้าจัดการคำสั่งซื้อทั้งหมด</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right: สินค้าขายดี 5 อันดับแรก (Top Selling Products) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">สินค้าขายดี (Top 5)</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">ตามยอดขายรวม</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              สินค้าที่มียอดสั่งซื้อและสร้างรายได้สูงสุดในระบบ
            </p>

            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                ยังไม่มีข้อมูลการขายสินค้า
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((prod, idx) => {
                  const maxRevenue = topProducts[0]?.totalRevenue || 1;
                  const percent = Math.round((prod.totalRevenue / maxRevenue) * 100);

                  return (
                    <div key={prod.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              idx === 0
                                ? "bg-amber-400 text-white"
                                : idx === 1
                                ? "bg-gray-300 text-gray-700"
                                : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-gray-800 truncate" title={prod.name}>
                            {prod.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-gray-500">
                            ขายได้ <strong className="text-gray-800">{prod.quantity}</strong> ชิ้น
                          </span>
                          <span className="font-bold text-[#b90000] w-16 text-right">
                            ฿{prod.totalRevenue.toLocaleString("th-TH")}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0 ? "bg-[#b90000]" : "bg-red-400"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/admin/products?tab=list"
            className="mt-6 w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>ดูรายการสินค้าทั้งหมดในระบบ</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Recent Orders Quick Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">คำสั่งซื้อล่าสุด</h3>
              <p className="text-xs text-gray-500">รายการสั่งซื้อ 5 รายการล่าสุดในระบบ</p>
            </div>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-[#b90000] hover:text-red-800 font-bold hover:underline flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                <th className="py-3 px-6">รหัสคำสั่งซื้อ</th>
                <th className="py-3 px-6">ลูกค้า</th>
                <th className="py-3 px-6">วันที่</th>
                <th className="py-3 px-6 text-center">จำนวนชิ้น</th>
                <th className="py-3 px-6 text-right">ยอดรวม</th>
                <th className="py-3 px-6 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    ยังไม่มีคำสั่งซื้อในระบบ
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  let statusBadge = {
                    label: order.status,
                    cls: "bg-gray-100 text-gray-700",
                  };
                  if (order.status === "PAID") {
                    statusBadge = { label: "ชำระเงินแล้ว", cls: "bg-green-100 text-green-800" };
                  } else if (order.status === "PENDING") {
                    statusBadge = { label: "รอชำระเงิน", cls: "bg-amber-100 text-amber-800" };
                  } else if (order.status === "SHIPPED") {
                    statusBadge = { label: "จัดส่งแล้ว", cls: "bg-blue-100 text-blue-800" };
                  } else if (order.status === "DELIVERED") {
                    statusBadge = { label: "สำเร็จแล้ว", cls: "bg-purple-100 text-purple-800" };
                  }

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-gray-600 font-medium">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-gray-900">
                        {order.customerName}
                      </td>
                      <td className="py-3.5 px-6 text-gray-500">
                        {order.createdAt}
                      </td>
                      <td className="py-3.5 px-6 text-center text-gray-600">
                        {order.itemCount}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-gray-900">
                        ฿{order.totalAmount.toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
