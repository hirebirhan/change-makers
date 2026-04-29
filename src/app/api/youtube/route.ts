import { NextResponse } from "next/server";
import { getYouTubeData } from "@/lib/youtube-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getYouTubeData());
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch YouTube data" },
      { status: 502 }
    );
  }
}
