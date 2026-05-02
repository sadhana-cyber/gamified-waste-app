import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateUserBody,
  GetUserParams,
  GetUserStatsParams,
  GetUserAchievementsParams,
} from "@workspace/api-zod";
import { wasteLogsTable, achievementsTable, userAchievementsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.totalPoints));
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    totalPoints: u.totalPoints,
    level: u.level,
    streak: u.streak,
    createdAt: u.createdAt,
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    totalPoints: user.totalPoints,
    level: user.level,
    streak: user.streak,
    createdAt: user.createdAt,
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    totalPoints: user.totalPoints,
    level: user.level,
    streak: user.streak,
    createdAt: user.createdAt,
  });
});

router.get("/:id/stats", async (req, res) => {
  const parsed = GetUserStatsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = parsed.data.id;
  const logs = await db.select().from(wasteLogsTable).where(eq(wasteLogsTable.userId, userId));

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const categories = ["recyclable", "organic", "hazardous", "general", "electronic"];
  const byCategory = categories.map(cat => {
    const catLogs = logs.filter(l => l.category === cat);
    return {
      category: cat,
      weightKg: catLogs.reduce((sum, l) => sum + l.weightKg, 0),
      count: catLogs.length,
      points: catLogs.reduce((sum, l) => sum + l.pointsEarned, 0),
    };
  }).filter(c => c.count > 0);

  const weeklyPoints = logs.filter(l => l.createdAt >= weekAgo).reduce((sum, l) => sum + l.pointsEarned, 0);
  const monthlyPoints = logs.filter(l => l.createdAt >= monthAgo).reduce((sum, l) => sum + l.pointsEarned, 0);

  res.json({
    userId,
    totalWeight: logs.reduce((sum, l) => sum + l.weightKg, 0),
    totalLogs: logs.length,
    byCategory,
    weeklyPoints,
    monthlyPoints,
  });
});

router.get("/:id/achievements", async (req, res) => {
  const parsed = GetUserAchievementsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = parsed.data.id;
  const rows = await db
    .select()
    .from(userAchievementsTable)
    .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
    .where(eq(userAchievementsTable.userId, userId));

  res.json(rows.map(r => ({
    id: r.user_achievements.id,
    achievement: {
      id: r.achievements.id,
      name: r.achievements.name,
      description: r.achievements.description,
      icon: r.achievements.icon,
      pointsRequired: r.achievements.pointsRequired,
      category: r.achievements.category,
    },
    unlockedAt: r.user_achievements.unlockedAt,
  })));
});

export default router;
