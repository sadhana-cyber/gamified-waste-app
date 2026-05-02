import { Router } from "express";
import { db } from "@workspace/db";
import { wasteLogsTable, usersTable, achievementsTable, userAchievementsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateWasteLogBody, ListWasteLogsQueryParams } from "@workspace/api-zod";

const router = Router();

const POINTS_MAP: Record<string, number> = {
  recyclable: 10,
  organic: 8,
  hazardous: 15,
  electronic: 20,
  general: 3,
};

function calcPoints(category: string, weightKg: number): number {
  const base = POINTS_MAP[category] ?? 5;
  return Math.round(base * (1 + weightKg * 0.5));
}

function calcLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

router.get("/", async (req, res) => {
  const parsed = ListWasteLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, category } = parsed.data;

  const conditions = [];
  if (userId !== undefined) conditions.push(eq(wasteLogsTable.userId, userId));
  if (category) conditions.push(eq(wasteLogsTable.category, category));

  const logs = await db
    .select()
    .from(wasteLogsTable)
    .innerJoin(usersTable, eq(wasteLogsTable.userId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(wasteLogsTable.createdAt));

  res.json(logs.map(r => ({
    id: r.waste_logs.id,
    userId: r.waste_logs.userId,
    userName: r.users.name,
    category: r.waste_logs.category,
    weightKg: r.waste_logs.weightKg,
    pointsEarned: r.waste_logs.pointsEarned,
    notes: r.waste_logs.notes,
    createdAt: r.waste_logs.createdAt,
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreateWasteLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, category, weightKg, notes } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const pointsEarned = calcPoints(category, weightKg);

  const [log] = await db
    .insert(wasteLogsTable)
    .values({ userId, category, weightKg, pointsEarned, notes })
    .returning();

  const newTotalPoints = user.totalPoints + pointsEarned;
  const newLevel = calcLevel(newTotalPoints);

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak = user.streak;
  if (user.lastLogDate === today) {
    // Already logged today, no streak change
  } else if (user.lastLogDate === yesterday) {
    newStreak = user.streak + 1;
  } else {
    newStreak = 1;
  }

  await db
    .update(usersTable)
    .set({ totalPoints: newTotalPoints, level: newLevel, streak: newStreak, lastLogDate: today })
    .where(eq(usersTable.id, userId));

  // Check for new achievements
  const allAchievements = await db.select().from(achievementsTable);
  const existingUserAchievements = await db
    .select()
    .from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));
  const existingIds = new Set(existingUserAchievements.map(a => a.achievementId));

  const newAchievements = allAchievements.filter(
    a => !existingIds.has(a.id) && newTotalPoints >= a.pointsRequired
  );

  if (newAchievements.length > 0) {
    await db.insert(userAchievementsTable).values(
      newAchievements.map(a => ({ userId, achievementId: a.id }))
    );
  }

  res.status(201).json({
    wasteLog: {
      id: log.id,
      userId: log.userId,
      userName: user.name,
      category: log.category,
      weightKg: log.weightKg,
      pointsEarned: log.pointsEarned,
      notes: log.notes,
      createdAt: log.createdAt,
    },
    pointsEarned,
    newTotalPoints,
    newLevel,
    newAchievements: newAchievements.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      pointsRequired: a.pointsRequired,
      category: a.category,
    })),
  });
});

export default router;
