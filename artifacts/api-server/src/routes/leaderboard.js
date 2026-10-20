import { Router } from "express";
import { db, usersTable, wasteLogsTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { GetLeaderboardQueryParams, GetRecentActivityQueryParams } from "@workspace/api-zod";
import { inMemoryUsers, inMemoryWasteLogs } from "../lib/memoryStore";

const router = Router();
const CO2_PER_KG = {
  recyclable: 2.5,
  organic: 0.5,
  hazardous: 1,
  electronic: 4,
  general: 0.1
};

router.get("/leaderboard", async (req, res) => {
  try {
    const parsed = GetLeaderboardQueryParams.safeParse(req.query);
    const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 10;
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.totalPoints)).limit(limit);
    if (users && users.length > 0) {
      const logCounts = await db.select({ userId: wasteLogsTable.userId, cnt: count() }).from(wasteLogsTable).groupBy(wasteLogsTable.userId);
      const countMap = new Map(logCounts.map((r) => [r.userId, Number(r.cnt)]));
      return res.json(
        users.map((u, i) => ({
          rank: i + 1,
          userId: u.id,
          name: u.name,
          totalPoints: u.totalPoints,
          level: u.level,
          streak: u.streak,
          totalLogs: countMap.get(u.id) ?? 0
        }))
      );
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Leaderboard database query failed, using in-memory");
  }

  // Fallback to in-memory users sorted by points
  const parsedLimit = req.query.limit ? Number(req.query.limit) : 50;
  const sorted = [...inMemoryUsers].sort((a, b) => b.totalPoints - a.totalPoints);
  const limited = sorted.slice(0, parsedLimit > 0 ? parsedLimit : 50);
  res.json(
    limited.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      totalPoints: u.totalPoints,
      level: u.level,
      streak: u.streak,
      totalLogs: inMemoryWasteLogs.filter((l) => l.userId === u.id).length
    }))
  );
});

router.get("/platform-stats", async (req, res) => {
  try {
    const [userCount] = await db.select({ cnt: count() }).from(usersTable);
    const [logCount] = await db.select({ cnt: count() }).from(wasteLogsTable);
    const [totals] = await db.select({
      totalWeight: sum(wasteLogsTable.weightKg),
      totalPoints: sum(wasteLogsTable.pointsEarned)
    }).from(wasteLogsTable);
    const catStats = await db.select({ category: wasteLogsTable.category, cnt: count() }).from(wasteLogsTable).groupBy(wasteLogsTable.category).orderBy(desc(count()));
    const topCategory = catStats[0]?.category ?? "recyclable";
    const allLogs = await db.select({ category: wasteLogsTable.category, weightKg: wasteLogsTable.weightKg }).from(wasteLogsTable);
    const co2SavedKg = allLogs.reduce(
      (acc, l) => acc + (l.weightKg || 0) * (CO2_PER_KG[l.category] ?? 0.5),
      0
    );
    if (Number(userCount?.cnt ?? 0) > 0 || Number(logCount?.cnt ?? 0) > 0) {
      return res.json({
        totalUsers: Number(userCount?.cnt ?? 0),
        totalLogs: Number(logCount?.cnt ?? 0),
        totalWeightKg: Number(totals?.totalWeight ?? 0),
        totalPointsAwarded: Number(totals?.totalPoints ?? 0),
        topCategory,
        co2SavedKg: Math.round(co2SavedKg * 10) / 10
      });
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Platform stats database query failed, using in-memory");
  }

  // Fallback in-memory stats
  const totalWeight = inMemoryWasteLogs.reduce((acc, l) => acc + (l.weightKg || 0), 0);
  const totalPoints = inMemoryWasteLogs.reduce((acc, l) => acc + (l.pointsEarned || 0), 0);
  const co2SavedKg = inMemoryWasteLogs.reduce(
    (acc, l) => acc + (l.weightKg || 0) * (CO2_PER_KG[l.category] ?? 0.5),
    0
  );

  res.json({
    totalUsers: inMemoryUsers.length,
    totalLogs: inMemoryWasteLogs.length,
    totalWeightKg: Math.round(totalWeight * 10) / 10,
    totalPointsAwarded: totalPoints,
    topCategory: "recyclable",
    co2SavedKg: Math.round(co2SavedKg * 10) / 10
  });
});

router.get("/activity", async (req, res) => {
  try {
    const parsed = GetRecentActivityQueryParams.safeParse(req.query);
    const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 20;
    const rows = await db.select().from(wasteLogsTable).innerJoin(usersTable, eq(wasteLogsTable.userId, usersTable.id)).orderBy(desc(wasteLogsTable.createdAt)).limit(limit);
    if (rows && rows.length > 0) {
      return res.json(
        rows.map((r) => ({
          id: r.waste_logs.id,
          userId: r.waste_logs.userId,
          userName: r.users.name,
          category: r.waste_logs.category,
          weightKg: r.waste_logs.weightKg,
          pointsEarned: r.waste_logs.pointsEarned,
          createdAt: r.waste_logs.createdAt
        }))
      );
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Activity database query failed, using in-memory");
  }

  // Fallback in-memory activity
  const sortedLogs = [...inMemoryWasteLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(
    sortedLogs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.userName || inMemoryUsers.find((u) => u.id === l.userId)?.name || "User",
      category: l.category,
      weightKg: l.weightKg,
      pointsEarned: l.pointsEarned,
      createdAt: l.createdAt
    }))
  );
});

var stdin_default = router;
export {
  stdin_default as default
};
