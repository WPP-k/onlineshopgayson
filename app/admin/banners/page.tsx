import { prisma } from "@/lib/prisma";
import BannerManagerClient from "./BannerManagerClient";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { order: "asc" },
  });

  return <BannerManagerClient banners={banners} />;
}
