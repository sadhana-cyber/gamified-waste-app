import { pgTable, serial, text, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users.js";

export const achievementsTable = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    pointsRequired: integer("points_required").notNull(),
    category: text("category").notNull()
  },
  (table) => [
    index("idx_achievements_points").on(table.pointsRequired)
  ]
);

export const userAchievementsTable = pgTable(
  "user_achievements",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievementsTable.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow()
  },
  (table) => [
    unique("uniq_user_achievement").on(table.userId, table.achievementId),
    index("idx_user_achievements_user").on(table.userId)
  ]
);

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ id: true });
export const selectAchievementSchema = createSelectSchema(achievementsTable);

export const insertUserAchievementSchema = createInsertSchema(userAchievementsTable).omit({
  id: true,
  unlockedAt: true
});
export const selectUserAchievementSchema = createSelectSchema(userAchievementsTable);
