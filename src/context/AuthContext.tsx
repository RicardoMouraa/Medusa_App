import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { FirebaseError } from 'firebase/app';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { auth, db } from '@/services/firebase';

type FirestoreUserDoc = {
  uid: string;
  name: string;
  email: string;
  secretKey: string | null;
  createdAt?: Timestamp | string | null;
  updatedAt?: Timestamp | string | null;
};

export type AuthUserProfile = {
  uid: string;
  name: string;
  email: string;
  secretKey: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  profile: AuthUserProfile | null;
  isInitializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  saveSecretKey: (secretKey: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const fallbackName = (name?: string | null) => (name && name.trim().length > 0 ? name.trim() : 'Usuario');

const normalizeTimestamp = (value?: Timestamp | string | null) => {
  if (!value) return null;
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value;
};

const normalizeProfile = (data: FirestoreUserDoc): AuthUserProfile => ({
  uid: data.uid,
  name: data.name,
  email: data.email,
  secretKey: data.secretKey ?? null,
  createdAt: normalizeTimestamp(data.createdAt),
  updatedAt: normalizeTimestamp(data.updatedAt)
});

const mapFirebaseError = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Credenciais invalidas. Verifique email e senha.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde e tente novamente.';
      case 'auth/email-already-in-use':
        return 'Este email ja esta em uso.';
      case 'auth/invalid-email':
        return 'Email invalido.';
      case 'auth/weak-password':
        return 'A senha precisa ter ao menos 6 caracteres.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const getProfile = useCallback(async (uid: string) => {
    const ref = doc(db, 'users', uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }
    return normalizeProfile(snapshot.data() as FirestoreUserDoc);
  }, []);

  const ensureUserDocument = useCallback(
    async (currentUser: User, overrides?: Partial<FirestoreUserDoc>) => {
      const ref = doc(db, 'users', currentUser.uid);
      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        await setDoc(ref, {
          uid: currentUser.uid,
          name: fallbackName(overrides?.name ?? currentUser.displayName),
          email: currentUser.email ?? overrides?.email ?? '',
          secretKey: overrides?.secretKey ?? null,
          createdAt: serverTimestamp()
        });
      } else if (overrides) {
        await setDoc(
          ref,
          {
            ...overrides,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      }

      const nextProfile = await getProfile(currentUser.uid);
      setProfile(nextProfile);
      return nextProfile;
    },
    [getProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    const nextProfile = await getProfile(auth.currentUser.uid);
    setProfile(nextProfile);
  }, [getProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await ensureUserDocument(firebaseUser);
      } else {
        setProfile(null);
      }
      setIsInitializing(false);
    });

    return unsubscribe;
  }, [ensureUserDocument]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email.trim(), password);
      await ensureUserDocument(firebaseUser);
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, [ensureUserDocument]);

  const signUp = useCallback(async ({ name, email, password }: SignUpPayload) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      await ensureUserDocument(credential.user, { name: name.trim(), email: email.trim() });
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, [ensureUserDocument]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, []);

  const saveSecretKey = useCallback(async (secretKey: string) => {
    if (!auth.currentUser) {
      throw new Error('Nenhum usuario autenticado.');
    }
    const trimmed = secretKey.trim();
    if (!trimmed) {
      throw new Error('Informe uma Secret Key valida.');
    }

    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, {
        secretKey: trimmed,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, [refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isInitializing,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      saveSecretKey,
      refreshProfile
    }),
    [isInitializing, profile, requestPasswordReset, saveSecretKey, signIn, signOut, signUp, refreshProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
