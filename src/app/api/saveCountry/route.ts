import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    let { formId, countries } = await req.json();

    if (!formId) {
      return NextResponse.json({ success: false, error: 'Missing formId' }, { status: 400 });
    }

    // ถ้า countries เป็น string → แปลงเป็น array
    if (typeof countries === 'string') {
      countries = [countries];
    }

    // ถ้าไม่ใช่ array หรือ array ว่าง → ตั้งเป็น array ว่าง
    if (!Array.isArray(countries)) {
      countries = [];
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    const filePath = path.join(dataDir, 'questions.json');

    let questionsData: Record<string, any[]> = {};
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      questionsData = fileData ? JSON.parse(fileData) : {};
    }

    if (questionsData[formId]) {
      // อัปเดต countries ในทุก option ของ question
      questionsData[formId] = questionsData[formId].map(q => ({
        ...q,
        options: q.options.map((o: any) => ({
          ...o,
          countries,
        })),
      }));
    } else {
      // สร้าง object ใหม่ ถ้าไม่มี formId
      questionsData[formId] = [
        {
          id: formId,
          title: "Default Question",
          description: "Auto generated question",
          type: "text",
          formId,
          options: [
            {
              id: `option-${Date.now()}`,
              label: "Default Option",
              paramName: "",
              value: "",
              type: "dropdown",
              checked: true,
              countries,
              optionsFromSQL: [],
            },
          ],
        },
      ];
    }

    fs.writeFileSync(filePath, JSON.stringify(questionsData, null, 2), 'utf-8');

    return NextResponse.json({ success: true, countries });
  } catch (err) {
    console.error('Error saving countries:', err);
    return NextResponse.json({ success: false, error: 'Failed to save countries' }, { status: 500 });
  }
}
