import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import fs from "fs/promises";
import path from "path";

// ตั้งค่าการเชื่อมต่อ SQL Server
const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

// path ไปที่ไฟล์ questions.json
const questionsFile = path.join(process.cwd(), "data", "questions.json");
const shortLinksFile = path.join(process.cwd(), "data", "shortLinks.json");
async function loadJson(filePath: string) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}
// helper โหลดไฟล์
async function loadQuestions() {
  try {
    const data = await fs.readFile(questionsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return {}; // ถ้าไฟล์ยังไม่มี ให้คืน {} 
  }
}

// helper บันทึกไฟล์
async function saveQuestions(data: any) {
  await fs.writeFile(questionsFile, JSON.stringify(data, null, 2), "utf-8");
}

async function saveJson(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// 📌 GET: ดึงฟอร์มพร้อม questions
export async function GET(req: NextRequest) {
  try {
    const pool = await sql.connect(config);

    // ดึงฟอร์มทั้งหมดจาก DB
    const formsResult = await pool.request().query(`
      SELECT Id, QueryName, QueryText, Description, Country
      FROM SavedQueries
      ORDER BY Id DESC
    `);

    // โหลด questions จากไฟล์
    const questionsData = await loadQuestions();

    const forms = formsResult.recordset.map((r) => ({
      id: r.Id,
      title: r.QueryName,
      description: r.Description,
      country: r.Country,
      queryText: r.QueryText,
      questions: questionsData[r.Id] || [],
    }));

    return NextResponse.json({ forms });
  } catch (err: any) {
    console.error("❌ Error fetching forms:", err);
    return NextResponse.json(
      { error: "Failed to fetch forms", details: err.message },
      { status: 500 }
    );
  }
}

// 📌 POST: สร้างฟอร์มใหม่พร้อม questions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, country, queryText, questions } = body;

    if (!title || !queryText) {
      return NextResponse.json(
        { error: "Title and QueryText are required" },
        { status: 400 }
      );
    }

    const pool = await sql.connect(config);
    console.log({
  title, titleLength: title.length,
  queryText, queryTextLength: queryText.length,
  description, descriptionLength: description.length,
  country, countryLength: country.length
});
    // insert ฟอร์ม
    const result = await pool
      .request()
      .input("QueryName", sql.NVarChar, title.trim())
      .input("QueryText", sql.NVarChar, queryText)
      .input("Description", sql.NVarChar, description || "")
      .input("Country", sql.NVarChar, country?.trim() || "")
      .query(`
        INSERT INTO SavedQueries (QueryName, QueryText, Description, Country)
        OUTPUT INSERTED.Id
        VALUES (@QueryName, @QueryText, @Description, @Country)
      `);

    const newFormId = result.recordset[0].Id;

    // save questions ลงไฟล์
    if (questions?.length > 0) {
      const questionsData = await loadQuestions();
      questionsData[newFormId] = questions;
      await saveQuestions(questionsData);
    }

    return NextResponse.json({ success: true, id: newFormId });
  } catch (err: any) {
    console.error("❌ Error saving form:", err);
    return NextResponse.json(
      { error: "Failed to save form", details: err.message },
      { status: 500 }
    );
  }
}

// 📌 PUT: อัปเดตฟอร์มพร้อม questions
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, country, queryText, questions } = body;

    if (!id) return NextResponse.json({ error: "Form Id required" }, { status: 400 });

    const pool = await sql.connect(config);

    // อัปเดตฟอร์มใน DB
    await pool
      .request()
      .input("QueryText", sql.NVarChar, queryText || "")
      .input("Description", sql.NVarChar, description || "")
      .input("Country", sql.NVarChar, country?.trim() || "")
      .input("Id", sql.Int, id)
      .query(`
        UPDATE SavedQueries
        SET QueryText = @QueryText,
            Description = @Description,
            Country = @Country
        WHERE Id = @Id
      `);

    // update questions ในไฟล์
    if (questions) {
      const questionsData = await loadQuestions();
      questionsData[id] = questions;
      await saveQuestions(questionsData);
    }

    return NextResponse.json({ updated: true, id });
  } catch (err: any) {
    console.error("❌ Error updating form:", err);
    return NextResponse.json(
      { error: "Failed to update form", details: err.message },
      { status: 500 }
    );
  }
}

// 📌 DELETE: ลบฟอร์มพร้อม questions
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Form Id required" }, { status: 400 });

    const pool = await sql.connect(config);

    // ลบ form ใน DB
    await pool
      .request()
      .input("Id", sql.Int, Number(id))
      .query(`DELETE FROM SavedQueries WHERE Id = @Id`);

    // ลบ question ในไฟล์
    const questionsData = await loadJson(questionsFile);
    delete questionsData[id];
    await saveJson(questionsFile, questionsData);

    // ลบ shortLinks ใน shortLinks.json
    const shortLinksData = await loadJson(shortLinksFile);
    delete shortLinksData[id];
    await saveJson(shortLinksFile, shortLinksData);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("❌ Error deleting form:", err);
    return NextResponse.json(
      { error: "Failed to delete form", details: err.message },
      { status: 500 }
    );
  }
}
