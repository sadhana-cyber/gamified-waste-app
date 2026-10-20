import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
  path.resolve(process.cwd(), "artifacts/data/store.json"),
  path.resolve(process.cwd(), "../data/store.json"),
  path.resolve(__dirname, "../../data/store.json"),
  path.resolve(__dirname, "../../../data/store.json")
];
const storePath = candidatePaths.find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), "artifacts/data/store.json");
const dataDir = path.dirname(storePath);

// In-memory data store with file persistence for local development when PostgreSQL is not connected
export const inMemoryUsers = [];
export const inMemoryWasteLogs = [];
export const inMemoryUserAchievements = [];

let nextUserId = 1;
let nextLogId = 1;
let nextUserAchievementId = 1;

try {
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data.users)) inMemoryUsers.push(...data.users);
    if (Array.isArray(data.wasteLogs)) inMemoryWasteLogs.push(...data.wasteLogs);
    if (Array.isArray(data.userAchievements)) inMemoryUserAchievements.push(...data.userAchievements);
    if (data.nextUserId) nextUserId = data.nextUserId;
    if (data.nextLogId) nextLogId = data.nextLogId;
    if (data.nextUserAchievementId) nextUserAchievementId = data.nextUserAchievementId;
  }
} catch {
  // Start with clean initial state if no store exists
}

export function saveStore() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = {
      users: inMemoryUsers,
      wasteLogs: inMemoryWasteLogs,
      userAchievements: inMemoryUserAchievements,
      nextUserId,
      nextLogId,
      nextUserAchievementId
    };
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save store.json:", e.message);
  }
}

export function getNextUserId() {
  const id = nextUserId++;
  saveStore();
  return id;
}

export function getNextLogId() {
  const id = nextLogId++;
  saveStore();
  return id;
}

export function getNextUserAchievementId() {
  const id = nextUserAchievementId++;
  saveStore();
  return id;
}
