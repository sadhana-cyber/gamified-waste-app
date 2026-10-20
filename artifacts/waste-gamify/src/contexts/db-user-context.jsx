import { createContext, useContext } from "react";
import { useDbUser } from "@/hooks/use-db-user";

const DbUserContext = createContext({
  dbUser: null,
  accounts: [],
  loading: true,
  switchAccount: async () => false,
  updateName: async () => false,
  refetch: async () => {},
  loadAccounts: async () => []
});

function DbUserProvider({ children }) {
  const value = useDbUser();
  return <DbUserContext.Provider value={value}>{children}</DbUserContext.Provider>;
}

function useDbUserContext() {
  return useContext(DbUserContext);
}

export {
  DbUserProvider,
  useDbUserContext
};
