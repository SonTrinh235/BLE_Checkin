import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from '@firebase/auth';
import { doc, onSnapshot, setDoc } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import { syncStudentIdToClubs } from '../data/clubs';
import { syncServerClock } from '../data/serverClock';
import { stopAdvertising } from '../ble/advertiser';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  /** Student ID from the user's profile doc (null until set). */
  studentId: string | null;
  updateStudentId: (studentId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    studentId?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setStudentId(null);
      return;
    }
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => setStudentId((snap.data()?.studentId as string | undefined) || null),
      () => setStudentId(null)
    );
  }, [user?.uid]);

  useEffect(() => {
    if (user) void syncServerClock(user.uid);
  }, [user?.uid]);

  const value: AuthContextValue = {
    user,
    initializing,
    studentId,
    updateStudentId: async (id) => {
      if (!user) return;
      const value = id.trim() || null;
      await setDoc(doc(db, 'users', user.uid), { studentId: value }, { merge: true });
      await syncStudentIdToClubs(user.uid, value);
    },
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signUp: async (email, password, displayName, studentId) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await setDoc(doc(db, 'users', credential.user.uid), {
        displayName,
        email,
        studentId: studentId?.trim() || null,
      });
    },
    signOut: () => {
      stopAdvertising();
      return firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
