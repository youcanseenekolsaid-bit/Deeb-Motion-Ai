import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let authInstance: Auth;
if (typeof window !== 'undefined') {
  authInstance = (window as any)._firebaseAuth || ((window as any)._firebaseAuth = getAuth(app));
} else {
  authInstance = getAuth(app);
}

export const auth = authInstance;
