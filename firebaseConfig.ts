import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCiAA2DhF7VLNKDBN5dWVl3ko4OqOoEYtw",
  authDomain: "gen-lang-client-0861215458.firebaseapp.com",
  projectId: "gen-lang-client-0861215458",
  storageBucket: "gen-lang-client-0861215458.firebasestorage.app",
  appId: "1:1025216173814:web:921a9a9ac1c10b16b5fed7"
};

// Initialize Firebase only once
let app;
let analytics;
let auth;

try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Initialize Auth
    auth = getAuth(app);

    // Initialize Analytics conditionally
    // isSupported() is async, so analytics export might be undefined initially
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    }).catch((err) => {
        console.warn("Firebase Analytics not supported in this environment:", err);
    });

} catch (error) {
    console.warn("Firebase initialization failed", error);
}

export { analytics, auth };
export default app;