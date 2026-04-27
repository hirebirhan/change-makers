import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { VideosView } from "@/components/VideosView";

export const metadata: Metadata = {
  title: "Video Library",
  description: "Browse, search, and sort all your YouTube videos by views, likes, comments, or publish date.",
};

export default async function VideosPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";
  
  if (!isAuthenticated) {
    redirect("/login");
  }
  
  const data = await getYouTubeData();
  return <VideosView initialData={data} />;
}
