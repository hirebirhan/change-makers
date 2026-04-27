import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your YouTube channel performance — subscribers, views, top videos, and 30-day analytics.",
};

export default async function Home() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";
  
  if (!isAuthenticated) {
    redirect("/login");
  }
  
  const data = await getYouTubeData();
  return <DashboardView initialData={data} />;
}
