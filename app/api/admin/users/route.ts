import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/admin-auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { sessions: true, placeHearts: true } },
    },
  });

  return NextResponse.json(users);
}
