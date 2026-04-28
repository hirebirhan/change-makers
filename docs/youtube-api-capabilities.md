# YouTube Data API v3 — Public/API-Key Capabilities & Limitations

## 1. Purpose

This document defines what can and cannot be built for the **Change Makers analytics dashboard** using the **YouTube Data API v3 with an API key only**.

The current scope intentionally excludes OAuth 2.0. That means the dashboard can consume **public snapshot data**, but it cannot access YouTube Studio analytics, private channel data, monetization data, or authenticated user actions.

---

## 2. Executive Summary

The YouTube Data API v3 is suitable for:

- Public channel profile and statistics
- Public video metadata and statistics
- Public playlist and uploads data
- Public comment threads
- Basic engagement calculations
- Snapshot-based reporting
- Trend tracking only if we store our own historical snapshots

It is **not** suitable for real YouTube Studio-style analytics without OAuth.

The most important limitation is this:

> The YouTube Data API v3 gives current public state. It does not provide historical analytics, watch time, retention, revenue, traffic sources, impressions, CTR, or audience demographics through public API-key access.

For real historical analytics, the correct upgrade path is the **YouTube Analytics API** or **YouTube Reporting API**, both of which require OAuth authorization from the channel owner.

---

## 3. Authentication Scope

### Current scope: API key only

All supported requests should use:

```http
GET https://www.googleapis.com/youtube/v3/{endpoint}?key={API_KEY}
```

This is appropriate for public data.

### Out of scope for now: OAuth 2.0

OAuth is required for:

- Accessing private channel/video data
- Uploading videos
- Updating videos
- Creating/updating/deleting playlists
- Posting or moderating comments
- Reading YouTube Analytics data
- Reading revenue, watch time, retention, demographics, or traffic source data
- Accessing owner-only fields

---

## 4. Public Data Available Through API Key

## 4.1 Channel Data

### Endpoint

```http
GET https://www.googleapis.com/youtube/v3/channels
```

### Recommended parts

```txt
snippet,statistics,contentDetails,brandingSettings
```

### Example

```http
GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id={CHANNEL_ID}&key={API_KEY}
```

### Available fields

| Category | Data | Notes |
|---|---|---|
| Identity | Channel ID, title, description, custom URL | Public metadata |
| Visuals | Thumbnails | Reliable public fields |
| Statistics | View count, subscriber count, video count | Snapshot values only |
| Uploads playlist | Upload playlist ID | Found under `contentDetails.relatedPlaylists.uploads` |
| Branding | Limited branding settings | Some banner/channel-art fields are deprecated or inconsistent |

### Important limitations

| Limitation | Explanation |
|---|---|
| Subscriber count may be rounded | Public subscriber counts are rounded down to three significant figures, especially for larger channels. |
| Subscriber count may be hidden | Use `statistics.hiddenSubscriberCount` to detect visibility. |
| No subscriber growth history | The API returns current subscriber count only. |
| No watch time | Watch time is YouTube Analytics API data, not public Data API data. |
| No traffic source data | Requires YouTube Analytics API. |
| No demographic data | Requires YouTube Analytics API. |

---

## 4.2 Channel Uploads

The best way to fetch a channel’s videos is not `search.list`. It is:

1. Call `channels.list` to get the uploads playlist ID.
2. Call `playlistItems.list` using that uploads playlist ID.
3. Call `videos.list` in batches to get statistics and details.

### Step 1 — Get uploads playlist ID

```http
GET https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id={CHANNEL_ID}&key={API_KEY}
```

Read:

```txt
items[0].contentDetails.relatedPlaylists.uploads
```

### Step 2 — Get uploaded videos

```http
GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={UPLOADS_PLAYLIST_ID}&maxResults=50&key={API_KEY}
```

### Available data

| Data | Notes |
|---|---|
| Video IDs | Use these IDs for `videos.list`. |
| Upload order | Usually newest first for uploads playlist. |
| Playlist item metadata | Includes snippet-level metadata. |
| Pagination | Use `nextPageToken` to fetch more than 50 items. |

### Limitation

`playlistItems.list` does not return full video statistics. Use it mainly to discover video IDs, then call `videos.list`.

---

## 4.3 Video Data

### Endpoint

