import { readFile } from "node:fs/promises";
import pg from "pg";

// Explicit target; credentials are read only from the local environment, never arguments/logs.
const host = process.env.SUPABASE_DB_HOST;
const user = process.env.SUPABASE_DB_USER;
if (!host || !user || !process.env.SUPABASE_DB_PASSWORD) {
  console.error("Set SUPABASE_DB_HOST, SUPABASE_DB_USER and SUPABASE_DB_PASSWORD locally before running this check.");
  process.exit(1);
}
const ca = process.env.SUPABASE_DB_CA_FILE ? await readFile(process.env.SUPABASE_DB_CA_FILE, "utf8") : undefined;
const client = new pg.Client({ host, user, port: 5432, database: "postgres", password: process.env.SUPABASE_DB_PASSWORD, ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) }, connectionTimeoutMillis: 15000, query_timeout: 30000 });
try {
  await client.connect();
  await client.query(await readFile(new URL("../supabase/tests/delivery-security.sql", import.meta.url), "utf8"));
  console.log("PASS: anonymous capability, expiry, revocation, owner isolation and immutable snapshots. Test transaction rolled back.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  // No raw connection string, query payload or credential-bearing error stack.
  console.error("Database check failed:", error.code ?? error.name, String(error.message).replaceAll(process.env.SUPABASE_DB_PASSWORD, "[REDACTED]"));
  process.exitCode = 1;
} finally { await client.end().catch(() => {}); }
