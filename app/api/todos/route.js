import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KEY = "todos_v1";

export async function GET() {
  try {
    const data = await kv.get(KEY);
    return NextResponse.json(data || { groups: [], startDate: null });
  } catch (e) {
    return NextResponse.json(
      { error: "KV read failed" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await kv.set(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "KV write failed" },
      { status: 500 }
    );
  }
}
