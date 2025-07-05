import { useState, useEffect } from "react";
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
  code?: string;
  description?: string;
  credits?: number;
  yearId: string;
  order: number;
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

  // Mock data for offline mode
  const mockYears: YearData[] = [
    {
      id: "year1",
      yearNumber: 1,
      type: "basic",
      subjects: [
        {
          id: "anat1",
          name: "Anatomy & Physiology",
          code: "ANAT101",
          description: "Basic human anatomy and physiology",
          credits: 6,
          yearId: "year1",
          order: 1,
          lectures: [
            {
              id: "lec1",
              name: "Introduction to Anatomy",
              description: "Basic anatomical terminology",
              subjectId: "anat1",
              order: 1,
              createdAt: new Date(),
              uploadedBy: "Dr. Smith",
            },
          ],
        },
      ],
    },
    {
      id: "year2",
      yearNumber: 2,
      type: "basic",
      subjects: [],
    },
    {
      id: "year3",
      yearNumber: 3,
      type: "basic",
      subjects: [],
    },
    {
      id: "year4",
      yearNumber: 4,
      type: "clinical",
      subjects: [],
    },
    {
      id: "year5",
      yearNumber: 5,
      type: "clinical",
      subjects: [],
    },
    {
      id: "year6",
      yearNumber: 6,
      type: "clinical",
      subjects: [],
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch years
        const yearsSnapshot = await getDocs(collection(db, "years"));
        let yearsData: YearData[] = [];

        if (yearsSnapshot.empty) {
          // Initialize years structure if not exists
          console.log("No years found, initializing years structure...");
          await initializeYearsStructure();
          // Create basic structure for display
          yearsData = createDefaultYears();
        } else {
          yearsSnapshot.forEach((doc) => {
            const data = doc.data();
            yearsData.push({
              id: doc.id,
              yearNumber:
                data.yearNumber || parseInt(doc.id.replace("year", "")),
              type: data.type || (data.yearNumber <= 3 ? "basic" : "clinical"),
              subjects: [],
            });
          });
        }

        // Try to fetch subjects
        const subjectsSnapshot = await getDocs(collection(db, "Subjects"));
        const subjectsData: SubjectData[] = [];

        for (const subjectDoc of subjectsSnapshot.docs) {
          const subjectData = subjectDoc.data();

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

          subjectsData.push({
            id: subjectDoc.id,
            name: subjectData.name || "",
            code: subjectData.code || "",
            description: subjectData.description || "",
            credits: subjectData.credits || 3,
            yearId: subjectData.yearId || subjectData.subjectId || "",
            order: subjectData.order || 1,
            lectures: lectures.sort((a, b) => a.order - b.order),
          });
        }

        // Combine years with their subjects
        const completeYears = yearsData.map((year) => ({
          ...year,
          subjects: subjectsData
            .filter(
              (subject) =>
                subject.yearId === year.id ||
                subject.yearId === `year${year.yearNumber}`,
            )
            .sort((a, b) => a.order - b.order),
        }));

        setYears(completeYears.sort((a, b) => a.yearNumber - b.yearNumber));
        setSubjects(subjectsData);
        setLoading(false);
        setIsOfflineMode(false);
        console.log(
          "✅ Years data loaded successfully:",
          completeYears.length,
          "years",
        );
      } catch (error) {
        console.error("Firebase error, switching to offline mode:", error);
        setIsOfflineMode(true);
        setYears(mockYears);
        setSubjects(mockYears.flatMap((y) => y.subjects));
        setLoading(false);
        setError(null);
      }
    };

    fetchData();
  }, []);

  const createDefaultYears = (): YearData[] => {
    return [
      { id: "year1", yearNumber: 1, type: "basic", subjects: [] },
      { id: "year2", yearNumber: 2, type: "basic", subjects: [] },
      { id: "year3", yearNumber: 3, type: "basic", subjects: [] },
      { id: "year4", yearNumber: 4, type: "clinical", subjects: [] },
      { id: "year5", yearNumber: 5, type: "clinical", subjects: [] },
      { id: "year6", yearNumber: 6, type: "clinical", subjects: [] },
    ];
  };

  const initializeYearsStructure = async () => {
    try {
      const batch = writeBatch(db);

      // Create year documents
      for (let i = 1; i <= 6; i++) {
        const yearRef = doc(db, "years", `year${i}`);
        batch.set(yearRef, {
          yearNumber: i,
          type: i <= 3 ? "basic" : "clinical",
          name: `Year ${i}`,
          createdAt: new Date(),
        });
      }

      await batch.commit();
      console.log("✅ Years structure initialized in Firebase");
    } catch (error) {
      console.error("❌ Failed to initialize years structure:", error);
    }
  };

  const createSubject = async (
    subjectData: Omit<SubjectData, "id" | "lectures">,
  ) => {
    if (isOfflineMode) {
      const newSubject: SubjectData = {
        id: `subject_${Date.now()}`,
        ...subjectData,
        lectures: [],
      };

      setSubjects((prev) => [...prev, newSubject]);
      setYears((prev) =>
        prev.map((year) =>
          year.id === subjectData.yearId ||
          `year${year.yearNumber}` === subjectData.yearId
            ? { ...year, subjects: [...year.subjects, newSubject] }
            : year,
        ),
      );

      console.log("✅ Added subject to offline mode:", newSubject.name);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "Subjects"), {
        ...subjectData,
        createdAt: new Date(),
      });

      console.log("✅ Added subject to Firebase:", subjectData.name);

      // Refresh data
      window.location.reload();
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
      const subjectRef = doc(db, "Subjects", lectureData.subjectId);
      const lecturesRef = collection(subjectRef, "lectures");

      await addDoc(lecturesRef, {
        ...lectureData,
        createdAt: new Date(),
      });

      console.log("✅ Added lecture to Firebase:", lectureData.name);

      // Refresh data
      window.location.reload();
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
    createSubject,
    createLecture,
    deleteLecture,
  };
}
