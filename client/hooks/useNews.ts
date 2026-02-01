import { useState, useEffect } from "react";
import { NewsItem, Notification } from "@shared/types";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  collectionGroup,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFCMTokensForUsers, sendPushNotification } from "@/lib/pushNotifications";
import { useYears } from "@/hooks/useYears";

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

/**
 * Helper to send notifications to all users in a batch (by batchId).
 */
async function sendNotificationsForBatchByBatchId(
  newsId: string,
  newsTitle: string,
  batchId: string,
): Promise<void> {
  try {
    const yearsSnapshot = await getDocs(collectionGroup(db, "years"));
    const allYears: string[] = [];
    yearsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const yearBatchId = data.batchId || data.batch_id;
      if (yearBatchId === batchId) {
        allYears.push(docSnap.id);
      }
    });
    try {
      const yearsQuery = query(collection(db, "years"), where("batchId", "==", batchId));
      const directYearsSnap = await getDocs(yearsQuery);
      directYearsSnap.forEach((docSnap) => {
        if (!allYears.includes(docSnap.id)) allYears.push(docSnap.id);
      });
    } catch (_) {}
    if (allYears.length === 0) {
      console.log("⚠️ No years found for batch:", batchId);
      return;
    }
    const usersSnapshot = await getDocs(collection(db, "users"));
    const targetUserIds: string[] = [];
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userYearId = userData.yearId || userData.year || userData.year_id;
      let actualYearId = userYearId;
      if (typeof userYearId === "string" && userYearId.includes(":")) {
        actualYearId = userYearId.split(":")[0];
      }
      if (actualYearId && allYears.includes(actualYearId)) {
        targetUserIds.push(userDoc.id);
      }
    });
    if (targetUserIds.length === 0) {
      console.log("⚠️ No users found for batch:", batchId);
      return;
    }
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");
    targetUserIds.forEach((userId) => {
      const notificationRef = doc(notificationsRef);
      batch.set(notificationRef, {
        userId,
        title: "New News Article",
        message: newsTitle,
        type: "news",
        relatedId: newsId,
        read: false,
        createdAt: Timestamp.fromDate(new Date()),
        batchId,
      });
    });
    await batch.commit();
    try {
      const fcmTokens = await getFCMTokensForUsers(targetUserIds);
      Array.from(fcmTokens.entries()).forEach(([userId, token]) => {
        sendPushNotification(token, "New News Article", newsTitle, { newsId }).catch(() => {});
      });
    } catch (_) {}
  } catch (err) {
    console.error("Send notifications by batchId failed:", err);
  }
}

/**
 * Helper function to send notifications to users based on batchId
 * When news is created with a yearId, this finds all users in the same batch
 */
