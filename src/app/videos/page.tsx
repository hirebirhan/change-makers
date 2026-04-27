import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import VideosViewWithAuth from "@/components/VideosView";

export const metadata: Metadata = {
  title: "Video Library",
  description: "Browse, search, and sort all your YouTube videos by views, likes, comments, or publish date.",
};

export default async function VideosPage() {
  const data = await getYouTubeData();
  return <VideosViewWithAuth initialData={data} />;
}
