// src/app/api/getPayload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  try {
    const payload = await validateToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: "Failed to get payload" }, { status: 500 });
  }
}

