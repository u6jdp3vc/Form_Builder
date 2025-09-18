import sql from "mssql";

const config = {
  user: "sa",
  password: "d2tS@p10",
  server: "10.2.4.103",
  database: "DTT", // database เดียว
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: "tp_production",
  },
};

export async function getPool() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("Failed to connect SQL Server:", err);
    throw err;
  }
}
