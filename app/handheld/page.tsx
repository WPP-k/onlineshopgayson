import { getCategoriesList, getTotesList } from "./actions";
import { HandheldClient } from "./HandheldClient";

export const metadata = {
  title: "Handheld Terminal - ระบบจัดการคลัง & ตรวจรับ Tote",
  description: "หน้าจอเครื่อง Handheld ตรวจรับสินค้าใน Tote ตามใบส่งของ และสแกนบาร์โค้ดจัดการสต็อก",
};

export default async function HandheldPage() {
  const [categories, totes] = await Promise.all([
    getCategoriesList(),
    getTotesList(),
  ]);

  return <HandheldClient categories={categories} initialTotes={totes} />;
}
