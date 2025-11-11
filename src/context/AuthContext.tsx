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
  updateEmail,
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
  secondarySecretKey?: string | null;
  phone?: string | null;
  recipientId?: string | null;
  createdAt?: Timestamp | string | null;
  updatedAt?: Timestamp | string | null;
};

export type AuthUserProfile = {
  uid: string;
  name: string;
  email: string;
  secretKey: string | null;
  secondarySecretKey: string | null;
  phone?: string | null;
  recipientId?: string | null;
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
  isProfileReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  saveSecretKeys: (payload: {
    secretKey: string;
    secondarySecretKey?: string;
    recipientId?: string | null;
  }) => Promise<void>;
  updateProfileDetails: (payload: { name?: string; email?: string; phone?: string }) => Promise<void>;
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
  secondarySecretKey: data.secondarySecretKey ?? null,
  phone: data.phone ?? null,
  recipientId: data.recipientId ?? null,
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
  const [isProfileReady, setIsProfileReady] = useState(false);

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
          secondarySecretKey: overrides?.secondarySecretKey ?? null,
          phone: overrides?.phone ?? null,
          recipientId: overrides?.recipientId ?? null,
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
      setIsProfileReady(true);
      return nextProfile;
    },
    [getProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsProfileReady(false);
    const nextProfile = await getProfile(auth.currentUser.uid);
    setProfile(nextProfile);
    setIsProfileReady(true);
  }, [getProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsProfileReady(false);
        await ensureUserDocument(firebaseUser);
      } else {
        setProfile(null);
        setIsProfileReady(true);
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
    setIsProfileReady(true);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, []);

  const saveSecretKeys = useCallback(
    async ({
      secretKey,
      secondarySecretKey,
      recipientId
    }: {
      secretKey: string;
      secondarySecretKey?: string;
      recipientId?: string | null;
    }) => {
      if (!auth.currentUser) {
        throw new Error('Nenhum usuario autenticado.');
      }
      const primary = secretKey.trim();
      if (!primary) {
        throw new Error('Informe uma Passkey 1 valida.');
      }

      try {
        const ref = doc(db, 'users', auth.currentUser.uid);
        const changes: Record<string, unknown> = {
          secretKey: primary,
          updatedAt: serverTimestamp()
        };
        if (typeof secondarySecretKey !== 'undefined') {
          const normalizedSecondary = secondarySecretKey.trim();
          changes.secondarySecretKey = normalizedSecondary.length ? normalizedSecondary : null;
        }
        if (typeof recipientId !== 'undefined') {
          const normalizedRecipientId =
            recipientId && recipientId.trim().length > 0 ? recipientId.trim() : null;
          changes.recipientId = normalizedRecipientId;
        }
        await updateDoc(ref, changes);
        await refreshProfile();
      } catch (error) {
        throw new Error(mapFirebaseError(error));
      }
    },
    [refreshProfile]
  );

  const updateProfileDetails = useCallback(
    async ({ name, email, phone }: { name?: string; email?: string; phone?: string }) => {
      if (!auth.currentUser) {
        throw new Error('Nenhum usuario autenticado.');
      }

      const trimmedName = name?.trim();
      const trimmedEmail = email?.trim();
      const trimmedPhone = phone?.trim();

      const changes: Record<string, unknown> = {};
      if (trimmedName && trimmedName !== profile?.name) {
        changes.name = trimmedName;
      }
      if (trimmedEmail && trimmedEmail !== profile?.email) {
        changes.email = trimmedEmail;
      }
      if (phone !== undefined && trimmedPhone !== profile?.phone) {
        changes.phone = trimmedPhone && trimmedPhone.length ? trimmedPhone : null;
      }

      if (Object.keys(changes).length === 0) {
        return;
      }

      try {
        if (changes.name) {
          await updateProfile(auth.currentUser, { displayName: changes.name as string });
        }
        if (changes.email) {
          await updateEmail(auth.currentUser, changes.email as string);
        }
        const ref = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(ref, {
          ...changes,
          updatedAt: serverTimestamp()
        });
        await refreshProfile();
      } catch (error) {
        throw new Error(mapFirebaseError(error));
      }
    },
    [profile?.email, profile?.name, profile?.phone, refreshProfile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isInitializing,
      isProfileReady,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      saveSecretKeys,
      updateProfileDetails,
      refreshProfile
    }),
    [
      isInitializing,
      isProfileReady,
      profile,
      refreshProfile,
      requestPasswordReset,
      saveSecretKeys,
      signIn,
      signOut,
      signUp,
      updateProfileDetails,
      user
    ]
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
