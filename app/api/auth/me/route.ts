import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth_token')?.value;

    if (!token) {
      // Fallback manual parsing from header
      const cookieHeader = request.headers.get('cookie');
      const tokenMatch = cookieHeader?.match(/auth_token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : undefined;
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string; role?: string; username?: string; name?: string };
      const userId = decoded.id || decoded.userId;

      let fullUser: any = decoded;
      if (userId) {
        if (decoded.role === 'ADMIN') {
          let admin: any = null;
          try {
            admin = await prisma.admin.findUnique({
              where: { id: userId },
              select: { id: true, username: true, name: true, phone: true, address: true, role: true }
            });
          } catch {
            // In case old prisma client schema in memory
            try {
              const raw = (await prisma.$queryRawUnsafe(
                `SELECT id, username, name, phone, address, role FROM Admin WHERE id = ? LIMIT 1`,
                userId
              )) as any[];
              if (raw && raw[0]) admin = raw[0];
            } catch {}
          }
          if (admin) fullUser = admin;
        } else {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, name: true, phone: true, address: true, role: true }
          });
          if (user) fullUser = user;
        }
      }

      return NextResponse.json({ authenticated: true, user: fullUser });
    } catch (e) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
