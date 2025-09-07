import { useState, useEffect } from "react";
import { Lecture, Video, FileResource, Quiz } from "@shared/types";
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
  collectionGroup,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useLectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get all lectures from all subjects (avoid collection-group index requirement by sorting client-side)
    const q = query(collectionGroup(db, "lectures"));

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const lecturesData: Lecture[] = [];

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const lectureId = docSnapshot.id;
          const lectureRef = docSnapshot.ref;

          // Get files subcollection
          const filesSnapshot = await getDocs(collection(lectureRef, "files"));
          const files: FileResource[] = [];
          filesSnapshot.forEach((fileDoc) => {
            const fileData = fileDoc.data();
            files.push({
              id: fileDoc.id,
              title: fileData.title || "",
              fileUrl: fileData.fileUrl || "",
              fileType: fileData.fileType || "",
              fileSize: fileData.fileSize || "",
              description: fileData.description || "",
              uploadedAt: fileData.uploadedAt?.toDate() || new Date(),
              uploadedBy: fileData.uploadedBy || "",
            });
          });

          // Get quizzes subcollection
          const quizzesSnapshot = await getDocs(
            collection(lectureRef, "quizzes"),
          );
          const quizzes: Quiz[] = [];
          quizzesSnapshot.forEach((quizDoc) => {
            const quizData = quizDoc.data();
            quizzes.push({
              id: quizDoc.id,
              title: quizData.title || "",
              description: quizData.description || "",
              questions: quizData.questions || [],
              timeLimit: quizData.duration || 30,
              passingScore: quizData.passRate || 70,
              createdAt: quizData.createdAt?.toDate() || new Date(),
              createdBy: quizData.uploadedBy || "",
            });
          });

          // Try to fetch videos from a videos subcollection first (supports both subcollection and inline storage)
          const videosSnapshot = await getDocs(collection(lectureRef, "videos"));
          const videos: Video[] = [];
          if (!videosSnapshot.empty) {
            videosSnapshot.forEach((videoDoc) => {
              const vd = videoDoc.data() as any;
              videos.push({
                id: videoDoc.id,
                title: vd.title || vd.name || "",
                youtubeUrl: vd.url || vd.youtubeUrl || "",
                thumbnailUrl: vd.thumbnailUrl || vd.thumbnail || "",
                duration: vd.duration || vd.time || "",
                description: vd.description || "",
                uploadedAt: vd.uploadedAt?.toDate?.() || new Date(),
                uploadedBy: vd.uploadedBy || vd.uploader || "",
                imageUrl: vd.thumbnailUrl || "",
              });
            });
          } else {
            // Fallback to videos stored inline in the lecture document
            const inlineVideos: any[] = data.videos || [];
            inlineVideos.forEach((iv) => {
              videos.push({
                id: iv.id || iv.videoId || "",
                title: iv.title || iv.name || "",
                youtubeUrl: iv.url || iv.youtubeUrl || "",
                thumbnailUrl: iv.thumbnailUrl || iv.thumbnail || "",
                duration: iv.duration || iv.time || "",
                description: iv.description || "",
                uploadedAt: iv.uploadedAt?.toDate?.() || new Date(),
                uploadedBy: iv.uploadedBy || iv.uploader || "",
                imageUrl: iv.thumbnailUrl || "",
              });
            });
          }

          lecturesData.push({
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

        // Sort client-side by order to avoid requiring a collection-group index in Firestore
        lecturesData.sort((a, b) => (a.order || 0) - (b.order || 0));

        setLectures(lecturesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching lectures:", error);
        setError("Failed to fetch lectures");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const createLecture = async (
    lectureData: Omit<Lecture, "id">,
    subjectId: string,
  ) => {
    try {
      // Add lecture to the specified subject
      const subjectRef = doc(db, "Subjects", subjectId);
      const lecturesRef = collection(subjectRef, "lectures");

      const { videos, files, quizzes, ...lectureInfo } = lectureData;

      const docRef = await addDoc(lecturesRef, {
        ...lectureInfo,
        videos: videos, // Store videos in the main document for now
        subjectId: subjectId,
      });

      // Add files to subcollection
      if (files && files.length > 0) {
        const filesRef = collection(docRef, "files");
        for (const file of files) {
          await addDoc(filesRef, file);
        }
      }

      // Add quizzes to subcollection
      if (quizzes && quizzes.length > 0) {
        const quizzesRef = collection(docRef, "quizzes");
        for (const quiz of quizzes) {
          await addDoc(quizzesRef, quiz);
        }
      }
    } catch (error) {
      console.error("Error creating lecture:", error);
      throw error;
    }
  };

  const updateLecture = async (
    lectureId: string,
    lectureData: Partial<Lecture>,
  ) => {
    try {
      // Find the lecture document path
      // This is simplified - in a real app, you'd need to track the subject path
      const q = query(collectionGroup(db, "lectures"));
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        if (docSnapshot.id === lectureId) {
          await updateDoc(docSnapshot.ref, lectureData);
          break;
        }
      }
    } catch (error) {
      console.error("Error updating lecture:", error);
      throw error;
    }
  };

  const deleteLecture = async (lectureId: string) => {
    try {
      // Find and delete the lecture document
      const q = query(collectionGroup(db, "lectures"));
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        if (docSnapshot.id === lectureId) {
          await deleteDoc(docSnapshot.ref);
          break;
        }
      }
    } catch (error) {
      console.error("Error deleting lecture:", error);
      throw error;
    }
  };

  return {
    lectures,
    loading,
    error,
    createLecture,
    updateLecture,
    deleteLecture,
  };
}
