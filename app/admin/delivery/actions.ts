"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Assign a rider to an order
export async function assignRiderToOrder(orderId: string, riderId: string) {
  try {
    if (!orderId || !riderId) {
      return { error: "ข้อมูลไม่ครบถ้วน" };
    }

    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) {
      return { error: "ไม่พบข้อมูลพนักงานส่งสินค้า" };
    }

    // Update order with riderId and deliveryStatus = 'ASSIGNED'
    await prisma.order.update({
      where: { id: orderId },
      data: {
        riderId,
        deliveryStatus: "ASSIGNED",
      },
    });

    // Optionally update rider status to BUSY
    await prisma.rider.update({
      where: { id: riderId },
      data: { status: "BUSY" },
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/rider");

    return { success: true, message: `มอบหมายงานให้ ${rider.name} เรียบร้อยแล้ว` };
  } catch (error: any) {
    console.error("assignRiderToOrder error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการมอบหมายงาน" };
  }
}

// 1.1 Rider self-claims an order
export async function claimOrderByRider(orderId: string, riderId: string) {
  try {
    if (!orderId || !riderId) {
      return { error: "ข้อมูลไม่ครบถ้วน" };
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { error: "ไม่พบคำสั่งซื้อ" };
    }

    if (order.riderId && order.riderId !== riderId) {
      return { error: "ขออภัย ออเดอร์นี้มีไรเดอร์ท่านอื่นกดรับไปแล้ว" };
    }

    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) {
      return { error: "ไม่พบข้อมูลไรเดอร์" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        riderId,
        deliveryStatus: "ASSIGNED",
      },
    });

    await prisma.rider.update({
      where: { id: riderId },
      data: { status: "BUSY" },
    });

    revalidatePath("/rider");
    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/profile");

    return { 
      success: true, 
      message: `คุณได้รับงานออเดอร์ #${orderId.slice(-6).toUpperCase()} เรียบร้อยแล้ว` 
    };
  } catch (error: any) {
    console.error("claimOrderByRider error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการรับออเดอร์" };
  }
}

// 1.2 Rider releases an assigned order back to open pool
export async function releaseOrderByRider(orderId: string, riderId: string) {
  try {
    if (!orderId || !riderId) {
      return { error: "ข้อมูลไม่ครบถ้วน" };
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { error: "ไม่พบคำสั่งซื้อ" };
    }

    if (order.riderId !== riderId) {
      return { error: "คุณไม่ได้เป็นผู้รับออเดอร์นี้" };
    }

    if (order.deliveryStatus === "DELIVERED") {
      return { error: "ไม่สามารถยกเลิกออเดอร์ที่จัดส่งสำเร็จแล้วได้" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: null,
        deliveryStatus: "PENDING",
      },
    });

    // Check if rider still has active jobs
    const remainingOrders = await prisma.order.count({
      where: {
        riderId,
        deliveryStatus: { in: ["ASSIGNED", "DELIVERING"] },
      },
    });

    if (remainingOrders === 0) {
      await prisma.rider.update({
        where: { id: riderId },
        data: { status: "AVAILABLE" },
      });
    }

    revalidatePath("/rider");
    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/profile");

    return { 
      success: true, 
      message: `สละสิทธิ์ออเดอร์ #${orderId.slice(-6).toUpperCase()} คืนสู่รายการรับงานใหม่เรียบร้อยแล้ว` 
    };
  } catch (error: any) {
    console.error("releaseOrderByRider error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการคืนงาน" };
  }
}

