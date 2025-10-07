// src/app/api/getPayload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateToken, createToken } from "@/lib/crypto";
import sql from "mssql";

const configBase = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  try {
    // ตรวจสอบ token แต่จะไม่พึ่ง level ใน token
    const payload = await validateToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // ดึง level ล่าสุดจาก DB โดยตรง
    const pool = await sql.connect(configBase);
    const result = await pool
      .request()
      .input("username", sql.VarChar, payload.username)
      .query("SELECT level FROM excel_login WHERE username = @username");

    const currentLevel = result.recordset[0]?.level ?? 0;

    // สร้าง token ใหม่ถ้า level เปลี่ยน
    if (currentLevel !== payload.level) {
      const newToken = await createToken(payload.username, currentLevel);
      const res = NextResponse.json({ username: payload.username, level: currentLevel });
      res.cookies.set("token", newToken, { httpOnly: true, path: "/", maxAge: 3600 });
      return res;
    }

    return NextResponse.json({ username: payload.username, level: currentLevel });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get payload" }, { status: 500 });
  }
}
