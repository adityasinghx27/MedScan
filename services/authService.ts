import { auth } from "../firebaseConfig.ts";
import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { User } from "../types.ts";

export const loginWithGoogle = async (): Promise<void> => {
  if (!auth) throw new Error("Auth not initialized");
  const provider = new GoogleAuthProvider();
  
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Login redirect failed", error);
    throw error;
  }
};

export const handleRedirectResult = async (): Promise<void> => {
  if (!auth) return;
  try {
    await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect login failed", error);
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
        joinedAt: Date.now() 
      });
    } else {
      callback(null);
    }
  });
};