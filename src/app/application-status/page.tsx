

'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { ApplicationStatus } from '@/components/apply/application-status';
import type { Application } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useGuildSettings } from '@/hooks/use-guild-settings';
import { CreateGuildForm } from '@/components/onboarding/create-guild-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JoinGuildForm } from '@/components/onboarding/join-guild-form';

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
        Forge a New <span className="guild-title-gradient">Nexus</span>
    </h1>
  );
}


export default function ApplicationStatusPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);


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
        
        <div className="container mx-auto max-w-4xl py-12">
            <div className="flex flex-col items-center text-center mb-8">
            <GuildTitle />
            <p className="text-muted-foreground mt-2 max-w-2xl">
                Your journey begins here. Create a new guild to rally your allies, or join an existing one to lend your strength.
            </p>
            </div>

            <Tabs defaultValue="create" className="w-full max-w-xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create a Guild</TabsTrigger>
                    <TabsTrigger value="join">Join a Guild</TabsTrigger>
                </TabsList>
                <TabsContent value="create">
                    <CreateGuildForm />
                </TabsContent>
                <TabsContent value="join">
                    <JoinGuildForm />
                </TabsContent>
            </Tabs>

        </div>
    </div>
  );
}
