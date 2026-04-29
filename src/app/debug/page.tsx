import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { DebugView } from "@/components/DebugView";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE = "https://www.googleapis.com/youtube/v3";

async function fetchRawYouTubeData() {
  if (!API_KEY || !CHANNEL_ID) {
    return { error: "Missing API_KEY or CHANNEL_ID" };
  }

  const channelUrl = `${BASE}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${API_KEY}`;
  const channelRes = await fetch(channelUrl, { cache: "no-store" });
  const channelData = await channelRes.json();

  const uploadsUrl = `${BASE}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
  const uploadsRes = await fetch(uploadsUrl, { cache: "no-store" });
  const uploadsData = await uploadsRes.json();

  const uploadsId = uploadsData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  let playlistData = null;
  let videosData = null;

  if (uploadsId) {
    const playlistUrl = `${BASE}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=20&key=${API_KEY}`;
    const playlistRes = await fetch(playlistUrl, { cache: "no-store" });
    playlistData = await playlistRes.json();

    const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).join(",");

    if (videoIds) {
      const videosUrl = `${BASE}/videos?part=snippet,statistics,contentDetails,status&id=${videoIds}&key=${API_KEY}`;
      const videosRes = await fetch(videosUrl, { cache: "no-store" });
      videosData = await videosRes.json();
    }
  }

  return {
    channelData,
    uploadsData,
    playlistData,
    videosData,
  };
}

export const metadata: Metadata = {
  title: "Debug API",
  description: "View raw YouTube API responses before processing.",
};

export default async function DebugPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";

  if (!isAuthenticated) {
    redirect("/login");
  }

  const data = await getYouTubeData();
  const rawData = await fetchRawYouTubeData();
  return <DebugView initialData={data} rawData={rawData} />;
}
