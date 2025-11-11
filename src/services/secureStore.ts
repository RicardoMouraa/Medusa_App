import * as SecureStore from 'expo-secure-store';

type PasskeyPayload = {
  secretKey: string;
  secondarySecretKey?: string | null;
};

const sanitizeSegment = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

const buildKey = (uid: string) => `medusa_passkeys_${sanitizeSegment(uid)}`;

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