async function sendNotificationsForBatch(
  newsId: string,
  newsTitle: string,
  yearId: string | undefined,
): Promise<void> {
  if (!yearId) {
    console.log("⚠️ No yearId provided, skipping notifications");
    return;
  }

  try {
    let batchId: string | null = null;
    const yearsSnapshot = await getDocs(collectionGroup(db, "years"));
    let targetYear: any = null;
    yearsSnapshot.forEach((docSnap) => {
      if (docSnap.id === yearId) {
        targetYear = { id: docSnap.id, ...docSnap.data() };
        batchId = targetYear.batchId || targetYear.batch_id || null;
      }
    });
    if (!targetYear) {
      try {
        const yearDoc = await getDoc(doc(db, "years", yearId));
        if (yearDoc.exists()) {
          targetYear = { id: yearDoc.id, ...yearDoc.data() };
          batchId = targetYear.batchId || targetYear.batch_id || null;
        }
      } catch (e) {
        console.warn("Could not fetch year directly:", e);
      }
    }
    if (!batchId) {
      console.log("⚠️ Could not find batchId for yearId:", yearId);
      return;
    }

    // Step 2: Find all years with this batchId
    const yearsSnapshot2 = await getDocs(collectionGroup(db, "years"));
    const allYears: string[] = [yearId];
    yearsSnapshot2.forEach((docSnap) => {
      const data = docSnap.data();
      const yearBatchId = data.batchId || data.batch_id;
      if (yearBatchId === batchId && docSnap.id !== yearId) {
        allYears.push(docSnap.id);
      }
    });

    // Also check direct years collection if needed
    try {
      const yearsQuery = query(collection(db, "years"), where("batchId", "==", batchId));
      const directYearsSnap = await getDocs(yearsQuery);
      directYearsSnap.forEach((doc) => {
        if (!allYears.includes(doc.id)) {
          allYears.push(doc.id);
        }
      });
    } catch (e) {
      // Ignore if collection doesn't exist
    }

    console.log(`📋 Found ${allYears.length} years in batch ${batchId}:`, allYears);

    // Step 3: Find all users with yearId matching any of these years
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    
    const targetUserIds: string[] = [];
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userYearId = userData.yearId || userData.year || userData.year_id;
      
      // Support inline format like "<docId>:Year Two"
      let actualYearId = userYearId;
      if (typeof userYearId === "string" && userYearId.includes(":")) {
        actualYearId = userYearId.split(":")[0];
      }
      
      if (actualYearId && allYears.includes(actualYearId)) {
        targetUserIds.push(userDoc.id);
      }
    });

    console.log(`👥 Found ${targetUserIds.length} users to notify in batch ${batchId}`);

    // Step 4: Create notifications for all target users
    if (targetUserIds.length === 0) {
      console.log("⚠️ No users found for this batch, skipping notifications");
      return;
    }

    // Use batch writes for efficiency
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");

    // Create notification for each user
    targetUserIds.forEach((userId) => {
      const notificationRef = doc(notificationsRef);
      const userNotification: Omit<Notification, "id"> = {
        userId,
        title: "New News Article",
        message: newsTitle,
        type: "news",
        relatedId: newsId,
        read: false,
        createdAt: new Date(),
        ...(batchId ? { batchId } : {}),
      };
      
      // Convert Date to Timestamp for Firestore
      const firestoreNotification = {
        ...userNotification,
        createdAt: Timestamp.fromDate(userNotification.createdAt),
      };
      
      batch.set(notificationRef, firestoreNotification);
    });

    await batch.commit();
    console.log(`✅ Created ${targetUserIds.length} notifications for batch ${batchId}`);

    // Step 5: Send push notifications to users with FCM tokens
    // Note: This sends browser notifications. For background notifications,
    // you need to implement a server endpoint with Firebase Admin SDK
    try {
      const fcmTokens = await getFCMTokensForUsers(targetUserIds);
      console.log(`📱 Found ${fcmTokens.size} FCM tokens for push notifications`);
      
      if (fcmTokens.size > 0) {
        // Send push notification to each user with a token
        // Using Promise.allSettled to ensure all notifications are attempted
        const pushPromises = Array.from(fcmTokens.entries()).map(([userId, token]) => {
          return sendPushNotification(
            token,
            "New News Article",
            newsTitle,
            {
              newsId: newsId,
              type: "news",
              batchId: batchId || "",
            }
          ).catch((err) => {
            console.error(`Failed to send push to user ${userId}:`, err);
          });
        });
        
        await Promise.allSettled(pushPromises);
        console.log(`✅ Attempted to send ${fcmTokens.size} push notifications`);
      } else {
        console.log("ℹ️ No FCM tokens found. Users need to enable notifications first.");
      }
    } catch (pushError: any) {
      console.error("❌ Error sending push notifications:", pushError);
      // Don't throw - push notifications are non-critical
    }
  } catch (error: any) {
    console.error("❌ Error sending notifications:", error);
    // Don't throw - notifications are non-critical
  }
}

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { batches, years } = useYears();

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
            yearId: data.yearId || "",
            yearNumber: data.yearNumber || undefined,
            batchId: data.batchId || "",
          } as NewsItem);
        });
        console.log(`✅ Successfully loaded ${newsData.length} news articles from Firebase`);
        setNews(newsData);
        setLoading(false);
      },
    (error) => {
      console.error("Error fetching news:", error);
      setError(error.message || "Failed to fetch news from Firebase");
      setLoading(false);
      // If you want to use mock data as fallback, uncomment below:
      // setNews(mockNews);
      // setError(null);
    },
    );

    return () => unsubscribe();
  }, []);

  const createNews = async (newsData: Omit<NewsItem, "id">) => {
    try {
      console.log("📝 Creating news article:", newsData.title);
      // Convert Date objects to Firestore Timestamps
      const firestoreData: any = {
        ...newsData,
        createdAt: newsData.createdAt instanceof Date 
          ? Timestamp.fromDate(newsData.createdAt) 
          : serverTimestamp(),
        updatedAt: newsData.updatedAt instanceof Date 
          ? Timestamp.fromDate(newsData.updatedAt) 
          : serverTimestamp(),
      };
      
      // Remove undefined fields (Firebase doesn't accept undefined values)
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });
      
      const docRef = await addDoc(collection(db, "news"), firestoreData);
      console.log("✅ News article created successfully with ID:", docRef.id);
      
      // Send notifications to users in the same batch
      if (newsData.batchId) {
        sendNotificationsForBatchByBatchId(docRef.id, newsData.title, newsData.batchId).catch((err) => {
          console.error("Failed to send notifications (non-critical):", err);
        });
      } else if (newsData.yearId) {
        sendNotificationsForBatch(docRef.id, newsData.title, newsData.yearId).catch((err) => {
          console.error("Failed to send notifications (non-critical):", err);
        });
      }
    } catch (error: any) {
      console.error("❌ Error creating news:", error);
      console.error("Error details:", error.code, error.message);
      throw new Error(`Failed to create news article: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const updateNews = async (id: string, newsData: Partial<NewsItem>) => {
    try {
      // Convert Date objects to Firestore Timestamps
      const firestoreData: any = { ...newsData };
      
      if (newsData.createdAt instanceof Date) {
        firestoreData.createdAt = Timestamp.fromDate(newsData.createdAt);
      }
      if (newsData.updatedAt instanceof Date) {
        firestoreData.updatedAt = Timestamp.fromDate(newsData.updatedAt);
      }
      
      // Remove undefined fields (Firebase doesn't accept undefined values)
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });
      
      await updateDoc(doc(db, "news", id), firestoreData);
    } catch (error: any) {
      console.error("Error updating news:", error);
      console.error("Error details:", error.code, error.message);
      throw new Error(`Failed to update news article: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const deleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, "news", id));
    } catch (error: any) {
      console.error("Error deleting news:", error);
      console.error("Error details:", error.code, error.message);
      throw new Error(`Failed to delete news article: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  return {
    news,
    loading,
    error,
    createNews,
    updateNews,
    deleteNews,
    batches,
    years,
  };
}
