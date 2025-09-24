import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateToken } from "@/lib/crypto";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token")?.value;

  // ไม่มี token → redirect ไป login พร้อมแนบ redirect param
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirect", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  // decode token
  let payload;
  try {
    payload = await validateToken(token);
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirect", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  const level = payload?.level || 0;

  // Backenduser
  if (url.pathname.startsWith("/backenduser") && level <= 50) {
    url.pathname = "/frontenduser";
    return NextResponse.redirect(url);
  }

  // Frontenduser
  if (url.pathname.startsWith("/frontenduser") && level < 50) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/backenduser/:path*", "/frontenduser/:path*"],
};
