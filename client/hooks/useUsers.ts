import { User as SharedUser } from "@shared/types";
import React, { useState, useEffect } from "react";
import { User as SharedUser } from "@shared/types";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useYears } from "@/hooks/useYears";

// Mock users for offline/dev
const mockUsers: SharedUser[] = [
  {
    id: "user_1",
    displayName: "Ali Ahmed",
    email: "ali.ahmed@example.com",
    role: "student",
    photoURL: "",
    createdAt: new Date(),
  },
  {
    id: "user_2",
    displayName: "Mona Hassan",
    email: "mona.hassan@example.com",
    role: "staff",
    photoURL: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

export function useUsers() {
  const [users, setUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const testAndListen = async () => {
      try {
        // Quick permission test
        const testQ = query(collection(db, "users"));
        await getDocs(testQ);

        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(
          q,
          (snap) => {
            const data: SharedUser[] = [];
            snap.forEach((d) => {
              const v = d.data() as any;
              data.push({
                id: d.id,
                displayName: v.displayName || v.name || "",
                email: v.email || "",
                role: v.role || "student",
                photoURL: v.photoURL || v.avatar || "",
                createdAt: v.createdAt?.toDate?.() || undefined,
              });
            });
            setUsers(data);
            setLoading(false);
          },
          (err) => {
            console.error("Failed to listen to users:", err);
            enterOffline();
          },
        );
        return () => unsub();
      } catch (err) {
        console.error("Failed to load users, entering offline mode:", err);
        enterOffline();
      }
    };

    const enterOffline = () => {
      setIsOfflineMode(true);
      setUsers(mockUsers);
      setLoading(false);
      setError(null);
    };

    testAndListen();
  }, []);

  const updateUser = async (id: string, payload: Partial<SharedUser>) => {
    if (isOfflineMode || id.startsWith("mock_") || id.startsWith("offline_")) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...payload } : u)));
      return;
    }
    try {
      await updateDoc(doc(db, "users", id), payload as any);
    } catch (err) {
      console.error("Failed to update user:", err);
      // local fallback
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...payload } : u)));
    }
  };

  const deleteUser = async (id: string) => {
    if (isOfflineMode || id.startsWith("mock_") || id.startsWith("offline_")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      console.error("Failed to delete user:", err);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return { users, loading, error, updateUser, deleteUser, isOfflineMode };
}
