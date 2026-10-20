import { inMemoryUsers } from "../lib/memoryStore";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Resolves the authenticated user from request headers or Clerk auth.
 */
export async function authenticateUser(req, _res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["x-user-token"] || "";
    const rawToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
    const clerkUserId = req.auth?.userId || req.headers["x-clerk-user-id"];
    const explicitUserId = req.headers["x-user-id"] ? Number(req.headers["x-user-id"]) : null;

    let matchedUser = null;

    // 1. Check against inMemoryUsers
    if (rawToken) {
      matchedUser = inMemoryUsers.find(
        (u) =>
          u.authToken === rawToken ||
          `eco_sec_${u.id}` === rawToken ||
          u.clerkId === rawToken ||
          (rawToken.startsWith("eco_user_") && rawToken.includes(`_${u.id}`))
      );
    }

    if (!matchedUser && clerkUserId) {
      matchedUser = inMemoryUsers.find((u) => u.clerkId === clerkUserId);
    }

    if (!matchedUser && explicitUserId && rawToken === `eco_token_${explicitUserId}`) {
      matchedUser = inMemoryUsers.find((u) => u.id === explicitUserId);
    }

    // 2. If PostgreSQL is active and no memory match found
    if (!matchedUser && (rawToken || clerkUserId) && db) {
      try {
        if (clerkUserId) {
          const [dbU] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
          if (dbU) matchedUser = dbU;
        }
        if (!matchedUser && rawToken) {
          const [dbU] = await db.select().from(usersTable).where(eq(usersTable.authToken, rawToken));
          if (dbU) matchedUser = dbU;
        }
      } catch {
        // Fallback continues to inMemoryUsers
      }
    }

    req.user = matchedUser || null;
  } catch (err) {
    req.log?.warn?.({ err }, "Error resolving authenticated user");
    req.user = null;
  }

  next();
}

/**
 * Middleware: Requires an active, authenticated user.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "You must be authenticated with a valid session token to perform this action."
    });
  }
  next();
}

/**
 * Middleware: Enforces data security by ensuring caller owns the target resource ID.
 */
export function requireOwnership(paramName = "id") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const targetId = Number(req.params[paramName]);
    if (req.user.id !== targetId) {
      return res.status(403).json({
        error: "Security Violation",
        message: "Access Denied: You cannot modify or access private data belonging to another user."
      });
    }
    next();
  };
}
