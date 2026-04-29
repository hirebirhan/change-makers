import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { calculateGrowthMilestones, calculateUploadStreak } from "@/lib/analytics-utils";
import { GrowthView } from "@/components/GrowthView";

export const metadata: Metadata = {
  title: "Growth Tracking",
  description: "Track your channel growth milestones and upload consistency.",
};

export default async function GrowthPage() {
  const data = await getYouTubeData();
  const milestones = calculateGrowthMilestones(
    data.channel.subscriberCount,
    data.channel.viewCount,
    data.channel.videoCount
  );
  const streak = calculateUploadStreak(data.videos);

  return <GrowthView initialData={data} milestones={milestones} streak={streak} />;
}
