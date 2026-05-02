import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const validUsername = process.env.LEGACY_ADMIN_USERNAME;
  const validPassword = process.env.LEGACY_ADMIN_PASSWORD;

  if (!validUsername || !validPassword || username !== validUsername || password !== validPassword) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("yt_auth", "true", { httpOnly: true, sameSite: "strict", maxAge: 60 * 60 * 24 });
  return NextResponse.json({ success: true });
}
