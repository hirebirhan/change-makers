import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("yt_auth", "true", { httpOnly: true, sameSite: "strict", maxAge: 60 * 60 * 24 });
  return NextResponse.json({ success: true });
}
