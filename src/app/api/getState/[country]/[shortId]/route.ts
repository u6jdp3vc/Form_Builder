import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import fs from "fs";
import path from "path";

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

export async function GET(req: NextRequest) {
  try {
    // สำหรับ App Router dynamic routes, params มาจาก URLPath
    const { pathname } = req.nextUrl;
    // pathname ตัวอย่าง: /api/getState/AS-DTGBTN/12345
    const pathParts = pathname.split("/").filter(Boolean);
    const country = pathParts[pathParts.length - 2];
    const shortId = pathParts[pathParts.length - 1];

    if (!shortId) return NextResponse.json({ success: false, error: "Missing shortId" });

    const filePath = path.join(process.cwd(), "data", "shortLinks.json");
    if (!fs.existsSync(filePath)) return NextResponse.json({ success: false, error: "No shortLinks found" });

    const allLinks = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const link = allLinks[shortId];
    if (!link) return NextResponse.json({ success: false, error: "ShortId not found" });

    const selectedFormId = link.selectedFormId;

    // ดึง QueryText จาก DB
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("id", sql.Int, parseInt(selectedFormId))
      .query(`SELECT Id, QueryText, QueryName, Description FROM savedqueries WHERE Id = @id`);

    if (result.recordset.length === 0) {
      return NextResponse.json({ success: false, error: "Form not found in DB" });
    }

    const savedForm = result.recordset[0];

    const countryMap: Record<string, string> = {
      "AS-DTGBTN": "Bhutan",
      "AS-DTGGER": "Germany",
      "AS-DTGJPN": "Japan",
      "AS-DTGKHM": "Cambodia",
      "AS-DTGKUL": "Malaysia",
      "AS-DTGLAO": "Laos",
      "AS-DTGMAL": "Maldives",
      "AS-DTGMMR": "Myanmar",
      "AS-DTGPHL": "Philippines",
      "AS-DTGSIN": "Singapore",
      "AS-DTGSLK": "Sri Lanka",
      "AS-DTGTHA": "Thailand",
      "AS-DTGVNM": "Vietnam",
    };
    const readableCountry = countryMap[country] || country;

    const state = {
      selectedFormId,
      countries: [readableCountry],   // สำหรับ UI
      countryCode: country,           // สำหรับ DB
      questions: (link.questions || []).map((q: any) => ({
        ...q,
        mainQuery: savedForm.QueryText,
        formId: savedForm.Id,
        country: country,              // ใช้รหัสตอน connect DB
        title: `${q.title} (${readableCountry})`,
      })),
    };

    return NextResponse.json({ success: true, state });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to get state" }, { status: 500 });
  }
}
