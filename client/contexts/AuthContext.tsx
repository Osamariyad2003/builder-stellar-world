import React, { createContext, useContext, useEffect, useState } from "react";

// Mock user interface for demo
interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  currentUser: MockUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Demo credentials for testing
const DEMO_CREDENTIALS = {
  email: "admin@medjust.com",
  password: "demo123",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    // Mock authentication - accepts demo credentials or any email/password for demo
    if (
      (email === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password) ||
      (email.includes("@") && password.length >= 3)
    ) {
      const mockUser: MockUser = {
        uid: "demo-user-123",
        email: email,
        displayName: "Admin User",
      };
      setCurrentUser(mockUser);
      localStorage.setItem("mockUser", JSON.stringify(mockUser));
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem("mockUser");
  };

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("mockUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("mockUser");
      }
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
