// إعداد وتهيئة فايربيس مع الربط المباشر بمشروع modeer-27c2d
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// الإعداد الافتراضي المباشر لمشروع المهندس محمد والمهندس طارق (modeer-27c2d)
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigParams = {
  apiKey: "AIzaSyCKvczYsYI8HqA7AKUSnLfKYAA40Lz6OGo",
  authDomain: "modeer-27c2d.firebaseapp.com",
  projectId: "modeer-27c2d",
  storageBucket: "modeer-27c2d.firebasestorage.app",
  messagingSenderId: "950336151305",
  appId: "1:950336151305:web:0278bd7e51b7ff3b7bbdd8"
};

const FIREBASE_CONFIG_KEY = 'tecnolobia_firebase_config';

export function getSavedFirebaseConfig(): FirebaseConfigParams {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (!raw) return DEFAULT_FIREBASE_CONFIG;
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveFirebaseConfig(config: FirebaseConfigParams): void {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  window.location.reload();
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const activeConfig = getSavedFirebaseConfig();

try {
  if (!getApps().length) {
    app = initializeApp(activeConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);

  // تفعيل التخزين والمزامنة بدون إنترنت (Offline Persistence)
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // متعدد التبويبات
      } else if (err.code === 'unimplemented') {
        // المتصفح لا يدعم
      }
    });
  }
  console.log('Firebase connected to Cloud Firestore:', activeConfig.projectId);
} catch (err) {
  console.error('Firebase initialization error:', err);
}

export { app, auth, db };

export function isFirebaseConnected(): boolean {
  return !!(app && db);
}
