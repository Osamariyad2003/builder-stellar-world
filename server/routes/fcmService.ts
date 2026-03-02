import { getFirestore, doc, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin (in production, use FIREBASE_SERVICE_ACCOUNT env var)
// For development, this will use the default credentials
let adminApp: any = null;

function initializeAdmin() {
  try {
    if (!adminApp) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT not set, FCM notifications may not work");
      }
    }
    return adminApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    return null;
  }
}

// Save FCM token for a user
export async function saveFCMToken(userId: string, token: string) {
  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      lastTokenUpdate: new Date(),
    });

    console.log("FCM token saved for user:", userId);
    return { success: true, message: "FCM token saved" };
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return { success: false, error: String(error) };
  }
}

// Send notification to users in a batch
export async function sendNotificationToBatch(
  batchId: string,
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  try {
    const admin = initializeAdmin();
    if (!admin) {
      throw new Error("Firebase Admin not initialized");
    }

    const messaging = getMessaging(admin);
    const db = getFirestore();

    // Find all users in this batch
    const usersQuery = query(
      collection(db, "users"),
      where("batchId", "==", batchId)
    );

    const usersSnapshot = await getDocs(usersQuery);
    const fcmTokens: string[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        fcmTokens.push(...userData.fcmTokens);
      }
    });

    if (fcmTokens.length === 0) {
      console.warn("No FCM tokens found for batch:", batchId);
      return { success: true, message: "No users with FCM tokens in batch" };
    }

    // Send notifications in batches (max 500 tokens per request)
    const results: any[] = [];
    for (let i = 0; i < fcmTokens.length; i += 500) {
      const batch = fcmTokens.slice(i, i + 500);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: data || {},
        tokens: batch,
      };

      try {
        const response = await messaging.sendMulticast(message);
        results.push({
          success: response.successCount,
          failed: response.failureCount,
        });

        // Clean up failed tokens
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(batch[idx]);
          }
        });

        // Remove invalid tokens from Firestore
        if (failedTokens.length > 0) {
          await removeInvalidTokens(failedTokens);
        }
      } catch (error) {
        console.error("Error sending batch notification:", error);
        results.push({ error: String(error) });
      }
    }

    return {
      success: true,
      message: "Notifications sent",
      results,
    };
  } catch (error) {
    console.error("Error sending notification to batch:", error);
    return { success: false, error: String(error) };
  }
}

// Send notification to specific users
export async function sendNotificationToUsers(
  userIds: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  try {
    const admin = initializeAdmin();
    if (!admin) {
      throw new Error("Firebase Admin not initialized");
    }

    const messaging = getMessaging(admin);
    const db = getFirestore();

    // Get FCM tokens for all users
    const fcmTokens: string[] = [];
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          fcmTokens.push(...userData.fcmTokens);
        }
      }
    }

    if (fcmTokens.length === 0) {
      return { success: true, message: "No users with FCM tokens" };
    }

    // Send notifications in batches (max 500 tokens per request)
    const results: any[] = [];
    for (let i = 0; i < fcmTokens.length; i += 500) {
      const batch = fcmTokens.slice(i, i + 500);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: data || {},
        tokens: batch,
      };

      try {
        const response = await messaging.sendMulticast(message);
        results.push({
          success: response.successCount,
          failed: response.failureCount,
        });

        // Clean up failed tokens
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(batch[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await removeInvalidTokens(failedTokens);
        }
      } catch (error) {
        console.error("Error sending notifications:", error);
        results.push({ error: String(error) });
      }
    }

    return {
      success: true,
      message: "Notifications sent to users",
      results,
    };
  } catch (error) {
    console.error("Error sending notifications to users:", error);
    return { success: false, error: String(error) };
  }
}

// Remove invalid FCM tokens
async function removeInvalidTokens(tokens: string[]) {
  try {
    const db = getFirestore();
    const batch = writeBatch(db);

    // This is a simplified approach; in production, you'd want to track which tokens belong to which users
    console.log("Removing invalid tokens:", tokens.length);
    // Implementation would remove tokens from users collection
  } catch (error) {
    console.error("Error removing invalid tokens:", error);
  }
}
