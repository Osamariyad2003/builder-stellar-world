import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// MedJust Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUR89i6kvh3bp51GCgBX0fTwh3bFt1Ksg",
  authDomain: "medjust-d26eb.firebaseapp.com",
  projectId: "medjust-d26eb",
  storageBucket: "medjust-d26eb.appspot.com",
  messagingSenderId: "631362355665",
  appId: "1:631362355665:web:4d7f8eadba1bca0969e0f0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging (only in browser)
export let messaging: Messaging | null = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging initialization failed:", error);
  }
}

export default app;
