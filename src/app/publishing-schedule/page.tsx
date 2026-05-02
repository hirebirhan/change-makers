import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { PublishingScheduleView } from "@/components/PublishingScheduleView";

export const metadata: Metadata = {
  title: "Publishing Schedule",
  description: "Recommended upload schedule based on your channel's best-performing days and times.",
};

export const revalidate = 300;

export default async function PublishingSchedulePage() {
  const data = await getYouTubeData();

  return <PublishingScheduleView initialData={data} />;
}
