import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sql from "mssql";

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function GET(req: NextRequest) {
  const shortId = req.nextUrl.searchParams.get("shortId");
  if (!shortId) return NextResponse.json({ success: false, error: "Missing shortId" }, { status: 400 });

  const filePath = path.join(process.cwd(), "data", "shortLinks.json");
  if (!fs.existsSync(filePath)) return NextResponse.json({ success: false, error: "No data found" }, { status: 404 });

  const allLinks = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Search shortId
  let state: any = null;
  for (const formId in allLinks) {
    for (const country in allLinks[formId]) {
      if (allLinks[formId][country].shortId === shortId) {
        state = { selectedFormId: formId, country, ...allLinks[formId][country] };
        break;
      }
    }
    if (state) break;
  }

  if (!state) return NextResponse.json({ success: false, error: "State not found" }, { status: 404 });

  // เช็คว่า optionsFromSQL ว่างไหม ถ้าว่างให้ดึงจาก DB
  const needsDbFetch = state.questions.some((q: any) =>
    q.options.some((o: any) => !o.optionsFromSQL || !o.optionsFromSQL.length)
  );

  if (needsDbFetch) {
    try {
      const pool = await sql.connect(config);
      for (const q of state.questions) {
        for (const o of q.options) {
          if (!o.optionsFromSQL || !o.optionsFromSQL.length) {
            const result = await pool.request().query(o.value); // o.value = SQL template
            o.optionsFromSQL = result.recordset.map((r: any) => ({ name: r.name, code: r.code }));
          }
        }
      }
    } catch (err) {
      console.error("DB fetch error:", err);
    }
  }

  return NextResponse.json({ success: true, state });
}
