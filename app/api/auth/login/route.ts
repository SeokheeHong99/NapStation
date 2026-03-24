import { NextResponse } from "next/server";
import { createSession } from "../../../lib/auth";
import { verifyPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Authentication requires a configured database." },
      { status: 503 }
    );
  }

  let payload: Record<string, unknown> | null = null;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const email = isNonEmpty(payload?.email)
    ? payload.email.trim().toLowerCase()
    : "";
  const password = isNonEmpty(payload?.password) ? payload.password.trim() : "";

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      placeHearts: {
        select: {
          placeId: true,
        },
      },
      commentHearts: {
        select: {
          commentId: true,
        },
      },
      recommendations: {
        select: {
          placeId: true,
        },
      },
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    heartedPlaceIds: user.placeHearts.map((item) => item.placeId),
    heartedCommentIds: user.commentHearts.map((item) => item.commentId),
    recommendedCandidateIds: user.recommendations.map((item) => item.placeId),
  });
}
