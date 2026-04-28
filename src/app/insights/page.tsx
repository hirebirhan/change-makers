import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { InsightsView } from "@/components/InsightsView";

export const metadata: Metadata = {
  title: "Content Insights",
  description: "Actionable recommendations to grow your YouTube channel.",
};

export default async function InsightsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";

  if (!isAuthenticated) {
    redirect("/login");
  }

  const data = await getYouTubeData();

  return <InsightsView initialData={data} />;
}
