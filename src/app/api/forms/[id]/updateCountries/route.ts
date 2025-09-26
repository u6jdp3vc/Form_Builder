// path: /app/api/forms/[id]/updateCountries/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import fs from "fs/promises";
import path from "path";

interface Params {
  params: {
    id: string;
  };
}

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: { encrypt: false, trustServerCertificate: true, instanceName: "tp_production" },
};

const shortLinksFile = path.join(process.cwd(), "data", "shortLinks.json");
const questionsFile = path.join(process.cwd(), "data", "questions.json");

async function loadJson(filePath: string) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveJson(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest, context: any) {
  const id = context.params?.id;
  if (!id) {
    return NextResponse.json({ error: "Form Id required" }, { status: 400 });
  }

  const body = await req.json();
  const { countries }: { countries: string[] } = body;
  if (!countries || !countries.length) {
    return NextResponse.json({ error: "No countries provided" }, { status: 400 });
  }

  // --- logic update DB / JSON ---
  const pool = await sql.connect(config);
  await pool
    .request()
    .input("Id", sql.Int, Number(id))
    .input("Country", sql.NVarChar, countries.join(","))
    .query(`UPDATE SavedQueries SET Country = @Country WHERE Id = @Id`);

  const shortLinksData = await loadJson(shortLinksFile);
  if (!shortLinksData[id]) shortLinksData[id] = {};
  countries.forEach((country) => {
    if (!shortLinksData[id][country]) {
      shortLinksData[id][country] = { shortId: `${id}_${country}`, questions: [] };
    }
  });
  Object.keys(shortLinksData[id]).forEach((country) => {
    if (!countries.includes(country)) delete shortLinksData[id][country];
  });
  await saveJson(shortLinksFile, shortLinksData);

  const questionsData = await loadJson(questionsFile);
  if (!questionsData[id]) questionsData[id] = {};
  Object.keys(questionsData[id]).forEach((country) => {
    if (!countries.includes(country)) delete questionsData[id][country];
  });
  countries.forEach((country) => {
    if (!questionsData[id][country]) questionsData[id][country] = [];
  });
  await saveJson(questionsFile, questionsData);

  return NextResponse.json({ success: true, countries });
}
