import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { PublishingScheduleView } from "@/components/PublishingScheduleView";

export default async function PublishingSchedulePage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("yt_auth");

  if (!authCookie || authCookie.value !== "true") {
    redirect("/login");
  }

  const data = await getYouTubeData();

  return <PublishingScheduleView initialData={data} />;
}
