import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "./DashboardCharts";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [productCount, userCount, allOrders, orderItems] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.findMany({
      include: {
        items: true,
        user: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.orderItem.findMany(),
  ]);

  // Total sales: sum of orders where status is PAID, SHIPPED, or DELIVERED
  const validSalesOrders = allOrders.filter((o) =>
    ["PAID", "SHIPPED", "DELIVERED"].includes(o.status)
  );
  const totalSales = validSalesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const orderCount = allOrders.length;
  const avgOrderValue = validSalesOrders.length > 0 ? totalSales / validSalesOrders.length : 0;

  // Build daily data for the last 7 days and 30 days
  const now = new Date();

  // Last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    const dayOfWeek = d.toLocaleDateString("th-TH", { weekday: "short" });

    // Orders on this day
    const dayOrders = allOrders.filter((o) => o.createdAt.toISOString().startsWith(dateStr));
    const daySales = dayOrders
      .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    last7Days.push({
      date: dateStr,
      label,
      dayOfWeek,
      sales: daySales,
      orders: dayOrders.length,
    });
  }

  // Last 30 days
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    const dayOfWeek = d.toLocaleDateString("th-TH", { weekday: "short" });

    const dayOrders = allOrders.filter((o) => o.createdAt.toISOString().startsWith(dateStr));
    const daySales = dayOrders
      .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    last30Days.push({
      date: dateStr,
      label,
      dayOfWeek,
      sales: daySales,
      orders: dayOrders.length,
    });
  }

  // Monthly data for the current year (12 months)
  const monthlyData = [];
  const currentYear = now.getFullYear();
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(currentYear, m, 1);
    const monthShort = monthDate.toLocaleDateString("th-TH", { month: "short" });
    const fullLabel = monthDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, "0")}`;

    const monthOrders = allOrders.filter((o) => o.createdAt.toISOString().startsWith(monthPrefix));
    const monthSales = monthOrders
      .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    monthlyData.push({
      month: monthShort,
      fullLabel,
      sales: monthSales,
      orders: monthOrders.length,
    });
  }

  // Status breakdown
  const statusConfig = [
    { status: "WAITING_VERIFICATION", label: "รอตรวจสลิป QR", color: "#f59e0b", bgLight: "#fef3c7" },
    { status: "PAID", label: "ชำระเงินแล้ว", color: "#16a34a", bgLight: "#dcfce7" },
    { status: "PENDING", label: "รอชำระเงิน", color: "#eab308", bgLight: "#fef9c3" },
    { status: "SHIPPED", label: "จัดส่งแล้ว", color: "#3b82f6", bgLight: "#dbeafe" },
    { status: "DELIVERED", label: "สำเร็จแล้ว", color: "#9333ea", bgLight: "#f3e8ff" },
  ];

  const statusDistribution = statusConfig.map((sc) => {
    const ordersInStatus = allOrders.filter((o) => o.status === sc.status);
    return {
      status: sc.status,
      label: sc.label,
      count: ordersInStatus.length,
      amount: ordersInStatus.reduce((sum, o) => sum + o.totalAmount, 0),
      color: sc.color,
      bgLight: sc.bgLight,
    };
  });

  // Top selling products (Group by productId / productName)
  const productSalesMap = new Map<string, { id: string; name: string; quantity: number; totalRevenue: number }>();
  for (const item of orderItems) {
    const existing = productSalesMap.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      existing.totalRevenue += item.price * item.quantity;
    } else {
      productSalesMap.set(item.productId, {
        id: item.productId,
        name: item.productName,
        quantity: item.quantity,
        totalRevenue: item.price * item.quantity,
      });
    }
  }

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Recent 5 orders
  const recentOrders = allOrders.slice(0, 5).map((o) => ({
    id: o.id,
    customerName: o.user?.name || o.user?.username || "ลูกค้าหน้าร้าน / ทั่วไป",
    totalAmount: o.totalAmount,
    status: o.status,
    itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
    createdAt: new Date(o.createdAt).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ภาพรวมระบบ (Dashboard)</h1>
          <p className="text-xs text-gray-500 mt-1">
            รายงานสถิติยอดขาย การสั่งซื้อสินค้า และกิจกรรมล่าสุดของร้านค้า
          </p>
        </div>
      </div>

      <DashboardCharts
        last7Days={last7Days}
        last30Days={last30Days}
        monthlyData={monthlyData}
        statusDistribution={statusDistribution}
        topProducts={topProducts}
        recentOrders={recentOrders}
        summary={{
          totalSales,
          orderCount,
          productCount,
          userCount,
          avgOrderValue,
        }}
      />
    </div>
  );
}
