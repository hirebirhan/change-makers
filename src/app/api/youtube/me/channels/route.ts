import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAuthorizedChannels, ReconnectRequiredError } from "@/lib/youtube/youtubeAuthorizedService";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireCurrentUser();
  if (!user) return response;
  try {
    return NextResponse.json({ channels: await getAuthorizedChannels(user.id) });
  } catch (error) {
    if (error instanceof ReconnectRequiredError) {
      return NextResponse.json({ error: error.message, reconnectRequired: true }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch authorized YouTube channels" }, { status: 502 });
  }
}
