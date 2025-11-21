import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

let app: App;
let firestore: Firestore;

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
