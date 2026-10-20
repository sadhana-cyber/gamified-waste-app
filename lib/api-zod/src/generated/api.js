import * as zod from "zod";
const HealthCheckResponse = zod.object({
  status: zod.string()
});
const ListUsersResponseItem = zod.object({
  id: zod.number(),
  name: zod.string(),
  email: zod.string(),
  totalPoints: zod.number(),
  level: zod.number(),
  streak: zod.number(),
  createdAt: zod.coerce.date()
});
const ListUsersResponse = zod.array(ListUsersResponseItem);
const CreateUserBody = zod.object({
  name: zod.string(),
  email: zod.string()
});
const GetUserParams = zod.object({
  id: zod.coerce.number()
});
const GetUserResponse = zod.object({
  id: zod.number(),
  name: zod.string(),
  email: zod.string(),
  totalPoints: zod.number(),
  level: zod.number(),
  streak: zod.number(),
  createdAt: zod.coerce.date()
});
const GetUserStatsParams = zod.object({
  id: zod.coerce.number()
});
const GetUserStatsResponse = zod.object({
  userId: zod.number(),
  totalWeight: zod.number(),
  totalLogs: zod.number(),
  byCategory: zod.array(
    zod.object({
      category: zod.string(),
      weightKg: zod.number(),
      count: zod.number(),
      points: zod.number()
    })
  ),
  weeklyPoints: zod.number(),
  monthlyPoints: zod.number()
});
const GetUserAchievementsParams = zod.object({
  id: zod.coerce.number()
});
const GetUserAchievementsResponseItem = zod.object({
  id: zod.number(),
  achievement: zod.object({
    id: zod.number(),
    name: zod.string(),
    description: zod.string(),
    icon: zod.string(),
    pointsRequired: zod.number(),
    category: zod.string()
  }),
  unlockedAt: zod.coerce.date()
});
const GetUserAchievementsResponse = zod.array(
  GetUserAchievementsResponseItem
);
const ListWasteLogsQueryParams = zod.object({
  userId: zod.coerce.number().optional(),
  category: zod.coerce.string().optional()
});
const ListWasteLogsResponseItem = zod.object({
  id: zod.number(),
  userId: zod.number(),
  userName: zod.string(),
  category: zod.enum([
    "recyclable",
    "organic",
    "hazardous",
    "general",
    "electronic"
  ]),
  weightKg: zod.number(),
  pointsEarned: zod.number(),
  notes: zod.string().optional(),
  createdAt: zod.coerce.date()
});
const ListWasteLogsResponse = zod.array(ListWasteLogsResponseItem);
const CreateWasteLogBody = zod.object({
  userId: zod.number(),
  category: zod.enum([
    "recyclable",
    "organic",
    "hazardous",
    "general",
    "electronic"
  ]),
  weightKg: zod.number(),
  notes: zod.string().optional()
});
const ListAchievementsResponseItem = zod.object({
  id: zod.number(),
  name: zod.string(),
  description: zod.string(),
  icon: zod.string(),
  pointsRequired: zod.number(),
  category: zod.string()
});
const ListAchievementsResponse = zod.array(ListAchievementsResponseItem);
const getLeaderboardQueryLimitDefault = 10;
const GetLeaderboardQueryParams = zod.object({
  limit: zod.coerce.number().default(getLeaderboardQueryLimitDefault)
});
const GetLeaderboardResponseItem = zod.object({
  rank: zod.number(),
  userId: zod.number(),
  name: zod.string(),
  totalPoints: zod.number(),
  level: zod.number(),
  streak: zod.number(),
  totalLogs: zod.number()
});
const GetLeaderboardResponse = zod.array(GetLeaderboardResponseItem);
const RequestUploadUrlBody = zod.object({
  name: zod.string(),
  size: zod.number(),
  contentType: zod.string()
});
const RequestUploadUrlResponse = zod.object({
  uploadURL: zod.string(),
  objectPath: zod.string(),
  metadata: zod.object({
    name: zod.string(),
    size: zod.number(),
    contentType: zod.string()
  })
});
const GetPlatformStatsResponse = zod.object({
  totalUsers: zod.number(),
  totalLogs: zod.number(),
  totalWeightKg: zod.number(),
  totalPointsAwarded: zod.number(),
  topCategory: zod.string(),
  co2SavedKg: zod.number()
});
const getRecentActivityQueryLimitDefault = 20;
const GetRecentActivityQueryParams = zod.object({
  limit: zod.coerce.number().default(getRecentActivityQueryLimitDefault)
});
const GetRecentActivityResponseItem = zod.object({
  id: zod.number(),
  userId: zod.number(),
  userName: zod.string(),
  category: zod.string(),
  weightKg: zod.number(),
  pointsEarned: zod.number(),
  createdAt: zod.coerce.date()
});
const GetRecentActivityResponse = zod.array(
  GetRecentActivityResponseItem
);
export {
  CreateUserBody,
  CreateWasteLogBody,
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
  GetLeaderboardResponseItem,
  GetPlatformStatsResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
  GetRecentActivityResponseItem,
  GetUserAchievementsParams,
  GetUserAchievementsResponse,
  GetUserAchievementsResponseItem,
  GetUserParams,
  GetUserResponse,
  GetUserStatsParams,
  GetUserStatsResponse,
  HealthCheckResponse,
  ListAchievementsResponse,
  ListAchievementsResponseItem,
  ListUsersResponse,
  ListUsersResponseItem,
  ListWasteLogsQueryParams,
  ListWasteLogsResponse,
  ListWasteLogsResponseItem,
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
  getLeaderboardQueryLimitDefault,
  getRecentActivityQueryLimitDefault
};
