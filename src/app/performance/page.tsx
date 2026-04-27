import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { analyzeVideoPerformance } from "@/lib/analytics-utils";
import { PerformanceView } from "@/components/PerformanceView";

export const metadata: Metadata = {
  title: "Performance",
  description: "Track your best and worst performing videos with detailed metrics.",
};

export default async function PerformancePage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";

  if (!isAuthenticated) {
    redirect("/login");
  }

  const data = await getYouTubeData();
  const performance = analyzeVideoPerformance(data.videos);

  return <PerformanceView initialData={data} performance={performance} />;
}
