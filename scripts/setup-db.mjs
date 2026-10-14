import fs from "node:fs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

try {
  await client.connect();
  await client.query(sql);
  console.log("Database tables are ready.");
} catch (err) {
  console.error("Database setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}