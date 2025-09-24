// src/app/api/checkToken/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ valid: false });

  const payload = await validateToken(token);
  if (!payload) return NextResponse.json({ valid: false });

  return NextResponse.json({
    valid: true,
    username: payload.username,
    level: payload.level,
    role: payload.role,
  });
}
