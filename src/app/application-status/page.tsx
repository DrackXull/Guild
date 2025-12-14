'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ApplicationStatus } from '@/components/apply/application-status';
import type { Application, WithId } from '@/lib/types';

function ApplicantHeader() {
    const { user } = useUser();
    
    if (!user) return null;
    
    return (
        <div className="flex flex-col items-center text-center mb-8">
            <h1 className="font-headline text-4xl font-bold tracking-wide">
                Petition Status
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
                Here is the current standing of your application to join the guild.
            </p>
        </div>
    );
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const applicationRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'applications', user.uid);
  }, [user, firestore]);

  const { data: application, isLoading: isAppLoading } = useDoc<Application>(applicationRef);
  
  const isLoading = isUserLoading || isAppLoading;

  useEffect(() => {
    // If we're not loading and the application doesn't exist, redirect to onboarding.
    if (!isLoading && !application) {
      router.replace('/onboarding');
    }
  }, [isLoading, application, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-muted-foreground">Checking your application status...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="container mx-auto max-w-4xl py-12">
            <ApplicantHeader />
            {application ? (
                <ApplicationStatus application={application} />
            ) : (
                // This will be shown briefly before the redirect effect kicks in.
                <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="mt-4 text-muted-foreground">No application found, redirecting...</p>
                </div>
            )}
        </div>
    </div>
  );
}
