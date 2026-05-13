import { NextRequest, NextResponse } from "next/server";

const DB = process.env.JSON_SERVER_URL ?? "http://localhost:3001";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${DB}/cards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await fetch(`${DB}/cards/${id}`, { method: "DELETE" });
  return NextResponse.json({ ok: true });
}
