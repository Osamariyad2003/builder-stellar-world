import { useState, useEffect } from "react";
import { Notification } from "@shared/types";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q;
    
    if (userId) {
      // Get notifications for a specific user
      // Note: Firestore requires a composite index for where + orderBy
      // If index doesn't exist, Firestore will show an error with link to create it
      q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
    } else {
      // Get all notifications (admin view)
      q = query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData: Notification[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notificationsData.push({
            id: doc.id,
            userId: data.userId || "",
            title: data.title || "",
            message: data.message || "",
            type: data.type || "system",
            relatedId: data.relatedId || undefined,
            read: data.read || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            batchId: data.batchId || undefined,
          } as Notification);
        });
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setError(error.message || "Failed to fetch notifications");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const createNotification = async (notificationData: Omit<Notification, "id">) => {
    try {
      const firestoreData: any = {
        ...notificationData,
        createdAt: notificationData.createdAt instanceof Date 
          ? Timestamp.fromDate(notificationData.createdAt) 
          : serverTimestamp(),
      };
      
      // Remove undefined fields
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });
      
      const docRef = await addDoc(collection(db, "notifications"), firestoreData);
      console.log("✅ Notification created successfully with ID:", docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error("❌ Error creating notification:", error);
      throw new Error(`Failed to create notification: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const updateNotification = async (id: string, notificationData: Partial<Notification>) => {
    try {
      const firestoreData: any = { ...notificationData };
      
      if (notificationData.createdAt instanceof Date) {
        firestoreData.createdAt = Timestamp.fromDate(notificationData.createdAt);
      }
      
      // Remove undefined fields
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });
      
      await updateDoc(doc(db, "notifications", id), firestoreData);
    } catch (error: any) {
      console.error("Error updating notification:", error);
      throw new Error(`Failed to update notification: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      throw new Error(`Failed to mark notification as read: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const markAllAsRead = async (userId?: string) => {
    try {
      const q = userId
        ? query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))
        : query(collection(db, "notifications"), where("read", "==", false));
      
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(batch);
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      throw new Error(`Failed to mark all notifications as read: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      throw new Error(`Failed to delete notification: ${error.message || 'Check Firebase permissions'}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    createNotification,
    updateNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
  };
}
