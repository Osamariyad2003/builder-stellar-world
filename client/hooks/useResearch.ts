import { useState, useEffect } from "react";
import { Research } from "@shared/types";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Mock data for development
const mockResearch: Research[] = [
  {
    id: "r1",
    projectTitle: "Impact of Early Clinical Exposure on Medical Students",
    abstract:
      "A study investigating how early clinical exposure affects students' clinical reasoning and confidence.",
    fieldOfResearch: ["Medical Education", "Clinical Skills"],
    contactPerson: ["Dr. Sarah Johnson"],
    authorshipPosition: ["Lead", "Co-author"],
    projectDuration: "6 months",
    requiredSkills: ["Clinical observation", "Data analysis"],
    supervisor: "Prof. Michael Chen",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function useResearch() {
  const [research, setResearch] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        const testQuery = query(collection(db, "research"));
        await getDocs(testQuery);

        const q = query(collection(db, "research"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const data: Research[] = [];
            querySnapshot.forEach((docSnap) => {
              const d = docSnap.data() as any;
              data.push({
                id: docSnap.id,
                projectTitle: d.projectTitle || d.title || "",
                abstract: d.abstract || "",
                fieldOfResearch: d.fieldOfResearch || [],
                contactPerson: d.contactPerson || [],
                authorshipPosition: d.authorshipPosition || [],
                projectDuration: d.projectDuration || "",
                requiredSkills: d.requiredSkills || [],
                supervisor: d.supervisor || "",
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt || new Date(),
                updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : d.updatedAt || new Date(),
              } as Research);
            });
            setResearch(data);
            setLoading(false);
          },
          (err) => {
            console.error("Error in research listener:", err);
            enterOfflineMode();
          },
        );

        return unsubscribe;
      } catch (err) {
        console.error("Firebase connection failed for research:", err);
        enterOfflineMode();
        return null;
      }
    };

    const enterOfflineMode = () => {
      setIsOfflineMode(true);
      setResearch(mockResearch);
      setError(null);
      setLoading(false);
    };

    testFirebaseConnection();
  }, []);

  const createResearch = async (researchData: Omit<Research, "id">) => {
    if (isOfflineMode) {
      const newResearch: Research = { id: `offline_${Date.now()}`, ...researchData };
      setResearch((prev) => [newResearch, ...prev]);
      return;
    }

    try {
      await addDoc(collection(db, "research"), researchData as any);
    } catch (err) {
      console.error("Error creating research:", err);
      setIsOfflineMode(true);
      await createResearch(researchData);
    }
  };

  const updateResearch = async (id: string, researchData: Partial<Research>) => {
    if (isOfflineMode || id.startsWith("offline_") || id.startsWith("mock_")) {
      setResearch((prev) => prev.map((r) => (r.id === id ? { ...r, ...researchData } : r)));
      return;
    }

    try {
      await updateDoc(doc(db, "research", id), researchData as any);
    } catch (err) {
      console.error("Error updating research:", err);
      setResearch((prev) => prev.map((r) => (r.id === id ? { ...r, ...researchData } : r)));
    }
  };

  const deleteResearch = async (id: string) => {
    if (isOfflineMode || id.startsWith("offline_") || id.startsWith("mock_")) {
      setResearch((prev) => prev.filter((r) => r.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, "research", id));
    } catch (err) {
      console.error("Error deleting research:", err);
      setResearch((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return {
    research,
    loading,
    error,
    createResearch,
    updateResearch,
    deleteResearch,
    isOfflineMode,
  };
}
