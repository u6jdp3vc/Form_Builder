import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function GET(req: NextRequest, context: any) {
  try {
    // ✅ ต้อง await params
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ countries: [] });

    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("Id", sql.Int, Number(id))
      .query("SELECT Country FROM SavedQueries WHERE Id = @Id");

    const countriesStr = result.recordset[0]?.Country || "";
    const countries = countriesStr ? countriesStr.split(",") : [];

    return NextResponse.json({ countries });
  } catch (err) {
    console.error("Error fetching countries:", err);
    return NextResponse.json({ countries: [], error: "Failed to fetch countries" }, { status: 500 });
  }
}
