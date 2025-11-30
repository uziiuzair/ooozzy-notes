// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAfKaCi2rmcBOqk5F88I3SiTFxFQCUodBY",
  authDomain: "ooozzy-notes.firebaseapp.com",
  projectId: "ooozzy-notes",
  storageBucket: "ooozzy-notes.firebasestorage.app",
  messagingSenderId: "29814259360",
  appId: "1:29814259360:web:fd8f0c073b3548429613c5",
  measurementId: "G-LDKZVXVTPJ",
};

// Initialize Firebase (only once)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only on client-side (browser)
export let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
