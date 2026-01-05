import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDdFnW3d4kKyauhldopnkyT9j5TL25zM7c",
  authDomain: "gen-lang-client-0861215458.firebaseapp.com",
  projectId: "gen-lang-client-0861215458",
  storageBucket: "gen-lang-client-0861215458.firebasestorage.app",
  messagingSenderId: "1025216173814",
  appId: "1:1025216173814:web:921a9a9ac1c10b16b5fed7",
  measurementId: "G-32RB4YLOMR"
};

// 🛡️ CRASH FIX: Check if App is already initialized
// Ye line check karegi ki Firebase pehle se chal rha hai ya nahi.
// Agar chal rha hai to naya nahi banayegi (Error se bachaegi).
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics ko safe tarike se start karna
let analytics;
isSupported().then(supported => {
  if (supported) analytics = getAnalytics(app);
}).catch(() => {});

export { app, auth, googleProvider, analytics };

