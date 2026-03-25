// This file is auto-generated during build by the Amplify build spec.
// For local development, it falls back to ADMIN_PASSWORD env var.
import { createHash } from "crypto";

function computeToken(password: string) {
  return createHash("sha256").update(password + "napstation-admin-v1").digest("hex");
}

const password = process.env.ADMIN_PASSWORD ?? "";

export const ADMIN_TOKEN = password ? computeToken(password) : "";
export const HAS_PASSWORD = password.length > 0;
