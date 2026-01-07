// @ts-nocheck
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
apiKey: "AIzaSyDdFnW3d4kKyauhldopnkyT9j5TL25zM7c",
authDomain: "gen-lang-client-0861215458.firebaseapp.com",
projectId: "gen-lang-client-0861215458",
storageBucket: "gen-lang-client-0861215458.firebasestorage.app",
messagingSenderId: "1025216173814",
appId: "1:1025216173814:web:921a9a9ac1c10b16b5fed7",
measurementId: "G-32RB4YLOMR"
};

// 1. Singleton App Initialization (Crash Proof)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Auth Initialization
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Note: Analytics removed to prevent mobile preview crashes

export { app, auth, googleProvider };