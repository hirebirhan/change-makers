export type OAuthPurpose = "google_login" | "youtube_connect" | "revenue_scope_upgrade";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  googleSub: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleConnectionRecord {
  id: string;
  userId: string;
  googleAccountEmail: string;
  youtubeChannelId: string | null;
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string;
  grantedScopes: string[];
  tokenExpiry: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthStateRecord {
  id: string;
  userId: string | null;
  stateHash: string;
  purpose: OAuthPurpose;
  codeVerifier: string | null;
  redirectAfterLogin: string | null;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthDatabase {
  users: UserRecord[];
  googleConnections: GoogleConnectionRecord[];
  oauthStates: OAuthStateRecord[];
  sessions: SessionRecord[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface YouTubeConnectionStatus {
  connected: boolean;
  revoked: boolean;
  googleAccountEmail: string | null;
  youtubeChannelId: string | null;
  grantedScopes: string[];
  tokenExpiry: string | null;
}
