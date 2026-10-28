import { prisma } from "./prisma";

// Haversine formula to calculate the great-circle distance between two points on Earth in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 3.4 km)
}

export const DEFAULT_SUBDISTRICTS = [
  "ทุ่งกว๋าว",
  "เมืองปาน",
  "บ้านขอ",
  "หัวเมือง",
  "แจ้ซ้อน",
  "บ้านค่า",
  "บ้านสา",
  "บ้านเป้า",
  "บ้านเอื้อม",
];

export async function getDeliverySetting() {
  try {
    let setting = await prisma.deliverySetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.deliverySetting.create({
        data: {
          id: "default",
          enabled: true,
          maxDistanceKm: 10.0,
          storeLat: 18.564567,
          storeLng: 99.458904,
          storeAddress: "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240",
          storePhone: "089-851-0807",
          allowedSubdistricts: DEFAULT_SUBDISTRICTS.join(","),
          minOrderAmount: 50.0,
          deliveryFee: 10.0,
        },
      });
    }

    return setting;
  } catch (error) {
    console.error("Error fetching deliverySetting:", error);
    // Return fallback defaults if db query fails
    return {
      id: "default",
      enabled: true,
      maxDistanceKm: 10.0,
      storeLat: 18.564567,
      storeLng: 99.458904,
      storeAddress: "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240",
      storePhone: "089-851-0807",
      allowedSubdistricts: DEFAULT_SUBDISTRICTS.join(","),
      minOrderAmount: 50.0,
      deliveryFee: 10.0,
      updatedAt: new Date(),
    };
  }
}
