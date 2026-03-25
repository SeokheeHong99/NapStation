import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/admin-auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const hearts = await prisma.placeHeart.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        place: { select: { name: true } },
      },
    });
    return NextResponse.json(hearts);
  } catch (e) {
    console.error("Admin hearts GET error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
