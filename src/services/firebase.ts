import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBh0kPw8D-a5IZUx9UjlctNPEpmSbP6GXQ",
  authDomain: "medusa-app-2025.firebaseapp.com",
  projectId: "medusa-app-2025",
  storageBucket: "medusa-app-2025.firebasestorage.app",
  messagingSenderId: "561443943131",
  appId: "1:561443943131:web:1a58008b342d71ee8512fe",
  measurementId: "G-0J95YQNL1K"
};

const app = initializeApp(firebaseConfig);

const analytics =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return getAnalytics(app);
        } catch {
          return undefined;
        }
      })()
    : undefined;

const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
