import React, { useState, useEffect } from "react";
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
import cacheManager from "@/lib/cacheManager";

export interface YearData {
  id?: string;
  yearNumber: number;
  name?: string;
  type: "basic" | "clinical";
  batchName?: string;
  batchId?: string;
  imageUrl?: string;
  academicSupervisor?: string;
  actor?: string;
  cr?: string;
  groupUrl?: string;
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
  const [batches, setBatches] = useState<any[]>([]);
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
      {
        id: "offline_year1",
        yearNumber: 1,
        type: "basic",
        batchName: "",
        subjects: [],
      },
      {
        id: "offline_year2",
        yearNumber: 2,
        type: "basic",
        batchName: "",
        subjects: [],
      },
      {
        id: "offline_year3",
        yearNumber: 3,
        type: "basic",
        batchName: "",
        subjects: [],
      },
      {
        id: "offline_year4",
        yearNumber: 4,
        type: "clinical",
        batchName: "",
        subjects: [],
      },
      {
        id: "offline_year5",
        yearNumber: 5,
        type: "clinical",
        batchName: "",
        subjects: [],
      },
      {
        id: "offline_year6",
        yearNumber: 6,
        type: "clinical",
        batchName: "",
        subjects: [],
      },
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

      // Try to load from cache first
      const hasCachedYears = cacheManager.isCacheValid("years");
      const hasCachedBatches = cacheManager.isCacheValid("batches");
      const hasCachedSubjects = cacheManager.isCacheValid("subjects");

      if (hasCachedYears && hasCachedBatches && hasCachedSubjects) {
        console.log("📦 Loading data from cache...");
        const cachedYears = cacheManager.getCache<YearData[]>("years") || [];
        const cachedBatches = cacheManager.getCache<any[]>("batches") || [];
        const cachedSubjects = cacheManager.getCache<SubjectData[]>("subjects") || [];

        setBatches(cachedBatches);
        setYears(cachedYears);
        setSubjects(cachedSubjects);
        setLoading(false);
        setIsOfflineMode(false);
        setConnectionStatus("connected");
        console.log("✅ Loaded from cache - fetching fresh data in background...");

        // Continue fetching fresh data in background
      } else {
        // No valid cache, show loading state
        setLoading(true);
      }

