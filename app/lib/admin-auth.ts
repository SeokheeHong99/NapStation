import { createHash } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "napstation_admin";
const ADMIN_TTL = 60 * 60 * 8; // 8 hours

function makeToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(password + "napstation-admin-v1").digest("hex");
}

export async function getAdminSession(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === makeToken();
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_TTL,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<Response | null> {
  const ok = await getAdminSession();
  if (!ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
