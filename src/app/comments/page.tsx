import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { CommentsView } from "@/components/CommentsView";

export const metadata: Metadata = {
  title: "Comments",
  description: "Sentiment analysis and browsing of comments across all your YouTube videos.",
};

export default async function CommentsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";
  
  if (!isAuthenticated) {
    redirect("/login");
  }
  
  const data = await getYouTubeData();
  return <CommentsView initialData={data} />;
}
