import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get("yt_auth")?.value === "true";
  return NextResponse.json({ authenticated });
}
