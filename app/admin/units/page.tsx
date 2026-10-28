import { prisma } from "@/lib/prisma";
import UnitManagerClient from "./UnitManagerClient";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const units = await prisma.unit.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <UnitManagerClient units={units} />;
}
