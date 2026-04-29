import { getYouTubeData } from "@/lib/youtube-server";
import { PublishingScheduleView } from "@/components/PublishingScheduleView";

export default async function PublishingSchedulePage() {
  const data = await getYouTubeData();

  return <PublishingScheduleView initialData={data} />;
}
