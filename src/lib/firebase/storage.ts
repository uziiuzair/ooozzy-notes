import { getStorage } from "firebase/storage";
import { app } from "./config";

// Initialize Firebase Storage
export const storage = getStorage(app);
