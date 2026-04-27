import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import DashboardViewWithAuth from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your YouTube channel performance — subscribers, views, top videos, and 30-day analytics.",
};

export default async function Home() {
  const data = await getYouTubeData();
  return <DashboardViewWithAuth initialData={data} />;
}
