import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  const place = await prisma.place.update({
    where: { id },
    data: {
      ...(body.approved !== undefined && { approved: body.approved }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    },
  });

  return NextResponse.json(place);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.place.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
