import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  getRecommendationThreshold,
} from "../../../../lib/candidateStore";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const threshold = getRecommendationThreshold();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Recommending candidates requires login and a configured database.",
    }, { status: 503 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to recommend a candidate place." },
      { status: 401 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const candidate = await tx.place.findFirst({
        where: {
          id,
          approved: false,
        },
      });

      if (!candidate) {
        throw new Error("CANDIDATE_NOT_FOUND");
      }

      await tx.candidateRecommendation.create({
        data: {
          userId: user.id,
          placeId: id,
        },
      });

      const updated = await tx.place.update({
        where: { id },
        data: {
          recommendationCount: {
            increment: 1,
          },
        },
      });

      if (updated.recommendationCount >= threshold) {
        const promoted = await tx.place.update({
          where: { id },
          data: {
            approved: true,
          },
        });

        return {
          candidate: null,
          promoted: true,
          promotedPlace: promoted,
        };
      }

      return {
        candidate: updated,
        promoted: false,
        promotedPlace: null,
      };
    });

    if (result.promoted && result.promotedPlace) {
      const promoted = result.promotedPlace;
      return NextResponse.json({
        candidate: null,
        promoted: true,
        promoted_place: {
          id: promoted.id,
          name: promoted.name,
          building: promoted.building,
          floor: promoted.floor,
          outlet: promoted.outlet,
          is_public: promoted.isPublic,
          approved: promoted.approved,
          description: promoted.description ?? undefined,
          tags: promoted.tags,
          hours: promoted.hours ?? undefined,
          noise_level: promoted.noiseLevel ?? undefined,
          busy_level: promoted.busyLevel ?? undefined,
          lighting: promoted.lighting ?? undefined,
          temperature: promoted.temperature ?? undefined,
          wifi: promoted.wifi ?? undefined,
          seating_type: promoted.seatingType ?? undefined,
          capacity: promoted.capacity ?? undefined,
          photo_url: promoted.photoUrl ?? undefined,
          photo_alt: promoted.photoAlt ?? undefined,
          heart_count: promoted.heartCount,
          comment_count: 0,
          comments: [],
          is_outdoor: promoted.isOutdoor,
          address: promoted.address ?? undefined,
          lat: promoted.lat ?? undefined,
          lng: promoted.lng ?? undefined,
          last_verified_at: promoted.lastVerifiedAt?.toISOString(),
          recommendation_count: promoted.recommendationCount,
        },
        threshold,
      });
    }

    const updated = result.candidate!;
    return NextResponse.json({
      candidate: {
        id: updated.id,
        name: updated.name,
        building: updated.building,
        floor: updated.floor,
        outlet: updated.outlet,
        is_public: updated.isPublic,
        approved: updated.approved,
        description: updated.description ?? undefined,
        tags: updated.tags,
        hours: updated.hours ?? undefined,
        noise_level: updated.noiseLevel ?? undefined,
        busy_level: updated.busyLevel ?? undefined,
        lighting: updated.lighting ?? undefined,
        temperature: updated.temperature ?? undefined,
        wifi: updated.wifi ?? undefined,
        seating_type: updated.seatingType ?? undefined,
        capacity: updated.capacity ?? undefined,
        photo_url: updated.photoUrl ?? undefined,
        photo_alt: updated.photoAlt ?? undefined,
        heart_count: updated.heartCount,
        comment_count: 0,
        comments: [],
        is_outdoor: updated.isOutdoor,
        address: updated.address ?? undefined,
        lat: updated.lat ?? undefined,
        lng: updated.lng ?? undefined,
        last_verified_at: updated.lastVerifiedAt?.toISOString(),
        recommendation_count: updated.recommendationCount,
      },
      promoted: false,
      promoted_place: null,
      threshold,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CANDIDATE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Candidate place not found." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already recommended this candidate." },
        { status: 409 }
      );
    }

    throw error;
  }
}
