import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Wire API client to include session auth token in every request automatically
setAuthTokenGetter(async () => {
  return localStorage.getItem("ecocycle_auth_token") || null;
});

const CLEAN_EMPTY_USER = {
  id: 1,
  name: "User",
  email: "",
  totalPoints: 0,
  level: 1,
  streak: 0,
  authToken: "eco_sec_1_user",
  createdAt: new Date().toISOString()
};

function useDbUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState(CLEAN_EMPTY_USER);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const isSwitchingRef = useRef(false);

  // Load available multi-user accounts
  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/users/auth/accounts`, { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        setAccounts(list);
        return list;
      }
    } catch (err) {
      console.warn("Failed to fetch multi-user accounts:", err);
    }
    return [];
  }, []);

  // Sync current user
  const sync = useCallback(async () => {
    const list = await loadAccounts();
    const savedActiveId = localStorage.getItem("ecocycle_active_user_id");

    // If user explicitly switched to another account, maintain that active session
    if (savedActiveId && list.length > 0) {
      const target = list.find((u) => u.id === Number(savedActiveId));
      if (target) {
        localStorage.setItem("ecocycle_auth_token", target.authToken || `eco_sec_${target.id}`);
        setDbUser(target);
        setLoading(false);
        return;
      }
    }

    if (!clerkUser) {
      if (list.length > 0) {
        const first = list[0];
        localStorage.setItem("ecocycle_auth_token", first.authToken || `eco_sec_${first.id}`);
        setDbUser(first);
      } else {
        setDbUser(CLEAN_EMPTY_USER);
      }
      setLoading(false);
      return;
    }

    const defaultName = clerkUser?.fullName || clerkUser?.username || clerkUser?.firstName || "User";
    const defaultEmail = clerkUser?.primaryEmailAddress?.emailAddress || `${clerkUser?.id}@ecocycle.local`;

    try {
      const res = await fetch(`${BASE}/api/users/sync`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: clerkUser.id,
          name: defaultName,
          email: defaultEmail
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authToken) {
          localStorage.setItem("ecocycle_auth_token", data.authToken);
        }
        localStorage.setItem("ecocycle_active_user_id", String(data.id));
        setDbUser(data);
        await loadAccounts();
      }
    } catch (err) {
      console.warn("Sync failed:", err);
    } finally {
      setLoading(false);
    }
  }, [clerkUser, loadAccounts]);

  useEffect(() => {
    if (!isLoaded) return;
    sync();
  }, [isLoaded, sync]);

  // Switch active user session seamlessly
  const switchAccount = useCallback(async (targetUserId) => {
    isSwitchingRef.current = true;
    const target = accounts.find((u) => u.id === Number(targetUserId));
    if (!target) return false;

    const token = target.authToken || `eco_sec_${target.id}_${target.name.toLowerCase().replace(/[^a-z]/g, "")}`;
    localStorage.setItem("ecocycle_active_user_id", String(target.id));
    localStorage.setItem("ecocycle_auth_token", token);
    setDbUser(target);
    return true;
  }, [accounts]);

  // Securely update user name
  const updateName = useCallback(
    async (newName) => {
      if (!newName || !newName.trim()) return false;
      const cleanName = newName.trim();
      const currentToken = localStorage.getItem("ecocycle_auth_token") || dbUser?.authToken;

      // Update state locally immediately for instant feedback
      setDbUser((prev) => ({ ...prev, name: cleanName }));

      try {
        const res = await fetch(`${BASE}/api/users/${dbUser.id}/name`, {
          method: "PATCH",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
            "x-user-token": currentToken
          },
          body: JSON.stringify({ name: cleanName })
        });
        if (res.ok) {
          const updated = await res.json();
          setDbUser(updated);
          await loadAccounts();
          return true;
        } else {
          const err = await res.json().catch(() => ({}));
          console.error("Update name rejected:", err);
          return false;
        }
      } catch (e) {
        console.warn("Failed to patch name:", e);
        return false;
      }
    },
    [dbUser, loadAccounts]
  );

  return {
    dbUser,
    accounts,
    loading,
    switchAccount,
    updateName,
    refetch: sync,
    loadAccounts
  };
}

export { useDbUser };
