// /app/api/getOptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql, { ConnectionPool } from "mssql";
import { countryMap } from "@/app/frontenduser/components/QuestionCard";

const configBase = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function POST(req: NextRequest) {
  const { country, value } = await req.json();
  console.log("Request body:", { country, value });
  if (!country || !value) {
    return NextResponse.json(
      { success: false, error: "Missing country or value" },
      { status: 400 }
    );
  }

  let pool: ConnectionPool | undefined;

  try {
    // ใช้ country เป็น database
    pool = await sql.connect({ ...configBase});
    console.log("Connecting to DB for country:", country);
    console.log("SQL query:", value);
    console.log("Connected successfully");

    const dbName = countryMap[country]; // AS-DTGTHA
    const result = await pool.request().query(`USE [${dbName}]; ${value}`); //countryMap['Thailand'] = 'AS-DTGTHA'
    console.log("Query executed, rows:", result.recordset.length);

    const options = result.recordset.map((r: any) => ({
      name: r.name,
      code: r.code,
    }));

    return NextResponse.json({ success: true, options });
  } catch (err: any) {
    console.error("DB query error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log("Connection closed");
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}