```http
GET https://www.googleapis.com/youtube/v3/videos
```

### Recommended parts

```txt
snippet,statistics,contentDetails,status
```

### Example

```http
GET https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id={VIDEO_ID_1},{VIDEO_ID_2},{VIDEO_ID_3}&key={API_KEY}
```

### Available fields

| Category | Data | Notes |
|---|---|---|
| Metadata | Title, description, publish date, channel ID, channel title | From `snippet` |
| Visuals | Thumbnails | From `snippet.thumbnails` |
| Classification | Category ID, tags if available | Tags may not always be present or reliable for public use |
| Statistics | Views, likes, comments | Snapshot values only |
| Content details | Duration, caption availability, definition, projection | From `contentDetails` |
| Status | Limited status metadata | Owner/private details require OAuth |

### Available calculated metrics

These can be calculated from public fields:

| Metric | Formula |
|---|---|
| Engagement rate | `(likes + comments) / views * 100` |
| Views per day | `views / daysSincePublished` |
| Like rate | `likes / views * 100` |
| Comment rate | `comments / views * 100` |
| Average views per video | `totalViews / videoCount` |
| Video age | `today - publishedAt` |
| Short vs long-form classification | Based on `contentDetails.duration` |

### Not available from public Data API

| Missing data | Reason |
|---|---|
| Historical view counts | Store snapshots yourself if needed. |
| Daily/weekly view trend | Not returned by Data API. |
| Watch time | Requires YouTube Analytics API. |
| Average view duration | Requires YouTube Analytics API. |
| Audience retention | Requires YouTube Analytics API. |
| Impressions | Requires YouTube Analytics API. |
| CTR | Requires YouTube Analytics API. |
| Revenue | Requires YouTube Analytics API and monetization access. |
| Subscriber conversion by video | Requires YouTube Analytics API. |
| Traffic sources | Requires YouTube Analytics API. |

---

## 4.4 Playlist Data

### Endpoint

```http
GET https://www.googleapis.com/youtube/v3/playlists
```

### Example

```http
GET https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id={PLAYLIST_ID}&key={API_KEY}
```

### Available data

| Data | Notes |
|---|---|
| Playlist title | Public playlist metadata |
| Description | Public playlist metadata |
| Thumbnail | Public playlist metadata |
| Channel owner | Public metadata |
| Item count | From `contentDetails.itemCount` |

---

## 4.5 Playlist Items

### Endpoint

```http
GET https://www.googleapis.com/youtube/v3/playlistItems
```

### Example

```http
GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={PLAYLIST_ID}&maxResults=50&key={API_KEY}
```

### Available data

| Data | Notes |
|---|---|
| Video ID | Use for `videos.list`. |
| Position | Position inside playlist. |
| Published date | Date item was added to playlist, not always the original video publish date. |
| Snippet metadata | Lightweight metadata only. |

### Important note

For accurate video publish date, duration, and statistics, always call `videos.list` after collecting IDs from `playlistItems.list`.

---

## 4.6 Comments

### Endpoint

```http
GET https://www.googleapis.com/youtube/v3/commentThreads
```

### Example

```http
GET https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId={VIDEO_ID}&maxResults=100&key={API_KEY}
```

### Available data

| Data | Notes |
|---|---|
| Top-level comments | Public comments only |
| Comment author display name | Public author metadata |
| Comment text | Public comment content |
| Comment like count | Snapshot count |
| Reply count | Available on comment thread |
| Published timestamp | Public timestamp |
| Updated timestamp | Public timestamp |

### Not available directly

| Missing data | Alternative |
|---|---|
| Sentiment | Calculate separately using NLP. |
| Comment trend over time | Store snapshots or fetch periodically. |
| Deleted/moderated private comments | Requires owner permissions or unavailable. |
| Full moderation workflow | Requires OAuth. |

---

## 4.7 Search

### Endpoint

```http
GET https://www.googleapis.com/youtube/v3/search
```

### Example

```http
GET https://www.googleapis.com/youtube/v3/search?part=snippet&q={QUERY}&type=video&maxResults=25&key={API_KEY}
```

### Use cases

Use `search.list` for:

- Keyword search
- Discovering public videos
- Discovering channels by query
- Discovering playlists by query

