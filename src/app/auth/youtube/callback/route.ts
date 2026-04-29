import { NextRequest } from "next/server";
import { handleYouTubeConnectCallback, loginErrorRedirect } from "@/lib/auth/google-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    return await handleYouTubeConnectCallback(request);
  } catch {
    return loginErrorRedirect("YouTube authorization failed. Please try connecting again.");
  }
}
