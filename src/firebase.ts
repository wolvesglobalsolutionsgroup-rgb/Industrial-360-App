import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInAnonymously, onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { useEffect, useState } from 'react';
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

const DEMO_USER_DEFAULT = {
  uid: 'demo-operator-360',
  displayName: 'Ing. Supervisor Demostración',
  email: 'demo@industrial360.app',
  photoURL: null,
};

// Cache local del usuario para modo offline/fallback
let localDemoUser: any = null;

function setLocalUser(user: any) {
  localDemoUser = user;
  try { localStorage.setItem('ic360_user', JSON.stringify(user)); } catch {}
  window.dispatchEvent(new CustomEvent('ic360_auth_change'));
}

export function getStoredUser(): any {
  try {
    const raw = localStorage.getItem('ic360_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getAuthUser() {
  if (auth.currentUser) return auth.currentUser;
  return localDemoUser || getStoredUser();
}

export async function loginWithEmail(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      await createUserWithEmailAndPassword(auth, email, password);
      return;
    }
    if (
      error.code === 'auth/unauthorized-domain' || 
      error.code === 'auth/operation-not-allowed' || 
      error.code === 'auth/api-key-not-valid' ||
      error.code === 'auth/invalid-api-key'
    ) {
      // Fallback local si Firebase Auth está restringido
      setLocalUser({
        uid: `local-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        displayName: email.split('@')[0],
        email,
        photoURL: null,
        isLocal: true,
      });
      return;
    }
    const message = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
      ? 'Correo o contraseña incorrectos'
      : error.code === 'auth/too-many-requests'
        ? 'Demasiados intentos. Intenta de nuevo más tarde'
        : 'Error al iniciar sesión';
    throw new Error(message);
  }
}

export async function loginAnonymously() {
  try {
    await signInAnonymously(auth);
  } catch {
    // Fallback a demo local si anonymous no está habilitado
    setLocalUser(DEMO_USER_DEFAULT);
  }
}

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn("Error signing in with Google, falling back to local demo", error);
    setLocalUser(DEMO_USER_DEFAULT);
  }
};

export const logout = async () => {
  try {
    localStorage.removeItem('ic360_user');
    localDemoUser = null;
    window.dispatchEvent(new CustomEvent('ic360_auth_change'));
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export function useAppAuthState() {
  const [user, setUser] = useState<any>(() => auth.currentUser || getStoredUser());
  const [loading, setLoading] = useState(!auth.currentUser && !getStoredUser());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        const stored = getStoredUser();
        setUser(stored || null);
        setLoading(false);
      }
    });

    const onLocal = () => {
      const stored = getStoredUser();
      setUser(stored || auth.currentUser || null);
      setLoading(false);
    };
    window.addEventListener('ic360_auth_change', onLocal);

    return () => {
      unsub();
      window.removeEventListener('ic360_auth_change', onLocal);
    };
  }, []);

  return [user, loading] as const;
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
  const user = getAuthUser();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email || undefined,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId || undefined,
      providerInfo: user?.providerData?.map((provider: any) => ({
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
