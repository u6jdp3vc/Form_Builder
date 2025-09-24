import { countryMaps } from "@/app/countryMaps";

export const generateLinksForCountries = async (
  selectedFormId: string,
  selectedCountries: string[],
  questions: any[],
  runQueryForCountry: (country: string) => Promise<any[]> = async () => []
): Promise<{ link: string, queryData: any[] }[]> => {
  if (!selectedFormId || !selectedCountries?.length || !questions?.length) return [];
  
  const results: { link: string, queryData: any[] }[] = [];

  for (const country of selectedCountries) {
    // ตรวจสอบ shortId จาก API
    const checkRes = await fetch(`/api/getSavedState?formId=${selectedFormId}&country=${country}`);
    const checkData = await checkRes.json();
    let shortId = checkData?.shortId;

    // รัน Query สำหรับ country
    const queryData = runQueryForCountry ? await runQueryForCountry(country) : [];

    if (!shortId) {
      // ถ้ายังไม่มี shortId → POST
      const saveRes = await fetch("/api/saveState", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFormId, countries: [country], questions, queryData }),
      });
      const saveData = await saveRes.json();
      shortId = saveData.shortId;
    } else {
      // ถ้ามี shortId → PUT เพื่ออัปเดต questions
      await fetch("/api/saveState", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFormId, country, questions }),
      });
    }

    // สร้างลิงก์
    const readable = countryMaps[country] || country;
    const countryPath = readable.replace(/\s+/g, '-');
    results.push({ link: shortId ? `/frontenduser/${countryPath}/${shortId}` : "#", queryData });
  }

  return results;
};

