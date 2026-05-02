import type { Metadata } from "next";
import { ShortMakerClient } from "./ShortMakerClient";

export const metadata: Metadata = {
  title: "Short Maker",
  description: "Format, trim, and export videos for Shorts, TikTok, and Reels — processed locally in your browser.",
};

export default async function ShortMakerPage() {
  return <ShortMakerClient />;
}
