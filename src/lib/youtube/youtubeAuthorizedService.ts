import "server-only";

import { decryptToken, encryptToken } from "@/lib/auth/crypto";
import { exchangeRefreshToken, revokeGoogleToken } from "@/lib/auth/google-oauth";
import { getGoogleConnection, updateGoogleConnection } from "@/lib/auth/store";

const YOUTUBE_DATA_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2";

export class ReconnectRequiredError extends Error {
  constructor() {
    super("YouTube authorization expired or was revoked. Please reconnect YouTube.");
    this.name = "ReconnectRequiredError";
  }
}

export async function getAuthorizedChannels(userId: string) {
  const token = await getValidAccessToken(userId);
  const data = await googleGet<{
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        customUrl?: string;
        thumbnails?: { default?: { url?: string }; high?: { url?: string } };
      };
      statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
    }>;
  }>(`${YOUTUBE_DATA_BASE}/channels?part=snippet,statistics&mine=true`, token);

  const channels = (data.items ?? []).map((channel) => ({
    id: channel.id,
    title: channel.snippet?.title ?? "Untitled channel",
    customUrl: channel.snippet?.customUrl ?? null,
    thumbnailUrl: channel.snippet?.thumbnails?.high?.url ?? channel.snippet?.thumbnails?.default?.url ?? null,
    subscriberCount: parseInt(channel.statistics?.subscriberCount ?? "0"),
    viewCount: parseInt(channel.statistics?.viewCount ?? "0"),
    videoCount: parseInt(channel.statistics?.videoCount ?? "0"),
  }));

  if (channels[0]) {
    await updateGoogleConnection(userId, { youtubeChannelId: channels[0].id });
  }

  return channels;
}

export async function getAnalyticsOverview(userId: string, channelId?: string | null) {
  const token = await getValidAccessToken(userId);
  const id = await resolveChannelId(userId, channelId);
  const { startDate, endDate } = defaultDateRange();
  const response = await analyticsReport(token, {
    ids: `channel==${id}`,
    startDate,
    endDate,
    metrics: "views,likes,comments,subscribersGained,estimatedMinutesWatched",
  });

  const values = rowValues(response);
  return {
    channelId: id,
    dateRange: { startDate, endDate },
    metrics: {
      views: numberAt(values, 0),
      likes: numberAt(values, 1),
      comments: numberAt(values, 2),
      subscribersGained: numberAt(values, 3),
      estimatedMinutesWatched: numberAt(values, 4),
    },
  };
}

export async function getAnalyticsVideos(userId: string, channelId?: string | null) {
  const token = await getValidAccessToken(userId);
  const id = await resolveChannelId(userId, channelId);
  const { startDate, endDate } = defaultDateRange();
  const response = await analyticsReport(token, {
    ids: `channel==${id}`,
    startDate,
    endDate,
    dimensions: "video",
    metrics: "views,likes,comments,estimatedMinutesWatched",
    sort: "-views",
    maxResults: "25",
  });

  return {
    channelId: id,
    dateRange: { startDate, endDate },
    videos: (response.rows ?? []).map((row) => ({
      videoId: String(row[0]),
      views: numberAt(row, 1),
      likes: numberAt(row, 2),
      comments: numberAt(row, 3),
      estimatedMinutesWatched: numberAt(row, 4),
    })),
  };
}

export async function getAnalyticsRevenue(userId: string, channelId?: string | null) {
  const token = await getValidAccessToken(userId);
  const connection = await getGoogleConnection(userId);
  if (!connection?.grantedScopes.includes("https://www.googleapis.com/auth/yt-analytics-monetary.readonly")) {
    return {
      reconnectRequired: true,
      missingScope: "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
    };
  }

  const id = await resolveChannelId(userId, channelId);
  const { startDate, endDate } = defaultDateRange();
  const response = await analyticsReport(token, {
    ids: `channel==${id}`,
    startDate,
    endDate,
    metrics: "estimatedRevenue,estimatedAdRevenue,grossRevenue",
  });
  const values = rowValues(response);

  return {
    channelId: id,
    dateRange: { startDate, endDate },
    metrics: {
      estimatedRevenue: numberAt(values, 0),
      estimatedAdRevenue: numberAt(values, 1),
      grossRevenue: numberAt(values, 2),
    },
  };
}

export async function disconnectYouTube(userId: string) {
  const connection = await getGoogleConnection(userId);
  if (!connection) return;
  try {
    await revokeGoogleToken(decryptToken(connection.refreshTokenEncrypted));
  } finally {
    await updateGoogleConnection(userId, { revokedAt: new Date().toISOString() });
  }
}

async function getValidAccessToken(userId: string) {
  const connection = await getGoogleConnection(userId);
  if (!connection || connection.revokedAt) throw new ReconnectRequiredError();

  const expiresAt = new Date(connection.tokenExpiry).getTime();
  if (connection.accessTokenEncrypted && expiresAt > Date.now() + 60 * 1000) {
    return decryptToken(connection.accessTokenEncrypted);
  }

  try {
    const refreshed = await exchangeRefreshToken(decryptToken(connection.refreshTokenEncrypted));
    if (!refreshed.access_token) throw new Error("Google did not return an access token");
    await updateGoogleConnection(userId, {
      accessTokenEncrypted: encryptToken(refreshed.access_token),
      tokenExpiry: new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString(),
    });
    return refreshed.access_token;
  } catch (error) {
    if (error instanceof Error && error.name === "invalid_grant") {
      await updateGoogleConnection(userId, { revokedAt: new Date().toISOString() });
      throw new ReconnectRequiredError();
    }
    throw error;
  }
}

async function resolveChannelId(userId: string, channelId?: string | null) {
  if (channelId) return channelId;
  const connection = await getGoogleConnection(userId);
  if (connection?.youtubeChannelId) return connection.youtubeChannelId;
  const channels = await getAuthorizedChannels(userId);
  if (!channels[0]) throw new Error("No owned YouTube channel was found for this Google account");
  return channels[0].id;
}

async function googleGet<T>(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Google API request failed");
  }
  return data as T;
}

async function analyticsReport(accessToken: string, params: Record<string, string>) {
  const url = new URL(`${YOUTUBE_ANALYTICS_BASE}/reports`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return googleGet<{ rows?: unknown[][] }>(url.toString(), accessToken);
}

function defaultDateRange() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function rowValues(response: { rows?: unknown[][] }) {
  return response.rows?.[0] ?? [];
}

function numberAt(row: unknown[], index: number) {
  const value = Number(row[index] ?? 0);
  return Number.isFinite(value) ? value : 0;
}
