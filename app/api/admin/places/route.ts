import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/admin-auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { hearts: true, comments: true } },
    },
  });

  return NextResponse.json(places);
}
