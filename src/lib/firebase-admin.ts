
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

let app: App;
let firestore: Firestore;

// Note: This Admin SDK setup is minimal and relies on the environment
// providing credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS).
// It may not work in all local development setups without further configuration.
if (!getApps().length) {
  app = initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  app = getApps()[0];
}

firestore = getFirestore(app);

export function getAdminFirestore() {
  return firestore;
}
