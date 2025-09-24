// /api/loadCountryDB.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { countryDbMap } from "@/app/countryDbMap";

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};
console.log("Connecting with config:", config);

// retry connection (ไม่ต้องระบุ database ตอน connect)
async function connectWithRetry(config: any, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const pool = await sql.connect({
        user: config.user,
        password: config.password,
        server: config.server,
        options: {
          encrypt: config.options.encrypt,
          trustServerCertificate: config.options.trustServerCertificate,
          instanceName: config.options.instanceName,
        },
      });
      return pool;
    } catch (err: any) {
      console.error(`❌ Connect attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("Unable to connect to SQL Server");
}

export async function POST(req: NextRequest) {
  try {
    const { country } = await req.json();
    if (!country) return NextResponse.json({ error: "No country provided" }, { status: 400 });

    const countries: string[] = typeof country === "string" ? [country] : country;
    if (!Array.isArray(countries) || countries.length === 0)
      return NextResponse.json({ error: "Countries must be a string or non-empty array" }, { status: 400 });

    const pool = await connectWithRetry(config);
    const loadedDbs: string[] = [];

    for (const c of countries) {
      const normalized = c.trim();
      const dbName = countryDbMap[normalized];

      if (!dbName) {
        console.warn(`⚠️ No database mapping for country '${c}'`);
        continue;
      }

      try {
        // เลือก database
        await pool.request().query(`USE [${dbName}]`);

        // ตรวจสอบว่า database มีจริง
        const check = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);
        if (check.recordset.length === 0) {
          console.warn(`⚠️ Database '${dbName}' does not exist`);
          continue;
        }

        console.log(`✅ Country DB loaded: ${dbName}`);
        loadedDbs.push(dbName);
      } catch (err: any) {
        console.error(`Failed to load DB for country '${c}':`, err.message);
      }
    }

    await pool.close();

    if (loadedDbs.length === 0) {
      return NextResponse.json({ error: "No valid country DB loaded" }, { status: 400 });
    }

    return NextResponse.json({ success: true, loadedDbs });
  } catch (err: any) {
    console.error("Failed to load country DB:", err);
    return NextResponse.json({ error: err.message || "Failed to load country DB" }, { status: 500 });
  }
}
