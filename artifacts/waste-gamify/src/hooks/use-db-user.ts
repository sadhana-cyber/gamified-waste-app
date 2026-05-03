import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";

export interface DbUser {
  id: number;
  name: string;
  email: string;
  totalPoints: number;
  level: number;
  streak: number;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function useDbUser() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      const res = await fetch(`${BASE}/api/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
        name: user.username || user.fullName || email.split("@")[0],
          email,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    sync();
  }, [isLoaded, sync]);

  const updateName = useCallback(async (newName: string) => {
    if (!dbUser) return;
    const res = await fetch(`${BASE}/api/users/${dbUser.id}/name`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const data = await res.json();
      setDbUser(data);
    }
    return res.ok;
  }, [dbUser]);

  return { dbUser, loading, updateName, refetch: sync };
}
