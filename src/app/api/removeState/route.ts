import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'shortLinks.json');

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('DELETE /api/removeState body:', body);

    const { formId, country, countries } = body;

    if (!formId || (!country && (!countries || countries.length === 0))) {
      return NextResponse.json({ success: false, error: 'Missing formId or country(s)' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Data file not found' }, { status: 404 });
    }

    const fileData = fs.readFileSync(filePath, 'utf-8');
    const data: Record<string, any> = fileData ? JSON.parse(fileData) : {};

    if (!data[formId]) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    const countriesToDelete = countries || (country ? [country] : []);
    let deletedAtLeastOne = false;

    for (const c of countriesToDelete) {
      if (data[formId][c]) {
        delete data[formId][c];
        deletedAtLeastOne = true;
      }
    }

    // ถ้า formId ไม่มี country เลย → ลบ formId ทั้งหมด
    if (Object.keys(data[formId]).length === 0) {
      delete data[formId];
    }

    if (!deletedAtLeastOne) {
      return NextResponse.json({ success: false, error: 'No matching countries found to delete' }, { status: 404 });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error removing state:', err);
    return NextResponse.json({ success: false, error: 'Failed to remove state' }, { status: 500 });
  }
}
