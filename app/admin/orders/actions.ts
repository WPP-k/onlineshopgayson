"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(formData: FormData) {
  const orderId = (formData.get("orderId") as string)?.trim();
  const status = (formData.get("status") as string)?.trim();

  if (!orderId || !status) {
    return { error: "ข้อมูลไม่ครบถ้วน" };
  }

  const validStatuses = ["PENDING", "WAITING_VERIFICATION", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: "สถานะคำสั่งซื้อไม่ถูกต้อง" };
  }

  try {
    const updateData: any = { status };
    if (status === "PAID") {
      updateData.paymentVerifiedAt = new Date();
      updateData.paymentVerifiedBy = "Admin";
      updateData.paymentRejectReason = null;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Update order status error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ" };
  }
}

export async function verifyPayment(formData: FormData) {
  const orderId = (formData.get("orderId") as string)?.trim();
  const action = (formData.get("action") as string)?.trim(); // "APPROVE" | "REJECT"
  const rejectReason = (formData.get("rejectReason") as string)?.trim();

  if (!orderId || !action) {
    return { error: "ข้อมูลไม่ครบถ้วน" };
  }

  try {
    if (action === "APPROVE") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentVerifiedAt: new Date(),
          paymentVerifiedBy: "Admin",
          paymentRejectReason: null,
        },
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PENDING",
          paymentRejectReason: rejectReason || "ยังไม่พบยอดเงินโอนเข้าบัญชีกสิกรไทย กรุณาตรวจสอบการทำรายการในแอปธนาคารของท่าน หรือติดต่อทางร้าน",
        },
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน" };
  }
}

export async function deleteOrder(formData: FormData) {
  const orderId = (formData.get("orderId") as string)?.trim();

  if (!orderId) {
    return { error: "ไม่พบรหัสคำสั่งซื้อ" };
  }

  try {
    // Delete related items first
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    await prisma.order.delete({
      where: { id: orderId },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete order error:", error);
    return { error: error.message || "เกิดข้อผิดพลาดในการลบคำสั่งซื้อ" };
  }
}
