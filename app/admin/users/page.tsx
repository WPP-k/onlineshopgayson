import { prisma } from "@/lib/prisma";
import { UserManagerClient } from "./UserManagerClient";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [rawUsers, rawRiders, rawAdmins] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    }),
    prisma.rider.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    }),
    prisma.admin.findMany({
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const users = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    plainPassword: u.plainPassword,
    phone: u.phone,
    address: u.address,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    ordersCount: u._count.orders
  }));

  const riders = rawRiders.map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    plainPassword: r.plainPassword,
    phone: r.phone,
    vehicle: r.vehicle,
    vehicleType: r.vehicleType,
    plateNumber: r.plateNumber,
    status: r.status,
    rating: r.rating,
    completedJobs: r.completedJobs,
    createdAt: r.createdAt.toISOString(),
    ordersCount: r._count.orders
  }));

  const admins = rawAdmins.map((a) => ({
    id: a.id,
    name: a.name,
    username: a.username,
    plainPassword: a.plainPassword,
    role: a.role,
    createdAt: a.createdAt.toISOString()
  }));

  return <UserManagerClient users={users} riders={riders} admins={admins} />;
}
