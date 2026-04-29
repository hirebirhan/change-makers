import { NextResponse } from "next/server";
import { setLegacySessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const expectedUsername = process.env.LEGACY_ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.LEGACY_ADMIN_PASSWORD || "changem@kers2025";

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  return setLegacySessionCookie(NextResponse.json({ success: true }));
}
