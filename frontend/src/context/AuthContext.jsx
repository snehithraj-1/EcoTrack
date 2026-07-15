import { useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";

import { auth, isFirebaseConfigured } from "../firebase";
import { AuthContext } from "./auth-context";

const DEMO_USER = {
  uid: "demo-user",
  displayName: "Demo User",
  email: "demo@ecotrack.local",
};

const DEMO_SESSION_KEY = "ecotrack-demo-session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isFirebaseConfigured) return null;
    return localStorage.getItem(DEMO_SESSION_KEY) === "active" ? DEMO_USER : null;
  });
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  async function signIn(email, password, remember = true) {
    if (!isFirebaseConfigured || !auth) {
      localStorage.setItem(DEMO_SESSION_KEY, "active");
      setUser(DEMO_USER);
      return DEMO_USER;
    }
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function signUp(name, email, password) {
    if (!isFirebaseConfigured || !auth) {
      const demoUser = { ...DEMO_USER, displayName: name || DEMO_USER.displayName };
      localStorage.setItem(DEMO_SESSION_KEY, "active");
      setUser(demoUser);
      return demoUser;
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  }

  async function resetPassword(email) {
    if (!isFirebaseConfigured || !auth) {
      return true;
    }
    await sendPasswordResetEmail(auth, email);
    return true;
  }

  async function signOut() {
    if (!isFirebaseConfigured || !auth) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      return;
    }
    await firebaseSignOut(auth);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      demoMode: !isFirebaseConfigured,
      signIn,
      signUp,
      resetPassword,
      signOut,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
