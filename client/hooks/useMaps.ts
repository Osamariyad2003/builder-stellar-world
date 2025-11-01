import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MapItem {
  id: string;
  name: string;
  location: string;
  description?: string;
  type?: string;
  video_url?: string;
  createdAt?: Date;
}

export function useMaps() {
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "maps"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: MapItem[] = [];
        snap.forEach((d) => {
          const v = d.data() as any;
          data.push({
            id: d.id,
            name: v.name || "",
            location: v.location || "",
            description: v.description || v.desc || "",
            type: v.type || v.mapType || "",
            video_url: v.video_url || v.videoUrl || "",
            createdAt: v.createdAt?.toDate?.() || undefined,
          });
        });
        setMaps(data);
        setLoading(false);
      },
      (e) => {
        console.error("Failed to load maps:", e);
        setError("Failed to load maps");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const createMap = async (item: Omit<MapItem, "id" | "createdAt">) => {
    // Normalize type/mapType for existing and new consumers
    const payload: any = { ...item, createdAt: new Date() };
    if (payload.type && !payload.mapType) payload.mapType = payload.type;
    if (payload.mapType && !payload.type) payload.type = payload.mapType;
    // Trim whitespace from string fields
    ["name", "location", "description", "video_url", "type", "mapType"].forEach((k) => {
      if (typeof payload[k] === "string") payload[k] = payload[k].trim();
    });

    await addDoc(collection(db, "maps"), payload);
  };
  const updateMap = async (id: string, item: Partial<MapItem>) => {
    // Ensure both type keys are kept in sync when updating
    const payload: any = { ...item };
    if (payload.type && !payload.mapType) payload.mapType = payload.type;
    if (payload.mapType && !payload.type) payload.type = payload.mapType;
    ["name", "location", "description", "video_url", "type", "mapType"].forEach((k) => {
      if (typeof payload[k] === "string") payload[k] = payload[k].trim();
    });

    await updateDoc(doc(db, "maps", id), payload);
  };
  const deleteMap = async (id: string) => {
    await deleteDoc(doc(db, "maps", id));
  };

  return { maps, loading, error, createMap, updateMap, deleteMap };
}
