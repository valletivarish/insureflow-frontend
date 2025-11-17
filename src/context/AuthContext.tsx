import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { jwtDecode } from "jwt-decode";

import { apiClient, setAuthToken } from "../api/client";
import type { AuthUser, Role } from "../types";

interface JwtClaims {
  sub: string;
  role: Role;
  userId: string;
  exp?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "insureflow.auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseToken = (token: string): AuthUser | null => {
  try {
    const claims = jwtDecode<JwtClaims>(token);
    if (!claims.role || !claims.sub || !claims.userId) {
      return null;
    }
    return {
      username: claims.sub,
      role: claims.role,
      userId: claims.userId,
    };
  } catch (err) {
    console.warn("Failed to decode token", err);
    return null;
  }
};

const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as { token: string };
    const user = parseToken(parsed.token);
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return { token: null, user: null };
    }
    if (user && parsed.token) {
      const claims = jwtDecode<JwtClaims>(parsed.token);
      if (claims.exp && claims.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return { token: null, user: null };
      }
    }
    return { token: parsed.token, user };
  } catch (err) {
    console.warn("Failed to read auth storage", err);
    localStorage.removeItem(STORAGE_KEY);
    return { token: null, user: null };
  }
};

export function AuthProvider({ children }: PropsWithChildren) {
  const stored = useMemo(() => readStoredAuth(), []);
  const [token, setTokenState] = useState<string | null>(stored.token);
  const [user, setUser] = useState<AuthUser | null>(stored.user);

  useEffect(() => {
    setAuthToken(token);
    if (token && user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, user]);

  const logout = useCallback(() => {
    setTokenState(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { username, password });
    const accessToken: string = data.access_token;
    const nextUser = parseToken(accessToken);
    if (!nextUser) {
      throw new Error("Unable to parse login token");
    }
    setTokenState(accessToken);
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
