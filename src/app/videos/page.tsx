import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { VideosView } from "@/components/VideosView";

export const metadata: Metadata = {
  title: "Video Library",
  description: "Browse, search, and sort all your YouTube videos by views, likes, comments, or publish date.",
};

export const revalidate = 300;

export default async function VideosPage() {
  const data = await getYouTubeData();
  return <VideosView initialData={data} />;
}
