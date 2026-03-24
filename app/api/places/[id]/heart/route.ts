import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Login required and database must be configured." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to heart a place." },
      { status: 401 }
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const place = await tx.place.findFirst({
        where: {
          id,
          approved: true,
        },
        select: {
          id: true,
        },
      });

      if (!place) {
        throw new Error("PLACE_NOT_FOUND");
      }

      await tx.placeHeart.create({
        data: {
          userId: user.id,
          placeId: id,
        },
      });

      return tx.place.update({
        where: { id },
        data: { heartCount: { increment: 1 } },
      });
    });

    return NextResponse.json({ heart_count: updated.heartCount });
  } catch (error) {
    if (error instanceof Error && error.message === "PLACE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Official place not found." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already hearted this place." },
        { status: 409 }
      );
    }

    throw error;
  }
}
