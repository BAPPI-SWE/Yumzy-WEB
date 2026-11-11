import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// ─── Return-after-login ──────────────────────────────────────────
// Guests can browse without logging in. When they open a page that needs
// login (checkout, orders, account), that page is remembered here, and the
// login pages send them back to it afterwards instead of to /home.
const RETURN_PATH_KEY = 'foodishReturnTo';

const isSafePath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') &&
  !path.startsWith('/auth') && !path.startsWith('/email-sign') && !path.startsWith('/details');

export function saveReturnPath(path) {
  try {
    if (isSafePath(path)) sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch (e) { /* storage blocked: the user just lands on /home */ }
}

// Reads the remembered page without forgetting it.
export function peekReturnPath() {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    return isSafePath(path) ? path : null;
  } catch (e) {
    return null;
  }
}

// Reads the remembered page and forgets it. Falls back to /home.
export function takeReturnPath(fallback = '/home') {
  const path = peekReturnPath();
  try { sessionStorage.removeItem(RETURN_PATH_KEY); } catch (e) { /* ignore */ }
  return path || fallback;
}

export function clearReturnPath() {
  try { sessionStorage.removeItem(RETURN_PATH_KEY); } catch (e) { /* ignore */ }
}

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener fires when the user logs in or out
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in. Stay in "loading" until the profile check is done,
        // so no page redirects to /details for a moment by mistake.
        setLoading(true);
        let hasProfile = false;
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          hasProfile = userDoc.exists();
        } catch (err) {
          // Could not check (e.g. offline). Treat as "no profile yet" instead of hanging.
          console.error('Could not load the user profile:', err);
        }
        setUser(user);
        setProfileExists(hasProfile);
      } else {
        // User is signed out
        setUser(null);
        setProfileExists(false);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // --- Authentication Functions ---

  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const emailSignUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const emailSignIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = () => {
    return signOut(auth);
  };

  // 3. Pass the values to the children
  const value = {
    user,
    profileExists,
    loading,
    googleSignIn,
    emailSignUp,
    emailSignIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Create a custom hook to use the context
export const useAuth = () => {
  return useContext(AuthContext);
};