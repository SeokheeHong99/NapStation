import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({
      user: null,
      heartedPlaceIds: [],
      heartedCommentIds: [],
      recommendedCandidateIds: [],
    });
  }

  const [hearts, commentHearts, recommendations] = await Promise.all([
    prisma.placeHeart.findMany({
      where: { userId: user.id },
      select: { placeId: true },
    }),
    prisma.commentHeart.findMany({
      where: { userId: user.id },
      select: { commentId: true },
    }),
    prisma.candidateRecommendation.findMany({
      where: { userId: user.id },
      select: { placeId: true },
    }),
  ]);

  return NextResponse.json({
    user,
    heartedPlaceIds: hearts.map((item) => item.placeId),
    heartedCommentIds: commentHearts.map((item) => item.commentId),
    recommendedCandidateIds: recommendations.map((item) => item.placeId),
  });
}
