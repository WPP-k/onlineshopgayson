import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId')?.trim();
    const phone = searchParams.get('phone')?.trim();
    const query = searchParams.get('query')?.trim() || orderId || phone;

    if (!query) {
      return NextResponse.json(
        { error: "กรุณาระบุหมายเลขคำสั่งซื้อหรือเบอร์โทรศัพท์" },
        { status: 400 }
      );
    }

    const cleanQuery = query.replace(/\s+/g, '');

    // 0. If query is 'latest', find the most recent order
    if (cleanQuery.toLowerCase() === 'latest') {
      const latestOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          rider: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicle: true,
              rating: true,
              completedJobs: true,
              image: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      if (latestOrder) {
        return NextResponse.json({ success: true, order: latestOrder, multiple: false });
      }
    }

    // 1. Try finding by exact ID
    let order = await prisma.order.findUnique({
      where: { id: cleanQuery },
      include: {
        items: true,
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicle: true,
            rating: true,
            completedJobs: true,
            image: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (order) {
      return NextResponse.json({ success: true, order, multiple: false });
    }

    // 2. Search by contains ID or customerPhone or phone without leading 0
    const altPhone = cleanQuery.startsWith('0') ? cleanQuery.slice(1) : '0' + cleanQuery;

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { id: { contains: cleanQuery } },
          { customerPhone: { contains: cleanQuery } },
          { customerPhone: { contains: altPhone } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: true,
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicle: true,
            rating: true,
            completedJobs: true,
            image: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        {
          error: "ไม่พบข้อมูลคำสั่งซื้อ กรุณาตรวจสอบหมายเลขคำสั่งซื้อหรือเบอร์โทรศัพท์อีกครั้ง",
          found: false,
        },
        { status: 404 }
      );
    }

    if (orders.length === 1) {
      return NextResponse.json({ success: true, order: orders[0], multiple: false });
    }

    return NextResponse.json({ success: true, orders, multiple: true });
  } catch (error: any) {
    console.error("Track order error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการค้นหาข้อมูลคำสั่งซื้อ" },
      { status: 500 }
    );
  }
}
