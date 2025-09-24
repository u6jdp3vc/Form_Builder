import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const filePath = path.join(process.cwd(), 'data', 'shortLinks.json');

export async function POST(req: NextRequest) {
    try {
        const { selectedFormId, countries, questions } = await req.json();

        if (!selectedFormId || !countries?.length || !questions?.length) {
            return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
        }

        let data: Record<string, any> = {};
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            data = fileData ? JSON.parse(fileData) : {};
        }

        if (!data[selectedFormId]) data[selectedFormId] = {};

        countries.forEach((country: string | number) => {
            const shortId = nanoid(8);
            data[selectedFormId][country] = { shortId, questions };
        });

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

        return NextResponse.json({ success: true, shortId: data[selectedFormId][countries[0]].shortId });
    } catch (err) {
        console.error('Error saving state:', err);
        return NextResponse.json({ success: false, error: 'Failed to save state' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { selectedFormId, country, questions } = await req.json();

        if (!selectedFormId || !country || !questions?.length) {
            return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
        }

        let data: Record<string, any> = {};
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            data = fileData ? JSON.parse(fileData) : {};
        }

        if (!data[selectedFormId]) {
            return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
        }

        // อัปเดต questions สำหรับ country นั้น
        data[selectedFormId][country] = {
            ...data[selectedFormId][country],
            questions,
        };

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error updating state:', err);
        return NextResponse.json({ success: false, error: 'Failed to update state' }, { status: 500 });
    }
}