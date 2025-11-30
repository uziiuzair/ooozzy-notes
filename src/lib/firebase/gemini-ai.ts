import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app } from "@/lib/firebase/config";

// Initialize the Gemini Developer API backend service
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a `GenerativeModel` instance with a model that supports your use case
export const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

/**
 * Usage example:
 * // Wrap in an async function so you can use await
 * async function run() {
 *   // Provide a prompt that contains text
 *   const prompt = "Write a story about a magic backpack."
 *
 *   // To generate text output, call generateContent with the text input
 *   const result = await model.generateContent(prompt);
 *
 *   const response = result.response;
 *   const text = response.text();
 *   console.log(text);
 * }
 *
 * run();
 */
