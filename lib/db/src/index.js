import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import { initDatabase, INITIAL_4_USERS } from "./init.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

let envDir = process.cwd();
for (let i = 0; i < 5; i++) {
  const envCandidate = path.join(envDir, ".env");
  if (fs.existsSync(envCandidate)) {
    dotenv.config({ path: envCandidate });
    break;
  }
  const parent = path.dirname(envDir);
  if (parent === envDir) break;
  envDir = parent;
}
dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

let pool = null;
let db = null;

if (databaseUrl) {
  const isProduction = process.env.NODE_ENV === "production";
  const isCloudHost = databaseUrl.includes("render.com") || databaseUrl.includes("neon.tech") || databaseUrl.includes("supabase.co") || databaseUrl.includes("sslmode=require");
  const useSsl = isProduction || isCloudHost;

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
    });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.warn("[DB] Failed to create pg Pool:", err.message);
  }
}

export * from "./schema/index.js";
export { db, pool, initDatabase, INITIAL_4_USERS };
