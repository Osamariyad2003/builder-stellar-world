import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  collectionGroup,
  Timestamp,
} from "firebase/firestore";

/** Create lecture under Subjects/{subjectId}/lectures with zero resource counters. */
export async function createLectureFromForm(
  lectureData: Record<string, unknown>,
  subjectId: string,
): Promise<void> {
  const subjectRef = doc(db, "Subjects", subjectId);
  const lecturesRef = collection(subjectRef, "lectures");
  const title =
    (lectureData.name as string) ||
    (lectureData.title as string) ||
    "Untitled";

  await addDoc(lecturesRef, {
    title,
    description: (lectureData.description as string) || "",
    order: typeof lectureData.order === "number" ? lectureData.order : 1,
    imageUrl: (lectureData.imageUrl as string) || "",
    subjectId,
    uploadedBy: (lectureData.uploadedBy as string) || "Current User",
    createdAt: lectureData.createdAt
      ? Timestamp.fromDate(lectureData.createdAt as Date)
      : Timestamp.now(),
    updatedAt: Timestamp.now(),
    filesCount: 0,
    videosCount: 0,
    quizzesCount: 0,
  });
}

export async function updateLectureFromForm(
  lectureId: string,
  lectureData: Record<string, unknown>,
): Promise<void> {
  const snap = await getDocs(query(collectionGroup(db, "lectures")));
  for (const d of snap.docs) {
    if (d.id !== lectureId) continue;
    const patch: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };
    if (lectureData.name != null) patch.title = lectureData.name;
    if (lectureData.title != null) patch.title = lectureData.title;
    if (lectureData.description != null)
      patch.description = lectureData.description;
    if (lectureData.order != null) patch.order = lectureData.order;
    if (lectureData.imageUrl != null) patch.imageUrl = lectureData.imageUrl;
    await updateDoc(d.ref, patch);
    return;
  }
  throw new Error(`Lecture ${lectureId} not found`);
}

export async function deleteLectureById(lectureId: string): Promise<void> {
  const snap = await getDocs(query(collectionGroup(db, "lectures")));
  for (const d of snap.docs) {
    if (d.id === lectureId) {
      await deleteDoc(d.ref);
      return;
    }
  }
  throw new Error(`Lecture ${lectureId} not found`);
}
