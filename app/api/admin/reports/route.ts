import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/admin-auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const reports = await prisma.report.findMany({
    include: { place: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}
