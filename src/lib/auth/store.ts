import "server-only";

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import {
  AuthDatabase,
  GoogleConnectionRecord,
  OAuthPurpose,
  OAuthStateRecord,
  SessionRecord,
} from "./types";

const DEFAULT_DB: AuthDatabase = {
  users: [],
  googleConnections: [],
  oauthStates: [],
  sessions: [],
};

function databasePath() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("file:")) {
    const requested = url.slice("file:".length).replace(/^\.?\/?\.data\/?/, "");
    return path.join(process.cwd(), ".data", requested || "auth-db.json");
  }
  return path.join(process.cwd(), ".data", "auth-db.json");
}

async function readDb(): Promise<AuthDatabase> {
  try {
    return JSON.parse(await readFile(databasePath(), "utf8")) as AuthDatabase;
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

async function writeDb(db: AuthDatabase) {
  const file = databasePath();
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}

async function mutateDb<T>(fn: (db: AuthDatabase) => T | Promise<T>) {
  const db = await readDb();
  const result = await fn(db);
  await writeDb(db);
  return result;
}

export async function upsertUser(input: {
  googleSub: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}) {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    let user = db.users.find((candidate) => candidate.googleSub === input.googleSub);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
        googleSub: input.googleSub,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(user);
    } else {
      user.email = input.email;
      user.name = input.name;
      user.avatarUrl = input.avatarUrl;
      user.updatedAt = now;
    }
    return user;
  });
}

export async function getUserById(id: string) {
  const db = await readDb();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function createSession(userId: string) {
  return mutateDb((db) => {
    const now = new Date();
    const session: SessionRecord = {
      id: crypto.randomUUID(),
      userId,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
    };
    db.sessions.push(session);
    return session;
  });
}

export async function getSession(id: string) {
  const db = await readDb();
  const session = db.sessions.find((candidate) => candidate.id === id);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

export async function deleteSession(id: string) {
  return mutateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.id !== id);
  });
}

export async function createOAuthState(input: {
  stateHash: string;
  purpose: OAuthPurpose;
  userId?: string | null;
  codeVerifier?: string | null;
  redirectAfterLogin?: string | null;
  ttlMs?: number;
}) {
  return mutateDb((db) => {
    const now = new Date();
    const state: OAuthStateRecord = {
      id: crypto.randomUUID(),
      userId: input.userId ?? null,
      stateHash: input.stateHash,
      purpose: input.purpose,
      codeVerifier: input.codeVerifier ?? null,
      redirectAfterLogin: input.redirectAfterLogin ?? null,
      expiresAt: new Date(now.getTime() + (input.ttlMs ?? 10 * 60 * 1000)).toISOString(),
      consumedAt: null,
      createdAt: now.toISOString(),
    };
    db.oauthStates.push(state);
    return state;
  });
}

export async function consumeOAuthState(stateHash: string, purpose: OAuthPurpose) {
  return mutateDb((db) => {
    const state = db.oauthStates.find(
      (candidate) => candidate.stateHash === stateHash && candidate.purpose === purpose
    );
    if (!state) return { ok: false as const, reason: "missing" as const };
    if (state.consumedAt) return { ok: false as const, reason: "consumed" as const };
    if (new Date(state.expiresAt).getTime() <= Date.now()) {
      return { ok: false as const, reason: "expired" as const };
    }
    state.consumedAt = new Date().toISOString();
    return { ok: true as const, state };
  });
}

export async function getGoogleConnection(userId: string) {
  const db = await readDb();
  return db.googleConnections.find((connection) => connection.userId === userId) ?? null;
}

export async function upsertGoogleConnection(input: {
  userId: string;
  googleAccountEmail: string;
  youtubeChannelId?: string | null;
  accessTokenEncrypted?: string | null;
  refreshTokenEncrypted: string;
  grantedScopes: string[];
  tokenExpiry: string;
}) {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    let connection = db.googleConnections.find((candidate) => candidate.userId === input.userId);
    if (!connection) {
      connection = {
        id: crypto.randomUUID(),
        userId: input.userId,
        googleAccountEmail: input.googleAccountEmail,
        youtubeChannelId: input.youtubeChannelId ?? null,
        accessTokenEncrypted: input.accessTokenEncrypted ?? null,
        refreshTokenEncrypted: input.refreshTokenEncrypted,
        grantedScopes: input.grantedScopes,
        tokenExpiry: input.tokenExpiry,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      db.googleConnections.push(connection);
    } else {
      connection.googleAccountEmail = input.googleAccountEmail;
      connection.youtubeChannelId = input.youtubeChannelId ?? connection.youtubeChannelId;
      connection.accessTokenEncrypted = input.accessTokenEncrypted ?? connection.accessTokenEncrypted;
      connection.refreshTokenEncrypted = input.refreshTokenEncrypted || connection.refreshTokenEncrypted;
      connection.grantedScopes = Array.from(new Set([...connection.grantedScopes, ...input.grantedScopes]));
      connection.tokenExpiry = input.tokenExpiry;
      connection.revokedAt = null;
      connection.updatedAt = now;
    }
    return connection;
  });
}

export async function updateGoogleConnection(
  userId: string,
  updates: Partial<Pick<GoogleConnectionRecord, "accessTokenEncrypted" | "refreshTokenEncrypted" | "tokenExpiry" | "youtubeChannelId" | "revokedAt">>
) {
  return mutateDb((db) => {
    const connection = db.googleConnections.find((candidate) => candidate.userId === userId);
    if (!connection) return null;
    Object.assign(connection, updates, { updatedAt: new Date().toISOString() });
    return connection;
  });
}
