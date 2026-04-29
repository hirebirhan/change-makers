import { NextRequest } from "next/server";
import { loginErrorRedirect, startGoogleLogin } from "@/lib/auth/google-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    return await startGoogleLogin(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth could not be started";
    return loginErrorRedirect(message);
  }
}
