import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDe0N_wOr6GgMRkcfFy1Sxbm7WDsQKFcHc",
  authDomain: "medscanindia.firebaseapp.com",
  projectId: "medscanindia",
  storageBucket: "medscanindia.firebasestorage.app",
  messagingSenderId: "732032195788",
  appId: "1:732032195788:web:23105b2d88d74d597fb669",
  measurementId: "G-0H8L4S3C2M"
};

// Initialize Firebase only once
let app;
let analytics;

try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    // Initialize services
    analytics = getAnalytics(app);
} catch (error) {
    console.warn("Firebase initialization failed", error);
}

export { analytics };
export default app;