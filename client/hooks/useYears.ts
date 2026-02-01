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
  Timestamp,
} from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { fetchAllYearsData } from "./useYearsData";

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
  const queryClient = useQueryClient();
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Use React Query for caching and optimized data fetching
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["years-data"],
    queryFn: fetchAllYearsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    retryDelay: 1000,
    enabled: navigator.onLine && !isOfflineMode,
  });

  const loading = isLoading;
  const error = queryError ? (queryError as Error).message : null;

  // Local state synced from query for optimistic updates (setYears, setBatches, setSubjects)
  const [years, setYears] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    setYears(data?.years || []);
    setBatches(data?.batches || []);
    setSubjects(data?.subjects || []);
  }, [data?.years, data?.batches, data?.subjects]);

  // Handle offline mode
  useEffect(() => {
    if (!navigator.onLine) {
      setIsOfflineMode(true);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  const retryConnection = () => {
    console.log("��� Retrying Firebase connection...");
    setIsOfflineMode(false);
    queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
        // Create a NEW subject document in the Subjects collection
        const newSubjectData: any = {
          name: subjectData.name,
          imageUrl: subjectData.imageUrl || "",
          hours: (subjectData as any).hours || 3,
          yearId: subjectData.yearId,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        };

        // Remove undefined fields
        Object.keys(newSubjectData).forEach(key => {
          if (newSubjectData[key] === undefined) {
            delete newSubjectData[key];
          }
        });

        // Create new subject document
        const subjectDocRef = await addDoc(collection(db, "Subjects"), newSubjectData);
        
        // Update the document with its own ID
        await updateDoc(subjectDocRef, {
          subjectId: subjectDocRef.id,
        });

        console.log("✅ Created new subject document:", subjectDocRef.id);
        
        const subjectRef = subjectDocRef;

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
            subjectRef.id,
          );
        }

        // Refresh data to show the updates
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
      });
    } catch (error) {
      console.error("Error creating lecture:", error);
      // Fall back to offline mode
      setIsOfflineMode(true);
      await createLecture(lectureData);
    }
  };

  const updateLecture = async (lectureId: string, lectureData: Partial<LectureData>) => {
    if (isOfflineMode) {
      // Update in local state for offline mode
      setYears((prev) =>
        prev.map((year) => ({
          ...year,
          subjects: year.subjects.map((subject) => ({
            ...subject,
            lectures: subject.lectures.map((lecture) =>
              lecture.id === lectureId
                ? { ...lecture, ...lectureData }
                : lecture
            ),
          })),
        }))
      );
      console.log("✅ Updated lecture in offline mode");
      return;
    }

    try {
      console.log("🔄 Updating lecture:", lectureId, lectureData);

      await retryOperation(async () => {
        // Find the lecture using collectionGroup query
        const lecturesQuery = query(collectionGroup(db, "lectures"));
        const querySnapshot = await getDocs(lecturesQuery);

        let lectureRef = null;
        for (const docSnapshot of querySnapshot.docs) {
          if (docSnapshot.id === lectureId) {
            lectureRef = docSnapshot.ref;
            break;
          }
        }

        if (!lectureRef) {
          throw new Error(`Lecture ${lectureId} not found`);
        }

        // Prepare update data - remove undefined fields and convert dates
        const updateData: any = { ...lectureData };
        
        // Map 'name' to 'title' if present (Firebase uses 'title')
        if (updateData.name) {
          updateData.title = updateData.name;
          delete updateData.name;
        }

        // Remove undefined fields
        Object.keys(updateData).forEach((key) => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        // Convert Date objects to Firestore Timestamps
        if (updateData.createdAt instanceof Date) {
          updateData.createdAt = Timestamp.fromDate(updateData.createdAt);
        }
        if (updateData.updatedAt instanceof Date) {
          updateData.updatedAt = Timestamp.fromDate(updateData.updatedAt);
        }

        // Add updatedAt if not present
        if (!updateData.updatedAt) {
          updateData.updatedAt = Timestamp.fromDate(new Date());
        }

        await updateDoc(lectureRef, updateData);

        console.log("✅ Updated lecture successfully:", lectureId);

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
      });
    } catch (error: any) {
      console.error("❌ Error updating lecture:", error);
      console.error("Error details:", error.code, error.message);
      throw new Error(`Failed to update lecture: ${error.message || 'Check Firebase permissions'}`);
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
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
                              fileUrl: file.fileUrl,
                              url: file.fileUrl, // Keep both for compatibility
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
      
      // Prepare file data - remove undefined fields
      const fileData: any = {
        title: file.title,
        description: file.description || "",
        fileUrl: file.fileUrl, // Primary field
        url: file.fileUrl, // Keep both for compatibility
        uploadedAt: Timestamp.fromDate(new Date()),
        uploadedBy: "Current User",
      };

      // Remove undefined fields
      Object.keys(fileData).forEach((key) => {
        if (fileData[key] === undefined) {
          delete fileData[key];
        }
      });

      await addDoc(collection(lectureRef, "files"), fileData);
      console.log("✅ File added successfully:", file.title);
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
    } catch (error: any) {
      console.error("❌ Error adding file:", error);
      console.error("Error details:", error.code, error.message);
      throw new Error(`Failed to add file: ${error.message || 'Check Firebase permissions'}`);
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
      queryClient.invalidateQueries({ queryKey: ["years-data"] });
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

        // Invalidate cache to refresh data
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
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
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
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

    // Optimistic removal
    const prevBatches = batches;
    const prevYears = years;
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setYears((prev) =>
      prev.filter((y) => (y.batchId || y.batchName) !== batchId),
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
        queryClient.invalidateQueries({ queryKey: ["years-data"] });
      });
    } catch (error) {
      console.error("Error deleting batch:", error);
      // rollback optimistic updates
      setBatches(prevBatches || []);
      setYears(prevYears || []);
      throw error;
    }
  };

  return {
    years,
    batches,
    subjects,
    loading,
    error,
    isOfflineMode,
    retryConnection,
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
  };
}
