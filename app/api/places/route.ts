import { NextResponse } from "next/server";
import { listPromotedPlaces } from "../../lib/candidateStore";
import { getSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { mockPlaces } from "../../lib/mockPlaces";

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!process.env.DATABASE_URL) {
    const visiblePlaces = [...mockPlaces, ...listPromotedPlaces()].filter(
      (place) => place.approved && place.is_public
    );
    const filteredPlaces = query
      ? visiblePlaces.filter((place) => {
          const haystack = [place.name, place.building, place.tags?.join(" ")]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : visiblePlaces;
    return NextResponse.json(filteredPlaces);
  }

  const places = await prisma.place.findMany({
    where: {
      approved: true,
      isPublic: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { building: { contains: query, mode: "insensitive" } },
              { tags: { has: query } },
            ],
          }
        : {}),
    },
    include: {
      comments: {
        include: {
          replies: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const normalized = places.map((place) => ({
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
    comment_count: place.comments.length,
    comments: place.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      created_at: comment.createdAt.toISOString(),
      photo_urls: comment.photoUrls,
      heart_count: comment.heartCount,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        text: reply.text,
        created_at: reply.createdAt.toISOString(),
      })),
    })),
    is_outdoor: place.isOutdoor,
    address: place.address ?? undefined,
    lat: place.lat ?? undefined,
    lng: place.lng ?? undefined,
    last_verified_at: place.lastVerifiedAt?.toISOString(),
    recommendation_count: place.recommendationCount,
  }));

  return NextResponse.json(normalized);
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Adding places requires login and a configured database." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to add a new place." },
      { status: 401 }
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

  const name = payload?.name;
  const building = payload?.building;
  const floor = payload?.floor;
  const outlet = parseBoolean(payload?.outlet);
  const isPublic = true;
  const isOutdoor = parseBoolean(payload?.is_outdoor) ?? false;
  const isNewBuilding = parseBoolean(payload?.is_new_building) ?? false;
  const address = payload?.address;
  const photoUrl = payload?.photo_url;
  const photoAlt = payload?.photo_alt;
  const busyLevel = payload?.busy_level;
  const hours = payload?.hours;
  const lighting = payload?.lighting;
  const temperature = payload?.temperature;
  const wifi = payload?.wifi;

  if (!isNonEmpty(name)) {
    return NextResponse.json(
      { error: "name is required." },
      { status: 400 }
    );
  }

  if (!isOutdoor && (!isNonEmpty(building) || !isNonEmpty(floor))) {
    return NextResponse.json(
      { error: "building and floor are required for indoor locations." },
      { status: 400 }
    );
  }

  if (isNewBuilding && !isOutdoor && !isNonEmpty(address)) {
    return NextResponse.json(
      { error: "address is required for new building spots." },
      { status: 400 }
    );
  }

  if (isOutdoor && (typeof payload?.lat !== "number" || typeof payload?.lng !== "number")) {
    return NextResponse.json(
      { error: "lat and lng are required for outdoor spots." },
      { status: 400 }
    );
  }

  if (!isOutdoor && !isNonEmpty(hours)) {
    return NextResponse.json(
      { error: "hours are required for indoor locations." },
      { status: 400 }
    );
  }

  if (!isOutdoor && outlet === null) {
    return NextResponse.json(
      { error: "outlet must be a boolean." },
      { status: 400 }
    );
  }

  const created = await prisma.place.create({
    data: {
      name: name.trim(),
      building: isNonEmpty(building) ? building.trim() : "Outdoor",
      floor: isNonEmpty(floor) ? floor.trim() : "N/A",
      outlet: isOutdoor ? false : outlet,
      isPublic: isPublic ?? true,
      isOutdoor,
      address: isNonEmpty(address) ? address.trim() : null,
      approved: false,
      recommendationCount: 0,
      description: isNonEmpty(payload?.description)
        ? payload?.description.trim()
        : null,
      tags: Array.isArray(payload?.tags) ? payload?.tags : [],
      lat: typeof payload?.lat === "number" ? payload?.lat : null,
      lng: typeof payload?.lng === "number" ? payload?.lng : null,
      photoUrl: isNonEmpty(photoUrl) ? photoUrl.trim() : null,
      photoAlt: isNonEmpty(photoAlt) ? photoAlt.trim() : null,
      busyLevel: isNonEmpty(busyLevel) ? busyLevel.trim() : null,
      hours: isNonEmpty(hours) ? hours.trim() : null,
      lighting: isNonEmpty(lighting) ? lighting.trim() : null,
      temperature: isNonEmpty(temperature) ? temperature.trim() : null,
      wifi: isNonEmpty(wifi) ? wifi.trim() : null,
    },
  });

  const responseBody = {
    id: created.id,
    name: created.name,
    building: created.building,
    floor: created.floor,
    outlet: created.outlet,
    is_public: created.isPublic,
    approved: created.approved,
    description: created.description ?? undefined,
    tags: created.tags,
    hours: created.hours ?? undefined,
    noise_level: created.noiseLevel ?? undefined,
    busy_level: created.busyLevel ?? undefined,
    lighting: created.lighting ?? undefined,
    temperature: created.temperature ?? undefined,
    wifi: created.wifi ?? undefined,
    seating_type: created.seatingType ?? undefined,
    capacity: created.capacity ?? undefined,
    photo_url: created.photoUrl ?? undefined,
    photo_alt: created.photoAlt ?? undefined,
    heart_count: created.heartCount,
    comment_count: 0,
    comments: [],
    is_outdoor: created.isOutdoor,
    address: created.address ?? undefined,
    lat: created.lat ?? undefined,
    lng: created.lng ?? undefined,
    recommendation_count: created.recommendationCount,
  };

  return NextResponse.json(responseBody, { status: 201 });
}
