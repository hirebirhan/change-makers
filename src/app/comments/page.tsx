import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { fetchCommentsForVideos } from "@/lib/comments-server";
import { CommentsView } from "@/components/CommentsView";

export const metadata: Metadata = {
  title: "Comments",
  description: "Sentiment analysis and browsing of comments across all your YouTube videos.",
};

export const revalidate = 300;

export default async function CommentsPage() {
  const data = await getYouTubeData();
  const commentsData = await fetchCommentsForVideos(
    data.videos.map((video) => video.id),
    data.videos
  );

  return <CommentsView initialData={data} initialCommentsData={commentsData} />;
}
