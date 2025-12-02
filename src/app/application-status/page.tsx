
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { ApplicationStatus } from '@/components/apply/application-status';
import type { Application } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useGuildSettings } from '@/hooks/use-guild-settings';


function ApplicantHeader() {
    const { user } = useUser();
    const auth = useAuth();
    
    if (!user) return null;

    const handleLogout = () => {
        if (auth) {
            signOut(auth);
        }
    };

    return (
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div>
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/profile">
                        <UserCircle className="mr-2 h-4 w-4" />
                        Profile
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </header>
    )
}

function GuildTitle() {
  const { settings, isLoading } = useGuildSettings();
  const guildName = settings?.guildName || '...';
  const [firstWord, secondWord, ...restOfName] = guildName.split(' ');

  if (isLoading) {
    return <h1 className="font-headline text-4xl font-bold tracking-wide guild-title-word">Loading...</h1>
  }

  return (
    <h1 className="font-headline text-4xl font-bold tracking-wide guild-title-word">
        A Summons to <span className="text-muted-foreground">{firstWord}</span> <span className="guild-title-gradient">{secondWord}</span> <span>{restOfName.join(' ')}</span>
    </h1>
  );
}


export default function ApplicationStatusPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    // If there's no logged-in user and we are done loading, redirect them to the home page to log in.
    // This runs as a side effect after rendering to avoid state update errors.
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);


  // IMPORTANT: Only create the query if the user and firestore are available.
  const applicationDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // Fetch the user's specific application document from the root `applications` collection.
    return doc(firestore, 'applications', user.uid);
  }, [firestore, user]);

  const { data: existingApplication, isLoading: isLoadingApplication } = useDoc<Application>(applicationDocRef);
  
  const isLoading = isUserLoading || (user && isLoadingApplication);

  // Render a loading state or null while redirecting to avoid flashing content.
  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
          <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ApplicantHeader />
        
        {isLoading ? (
             <div className="flex items-center justify-center">
                <p>Loading application status...</p>
            </div>
        ) : (
            <div className="container mx-auto max-w-4xl py-12">
              <div className="flex flex-col items-center text-center mb-8">
                <GuildTitle />
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
        )}
    </div>
  );
}

    