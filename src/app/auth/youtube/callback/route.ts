import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encryptToken } from "@/lib/token-encryption";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const base  = new URL("/comments", req.url);

  if (error || !code) {
    base.searchParams.set("oauth", "error");
    return NextResponse.redirect(base);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri:  process.env.GOOGLE_YOUTUBE_REDIRECT_URI ?? "",
      grant_type:    "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("OAuth token exchange failed:", tokenData);
    base.searchParams.set("oauth", "error");
    return NextResponse.redirect(base);
  }

  const cookieStore = await cookies();
  cookieStore.set("yt_oauth", encryptToken({
    accessToken:  tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? null,
    expiresAt:    Date.now() + (tokenData.expires_in ?? 3600) * 1000,
  }), {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  base.searchParams.set("oauth", "success");
  return NextResponse.redirect(base);
}
