import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import AIViewWithAuth from "@/components/AIView";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "AI-powered channel analysis, video topic ideas, description writing, and title optimization using Google Gemini.",
};

export default async function AIPage() {
  const data = await getYouTubeData();
  return <AIViewWithAuth initialData={data} />;
}
