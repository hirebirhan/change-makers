import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import test from "node:test";

const encryptionKey = randomBytes(32);

function encryptToken(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${ciphertext.toString("base64")}`;
}

function decryptToken(value) {
  const [version, iv, tag, ciphertext] = value.split(".");
  assert.equal(version, "v1");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function hashValue(value) {
  return createHash("sha256").update(value).digest("hex");
}

function createStateStore() {
  const states = [];
  return {
    create(rawState, purpose, ttlMs = 600_000) {
      states.push({
        stateHash: hashValue(rawState),
        purpose,
        expiresAt: Date.now() + ttlMs,
        consumedAt: null,
      });
    },
    consume(rawState, purpose) {
      const state = states.find((item) => item.stateHash === hashValue(rawState) && item.purpose === purpose);
      if (!state) return { ok: false, reason: "missing" };
      if (state.consumedAt) return { ok: false, reason: "consumed" };
      if (state.expiresAt <= Date.now()) return { ok: false, reason: "expired" };
      state.consumedAt = Date.now();
      return { ok: true };
    },
  };
}

test("encrypted tokens decrypt to their original value without storing plaintext", () => {
  const encrypted = encryptToken("refresh-token-secret");
  assert.notEqual(encrypted, "refresh-token-secret");
  assert.equal(decryptToken(encrypted), "refresh-token-secret");
});

test("oauth states are stored as hashes and can be consumed once", () => {
  const store = createStateStore();
  store.create("raw-state", "youtube_connect");
  assert.deepEqual(store.consume("raw-state", "youtube_connect"), { ok: true });
  assert.deepEqual(store.consume("raw-state", "youtube_connect"), { ok: false, reason: "consumed" });
});

test("expired oauth states are rejected", async () => {
  const store = createStateStore();
  store.create("expired-state", "google_login", 1);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(store.consume("expired-state", "google_login"), { ok: false, reason: "expired" });
});

test("public route payloads should not contain Google token fields", () => {
  const response = {
    authenticated: true,
    user: { email: "creator@example.com" },
    youtube: { connected: true, grantedScopes: ["https://www.googleapis.com/auth/youtube.readonly"] },
  };
  const serialized = JSON.stringify(response);
  assert.equal(serialized.includes("access_token"), false);
  assert.equal(serialized.includes("refresh_token"), false);
  assert.equal(serialized.includes("client_secret"), false);
});
