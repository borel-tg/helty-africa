import { createContext, useContext, useEffect, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);
const SESSION_KEY = "helty_session";

function readStoredUserId() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw);
    return userId ?? null;
  } catch {
    return null;
  }
}

function persistUserId(userId) {
  if (userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/** Auth against Convex users table (email + passwordHash). */
export function AuthProvider({ children }) {
  const convex = useConvex();
  const loginMutation = useMutation(api.auth.login);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const userId = readStoredUserId();
    if (!userId) {
      setIsInitializing(false);
      return;
    }

    convex
      .query(api.auth.getSession, { userId })
      .then((user) => {
        if (cancelled) return;
        if (user) setCurrentUser(user);
        else persistUserId(null);
        setIsInitializing(false);
      })
      .catch(() => {
        if (cancelled) return;
        persistUserId(null);
        setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [convex]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const result = await loginMutation({ email, password });
      if (result.success) {
        setCurrentUser(result.user);
        persistUserId(result.user._id);
        return { success: true, user: result.user };
      }
      setCurrentUser(null);
      persistUserId(null);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    persistUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, isInitializing, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
