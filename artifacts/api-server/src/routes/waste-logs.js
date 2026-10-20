import { Router } from "express";
import { db, wasteLogsTable, usersTable, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateWasteLogBody, ListWasteLogsQueryParams } from "@workspace/api-zod";
import { inMemoryWasteLogs, inMemoryUsers, inMemoryUserAchievements, getNextLogId, getNextUserAchievementId, saveStore } from "../lib/memoryStore";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();
const POINTS_MAP = {
  recyclable: 10,
  organic: 8,
  hazardous: 15,
  electronic: 20,
  general: 3
};

function calcPoints(category, weightKg) {
  const base = POINTS_MAP[category] ?? 5;
  return Math.round(base * (1 + weightKg * 0.5));
}

function calcLevel(points) {
  return Math.floor(points / 100) + 1;
}

router.get("/", async (req, res) => {
  const parsed = ListWasteLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, category } = parsed.data;
  try {
    const conditions = [];
    if (userId !== void 0) conditions.push(eq(wasteLogsTable.userId, userId));
    if (category) conditions.push(eq(wasteLogsTable.category, category));
    const logs = await db.select().from(wasteLogsTable).innerJoin(usersTable, eq(wasteLogsTable.userId, usersTable.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(wasteLogsTable.createdAt));
    if (logs && logs.length > 0) {
      return res.json(
        logs.map((r) => ({
          id: r.waste_logs.id,
          userId: r.waste_logs.userId,
          userName: r.users.name,
          category: r.waste_logs.category,
          weightKg: r.waste_logs.weightKg,
          pointsEarned: r.waste_logs.pointsEarned,
          notes: r.waste_logs.notes,
          createdAt: r.waste_logs.createdAt
        }))
      );
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database fetch waste logs failed, using in-memory");
  }

  // Fallback to in-memory logs
  let filtered = [...inMemoryWasteLogs];
  if (userId !== void 0) filtered = filtered.filter((l) => l.userId === userId);
  if (category) filtered = filtered.filter((l) => l.category === category);
  res.json(filtered);
});

router.post("/", requireAuth, async (req, res) => {
  const bodyData = { ...req.body, userId: req.body.userId || req.user.id };
  const parsed = CreateWasteLogBody.safeParse(bodyData);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, weightKg, notes } = parsed.data;

  // Data Security: Enforce that user cannot log waste under someone else's ID
  if (parsed.data.userId && parsed.data.userId !== req.user.id) {
    return res.status(403).json({
      error: "Security Violation",
      message: "You can only log waste for your own authenticated account."
    });
  }
  const userId = req.user.id;

  // Input Sanitization
  if (weightKg <= 0 || weightKg > 500) {
    return res.status(400).json({ error: "Weight must be between 0.05 and 500 kg." });
  }
  const cleanNotes = notes ? String(notes).replace(/<[^>]*>?/gm, "").trim().slice(0, 200) : undefined;
  const pointsEarned = calcPoints(category, weightKg);

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (user) {
      const [log] = await db.insert(wasteLogsTable).values({ userId, category, weightKg, pointsEarned, notes: cleanNotes }).returning();
      const newTotalPoints = user.totalPoints + pointsEarned;
      const newLevel = calcLevel(newTotalPoints);
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      let newStreak = user.streak;
      if (user.lastLogDate === today) {
      } else if (user.lastLogDate === yesterday) {
        newStreak = user.streak + 1;
      } else {
        newStreak = 1;
      }
      await db.update(usersTable).set({ totalPoints: newTotalPoints, level: newLevel, streak: newStreak, lastLogDate: today }).where(eq(usersTable.id, userId));
      let newAchievements = [];
      try {
        const allAchievements = await db.select().from(achievementsTable);
        const existingUserAchievements = await db.select().from(userAchievementsTable).where(eq(userAchievementsTable.userId, userId));
        const existingIds = new Set(existingUserAchievements.map((a) => a.achievementId));
        newAchievements = allAchievements.filter(
          (a) => !existingIds.has(a.id) && newTotalPoints >= a.pointsRequired
        );
        if (newAchievements.length > 0) {
          await db.insert(userAchievementsTable).values(
            newAchievements.map((a) => ({ userId, achievementId: a.id }))
          );
        }
      } catch {
      }
      return res.status(201).json({
        wasteLog: {
          id: log.id,
          userId: log.userId,
          userName: user.name,
          category: log.category,
          weightKg: log.weightKg,
          pointsEarned: log.pointsEarned,
          notes: log.notes,
          createdAt: log.createdAt
        },
        pointsEarned,
        newTotalPoints,
        newLevel,
        newAchievements: newAchievements.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          pointsRequired: a.pointsRequired,
          category: a.category
        }))
      });
    }
  } catch (err) {
    req.log?.warn?.({ err }, "Database waste log create failed, saving in memory");
  }

  // In-memory fallback
  let user = inMemoryUsers.find((u) => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      name: "User",
      email: "user@ecocycle.local",
      totalPoints: 0,
      level: 1,
      streak: 0,
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.push(user);
  }

  const newTotalPoints = (user.totalPoints || 0) + pointsEarned;
  const newLevel = calcLevel(newTotalPoints);
  user.totalPoints = newTotalPoints;
  user.level = newLevel;
  user.streak = (user.streak || 0) + 1;

  const newLog = {
    id: getNextLogId(),
    userId,
    userName: user.name,
    category,
    weightKg,
    pointsEarned,
    notes: cleanNotes || undefined,
    createdAt: new Date().toISOString()
  };
  inMemoryWasteLogs.unshift(newLog);

  const ACH_DEFS = [
    { id: 1, name: "First Step", description: "Log your first waste recycling entry", icon: "🌱", pointsRequired: 10, category: "starter" },
    { id: 2, name: "Waste Sorter", description: "Earn 50 points by properly segregating waste", icon: "♻️", pointsRequired: 50, category: "recycling" },
    { id: 3, name: "Green Champion", description: "Reach 100 points contributing to a cleaner planet", icon: "🌿", pointsRequired: 100, category: "points" },
    { id: 4, name: "Eco Warrior", description: "Reach 250 points and keep up the momentum", icon: "🛡️", pointsRequired: 250, category: "points" },
    { id: 5, name: "Planet Savior", description: "Reach 500 points with consistent sustainable habits", icon: "🌍", pointsRequired: 500, category: "points" },
    { id: 6, name: "Master of Ecology", description: "Reach 1,000 points and inspire your community", icon: "👑", pointsRequired: 1000, category: "mastery" }
  ];

  const existingAchIds = new Set(inMemoryUserAchievements.filter((ua) => ua.userId === userId).map((ua) => ua.achievementId));
  const newAchievements = ACH_DEFS.filter((a) => !existingAchIds.has(a.id) && newTotalPoints >= a.pointsRequired);
  for (const a of newAchievements) {
    inMemoryUserAchievements.push({
      id: getNextUserAchievementId(),
      userId,
      achievementId: a.id,
      achievement: a,
      unlockedAt: new Date().toISOString()
    });
  }
  saveStore();

  res.status(201).json({
    wasteLog: newLog,
    pointsEarned,
    newTotalPoints,
    newLevel,
    newAchievements
  });
});

var stdin_default = router;
export {
  stdin_default as default
};
