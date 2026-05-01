import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShortMakerClient } from "./ShortMakerClient";

export const metadata: Metadata = {
  title: "Short Maker",
  description: "Create a vertical Short from a local video in your browser.",
};

export default async function ShortMakerPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("yt_auth")?.value === "true";

  if (!isAuthenticated) {
    redirect("/login");
  }

  return <ShortMakerClient />;
}
