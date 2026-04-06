import {
  type DocumentReference,
  increment,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * Adjust denormalized resource counts on a lecture document.
 * Use +1 on create, -1 on delete. Never use this to "recount" from subcollections in the UI.
 */
export async function adjustLectureResourceCounts(
  lectureRef: DocumentReference,
  deltas: { files?: number; videos?: number; quizzes?: number },
): Promise<void> {
  const patch: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  if (deltas.files !== undefined && deltas.files !== 0) {
    patch.filesCount = increment(deltas.files);
  }
  if (deltas.videos !== undefined && deltas.videos !== 0) {
    patch.videosCount = increment(deltas.videos);
  }
  if (deltas.quizzes !== undefined && deltas.quizzes !== 0) {
    patch.quizzesCount = increment(deltas.quizzes);
  }
  if (Object.keys(patch).length <= 1) return;
  await updateDoc(lectureRef, patch);
}
