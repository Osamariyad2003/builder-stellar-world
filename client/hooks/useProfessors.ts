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
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // Try to test Firebase connection first
    const testFirebaseConnection = async () => {
      try {
        // Try a simple read operation to test permissions
        const testQuery = query(collection(db, "professors"));
        await getDocs(testQuery);

        // If successful, set up real-time listener
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
                title: data.title || "",
                department: data.department || "",
                email: data.email || "",
                phone: data.phone || "",
                officeLocation: data.officeLocation || "",
                bio: data.bio || "",
                researchAreas: data.researchAreas || [],
                website: data.website || "",
                linkedin: data.linkedin || "",
                imageUrl: data.imageUrl || "",
              });
            });
            setProfessors(professorsData);
            setLoading(false);
          },
          (error) => {
            console.error("Error in Firebase listener:", error);
            enterOfflineMode();
          },
        );

        return unsubscribe;
      } catch (error) {
        console.error("Firebase connection failed:", error);
        enterOfflineMode();
        return null;
      }
    };

    const enterOfflineMode = () => {
      console.log("🔄 Switching to offline mode with mock data");
      setIsOfflineMode(true);
      setProfessors(mockProfessors);
      setError(null);
      setLoading(false);
    };

    testFirebaseConnection();
  }, []);

  const createProfessor = async (professorData: Omit<Professor, "id">) => {
    if (isOfflineMode) {
      // Offline mode - work with local data only
      const newProfessor: Professor = {
        id: `offline_${Date.now()}`,
        ...professorData,
      };
      setProfessors((prev) => [...prev, newProfessor]);
      console.log("✅ Added professor in offline mode:", newProfessor.name);
      return;
    }

    try {
      await addDoc(collection(db, "professors"), {
        ...professorData,
        professorId: `prof_${Date.now()}`,
      });
      console.log("✅ Added professor to Firebase:", professorData.name);
    } catch (error) {
      console.error("Error creating professor:", error);
      // Switch to offline mode and retry
      setIsOfflineMode(true);
      await createProfessor(professorData);
    }
  };

  const updateProfessor = async (
    id: string,
    professorData: Partial<Professor>,
  ) => {
    if (isOfflineMode || id.startsWith("offline_") || id.startsWith("mock_")) {
      // Offline mode or local data - update locally only
      setProfessors((prev) =>
        prev.map((prof) =>
          prof.id === id ? { ...prof, ...professorData } : prof,
        ),
      );
      console.log("✅ Updated professor in offline mode");
      return;
    }

    try {
      await updateDoc(doc(db, "professors", id), professorData);
      console.log("✅ Updated professor in Firebase");
    } catch (error) {
      console.error("Error updating professor:", error);
      // Update locally as fallback
      setProfessors((prev) =>
        prev.map((prof) =>
          prof.id === id ? { ...prof, ...professorData } : prof,
        ),
      );
      console.log("✅ Updated professor locally (Firebase failed)");
    }
  };

  const deleteProfessor = async (id: string) => {
    if (isOfflineMode || id.startsWith("offline_") || id.startsWith("mock_")) {
      // Offline mode or local data - delete locally only
      setProfessors((prev) => prev.filter((prof) => prof.id !== id));
      console.log("✅ Deleted professor in offline mode");
      return;
    }

    try {
      await deleteDoc(doc(db, "professors", id));
      console.log("✅ Deleted professor from Firebase");
    } catch (error) {
      console.error("Error deleting professor:", error);
      // Delete locally as fallback
      setProfessors((prev) => prev.filter((prof) => prof.id !== id));
      console.log("✅ Deleted professor locally (Firebase failed)");
    }
  };

  return {
    professors,
    loading,
    error,
    createProfessor,
    updateProfessor,
    deleteProfessor,
    isOfflineMode,
  };
}
