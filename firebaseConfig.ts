import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// ⚠️ Yahan humne seedha API Key likh di hai taaki Vercel par error na aaye
const firebaseConfig = {
  apiKey: "AIzaSyDdFnW3d4kKyauhldopnkyT9j5TL25zM7c",
  authDomain: "gen-lang-client-0861215458.firebaseapp.com",
  projectId: "gen-lang-client-0861215458",
  storageBucket: "gen-lang-client-0861215458.firebasestorage.app",
  messagingSenderId: "1025216173814",
  appId: "1:1025216173814:web:921a9a9ac1c10b16b5fed7",
  measurementId: "G-32RB4YLOMR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let analytics;
isSupported().then(supported => {
  if (supported) analytics = getAnalytics(app);
}).catch(console.error);

export { app, auth, googleProvider, analytics };

