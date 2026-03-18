import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  DocumentReference,
  Timestamp,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import {
  clearAuthSession,
  readAuthSession,
  readPasskeys,
  writeAuthSession,
  writePasskeys
} from '@/services/secureStore';
import { STORAGE_KEYS } from '@/constants/storageKeys';

type FirestoreUserDoc = {
  uid: string;
  name: string;
  email: string;
  secretKey?: string | null;
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

type SessionSnapshot = {
  uid: string;
  createdAt: string;
  expiresAt: string;
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

const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

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
  secretKey: null,
  secondarySecretKey: null,
  phone: data.phone ?? null,
  recipientId: data.recipientId ?? null,
  createdAt: normalizeTimestamp(data.createdAt),
  updatedAt: normalizeTimestamp(data.updatedAt)
});

const applyStoredPasskeys = async (profile: AuthUserProfile): Promise<AuthUserProfile> => {
  const stored = await readPasskeys(profile.uid);
  return {
    ...profile,
    secretKey: stored?.secretKey ?? null,
    secondarySecretKey: stored?.secondarySecretKey ?? null
  };
};

const scrubLegacySecretKeys = async (ref: DocumentReference, data: FirestoreUserDoc) => {
  if (!data.secretKey && !data.secondarySecretKey) {
    return;
  }

  await updateDoc(ref, {
    secretKey: deleteField(),
    secondarySecretKey: deleteField(),
    updatedAt: serverTimestamp()
  });
};

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

const readSessionSnapshot = async (): Promise<SessionSnapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  } catch (error) {
    console.warn('[Auth] Failed to read session snapshot', error);
    return null;
  }
};

const writeSessionSnapshot = async (uid: string): Promise<SessionSnapshot> => {
  const now = Date.now();
  const snapshot: SessionSnapshot = {
    uid,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString()
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[Auth] Failed to persist session snapshot', error);
  }
  return snapshot;
};

const clearSessionSnapshot = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.session);
  } catch (error) {
    console.warn('[Auth] Failed to clear session snapshot', error);
  }
};

const isSessionExpired = (snapshot: SessionSnapshot, uid: string) => {
  if (!snapshot || snapshot.uid !== uid) return false;
  const expiresAt = new Date(snapshot.expiresAt).getTime();
  if (!Number.isFinite(expiresAt)) return false;
  return Date.now() > expiresAt;
};

const persistAuthSessionCredentials = async (
  uid: string,
  email: string,
  password: string,
  expiresAt: string
) => {
  await writeAuthSession({
    uid,
    email: email.trim(),
    password,
    expiresAt
  });
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const lastKnownUidRef = useRef<string | null>(null);
  const hasAttemptedAutoSignInRef = useRef(false);

  const getProfile = useCallback(async (uid: string) => {
    const ref = doc(db, 'users', uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as FirestoreUserDoc;
    if (data.secretKey || data.secondarySecretKey) {
      await scrubLegacySecretKeys(ref, data);
    }

    const normalized = normalizeProfile(data);
    return applyStoredPasskeys(normalized);
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
      } else {
        const data = snapshot.data() as FirestoreUserDoc;
        if (data.secretKey || data.secondarySecretKey) {
          await scrubLegacySecretKeys(ref, data);
        }
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
        hasAttemptedAutoSignInRef.current = true;
        lastKnownUidRef.current = firebaseUser.uid;
        const snapshot = await readSessionSnapshot();
        if (snapshot && isSessionExpired(snapshot, firebaseUser.uid)) {
          await clearSessionSnapshot();
          await clearAuthSession();
          await firebaseSignOut(auth);
          setProfile(null);
          setIsProfileReady(true);
          setIsInitializing(false);
          return;
        }

        const nextSnapshot = await writeSessionSnapshot(firebaseUser.uid);
        const savedAuthSession = await readAuthSession();
        if (savedAuthSession && savedAuthSession.uid === firebaseUser.uid) {
          await writeAuthSession({
            ...savedAuthSession,
            expiresAt: nextSnapshot.expiresAt
          });
        }

        setIsProfileReady(false);
        await ensureUserDocument(firebaseUser);
      } else {
        if (!hasAttemptedAutoSignInRef.current) {
          hasAttemptedAutoSignInRef.current = true;
          const snapshot = await readSessionSnapshot();
          const savedAuthSession = await readAuthSession();
          const authSessionExpired = savedAuthSession
            ? new Date(savedAuthSession.expiresAt).getTime() <= Date.now()
            : true;

          const canRestoreFromSecureSession =
            savedAuthSession &&
            !authSessionExpired &&
            (!snapshot || snapshot.uid === savedAuthSession.uid);

          if (canRestoreFromSecureSession) {
            try {
              await signInWithEmailAndPassword(auth, savedAuthSession.email, savedAuthSession.password);
              return;
            } catch (error) {
              console.warn('[Auth] Failed to auto sign in from secure session', error);
              await clearSessionSnapshot();
              await clearAuthSession();
            }
          } else if (snapshot && isSessionExpired(snapshot, snapshot.uid)) {
            await clearSessionSnapshot();
            await clearAuthSession();
          }
        }

        lastKnownUidRef.current = null;
        setProfile(null);
        setIsProfileReady(true);
      }
      setIsInitializing(false);
    });

    return unsubscribe;
  }, [ensureUserDocument]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim();
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const snapshot = await writeSessionSnapshot(firebaseUser.uid);
      await persistAuthSessionCredentials(firebaseUser.uid, normalizedEmail, password, snapshot.expiresAt);
      await ensureUserDocument(firebaseUser);
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, [ensureUserDocument]);

  const signUp = useCallback(async ({ name, email, password }: SignUpPayload) => {
    try {
      const normalizedEmail = email.trim();
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      const snapshot = await writeSessionSnapshot(credential.user.uid);
      await persistAuthSessionCredentials(
        credential.user.uid,
        normalizedEmail,
        password,
        snapshot.expiresAt
      );
      await ensureUserDocument(credential.user, { name: name.trim(), email: normalizedEmail });
    } catch (error) {
      throw new Error(mapFirebaseError(error));
    }
  }, [ensureUserDocument]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await clearSessionSnapshot();
    await clearAuthSession();
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
        const uid = auth.currentUser.uid;
        const normalizedSecondary =
          typeof secondarySecretKey === 'string' ? secondarySecretKey.trim() : undefined;
        const storedSecondary =
          typeof secondarySecretKey === 'undefined'
            ? profile?.secondarySecretKey ?? null
            : normalizedSecondary && normalizedSecondary.length
              ? normalizedSecondary
              : null;

        await writePasskeys(uid, {
          secretKey: primary,
          secondarySecretKey: storedSecondary
        });

        const ref = doc(db, 'users', auth.currentUser.uid);
        const changes: Record<string, unknown> = {
          updatedAt: serverTimestamp()
        };
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
    [profile?.secondarySecretKey, refreshProfile]
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
