import { getFirestore } from "firebase/firestore";
import { app } from "./config";

// Initialize Firestore
export const db = getFirestore(app);
