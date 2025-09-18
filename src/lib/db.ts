// lib/db.ts (สร้างไฟล์ใหม่สำหรับจัดการ DB connection)
import sql from "mssql";

let pool: sql.ConnectionPool | null = null;

export const getDbPool = async (config: sql.config) => {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ DB Pool connected");
  }
  return pool;
};

export const loadCountryDB = async (country: string, config: sql.config) => {
  try {
    const pool = await getDbPool(config);
    // ตัวอย่าง query แค่ตรวจสอบ country
    const result = await pool.request()
      .input("country", sql.VarChar, country)
      .query("SELECT TOP 1 countryCode FROM CountryTable WHERE countryCode = @country");

    if (result.recordset.length === 0) {
      throw new Error(`Country ${country} not found`);
    }
    return true;
  } catch (err) {
    console.error("Failed to load DB for country:", country, err);
    throw err;
  }
};
