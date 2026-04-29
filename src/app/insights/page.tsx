import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { InsightsView } from "@/components/InsightsView";

export const metadata: Metadata = {
  title: "Content Insights",
  description: "Actionable recommendations to grow your YouTube channel.",
};

export default async function InsightsPage() {
  const data = await getYouTubeData();

  return <InsightsView initialData={data} />;
}
