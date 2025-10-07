import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { createToken } from "@/lib/crypto";

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function POST(req: NextRequest) {
  const { username, password, redirect } = await req.json();
  const pool = await sql.connect(config);
  const nineHours = 9 * 60 * 60;

  const result = await pool
    .request()
    .input("username", sql.VarChar, username)
    .query("SELECT TOP 1 username, password, level, status FROM dbo.excel_login WHERE username=@username");

  const user = result.recordset[0];

  if (!user || user.password !== password) {
    return NextResponse.json({ success: false, message: "Username หรือ Password ไม่ถูกต้อง" });
  }

  if (user.status === 0) {
    return NextResponse.json({ success: false, message: "บัญชีถูกระงับ" });
  }

  // อ่าน redirect parameter จาก referer
  const redirectHeader = req.headers.get("referer") || "";
  const url = new URL(redirectHeader, process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
  const redirectPath = url.pathname;

  // ฟังก์ชันช่วยลบ cookies
  const clearCookies = (message: string) => {
    const res = NextResponse.json({ success: false, message });
    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    res.cookies.set("username", "", { path: "/", maxAge: 0 });
    res.cookies.set("level", "", { path: "/", maxAge: 0 });
    return res;
  };

  // ❌ level < 50 → ไม่มีสิทธิ์
  if (user.level < 50) {
    return clearCookies("You do not have permission to access this page.");
  }

  // ⚠️ level == 50 แต่ไม่มี redirect → ห้ามเข้าโดยตรง


  if (user.level === 50 && !redirect) {
    return clearCookies("Please access this page through the provided link only.");
  }

  // ✅ ผ่านทุกเงื่อนไข
  const token = await createToken(user.username, user.level);
  const redirectUrl = user.level > 50 ? "/backenduser" : redirectPath || "/frontenduser";

  const res = NextResponse.json({
    success: true,
    level: user.level,
    redirectUrl,
  });

  res.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: nineHours,
  });
  res.cookies.set("username", user.username, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: nineHours,
  });
  res.cookies.set("level", String(user.level), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: nineHours,
  });

  return res;
}
