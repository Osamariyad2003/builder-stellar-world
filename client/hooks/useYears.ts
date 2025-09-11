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
  videos?: VideoData[];
  files?: FileData[];
  quizzes?: QuizData[];
}

export interface VideoData {
  id?: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedAt: Date;
}

export interface FileData {
  id?: string;
  title: string;
  url: string;
  description?: string;
  uploadedAt: Date;
}

export interface QuizData {
  id?: string;
  title: string;
  description?: string;
  duration: number;
  passRate: number;
  questions: any[];
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
        console.log(
          "🚫 No internet connection detected - activating offline mode",
        );
        activateOfflineMode();
        return;
      }

      setConnectionStatus("connecting");
      setLoading(true);

      try {
        console.log("🔄 Attempting Firebase connection...");

        // Try to fetch years without aggressive aborts
        const yearsSnapshot = await getDocs(collection(db, "years"));
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

          for (const lectureDoc of lecturesSnapshot.docs) {
            const lectureData = lectureDoc.data();

            // Fetch videos for this lecture
            const videosSnapshot = await getDocs(
              collection(lectureDoc.ref, "videos"),
            );
            const videos: VideoData[] = [];
            videosSnapshot.forEach((videoDoc) => {
              const videoData = videoDoc.data();
              videos.push({
                id: videoDoc.id,
                title: videoData.title || videoData.name || "",
                url: videoData.url || "",
                thumbnailUrl: videoData.thumbnailUrl || "",
                description: videoData.description || "",
                uploadedAt: videoData.uploadedAt?.toDate() || new Date(),
              });
            });

            // Fetch files for this lecture
            const filesSnapshot = await getDocs(
              collection(lectureDoc.ref, "files"),
            );
            const files: FileData[] = [];
            filesSnapshot.forEach((fileDoc) => {
              const fileData = fileDoc.data();
              files.push({
                id: fileDoc.id,
                title: fileData.title || fileData.name || "",
                url: fileData.url || "",
                description: fileData.description || "",
                uploadedAt: fileData.uploadedAt?.toDate() || new Date(),
              });
            });

            // Fetch quizzes for this lecture
            const quizzesSnapshot = await getDocs(
              collection(lectureDoc.ref, "quizzes"),
            );
            const quizzes: QuizData[] = [];
            quizzesSnapshot.forEach((quizDoc) => {
              const quizData = quizDoc.data();
              quizzes.push({
                id: quizDoc.id,
                title: quizData.title || quizData.name || "",
                description: quizData.description || "",
                duration: quizData.duration || 30,
                passRate: quizData.passRate || 70,
                questions: quizData.questions || [],
              });
            });

            lectures.push({
              id: lectureDoc.id,
              name: lectureData.name || lectureData.title || "",
              description: lectureData.description || "",
              subjectId: subjectDoc.id,
              order: lectureData.order || 1,
              imageUrl: lectureData.imageUrl || "",
              createdAt: lectureData.createdAt?.toDate() || new Date(),
              uploadedBy: lectureData.uploadedBy || "Unknown",
              videos: videos,
              files: files,
              quizzes: quizzes,
            });
          }

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
        imageUrl: subjectData.imageUrl || "",
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
        // Use the existing Subjects document structure from your Firebase
        // Based on your screenshots, we should add to existing documents, not create new ones
        const existingSubjectId = "7RpQaRoWKFLKiPA7A9Aq"; // Use your existing subject document ID

        const subjectRef = doc(db, "Subjects", existingSubjectId);

        // Update the existing subject document with new data
        await updateDoc(subjectRef, {
          name: subjectData.name,
          imageUrl: subjectData.imageUrl || "",
          hours: subjectData.hours || 3,
          yearId: subjectData.yearId,
          subjectId: existingSubjectId,
          updatedAt: new Date(),
        });

        console.log("✅ Updated existing subject document:", existingSubjectId);

        // Check if lectures subcollection exists, if not create the structure
        const lecturesRef = collection(subjectRef, "lectures");
        const lecturesSnapshot = await getDocs(lecturesRef);

        if (lecturesSnapshot.empty) {
          // Create an initial lecture to establish the subcollection
          const initialLecture = {
            name: "Sample Lecture",
            title: "Sample Lecture",
            description: "",
            imageUrl: "",
            order: 1,
            uploadedBy: "System",
            createdAt: new Date(),
            lectureId: "", // Will be updated with document ID
          };

          const lectureDocRef = await addDoc(lecturesRef, initialLecture);
          await updateDoc(lectureDocRef, {
            lectureId: lectureDocRef.id,
          });

          // Create the required subcollections under the lecture
          const subCollections = ["videos", "files", "quizzes"];

          for (const collectionName of subCollections) {
            const subCollectionRef = collection(lectureDocRef, collectionName);
            let initialDoc: any = {};

            if (collectionName === "videos") {
              initialDoc = {
                title: "Sample Video",
                description: "",
                thumbnailUrl: "",
                url: "",
                uploadedAt: new Date(),
                videoId: "",
              };
            } else if (collectionName === "files") {
              initialDoc = {
                title: "Sample File",
                description: "",
                url: "",
                uploadedAt: new Date(),
                fileId: "",
              };
            } else if (collectionName === "quizzes") {
              initialDoc = {
                title: "Sample Quiz",
                description: "",
                duration: 30,
                passRate: 70,
                questions: [],
                quizId: "",
              };
            }

            const docRef = await addDoc(subCollectionRef, initialDoc);
            const idField = `${collectionName.slice(0, -1)}Id`; // Remove 's' and add 'Id'
            await updateDoc(docRef, { [idField]: docRef.id });
          }

          console.log(
            "✅ Created complete lecture structure for subject:",
            existingSubjectId,
          );
        }

        // Refresh data to show the updates
        setRetryCount((prev) => prev + 1);
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
        setRetryCount((prev) => prev + 1);
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
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting lecture:", error);
    }
  };

  const deleteSubject = async (subjectId: string) => {
    if (!subjectId) return;

    if (isOfflineMode) {
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.filter((s) => s.id !== subjectId),
        })),
      );
      console.log("✅ Deleted subject in offline mode");
      return;
    }

    try {
      const subjectRef = doc(db, "Subjects", subjectId);
      await deleteDoc(subjectRef);
      console.log("✅ Deleted subject from Firebase");
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const addVideo = async (
    subjectId: string,
    lectureId: string,
    video: {
      title: string;
      description?: string;
      url: string;
      duration?: string;
      thumbnailUrl?: string;
      platform?: string;
    },
  ) => {
    if (!subjectId || !lectureId) return;

    if (isOfflineMode) {
      // Update local state optimistically
      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  lectures: s.lectures.map((l) =>
                    l.id === lectureId
                      ? {
                          ...l,
                          videos: [
                            ...(l.videos || []),
                            {
                              id: `video_${Date.now()}`,
                              title: video.title,
                              url: video.url,
                              thumbnailUrl: video.thumbnailUrl || "",
                              description: video.description || "",
                              uploadedAt: new Date(),
                            },
                          ],
                        }
                      : l,
                  ),
                }
              : s,
          ),
        })),
      );
      return;
    }

    try {
      const lectureRef = doc(db, "Subjects", subjectId, "lectures", lectureId);
      await addDoc(collection(lectureRef, "videos"), {
        title: video.title,
        description: video.description || "",
        url: video.url,
        duration: video.duration || "",
        thumbnailUrl: video.thumbnailUrl || "",
        platform: video.platform || "",
        uploadedAt: new Date(),
        uploadedBy: "Current User",
      });
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding video:", error);
    }
  };

  const addFile = async (
    subjectId: string,
    lectureId: string,
    file: {
      title: string;
      description?: string;
      fileUrl: string;
      fileType?: string;
      fileSize?: string;
    },
  ) => {
    if (!subjectId || !lectureId) return;

    if (isOfflineMode) {
      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  lectures: s.lectures.map((l) =>
                    l.id === lectureId
                      ? {
                          ...l,
                          files: [
                            ...(l.files || []),
                            {
                              id: `file_${Date.now()}`,
                              title: file.title,
                              url: file.fileUrl,
                              description: file.description || "",
                              uploadedAt: new Date(),
                            },
                          ],
                        }
                      : l,
                  ),
                }
              : s,
          ),
        })),
      );
      return;
    }

    try {
      const lectureRef = doc(db, "Subjects", subjectId, "lectures", lectureId);
      await addDoc(collection(lectureRef, "files"), {
        title: file.title,
        description: file.description || "",
        url: file.fileUrl,
        fileType: file.fileType || "",
        fileSize: file.fileSize || "",
        uploadedAt: new Date(),
        uploadedBy: "Current User",
      });
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding file:", error);
    }
  };

  const addQuiz = async (
    subjectId: string,
    lectureId: string,
    quiz: {
      title: string;
      description?: string;
      questions: any[];
      timeLimit?: number;
      passingScore?: number;
    },
  ) => {
    if (!subjectId || !lectureId) return;

    if (isOfflineMode) {
      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  lectures: s.lectures.map((l) =>
                    l.id === lectureId
                      ? {
                          ...l,
                          quizzes: [
                            ...(l.quizzes || []),
                            {
                              id: `quiz_${Date.now()}`,
                              title: quiz.title,
                              description: quiz.description || "",
                              duration: quiz.timeLimit || 30,
                              passRate: quiz.passingScore || 70,
                              questions: quiz.questions || [],
                            },
                          ],
                        }
                      : l,
                  ),
                }
              : s,
          ),
        })),
      );
      return;
    }

    try {
      const lectureRef = doc(db, "Subjects", subjectId, "lectures", lectureId);
      await addDoc(collection(lectureRef, "quizzes"), {
        title: quiz.title,
        description: quiz.description || "",
        duration: quiz.timeLimit || 30,
        passRate: quiz.passingScore || 70,
        questions: quiz.questions || [],
        createdAt: new Date(),
        uploadedBy: "Current User",
      });
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding quiz:", error);
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
    addVideo,
    addFile,
    addQuiz,
  };
}
