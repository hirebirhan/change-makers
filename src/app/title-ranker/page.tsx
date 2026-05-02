import type { Metadata } from "next";
import { getYouTubeData } from "@/lib/youtube-server";
import { TitleRankerView } from "@/components/TitleRankerView";

export const metadata: Metadata = {
  title: "Title Ranker",
  description: "Score any YouTube title across 5 SEO dimensions and get ranked alternative suggestions based on your channel's top keywords.",
};

export const revalidate = 300;

export default async function TitleRankerPage() {
  const data = await getYouTubeData();
  return <TitleRankerView initialData={data} />;
}
