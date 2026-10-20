import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const useSsl = isProduction || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("sslmode=require"));

export default defineConfig({
  schema: "./src/schema/index.js",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  }
});
