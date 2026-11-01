import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

export const dynamic = 'force-dynamic';

async function getAuthUserId(request: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth_token')?.value;

    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      const tokenMatch = cookieHeader?.match(/auth_token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : undefined;
    }

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string; role?: string };
    return decoded.id || decoded.userId || null;
  } catch {
    return null;
  }
}

// GET /api/chat/messages?guestId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    const authUserId = await getAuthUserId(request);
    const queryUserId = searchParams.get('userId');
    const targetUserId = authUserId || queryUserId;

    if (!targetUserId && !guestId) {
      return NextResponse.json({ messages: [] });
    }

    let whereClause: any = {};
    if (targetUserId && guestId) {
      whereClause = {
        OR: [
          { userId: targetUserId },
          { guestId: guestId }
        ]
      };
    } else if (targetUserId) {
      whereClause = { userId: targetUserId };
    } else if (guestId) {
      whereClause = { guestId };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    // Mark store messages as read by the customer
    if (messages.length > 0) {
      await prisma.chatMessage.updateMany({
        where: {
          ...whereClause,
          sender: 'STORE',
          isRead: false
        },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/chat/messages
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, guestId, guestName, guestPhone, userId: reqUserId } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const authUserId = await getAuthUserId(request);
    const finalUserId = authUserId || reqUserId || null;

    if (!finalUserId && !guestId) {
      return NextResponse.json({ error: 'Missing userId or guestId' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId: finalUserId,
        guestId: guestId || null,
        guestName: guestName?.trim() || null,
        guestPhone: guestPhone?.trim() || null,
        sender: 'CUSTOMER',
        text: text.trim(),
        isRead: false
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending customer message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
