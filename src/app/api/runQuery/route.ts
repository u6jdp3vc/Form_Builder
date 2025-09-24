import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import fs from "fs";
import path from "path";
import { countryDbMap } from "@/app/countryDbMap";

const configBase = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

// Retry connect
async function connectWithRetry(config: any, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = await sql.connect(config);
      if (pool.connected) return pool;
    } catch (err) {
      console.error(`❌ Connect attempt ${i + 1} failed:`, (err as any)?.message || err);
      if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error("Unable to connect to SQL Server after retries");
}

// ฟังก์ชันช่วยในการอ่านข้อมูลจากไฟล์
const readQuestionsFromFile = () => {
  try {
    const filePath = path.join(process.cwd(), "data", "questions.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
    return {}; // ถ้าไม่มีไฟล์ให้คืนค่าเป็นอ็อบเจ็กต์ว่าง
  } catch (err) {
    console.error("Error reading questions from file:", err);
    throw new Error("Error reading questions from file");
  }
};

// ฟังก์ชันช่วยในการบันทึกข้อมูลลงในไฟล์
const saveQuestionsToFile = (data: Record<string, any[]>) => {
  try {
    const filePath = path.join(process.cwd(), "data", "questions.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log("✅ Data saved to questions.json");
  } catch (err) {
    console.error("Error saving questions to file:", err);
  }
};

export async function POST(req: NextRequest) {
  try {
    const { country, queryTemplate } = await req.json();

    if (!country) return NextResponse.json({ error: "Country required" }, { status: 400 });
    if (!queryTemplate?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const countries: string[] = typeof country === "string" ? [country] : country;

    const results: Record<string, any> = {};

    for (const c of countries) {
      const dbName = countryDbMap[c] || countryDbMap[c.replace(/[-_]/g, ' ').trim()] || c;

      let pool: sql.ConnectionPool | null = null;
      try {
        pool = await connectWithRetry({ ...configBase, database: dbName });
        const request = pool.request();
        const result = await request.query(queryTemplate);

        results[c] = {
          dbName,
          rows: result.recordset || [],
          rowsAffected: result.rowsAffected,
        };

        console.log(`✅ Query executed for '${c}' (${dbName}), rows returned: ${result.recordset.length}`);

        // อ่านข้อมูลคำถามจากไฟล์
        let allQuestions = readQuestionsFromFile();

        // อัปเดตข้อมูล optionsFromSQL สำหรับคำถามที่มี value เป็น SQL query
        Object.keys(allQuestions).forEach(formId => {
          const formQuestionsByCountry = allQuestions[formId]; // object: country -> questions[]
          Object.keys(formQuestionsByCountry).forEach(country => {
            const questionsArray = formQuestionsByCountry[country];
            if (!Array.isArray(questionsArray)) return; // ป้องกัน error
            questionsArray.forEach((question: any) => {
              question.options.forEach((option: any) => {
                if (option.byFixedValue) {
                  // ✅ Fixed values → split string เป็น options
                  option.optionsFromSQL = option.value
                    ? option.value.split(",").map((v: string) => ({
                      name: v.trim(),
                      code: v.trim(),
                    }))
                    : [];
                } else if (
                  option.type !== "text" &&
                  option.type !== "date" &&
                  option.value &&
                  option.value.trim().toLowerCase().startsWith("select")
                ) {
                  // ✅ Query DB ปกติ
                  option.optionsFromSQL = Array.isArray(result.recordset)
                    ? result.recordset.map((row: { name: string; code: string }) => ({
                      name: row.name || "Unnamed",
                      code: row.code || "",
                    }))
                    : [];
                } else {
                  option.optionsFromSQL = [];
                }
              });
            });
          });
        });

        // บันทึกข้อมูลคำถามที่มีการอัปเดตแล้ว
        saveQuestionsToFile(allQuestions);

      } catch (err: any) {
        console.error(`❌ Query failed for '${c}' (${dbName}):`, err?.message || err);
        results[c] = { error: err?.message || "Query execution failed" };
      } finally {
        if (pool) await pool.close();
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("POST /api/runQuery error:", err);
    return NextResponse.json({ error: err?.message || "Query execution failed" }, { status: 500 });
  }
}