### Important quota warning

`search.list` is expensive. It costs significantly more quota than `channels.list`, `videos.list`, and `playlistItems.list`.

Use it only when search is actually needed. Do not use it to fetch all videos from a known channel. For known channels, use the uploads playlist flow instead.

Recommended approach:

| Scenario | Preferred endpoint |
|---|---|
| Known channel ID | `channels.list` + `playlistItems.list` + `videos.list` |
| Known video IDs | `videos.list` |
| Known playlist ID | `playlistItems.list` + `videos.list` |
| Unknown channel/video discovery | `search.list` |

---

## 5. Quota Model

## 5.1 Default quota

Most YouTube Data API projects start with a daily quota allocation. The exact quota should be checked in the Google Cloud Console for the active project.

A common default is:

```txt
10,000 units/day
```

Quota is consumed per API request, not only per successful response. Invalid requests can still consume quota.

---

## 5.2 Common quota costs

| Method | Typical quota cost |
|---|---:|
| `channels.list` | 1 unit |
| `videos.list` | 1 unit |
| `playlistItems.list` | 1 unit |
| `playlists.list` | 1 unit |
| `commentThreads.list` | 1 unit |
| `comments.list` | 1 unit |
| `videoCategories.list` | 1 unit |
| `i18nLanguages.list` | 1 unit |
| `i18nRegions.list` | 1 unit |
| `search.list` | 100 units |

### Key takeaway

Avoid using `search.list` as the default data-fetching mechanism. It is useful, but expensive.

---

## 5.3 Efficient channel sync flow

For a known channel:

```txt
1. channels.list
   Cost: 1 unit
   Purpose: Get channel metadata, statistics, uploads playlist ID

2. playlistItems.list
   Cost: 1 unit per page
   Purpose: Get video IDs from uploads playlist

3. videos.list
   Cost: 1 unit per batch request
   Purpose: Get video metadata, duration, statistics
```

### Example: sync latest 50 videos from one channel

| Step | Request count | Quota cost |
|---|---:|---:|
| Get channel details | 1 | 1 |
| Get latest 50 uploads | 1 | 1 |
| Get video details for those IDs | 1 | 1 |
| Total | 3 requests | 3 units |

This is much better than using repeated `search.list` calls.

---

## 6. Data Model Recommendation

## 6.1 Store raw API snapshots

Because the API does not provide historical trends, the application should store daily or periodic snapshots.

Recommended tables/collections:

```txt
channels
channel_snapshots
videos
video_snapshots
playlist_items
comment_snapshots
sync_runs
```

### `channel_snapshots`

```ts
interface ChannelSnapshot {
  channelId: string;
  capturedAt: string;
  subscriberCount: number | null;
  hiddenSubscriberCount: boolean;
  viewCount: number;
  videoCount: number;
}
```

### `video_snapshots`

```ts
interface VideoSnapshot {
  videoId: string;
  capturedAt: string;
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
}
```

This enables real trend calculation later:

```ts
viewsGained = currentSnapshot.viewCount - previousSnapshot.viewCount;
likesGained = currentSnapshot.likeCount - previousSnapshot.likeCount;
commentsGained = currentSnapshot.commentCount - previousSnapshot.commentCount;
```

---

## 7. Real Metrics vs Estimated Metrics

The dashboard must clearly separate **real YouTube API data** from **estimated/modelled metrics**.

## 7.1 Real API metrics

These come directly from YouTube Data API v3:

| Metric | Source |
|---|---|
| Channel total views | `channels.statistics.viewCount` |
| Channel subscriber count | `channels.statistics.subscriberCount` |
| Channel video count | `channels.statistics.videoCount` |
| Video views | `videos.statistics.viewCount` |
| Video likes | `videos.statistics.likeCount` |
| Video comments | `videos.statistics.commentCount` |
| Video publish date | `videos.snippet.publishedAt` |
| Video duration | `videos.contentDetails.duration` |
| Comment count/text/likes | `commentThreads.list` |

## 7.2 Calculated metrics

These are safe to calculate from real API data:

```ts
const engagementRate = ((likes + comments) / views) * 100;
const viewsPerDay = views / daysSincePublished;
const averageViewsPerVideo = totalViews / videoCount;
```

