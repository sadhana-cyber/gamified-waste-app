import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    totalPoints: integer("total_points").notNull().default(0),
    level: integer("level").notNull().default(1),
    streak: integer("streak").notNull().default(0),
    lastLogDate: text("last_log_date"),
    authToken: text("auth_token").unique(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (table) => [
    index("idx_users_clerk_id").on(table.clerkId),
    index("idx_users_email").on(table.email),
    index("idx_users_total_points").on(table.totalPoints),
    index("idx_users_auth_token").on(table.authToken)
  ]
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  totalPoints: true,
  level: true,
  streak: true,
  lastLogDate: true,
  createdAt: true
});

export const selectUserSchema = createSelectSchema(usersTable);
