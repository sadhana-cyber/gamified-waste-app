import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
const getHealthCheckUrl = () => {
  return `/api/healthz`;
};
const healthCheck = async (options) => {
  return customFetch(getHealthCheckUrl(), {
    ...options,
    method: "GET"
  });
};
const getHealthCheckQueryKey = () => {
  return [`/api/healthz`];
};
const getHealthCheckQueryOptions = (options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey();
  const queryFn = ({
    signal
  }) => healthCheck({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useHealthCheck(options) {
  const queryOptions = getHealthCheckQueryOptions(options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getListUsersUrl = () => {
  return `/api/users`;
};
const listUsers = async (options) => {
  return customFetch(getListUsersUrl(), {
    ...options,
    method: "GET"
  });
};
const getListUsersQueryKey = () => {
  return [`/api/users`];
};
const getListUsersQueryOptions = (options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListUsersQueryKey();
  const queryFn = ({
    signal
  }) => listUsers({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useListUsers(options) {
  const queryOptions = getListUsersQueryOptions(options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getCreateUserUrl = () => {
  return `/api/users`;
};
const createUser = async (createUserBody, options) => {
  return customFetch(getCreateUserUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(createUserBody)
  });
};
const getCreateUserMutationOptions = (options) => {
  const mutationKey = ["createUser"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { data } = props ?? {};
    return createUser(data, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const useCreateUser = (options) => {
  return useMutation(getCreateUserMutationOptions(options));
};
const getGetUserUrl = (id) => {
  return `/api/users/${id}`;
};
const getUser = async (id, options) => {
  return customFetch(getGetUserUrl(id), {
    ...options,
    method: "GET"
  });
};
const getGetUserQueryKey = (id) => {
  return [`/api/users/${id}`];
};
const getGetUserQueryOptions = (id, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetUserQueryKey(id);
  const queryFn = ({
    signal
  }) => getUser(id, { signal, ...requestOptions });
  return {
    queryKey,
    queryFn,
    enabled: !!id,
    ...queryOptions
  };
};
function useGetUser(id, options) {
  const queryOptions = getGetUserQueryOptions(id, options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getGetUserStatsUrl = (id) => {
  return `/api/users/${id}/stats`;
};
const getUserStats = async (id, options) => {
  return customFetch(getGetUserStatsUrl(id), {
    ...options,
    method: "GET"
  });
};
const getGetUserStatsQueryKey = (id) => {
  return [`/api/users/${id}/stats`];
};
const getGetUserStatsQueryOptions = (id, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetUserStatsQueryKey(id);
  const queryFn = ({
    signal
  }) => getUserStats(id, { signal, ...requestOptions });
  return {
    queryKey,
    queryFn,
    enabled: !!id,
    ...queryOptions
  };
};
function useGetUserStats(id, options) {
  const queryOptions = getGetUserStatsQueryOptions(id, options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getGetUserAchievementsUrl = (id) => {
  return `/api/users/${id}/achievements`;
};
const getUserAchievements = async (id, options) => {
  return customFetch(getGetUserAchievementsUrl(id), {
    ...options,
    method: "GET"
  });
};
const getGetUserAchievementsQueryKey = (id) => {
  return [`/api/users/${id}/achievements`];
};
const getGetUserAchievementsQueryOptions = (id, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetUserAchievementsQueryKey(id);
  const queryFn = ({ signal }) => getUserAchievements(id, { signal, ...requestOptions });
  return {
    queryKey,
    queryFn,
    enabled: !!id,
    ...queryOptions
  };
};
function useGetUserAchievements(id, options) {
  const queryOptions = getGetUserAchievementsQueryOptions(id, options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getListWasteLogsUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/waste-logs?${stringifiedParams}` : `/api/waste-logs`;
};
const listWasteLogs = async (params, options) => {
  return customFetch(getListWasteLogsUrl(params), {
    ...options,
    method: "GET"
  });
};
const getListWasteLogsQueryKey = (params) => {
  return [`/api/waste-logs`, ...params ? [params] : []];
};
const getListWasteLogsQueryOptions = (params, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListWasteLogsQueryKey(params);
  const queryFn = ({
    signal
  }) => listWasteLogs(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useListWasteLogs(params, options) {
  const queryOptions = getListWasteLogsQueryOptions(params, options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getCreateWasteLogUrl = () => {
  return `/api/waste-logs`;
};
const createWasteLog = async (createWasteLogBody, options) => {
  return customFetch(getCreateWasteLogUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(createWasteLogBody)
  });
};
const getCreateWasteLogMutationOptions = (options) => {
  const mutationKey = ["createWasteLog"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { data } = props ?? {};
    return createWasteLog(data, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const useCreateWasteLog = (options) => {
  return useMutation(getCreateWasteLogMutationOptions(options));
};
const getListAchievementsUrl = () => {
  return `/api/achievements`;
};
const listAchievements = async (options) => {
  return customFetch(getListAchievementsUrl(), {
    ...options,
    method: "GET"
  });
};
const getListAchievementsQueryKey = () => {
  return [`/api/achievements`];
};
const getListAchievementsQueryOptions = (options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListAchievementsQueryKey();
  const queryFn = ({ signal }) => listAchievements({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useListAchievements(options) {
  const queryOptions = getListAchievementsQueryOptions(options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getGetLeaderboardUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/leaderboard?${stringifiedParams}` : `/api/leaderboard`;
};
const getLeaderboard = async (params, options) => {
  return customFetch(getGetLeaderboardUrl(params), {
    ...options,
    method: "GET"
  });
};
const getGetLeaderboardQueryKey = (params) => {
  return [`/api/leaderboard`, ...params ? [params] : []];
};
const getGetLeaderboardQueryOptions = (params, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetLeaderboardQueryKey(params);
  const queryFn = ({
    signal
  }) => getLeaderboard(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useGetLeaderboard(params, options) {
  const queryOptions = getGetLeaderboardQueryOptions(params, options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getRequestUploadUrlUrl = () => {
  return `/api/storage/uploads/request-url`;
};
const requestUploadUrl = async (requestUploadUrlBody, options) => {
  return customFetch(getRequestUploadUrlUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(requestUploadUrlBody)
  });
};
const getRequestUploadUrlMutationOptions = (options) => {
  const mutationKey = ["requestUploadUrl"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { data } = props ?? {};
    return requestUploadUrl(data, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const useRequestUploadUrl = (options) => {
  return useMutation(getRequestUploadUrlMutationOptions(options));
};
const getGetPlatformStatsUrl = () => {
  return `/api/platform-stats`;
};
const getPlatformStats = async (options) => {
  return customFetch(getGetPlatformStatsUrl(), {
    ...options,
    method: "GET"
  });
};
const getGetPlatformStatsQueryKey = () => {
  return [`/api/platform-stats`];
};
const getGetPlatformStatsQueryOptions = (options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetPlatformStatsQueryKey();
  const queryFn = ({ signal }) => getPlatformStats({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useGetPlatformStats(options) {
  const queryOptions = getGetPlatformStatsQueryOptions(options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
const getGetRecentActivityUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/activity?${stringifiedParams}` : `/api/activity`;
};
const getRecentActivity = async (params, options) => {
  return customFetch(getGetRecentActivityUrl(params), {
    ...options,
    method: "GET"
  });
};
const getGetRecentActivityQueryKey = (params) => {
  return [`/api/activity`, ...params ? [params] : []];
};
const getGetRecentActivityQueryOptions = (params, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetRecentActivityQueryKey(params);
  const queryFn = ({ signal }) => getRecentActivity(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function useGetRecentActivity(params, options) {
  const queryOptions = getGetRecentActivityQueryOptions(params, options);
  const query = useQuery(queryOptions);
  return { ...query, queryKey: queryOptions.queryKey };
}
export {
  createUser,
  createWasteLog,
  getCreateUserMutationOptions,
  getCreateUserUrl,
  getCreateWasteLogMutationOptions,
  getCreateWasteLogUrl,
  getGetLeaderboardQueryKey,
  getGetLeaderboardQueryOptions,
  getGetLeaderboardUrl,
  getGetPlatformStatsQueryKey,
  getGetPlatformStatsQueryOptions,
  getGetPlatformStatsUrl,
  getGetRecentActivityQueryKey,
  getGetRecentActivityQueryOptions,
  getGetRecentActivityUrl,
  getGetUserAchievementsQueryKey,
  getGetUserAchievementsQueryOptions,
  getGetUserAchievementsUrl,
  getGetUserQueryKey,
  getGetUserQueryOptions,
  getGetUserStatsQueryKey,
  getGetUserStatsQueryOptions,
  getGetUserStatsUrl,
  getGetUserUrl,
  getHealthCheckQueryKey,
  getHealthCheckQueryOptions,
  getHealthCheckUrl,
  getLeaderboard,
  getListAchievementsQueryKey,
  getListAchievementsQueryOptions,
  getListAchievementsUrl,
  getListUsersQueryKey,
  getListUsersQueryOptions,
  getListUsersUrl,
  getListWasteLogsQueryKey,
  getListWasteLogsQueryOptions,
  getListWasteLogsUrl,
  getPlatformStats,
  getRecentActivity,
  getRequestUploadUrlMutationOptions,
  getRequestUploadUrlUrl,
  getUser,
  getUserAchievements,
  getUserStats,
  healthCheck,
  listAchievements,
  listUsers,
  listWasteLogs,
  requestUploadUrl,
  useCreateUser,
  useCreateWasteLog,
  useGetLeaderboard,
  useGetPlatformStats,
  useGetRecentActivity,
  useGetUser,
  useGetUserAchievements,
  useGetUserStats,
  useHealthCheck,
  useListAchievements,
  useListUsers,
  useListWasteLogs,
  useRequestUploadUrl
};
