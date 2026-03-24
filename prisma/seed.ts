import { PrismaClient } from "@prisma/client";
import { mockPlaces } from "../app/lib/mockPlaces";
import { hashPassword } from "../app/lib/password";

const prisma = new PrismaClient();

const testUsers = [
  {
    email: "student1@napstation.test",
    name: "Student One",
    password: "NapStation123!",
  },
  {
    email: "student2@napstation.test",
    name: "Student Two",
    password: "NapStation123!",
  },
];

async function main() {
  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: hashPassword(user.password),
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash: hashPassword(user.password),
      },
    });
  }

  for (const place of mockPlaces) {
    const created = await prisma.place.upsert({
      where: { id: place.id },
      update: {
        name: place.name,
        building: place.building,
        floor: place.floor,
        outlet: place.outlet,
        isPublic: place.is_public,
        approved: place.approved,
        description: place.description ?? null,
        tags: place.tags ?? [],
        hours: place.hours ?? null,
        noiseLevel: place.noise_level ?? null,
        busyLevel: place.busy_level ?? null,
        lighting: place.lighting ?? null,
        temperature: place.temperature ?? null,
        wifi: place.wifi ?? null,
        seatingType: place.seating_type ?? null,
        capacity: place.capacity ?? null,
        photoUrl: place.photo_url ?? null,
        photoAlt: place.photo_alt ?? null,
        heartCount: place.heart_count ?? 0,
        isOutdoor: place.is_outdoor ?? false,
        address: place.address ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
      },
      create: {
        id: place.id,
        name: place.name,
        building: place.building,
        floor: place.floor,
        outlet: place.outlet,
        isPublic: place.is_public,
        approved: place.approved,
        description: place.description ?? null,
        tags: place.tags ?? [],
        hours: place.hours ?? null,
        noiseLevel: place.noise_level ?? null,
        busyLevel: place.busy_level ?? null,
        lighting: place.lighting ?? null,
        temperature: place.temperature ?? null,
        wifi: place.wifi ?? null,
        seatingType: place.seating_type ?? null,
        capacity: place.capacity ?? null,
        photoUrl: place.photo_url ?? null,
        photoAlt: place.photo_alt ?? null,
        heartCount: place.heart_count ?? 0,
        isOutdoor: place.is_outdoor ?? false,
        address: place.address ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
      },
    });

    await prisma.comment.deleteMany({ where: { placeId: created.id } });
    const comments = place.comments ?? [];
    if (comments.length) {
      await prisma.comment.createMany({
        data: comments.map((comment) => ({
          id: comment.id,
          placeId: created.id,
          text: comment.text,
          photoUrls: comment.photo_urls ?? [],
          heartCount: comment.heart_count ?? 0,
          createdAt: new Date(comment.created_at),
        })),
        skipDuplicates: true,
      });

      for (const comment of comments) {
        const replies = comment.replies ?? [];
        if (!replies.length) {
          continue;
        }
        await prisma.commentReply.createMany({
          data: replies.map((reply) => ({
            id: reply.id,
            commentId: comment.id,
            text: reply.text,
            createdAt: new Date(reply.created_at),
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  await prisma.placeHeart.deleteMany();
  await prisma.candidateRecommendation.deleteMany();
  await prisma.commentHeart.deleteMany();
  await prisma.session.deleteMany();

  console.log("Seeded test users:");
  for (const user of testUsers) {
    console.log(`- ${user.email} / ${user.password}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
