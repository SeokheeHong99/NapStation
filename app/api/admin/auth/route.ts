import { NextResponse } from "next/server";
import { createAdminSession, clearAdminSession, checkPassword } from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  const valid = await checkPassword(password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
