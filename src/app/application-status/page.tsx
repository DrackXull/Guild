
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { ApplicationStatus } from '@/components/apply/application-status';
import type { Application, WithId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus } from 'lucide-react';

export default function ApplicationStatusPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const applicationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'applications'), where('userId', '==', user.uid), limit(1));
  }, [firestore, user]);

  const { data: applications, isLoading: isLoadingApplications } = useCollection<Application>(applicationsQuery);
  const existingApplication = applications?.[0];

  if (isUserLoading || (user && isLoadingApplications)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading application status...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-wide">A Summons to The Black Lantern Company</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {existingApplication 
            ? "Below is the current status of your petition."
            : "We seek stalwart adventurers to delve into the depths. You may submit a petition for membership."
          }
        </p>
      </div>

      {existingApplication ? (
        <ApplicationStatus application={existingApplication} />
      ) : (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <FilePlus className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-3xl">No Petition Found</CardTitle>
                <CardDescription className="pt-2">You have not yet submitted an application to join our ranks. If you wish to join us, click the button below.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full" size="lg">
                    <Link href="/apply">Submit Your Petition</Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
