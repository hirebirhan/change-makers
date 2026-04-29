import { NextRequest, NextResponse } from "next/server";
import { fetchCommentsForVideos } from "@/lib/comments-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { videoIds?: unknown };
    const videoIds = Array.isArray(body.videoIds)
      ? body.videoIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];

    return NextResponse.json(await fetchCommentsForVideos(videoIds));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
