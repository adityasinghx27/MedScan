
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

// 🛡️ RAMBAAN FIX FOR AI STUDIO PREVIEW
// Hum App aur Auth ko 'window' (global memory) me save karenge.
// Isse Hot-Reload hone par bhi app crash nahi hoga.

let app;
let auth;
const win = typeof window !== "undefined" ? (window as any) : undefined;

if (win && win.firebaseApp) {
  // Agar pehle se memory me hai, to wahi use karo
  app = win.firebaseApp;
} else {
  // Nahi to naya banao aur memory me save kar lo
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  if (win) win.firebaseApp = app;
}

if (win && win.firebaseAuth) {
  auth = win.firebaseAuth;
} else {
  auth = getAuth(app);
  if (win) win.firebaseAuth = auth;
}

const googleProvider = new GoogleAuthProvider();

// Analytics safe init
let analytics;
isSupported().then(supported => {
  if (supported) analytics = getAnalytics(app);
}).catch(() => {});

export { app, auth, googleProvider, analytics };
