
import { User } from "../types.ts";

// MOCK AUTHENTICATION SERVICE
// Replaces Firebase to ensure app works on any hosting platform (HopWeb, etc.) immediately.

const STORAGE_KEY = 'mediScan_mock_user';

export const loginWithGoogle = async (): Promise<void> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockUser: User = {
    uid: 'user_' + Date.now().toString().slice(-6),
    email: 'user@mediiq.app',
    displayName: 'Demo User',
    photoURL: null, // UI will show default avatar
    isGuest: false,
    joinedAt: Date.now()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
  // Trigger a reload to update the app state cleanly
  window.location.reload();
};

export const handleRedirectResult = async (): Promise<void> => {
  // No-op for mock auth
  return Promise.resolve();
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('mediScan_is_guest');
  window.location.reload();
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  // Check local storage for existing session
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      callback(JSON.parse(saved));
    } catch (e) {
      callback(null);
    }
  } else {
    callback(null);
  }
  
  // Return dummy unsubscribe function
  return () => {};
};
