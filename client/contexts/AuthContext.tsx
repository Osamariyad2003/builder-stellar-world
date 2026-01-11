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

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const login = async (email: string, password: string) => {
    // Basic quick check for navigator online status
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const err = new Error("No network connection (navigator offline)");
      console.error("Login pre-check failed:", err);
      setAuthError("No network connection - please connect to the internet");
      throw err;
    }

    const maxAttempts = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        // Try sign-in
        await signInWithEmailAndPassword(auth, email, password);
        setAuthError(null);
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`Login attempt ${attempt} failed:`, error);

        // If it's not a network related error, break immediately and surface it
        const isNetworkError =
          error?.code === "auth/network-request-failed" ||
          (error?.message && error.message.toLowerCase().includes("fetch"));

        if (!isNetworkError) {
          if (
            error?.code === "auth/wrong-password" ||
            error?.code === "auth/user-not-found" ||
            error?.code === "auth/invalid-credential"
          ) {
            setAuthError("Invalid email or password");
          } else {
            setAuthError("Authentication error - see console for details");
          }
          throw error;
        }

        // For network errors, retry with exponential backoff
        setAuthError(
          `Network error (attempt ${attempt} of ${maxAttempts}) - checking connection...`,
        );

        if (attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          console.log(`Retrying login in ${backoff}ms...`);
          // small pause before retrying
          // eslint-disable-next-line no-await-in-loop
          await sleep(backoff);
          continue;
        }
      }
    }

    // After retries failed, provide a helpful diagnostic message
    console.error("Login failed after retries:", lastError);
    setAuthError(
      "Network error - unable to reach Firebase. Check your internet connection, disabling browser extensions (adblockers), or ensure your site domain is added to Firebase Authentication -> Authorized domains.",
    );
    throw lastError;
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
