import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'questions.json');

export async function POST(req: NextRequest) {
  try {
    const { formId, countries, questions } = await req.json();

    if (!formId || !Array.isArray(countries) || countries.length === 0 || !Array.isArray(questions)) {
      return NextResponse.json({ success: false, error: 'Missing formId, countries, or questions' }, { status: 400 });
    }

    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    // โหลดไฟล์เดิม
    let data: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      data = raw ? JSON.parse(raw) : {};
    }

    if (!data[formId]) data[formId] = {};

    // อัปเดต questions สำหรับแต่ละ country
    countries.forEach(c => {
      data[formId][c] = questions;
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error saving questions:', err);
    return NextResponse.json({ success: false, error: 'Failed to save questions' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const formId = req.nextUrl.searchParams.get('formId');
    const country = req.nextUrl.searchParams.get('country');

    if (!formId) {
      return NextResponse.json({ success: false, error: 'Missing formId' }, { status: 400 });
    }

    let data: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      data = raw ? JSON.parse(raw) : {};
    }

    let questions: any[] = [];
    if (country) {
      questions = data[formId]?.[country] || [];
    } else {
      const allCountries = data[formId] || {};
      questions = Object.values(allCountries).flat();
    }

    return NextResponse.json({
      success: true,
      questions,
      questionsByCountry: data[formId] || {}   // 👈 เพิ่มตรงนี้
    });
  } catch (err) {
    console.error('Error reading questions:', err);
    return NextResponse.json({ success: false, error: 'Failed to read questions' }, { status: 500 });
  }
}

