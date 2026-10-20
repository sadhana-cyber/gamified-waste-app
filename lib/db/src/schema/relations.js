import { relations } from "drizzle-orm";
import { usersTable } from "./users.js";
import { wasteLogsTable } from "./waste_logs.js";
import { achievementsTable, userAchievementsTable } from "./achievements.js";

export const usersRelations = relations(usersTable, ({ many }) => ({
  wasteLogs: many(wasteLogsTable),
  userAchievements: many(userAchievementsTable)
}));

export const wasteLogsRelations = relations(wasteLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [wasteLogsTable.userId],
    references: [usersTable.id]
  })
}));

export const achievementsRelations = relations(achievementsTable, ({ many }) => ({
  userAchievements: many(userAchievementsTable)
}));

export const userAchievementsRelations = relations(userAchievementsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userAchievementsTable.userId],
    references: [usersTable.id]
  }),
  achievement: one(achievementsTable, {
    fields: [userAchievementsTable.achievementId],
    references: [achievementsTable.id]
  })
}));
