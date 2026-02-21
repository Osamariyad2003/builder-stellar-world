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
        mcqsData.push({
          id: doc.id,
          ...data,
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
      const newMCQ = {
        ...mcq,
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
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(docRef, updateData);
      console.log("✅ MCQ updated:", id);

      const updated = mcqs.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
      );
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
