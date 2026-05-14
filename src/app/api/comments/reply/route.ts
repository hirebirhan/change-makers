import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encryptToken, decryptToken, OAuthTokens } from "@/lib/token-encryption";

async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("yt_oauth")?.value;
  if (!raw) return null;

  const payload = decryptToken(raw);
  if (!payload) return null;

  // Still valid with 5-min buffer
  if (payload.expiresAt - Date.now() > 5 * 60 * 1000) return payload.accessToken;

  // Refresh
  if (!payload.refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: payload.refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  const refreshed: OAuthTokens = {
    ...payload,
    accessToken: data.access_token,
    expiresAt:   Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  cookieStore.set("yt_oauth", encryptToken(refreshed), {
    httpOnly: true,
    sameSite: "strict",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });

  return data.access_token;
}

export async function POST(req: NextRequest) {
  const { parentId, text } = (await req.json()) as { parentId: string; text: string };

  if (!parentId || !text?.trim())
    return NextResponse.json({ error: "parentId and text are required" }, { status: 400 });

  const accessToken = await getValidAccessToken();
  if (!accessToken)
    return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const ytRes = await fetch(
    "https://www.googleapis.com/youtube/v3/comments?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: { parentId, textOriginal: text.trim() },
      }),
    }
  );

  const data = await ytRes.json();

  if (!ytRes.ok)
    return NextResponse.json(
      { error: data.error?.message ?? "YouTube rejected the reply" },
      { status: ytRes.status }
    );

  return NextResponse.json({ ok: true, comment: data });
}
