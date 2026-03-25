import { NextResponse } from "next/server";

export async function GET() {
  const keys = Object.keys(process.env).filter(k =>
    !k.includes("SECRET") && !k.includes("KEY") && !k.includes("TOKEN") && !k.includes("PASSWORD") && !k.includes("URL")
  );
  return NextResponse.json({
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    adminPasswordLength: process.env.ADMIN_PASSWORD?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    visibleEnvKeys: keys,
  });
}
