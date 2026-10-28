import { getStoreFulfillmentOrders } from "./actions";
import { FulfillmentClient } from "./FulfillmentClient";

export const metadata = {
  title: "จอหน้าร้าน / iPad FULFILLMENT - ออเดอร์และบาร์โค้ด",
  description: "หน้าจอสำหรับ iPad / มือถือประจำหน้าร้าน แสดงบาร์โค้ดสินค้าในออเดอร์ออนไลน์เพื่อตัดสต็อกและจัดเตรียมสินค้า",
};

export default async function StoreFulfillmentPage() {
  const initialOrders = await getStoreFulfillmentOrders();

  return <FulfillmentClient initialOrders={initialOrders} />;
}
