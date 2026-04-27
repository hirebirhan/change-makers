import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import CommentsViewWithAuth from "@/components/CommentsView";

export const metadata: Metadata = {
  title: "Comments",
  description: "Sentiment analysis and browsing of comments across all your YouTube videos.",
};

export default async function CommentsPage() {
  const data = await getYouTubeData();
  return <CommentsViewWithAuth initialData={data} />;
}
