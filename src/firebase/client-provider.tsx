'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client side, once per component mount.
    setFirebaseServices(initializeFirebase());
  }, []); // Empty dependency array ensures this runs only once on mount

  if (!firebaseServices) {
    // Render a consistent loading state while Firebase is initializing.
    // This now matches the loading state in AppLayout to prevent hydration errors.
    return <div className="flex items-center justify-center h-screen bg-background"><p>Loading Guild Hall...</p></div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
