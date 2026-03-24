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
      { error: "Replies require login and a configured database." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to write replies." },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const commentId = resolvedParams?.id;

  if (!commentId) {
    return NextResponse.json(
      { error: "comment id is required." },
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
  if (!isNonEmpty(text)) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }

  const reply = await prisma.commentReply.create({
    data: {
      commentId,
      text: text.trim(),
    },
  });

  return NextResponse.json({
    reply: {
      id: reply.id,
      text: reply.text,
      created_at: reply.createdAt.toISOString(),
    },
  });
}
