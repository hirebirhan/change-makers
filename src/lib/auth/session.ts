import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { assertSessionSecret } from "./env";
import { signSessionId, verifySignedSessionId } from "./crypto";
import { createSession, deleteSession, getGoogleConnection, getSession, getUserById } from "./store";
import type { AuthenticatedUser, YouTubeConnectionStatus } from "./types";

export const SESSION_COOKIE = "__Host-cm_session";
export const LEGACY_AUTH_COOKIE = "yt_auth";

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(response: NextResponse, userId: string) {
  assertSessionSecret();
  const session = await createSession(userId);
  response.cookies.set(SESSION_COOKIE, signSessionId(session.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.delete(LEGACY_AUTH_COOKIE);
  return response;
}

export async function clearSessionCookie(response: NextResponse) {
  const cookieStore = await cookies();
  const sessionId = verifySignedSessionId(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionId) await deleteSession(sessionId);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(LEGACY_AUTH_COOKIE);
  return response;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = verifySignedSessionId(cookieStore.get(SESSION_COOKIE)?.value);
  if (!sessionId) return null;
  const session = await getSession(sessionId);
  if (!session) return null;
  const user = await getUserById(session.userId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  } satisfies AuthenticatedUser;
}

export async function isLegacyAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(LEGACY_AUTH_COOKIE)?.value === "true";
}

export function setLegacySessionCookie(response: NextResponse) {
  response.cookies.set(LEGACY_AUTH_COOKIE, "true", {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie(),
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function getConnectionStatus(userId: string | null): Promise<YouTubeConnectionStatus> {
  if (!userId) return emptyConnectionStatus();
  const connection = await getGoogleConnection(userId);
  if (!connection) return emptyConnectionStatus();
  return {
    connected: !connection.revokedAt,
    revoked: Boolean(connection.revokedAt),
    googleAccountEmail: connection.googleAccountEmail,
    youtubeChannelId: connection.youtubeChannelId,
    grantedScopes: connection.grantedScopes,
    tokenExpiry: connection.tokenExpiry,
  };
}

function emptyConnectionStatus(): YouTubeConnectionStatus {
  return {
    connected: false,
    revoked: false,
    googleAccountEmail: null,
    youtubeChannelId: null,
    grantedScopes: [],
    tokenExpiry: null,
  };
}
