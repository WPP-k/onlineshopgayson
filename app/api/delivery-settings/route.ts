import { NextResponse } from "next/server";
import { getDeliverySetting } from "@/lib/delivery";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await getDeliverySetting();
    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load delivery settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      enabled,
      maxDistanceKm,
      storeLat,
      storeLng,
      storeAddress,
      storePhone,
      allowedSubdistricts,
      minOrderAmount,
      deliveryFee,
    } = body;

    const updated = await prisma.deliverySetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        enabled: enabled ?? true,
        maxDistanceKm: typeof maxDistanceKm === "number" ? maxDistanceKm : 10.0,
        storeLat: typeof storeLat === "number" ? storeLat : 18.564567,
        storeLng: typeof storeLng === "number" ? storeLng : 99.458904,
        storeAddress: storeAddress || "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240",
        storePhone: storePhone || "089-851-0807",
        allowedSubdistricts: Array.isArray(allowedSubdistricts)
          ? allowedSubdistricts.join(",")
          : (allowedSubdistricts || ""),
        minOrderAmount: typeof minOrderAmount === "number" ? minOrderAmount : 0.0,
        deliveryFee: typeof deliveryFee === "number" ? deliveryFee : 0.0,
      },
      update: {
        enabled: enabled ?? true,
        maxDistanceKm: typeof maxDistanceKm === "number" ? maxDistanceKm : 10.0,
        storeLat: typeof storeLat === "number" ? storeLat : 18.564567,
        storeLng: typeof storeLng === "number" ? storeLng : 99.458904,
        storeAddress: storeAddress || "33 หมู่ 11 บ้านป่าเวียง ต.ทุ่งกว๋าว อ.เมืองปาน ลำปาง 52240",
        storePhone: storePhone || "089-851-0807",
        allowedSubdistricts: Array.isArray(allowedSubdistricts)
          ? allowedSubdistricts.join(",")
          : (allowedSubdistricts || ""),
        minOrderAmount: typeof minOrderAmount === "number" ? minOrderAmount : 0.0,
        deliveryFee: typeof deliveryFee === "number" ? deliveryFee : 0.0,
      },
    });

    revalidatePath("/checkout");
    revalidatePath("/admin/delivery");

    return NextResponse.json({ success: true, setting: updated });
  } catch (error: any) {
    console.error("Save delivery settings error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update delivery settings" },
      { status: 500 }
    );
  }
}
