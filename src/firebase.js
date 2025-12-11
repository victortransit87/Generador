// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// TODO: Replace with user's actual configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Add scopes for Gemini API access
googleProvider.addScope('https://www.googleapis.com/auth/generative-language.retriever'); // Example scope
googleProvider.addScope('https://www.googleapis.com/auth/generative-language.tuning'); // Broader access
// The most common scope for calling models might just be cloud-platform if using Vertex, 
// but for Personal API key replacement, we try generic scopes. 
// Actually, 'https://www.googleapis.com/auth/generativelanguage' is the key one.
googleProvider.addScope('https://www.googleapis.com/auth/generative-language');
