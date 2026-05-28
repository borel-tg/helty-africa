import { createContext, useContext, useEffect, useState } from "react";
import { MOCK_USERS } from "../lib/mockData";

const AuthContext = createContext(null);
const SESSION_KEY = "helty_session";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw);
    return Object.values(MOCK_USERS).find((u) => u._id === userId) ?? null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user._id }));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * AuthProvider — in a real app this wraps ConvexProvider and uses
 * Convex Auth. For the mock/demo we persist the session in localStorage.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const DEMO_PASSWORD = "demo1234";

  useEffect(() => {
    const stored = readStoredUser();
    if (stored) setCurrentUser(stored);
    setIsInitializing(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate network

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    const user = Object.values(MOCK_USERS).find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (user && normalizedPassword === DEMO_PASSWORD) {
      setCurrentUser(user);
      persistUser(user);
      setIsLoading(false);
      return { success: true, user };
    }

    setCurrentUser(null);
    persistUser(null);
    setIsLoading(false);
    return { success: false };
  };

  const logout = () => {
    setCurrentUser(null);
    persistUser(null);
  };

  const switchRole = (role) => {
    const user = MOCK_USERS[role] || MOCK_USERS.learner;
    setCurrentUser(user);
    persistUser(user);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, isInitializing, login, logout, switchRole }}
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
