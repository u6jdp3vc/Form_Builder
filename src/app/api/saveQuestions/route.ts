import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'questions.json');

export async function POST(req: NextRequest) {
  try {
    const { formId, country, questions } = await req.json();

    if (!formId || !country || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing formId, country, or questions' }, { status: 400 });
    }

    // ตรวจสอบว่ามีโฟลเดอร์ data ถ้าไม่มี ให้สร้าง
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // อ่านไฟล์เดิม (ถ้าไม่มีจะสร้าง object ใหม่)
    let data: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      data = raw ? JSON.parse(raw) : {};
    }

    // สร้าง object ถ้ายังไม่มี
    if (!data[formId]) data[formId] = {};
    data[formId][country] = questions;

    // เขียนไฟล์ใหม่
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('Questions saved to:', filePath);

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
      console.log("Raw questions.json content:", raw);
      data = raw ? JSON.parse(raw) : {};
    }

    let questions: any[] = [];
    if (country) {
      questions = data[formId]?.[country] || [];
    } else {
      // ถ้าไม่มี country ให้รวม questions ของทุกประเทศเป็น array เดียว
      const allCountries = data[formId] || {};
      questions = Object.values(allCountries).flat(); // flatten array ของแต่ละประเทศ
    }

    return NextResponse.json({ success: true, questions });
  } catch (err) {
    console.error('Error reading questions:', err);
    return NextResponse.json({ success: false, error: 'Failed to read questions' }, { status: 500 });
  }
}
