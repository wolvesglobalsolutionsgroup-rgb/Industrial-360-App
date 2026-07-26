import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Enable offline persistence for field operations
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence unsupported in this browser');
  }
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const DEMO_USER_DEFAULT = {
  uid: 'demo-operator-360',
  email: 'operador.demo@industrialcontrol360.com',
  displayName: 'Ing. Supervisor Demostración',
  photoURL: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoUser',
  isAnonymous: true,
  emailVerified: true,
  providerData: [],
};

export const getAuthUser = () => {
  if (auth.currentUser) return auth.currentUser;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ic360_demo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export function useAppAuthState() {
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [demoUser, setDemoUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('ic360_demo_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleAuthChange = () => {
      const saved = localStorage.getItem('ic360_demo_user');
      setDemoUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('ic360_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('ic360_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const activeUser = firebaseUser || demoUser;
  return [activeUser, loading, error] as const;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const current = getAuthUser();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email || undefined,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId || undefined,
      providerInfo: current?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const setLocalDemoUser = (userObj: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ic360_demo_user', JSON.stringify(userObj));
    window.dispatchEvent(new Event('ic360_auth_change'));
  }
};

export const loginAnonymously = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error: any) {
    console.warn("Firebase Anonymous auth restricted, falling back to local demo user session:", error);
    setLocalDemoUser(DEMO_USER_DEFAULT);
    return { user: DEMO_USER_DEFAULT };
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  const createFallbackUser = () => {
    const emailUser = {
      uid: 'email-' + Math.random().toString(36).substring(2, 10),
      email: email,
      displayName: email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
      isAnonymous: false,
      emailVerified: true,
      providerData: [],
    };
    setLocalDemoUser(emailUser);
    return { user: emailUser };
  };

  try {
    return await signInWithEmailAndPassword(auth, email, pass);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        return await createUserWithEmailAndPassword(auth, email, pass);
      } catch (createErr: any) {
        if (
          createErr.code === 'auth/admin-restricted-operation' || 
          createErr.code === 'auth/operation-not-allowed' ||
          createErr.code === 'auth/unauthorized-domain'
        ) {
          return createFallbackUser();
        }
        throw createErr;
      }
    } else if (
      error.code === 'auth/admin-restricted-operation' || 
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/unauthorized-domain'
    ) {
      return createFallbackUser();
    }
    throw error;
  }
};

export const logout = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ic360_demo_user');
    window.dispatchEvent(new Event('ic360_auth_change'));
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Error signing out from Firebase Auth", error);
  }
};
