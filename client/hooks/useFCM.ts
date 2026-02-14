import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  initializeMessaging,
  getFCMToken,
  setupMessageListener,
  saveFCMTokenToUser,
  registerServiceWorker,
} from "@/lib/fcmService";

export function useFCM() {
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Register service worker for background notifications
        await registerServiceWorker();

        // Initialize Firebase Messaging
        const messaging = initializeMessaging();
        if (!messaging) {
          console.log("Firebase Messaging not available");
          return;
        }

        // Get current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("User not authenticated");
          return;
        }

        // Request permission and get FCM token
        const token = await getFCMToken();
        if (!token) {
          console.log("Could not get FCM token");
          return;
        }

        // Save token to Firestore for this user
        await saveFCMTokenToUser(currentUser.uid, token);

        // Set up listener for incoming messages
        setupMessageListener((payload) => {
          console.log("Message received:", payload);
          // Handle notification in foreground
          if (payload.data?.newsId) {
            // Optionally navigate to news detail or refresh
            window.dispatchEvent(
              new CustomEvent("notification-received", {
                detail: payload.data,
              })
            );
          }
        });

        console.log("FCM initialized successfully");
      } catch (error) {
        console.error("Error initializing FCM:", error);
      }
    };

    initializeFCM();
  }, []);
}
