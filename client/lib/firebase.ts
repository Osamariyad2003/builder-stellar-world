import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Demo Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBvOKTyftlO-HFketkRAR4lOIreSqC6qgM",
  authDomain: "medjust-demo.firebaseapp.com",
  projectId: "medjust-demo",
  storageBucket: "medjust-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
