import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import cacheManager from "@/lib/cacheManager";
import {
  isFirebaseInOfflineMode,
  isExtensionBlocking,
  addOfflineModeListener,
} from "@/lib/firebaseMonitor";
import { MCQ } from "@shared/types";

export function useMCQ() {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");

  const activateOfflineMode = () => {
    console.log("🔄 Activating offline mode for MCQs");
    setIsOfflineMode(true);
    setConnectionStatus("offline");
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = addOfflineModeListener(() => {
      if (isFirebaseInOfflineMode() || isExtensionBlocking()) {
        activateOfflineMode();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchMCQs();
  }, []);

  const fetchMCQs = async () => {
    if (isFirebaseInOfflineMode() || isExtensionBlocking()) {
      activateOfflineMode();
      const cached = cacheManager.getCache<MCQ[]>("mcqs");
      if (cached) setMcqs(cached);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setConnectionStatus("connecting");

      const q = query(collection(db, "mcqs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const seenIds = new Set<string>();
      const mcqsData: MCQ[] = [];

      snapshot.docs.forEach((doc) => {
        if (seenIds.has(doc.id)) return;
        seenIds.add(doc.id);
        const data = doc.data();
        const yn = data.yearNumber;
        const yearNumber =
          typeof yn === "number" && yn >= 1 && yn <= 6
            ? Math.trunc(yn)
            : typeof yn === "string" && /^[1-6]$/.test(yn.trim())
              ? parseInt(yn.trim(), 10)
              : undefined;
        mcqsData.push({
          id: doc.id,
          ...data,
          subjectId: data.subjectId || undefined,
          yearNumber,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as MCQ);
      });

      setMcqs(mcqsData);
      cacheManager.setCache("mcqs", mcqsData);
      setConnectionStatus("connected");
    } catch (err: any) {
      const errMsg = err?.message || "Failed to fetch MCQs";
      console.error("Error fetching MCQs:", errMsg);
      setError(errMsg);
      activateOfflineMode();
    } finally {
      setLoading(false);
    }
  };

  const createMCQ = async (mcq: Partial<MCQ>) => {
    if (isOfflineMode) {
      alert("Cannot create MCQ in offline mode");
      return;
    }

    try {
      const { yearNumber: ynRaw, ...mcqRest } = mcq;
      const yearNumber =
        typeof ynRaw === "number" && ynRaw >= 1 && ynRaw <= 6
          ? Math.trunc(ynRaw)
          : undefined;
      const newMCQ = {
        ...mcqRest,
        subjectId: mcq.subjectId || undefined,
        ...(yearNumber !== undefined ? { yearNumber } : {}),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
      };

      const docRef = await addDoc(collection(db, "mcqs"), newMCQ);
      console.log("✅ MCQ created:", docRef.id);

      const newItem: MCQ = {
        id: docRef.id,
        ...newMCQ,
      } as MCQ;

      const updated = [newItem, ...mcqs];
      setMcqs(updated);
      cacheManager.setCache("mcqs", updated);

      return docRef.id;
    } catch (err) {
      console.error("Error creating MCQ:", err);
      throw err;
    }
  };

  const updateMCQ = async (id: string, updates: Partial<MCQ>) => {
    if (isOfflineMode) {
      alert("Cannot update MCQ in offline mode");
      return;
    }

    try {
      const docRef = doc(db, "mcqs", id);
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date(),
      };
      if ("yearNumber" in updates) {
        const y = updates.yearNumber;
        if (typeof y === "number" && y >= 1 && y <= 6 && Number.isFinite(y)) {
          updateData.yearNumber = Math.trunc(y);
        } else {
          delete updateData.yearNumber;
        }
      }

      await updateDoc(docRef, updateData as Parameters<typeof updateDoc>[1]);
      console.log("✅ MCQ updated:", id);

      const updated = mcqs.map((m) => {
        if (m.id !== id) return m;
        const merged: MCQ = { ...m, ...updates, updatedAt: new Date() };
        if ("yearNumber" in updates) {
          const y = updates.yearNumber;
          if (typeof y === "number" && y >= 1 && y <= 6 && Number.isFinite(y)) {
            merged.yearNumber = Math.trunc(y);
          } else {
            merged.yearNumber = m.yearNumber;
          }
        }
        return merged;
      });
      setMcqs(updated);
      cacheManager.setCache("mcqs", updated);
    } catch (err) {
      console.error("Error updating MCQ:", err);
      throw err;
    }
  };

  const deleteMCQ = async (id: string) => {
    if (isOfflineMode) {
      alert("Cannot delete MCQ in offline mode");
      return;
    }

    try {
      await deleteDoc(doc(db, "mcqs", id));
      console.log("✅ MCQ deleted:", id);

      const updated = mcqs.filter((m) => m.id !== id);
      setMcqs(updated);
      cacheManager.setCache("mcqs", updated);
    } catch (err) {
      console.error("Error deleting MCQ:", err);
      throw err;
    }
  };

  const clearCache = () => {
    cacheManager.clearCache("mcqs");
    fetchMCQs();
  };

  const retryConnection = () => {
    setIsOfflineMode(false);
    fetchMCQs();
  };

  return {
    mcqs,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    createMCQ,
    updateMCQ,
    deleteMCQ,
    clearCache,
    retryConnection,
  };
}
