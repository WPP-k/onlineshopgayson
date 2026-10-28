import { prisma } from "@/lib/prisma";
import CategoryManagerClient from "./CategoryManagerClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return <CategoryManagerClient categories={categories} />;
}
