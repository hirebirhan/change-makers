import "server-only";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Google OAuth`);
  }
  return value;
}

export function getAppUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export function assertSessionSecret() {
  const secret = getSessionSecret();
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET, AUTH_SECRET, or NEXTAUTH_SECRET must be at least 32 characters");
  }
  return secret;
}

export function getGoogleOAuthConfig() {
  const appUrl = getAppUrl();
  return {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: required("GOOGLE_CLIENT_SECRET"),
    loginRedirectUri:
      process.env.GOOGLE_LOGIN_REDIRECT_URI || `${appUrl}/auth/google/callback`,
    youtubeRedirectUri:
      process.env.GOOGLE_YOUTUBE_REDIRECT_URI || `${appUrl}/auth/youtube/callback`,
    loginScopes: splitScopes(process.env.GOOGLE_LOGIN_SCOPES || "openid email profile"),
    youtubeScopes: splitScopes(
      process.env.GOOGLE_YOUTUBE_SCOPES ||
        "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly"
    ),
    revenueScope:
      process.env.GOOGLE_REVENUE_SCOPE ||
      "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  };
}

export function getTokenEncryptionKey() {
  const value = process.env.TOKEN_ENCRYPTION_KEY;
  if (!value) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required for OAuth token storage");
  }
  const base64 = Buffer.from(value, "base64");
  if (base64.length === 32) return base64;
  const hex = Buffer.from(value, "hex");
  if (hex.length === 32) return hex;
  throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes using base64 or hex");
}

function splitScopes(scopes: string) {
  return scopes.split(/[,\s]+/).map((scope) => scope.trim()).filter(Boolean);
}
