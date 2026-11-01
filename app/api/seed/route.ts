import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(process.cwd(), 'scripts', 'restore-products-promotions.js');

    await new Promise((resolve, reject) => {
      exec(`node "${scriptPath}"`, (err: any, stdout: any, stderr: any) => {
        if (err) return reject(err);
        resolve(stdout);
      });
    });

    const [productCount, categoryCount, promoCount] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.promotion.count()
    ]);

    return NextResponse.json({
      success: true,
      message: "Seeded real store products and promotions successfully!",
      productsCount: productCount,
      categoriesCount: categoryCount,
      promotionsCount: promoCount
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