These should be labelled as **calculated metrics**, not raw YouTube metrics.

## 7.3 Estimated/modelled metrics

These are not available from YouTube Data API v3 public endpoints and should be labelled as estimates:

```ts
interface EstimatedVideoMetrics {
  estimatedWatchTimeHours: number;
  estimatedSubscribersGained: number;
  estimatedSubscribedViews: number;
  estimatedUnsubscribedViews: number;
}
```

Example model:

```ts
const estimatedWatchTimeHours = views * estimatedAverageViewDurationHours;
const estimatedSubscribersGained = views * estimatedSubscriberConversionRate;
const estimatedSubscribedViews = views * estimatedSubscribedViewRatio;
const estimatedUnsubscribedViews = views - estimatedSubscribedViews;
```

### Required UI label

Any estimated metric should include a clear label:

```txt
Estimated — not provided by YouTube API
```

Do not present estimated metrics as official YouTube analytics.

---

## 8. Missing Analytics

## 8.1 Not available through public YouTube Data API v3

| Metric | Availability |
|---|---|
| Watch time | Not available |
| Average view duration | Not available |
| Audience retention | Not available |
| Revenue | Not available |
| RPM/CPM | Not available |
| Traffic sources | Not available |
| Impressions | Not available |
| Click-through rate | Not available |
| Audience demographics | Not available |
| Subscriber sources | Not available |
| Realtime analytics | Not available |
| Returning/new viewers | Not available |
| Geography analytics | Not available |
| Device type analytics | Not available |
| Shorts shelf performance | Not available |
| End-screen/card performance | Not available |

## 8.2 Available only through OAuth-based APIs

| API | Use case |
|---|---|
| YouTube Analytics API | Query channel/video analytics such as watch time, views over time, retention, traffic sources, demographics, revenue where authorized. |
| YouTube Reporting API | Bulk scheduled analytics reports for authorized content owners/channels. |

---

## 9. Recommended Backend Service Design

## 9.1 Public API service

```txt
YouTubePublicApiService
├── getChannel(channelId)
├── getChannelUploadsPlaylistId(channelId)
├── getPlaylistItems(playlistId, pageToken?)
├── getVideos(videoIds[])
├── getVideo(videoId)
├── getComments(videoId, pageToken?)
├── searchVideos(query)
├── getVideoCategories(regionCode)
├── getSupportedRegions()
└── getSupportedLanguages()
```

## 9.2 Sync service

```txt
YouTubeChannelSyncService
├── syncChannel(channelId)
├── syncLatestUploads(channelId)
├── syncVideoSnapshots(videoIds[])
├── syncComments(videoId)
└── recordSyncRun(result)
```

## 9.3 Analytics service

```txt
YouTubeAnalyticsCalculator
├── calculateEngagementRate(video)
├── calculateViewsPerDay(video)
├── calculateSnapshotDeltas(previous, current)
├── calculateChannelGrowth(previousSnapshot, currentSnapshot)
└── calculateEstimatedMetrics(video, assumptions)
```

---

## 10. Recommended API Usage Patterns

## 10.1 Fetch a channel dashboard

```txt
Input: channelId

1. channels.list(part=snippet,statistics,contentDetails)
2. Extract uploads playlist ID
3. playlistItems.list(part=snippet,contentDetails, maxResults=50)
4. Extract video IDs
5. videos.list(part=snippet,statistics,contentDetails,status, id=videoIds)
6. Store snapshots
7. Calculate dashboard metrics
```

## 10.2 Fetch comments for a video

```txt
Input: videoId

1. commentThreads.list(part=snippet,replies, videoId=videoId, maxResults=100)
2. Store comment snapshot if needed
3. Run optional sentiment analysis internally
```

## 10.3 Track trends over time

```txt
1. Run scheduled sync daily or hourly depending on quota budget
2. Store channel/video snapshots
3. Compare current snapshot against previous snapshot
4. Display deltas and trends from stored data
```

This is the only reliable way to create trend charts without OAuth.

---

## 11. API Endpoints Used in Current Public Scope

