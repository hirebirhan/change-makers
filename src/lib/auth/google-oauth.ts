import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { base64Url, createPkcePair, encryptToken, hashValue, randomToken } from "./crypto";
import { getGoogleOAuthConfig } from "./env";
import { createOAuthState, consumeOAuthState, getGoogleConnection, upsertGoogleConnection, upsertUser } from "./store";
import { getCurrentUser, setSessionCookie } from "./session";
import type { OAuthPurpose } from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
}

interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: string;
}

export async function startGoogleLogin(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  const state = randomToken();
  const { verifier, challenge } = createPkcePair();
  const redirectAfterLogin = sanitizeRedirect(request.nextUrl.searchParams.get("redirect") || "/");

  await createOAuthState({
    stateHash: hashValue(state),
    purpose: "google_login",
    codeVerifier: verifier,
    redirectAfterLogin,
  });

  const url = buildGoogleAuthUrl({
    clientId: config.clientId,
    redirectUri: config.loginRedirectUri,
    scopes: config.loginScopes,
    state,
    codeChallenge: challenge,
    prompt: "select_account",
  });

  return NextResponse.redirect(url);
}

export async function handleGoogleLoginCallback(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return oauthError("Missing OAuth callback parameters");

  const consumed = await consumeOAuthState(hashValue(state), "google_login");
  if (!consumed.ok) return oauthError(`Invalid OAuth state: ${consumed.reason}`);

  const token = await exchangeCode({
    code,
    redirectUri: config.loginRedirectUri,
    codeVerifier: consumed.state.codeVerifier,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
  if (!token.id_token) return oauthError("Google did not return an identity token");

  const identity = await verifyGoogleIdentity(token.id_token, config.clientId);
  const user = await upsertUser({
    googleSub: identity.sub,
    email: identity.email,
    name: identity.name || identity.email,
    avatarUrl: identity.picture ?? null,
  });

  const response = NextResponse.redirect(new URL(consumed.state.redirectAfterLogin || "/", request.url));
  return setSessionCookie(response, user.id);
}

export async function startYouTubeConnect(request: NextRequest, purpose: OAuthPurpose = "youtube_connect") {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));

  const config = getGoogleOAuthConfig();
  const state = randomToken();
  const { verifier, challenge } = createPkcePair();
  const scopes =
    purpose === "revenue_scope_upgrade"
      ? [...config.youtubeScopes, config.revenueScope]
      : config.youtubeScopes;

  await createOAuthState({
    stateHash: hashValue(state),
    purpose,
    userId: user.id,
    codeVerifier: verifier,
  });

  const url = buildGoogleAuthUrl({
    clientId: config.clientId,
    redirectUri: config.youtubeRedirectUri,
    scopes,
    state,
    codeChallenge: challenge,
    prompt: "consent",
    includeGrantedScopes: true,
    accessType: "offline",
  });

  return NextResponse.redirect(url);
}

export async function handleYouTubeConnectCallback(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return oauthError("Missing OAuth callback parameters");

  let consumed = await consumeOAuthState(hashValue(state), "youtube_connect");
  if (!consumed.ok) {
    consumed = await consumeOAuthState(hashValue(state), "revenue_scope_upgrade");
  }
  if (!consumed.ok) return oauthError(`Invalid OAuth state: ${consumed.reason}`);

  const user = await getCurrentUser();
  if (!user || user.id !== consumed.state.userId) return oauthError("Session does not match OAuth state");

  const token = await exchangeCode({
    code,
    redirectUri: config.youtubeRedirectUri,
    codeVerifier: consumed.state.codeVerifier,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });

  const existingConnection = await getGoogleConnection(user.id);
  const refreshTokenEncrypted = token.refresh_token
    ? encryptToken(token.refresh_token)
    : existingConnection?.refreshTokenEncrypted;

  if (!refreshTokenEncrypted) {
    return oauthError("Google did not return a refresh token. Disconnect and reconnect with consent.");
  }

  const identity = token.id_token ? await verifyGoogleIdentity(token.id_token, config.clientId) : null;
  await upsertGoogleConnection({
    userId: user.id,
    googleAccountEmail: identity?.email || user.email,
    accessTokenEncrypted: token.access_token ? encryptToken(token.access_token) : null,
    refreshTokenEncrypted,
    grantedScopes: splitTokenScopes(token.scope),
    tokenExpiry: new Date(Date.now() + (token.expires_in ?? 3600) * 1000).toISOString(),
  });

  return NextResponse.redirect(new URL("/?youtube=connected", request.url));
}

export async function exchangeRefreshToken(refreshToken: string) {
  const config = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params,
    cache: "no-store",
  });
  const data = (await response.json()) as TokenResponse;
  if (!response.ok || data.error) {
    const error = new Error(data.error || "Failed to refresh Google access token");
    error.name = data.error || "google_token_refresh_failed";
    throw error;
  }
  return data;
}

export async function revokeGoogleToken(token: string) {
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    cache: "no-store",
  });
}

async function exchangeCode(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string | null;
  clientId: string;
  clientSecret: string;
}) {
  const params = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });
  if (input.codeVerifier) params.set("code_verifier", input.codeVerifier);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params,
    cache: "no-store",
  });
  const data = (await response.json()) as TokenResponse;
  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to exchange Google authorization code");
  }
  return data;
}

async function verifyGoogleIdentity(idToken: string, clientId: string) {
  const response = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`, {
    cache: "no-store",
  });
  const identity = (await response.json()) as GoogleIdentity & { error?: string };
  if (!response.ok || identity.error) throw new Error("Failed to verify Google identity token");
  const issuerOk = identity.iss === "https://accounts.google.com" || identity.iss === "accounts.google.com";
  const expiryOk = Number(identity.exp) * 1000 > Date.now();
  if (identity.aud !== clientId || !issuerOk || !expiryOk || !identity.sub || !identity.email) {
    throw new Error("Invalid Google identity token");
  }
  return identity;
}

function buildGoogleAuthUrl(input: {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge: string;
  prompt: "select_account" | "consent";
  accessType?: "offline";
  includeGrantedScopes?: boolean;
}) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", input.scopes.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", input.prompt);
  if (input.accessType) url.searchParams.set("access_type", input.accessType);
  if (input.includeGrantedScopes) url.searchParams.set("include_granted_scopes", "true");
  return url;
}

function sanitizeRedirect(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function splitTokenScopes(scopes: string | undefined) {
  return scopes?.split(/\s+/).filter(Boolean) ?? [];
}

function oauthError(message: string) {
  return loginErrorRedirect(message);
}

export function loginErrorRedirect(message: string) {
  const url = new URL("/login", process.env.APP_URL || "http://localhost:3000");
  url.searchParams.set("error", base64Url(Buffer.from(message)).slice(0, 160));
  return NextResponse.redirect(new URL(url.pathname + url.search, process.env.APP_URL || "http://localhost:3000"));
}
