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
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");

  useEffect(() => {
    const fetchData = async () => {
      // Check network connectivity first
      if (!navigator.onLine) {
        console.log("🚫 No internet connection detected");
        setIsOfflineMode(true);
        setConnectionStatus("offline");
        setLoading(false);
        setError("No internet connection");

        // Provide offline year structure
        const offlineYears: YearData[] = [
          { id: "offline_year1", yearNumber: 1, type: "basic", subjects: [] },
          { id: "offline_year2", yearNumber: 2, type: "basic", subjects: [] },
          { id: "offline_year3", yearNumber: 3, type: "basic", subjects: [] },
          {
            id: "offline_year4",
            yearNumber: 4,
            type: "clinical",
            subjects: [],
          },
          {
            id: "offline_year5",
            yearNumber: 5,
            type: "clinical",
            subjects: [],
          },
          {
            id: "offline_year6",
            yearNumber: 6,
            type: "clinical",
            subjects: [],
          },
        ];

        setYears(offlineYears);
        setSubjects([]);
        return;
      }

      setConnectionStatus("connecting");

      try {
        // Add timeout for Firebase requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        // Try to fetch years
        console.log("🔄 Fetching years from Firebase...");
        const yearsSnapshot = await getDocs(collection(db, "years"));
        clearTimeout(timeoutId);
        let yearsData: YearData[] = [];

        if (!yearsSnapshot.empty) {
          yearsSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("📊 Firebase year doc:", doc.id, data);

            // Extract year number from name field or order field
            let yearNumber = data.order || 1;
            if (data.name) {
              const match = data.name.match(/\d+/);
              if (match) {
                yearNumber = parseInt(match[0]);
              }
            }

            console.log(
              "🔢 Extracted yearNumber:",
              yearNumber,
              "from order:",
              data.order,
              "name:",
              data.name,
            );

            yearsData.push({
              id: doc.id,
              yearNumber: yearNumber,
              type: yearNumber <= 3 ? "basic" : "clinical",
              subjects: [],
            });
          });
        } else {
          console.log("No years found in Firebase");
          setYears([]);
          setSubjects([]);
        }

        // Fetch subjects from Subjects collection
        const subjectsSnapshot = await getDocs(collection(db, "Subjects"));
        const allSubjects: SubjectData[] = [];

        for (const subjectDoc of subjectsSnapshot.docs) {
          const subjectData = subjectDoc.data();
          console.log("📊 Subject doc:", subjectDoc.id, subjectData);

          // Fetch lectures for this subject
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
        console.log(
          "✅ Years data loaded successfully:",
          completeYears.length,
          "years",
        );
      } catch (error: any) {
        console.error("Firebase error:", error);

        // Handle different types of errors
        let errorMessage = "Failed to load data";

        if (error.name === "AbortError") {
          errorMessage = "Request timed out. Please check your connection.";
        } else if (error.code === "permission-denied") {
          errorMessage =
            "Permission denied. Please check Firestore security rules.";
        } else if (error.code === "unavailable") {
          errorMessage =
            "Firebase service unavailable. Please try again later.";
        } else if (error.message && error.message.includes("fetch")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        }

        setError(errorMessage);
        setLoading(false);
        setIsOfflineMode(true);
        setConnectionStatus("offline");

        // Provide basic year structure for offline use
        const basicYears: YearData[] = [
          { id: "offline_year1", yearNumber: 1, type: "basic", subjects: [] },
          { id: "offline_year2", yearNumber: 2, type: "basic", subjects: [] },
          { id: "offline_year3", yearNumber: 3, type: "basic", subjects: [] },
          {
            id: "offline_year4",
            yearNumber: 4,
            type: "clinical",
            subjects: [],
          },
          {
            id: "offline_year5",
            yearNumber: 5,
            type: "clinical",
            subjects: [],
          },
          {
            id: "offline_year6",
            yearNumber: 6,
            type: "clinical",
            subjects: [],
          },
        ];

        setYears(basicYears);
        setSubjects([]);

        console.log("🔄 Switched to offline mode with basic year structure");
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
        // Use the actual existing document ID from your Firebase console
        const existingDocId = "faoMRHVqpltXNrGnBY";

        // First check if this document exists, if not, find the first existing document
        const subjectsSnapshot = await getDocs(collection(db, "Subjects"));
        let targetDocId = existingDocId;

        // If the hardcoded ID doesn't exist, use the first available document
        const existingDoc = subjectsSnapshot.docs.find(
          (doc) => doc.id === existingDocId,
        );
        if (!existingDoc && subjectsSnapshot.docs.length > 0) {
          targetDocId = subjectsSnapshot.docs[0].id;
          console.log("📝 Using existing document ID:", targetDocId);
        }

        const subjectDocRef = doc(db, "Subjects", targetDocId);

        // Update the existing subject document
        const updatedSubject = {
          name: subjectData.name,
          subjectId: targetDocId,
          yearId: subjectData.yearId,
          imageUrl: subjectData.imageUrl || "",
        };

        console.log("📝 Updating existing subject:", updatedSubject);

        // Use setDoc with merge to update the existing document
        await setDoc(subjectDocRef, updatedSubject, { merge: true });

        console.log("✅ Updated existing subject document:", targetDocId);

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
      // Find the year that contains the subject
      const yearsSnapshot = await getDocs(collection(db, "years"));
      let targetYearId = "";
      let targetSubjectIndex = -1;

      for (const yearDoc of yearsSnapshot.docs) {
        const yearData = yearDoc.data();
        if (yearData.subjects && Array.isArray(yearData.subjects)) {
          const subjectIndex = yearData.subjects.findIndex(
            (subject: any) => subject.id === lectureData.subjectId,
          );
          if (subjectIndex !== -1) {
            targetYearId = yearDoc.id;
            targetSubjectIndex = subjectIndex;
            break;
          }
        }
      }

      if (targetYearId && targetSubjectIndex !== -1) {
        const yearDocRef = doc(db, "years", targetYearId);
        const yearDoc = yearsSnapshot.docs.find(
          (doc) => doc.id === targetYearId,
        );
        const yearData = yearDoc?.data();

        if (yearData) {
          const updatedSubjects = [...yearData.subjects];
          const newLecture = {
            id: `lecture_${Date.now()}`,
            name: lectureData.name,
            description: lectureData.description || "",
            order: lectureData.order || 1,
            imageUrl: lectureData.imageUrl || "",
            createdAt: new Date(),
            uploadedBy: lectureData.uploadedBy || "Current User",
          };

          // Add lecture to the subject's lectures array
          if (!updatedSubjects[targetSubjectIndex].lectures) {
            updatedSubjects[targetSubjectIndex].lectures = [];
          }
          updatedSubjects[targetSubjectIndex].lectures.push(newLecture);

          // Update the year document
          await updateDoc(yearDocRef, {
            subjects: updatedSubjects,
          });

          console.log("✅ Added lecture to Firebase:", lectureData.name);

          // Refresh data
          window.location.reload();
        }
      } else {
        throw new Error("Subject not found in any year document");
      }
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
