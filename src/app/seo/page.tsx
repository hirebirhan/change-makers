import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getYouTubeData } from "@/lib/youtube-server";
import { getSeoData } from "@/lib/seo-server";
import { SeoView } from "@/components/SeoView";

export const metadata: Metadata = {
  title: "SEO Studio",
  description: "Keyword insights, video SEO scores, and title suggestions for your YouTube channel.",
};

export default async function SeoPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";
  
  if (!isAuthenticated) {
    redirect("/login");
  }
  
  const data = await getYouTubeData();
  const seoData = await getSeoData(data.videos);
  
  return <SeoView initialData={data} initialSeoData={seoData} />;
}
