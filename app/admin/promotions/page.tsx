import { prisma } from "@/lib/prisma";
import PromotionsManagerClient from "./PromotionsManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const [promotions, products] = await Promise.all([
    prisma.promotion.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            unit: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        stock: true,
        unit: true,
        sku: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PromotionsManagerClient
      initialPromotions={JSON.parse(JSON.stringify(promotions))}
      allProducts={JSON.parse(JSON.stringify(products))}
    />
  );
}
