import { getToken, onMessage, Messaging } from "firebase/messaging";
import { messaging } from "./firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

// VAPID key - Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Generate a key pair if you don't have one, then paste the public key here
// For now, using a placeholder. You need to replace this with your actual VAPID key
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY_HERE";

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn("Firebase Messaging is not available");
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted");
      
      // Get FCM token
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        console.log("FCM Token:", token);
        
        // Save token to Firestore for current user
        const currentUser = auth.currentUser;
        if (currentUser) {
          await saveFCMToken(currentUser.uid, token);
        }
        
        return token;
      } else {
        console.warn("No FCM token available");
        return null;
      }
    } else {
      console.warn("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

/**
 * Save FCM token to Firestore
 */
async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, "fcmTokens", userId);
    await setDoc(tokenRef, {
      token,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    console.log("✅ FCM token saved for user:", userId);
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
}

/**
 * Get FCM token for a user
 */
export async function getFCMTokenForUser(userId: string): Promise<string | null> {
  try {
    const tokenRef = doc(db, "fcmTokens", userId);
    const tokenDoc = await getDoc(tokenRef);
    
    if (tokenDoc.exists()) {
      return tokenDoc.data().token || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Get all FCM tokens for multiple users
 */
export async function getFCMTokensForUsers(userIds: string[]): Promise<Map<string, string>> {
  const tokens = new Map<string, string>();
  
  try {
    // Get tokens in batches (Firestore 'in' query limit is 10)
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const tokensRef = collection(db, "fcmTokens");
      const q = query(tokensRef, where("userId", "in", batch));
      const snapshot = await getDocs(q);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.token && data.userId) {
          tokens.set(data.userId, data.token);
        }
      });
    }
  } catch (error) {
    console.error("Error getting FCM tokens:", error);
  }
  
  return tokens;
}

/**
 * Listen for foreground messages (when app is open)
 */
export function setupForegroundMessageListener(
  callback: (payload: any) => void
): () => void {
  if (!messaging) {
    console.warn("Firebase Messaging is not available");
    return () => {};
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      callback(payload);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up message listener:", error);
    return () => {};
  }
}

/**
 * Send push notification
 * Uses browser Notification API for foreground notifications
 * FCM will handle background notifications via service worker
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // For now, we'll use the browser Notification API
    // In production, you should use Firebase Admin SDK on the server
    // to send notifications via FCM tokens
    
    // Check if browser supports notifications
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        // Show browser notification
        const notification = new Notification(title, {
          body,
          icon: "/icon-192x192.png", // Add your app icon
          badge: "/icon-192x192.png",
          tag: data?.newsId || "notification",
          data: data || {},
          requireInteraction: false,
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          if (data?.newsId) {
            window.location.href = `/admin/news`;
          }
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      } else if (Notification.permission === "default") {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          await sendPushNotification(token, title, body, data);
        }
      }
    }

    // Note: For background notifications (when app is closed),
    // you need to implement a server endpoint using Firebase Admin SDK
    // that sends notifications via FCM tokens
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Initialize push notifications for the current user
 */
export async function initializePushNotifications(): Promise<void> {
  // Check if browser supports notifications
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return;
  }

  // Check if service worker is supported
  if (!("serviceWorker" in navigator)) {
    console.warn("This browser does not support service workers");
    return;
  }

  // Register service worker for background notifications
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("Service Worker registered:", registration);
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }

  // Request permission and get token
  await requestNotificationPermission();
}
