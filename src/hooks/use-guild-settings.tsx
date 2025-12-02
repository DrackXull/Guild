
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { GuildSettings, WithId } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface GuildSettingsContextType {
  settings: WithId<GuildSettings> | null;
  isLoading: boolean;
}

const GuildSettingsContext = createContext<GuildSettingsContextType | undefined>(undefined);

export function GuildSettingsProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings/guild');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<GuildSettings>(settingsDocRef);

  const value = {
    settings,
    isLoading,
  };

  return (
    <GuildSettingsContext.Provider value={value}>
      {children}
    </GuildSettingsContext.Provider>
  );
}

export function useGuildSettings() {
  const context = useContext(GuildSettingsContext);
  if (context === undefined) {
    throw new Error('useGuildSettings must be used within a GuildSettingsProvider');
  }
  return context;
}

    