import { NextResponse } from "next/server";
import { getSessionUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Reporting requires login and a configured database." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login required to report places." },
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

  const message = payload?.message;
  if (!isNonEmpty(message)) {
    return NextResponse.json(
      { error: "message is required." },
      { status: 400 }
    );
  }

  const photoUrls = Array.isArray(payload?.photo_urls)
    ? payload?.photo_urls.filter((item) => typeof item === "string")
    : [];

  const report = {
    id: `report-${Date.now()}`,
    place_id: isNonEmpty(payload?.place_id)
      ? payload?.place_id.trim()
      : null,
    message: message.trim(),
    contact_email: isNonEmpty(payload?.contact_email)
      ? payload?.contact_email.trim()
      : undefined,
    photo_urls: photoUrls,
    status: "open",
    created_at: new Date().toISOString(),
  };

  let placeId: string | null = null;
  if (isNonEmpty(payload?.place_id)) {
    const candidateId = payload?.place_id.trim();
    const place = await prisma.place.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    placeId = place?.id ?? null;
  }

  const created = await prisma.report.create({
    data: {
      placeId,
      message: message.trim(),
      contactEmail: isNonEmpty(payload?.contact_email)
        ? payload?.contact_email.trim()
        : null,
      photoUrls,
      status: "open",
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      place_id: created.placeId ?? null,
      message: created.message,
      contact_email: created.contactEmail ?? undefined,
      photo_urls: created.photoUrls,
      status: created.status,
      created_at: created.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
