import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  collectionGroup,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface YearData {
  id?: string;
  yearNumber: number;
  type: "basic" | "clinical";
  subjects: SubjectData[];
}

export interface SubjectData {
  id?: string;
  name: string;
  subjectId?: string;
  yearId: string;
  imageUrl?: string;
  lectures: LectureData[];
}

export interface LectureData {
  id?: string;
  name: string;
  description?: string;
  subjectId: string;
  order: number;
  imageUrl?: string;
  createdAt: Date;
  uploadedBy: string;
}

export function useYears() {
  const [years, setYears] = useState<YearData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false); // Start in online mode
  const [retryCount, setRetryCount] = useState(1); // Start with 1 to trigger Firebase attempt
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting"); // Start connecting

  // Immediate offline mode for persistent Firebase issues
  const activateOfflineMode = () => {
    console.log("🔄 Activating offline mode immediately");
    setIsOfflineMode(true);
    setConnectionStatus("offline");
    setLoading(false);
    setError(null); // Clear error in offline mode

    const offlineYears: YearData[] = [
      { id: "offline_year1", yearNumber: 1, type: "basic", subjects: [] },
      { id: "offline_year2", yearNumber: 2, type: "basic", subjects: [] },
      { id: "offline_year3", yearNumber: 3, type: "basic", subjects: [] },
      { id: "offline_year4", yearNumber: 4, type: "clinical", subjects: [] },
      { id: "offline_year5", yearNumber: 5, type: "clinical", subjects: [] },
      { id: "offline_year6", yearNumber: 6, type: "clinical", subjects: [] },
    ];

    setYears(offlineYears);
    setSubjects([]);
  };

  // Initialize with Firebase attempt, fallback to offline if needed
  useEffect(() => {
    // Don't activate offline mode immediately, let fetchData try Firebase first
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check internet connection first
      if (!navigator.onLine) {
        console.log("🚫 No internet connection detected - activating offline mode");
        activateOfflineMode();
        return;
      }

      setConnectionStatus("connecting");
      setLoading(true);

      try {
        console.log("🔄 Attempting Firebase connection...");

        // Quick timeout for Firebase requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log("⚡ Firebase timeout - staying in offline mode");
          activateOfflineMode();
        }, 2000); // 2 second timeout

        // Try to fetch years
        const yearsSnapshot = await getDocs(collection(db, "years"));
        clearTimeout(timeoutId);
        let yearsData: YearData[] = [];

        if (!yearsSnapshot.empty) {
          yearsSnapshot.forEach((doc) => {
            const data = doc.data();
            let yearNumber = data.order || 1;
            if (data.name) {
              const match = data.name.match(/\d+/);
              if (match) {
                yearNumber = parseInt(match[0]);
              }
            }

            yearsData.push({
              id: doc.id,
              yearNumber: yearNumber,
              type: yearNumber <= 3 ? "basic" : "clinical",
              subjects: [],
            });
          });
        }

        // Fetch subjects from Subjects collection
        const subjectsSnapshot = await getDocs(collection(db, "Subjects"));
        const allSubjects: SubjectData[] = [];

        for (const subjectDoc of subjectsSnapshot.docs) {
          const subjectData = subjectDoc.data();
          const lecturesSnapshot = await getDocs(
            collection(subjectDoc.ref, "lectures"),
          );
          const lectures: LectureData[] = [];

          lecturesSnapshot.forEach((lectureDoc) => {
            const lectureData = lectureDoc.data();
            lectures.push({
              id: lectureDoc.id,
              name: lectureData.name || lectureData.title || "",
              description: lectureData.description || "",
              subjectId: subjectDoc.id,
              order: lectureData.order || 1,
              imageUrl: lectureData.imageUrl || "",
              createdAt: lectureData.createdAt?.toDate() || new Date(),
              uploadedBy: lectureData.uploadedBy || "Unknown",
            });
          });

          allSubjects.push({
            id: subjectDoc.id,
            name: subjectData.name || "",
            subjectId: subjectData.subjectId || subjectDoc.id,
            yearId: subjectData.yearId || "",
            imageUrl: subjectData.imageUrl || "",
            lectures: lectures.sort((a, b) => a.order - b.order),
          });
        }

        // Link subjects to years
        const completeYears = yearsData.map((year) => ({
          ...year,
          subjects: allSubjects
            .filter((subject) => subject.yearId === year.id)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));

        setYears(completeYears.sort((a, b) => a.yearNumber - b.yearNumber));
        setSubjects(completeYears.flatMap((year) => year.subjects));
        setLoading(false);
        setIsOfflineMode(false);
        setConnectionStatus("connected");
        setError(null);
        console.log("✅ Firebase data loaded successfully");
      } catch (error: any) {
        console.log("❌ Firebase connection failed - staying in offline mode");
        activateOfflineMode();
      }
    };

    fetchData();
  }, [retryCount]);

  const retryConnection = () => {
    console.log("🔄 Retrying Firebase connection...");
    setLoading(true);
    setError(null);
    setIsOfflineMode(false);
    setConnectionStatus("connecting");
    setRetryCount((prev) => prev + 1);
  };

  const retryOperation = async (
    operation: () => Promise<any>,
    maxRetries = 3,
  ) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        console.log(`Attempt ${i + 1} failed:`, error.message);
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  };

  const createSubject = async (
    subjectData: Omit<SubjectData, "id" | "lectures">,
  ) => {
    if (isOfflineMode || !navigator.onLine) {
      const newSubject: SubjectData = {
        id: `subject_${Date.now()}`,
        name: subjectData.name,
        subjectId: `subject_${Date.now()}`,
        yearId: subjectData.yearId,
        imageUrl: "",
        lectures: [],
      };

      setSubjects((prev) => [...prev, newSubject]);
      setYears((prev) =>
        prev.map((year) =>
          year.id === subjectData.yearId
            ? { ...year, subjects: [...year.subjects, newSubject] }
            : year,
        ),
      );

      console.log("✅ Added subject to offline mode:", newSubject.name);
      return;
    }

    try {
      console.log("🔄 Creating subject with data:", subjectData);

      await retryOperation(async () => {
        // Create a new subject document with proper structure
        const newSubject = {
          name: subjectData.name,
          yearId: subjectData.yearId,
          imageUrl: subjectData.imageUrl || "",
          hours: 3, // Default hours as seen in your Firebase
          createdAt: new Date(),
        };

        console.log("📝 Creating new subject document:", newSubject);

        // Create new document in Subjects collection (Firebase will auto-generate ID)
        const docRef = await addDoc(collection(db, "Subjects"), newSubject);

        // Update the document to include its own ID as subjectId
        await updateDoc(docRef, {
          subjectId: docRef.id,
        });

        console.log("✅ Created new subject document with ID:", docRef.id);

        // Create the lectures subcollection structure
        const lecturesRef = collection(docRef, "lectures");

        // Create an initial lecture document to establish the subcollection
        const initialLecture = {
          title: "Sample Lecture",
          description: "",
          imageUrl: "",
          order: 1,
          uploadedBy: "System",
          createdAt: new Date(),
          lectureId: "", // Will be updated with document ID
        };

        const lectureDocRef = await addDoc(lecturesRef, initialLecture);

        // Update lecture with its own ID
        await updateDoc(lectureDocRef, {
          lectureId: lectureDocRef.id,
        });

        console.log(
          "✅ Created lectures subcollection with ID:",
          lectureDocRef.id,
        );

        // Create videos subcollection under the lecture
        const videosRef = collection(lectureDocRef, "videos");
        const initialVideo = {
          title: "Sample Video",
          description: "",
          thumbnailUrl: "",
          url: "",
          uploadedAt: new Date(),
          videoId: "",
        };
        const videoDocRef = await addDoc(videosRef, initialVideo);
        await updateDoc(videoDocRef, { videoId: videoDocRef.id });

        // Create files subcollection under the lecture
        const filesRef = collection(lectureDocRef, "files");
        const initialFile = {
          title: "Sample File",
          description: "",
          url: "",
          uploadedAt: new Date(),
          fileId: "",
        };
        const fileDocRef = await addDoc(filesRef, initialFile);
        await updateDoc(fileDocRef, { fileId: fileDocRef.id });

        // Create quizzes subcollection under the lecture
        const quizzesRef = collection(lectureDocRef, "quizzes");
        const initialQuiz = {
          title: "Sample Quiz",
          description: "",
          duration: 30,
          passRate: 70,
          questions: [],
          quizId: "",
        };
        const quizDocRef = await addDoc(quizzesRef, initialQuiz);
        await updateDoc(quizDocRef, { quizId: quizDocRef.id });

        console.log("✅ Created complete nested structure:");
        console.log(
          "📁 Videos: /Subjects/" +
            docRef.id +
            "/lectures/" +
            lectureDocRef.id +
            "/videos/" +
            videoDocRef.id,
        );
        console.log(
          "📁 Files: /Subjects/" +
            docRef.id +
            "/lectures/" +
            lectureDocRef.id +
            "/files/" +
            fileDocRef.id,
        );
        console.log(
          "📁 Quizzes: /Subjects/" +
            docRef.id +
            "/lectures/" +
            lectureDocRef.id +
            "/quizzes/" +
            quizDocRef.id,
        );

        // Refresh data
        window.location.reload();
      });
    } catch (error) {
      console.error("Error creating subject:", error);
      // Fall back to offline mode
      setIsOfflineMode(true);
      await createSubject(subjectData);
    }
  };

  const createLecture = async (lectureData: Omit<LectureData, "id">) => {
    if (isOfflineMode) {
      const newLecture: LectureData = {
        id: `lecture_${Date.now()}`,
        ...lectureData,
      };

      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === lectureData.subjectId
            ? { ...subject, lectures: [...subject.lectures, newLecture] }
            : subject,
        ),
      );

      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.map((subject) =>
            subject.id === lectureData.subjectId
              ? { ...subject, lectures: [...subject.lectures, newLecture] }
              : subject,
          ),
        })),
      );

      console.log("✅ Added lecture to offline mode:", newLecture.name);
      return;
    }

    try {
      await retryOperation(async () => {
        // Create lecture document in the lectures subcollection under the subject
        const subjectRef = doc(db, "Subjects", lectureData.subjectId);
        const lecturesRef = collection(subjectRef, "lectures");

        // Create lecture with the exact structure you specified
        const newLecture = {
          title: lectureData.name, // Using 'title' as per your Firebase structure
          description: lectureData.description || "",
          imageUrl: lectureData.imageUrl || "",
          order: lectureData.order || 1,
          uploadedBy: lectureData.uploadedBy || "Current User",
          createdAt: new Date(),
          lectureId: "", // Will be updated with document ID after creation
        };

        console.log("📝 Creating lecture in subcollection:", newLecture);

        // Add the lecture document to the lectures subcollection
        const lectureDocRef = await addDoc(lecturesRef, newLecture);

        // Update the document to include its own ID as lectureId
        await updateDoc(lectureDocRef, {
          lectureId: lectureDocRef.id,
        });

        console.log("✅ Created lecture document with ID:", lectureDocRef.id);
        console.log(
          "📁 Path: /Subjects/" +
            lectureData.subjectId +
            "/lectures/" +
            lectureDocRef.id,
        );

        // Refresh data
        window.location.reload();
      });
    } catch (error) {
      console.error("Error creating lecture:", error);
      // Fall back to offline mode
      setIsOfflineMode(true);
      await createLecture(lectureData);
    }
  };

  const deleteLecture = async (subjectId: string, lectureId: string) => {
    if (isOfflineMode) {
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                lectures: subject.lectures.filter((l) => l.id !== lectureId),
              }
            : subject,
        ),
      );

      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.map((subject) =>
            subject.id === subjectId
              ? {
                  ...subject,
                  lectures: subject.lectures.filter((l) => l.id !== lectureId),
                }
              : subject,
          ),
        })),
      );

      console.log("✅ Deleted lecture from offline mode");
      return;
    }

    try {
      const subjectRef = doc(db, "Subjects", subjectId);
      const lectureRef = doc(subjectRef, "lectures", lectureId);

      await deleteDoc(lectureRef);
      console.log("✅ Deleted lecture from Firebase");

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error deleting lecture:", error);
    }
  };

  return {
    years,
    subjects,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
    createSubject,
    createLecture,
    deleteLecture,
  };
}
