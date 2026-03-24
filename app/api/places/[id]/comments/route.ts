import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Comments require login and a configured database." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to write comments." },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const placeId = resolvedParams?.id;

  if (!placeId) {
    return NextResponse.json(
      { error: "place id is required." },
      { status: 400 }
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

  const text = payload?.text;
  const photoUrls = Array.isArray(payload?.photo_urls)
    ? payload?.photo_urls.filter((item) => typeof item === "string")
    : [];
  if (!isNonEmpty(text)) {
    return NextResponse.json(
      { error: "text is required." },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      placeId,
      text: text.trim(),
      photoUrls,
    },
  });

  const count = await prisma.comment.count({
    where: { placeId },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      text: comment.text,
      created_at: comment.createdAt.toISOString(),
      photo_urls: photoUrls,
      heart_count: comment.heartCount,
      replies: [],
    },
    comment_count: count,
  });
}
