import { NextResponse } from "next/server";
import { getConnectionStatus, getCurrentUser, isLegacyAuthenticated } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  const legacyAuthenticated = !user && await isLegacyAuthenticated();
  const youtube = await getConnectionStatus(user?.id ?? null);
  return NextResponse.json({
    authenticated: Boolean(user) || legacyAuthenticated,
    authMode: user ? "google" : legacyAuthenticated ? "legacy" : null,
    user: user ?? (legacyAuthenticated ? {
      id: "legacy-admin",
      email: "",
      name: "Legacy admin",
      avatarUrl: null,
    } : null),
    youtube,
  });
}
