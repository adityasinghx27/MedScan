import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
// This side-effect import is crucial to prevent a race condition.
import "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdFnW3d4kKyauhldopnkyT9j5TL25zM7c",
  authDomain: "gen-lang-client-0861215458.firebaseapp.com",
  projectId: "gen-lang-client-0861215458",
  storageBucket: "gen-lang-client-0861215458.firebasestorage.app",
  messagingSenderId: "1025216173814",
  appId: "1:1025216173814:web:921a9a9ac1c10b16b5fed7",
  measurementId: "G-32RB4YLOMR"
};

// 1. Initialize App
const app = initializeApp(firebaseConfig);
const googleProvider = new GoogleAuthProvider();

// 2. LAZY INITIALIZATION PATTERN
// This robustly prevents race conditions by initializing auth only when first requested.
let authInstance: Auth | null = null;
const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
};

// 3. Initialize Analytics (Optional/Safe)
let analytics;
isSupported().then(supported => {
  if (supported) analytics = getAnalytics(app);
}).catch(e => console.log('Analytics not supported'));

export { app, getFirebaseAuth, googleProvider, analytics };