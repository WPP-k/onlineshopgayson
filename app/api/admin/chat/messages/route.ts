import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/chat/messages?chatId=user_xxx or ?userId=xxx or ?guestId=yyy
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    let userId = searchParams.get('userId');
    let guestId = searchParams.get('guestId');

    if (chatId) {
      if (chatId.startsWith('user_')) {
        userId = chatId.replace('user_', '');
      } else if (chatId.startsWith('guest_')) {
        guestId = chatId.replace('guest_', '');
      }
    }

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'Missing userId or guestId' }, { status: 400 });
    }

    const whereClause: any = userId ? { userId } : { guestId };

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            username: true,
            address: true,
            orders: {
              select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true
              },
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark all customer messages in this conversation as read
    await prisma.chatMessage.updateMany({
      where: {
        ...whereClause,
        sender: 'CUSTOMER',
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching admin messages for chat:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/admin/chat/messages - Store Admin replies to customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, userId, guestId, chatId } = body;

    let targetUserId = userId;
    let targetGuestId = guestId;

    if (chatId) {
      if (chatId.startsWith('user_')) {
        targetUserId = chatId.replace('user_', '');
      } else if (chatId.startsWith('guest_')) {
        targetGuestId = chatId.replace('guest_', '');
      }
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (!targetUserId && !targetGuestId) {
      return NextResponse.json({ error: 'Missing userId or guestId for reply' }, { status: 400 });
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        userId: targetUserId || null,
        guestId: targetGuestId || null,
        sender: 'STORE',
        text: text.trim(),
        isRead: false
      }
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending admin reply:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
