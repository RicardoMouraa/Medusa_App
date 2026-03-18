import * as SecureStore from 'expo-secure-store';

type PasskeyPayload = {
  secretKey: string;
  secondarySecretKey?: string | null;
};

type AuthSessionPayload = {
  uid: string;
  email: string;
  password: string;
  expiresAt: string;
};

const sanitizeSegment = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

const buildKey = (uid: string) => `medusa_passkeys_${sanitizeSegment(uid)}`;
const authSessionKey = 'medusa_auth_session';

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
};

export const readPasskeys = async (uid: string): Promise<PasskeyPayload | null> => {
  try {
    const raw = await SecureStore.getItemAsync(buildKey(uid));
    return raw ? (JSON.parse(raw) as PasskeyPayload) : null;
  } catch (error) {
    console.warn('[SecureStore] Failed to read passkeys', error);
    return null;
  }
};

export const writePasskeys = async (uid: string, payload: PasskeyPayload) => {
  try {
    await SecureStore.setItemAsync(buildKey(uid), JSON.stringify(payload), secureOptions);
  } catch (error) {
    console.warn('[SecureStore] Failed to persist passkeys', error);
    throw error;
  }
};

export const clearPasskeys = async (uid: string) => {
  try {
    await SecureStore.deleteItemAsync(buildKey(uid), secureOptions);
  } catch (error) {
    console.warn('[SecureStore] Failed to clear passkeys', error);
  }
};

export const readAuthSession = async (): Promise<AuthSessionPayload | null> => {
  try {
    const raw = await SecureStore.getItemAsync(authSessionKey);
    return raw ? (JSON.parse(raw) as AuthSessionPayload) : null;
  } catch (error) {
    console.warn('[SecureStore] Failed to read auth session', error);
    return null;
  }
};

export const writeAuthSession = async (payload: AuthSessionPayload) => {
  try {
    await SecureStore.setItemAsync(authSessionKey, JSON.stringify(payload), secureOptions);
  } catch (error) {
    console.warn('[SecureStore] Failed to persist auth session', error);
  }
};

export const clearAuthSession = async () => {
  try {
    await SecureStore.deleteItemAsync(authSessionKey, secureOptions);
  } catch (error) {
    console.warn('[SecureStore] Failed to clear auth session', error);
  }
};
