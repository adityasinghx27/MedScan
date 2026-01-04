import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCiAA2DhF7VLNKDBN5dWVl3ko4OqOoEYtw",
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

// Analytics safe init
let analytics;
isSupported().then(supported => {
    if (supported) analytics = getAnalytics(app);
}).catch(console.error);

export { app, auth, googleProvider, analytics };
