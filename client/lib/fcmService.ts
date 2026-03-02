import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import app from "./firebase";

let messaging: Messaging | null = null;

// Register service worker for background notifications
export async function registerServiceWorker() {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );
      console.log("Service Worker registered:", registration);
      return registration;
    }
  } catch (error) {
    console.error("Error registering Service Worker:", error);
  }
}

// Initialize Firebase Messaging
export function initializeMessaging(): Messaging | null {
  try {
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error("Firebase Messaging not supported:", error);
    return null;
  }
}

// Request notification permission and get FCM token
export async function getFCMToken(): Promise<string | null> {
  try {
    const msg = initializeMessaging();
    if (!msg) {
      console.warn("Firebase Messaging not available");
      return null;
    }

    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.warn("Notifications not supported in this browser");
      return null;
    }

    // Request permission if not already granted
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied");
        return null;
      }
    } else if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    // Get the FCM token
    const token = await getToken(msg, {
      vapidKey: "BP_Tqy8mU-KmJgNfIyKHSMU7YrPdLzn5VQzNvX1FvTkpF5S8rqLy1HvOQ1z7C3L5Q5Q5Q5Q",
    });

    if (token) {
      console.log("FCM Token obtained:", token);
      return token;
    } else {
      console.warn("Failed to get FCM token");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

// Listen for incoming messages (foreground)
export function setupMessageListener(callback: (payload: any) => void) {
  try {
    const msg = initializeMessaging();
    if (!msg) return;

    onMessage(msg, (payload) => {
      console.log("Message received in foreground:", payload);
      callback(payload);

      // Display notification if in foreground
      if (payload.notification) {
        new Notification(payload.notification.title || "New Notification", {
          body: payload.notification.body || "",
          icon: payload.notification.icon || "/logo.png",
          badge: payload.notification.badge || "/logo.png",
          data: payload.data || {},
        });
      }
    });
  } catch (error) {
    console.error("Error setting up message listener:", error);
  }
}

// Save FCM token to Firestore for a user
export async function saveFCMTokenToUser(userId: string, token: string) {
  try {
    const response = await fetch("/api/save-fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token }),
    });

    if (!response.ok) {
      console.error("Failed to save FCM token");
      return false;
    }

    console.log("FCM token saved for user:", userId);
    return true;
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return false;
  }
}

// Send notification to users in a batch
export async function sendNotificationToBatch(
  batchId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const response = await fetch("/api/send-batch-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId,
        notification: {
          title,
          body,
        },
        data: data || {},
      }),
    });

    if (!response.ok) {
      console.error("Failed to send batch notification");
      return false;
    }

    const result = await response.json();
    console.log("Notification sent to batch:", result);
    return true;
  } catch (error) {
    console.error("Error sending batch notification:", error);
    return false;
  }
}

// Send notification to specific users
export async function sendNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const response = await fetch("/api/send-user-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds,
        notification: {
          title,
          body,
        },
        data: data || {},
      }),
    });

    if (!response.ok) {
      console.error("Failed to send user notifications");
      return false;
    }

    const result = await response.json();
    console.log("Notifications sent to users:", result);
    return true;
  } catch (error) {
    console.error("Error sending user notifications:", error);
    return false;
  }
}
