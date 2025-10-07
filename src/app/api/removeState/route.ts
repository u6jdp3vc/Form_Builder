import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'shortLinks.json');

export async function DELETE(req: NextRequest) {
  try {
    const { formId, country } = await req.json();

    if (!formId || !country) {
      return NextResponse.json({ success: false, error: 'Missing formId or country' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Data file not found' }, { status: 404 });
    }

    const fileData = fs.readFileSync(filePath, 'utf-8');
    const data: Record<string, any> = fileData ? JSON.parse(fileData) : {};

    if (!data[formId] || !data[formId][country]) {
      return NextResponse.json({ success: false, error: 'Form or country not found' }, { status: 404 });
    }

    // ลบ country นั้น
    delete data[formId][country];

    // ถ้า formId ไม่มี country เลย → ลบ formId ทั้งหมด
    if (Object.keys(data[formId]).length === 0) {
      delete data[formId];
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error removing state:', err);
    return NextResponse.json({ success: false, error: 'Failed to remove state' }, { status: 500 });
  }
}
