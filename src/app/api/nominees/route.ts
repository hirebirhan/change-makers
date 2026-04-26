import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.changemakeraward.com/api/public/nominees", {
      cache: "no-store",
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch nominees: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch nominees" },
      { status: 500 }
    );
  }
}
