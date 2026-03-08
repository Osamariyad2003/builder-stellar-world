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
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function toBilingual(o: any): { en: string; ar: string } {
  if (!o || typeof o !== "object") return { en: String(o || ""), ar: String(o || "") };
  return { en: o.en != null ? String(o.en) : "", ar: o.ar != null ? String(o.ar) : "" };
}
function toBilingualArray(o: any): { en: string[]; ar: string[] } {
  if (!o || typeof o !== "object") return { en: [], ar: [] };
  const en = Array.isArray(o.en) ? o.en : [];
  const ar = Array.isArray(o.ar) ? o.ar : [];
  return { en, ar };
}

// Mock data for development
const mockResearch: Research[] = [
  {
    id: "r1",
    projectTitle: {
      en: "Impact of Early Clinical Exposure on Medical Students",
      ar: "تأثير التعرض السريري المبكر على طلاب الطب"
    },
    abstract: {
      en: "A study investigating how early clinical exposure affects students' clinical reasoning and confidence.",
      ar: "دراسة تبحث في كيفية تأثير التعرض السريري المبكر على التفكير السريري للطلاب وثقتهم."
    },
    fieldOfResearch: {
      en: ["Medical Education", "Clinical Skills"],
      ar: ["التعليم الطبي", "المهارات السريرية"]
    },
    contactPerson: ["Dr. Sarah Johnson"],
    authorshipPosition: {
      en: ["Lead", "Co-author"],
      ar: ["قيادة", "مؤلف مشارك"]
    },
    projectDuration: { en: "6 months", ar: "6 أشهر" },
    requiredSkills: {
      en: ["Clinical observation", "Data analysis"],
      ar: ["الملاحظة السريرية", "تحليل البيانات"]
    },
    supervisor: { en: "Prof. Michael Chen", ar: "أ.د. مايكل شين" },
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
    let unsubscribe: (() => void) | null = null;

    const enterOfflineMode = () => {
      setIsOfflineMode(true);
      setResearch(mockResearch);
      setError(null);
      setLoading(false);
    };

    const attachListener = () => {
      const q = query(collection(db, "research"));
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          try {
            const data: Research[] = [];
            querySnapshot.forEach((docSnap) => {
              const d = docSnap.data() as any;
              const rawTitle = d.projectTitle || d.title;
              const rawAbstract = d.abstract;
              const rawField = d.fieldOfResearch;
              const rawAuthorship = d.authorshipPosition;
              const rawDuration = d.projectDuration;
              const rawSkills = d.requiredSkills;
              const rawSupervisor = d.supervisor;
              data.push({
                id: docSnap.id,
                projectTitle: typeof rawTitle === "string" ? { en: rawTitle, ar: rawTitle } : toBilingual(rawTitle),
                abstract: typeof rawAbstract === "string" ? { en: rawAbstract, ar: rawAbstract } : toBilingual(rawAbstract),
                fieldOfResearch: toBilingualArray(rawField),
                contactPerson: Array.isArray(d.contactPerson) ? d.contactPerson : [],
                contactEmail: d.contactEmail || "",
                contactPhone: d.contactPhone || d.phone || "",
                bookUrl: d.bookUrl || d.book_url || "",
                driveUrl: d.driveUrl || d.drive || d.drive_url || "",
                thumbnailUrl: d.thumbnailUrl || d.thumbnail_url || "",
                authorshipPosition: toBilingualArray(rawAuthorship),
                projectDuration: toBilingual(rawDuration),
                requiredSkills: toBilingualArray(rawSkills),
                supervisor: toBilingual(rawSupervisor),
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
                updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
              } as Research);
            });
            data.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
            setResearch(data);
            setError(null);
          } catch (e) {
            console.error("Error processing research snapshot:", e);
            setResearch([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error in research listener:", err);
          enterOfflineMode();
        },
      );
    };

    const run = async () => {
      try {
        await getDocs(query(collection(db, "research")));
        attachListener();
      } catch (err) {
        console.error("Firebase connection failed for research:", err);
        enterOfflineMode();
      }
    };

    run();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const createResearch = async (researchData: Omit<Research, "id">) => {
    if (isOfflineMode) {
      const newResearch: Research = { id: `offline_${Date.now()}`, ...researchData };
      setResearch((prev) => [newResearch, ...prev]);
      return;
    }

    try {
      const payload = { ...researchData } as any;
      if (payload.contactPhone != null) payload.phone = payload.contactPhone;
      if (payload.bookUrl != null) payload.book_url = payload.bookUrl;
      if (payload.driveUrl != null) payload.drive = payload.drive_url = payload.driveUrl;
      if (payload.thumbnailUrl != null) payload.thumbnail_url = payload.thumbnailUrl;
      if (payload.createdAt instanceof Date) payload.createdAt = Timestamp.fromDate(payload.createdAt);
      if (payload.updatedAt instanceof Date) payload.updatedAt = Timestamp.fromDate(payload.updatedAt);
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await addDoc(collection(db, "research"), payload);
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
      const payload = { ...researchData } as any;
      if (payload.contactPhone != null) payload.phone = payload.contactPhone;
      if (payload.bookUrl != null) payload.book_url = payload.bookUrl;
      if (payload.driveUrl != null) payload.drive = payload.drive_url = payload.driveUrl;
      if (payload.thumbnailUrl != null) payload.thumbnail_url = payload.thumbnailUrl;
      if (payload.updatedAt instanceof Date) payload.updatedAt = Timestamp.fromDate(payload.updatedAt);
      if (payload.createdAt instanceof Date) payload.createdAt = Timestamp.fromDate(payload.createdAt);
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await updateDoc(doc(db, "research", id), payload);
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
