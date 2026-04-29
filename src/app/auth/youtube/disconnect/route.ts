import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { disconnectYouTube } from "@/lib/youtube/youtubeAuthorizedService";

export const runtime = "nodejs";

export async function POST() {
  const { user, response } = await requireCurrentUser();
  if (!user) return response;
  try {
    await disconnectYouTube(user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "YouTube access was marked for disconnect, but Google revocation could not be confirmed." },
      { status: 502 }
    );
  }
}
