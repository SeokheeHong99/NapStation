import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.placeHeart.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
