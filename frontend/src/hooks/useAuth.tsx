"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { clearSession, getStoredUser, saveSession } from "../lib/auth";
import { TokenResponse, User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  loginDemo: () => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize from the persisted session; deferred via effect callback to
  // avoid hydration mismatches between the server render and the client.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(getStoredUser());
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = (token: string, nextUser: User) => {
    saveSession(token, nextUser);
    setUser(nextUser);
  };

  const loginDemo = async () => {
    try {
      const res: TokenResponse = await api.demoLogin();
      login(res.access_token, res.user);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error("Demo login failed. Is the backend running?");
    }
  };

  const loginDemoAdmin = async () => {
    const res: TokenResponse = await api.demoAdminLogin();
    login(res.access_token, res.user);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, loginDemoAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}