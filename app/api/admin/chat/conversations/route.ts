import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all messages with user relation, ordered by createdAt asc
    const allMessages = await prisma.chatMessage.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            username: true,
            address: true,
            _count: {
              select: { orders: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by unique conversation key
    const conversationsMap = new Map<string, {
      chatId: string;
      userId: string | null;
      guestId: string | null;
      customerName: string;
      customerPhone: string;
      isRegisteredUser: boolean;
      ordersCount: number;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
      totalMessages: number;
    }>();

    for (const msg of allMessages) {
      const key = msg.userId ? `user_${msg.userId}` : `guest_${msg.guestId || 'unknown'}`;
      
      const isRegistered = Boolean(msg.userId && msg.user);
      const name = isRegistered 
        ? (msg.user?.name || msg.user?.username || 'สมาชิก')
        : (msg.guestName || 'ลูกค้าทั่วไป');
      const phone = isRegistered 
        ? (msg.user?.phone || '-') 
        : (msg.guestPhone || '-');
      const ordersCount = msg.user?._count?.orders || 0;

      const existing = conversationsMap.get(key);
      const isUnreadCustomerMsg = msg.sender === 'CUSTOMER' && !msg.isRead;

      if (!existing) {
        conversationsMap.set(key, {
          chatId: key,
          userId: msg.userId,
          guestId: msg.guestId,
          customerName: name,
          customerPhone: phone,
          isRegisteredUser: isRegistered,
          ordersCount,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt.toISOString(),
          unreadCount: isUnreadCustomerMsg ? 1 : 0,
          totalMessages: 1,
        });
      } else {
        existing.lastMessage = msg.text;
        existing.lastMessageAt = msg.createdAt.toISOString();
        existing.totalMessages += 1;
        if (isUnreadCustomerMsg) {
          existing.unreadCount += 1;
        }
        if (!existing.isRegisteredUser && isRegistered) {
          existing.isRegisteredUser = true;
          existing.customerName = name;
          existing.customerPhone = phone;
          existing.ordersCount = ordersCount;
        }
        if (msg.guestName && !existing.isRegisteredUser) {
          existing.customerName = msg.guestName;
        }
        if (msg.guestPhone && !existing.isRegisteredUser) {
          existing.customerPhone = msg.guestPhone;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
