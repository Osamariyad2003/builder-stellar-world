import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import cacheManager from "@/lib/cacheManager";
import {
  isFirebaseInOfflineMode,
  isExtensionBlocking,
  addOfflineModeListener,
} from "@/lib/firebaseMonitor";

export interface BookData {
  id?: string;
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  publishedDate?: string;
  publisher?: string;
  category?: string;
  imageUrl?: string;
  pdfUrl?: string;
  googleDriveUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function useBooks() {
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [retryCount, setRetryCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");

  const activateOfflineMode = () => {
    console.log("🔄 Activating offline mode for books");
    setIsOfflineMode(true);
    setConnectionStatus("offline");
    setLoading(false);
    setError(null);
    setBooks([]);
  };

  useEffect(() => {
    // Listen for offline mode changes triggered by firebaseMonitor
    const unsubscribe = addOfflineModeListener(() => {
      if (isFirebaseInOfflineMode() || isExtensionBlocking()) {
        console.log("📡 Offline mode triggered - updating books hook");
        activateOfflineMode();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check if extension is already blocking
      if (isExtensionBlocking()) {
        console.log("🔴 Extension blocking detected - activating offline mode");
        activateOfflineMode();
        return;
      }

      if (isFirebaseInOfflineMode()) {
        console.log("🔴 Firebase offline mode detected - activating offline mode");
        activateOfflineMode();
        return;
      }

      if (!navigator.onLine) {
        console.log("🚫 No internet connection - activating offline mode");
        activateOfflineMode();
        return;
      }

      setConnectionStatus("connecting");

      const hasCachedBooks = cacheManager.isCacheValid("books");

      if (hasCachedBooks) {
        console.log("📦 Loading books from cache...");
        const cachedBooks = cacheManager.getCache<BookData[]>("books") || [];
        setBooks(cachedBooks);
        setLoading(false);
        setIsOfflineMode(false);
        setConnectionStatus("connected");
        console.log("✅ Loaded from cache - fetching fresh data...");
      } else {
        setLoading(true);
      }

      try {
        console.log("🔄 Attempting Firebase connection for books...");

        const booksCollection = collection(db, "books");
        const q = query(booksCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const seenIds = new Set<string>();
        const booksData: BookData[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (seenIds.has(doc.id)) {
            console.warn("⚠️ Duplicate book ID detected:", doc.id);
            return;
          }
          seenIds.add(doc.id);

          booksData.push({
            id: doc.id,
            title: data.title || "",
            author: data.author || "",
            description: data.description || "",
            isbn: data.isbn || "",
            publishedDate: data.publishedDate || "",
            publisher: data.publisher || "",
            category: data.category || "",
            imageUrl: data.imageUrl || "",
            pdfUrl: data.pdfUrl || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        setBooks(booksData);
        setLoading(false);
        setIsOfflineMode(false);
        setConnectionStatus("connected");
        setError(null);

        cacheManager.setCache("books", booksData);

        console.log("✅ Books loaded from Firebase:", booksData.length);
      } catch (error: any) {
        console.log("❌ Firebase connection failed for books");

        // Check if this is an extension blocking error
        if (isExtensionBlocking()) {
          console.log("Extension detected - activating offline mode");
          activateOfflineMode();
          return;
        }

        if (!cacheManager.isCacheValid("books")) {
          console.log("No cache available - activating offline mode");
          activateOfflineMode();
        } else {
          console.log("Using cached data in offline mode");
          setConnectionStatus("offline");
          setIsOfflineMode(true);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [retryCount]);

  const retryConnection = () => {
    console.log("🔄 Retrying Firebase connection for books...");
    setLoading(true);
    setError(null);
    setIsOfflineMode(false);
    setConnectionStatus("connecting");
    setRetryCount((prev) => prev + 1);
  };

  const createBook = async (bookData: Omit<BookData, "id" | "createdAt">) => {
    clearCache();

    if (isOfflineMode || !navigator.onLine) {
      const newBook: BookData = {
        id: `book_${Date.now()}`,
        ...bookData,
        createdAt: new Date(),
      };

      setBooks((prev) => {
        // Check if book already exists to prevent duplicates
        const bookExists = prev.some((b) => b.id === newBook.id);
        return bookExists ? prev : [newBook, ...prev];
      });
      console.log("✅ Added book to offline mode:", newBook.title);
      return;
    }

    try {
      const booksRef = collection(db, "books");
      const docRef = await addDoc(booksRef, {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description || "",
        isbn: bookData.isbn || "",
        publishedDate: bookData.publishedDate || "",
        publisher: bookData.publisher || "",
        category: bookData.category || "",
        imageUrl: bookData.imageUrl || "",
        pdfUrl: bookData.pdfUrl || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("✅ Book created in Firebase:", docRef.id);
      // Trigger re-fetch to get the complete and consistent list from Firebase
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating book:", error);
      setIsOfflineMode(true);
      await createBook(bookData);
    }
  };

  const updateBook = async (bookId: string, patch: Partial<BookData>) => {
    if (!bookId) return;

    clearCache();

    if (isOfflineMode || !navigator.onLine) {
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, ...patch } : b)),
      );
      return;
    }

    try {
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, {
        ...patch,
        updatedAt: new Date(),
      });

      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, ...patch } : b)),
      );

      console.log("✅ Book updated in Firebase:", bookId);
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating book:", error);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, ...patch } : b)),
      );
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!bookId) return;

    clearCache();

    const prevBooks = books;

    setBooks((prev) => prev.filter((b) => b.id !== bookId));

    if (isOfflineMode || !navigator.onLine) {
      console.log("✅ Removed book in offline mode:", bookId);
      return;
    }

    try {
      const bookRef = doc(db, "books", bookId);
      await deleteDoc(bookRef);
      console.log("✅ Book deleted from Firebase:", bookId);
      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting book:", error);
      setBooks(prevBooks);
      throw error;
    }
  };

  const clearCache = () => {
    console.log("🗑️ Clearing Books cache...");
    cacheManager.clearCache("books");
  };

  return {
    books,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    retryConnection,
    clearCache,
    createBook,
    updateBook,
    deleteBook,
  };
}
