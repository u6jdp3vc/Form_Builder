// lib/getCountries.ts
import fs from "fs";
import path from "path";

export function getCountries(): string[] {
  const filePath = path.join(process.cwd(), "public", "Query.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return data.countries || [];
}
