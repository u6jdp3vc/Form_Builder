import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

// ตั้งค่าการเชื่อมต่อ SQL Server
const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

// 📌 GET: ดึงรายการฟอร์มที่บันทึกไว้
export async function GET(req: NextRequest) {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT Id, QueryName, QueryText, Description, Country
      FROM SavedQueries
      ORDER BY Id DESC
    `);

    const forms = result.recordset.map(r => ({
      id: r.Id,
      title: r.QueryName,
      queryText: r.QueryText,
      description: r.Description,
      country: r.Country,
      questions: [], // questions จะโหลดจาก JSON ไฟล์
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

// 📌 POST: บันทึกฟอร์มใหม่
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, country, queryText } = body;

    if (!title || !queryText) {
      return NextResponse.json(
        { error: "Title (QueryName) and QueryText are required" },
        { status: 400 }
      );
    }

    const pool = await sql.connect(config);

    // 🔍 เช็คว่ามี QueryName + Country ซ้ำไหม
    const dupCheck = await pool
      .request()
      .input("QueryName", sql.NVarChar, title.trim())
      .input("Country", sql.NVarChar, country?.trim() || "")
      .query(`
        SELECT TOP 1 Id 
        FROM SavedQueries 
        WHERE QueryName = @QueryName
      `);

    if (dupCheck.recordset.length > 0) {
      return NextResponse.json(
        { error: `Form with title "${title}" already exists.` },
        { status: 400 }
      );
    }

    // ✅ ถ้าไม่ซ้ำ → insert
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

    return NextResponse.json({
      success: true,
      id: result.recordset[0].Id,
    });
  } catch (err: any) {
    console.error("❌ Error saving query:", err);
    return NextResponse.json(
      { error: "Failed to save query", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, queryText, country } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Form Id is required for update" },
        { status: 400 }
      );
    }

    const pool = await sql.connect(config);

    // หา record เดิมด้วย Id
    const existing = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(`
        SELECT Id, QueryName, QueryText, Description, Country
        FROM SavedQueries
        WHERE Id = @Id
      `);

    if (existing.recordset.length === 0) {
      return NextResponse.json(
        { error: `Form with Id ${id} not found.` },
        { status: 404 }
      );
    }

    const oldData = existing.recordset[0];
    const changes: string[] = [];

    if (oldData.Description !== description) changes.push("Description");
    if (oldData.QueryText !== queryText) changes.push("QueryText");
    if (oldData.Country !== country) changes.push("Country");

    if (changes.length === 0) {
      return NextResponse.json({ updated: false, message: "No changes detected" });
    }

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

    return NextResponse.json({ updated: true, changes, id });
  } catch (err: any) {
    console.error("❌ Error updating query:", err);
    return NextResponse.json(
      { error: "Failed to update query", details: err.message },
      { status: 500 }
    );
  }
}

// 📌 DELETE: ลบฟอร์มตาม Id
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Form Id is required for deletion" },
        { status: 400 }
      );
    }

    const pool = await sql.connect(config);

    // ตรวจสอบว่ามี record ไหม
    const existing = await pool
      .request()
      .input("Id", sql.Int, Number(id))
      .query(`SELECT Id FROM SavedQueries WHERE Id = @Id`);

    if (existing.recordset.length === 0) {
      return NextResponse.json(
        { error: `Form with Id ${id} not found` },
        { status: 404 }
      );
    }

    // ลบ record
    await pool
      .request()
      .input("Id", sql.Int, Number(id))
      .query(`DELETE FROM SavedQueries WHERE Id = @Id`);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("❌ Error deleting form:", err);
    return NextResponse.json(
      { error: "Failed to delete form", details: err.message },
      { status: 500 }
    );
  }
}

