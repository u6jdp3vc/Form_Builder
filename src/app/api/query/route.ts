import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

const configBase = {
  user: "sa",
  password: "d2tS@p10",
  server: "10.2.4.103",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: "tp_production",
  },
};

export async function POST(req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;

  try {
    const { country, query, params } = await req.json();

    if (!country?.trim()) {
      return NextResponse.json({ error: "Country required" }, { status: 400 });
    }
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // --- clone config แล้วใส่ DB ตาม country ---
    const config = { ...configBase, database: country };

    pool = await sql.connect(config);

    let request = pool.request();

    if (params && typeof params === "object") {
      for (const key of Object.keys(params)) {
        request = request.input(key, params[key]);
      }
    }

    const result = await request.query(query);

    return NextResponse.json({
      rows: result.recordset || [],
      rowsAffected: result.rowsAffected,
    });
  } catch (err: any) {
    console.error("POST /api/query error:", err);
    return NextResponse.json(
      { error: err.message || "Query execution failed" },
      { status: 500 }
    );
  } finally {
    if (pool) await pool.close();
  }
}
