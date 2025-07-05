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

// Mock data for development
const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Revolutionary Gene Therapy Shows Promise in Cancer Treatment",
    content:
      "Recent studies demonstrate significant progress in targeted gene therapy for various cancer types. This breakthrough research could change how we approach oncological treatments in the future.",
    authorName: "Dr. Sarah Johnson",
    authorId: "user1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    tags: ["oncology", "gene-therapy", "research"],
    isPinned: true,
    viewsCount: 1247,
    attachments: [],
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
  },
  {
    id: "2",
    title: "Medical Education Technology Trends for 2024",
    content:
      "Exploring the latest innovations in medical education platforms, including VR simulations, AI-powered learning, and interactive case studies that are transforming how medical students learn.",
    authorName: "Prof. Michael Chen",
    authorId: "user2",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
    tags: ["education", "technology", "trends"],
    isPinned: false,
    viewsCount: 892,
    attachments: [],
    imageUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop",
  },
  {
    id: "3",
    title: "New Guidelines for Emergency Medicine Protocols",
    content:
      "Updated protocols for emergency medical procedures and best practices have been released. These guidelines incorporate the latest research and improve patient care outcomes.",
    authorName: "Dr. Emily Rodriguez",
    authorId: "user3",
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
    tags: ["emergency", "protocols", "guidelines"],
    isPinned: false,
    viewsCount: 654,
    attachments: ["protocol-guide.pdf"],
    imageUrl:
      "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=300&h=200&fit=crop",
  },
];

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const newsData: NewsItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newsData.push({
            id: doc.id,
            title: data.title || "",
            content: data.content || "",
            imageUrl: data.imageUrl || "",
            videoUrl: data.videoUrl || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            authorName: data.authorName || "",
            authorId: data.newsId || doc.id,
            tags: data.tags || [],
            isPinned: data.isPinned || false,
            viewsCount: data.viewsCount || 0,
            attachments: data.attachments || [],
          } as NewsItem);
        });
        setNews(newsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching news:", error);
        // Fallback to mock data when Firebase fails
        console.log("Using mock data for news");
        setNews(mockNews);
        setError(null); // Clear error when using mock data
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
