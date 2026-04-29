import { NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE = "https://www.googleapis.com/youtube/v3";

export async function GET() {
  if (!API_KEY || !CHANNEL_ID) {
    return NextResponse.json({ error: "Missing API_KEY or CHANNEL_ID" }, { status: 500 });
  }

  try {
    // Fetch channel data
    const channelUrl = `${BASE}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${API_KEY}`;
    const channelRes = await fetch(channelUrl, { cache: "no-store" });
    const channelData = await channelRes.json();

    // Fetch uploads playlist
    const uploadsUrl = `${BASE}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
    const uploadsRes = await fetch(uploadsUrl, { cache: "no-store" });
    const uploadsData = await uploadsRes.json();

    const uploadsId = uploadsData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    let playlistData = null;
    let videosData = null;

    if (uploadsId) {
      // Fetch playlist items
      const playlistUrl = `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=20&key=${API_KEY}`;
      const playlistRes = await fetch(playlistUrl, { cache: "no-store" });
      playlistData = await playlistRes.json();

      const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).join(",");

      if (videoIds) {
        // Fetch video details
        const videosUrl = `${BASE}/videos?part=snippet,statistics,contentDetails,status&id=${videoIds}&key=${API_KEY}`;
        const videosRes = await fetch(videosUrl, { cache: "no-store" });
        videosData = await videosRes.json();
      }
    }

    return NextResponse.json({
      channelData,
      uploadsData,
      playlistData,
      videosData,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch YouTube data" }, { status: 500 });
  }
}
