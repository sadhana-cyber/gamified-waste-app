import "dotenv/config";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { pool, initDatabase } from "@workspace/db";

const port = Number(process.env["PORT"] || 8080);

async function start() {
  if (pool) {
    try {
      await initDatabase(pool, logger);
    } catch (err) {
      logger.warn({ err: err.message }, "[DB] Database auto-init skipped or failed, using file/memory fallback");
    }
  } else {
    logger.info("[DB] No PostgreSQL DATABASE_URL detected. Running in resilient file/memory mode.");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, `Server listening on port ${port}`);
  });
}

start();
