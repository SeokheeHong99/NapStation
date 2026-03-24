import { NextResponse } from "next/server";
import { listCandidatePlaces } from "../../lib/candidateStore";
import { prisma } from "../../lib/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(listCandidatePlaces());
  }

  const candidates = await prisma.place.findMany({
    where: {
      approved: false,
    },
    orderBy: [
      { recommendationCount: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(
    candidates.map((place) => ({
      id: place.id,
      name: place.name,
      building: place.building,
      floor: place.floor,
      outlet: place.outlet,
      is_public: place.isPublic,
      approved: place.approved,
      description: place.description ?? undefined,
      tags: place.tags,
      hours: place.hours ?? undefined,
      noise_level: place.noiseLevel ?? undefined,
      busy_level: place.busyLevel ?? undefined,
      lighting: place.lighting ?? undefined,
      temperature: place.temperature ?? undefined,
      wifi: place.wifi ?? undefined,
      seating_type: place.seatingType ?? undefined,
      capacity: place.capacity ?? undefined,
      photo_url: place.photoUrl ?? undefined,
      photo_alt: place.photoAlt ?? undefined,
      heart_count: place.heartCount,
      comment_count: 0,
      comments: [],
      is_outdoor: place.isOutdoor,
      address: place.address ?? undefined,
      lat: place.lat ?? undefined,
      lng: place.lng ?? undefined,
      last_verified_at: place.lastVerifiedAt?.toISOString(),
      recommendation_count: place.recommendationCount,
    }))
  );
}
