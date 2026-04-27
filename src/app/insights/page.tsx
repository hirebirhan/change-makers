import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import {
  analyzeTagsFromVideos,
  analyzeUploadFrequency,
  analyzeVideoLengthDistribution,
} from "@/lib/analytics-utils";
import { InsightsView } from "@/components/InsightsView";

export const metadata: Metadata = {
  title: "Content Insights",
  description: "Analyze your content strategy with tag analysis, upload patterns, and video length insights.",
};

export default async function InsightsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";

  if (!isAuthenticated) {
    redirect("/login");
  }

  const data = await getYouTubeData();
  const tagAnalysis = analyzeTagsFromVideos(data.videos);
  const uploadFrequency = analyzeUploadFrequency(data.videos);
  const lengthDistribution = analyzeVideoLengthDistribution(data.videos);

  return (
    <InsightsView
      initialData={data}
      tagAnalysis={tagAnalysis}
      uploadFrequency={uploadFrequency}
      lengthDistribution={lengthDistribution}
    />
  );
}
