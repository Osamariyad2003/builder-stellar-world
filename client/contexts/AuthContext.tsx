import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthError(null);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message && error.message.includes("fetch")) {
        setAuthError("Network error - check your connection");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (error: any) {
      console.error("Logout error:", error);
      // Even if logout fails, clear the user locally
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // Add timeout for auth initialization
    const authTimeout = setTimeout(() => {
      if (loading) {
        console.log(
          "🔄 Auth taking too long - continuing without authentication",
        );
        setLoading(false);
        // For development/offline mode, you could set a mock user here
        // setCurrentUser({ email: "offline@medjust.com" } as User);
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(authTimeout);
        setCurrentUser(user);
        setLoading(false);
        setAuthError(null);
      },
      (error) => {
        clearTimeout(authTimeout);
        console.error("Auth state change error:", error);
        setAuthError("Authentication error - working offline");
        setLoading(false);
        // Continue without auth in offline mode
      },
    );

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