// 1.3 Customer confirms receipt of delivery
export async function confirmOrderReceiptByCustomer(
  orderId: string,
  status: "RECEIVED" | "NOT_RECEIVED",
  feedback?: string
) {
  try {
    if (!orderId || !status) {
      return { error: "ข้อมูลไม่ครบถ้วน" };
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { error: "ไม่พบคำสั่งซื้อ" };
    }

    const updateData: any = {
      customerReceivedStatus: status,
      customerConfirmedAt: new Date(),
      customerFeedback: feedback?.trim() || null,
    };

    if (status === "RECEIVED") {
      updateData.status = "DELIVERED";
      if (!order.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath("/track");
    revalidatePath(`/track/${orderId}`);
    revalidatePath("/profile");
    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/rider");

    return {
      success: true,
      message:
        status === "RECEIVED"
          ? "ยืนยันการรับสินค้าเรียบร้อยแล้ว ขอบคุณที่ใช้บริการครับ"
          : "บันทึกรายงานยังไม่ได้รับสินค้าเรียบร้อย ทางร้านจะเร่งตรวจสอบกับไรเดอร์ให้ทันที",
    };
  } catch (error: any) {
    console.error("confirmOrderReceiptByCustomer error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

// 2. Update delivery status
export async function updateOrderDeliveryStatus(orderId: string, deliveryStatus: string) {
  try {
    const updateData: any = {
      deliveryStatus,
    };

    if (deliveryStatus === "DELIVERED") {
      updateData.deliveredAt = new Date();
      updateData.status = "DELIVERED"; // Mark order as DELIVERED as well
    } else if (deliveryStatus === "DELIVERING") {
      updateData.status = "SHIPPED"; // Mark order as SHIPPED
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // If delivered, increment rider completedJobs and check if rider has other active orders
    if (deliveryStatus === "DELIVERED" && order.riderId) {
      await prisma.rider.update({
        where: { id: order.riderId },
        data: {
          completedJobs: { increment: 1 },
        },
      });

      // Check if rider still has pending/delivering orders
      const remainingOrders = await prisma.order.count({
        where: {
          riderId: order.riderId,
          deliveryStatus: { in: ["ASSIGNED", "DELIVERING"] },
        },
      });

      if (remainingOrders === 0) {
        await prisma.rider.update({
          where: { id: order.riderId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/rider");
    revalidatePath("/profile");

    return { success: true, message: "อัปเดตสถานะการจัดส่งเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("updateOrderDeliveryStatus error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ" };
  }
}

// 3. Create a new Rider
export async function createRider(formData: FormData) {
  try {
    const name = formData.get("name")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const vehicle = formData.get("vehicle")?.toString().trim() || null;
    const status = formData.get("status")?.toString().trim() || "AVAILABLE";

    if (!name || !phone) {
      return { error: "กรุณาระบุชื่อและเบอร์โทรศัพท์ของพนักงาน" };
    }

    const existing = await prisma.rider.findUnique({ where: { phone } });
    if (existing) {
      return { error: "เบอร์โทรศัพท์นี้มีในระบบแล้ว" };
    }

    await prisma.rider.create({
      data: {
        name,
        phone,
        vehicle,
        status,
      },
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/users");
    revalidatePath("/rider");

    return { success: true, message: "เพิ่มพนักงานส่งสินค้าสำเร็จ" };
  } catch (error: any) {
    console.error("createRider error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการเพิ่มพนักงาน" };
  }
}

// 4. Update Rider status
export async function updateRiderStatus(riderId: string, status: string) {
  try {
    await prisma.rider.update({
      where: { id: riderId },
      data: { status },
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/users");
    revalidatePath("/rider");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "ไม่สามารถอัปเดตสถานะพนักงานได้" };
  }
}

// 5. Update Rider full info
export async function updateRiderInfo(formData: FormData) {
  try {
    const id = formData.get("id")?.toString().trim();
    const name = formData.get("name")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const vehicle = formData.get("vehicle")?.toString().trim() || null;
    const status = formData.get("status")?.toString().trim() || "AVAILABLE";

    if (!id || !name || !phone) {
      return { error: "กรุณาระบุชื่อและเบอร์โทรศัพท์" };
    }

    const existing = await prisma.rider.findFirst({
      where: {
        phone,
        NOT: { id },
      },
    });

    if (existing) {
      return { error: "เบอร์โทรศัพท์นี้ถูกใช้งานโดยพนักงานคนอื่นแล้ว" };
    }

    await prisma.rider.update({
      where: { id },
      data: {
        name,
        phone,
        vehicle,
        status,
      },
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/users");
    revalidatePath("/rider");

    return { success: true, message: "อัปเดตข้อมูลพนักงานส่งสำเร็จ" };
  } catch (error: any) {
    console.error("updateRiderInfo error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการอัปเดต" };
  }
}

// 6. Delete a Rider
export async function deleteRider(riderId: string) {
  try {
    // Check if rider has active orders
    const activeOrders = await prisma.order.count({
      where: {
        riderId,
        deliveryStatus: { in: ["ASSIGNED", "DELIVERING"] },
      },
    });

    if (activeOrders > 0) {
      return { error: "ไม่สามารถลบพนักงานได้เนื่องจากมีงานที่กำลังจัดส่งอยู่" };
    }

    await prisma.rider.delete({
      where: { id: riderId },
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/users");
    revalidatePath("/rider");

    return { success: true, message: "ลบพนักงานส่งสินค้าเรียบร้อยแล้ว" };
  } catch (error: any) {
    return { error: error.message || "เกิดข้อผิดพลาดในการลบพนักงาน" };
  }
}

// 7. Update order coordinates & distance
export async function updateOrderCoordinates(orderId: string, latitude: number, longitude: number, distanceKm?: number) {
  try {
    if (!orderId || typeof latitude !== "number" || typeof longitude !== "number") {
      return { error: "ข้อมูลพิกัดไม่ถูกต้อง" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        latitude,
        longitude,
        ...(typeof distanceKm === "number" ? { distanceKm } : {}),
      },
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/track");

    return { success: true, message: "บันทึกพิกัดตำแหน่งลูกค้าเรียบร้อยแล้ว" };
  } catch (error: any) {
    console.error("updateOrderCoordinates error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการบันทึกพิกัด" };
  }
}
