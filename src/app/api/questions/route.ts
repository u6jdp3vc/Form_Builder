import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formId, questions } = body;
    const filePath = path.join(process.cwd(), "questions.json");

    let currentData: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      currentData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    currentData[formId] = questions.map((q: any) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type,
      formId: q.formId,
      options: q.options.map((o: any) => ({
        id: o.id,
        label: o.label,
        paramName: o.paramName,
        type: o.type,
        value: o.value, // เก็บค่าใหม่ที่ user เลือก
        checked: o.checked || false,
        country: o.country || "",
        optionsFromSQL: o.optionsFromSQL || [],  // เพิ่ม optionsFromSQL
        loading: o.loading || false,  // เก็บค่าการโหลด
        mainQuery: o.mainQuery || "",  // เก็บคำสั่ง SQL หากมี
        valueType: o.valueType || "string",  // ค่า default สำหรับ valueType
      })),
    }));

    // บันทึกข้อมูลลงในไฟล์
    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), "utf-8");

    return NextResponse.json({ saved: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
