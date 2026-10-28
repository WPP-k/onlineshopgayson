import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getDeliverySetting, calculateDistanceKm } from '@/lib/delivery';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

export async function POST(request: Request) {
  try {
    const { 
      items, 
      deliveryType = "DELIVERY", 
      customerName, 
      customerPhone, 
      shippingAddress, 
      latitude,
      longitude,
      subdistrict,
      distanceKm,
      paymentMethod = "CASH", 
      pickupTime, 
      notes,
      slipImage,
      discountAmount = 0
    } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Check authentication: users must be logged in to purchase products
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const authToken = cookieStore.get('auth_token')?.value;
      const adminToken = cookieStore.get('admin_token')?.value;
      for (const t of [authToken, adminToken]) {
        if (!t) continue;
        try {
          const decoded = jwt.verify(t, JWT_SECRET) as { id?: string; userId?: string };
          if (decoded.id || decoded.userId) {
            userId = decoded.id || decoded.userId || null;
            break;
          }
        } catch {}
      }
    } catch (e) {
      // Token parsing failed
    }

    if (!userId) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อสินค้า" }, { status: 401 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const parsedDiscount = typeof discountAmount === "number" ? Math.max(0, discountAmount) : 0;

    // Check delivery restrictions & calculate delivery fee
    let finalDistanceKm: number | null = typeof distanceKm === "number" ? distanceKm : null;
    let finalDeliveryFee = 0;
    let deliverySetting: any = null;

    if (deliveryType === "DELIVERY") {
      deliverySetting = await getDeliverySetting();
      if (deliverySetting?.enabled) {
        // 1. Check GPS distance if coordinates are present
        if (typeof latitude === "number" && typeof longitude === "number") {
          const calculatedDistance = calculateDistanceKm(
            deliverySetting.storeLat,
            deliverySetting.storeLng,
            latitude,
            longitude
          );
          finalDistanceKm = calculatedDistance;

          if (calculatedDistance > deliverySetting.maxDistanceKm) {
            return NextResponse.json(
              {
                error: `ขออภัย พิกัดจัดส่งของคุณอยู่ห่างจากร้าน ${calculatedDistance} กม. ซึ่งเกินระยะทางที่ร้านกำหนดไว้ (${deliverySetting.maxDistanceKm} กม.) กรุณาเลือก "รับสินค้าที่หน้าร้าน" แทนครับ`,
              },
              { status: 400 }
            );
          }
        }

        // 2. Check subdistrict if provided
        if (subdistrict) {
          const allowedList = deliverySetting.allowedSubdistricts
            .split(",")
            .map((s: string) => s.trim().replace(/^ต\./, ""));
          const cleanSub = subdistrict.trim().replace(/^ต\./, "");
          if (cleanSub && cleanSub !== "อื่นๆ" && !allowedList.includes(cleanSub)) {
            return NextResponse.json(
              {
                error: `ขออภัย ตำบล ${subdistrict} อยู่นอกพื้นที่จัดส่ง กรุณาเลือก "รับสินค้าที่หน้าร้าน" แทนครับ`,
              },
              { status: 400 }
            );
          }
        }

        // 3. Minimum order & delivery fee:
        // ซื้อครบราคาขั้นต่ำที่ระบุไว้ -> ส่งฟรี (0 บาท)
        // ซื้อไม่ถึงราคาขั้นต่ำที่ระบุไว้ -> คิดค่าส่ง 10 บาท (หรือตามที่ระบุใน deliveryFee)
        if (deliverySetting.minOrderAmount > 0 && subtotal < deliverySetting.minOrderAmount) {
          finalDeliveryFee =
            typeof deliverySetting.deliveryFee === "number" && deliverySetting.deliveryFee > 0
              ? deliverySetting.deliveryFee
              : 10;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - parsedDiscount) + finalDeliveryFee;

    // Check if user actually exists in User table (since admin accounts live in Admin table)
    let validUserId: string | null = null;
    if (userId) {
      try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (currentUser) {
          validUserId = currentUser.id;
          const updateData: any = {};
          if (!currentUser.phone && customerPhone) updateData.phone = customerPhone;
          if (!currentUser.address && shippingAddress) updateData.address = shippingAddress;
          if (!currentUser.name && customerName) updateData.name = customerName;
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: updateData,
            });
          }
        }
      } catch (err) {
        console.warn("Could not auto-update user profile:", err);
      }
    }

    // Determine initial status based on payment method
    // If QR Code PromptPay or Transfer -> WAITING_VERIFICATION (Admin verifies transfer directly without customer slip)
    // If COD or CASH_STORE -> PENDING (awaiting payment on delivery or in store)
    let orderStatus = "PENDING";
    if (paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") {
      orderStatus = "WAITING_VERIFICATION";
    } else if (paymentMethod === "COD" || paymentMethod === "CASH_STORE") {
      orderStatus = "PENDING";
    }

    let orderNotes = notes && typeof notes === "string" ? notes.trim() : "";
    if (finalDeliveryFee > 0) {
      const feeNote = `[ค่าจัดส่ง ฿${finalDeliveryFee} เนื่องจากยอดซื้อไม่ถึงขั้นต่ำ ฿${deliverySetting?.minOrderAmount || 50}]`;
      orderNotes = orderNotes ? `${orderNotes} ${feeNote}` : feeNote;
    }

    // Create the order and decrement product stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user: validUserId ? { connect: { id: validUserId } } : undefined,
          totalAmount,
          discountAmount: parsedDiscount,
          status: orderStatus,
          deliveryType: deliveryType || "DELIVERY",
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          shippingAddress: shippingAddress || null,
          latitude: typeof latitude === "number" ? latitude : null,
          longitude: typeof longitude === "number" ? longitude : null,
          distanceKm: finalDistanceKm,
          subdistrict: subdistrict || null,
          paymentMethod: paymentMethod || "CASH",
          pickupTime: pickupTime || null,
          notes: orderNotes || null,
          slipImage: slipImage || null,
          slipUploadedAt: slipImage ? new Date() : null,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              productName: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // Decrement stock for each item
      for (const item of items) {
        if (item.id) {
          await tx.product.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          }).catch((err) => {
            console.warn(`Stock decrement failed for item ${item.id}:`, err);
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: { id: true, name: true, username: true, phone: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Fetch order error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { orderId, slipImage } = await request.json();

    if (!orderId || !slipImage) {
      return NextResponse.json({ error: "Missing orderId or slipImage" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        slipImage,
        slipUploadedAt: new Date(),
        status: "WAITING_VERIFICATION",
        paymentRejectReason: null,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Upload slip error:", error);
    return NextResponse.json({ error: "Failed to update slip" }, { status: 500 });
  }
}
