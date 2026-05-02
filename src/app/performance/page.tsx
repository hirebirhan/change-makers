import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { analyzeVideoPerformance } from "@/lib/analytics-utils";
import { PerformanceView } from "@/components/PerformanceView";

export const metadata: Metadata = {
  title: "Performance",
  description: "Track your best and worst performing videos with detailed metrics.",
};

export const revalidate = 300;

export default async function PerformancePage() {
  const data = await getYouTubeData();
  const performance = analyzeVideoPerformance(data.videos);

  return <PerformanceView initialData={data} performance={performance} />;
}
