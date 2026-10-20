import { pgTable, serial, integer, text, real, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users.js";

export const wasteLogsTable = pgTable(
  "waste_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    weightKg: real("weight_kg").notNull(),
    pointsEarned: integer("points_earned").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => [
    index("idx_waste_logs_user_id").on(table.userId),
    index("idx_waste_logs_created_at").on(table.createdAt),
    index("idx_waste_logs_user_created").on(table.userId, table.createdAt),
    index("idx_waste_logs_category").on(table.category)
  ]
);

export const insertWasteLogSchema = createInsertSchema(wasteLogsTable).omit({
  id: true,
  pointsEarned: true,
  createdAt: true
});

export const selectWasteLogSchema = createSelectSchema(wasteLogsTable);
