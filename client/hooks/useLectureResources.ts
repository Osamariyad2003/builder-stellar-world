import { useEffect, useState } from "react";
import {
  collectionGroup,
  query,
  where,
  documentId,
  getDocs,
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Generic hook to subscribe to a subcollection ('videos' | 'files' | 'quizzes') under a specific lecture
export function useLectureSubcollection(lectureId: string | null, subcollectionName: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    const resolveAndSubscribe = async () => {
      if (!lectureId) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        // Find the lecture document across all Subjects using a collectionGroup query by documentId
        const q = query(collectionGroup(db, "lectures"), where(documentId(), "==", lectureId));
        const lectureSnap = await getDocs(q);
        if (lectureSnap.empty) {
          if (mounted) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        // Use the first matching lecture document
        const lectureDoc = lectureSnap.docs[0];
        const subColRef = collection(lectureDoc.ref, subcollectionName);

        // Subscribe to the subcollection
        unsub = onSnapshot(
          subColRef,
          (snap: QuerySnapshot<DocumentData>) => {
            if (!mounted) return;
            const data: any[] = [];
            snap.forEach((d) => {
              const v = d.data();
              data.push({ id: d.id, ...v });
            });
            setItems(data);
            setLoading(false);
          },
          (e) => {
            console.error(`Failed to subscribe to ${subcollectionName}:`, e);
            setError(`Failed to load ${subcollectionName}`);
            setLoading(false);
          },
        );
      } catch (e: any) {
        console.error(`Error resolving lecture for ${subcollectionName}:`, e);
        if (mounted) {
          setError(e.message || String(e));
          setLoading(false);
        }
      }
    };

    resolveAndSubscribe();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [lectureId, subcollectionName]);

  return { items, loading, error };
}

export function useLectureVideos(lectureId: string | null) {
  return useLectureSubcollection(lectureId, "videos");
}

export function useLectureFiles(lectureId: string | null) {
  return useLectureSubcollection(lectureId, "files");
}

export function useLectureQuizzes(lectureId: string | null) {
  return useLectureSubcollection(lectureId, "quizzes");
}
