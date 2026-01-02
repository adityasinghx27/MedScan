import { auth } from "../firebaseConfig.ts";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { User } from "../types.ts";

export const loginWithGoogle = async (): Promise<User> => {
  if (!auth) throw new Error("Auth not initialized");
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isGuest: false,
      joinedAt: Date.now()
    };
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isGuest: false,
        joinedAt: Date.now() // Ideally fetch from DB, simplified for now
      });
    } else {
      callback(null);
    }
  });
};