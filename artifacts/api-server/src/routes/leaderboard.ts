import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, wasteLogsTable } from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { GetLeaderboardQueryParams, GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

const CO2_PER_KG: Record<string, number> = {
  recyclable: 2.5,
  organic: 0.5,
  hazardous: 1.0,
  electronic: 4.0,
  general: 0.1,
};

router.get("/leaderboard", async (req, res) => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 10;

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.totalPoints))
    .limit(limit);

  const logCounts = await db
    .select({ userId: wasteLogsTable.userId, cnt: count() })
    .from(wasteLogsTable)
    .groupBy(wasteLogsTable.userId);

  const countMap = new Map(logCounts.map(r => [r.userId, Number(r.cnt)]));

  res.json(users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name,
    totalPoints: u.totalPoints,
    level: u.level,
    streak: u.streak,
    totalLogs: countMap.get(u.id) ?? 0,
  })));
});

router.get("/platform-stats", async (_req, res) => {
  const [userCount] = await db.select({ cnt: count() }).from(usersTable);
  const [logCount] = await db.select({ cnt: count() }).from(wasteLogsTable);
  const [totals] = await db
    .select({
      totalWeight: sum(wasteLogsTable.weightKg),
      totalPoints: sum(wasteLogsTable.pointsEarned),
    })
    .from(wasteLogsTable);

  const catStats = await db
    .select({ category: wasteLogsTable.category, cnt: count() })
    .from(wasteLogsTable)
    .groupBy(wasteLogsTable.category)
    .orderBy(desc(count()));

  const topCategory = catStats[0]?.category ?? "recyclable";

  const allLogs = await db.select({ category: wasteLogsTable.category, weightKg: wasteLogsTable.weightKg }).from(wasteLogsTable);
  const co2SavedKg = allLogs.reduce((sum, l) => sum + l.weightKg * (CO2_PER_KG[l.category] ?? 0.5), 0);

  res.json({
    totalUsers: Number(userCount.cnt),
    totalLogs: Number(logCount.cnt),
    totalWeightKg: Number(totals?.totalWeight ?? 0),
    totalPointsAwarded: Number(totals?.totalPoints ?? 0),
    topCategory,
    co2SavedKg: Math.round(co2SavedKg * 10) / 10,
  });
});

router.get("/activity", async (req, res) => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 20;

  const rows = await db
    .select()
    .from(wasteLogsTable)
    .innerJoin(usersTable, eq(wasteLogsTable.userId, usersTable.id))
    .orderBy(desc(wasteLogsTable.createdAt))
    .limit(limit);

  res.json(rows.map(r => ({
    id: r.waste_logs.id,
    userId: r.waste_logs.userId,
    userName: r.users.name,
    category: r.waste_logs.category,
    weightKg: r.waste_logs.weightKg,
    pointsEarned: r.waste_logs.pointsEarned,
    createdAt: r.waste_logs.createdAt,
  })));
});

export default router;
