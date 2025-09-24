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
  const { username, password } = await req.json();
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

  const token = await createToken(user.username, user.level);
  const redirectUrl = user.level > 50 ? "/backenduser" : "/frontenduser";

  const res = NextResponse.json({ success: true, redirectUrl });

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

