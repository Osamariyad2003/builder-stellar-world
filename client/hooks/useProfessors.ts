import { useState, useEffect } from "react";
import { Professor } from "@shared/types";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useProfessors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "professors"), orderBy("name", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const professorsData: Professor[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          professorsData.push({
            id: doc.id,
            name: data.name || "",
            department: data.department || "",
            email: data.email || "",
            officeLocation: data.officeLocation || "",
            imageUrl: data.imageUrl || "",
          });
        });
        setProfessors(professorsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching professors:", error);
        setError("Failed to fetch professors");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const createProfessor = async (professorData: Omit<Professor, "id">) => {
    try {
      await addDoc(collection(db, "professors"), {
        ...professorData,
        professorId: `prof_${Date.now()}`, // Generate unique ID
      });
    } catch (error) {
      console.error("Error creating professor:", error);
      throw error;
    }
  };

  const updateProfessor = async (
    id: string,
    professorData: Partial<Professor>,
  ) => {
    try {
      await updateDoc(doc(db, "professors", id), professorData);
    } catch (error) {
      console.error("Error updating professor:", error);
      throw error;
    }
  };

  const deleteProfessor = async (id: string) => {
    try {
      await deleteDoc(doc(db, "professors", id));
    } catch (error) {
      console.error("Error deleting professor:", error);
      throw error;
    }
  };

  return {
    professors,
    loading,
    error,
    createProfessor,
    updateProfessor,
    deleteProfessor,
  };
}
