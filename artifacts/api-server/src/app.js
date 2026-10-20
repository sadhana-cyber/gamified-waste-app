import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost
} from "./middlewares/clerkProxyMiddleware";
import { authenticateUser } from "./middlewares/authMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
const app = express();
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.path
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const clerkKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
if (process.env.CLERK_SECRET_KEY && clerkKey) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", clerkKey) || clerkKey,
      secretKey: process.env.CLERK_SECRET_KEY
    }))
  );
} else {
  app.use((req, _res, next) => {
    req.auth = req.auth || { userId: null, sessionId: null };
    next();
  });
}
app.use(authenticateUser);
app.use("/api", router);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const possibleStaticDirs = [
  path.resolve(process.cwd(), "artifacts/waste-gamify/dist/public"),
  path.resolve(process.cwd(), "../waste-gamify/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(__dirname, "../../waste-gamify/dist/public"),
  path.resolve(__dirname, "../../../waste-gamify/dist/public")
];
for (const dir of possibleStaticDirs) {
  if (fs.existsSync(dir)) {
    app.use(express.static(dir));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next();
      res.sendFile(path.join(dir, "index.html"));
    });
    break;
  }
}
var stdin_default = app;
export {
  stdin_default as default
};
