// Paginated lectures hook with OS-like caching
import { usePaginatedData } from "./usePaginatedData";
import { Lecture } from "@shared/types";
import {
  collectionGroup,
  query,
  getDocs,
  limit,
  startAfter,
  orderBy,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const LECTURES_PER_PAGE = 10;

async function fetchLecturesPage(
  pageIndex: number,
  pageSize: number,
  lastDoc?: any
): Promise<{ data: Lecture[]; total: number; hasMore: boolean }> {
  try {
    // For now, we'll fetch all and paginate client-side
    // In production, you'd use Firestore pagination with startAfter
    const q = query(collectionGroup(db, "lectures"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    const allLectures: Lecture[] = [];
    
    // Process all lectures (we'll paginate client-side for now)
    for (const docSnapshot of querySnapshot.docs.slice(0, 100)) { // Limit to 100 for performance
      const data = docSnapshot.data();
      const lectureId = docSnapshot.id;
      const lectureRef = docSnapshot.ref;

      // Fetch subcollections in parallel
      const [filesSnapshot, quizzesSnapshot, videosSnapshot] = await Promise.all([
        getDocs(collection(lectureRef, "files")),
        getDocs(collection(lectureRef, "quizzes")),
        getDocs(collection(lectureRef, "videos")),
      ]);

      const files = filesSnapshot.docs.map((fileDoc) => {
        const fileData = fileDoc.data();
        return {
          id: fileDoc.id,
          title: fileData.title || "",
          fileUrl: fileData.url || fileData.fileUrl || "",
          description: fileData.description || "",
          uploadedAt: fileData.uploadedAt?.toDate() || new Date(),
          uploadedBy: fileData.uploadedBy || "",
          imageUrl: fileData.imageUrl || fileData.thumbnailUrl || "",
          thumbnailUrl: fileData.thumbnailUrl || fileData.imageUrl || "",
        };
      });

      const quizzes = quizzesSnapshot.docs.map((quizDoc) => {
        const quizData = quizDoc.data();
        return {
          id: quizDoc.id,
          title: quizData.title || "",
          description: quizData.description || "",
          questions: quizData.questions || [],
          timeLimit: quizData.duration || 30,
          passingScore: quizData.passRate || 70,
          createdAt: quizData.createdAt?.toDate() || new Date(),
          createdBy: quizData.uploadedBy || "",
        };
      });

      const videos = videosSnapshot.docs.map((videoDoc) => {
        const vd = videoDoc.data() as any;
        return {
          id: videoDoc.id,
          title: vd.title || vd.name || "",
          youtubeUrl: vd.url || vd.youtubeUrl || "",
          thumbnailUrl: vd.thumbnailUrl || vd.thumbnail || "",
          duration: vd.duration || vd.time || "",
          description: vd.description || "",
          uploadedAt: vd.uploadedAt?.toDate?.() || new Date(),
          uploadedBy: vd.uploadedBy || vd.uploader || "",
          imageUrl: vd.thumbnailUrl || "",
        };
      });

      allLectures.push({
        id: lectureId,
        title: data.title || "",
        description: data.description || "",
        subject: data.subjectId || "Unknown",
        order: data.order || 1,
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.uploadedBy || "",
        videos: videos,
        files: files,
        quizzes: quizzes,
      });
    }

    // Sort and paginate client-side
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
  } catch (error) {
    console.error("Error fetching lectures page:", error);
    throw error;
  }
}

export function useLecturesPaginated(pageSize: number = LECTURES_PER_PAGE) {
  return usePaginatedData<Lecture>({
    queryKey: ["lectures-paginated"],
    queryFn: fetchLecturesPage,
    pageSize,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep previous pages in cache
  });
}

