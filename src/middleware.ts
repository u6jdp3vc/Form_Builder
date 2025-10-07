import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateToken } from "@/lib/crypto";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirect", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  let payload;
  try {
    payload = await validateToken(token);
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirect", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  const level = Number(payload?.level) || 0;

  // อ่าน redirect param จาก query
  const redirect = url.searchParams.get("redirect");

  // backenduser: level ต้อง > 50
  if (url.pathname.startsWith("/backenduser") && level <= 50) {
    if (redirect) {
      // มี redirect → อนุญาตให้ไป redirect URL เดิม
      url.pathname = redirect;
      url.searchParams.delete("redirect");
      return NextResponse.redirect(url);
    } else {
      // ไม่มี redirect → redirect /
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // frontenduser: level ต้อง >= 50 หรือ level < 50 → redirect /
  if (url.pathname.startsWith("/frontenduser") && level < 50) {
    url.pathname = "/";
    url.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/backenduser/:path*", "/frontenduser/:path*"],
};
