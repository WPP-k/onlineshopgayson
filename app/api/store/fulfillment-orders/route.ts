import { NextResponse } from "next/server";
import { getStoreFulfillmentOrders } from "@/app/store/fulfillment/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await getStoreFulfillmentOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
