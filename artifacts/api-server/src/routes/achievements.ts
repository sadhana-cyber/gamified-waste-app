import { Router } from "express";
import { db } from "@workspace/db";
import { achievementsTable } from "@workspace/db";

const router = Router();

router.get("/", async (_req, res) => {
  const achievements = await db.select().from(achievementsTable).orderBy(achievementsTable.pointsRequired);
  res.json(achievements.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    pointsRequired: a.pointsRequired,
    category: a.category,
  })));
});

export default router;