      try {
        console.log("🔄 Attempting Firebase connection...");

        // PHASE 1: Fetch batches and their years first
        console.log("📦 Phase 1: Fetching batches and years...");
        const batchesSnapshot = await getDocs(collection(db, "batches"));
        let yearsData: YearData[] = [];

        // For each batch, fetch its years subcollection
        const batchesData: any[] = [];
        for (const batchDoc of batchesSnapshot.docs) {
          const batchData = batchDoc.data() as any;
          const batchId = batchDoc.id;
          const batchName = batchData.batch_name || batchData.batchName || "";

          // collect batch-level metadata
          batchesData.push({
            id: batchId,
            batchName,
            imageUrl: batchData.image_url || batchData.imageUrl || "",
            aca_supervisor:
              batchData.aca_supervisor ||
              batchData.acadmic_supervisor ||
              batchData.academic_supervisor ||
              "",
            cr: batchData.cr || "",
            actor: batchData.actor || "",
            group_link:
              batchData.group_link ||
              batchData.groupUrl ||
              batchData.group_url ||
              "",
          });

          try {
            const yearsSnap = await getDocs(collection(batchDoc.ref, "years"));
            yearsSnap.forEach((ydoc) => {
              const data = ydoc.data() as any;
              let yearNumber = data.order || 1;
              if (data.name) {
                const match = String(data.name).match(/\d+/);
                if (match) yearNumber = parseInt(match[0]);
              }

              yearsData.push({
                id: ydoc.id,
                yearNumber: yearNumber,
                name: data.name || data.title || "",
                type: yearNumber <= 3 ? "basic" : "clinical",
                batchName: batchName,
                imageUrl: data.imageUrl || data.image_url || "",
                academicSupervisor:
                  data.aca_supervisor ||
                  data.acadmic_supervisor ||
                  data.academic_supervisor ||
                  "",
                actor: data.actor || "",
                cr: data.cr || "",
                groupUrl:
                  data.group_link || data.group_url || data.groupUrl || "",
                subjects: [],
                // include batchId for possible updates
                batchId,
              } as YearData);
            });
          } catch (e) {
            console.warn("Failed to fetch years for batch", batchId, e);
          }
        }

        // Set batches and years immediately (before subjects)
        setBatches(batchesData);
        const sortedYears = yearsData.sort((a, b) => a.yearNumber - b.yearNumber);
        setYears(sortedYears);
        setLoading(false);
        setIsOfflineMode(false);
        setConnectionStatus("connected");
        console.log("✅ Phase 1 complete: Batches and years loaded");

        // Cache batches and years
        cacheManager.setCache("batches", batchesData);
        cacheManager.setCache("years", sortedYears);

        // PHASE 2: Fetch subjects collection (non-blocking)
        console.log("📚 Phase 2: Fetching subjects...");
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

            lectures.push({
              id: lectureDoc.id,
              name: lectureData.name || lectureData.title || "",
              description: lectureData.description || "",
              subjectId: subjectDoc.id,
              order: lectureData.order || 1,
              imageUrl: lectureData.imageUrl || "",
              createdAt: lectureData.createdAt?.toDate() || new Date(),
              uploadedBy: lectureData.uploadedBy || "Unknown",
              videos: undefined,
              files: undefined,
              quizzes: undefined,
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

        // Link subjects to years and update state
        const completeYears = sortedYears.map((year) => ({
          ...year,
          subjects: allSubjects
            .filter((subject) => subject.yearId === year.id)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));

        setYears(completeYears);
        setSubjects(allSubjects);
        setError(null);
        console.log("✅ Phase 2 complete: Subjects and lectures loaded");

        // Cache subjects
        cacheManager.setCache("subjects", allSubjects);

      } catch (error: any) {
        console.log("❌ Firebase connection failed");

        // If we haven't already loaded from cache, activate offline mode
        if (!cacheManager.isCacheValid("years")) {
          console.log("No cache available - activating offline mode");
          activateOfflineMode();
        } else {
          console.log("Using cached data in offline mode");
          setConnectionStatus("offline");
          setIsOfflineMode(true);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [retryCount]);

  const retryConnection = () => {
    console.log("��� Retrying Firebase connection...");
    setLoading(true);
    setError(null);
    setIsOfflineMode(false);
    setConnectionStatus("connecting");
    setRetryCount((prev) => prev + 1);
  };

  const updateYear = async (yearId: string, patch: Partial<YearData>) => {
    if (!yearId) return;

    if (isOfflineMode || !navigator.onLine) {
      setYears((prev) =>
        prev.map((y) => (y.id === yearId ? { ...y, ...patch } : y)),
      );
      return;
    }

    try {
      // Find the year document across batches using a collectionGroup query
      const cg = collectionGroup(db, "years");
      const snaps = await getDocs(cg);
      const found = snaps.docs.find((d) => d.id === yearId);
      if (found) {
        await updateDoc(found.ref, { ...patch, updatedAt: new Date() });
        setRetryCount((prev) => prev + 1);
        return;
      }

      // If not found, fallback to local update
      setYears((prev) =>
        prev.map((y) => (y.id === yearId ? { ...y, ...patch } : y)),
      );
    } catch (error) {
      console.error("Error updating year:", error);
      // Fall back to offline update
      setYears((prev) =>
        prev.map((y) => (y.id === yearId ? { ...y, ...patch } : y)),
      );
    }
  };

  // Update batch document by id
  const updateBatch = async (batchId: string, patch: Partial<any>) => {
    if (!batchId) return;
    if (isOfflineMode || !navigator.onLine) {
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, ...patch } : b)),
      );
      return;
    }
    try {
      const batchRef = doc(db, "batches", batchId);
      await updateDoc(batchRef, { ...patch, updatedAt: new Date() });
      // refresh retry to trigger re-fetch
      setRetryCount((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update batch:", err);
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, ...patch } : b)),
      );
    }
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
    // Clear cache to prepare for fresh data
    clearCache();

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

  const updateLecture = async (
    subjectId: string,
    lectureId: string,
    lectureData: Partial<LectureData>,
  ) => {
    if (isOfflineMode) {
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                lectures: subject.lectures.map((l) =>
                  l.id === lectureId ? { ...l, ...lectureData } : l,
                ),
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
                  lectures: subject.lectures.map((l) =>
                    l.id === lectureId ? { ...l, ...lectureData } : l,
                  ),
                }
              : subject,
          ),
        })),
      );

      console.log("✅ Updated lecture in offline mode:", lectureData.name);
      return;
    }

    try {
      await retryOperation(async () => {
        const subjectRef = doc(db, "Subjects", subjectId);
        const lectureRef = doc(subjectRef, "lectures", lectureId);

        const updatePayload: any = {
          title: lectureData.name,
          description: lectureData.description || "",
          imageUrl: lectureData.imageUrl || "",
          order: lectureData.order || 1,
          updatedAt: new Date(),
        };

        await updateDoc(lectureRef, updatePayload);
        console.log("✅ Updated lecture in Firebase");

        // Refresh data
        setRetryCount((prev) => prev + 1);
      });
    } catch (error) {
      console.error("Error updating lecture:", error);
      setIsOfflineMode(true);
      await updateLecture(subjectId, lectureId, lectureData);
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

  const createYear = async (
    batchId: string | null,
    data: {
      yearNumber?: number;
      name?: string;
      type?: "basic" | "clinical";
    } = {},
  ) => {
    const yearNumber = data.yearNumber || 1;
    const name = data.name || `Year ${yearNumber}`;
    const type = data.type || (yearNumber <= 3 ? "basic" : "clinical");

    if (isOfflineMode || !navigator.onLine) {
      const newYear: YearData = {
        id: `year_${Date.now()}`,
        yearNumber,
        name,
        type: type as "basic" | "clinical",
        batchName: "",
        batchId: batchId || undefined,
        imageUrl: "",
        academicSupervisor: "",
        actor: "",
        cr: "",
        groupUrl: "",
        subjects: [],
      };

      setYears((prev) => [...prev, newYear]);

      if (batchId) {
        setBatches((prev) =>
          prev.map((b) => (b.id === batchId ? { ...b } : b)),
        );
      }

      console.log("✅ Added year in offline mode:", newYear);
      return;
    }

    try {
      await retryOperation(async () => {
        if (batchId) {
          const batchRef = doc(db, "batches", batchId);
          const yearsRef = collection(batchRef, "years");
          const docRef = await addDoc(yearsRef, {
            name,
            order: yearNumber,
            imageUrl: "",
            batch_name: name,
            createdAt: new Date(),
          });
          try {
            await updateDoc(docRef, { yearId: docRef.id });
          } catch (e) {
            // ignore
          }
        } else {
          const yearsRef = collection(db, "years");
          const docRef = await addDoc(yearsRef, {
            name,
            order: yearNumber,
            imageUrl: "",
            batch_name: name,
            createdAt: new Date(),
          });
          try {
            await updateDoc(docRef, { yearId: docRef.id });
          } catch (e) {
            // ignore
          }
        }

        // Trigger a refresh to load the new year
        setRetryCount((prev) => prev + 1);
      });
    } catch (error) {
      console.error("Error creating year:", error);
      // Fallback to offline creation
      setIsOfflineMode(true);
      await createYear(batchId, data);
    }
  };

  const createBatch = async (
    data: { batchName?: string; imageUrl?: string; cr?: string } = {},
  ) => {
    const name = data.batchName || "New Batch";
    const imageUrl = data.imageUrl || "";
    const cr = data.cr || "";

    // Clear cache to prepare for fresh data
    clearCache();

    // Optimistic temporary batch to update UI immediately
    const tempId = `batch_temp_${Date.now()}`;
    const tempBatch = { id: tempId, batchName: name, imageUrl, cr };
    setBatches((prev) => [tempBatch, ...prev]);

    if (isOfflineMode || !navigator.onLine) {
      console.log("✅ Added batch in offline mode:", tempBatch);
      return;
    }

    try {
      await retryOperation(async () => {
        const batchesRef = collection(db, "batches");
        const docRef = await addDoc(batchesRef, {
          batch_name: name,
          image_url: imageUrl,
          cr,
          createdAt: new Date(),
        });

        try {
          await updateDoc(docRef, { batchId: docRef.id });
        } catch (e) {
          // ignore non-critical
        }

        // Replace temp batch with saved batch data
        const realBatch = {
          id: docRef.id,
          batchName: name,
          imageUrl,
          cr,
        };
        setBatches((prev) => [
          realBatch,
          ...prev.filter((b) => b.id !== tempId),
        ]);

        // trigger a fresh fetch to load nested years if any
        setRetryCount((prev) => prev + 1);
      });
    } catch (error) {
      console.error("Error creating batch:", error);
      // remove temp batch on failure
      setBatches((prev) => prev.filter((b) => b.id !== tempId));
      // fallback to offline mode
      setIsOfflineMode(true);
      // optionally add as offline batch
      const offlineBatch = {
        id: `batch_${Date.now()}`,
        batchName: name,
        imageUrl,
        cr,
      };
      setBatches((prev) => [offlineBatch, ...prev]);
    }
  };

  // Delete a batch and optionally its nested years
  const deleteBatch = async (
    batchId: string,
    options: { deleteYears?: boolean } = { deleteYears: true },
  ) => {
    if (!batchId) return;

    // Clear cache to prepare for fresh data
    clearCache();

    // Optimistic removal
    const prevBatches = batches;
    const prevYears = years;
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setYears((prev) =>
      prev.filter((y) => (y.batchId || y.batch_name) !== batchId),
    );

    if (isOfflineMode || !navigator.onLine) {
      console.log("✅ Removed batch in offline mode:", batchId);
      return;
    }

    try {
      await retryOperation(async () => {
        const batchRef = doc(db, "batches", batchId);
        if (options.deleteYears) {
          // Delete nested years documents if present
          try {
            const yearsCol = collection(batchRef, "years");
            const snaps = await getDocs(yearsCol);
            for (const d of snaps.docs) {
              await deleteDoc(d.ref);
            }
          } catch (e) {
            // If nested years are stored elsewhere, try collectionGroup fallback
            const cg = collectionGroup(db, "years");
            const snaps = await getDocs(cg);
            for (const d of snaps.docs) {
              const data = d.data() as any;
              if ((data.batchId || data.batch_id) === batchId) {
                await deleteDoc(d.ref);
              }
            }
          }
        } else {
          // If not deleting years, unset their batch reference
          const cg = collectionGroup(db, "years");
          const snaps = await getDocs(cg);
          for (const d of snaps.docs) {
            const data = d.data() as any;
            if ((data.batchId || data.batch_id) === batchId) {
              try {
                await updateDoc(d.ref, { batchId: null, batch_name: null });
              } catch (e) {
                // ignore
              }
            }
          }
        }

        // Finally delete the batch doc
        await deleteDoc(batchRef);

        // refresh
        setRetryCount((prev) => prev + 1);
      });
    } catch (error) {
      console.error("Error deleting batch:", error);
      // rollback optimistic updates
      setBatches(prevBatches || []);
      setYears(prevYears || []);
      throw error;
    }
  };

  // Lazy-load videos, files, and quizzes for a specific lecture
  const loadLectureResources = async (
    subjectId: string,
    lectureId: string,
  ): Promise<{ videos?: VideoData[]; files?: FileData[]; quizzes?: QuizData[] }> => {
    if (isOfflineMode || !navigator.onLine) {
      return { videos: [], files: [], quizzes: [] };
    }

    try {
      const resources: { videos?: VideoData[]; files?: FileData[]; quizzes?: QuizData[] } = {};

      const lectureRef = doc(db, "Subjects", subjectId, "lectures", lectureId);

      // Fetch videos
      try {
        const videosSnapshot = await getDocs(collection(lectureRef, "videos"));
        resources.videos = videosSnapshot.docs.map((videoDoc) => {
          const videoData = videoDoc.data();
          return {
            id: videoDoc.id,
            title: videoData.title || videoData.name || "",
            url: videoData.url || "",
            thumbnailUrl: videoData.thumbnailUrl || "",
            description: videoData.description || "",
            uploadedAt: videoData.uploadedAt?.toDate() || new Date(),
          };
        });
      } catch (e) {
        console.warn("Failed to fetch videos:", e);
        resources.videos = [];
      }

      // Fetch files
      try {
        const filesSnapshot = await getDocs(collection(lectureRef, "files"));
        resources.files = filesSnapshot.docs.map((fileDoc) => {
          const fileData = fileDoc.data();
          return {
            id: fileDoc.id,
            title: fileData.title || fileData.name || "",
            url: fileData.url || "",
            description: fileData.description || "",
            uploadedAt: fileData.uploadedAt?.toDate() || new Date(),
          };
        });
      } catch (e) {
        console.warn("Failed to fetch files:", e);
        resources.files = [];
      }

      // Fetch quizzes
      try {
        const quizzesSnapshot = await getDocs(collection(lectureRef, "quizzes"));
        resources.quizzes = quizzesSnapshot.docs.map((quizDoc) => {
          const quizData = quizDoc.data();
          return {
            id: quizDoc.id,
            title: quizData.title || quizData.name || "",
            description: quizData.description || "",
            duration: quizData.duration || 30,
            passRate: quizData.passRate || 70,
            questions: quizData.questions || [],
          };
        });
      } catch (e) {
        console.warn("Failed to fetch quizzes:", e);
        resources.quizzes = [];
      }

      // Update the years state with the loaded resources
      setYears((prevYears) =>
        prevYears.map((year) => ({
          ...year,
          subjects: year.subjects.map((subject) =>
            subject.id === subjectId
              ? {
                  ...subject,
                  lectures: subject.lectures.map((lecture) =>
                    lecture.id === lectureId
                      ? { ...lecture, ...resources }
                      : lecture,
                  ),
                }
              : subject,
          ),
        })),
      );

      return resources;
    } catch (error) {
      console.error("Error loading lecture resources:", error);
      return { videos: [], files: [], quizzes: [] };
    }
  };

  const clearCache = () => {
    console.log("🗑️  Clearing Years Tab cache...");
    cacheManager.clearCache("years");
    cacheManager.clearCache("batches");
    cacheManager.clearCache("subjects");
    setRetryCount((prev) => prev + 1);
  };

  return {
    years,
    batches,
    subjects,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
    clearCache,
    updateYear,
    updateBatch,
    createSubject,
    createLecture,
    updateLecture,
    createYear,
    createBatch,
    deleteBatch,
    deleteLecture,
    deleteSubject,
    addVideo,
    addFile,
    addQuiz,
    loadLectureResources,
  };
}
