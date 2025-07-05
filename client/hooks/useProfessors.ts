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

// Mock data for development
const mockProfessors: Professor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    department: "Internal Medicine",
    email: "sarah.johnson@medjust.com",
    officeLocation: "Medical Building, Room 301",
    imageUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Prof. Michael Chen",
    department: "Surgery",
    email: "michael.chen@medjust.com",
    officeLocation: "Surgical Wing, Room 205",
    imageUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    department: "Emergency Medicine",
    email: "emily.rodriguez@medjust.com",
    officeLocation: "Emergency Department, Office 12",
    imageUrl:
      "https://images.unsplash.com/photo-1594824928909-90ad1d93d7c3?w=300&h=300&fit=crop&crop=face",
  },
];

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
        // Fallback to mock data when Firebase fails
        console.log("Using mock data for professors");
        setProfessors(mockProfessors);
        setError(null); // Clear error when using mock data
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
