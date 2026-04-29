import { NextRequest } from "next/server";
import { handleGoogleLoginCallback, loginErrorRedirect } from "@/lib/auth/google-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    return await handleGoogleLoginCallback(request);
  } catch {
    return loginErrorRedirect("Google sign-in failed. Please try again.");
  }
}
