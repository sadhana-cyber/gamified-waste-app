import { Pool } from "pg";
import { inMemoryUsers, inMemoryWasteLogs, inMemoryUserAchievements } from "../../../artifacts/api-server/src/lib/memoryStore.js";

const DEFAULT_ACHIEVEMENTS = [
  {
    id: 1,
    name: "First Step",
    description: "Log your first waste recycling entry",
    icon: "🌱",
    pointsRequired: 10,
    category: "starter"
  },
  {
    id: 2,
    name: "Waste Sorter",
    description: "Earn 50 points by properly segregating waste",
    icon: "♻️",
    pointsRequired: 50,
    category: "recycling"
  },
  {
    id: 3,
    name: "Green Champion",
    description: "Reach 100 points contributing to a cleaner planet",
    icon: "🌿",
    pointsRequired: 100,
    category: "points"
  },
  {
    id: 4,
    name: "Eco Warrior",
    description: "Reach 250 points and keep up the momentum",
    icon: "🛡️",
    pointsRequired: 250,
    category: "points"
  },
  {
    id: 5,
    name: "Planet Savior",
    description: "Reach 500 points with consistent sustainable habits",
    icon: "🌍",
    pointsRequired: 500,
    category: "points"
  },
  {
    id: 6,
    name: "Master of Ecology",
    description: "Reach 1,000 points and inspire your community",
    icon: "👑",
    pointsRequired: 1000,
    category: "mastery"
  }
];

export const INITIAL_4_USERS = [
  {
    id: 1,
    clerkId: "user_3KrylqcsALAuyowFyP6FKxDeCK6",
    name: "Sadhana Selvakumar",
    email: "sdhnselvakumar@gmail.com",
    totalPoints: 0,
    level: 1,
    streak: 0,
    authToken: "eco_sec_1_sadhanaselvakumar"
  },
  {
    id: 2,
    clerkId: "demo_user_2",
    name: "Alex Rivera (Verified)",
    email: "alex.rivera@ecocycle.org",
    totalPoints: 79,
    level: 1,
    streak: 3,
    authToken: "eco_sec_2_alexrivera"
  },
  {
    id: 3,
    clerkId: "demo_user_3",
    name: "Maya Lin",
    email: "maya.lin@ecocycle.org",
    totalPoints: 278,
    level: 3,
    streak: 6,
    authToken: "eco_sec_3_mayalin"
  },
  {
    id: 4,
    clerkId: "demo_user_4",
    name: "David Kim",
    email: "david.kim@ecocycle.org",
    totalPoints: 122,
    level: 2,
    streak: 4,
    authToken: "eco_sec_4_davidkim"
  }
];

/**
 * Executes DDL statements and initial seed data if PostgreSQL is available.
 */
export async function initDatabase(pool, logger = console) {
  if (!pool) {
    logger.warn("[DB] No PostgreSQL pool available. Skipping schema init.");
    return false;
  }

  try {
    // 1. Verify connection
    await pool.query("SELECT 1");
    logger.info("[DB] PostgreSQL connection verified. Ensuring schema tables and indexes...");

    // 2. Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        total_points INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        streak INTEGER NOT NULL DEFAULT 0,
        last_log_date TEXT,
        auth_token TEXT UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
      CREATE INDEX IF NOT EXISTS idx_users_auth_token ON users(auth_token);

      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        category TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_achievements_points ON achievements(points_required);

      CREATE TABLE IF NOT EXISTS waste_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        points_earned INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_waste_logs_user_id ON waste_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_waste_logs_created_at ON waste_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_waste_logs_user_created ON waste_logs(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_waste_logs_category ON waste_logs(category);

      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uniq_user_achievement UNIQUE (user_id, achievement_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
    `);

    // 3. Seed default achievements if empty
    const achCountRes = await pool.query("SELECT COUNT(*)::int AS cnt FROM achievements");
    if (achCountRes.rows[0].cnt === 0) {
      for (const ach of DEFAULT_ACHIEVEMENTS) {
        await pool.query(
          `INSERT INTO achievements (id, name, description, icon, points_required, category)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (name) DO NOTHING`,
          [ach.id, ach.name, ach.description, ach.icon, ach.pointsRequired, ach.category]
        );
      }
      await pool.query("SELECT setval('achievements_id_seq', (SELECT MAX(id) FROM achievements))");
      logger.info("[DB] Default achievements seeded.");
    }

    // 4. Seed initial 4 users if users table is empty
    const userCountRes = await pool.query("SELECT COUNT(*)::int AS cnt FROM users");
    if (userCountRes.rows[0].cnt === 0) {
      for (const u of INITIAL_4_USERS) {
        await pool.query(
          `INSERT INTO users (id, clerk_id, name, email, total_points, level, streak, auth_token)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO NOTHING`,
          [u.id, u.clerkId, u.name, u.email, u.totalPoints, u.level, u.streak, u.authToken]
        );
      }
      await pool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
      logger.info("[DB] Initial 4 users seeded (Sadhana Selvakumar, Alex Rivera, Maya Lin, David Kim).");

      // 5. Seed sample logs for community users
      const sampleLogs = [
        { userId: 2, category: "recyclable", weightKg: 3.0, pointsEarned: 25, notes: "Office cardboard recycling" },
        { userId: 3, category: "organic", weightKg: 2.0, pointsEarned: 16, notes: "Compost kitchen scraps" },
        { userId: 3, category: "electronic", weightKg: 1.5, pointsEarned: 35, notes: "Recycled old keyboard and cords" },
        { userId: 4, category: "hazardous", weightKg: 1.0, pointsEarned: 22, notes: "Proper battery drop-off" }
      ];

      for (const l of sampleLogs) {
        await pool.query(
          `INSERT INTO waste_logs (user_id, category, weight_kg, points_earned, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [l.userId, l.category, l.weightKg, l.pointsEarned, l.notes]
        );
      }

      // 6. Seed unlocked achievements for community users
      const unlocked = [
        { userId: 3, achievementId: 1 },
        { userId: 3, achievementId: 2 },
        { userId: 3, achievementId: 3 },
        { userId: 3, achievementId: 4 },
        { userId: 4, achievementId: 1 },
        { userId: 4, achievementId: 2 },
        { userId: 4, achievementId: 3 }
      ];

      for (const ua of unlocked) {
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [ua.userId, ua.achievementId]
        );
      }
      logger.info("[DB] Initial community waste logs and achievements seeded.");
    }

    return true;
  } catch (err) {
    logger.warn({ err: err.message }, "[DB] Could not initialize PostgreSQL schema. Using fallback store.");
    return false;
  }
}
