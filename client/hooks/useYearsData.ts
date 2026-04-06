// Optimized data fetching functions with parallel requests
import {
  collection,
  doc,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { YearData, SubjectData, LectureData, VideoData, FileData, QuizData } from "./useYears";

// Fetch batches in parallel
export async function fetchBatches() {
  const batchesSnapshot = await getDocs(collection(db, "batches"));
  return batchesSnapshot.docs.map((batchDoc) => {
    const batchData = batchDoc.data() as any;
    const regNames = batchData.registrationNames || batchData.registration_names || [];
    const registrationNameStr =
      batchData.registration_name ??
      batchData.registrationName ??
      (Array.isArray(regNames) && regNames.length > 0 ? regNames[0] : "");
    return {
      id: batchDoc.id,
      batchName: batchData.batch_name || batchData.batchName || "",
      imageUrl: batchData.image_url || batchData.imageUrl || "",
      registrationNames: regNames,
      registration_name: registrationNameStr,
      registrationName: registrationNameStr,
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
      graduateDate:
        batchData.graduate_date ||
        batchData.graduateDate ||
        "",
      createdAt: batchData.createdAt,
      order: (() => {
        const o = batchData.order;
        if (typeof o === "number" && Number.isFinite(o)) return o;
        if (typeof o === "string" && o.trim() !== "") {
          const n = parseInt(o, 10);
          return Number.isNaN(n) ? undefined : n;
        }
        return undefined;
      })(),
      ref: batchDoc.ref,
    };
  });
}

// Fetch years for all batches in parallel
export async function fetchYearsForBatches(batches: any[]) {
  const yearPromises = batches.map(async (batch) => {
    try {
      const yearsSnap = await getDocs(collection(batch.ref, "years"));
      return yearsSnap.docs.map((ydoc) => {
        const data = ydoc.data() as any;
        let yearNumber = data.order || 1;
        if (data.name) {
          const match = String(data.name).match(/\d+/);
          if (match) yearNumber = parseInt(match[0]);
        }

        return {
          id: ydoc.id,
          yearNumber: yearNumber,
          name: data.name || data.title || "",
          type: yearNumber <= 3 ? "basic" : "clinical",
          batchName: batch.batchName,
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
          batchId: batch.id,
        } as YearData;
      });
    } catch (e) {
      console.warn("Failed to fetch years for batch", batch.id, e);
      return [];
    }
  });

  const yearsArrays = await Promise.all(yearPromises);
  return yearsArrays.flat();
}

// Fetch all subjects in parallel
export async function fetchSubjects() {
  const subjectsSnapshot = await getDocs(collection(db, "Subjects"));
  return subjectsSnapshot.docs;
}

// Fetch lectures for a single subject
async function fetchLecturesForSubject(subjectDoc: any): Promise<LectureData[]> {
  const lecturesSnapshot = await getDocs(
    collection(subjectDoc.ref, "lectures"),
  );
  
  const lecturePromises = lecturesSnapshot.docs.map(async (lectureDoc) => {
    const lectureData = lectureDoc.data();

    // Fetch videos, files, and quizzes in parallel
    const [videosSnapshot, filesSnapshot, quizzesSnapshot] = await Promise.all([
      getDocs(collection(lectureDoc.ref, "videos")),
      getDocs(collection(lectureDoc.ref, "files")),
      getDocs(collection(lectureDoc.ref, "quizzes")),
    ]);

    const videos: VideoData[] = [];
    videosSnapshot.forEach((videoDoc) => {
      const videoData = videoDoc.data();
      videos.push({
        id: videoDoc.id,
        title: videoData.title || videoData.name || "",
        url: videoData.url || videoData.youtubeUrl || "",
        thumbnailUrl: videoData.thumbnailUrl || "",
        description: videoData.description || "",
        uploadedAt: videoData.uploadedAt?.toDate() || new Date(),
        youtubeUrl: videoData.youtubeUrl || videoData.url || "",
      } as any);
    });

    const files: FileData[] = [];
    filesSnapshot.forEach((fileDoc) => {
      const fileData = fileDoc.data();
      files.push({
        id: fileDoc.id,
        title: fileData.title || fileData.name || "",
        url: fileData.fileUrl || fileData.url || "",
        description: fileData.description || "",
        uploadedAt: fileData.uploadedAt?.toDate() || new Date(),
        fileUrl: fileData.fileUrl || fileData.url || "",
      } as any);
    });

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

    return {
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
    };
  });

  const lectures = await Promise.all(lecturePromises);
  return lectures.sort((a, b) => a.order - b.order);
}

// Fetch all subjects with their lectures in parallel (batched)
export async function fetchSubjectsWithLectures() {
  const subjectDocs = await fetchSubjects();
  
  // Process subjects in batches of 10 to avoid overwhelming Firebase
  const batchSize = 10;
  const allSubjects: SubjectData[] = [];

  for (let i = 0; i < subjectDocs.length; i += batchSize) {
    const batch = subjectDocs.slice(i, i + batchSize);
    const subjectPromises = batch.map(async (subjectDoc) => {
      const subjectData = subjectDoc.data();
      const lectures = await fetchLecturesForSubject(subjectDoc);

      return {
        id: subjectDoc.id,
        name: subjectData.name || "",
        subjectId: subjectData.subjectId || subjectDoc.id,
        yearId: subjectData.yearId || "",
        imageUrl: subjectData.imageUrl || "",
        lectures: lectures,
      } as SubjectData;
    });

    const subjects = await Promise.all(subjectPromises);
    allSubjects.push(...subjects);
  }

  return allSubjects;
}

// Main function to fetch all data with caching support
export async function fetchAllYearsData() {
  if (!navigator.onLine) {
    throw new Error("No internet connection");
  }

  // Fetch batches first, then years for those batches, and subjects in parallel
  const originalBatches = await fetchBatches();
  const [yearsData, subjects] = await Promise.all([
    fetchYearsForBatches(originalBatches),
    fetchSubjectsWithLectures(),
  ]);

  // Link subjects to years
  const completeYears = yearsData.map((year) => ({
    ...year,
    subjects: subjects
      .filter((subject) => subject.yearId === year.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  // Return all batches (not just 3) - map original batches to the correct format
  const batchesData = originalBatches.map((batch) => ({
    id: batch.id,
    batchName: batch.batchName,
    imageUrl: batch.imageUrl || "",
    aca_supervisor: batch.aca_supervisor || "",
    cr: batch.cr || "",
    actor: batch.actor || "",
    group_link: batch.group_link || "",
  }));

  return {
    years: completeYears.sort((a, b) => a.yearNumber - b.yearNumber),
    batches: batchesData, // Return ALL batches, not limited to 3
    subjects: completeYears.flatMap((year) => year.subjects),
  };
}

