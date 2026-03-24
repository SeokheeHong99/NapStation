# NapStation

UBC nap space map prototype built with Next.js App Router.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Mock data

The UI loads mock places from `app/api/places/route.ts` using the public
filter (`approved=true` and `is_public=true`).

## Google Maps

Create `.env.local` with:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

## Database (Neon + Prisma)

1) Create a Neon project and copy the pooled connection string.
2) Add to `.env.local`:

```bash
DATABASE_URL=your_neon_connection_string
```

3) Initialize the schema:

```bash
npm run db:push
```

4) Seed mock data:

```bash
npm run db:seed
```

## Comment image uploads (Supabase Storage)

1) Create a Supabase project and a public bucket named `comment-images`.
2) Add to `.env.local`:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
