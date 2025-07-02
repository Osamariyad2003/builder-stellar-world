import { useState, useEffect } from "react";
import { NewsItem } from "@shared/types";
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

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const newsData: NewsItem[] = [];
        querySnapshot.forEach((doc) => {
          newsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as NewsItem);
        });
        setNews(newsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching news:", error);
        setError("Failed to fetch news");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const createNews = async (newsData: Omit<NewsItem, "id">) => {
    try {
      await addDoc(collection(db, "news"), newsData);
    } catch (error) {
      console.error("Error creating news:", error);
      throw error;
    }
  };

  const updateNews = async (id: string, newsData: Partial<NewsItem>) => {
    try {
      await updateDoc(doc(db, "news", id), newsData);
    } catch (error) {
      console.error("Error updating news:", error);
      throw error;
    }
  };

  const deleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, "news", id));
    } catch (error) {
      console.error("Error deleting news:", error);
      throw error;
    }
  };

  return {
    news,
    loading,
    error,
    createNews,
    updateNews,
    deleteNews,
  };
}
