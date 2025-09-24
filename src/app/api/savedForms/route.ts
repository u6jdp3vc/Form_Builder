import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { validateToken } from "@/lib/crypto";

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function GET(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const payload = await validateToken(token);
        if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        if (!(
            (payload.role === "backenduser" && payload.level >= 50) ||
            (payload.role === "frontenduser" && payload.level === 50)
        )) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
      SELECT Id, QueryName, Description, QueryText, Country
      FROM SavedQueries
    `);

        // แปลง data ให้ตรงกับ client
        const forms = result.recordset.map(r => ({
            id: String(r.Id), // ✅ แปลงเป็น string
            title: r.QueryName,
            description: r.Description,
            country: r.Country,
            queryText: r.QueryText,
            questions: [],
        }));

        return NextResponse.json({ forms });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
