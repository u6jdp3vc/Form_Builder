import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });

  // ลบ cookie
  res.cookies.set("token", "", { httpOnly: true, path: "/", sameSite: "lax", maxAge: 0 });
  res.cookies.set("username", "", { httpOnly: true, path: "/", sameSite: "lax", maxAge: 0 });
  res.cookies.set("level", "", { httpOnly: true, path: "/", sameSite: "lax", maxAge: 0 });

  return res;
}