```http
# Channel metadata and statistics
GET /youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id={CHANNEL_ID}

# Uploads playlist discovery
GET /youtube/v3/channels?part=contentDetails&id={CHANNEL_ID}

# Playlist items / uploaded video IDs
GET /youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={UPLOADS_PLAYLIST_ID}&maxResults=50

# Video details and statistics
GET /youtube/v3/videos?part=snippet,statistics,contentDetails,status&id={VIDEO_IDS}

# Public comments
GET /youtube/v3/commentThreads?part=snippet,replies&videoId={VIDEO_ID}&maxResults=100

# Optional public search
GET /youtube/v3/search?part=snippet&q={QUERY}&type=video&maxResults=25

# Categories and localization
GET /youtube/v3/videoCategories?part=snippet&regionCode={REGION_CODE}
GET /youtube/v3/i18nRegions?part=snippet
GET /youtube/v3/i18nLanguages?part=snippet
```

---

## 12. Implementation Notes

### 12.1 Pagination

Endpoints such as `playlistItems.list`, `commentThreads.list`, and `search.list` can return `nextPageToken`.

Always design methods to accept and return page tokens.

```ts
interface YouTubePagedResponse<T> {
  items: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}
```

### 12.2 Partial responses

Use the `fields` parameter to reduce payload size when appropriate.

Example:

```http
GET /youtube/v3/videos?part=snippet,statistics&id={VIDEO_IDS}&fields=items(id,snippet(title,publishedAt),statistics(viewCount,likeCount,commentCount))&key={API_KEY}
```

This does not necessarily reduce quota cost, but it improves response size and performance.

### 12.3 Error handling

Common errors to handle:

| Error | Meaning | Suggested handling |
|---|---|---|
| `quotaExceeded` | Daily quota exhausted | Stop sync and retry after quota reset. |
| `forbidden` | Access denied | Mark resource inaccessible. |
| `notFound` | Resource does not exist or is unavailable | Skip and log. |
| `commentsDisabled` | Comments disabled for video | Show comments unavailable. |
| `videoNotFound` | Video deleted/private/unavailable | Mark video unavailable. |

---

## 13. Product Recommendations

## 13.1 What to show confidently

- Current subscribers, if visible
- Total channel views
- Total public video count
- Recent uploads
- Per-video views, likes, and comments
- Engagement rate
- Views per day
- Top videos by views
- Top videos by engagement
- Comment volume
- Basic sentiment if calculated internally
- Trends based on our own stored snapshots

## 13.2 What to avoid claiming

Avoid saying the dashboard provides:

- Official watch time
- Official audience retention
- Official subscriber growth source
- Official revenue analytics
- Official CTR
- Official impressions
- Official demographic analytics
- Official traffic source analytics

Unless OAuth-based YouTube Analytics API integration is added later.

## 13.3 Recommended UI wording

Use:

```txt
Snapshot from public YouTube data
```

Use for stored historical charts:

```txt
Trend based on snapshots collected by this system
```

Use for modelled metrics:

```txt
Estimated metric — not provided directly by YouTube API
```

---

## 14. Future Upgrade Path

## Phase 1 — Current public dashboard

- API key only
- Public channel/video/comment data
- Snapshot storage
- Calculated engagement metrics
- Optional estimated metrics with clear labels

## Phase 2 — Owner-authorized analytics

Add Google OAuth 2.0 and YouTube Analytics API.

Unlock:

- Watch time
- Average view duration
- Retention
- Traffic sources
- Demographics
- Geography
- Device types
- Subscriber gains/losses
- Revenue where permitted

## Phase 3 — Bulk reporting

Add YouTube Reporting API for scheduled reports if the project needs high-volume analytics exports.

---

## 15. Final Conclusion

The YouTube Data API v3 with API-key access is enough for a solid public-facing snapshot dashboard. It can show channel performance, recent videos, public engagement, comments, and calculated metrics.

However, it cannot replace YouTube Studio analytics. Any historical trend must be created by storing snapshots over time. Any watch time, retention, revenue, traffic source, demographic, or CTR metric requires OAuth-based YouTube Analytics API access.

The recommended production approach is:

```txt
Use YouTube Data API v3 for public snapshots.
Store snapshots daily.
Calculate trends from stored snapshots.
Clearly label estimated metrics.
Add OAuth later only when true owner analytics are required.
```

