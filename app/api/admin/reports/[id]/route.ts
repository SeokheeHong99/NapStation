import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { status } = await request.json();

  const report = await prisma.report.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(report);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
