import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { findLectureDocumentRef } from "@/lib/resolveLectureDocument";

export function useLectureSubcollection(
  lectureId: string | null,
  subcollectionName: string,
  subjectId?: string | null,
) {
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
        const lectureRef = await findLectureDocumentRef(lectureId, subjectId);
        if (!lectureRef) {
          if (mounted) {
            setItems([]);
            setLoading(false);
            setError("Lecture not found");
          }
          return;
        }

        const subColRef = collection(lectureRef, subcollectionName);

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
            setError(null);
          },
          (e) => {
            console.error(`Failed to subscribe to ${subcollectionName}:`, e);
            setError(`Failed to load ${subcollectionName}`);
            setLoading(false);
          },
        );
      } catch (e: unknown) {
        console.error(`Error resolving lecture for ${subcollectionName}:`, e);
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    };

    resolveAndSubscribe();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [lectureId, subcollectionName, subjectId]);

  return { items, loading, error };
}

export function useLectureVideos(
  lectureId: string | null,
  subjectId?: string | null,
) {
  return useLectureSubcollection(lectureId, "videos", subjectId);
}

export function useLectureFiles(
  lectureId: string | null,
  subjectId?: string | null,
) {
  return useLectureSubcollection(lectureId, "files", subjectId);
}

export function useLectureQuizzes(
  lectureId: string | null,
  subjectId?: string | null,
) {
  return useLectureSubcollection(lectureId, "quizzes", subjectId);
}
