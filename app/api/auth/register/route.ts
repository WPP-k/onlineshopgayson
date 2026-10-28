import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-mvp';

export async function POST(request: Request) {
  try {
    const { name, username, password, address, phone } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if username already exists in Admin or User
    const [existingAdmin, existingUser] = await Promise.all([
      prisma.admin.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingAdmin || existingUser) {
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in User table with plainPassword saved for admin reference
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        plainPassword: password,
        address,
        phone,
        role: 'USER',
      },
    });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, username: user.username, role: 'USER' }
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
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
