import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getAnalyticsOverview, ReconnectRequiredError } from "@/lib/youtube/youtubeAuthorizedService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireCurrentUser();
  if (!user) return response;
  try {
    const channelId = request.nextUrl.searchParams.get("channelId");
    return NextResponse.json(await getAnalyticsOverview(user.id, channelId));
  } catch (error) {
    if (error instanceof ReconnectRequiredError) {
      return NextResponse.json({ error: error.message, reconnectRequired: true }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch YouTube Analytics overview" }, { status: 502 });
  }
}
