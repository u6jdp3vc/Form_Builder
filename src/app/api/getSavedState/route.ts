// app/api/getSavedState/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const formId = req.nextUrl.searchParams.get("formId");
    const country = req.nextUrl.searchParams.get("country");

    if (!formId || !country) {
      return NextResponse.json({ success: false, error: "Missing formId or country" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "shortLinks.json");
    if (!fs.existsSync(filePath)) return NextResponse.json({ success: true, shortId: null });

    const allLinks = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // สมมติ shortId เก็บแบบ allLinks[formId][country] = { shortId, questions, selectedFormId }
    const shortId = allLinks[formId]?.[country]?.shortId || null;

    return NextResponse.json({ success: true, shortId });
  } catch (err) {
    console.error("Error in getSavedState:", err);
    return NextResponse.json({ success: false, error: "Failed to get saved state" }, { status: 500 });
  }
}
