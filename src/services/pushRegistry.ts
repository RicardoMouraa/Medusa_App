import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/services/firebase';

const toTokenDocId = (token: string) => token.replace(/[^a-zA-Z0-9_-]/g, '_');

export const saveUserExpoPushToken = async (uid: string, expoPushToken: string) => {
  const tokenDocId = toTokenDocId(expoPushToken);
  const userRef = doc(db, 'users', uid);
  const tokenRef = doc(db, 'users', uid, 'pushTokens', tokenDocId);

  await Promise.all([
    setDoc(
      userRef,
      {
        expoPushToken,
        pushProvider: 'expo',
        pushUpdatedAt: serverTimestamp()
      },
      { merge: true }
    ),
    setDoc(
      tokenRef,
      {
        token: expoPushToken,
        provider: 'expo',
        platform: Platform.OS,
        deviceName: Device.deviceName ?? null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      },
      { merge: true }
    )
  ]);
};
