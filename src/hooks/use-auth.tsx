"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        await fetchUser();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Login failed");

    // Fetch full user with permissions after login
    await fetchUser();
    router.push("/dashboard");
    router.refresh();
  }, [router, fetchUser]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  // Auto-refresh token before expiry
  useEffect(() => {
    fetchUser();
    const interval = setInterval(() => refresh(), 13 * 60 * 1000); // Refresh 2 min before 15min expiry
    return () => clearInterval(interval);
  }, [fetchUser, refresh]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
