import { createContext, useContext, useState } from "react";
import { MOCK_USERS } from "../lib/mockData";

const AuthContext = createContext(null);

/**
 * AuthProvider — in a real app this wraps ConvexProvider and uses
 * Convex Auth. For the mock/demo we manage a simple local state.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const DEMO_PASSWORD = "demo1234";

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
      setIsLoading(false);
      return { success: true, user };
    }

    setCurrentUser(null);
    setIsLoading(false);
    return { success: false };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role) => {
    setCurrentUser(MOCK_USERS[role] || MOCK_USERS.learner);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, logout, switchRole }}
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
