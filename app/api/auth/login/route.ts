import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    // 1. Check if it's an Admin
    let admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      // Case-insensitive fallback for SQLite
      const allAdmins = await prisma.admin.findMany();
      admin = allAdmins.find((a) => a.username.toLowerCase() === username.trim().toLowerCase()) || null;
    }

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        const token = jwt.sign(
          { id: admin.id, username: admin.username, name: admin.name || "Administrator", role: "ADMIN" },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Determine destination: if username is posadmin or starts with pos -> direct to store's iPad fulfillment screen
        const isPosAdmin = admin.username.toLowerCase() === "posadmin" || admin.username.toLowerCase().startsWith("pos");
        const redirectUrl = isPosAdmin ? "/store/fulfillment" : "/admin";

        const response = NextResponse.json({
          success: true,
          redirectUrl,
          user: { id: admin.id, name: admin.name || "Administrator", username: admin.username, role: "ADMIN" }
        });

        // Dedicated cookie for Admin panel so it doesn't get kicked out by customer logins
        response.cookies.set({
          name: 'admin_token',
          value: token,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        response.cookies.set({
          name: 'auth_token',
          value: token,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
      }
    }

    // 2. Check if it's a regular User
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role || "USER" },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, username: user.username, role: user.role || "USER" }
    });
    
    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
