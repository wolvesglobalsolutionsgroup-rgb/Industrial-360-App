import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInAnonymously, onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { useEffect, useState } from 'react';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

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
  const [user, setUser] = useState<any>(() => auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else if (!authInitialized) {
        authInitialized = true;
        try {
          const credential = await signInAnonymously(auth);
          if (mounted && credential.user) {
            setUser(credential.user);
            setLoading(false);
          }
        } catch (err: any) {
          console.warn('Anonymous auth auto-signin notice:', err?.message || err);
          if (mounted) {
            const stored = getStoredUser();
            setUser(stored || DEMO_USER_DEFAULT);
            setLoading(false);
          }
        }
      } else {
        const stored = getStoredUser();
        setUser(stored || DEMO_USER_DEFAULT);
        setLoading(false);
      }
    });

    const onLocal = () => {
      if (!mounted) return;
      const stored = getStoredUser();
      setUser(stored || auth.currentUser || DEMO_USER_DEFAULT);
      setLoading(false);
    };
    window.addEventListener('ic360_auth_change', onLocal);

    return () => {
      mounted = false;
      unsubscribe();
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

export function handleFirestoreError(error: unknown, operationType: OperationType | string, collection?: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.warn(`Firestore error [${operationType}]${collection ? ' on ' + collection : ''}:`, errMsg);
}
