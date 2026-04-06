// Paginated lectures — lecture documents only (no files/videos/quizzes subcollection reads)
import { usePaginatedData } from "./usePaginatedData";
import { Lecture } from "@shared/types";
import {
  collectionGroup,
  query,
  getDocs,
  orderBy,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const LECTURES_PER_PAGE = 10;

function mapLectureDoc(docSnapshot: QueryDocumentSnapshot): Lecture {
  const data = docSnapshot.data() as Record<string, unknown>;
  const lectureId = docSnapshot.id;
  const lectureRef = docSnapshot.ref;
  const subjectId =
    (lectureRef.parent?.parent as { id?: string } | null)?.id ??
    (data.subjectId as string) ??
    (data.subject_id as string) ??
    "Unknown";

  const filesCount =
    (data.filesCount as number | undefined) ??
    (data.files_count as number | undefined) ??
    0;
  const quizzesCount =
    (data.quizzesCount as number | undefined) ??
    (data.quizzes_count as number | undefined) ??
    0;
  const videosCount =
    (data.videosCount as number | undefined) ??
    (data.videos_count as number | undefined) ??
    0;

  const createdRaw = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedRaw = data.updatedAt as { toDate?: () => Date } | undefined;

  return {
    id: lectureId,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    subject: subjectId,
    subjectId,
    order: typeof data.order === "number" ? data.order : 1,
    createdAt: createdRaw?.toDate?.() ?? new Date(),
    createdBy: (data.uploadedBy as string) || (data.createdBy as string) || "",
    filesCount,
    quizzesCount,
    videosCount,
    imageUrl: (data.imageUrl as string) || (data.image_url as string) || undefined,
    updatedAt: updatedRaw?.toDate?.(),
    videos: [],
    files: [],
    quizzes: [],
  };
}

async function fetchLecturesPage(
  pageIndex: number,
  pageSize: number,
): Promise<{ data: Lecture[]; total: number; hasMore: boolean }> {
  const q = query(collectionGroup(db, "lectures"), orderBy("order", "asc"));
  const querySnapshot = await getDocs(q);

  const allLectures: Lecture[] = querySnapshot.docs.map(mapLectureDoc);

  allLectures.sort((a, b) => (a.order || 0) - (b.order || 0));

  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = allLectures.slice(startIndex, endIndex);
  const hasMore = endIndex < allLectures.length;

  return {
    data: pageData,
    total: allLectures.length,
    hasMore,
  };
}

export function useLecturesPaginated(pageSize: number = LECTURES_PER_PAGE) {
  return usePaginatedData<Lecture>({
    queryKey: ["lectures-paginated"],
    queryFn: fetchLecturesPage,
    pageSize,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
