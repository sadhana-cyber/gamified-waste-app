import React, { createContext, useContext } from "react";
import { useDbUser, DbUser } from "@/hooks/use-db-user";

interface DbUserContextValue {
  dbUser: DbUser | null;
  loading: boolean;
  updateName: (name: string) => Promise<boolean | undefined>;
  refetch: () => Promise<void>;
}

const DbUserContext = createContext<DbUserContextValue>({
  dbUser: null,
  loading: true,
  updateName: async () => undefined,
  refetch: async () => {},
});

export function DbUserProvider({ children }: { children: React.ReactNode }) {
  const value = useDbUser();
  return <DbUserContext.Provider value={value}>{children}</DbUserContext.Provider>;
}

export function useDbUserContext() {
  return useContext(DbUserContext);
}
