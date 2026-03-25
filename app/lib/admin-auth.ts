import { createHash } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "napstation_admin";
const ADMIN_TTL = 60 * 60 * 8; // 8 hours

// ADMIN_TOKEN and HAS_PASSWORD are baked in at build time via admin.config.ts
// On Amplify, admin.config.ts is generated during preBuild with the real hash.
// For local dev, it reads from ADMIN_PASSWORD env var at runtime.
let _token: string | null = null;
let _hasPassword: boolean | null = null;

async function getConfig() {
  if (_token === null) {
    const mod = await import("./admin.config");
    _token = mod.ADMIN_TOKEN;
    _hasPassword = mod.HAS_PASSWORD;
  }
  return { token: _token!, hasPassword: _hasPassword! };
}

export async function getAdminSession(): Promise<boolean> {
  const { token, hasPassword } = await getConfig();
  if (!hasPassword || !token) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === token;
}

export async function createAdminSession(): Promise<void> {
  const { token } = await getConfig();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
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

export async function checkPassword(submitted: string): Promise<boolean> {
  const { hasPassword } = await getConfig();
  if (!hasPassword) return false;
  const password = process.env.ADMIN_PASSWORD ?? "";
  // Try runtime env var first (local dev), then fall back to build-time hash comparison
  if (password) {
    return submitted === password;
  }
  // On Amplify: compare hash of submitted against baked-in token
  const hash = createHash("sha256").update(submitted + "napstation-admin-v1").digest("hex");
  const { token } = await getConfig();
  return hash === token;
}
