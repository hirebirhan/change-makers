CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  google_sub TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE google_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  google_account_email TEXT NOT NULL,
  youtube_channel_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT NOT NULL,
  granted_scopes JSON NOT NULL,
  token_expiry TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE oauth_states (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  state_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL,
  code_verifier TEXT,
  redirect_after_login TEXT,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE analytics_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  youtube_channel_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  dimensions JSON,
  metrics JSON NOT NULL,
  raw_response_json JSON,
  created_at TIMESTAMP NOT NULL
);
