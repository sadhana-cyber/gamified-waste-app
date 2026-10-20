import { Router } from "express";
import { db, usersTable, wasteLogsTable, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateUserBody,
  GetUserParams,
  GetUserStatsParams,
  GetUserAchievementsParams
} from "@workspace/api-zod";
import { inMemoryUsers, inMemoryWasteLogs, inMemoryUserAchievements, getNextUserId, saveStore } from "../lib/memoryStore";
import { requireAuth, requireOwnership } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.totalPoints));
    return res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        totalPoints: u.totalPoints,
        level: u.level,
        streak: u.streak,
        createdAt: u.createdAt
      }))
    );
  } catch (err) {
    req.log?.warn?.({ err }, "Database listing failed, using in-memory users");
  }

  res.json(
    inMemoryUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      totalPoints: u.totalPoints,
      level: u.level,
      streak: u.streak,
      createdAt: u.createdAt
    }))
  );
});

router.post("/", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [user] = await db.insert(usersTable).values(parsed.data).returning();
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      totalPoints: user.totalPoints,
      level: user.level,
      streak: user.streak,
      createdAt: user.createdAt
    });
  } catch (err) {
    req.log?.warn?.({ err }, "Database user create failed, saving in memory");
  }

  const newUser = {
    id: getNextUserId(),
    name: parsed.data.name,
    email: parsed.data.email,
    totalPoints: 0,
    level: 1,
    streak: 0,
    createdAt: new Date().toISOString()
  };
  inMemoryUsers.push(newUser);
  saveStore();
  res.status(201).json(newUser);
});

// List of accounts for multi-user authentication & switching
router.get("/auth/accounts", async (req, res) => {
  try {
    if (db) {
      const users = await db.select().from(usersTable).orderBy(usersTable.id);
      if (users && users.length > 0) {
        return res.json(
          users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            totalPoints: u.totalPoints,
            level: u.level,
            streak: u.streak,
            authToken: u.authToken || `eco_sec_${u.id}_${u.name.toLowerCase().replace(/[^a-z]/g, "")}`
          }))
        );
      }
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database fetch accounts failed, using in-memory");
  }

  res.json(
    inMemoryUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      totalPoints: u.totalPoints,
      level: u.level,
      streak: u.streak,
      authToken: u.authToken || `eco_sec_${u.id}_${u.name.toLowerCase().replace(/[^a-z]/g, "")}`
    }))
  );
});

// Current authenticated user session details
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    totalPoints: req.user.totalPoints,
    level: req.user.level,
    streak: req.user.streak,
    authToken: req.user.authToken,
    createdAt: req.user.createdAt
  });
});

router.post("/sync", async (req, res) => {
  const { clerkId, name, email } = req.body;
  if (!clerkId) {
    res.status(400).json({ error: "clerkId is required" });
    return;
  }
  const userEmail = email || `${clerkId}@ecocycle.local`;
  const displayName = name || userEmail.split("@")[0] || "User";

  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    if (existing) {
      return res.json({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        totalPoints: existing.totalPoints,
        level: existing.level,
        streak: existing.streak,
        authToken: `eco_sec_${existing.id}_${existing.name.toLowerCase().replace(/[^a-z]/g, "")}`,
        createdAt: existing.createdAt
      });
    }
    const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (byEmail) {
      const [updated] = await db.update(usersTable).set({ clerkId }).where(eq(usersTable.id, byEmail.id)).returning();
      return res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        totalPoints: updated.totalPoints,
        level: updated.level,
        streak: updated.streak,
        authToken: `eco_sec_${updated.id}_${updated.name.toLowerCase().replace(/[^a-z]/g, "")}`,
        createdAt: updated.createdAt
      });
    }
    const [created] = await db.insert(usersTable).values({ clerkId, name: displayName, email: userEmail }).returning();
    return res.status(201).json({
      id: created.id,
      name: created.name,
      email: created.email,
      totalPoints: created.totalPoints,
      level: created.level,
      streak: created.streak,
      authToken: `eco_sec_${created.id}_${created.name.toLowerCase().replace(/[^a-z]/g, "")}`,
      createdAt: created.createdAt
    });
  } catch (err) {
    req.log?.warn?.({ err }, "Database sync failed, syncing in memory");
  }

  let memoryUser = inMemoryUsers.find((u) => u.clerkId === clerkId || u.email === userEmail);
  if (memoryUser) {
    memoryUser.clerkId = clerkId;
    if (!memoryUser.authToken) {
      memoryUser.authToken = `eco_sec_${memoryUser.id}_${memoryUser.name.toLowerCase().replace(/[^a-z]/g, "")}`;
    }
    if (!memoryUser.name || memoryUser.name === "User") {
      memoryUser.name = displayName;
    }
    saveStore();
    return res.json({
      id: memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      totalPoints: memoryUser.totalPoints,
      level: memoryUser.level,
      streak: memoryUser.streak,
      authToken: memoryUser.authToken,
      createdAt: memoryUser.createdAt
    });
  }

  const newId = getNextUserId();
  const newUser = {
    id: newId,
    clerkId,
    name: displayName,
    email: userEmail,
    totalPoints: 0,
    level: 1,
    streak: 0,
    authToken: `eco_sec_${newId}_${displayName.toLowerCase().replace(/[^a-z]/g, "")}`,
    createdAt: new Date().toISOString()
  };
  inMemoryUsers.push(newUser);
  saveStore();
  res.status(201).json(newUser);
});

