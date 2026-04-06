import { db } from "@/lib/firebase";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentReference,
} from "firebase/firestore";

/**
 * Find a lecture document ref by id without using collectionGroup + documentId() equality
 * (Firestore rejects bare IDs there — path must have an even number of segments).
 *
 * Order: direct path if subject known → lectureId field query → full scan by doc id.
 */
export async function findLectureDocumentRef(
  lectureId: string,
  subjectIdFromUrl?: string | null,
): Promise<DocumentReference | null> {
  if (subjectIdFromUrl) {
    const ref = doc(db, "Subjects", subjectIdFromUrl, "lectures", lectureId);
    const snap = await getDoc(ref);
    if (snap.exists()) return ref;
  }

  try {
    const byLectureIdField = query(
      collectionGroup(db, "lectures"),
      where("lectureId", "==", lectureId),
    );
    const snap = await getDocs(byLectureIdField);
    if (!snap.empty) return snap.docs[0].ref;
  } catch {
    // Missing index or field on older docs — continue
  }

  const all = await getDocs(query(collectionGroup(db, "lectures")));
  const found = all.docs.find((d) => d.id === lectureId);
  return found?.ref ?? null;
}
