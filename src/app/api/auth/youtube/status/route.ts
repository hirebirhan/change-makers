import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decryptToken } from "@/lib/token-encryption";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("yt_oauth")?.value;
  if (!raw) return NextResponse.json({ connected: false });

  const payload = decryptToken(raw);
  if (!payload) return NextResponse.json({ connected: false });

  return NextResponse.json({ connected: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("yt_oauth");
  return NextResponse.json({ ok: true });
}