router.patch("/:id/name", requireAuth, requireOwnership("id"), async (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!id || !name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Valid id and name string are required" });
    return;
  }
  // Sanitize name: remove HTML tags, restrict to max 40 chars
  const cleanName = name.replace(/<[^>]*>?/gm, "").trim().slice(0, 40);
  if (!cleanName) {
    res.status(400).json({ error: "Name contains invalid characters" });
    return;
  }
  try {
    const [updated] = await db.update(usersTable).set({ name: cleanName }).where(eq(usersTable.id, id)).returning();
    if (updated) {
      return res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        totalPoints: updated.totalPoints,
        level: updated.level,
        streak: updated.streak,
        createdAt: updated.createdAt
      });
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database name update failed, updating in memory");
  }

  const memoryUser = inMemoryUsers.find((u) => u.id === id);
  if (memoryUser) {
    memoryUser.name = cleanName;
    for (const log of inMemoryWasteLogs) {
      if (log.userId === memoryUser.id) {
        log.userName = cleanName;
      }
    }
    saveStore();
    return res.json({
      id: memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      totalPoints: memoryUser.totalPoints,
      level: memoryUser.level,
      streak: memoryUser.streak,
      createdAt: memoryUser.createdAt
    });
  }
  res.status(404).json({ error: "Not found" });
});

router.get("/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const id = parsed.data.id;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (user) {
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        totalPoints: user.totalPoints,
        level: user.level,
        streak: user.streak,
        createdAt: user.createdAt
      });
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database fetch user failed, falling back to memory");
  }

  const memoryUser = inMemoryUsers.find((u) => u.id === id);
  if (memoryUser) {
    return res.json({
      id: memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      totalPoints: memoryUser.totalPoints,
      level: memoryUser.level,
      streak: memoryUser.streak,
      createdAt: memoryUser.createdAt
    });
  }
  res.status(404).json({ error: "Not found" });
});

router.get("/:id/stats", async (req, res) => {
  const parsed = GetUserStatsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = parsed.data.id;
  const categories = ["recyclable", "organic", "hazardous", "general", "electronic"];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);

  try {
    const logs = await db.select().from(wasteLogsTable).where(eq(wasteLogsTable.userId, userId));
    if (logs && logs.length > 0) {
      const byCategory = categories.map((cat) => {
        const catLogs = logs.filter((l) => l.category === cat);
        return {
          category: cat,
          weightKg: catLogs.reduce((sum, l) => sum + l.weightKg, 0),
          count: catLogs.length,
          points: catLogs.reduce((sum, l) => sum + l.pointsEarned, 0)
        };
      }).filter((c) => c.count > 0);
      const weeklyPoints = logs.filter((l) => l.createdAt >= weekAgo).reduce((sum, l) => sum + l.pointsEarned, 0);
      const monthlyPoints = logs.filter((l) => l.createdAt >= monthAgo).reduce((sum, l) => sum + l.pointsEarned, 0);
      return res.json({
        userId,
        totalWeight: logs.reduce((sum, l) => sum + l.weightKg, 0),
        totalLogs: logs.length,
        byCategory,
        weeklyPoints,
        monthlyPoints
      });
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database fetch stats failed, calculating from memory");
  }

  const memoryLogs = inMemoryWasteLogs.filter((l) => l.userId === userId);
  const byCategory = categories.map((cat) => {
    const catLogs = memoryLogs.filter((l) => l.category === cat);
    return {
      category: cat,
      weightKg: catLogs.reduce((sum, l) => sum + l.weightKg, 0),
      count: catLogs.length,
      points: catLogs.reduce((sum, l) => sum + l.pointsEarned, 0)
    };
  }).filter((c) => c.count > 0);

  const totalWeight = memoryLogs.reduce((sum, l) => sum + l.weightKg, 0);
  const totalPoints = memoryLogs.reduce((sum, l) => sum + l.pointsEarned, 0);

  res.json({
    userId,
    totalWeight: Math.round(totalWeight * 10) / 10,
    totalLogs: memoryLogs.length,
    byCategory,
    weeklyPoints: totalPoints,
    monthlyPoints: totalPoints
  });
});

router.get("/:id/achievements", async (req, res) => {
  const parsed = GetUserAchievementsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = parsed.data.id;
  try {
    const rows = await db.select().from(userAchievementsTable).innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id)).where(eq(userAchievementsTable.userId, userId));
    if (rows && rows.length > 0) {
      return res.json(
        rows.map((r) => ({
          id: r.user_achievements.id,
          achievement: {
            id: r.achievements.id,
            name: r.achievements.name,
            description: r.achievements.description,
            icon: r.achievements.icon,
            pointsRequired: r.achievements.pointsRequired,
            category: r.achievements.category
          },
          unlockedAt: r.user_achievements.unlockedAt
        }))
      );
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database achievements query failed, using memory fallback");
  }

  // Real unlocked achievements only
  const unlocked = inMemoryUserAchievements.filter((ua) => ua.userId === userId);
  res.json(unlocked);
});

var stdin_default = router;
export {
  stdin_default as default
};
