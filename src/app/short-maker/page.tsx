import type { Metadata } from "next";
import { ShortMakerClient } from "./ShortMakerClient";

export const metadata: Metadata = {
  title: "Video Format Studio",
  description: "Format and export local videos in your browser.",
};

export default async function ShortMakerPage() {
  return <ShortMakerClient />;
}
