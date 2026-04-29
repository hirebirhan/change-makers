import { NextRequest } from "next/server";
import { loginErrorRedirect, startYouTubeConnect } from "@/lib/auth/google-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const revenue = request.nextUrl.searchParams.get("revenue") === "1";
    return await startYouTubeConnect(request, revenue ? "revenue_scope_upgrade" : "youtube_connect");
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube authorization could not be started";
    return loginErrorRedirect(message);
  }
}
