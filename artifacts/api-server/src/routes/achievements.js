import { Router } from "express";
import { db, achievementsTable } from "@workspace/db";
const router = Router();
const DEFAULT_ACHIEVEMENTS = [
  {
    name: "First Step",
    description: "Log your first waste recycling entry",
    icon: "\u{1F331}",
    pointsRequired: 10,
    category: "starter"
  },
  {
    name: "Waste Sorter",
    description: "Earn 50 points by properly segregating waste",
    icon: "\u267B\uFE0F",
    pointsRequired: 50,
    category: "recycling"
  },
  {
    name: "Green Champion",
    description: "Reach 100 points contributing to a cleaner planet",
    icon: "\u{1F33F}",
    pointsRequired: 100,
    category: "points"
  },
  {
    name: "Eco Warrior",
    description: "Reach 250 points and keep up the momentum",
    icon: "\u{1F6E1}\uFE0F",
    pointsRequired: 250,
    category: "points"
  },
  {
    name: "Planet Savior",
    description: "Reach 500 points with consistent sustainable habits",
    icon: "\u{1F30D}",
    pointsRequired: 500,
    category: "points"
  },
  {
    name: "Master of Ecology",
    description: "Reach 1,000 points and inspire your community",
    icon: "\u{1F451}",
    pointsRequired: 1e3,
    category: "mastery"
  }
];
router.get("/", async (_req, res) => {
  try {
    let achievements = await db.select().from(achievementsTable).orderBy(achievementsTable.pointsRequired);
    if (achievements.length === 0) {
      try {
        await db.insert(achievementsTable).values(DEFAULT_ACHIEVEMENTS);
        achievements = await db.select().from(achievementsTable).orderBy(achievementsTable.pointsRequired);
      } catch {
        return res.json(DEFAULT_ACHIEVEMENTS.map((a, i) => ({ id: i + 1, ...a })));
      }
    }
    res.json(
      achievements.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        pointsRequired: a.pointsRequired,
        category: a.category
      }))
    );
  } catch {
    res.json(DEFAULT_ACHIEVEMENTS.map((a, i) => ({ id: i + 1, ...a })));
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
