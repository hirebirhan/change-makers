import { NextRequest, NextResponse } from "next/server";

const DB = process.env.JSON_SERVER_URL ?? "http://localhost:3001";

export async function GET() {
  const res = await fetch(`${DB}/cards`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${DB}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: 201 });
}
