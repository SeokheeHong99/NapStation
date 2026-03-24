import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Comment hearts require login and a configured database." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to heart a comment." },
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

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { id: true },
      });

      if (!comment) {
        throw new Error("COMMENT_NOT_FOUND");
      }

      await tx.commentHeart.create({
        data: {
          userId: user.id,
          commentId,
        },
      });

      return tx.comment.update({
        where: { id: commentId },
        data: { heartCount: { increment: 1 } },
      });
    });

    return NextResponse.json({ heart_count: updated.heartCount });
  } catch (error) {
    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already hearted this comment." },
        { status: 409 }
      );
    }

    throw error;
  }
}
