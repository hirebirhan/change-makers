import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { TitleRankerView } from "@/components/TitleRankerView";

export const metadata: Metadata = {
  title: "Title Ranker",
  description: "Score any YouTube title across 5 SEO dimensions and get ranked alternative suggestions based on your channel's top keywords.",
};

export default async function TitleRankerPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";
  
  if (!isAuthenticated) {
    redirect("/login");
  }
  
  const data = await getYouTubeData();
  return <TitleRankerView initialData={data} />;
}
