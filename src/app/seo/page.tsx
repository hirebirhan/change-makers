import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import SeoViewWithAuth from "@/components/SeoView";

export const metadata: Metadata = {
  title: "SEO Studio",
  description: "Keyword insights, video SEO scores, Google Trends analysis, and title suggestions for your YouTube channel.",
};

export default async function SeoPage() {
  const data = await getYouTubeData();
  return <SeoViewWithAuth initialData={data} />;
}
