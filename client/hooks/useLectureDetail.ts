import { useQuery } from "@tanstack/react-query";
import { getDoc } from "firebase/firestore";
import type { DocumentSnapshot } from "firebase/firestore";
import { findLectureDocumentRef } from "@/lib/resolveLectureDocument";

export type LectureDetail = {
  id: string;
  refPath: string;
  subjectId: string;
  title: string;
  description: string;
  order: number;
  imageUrl?: string;
  filesCount: number;
  videosCount: number;
  quizzesCount: number;
  createdAt: Date;
  updatedAt?: Date;
};

function mapDoc(docSnap: DocumentSnapshot): LectureDetail {
  const data = docSnap.data() as Record<string, unknown>;
  const lectureRef = docSnap.ref;
  const subjectId =
    (lectureRef.parent?.parent as { id?: string } | null)?.id ??
    (data.subjectId as string) ??
    "";

  const createdRaw = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedRaw = data.updatedAt as { toDate?: () => Date } | undefined;

  return {
    id: docSnap.id,
    refPath: docSnap.ref.path,
    subjectId,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    order: typeof data.order === "number" ? data.order : 1,
    imageUrl: (data.imageUrl as string) || (data.image_url as string) || undefined,
    filesCount:
      (data.filesCount as number) ?? (data.files_count as number) ?? 0,
    videosCount:
      (data.videosCount as number) ?? (data.videos_count as number) ?? 0,
    quizzesCount:
      (data.quizzesCount as number) ?? (data.quizzes_count as number) ?? 0,
    createdAt: createdRaw?.toDate?.() ?? new Date(),
    updatedAt: updatedRaw?.toDate?.(),
  };
}

async function fetchLectureById(
  lectureId: string,
  subjectIdFromUrl?: string | null,
): Promise<LectureDetail | null> {
  const ref = await findLectureDocumentRef(lectureId, subjectIdFromUrl);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapDoc(snap);
}

export function useLectureDetail(
  lectureId: string | undefined,
  subjectIdFromUrl?: string | null,
) {
  return useQuery({
    // v4: bump to drop cached errors from old documentId() queries
    queryKey: ["lecture-detail", "v4", lectureId, subjectIdFromUrl ?? ""],
    queryFn: () => fetchLectureById(lectureId!, subjectIdFromUrl),
    enabled: !!lectureId,
    staleTime: 60 * 1000,
  });
}
