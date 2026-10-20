import { createProxyMiddleware } from "http-proxy-middleware";
const CLERK_FAPI = "https://frontend-api.clerk.dev";
const CLERK_PROXY_PATH = "/api/__clerk";
function getClerkProxyHost(req) {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();
  return firstHop || req.headers.host?.trim() || void 0;
}
function clerkProxyMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }
  return createProxyMiddleware({
    target: CLERK_FAPI,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = getClerkProxyHost(req) || "";
        const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;
        proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);
        const xff = req.headers["x-forwarded-for"];
        const clientIp = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      }
    }
  });
}
export {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost
};
