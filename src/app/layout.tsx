
'use client';
import '@/app/globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNav } from '@/components/layout/user-nav';
import { allCharacters, players } from '@/lib/data';
import { Swords, Users, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { doc } from 'firebase/firestore';
import { Player } from '@/lib/types';

function AppLayout({ children }: { children: React.ReactNode }) {
  const onlineMembers = players.filter(p => p.isOnline).length;
  const totalGuildKills = allCharacters.reduce((acc, char) => acc + char.totalKills, 0);
  const totalBossKills = allCharacters.reduce((acc, char) => acc + char.totalBossKills, 0);
  const pathname = usePathname();
  const isOfficerPage = pathname.startsWith('/officer');
  
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `players/${user.uid}`);
  }, [user, firestore]);

  const { data: playerProfile, isLoading: isProfileLoading } = useDoc<Player>(playerDocRef);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const isMember = playerProfile?.role === 'member' || playerProfile?.role === 'officer' || playerProfile?.role === 'admin';
    const finishedLoading = !isUserLoading && !isProfileLoading;
    const isPublicPage = pathname === '/' || pathname.startsWith('/apply');

    if (finishedLoading) {
      if (user) {
        // User is logged in
        if (isMember) {
          // User is a member
          if (isPublicPage) {
            router.push('/dashboard');
          }
        } else {
          // User is not a member (applicant)
          if (!isPublicPage) {
             router.push('/apply');
          }
        }
      } else {
        // User is not logged in
        if (!isPublicPage) {
          router.push('/');
        }
      }
      setAuthChecked(true);
    }
  }, [user, playerProfile, isUserLoading, isProfileLoading, pathname, router]);


  useEffect(() => {
    if (isOfficerPage) {
      document.body.classList.add('view-officer');
    } else {
      document.body.classList.remove('view-officer');
    }
    return () => {
      document.body.classList.remove('view-officer');
    };
  }, [isOfficerPage]);

  const isPublicPage = pathname === '/' || pathname.startsWith('/apply');

  if (!authChecked) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
            <p>Loading Guild Hall...</p>
        </div>
    );
  }
  
  if (isPublicPage && !user) {
    return <>{children}</>;
  }

  // If user is logged in but not a member, they can only see the apply page
  if (user && !playerProfile && pathname.startsWith('/apply')) {
    return <>{children}</>;
  }
  
  // If user is logged in and a member, show the full layout
  if(user && playerProfile) {
    return (
      <div className={cn({ 'officer-theme': isOfficerPage })}>
        <SidebarProvider>
          <Sidebar>
            <SidebarNav />
          </Sidebar>
          <SidebarInset>
            <div className="flex h-full flex-col">
              <header className="sticky top-0 z-10 flex h-[60px] items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <div className="flex-1 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2" title={`${onlineMembers} members online`}>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-bold">{onlineMembers}</span>
                        <span className="hidden sm:inline text-muted-foreground">Online</span>
                    </div>
                      <div className="flex items-center gap-2" title={`${totalGuildKills} total guild kills`}>
                        <Swords className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-bold">{totalGuildKills}</span>
                          <span className="hidden sm:inline text-muted-foreground">Kills</span>
                    </div>
                      <div className="flex items-center gap-2" title={`${totalBossKills} total boss kills`}>
                        <Skull className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-bold">{totalBossKills}</span>
                          <span className="hidden sm:inline text-muted-foreground">Bosses</span>
                    </div>
                </div>
                <UserNav />
              </header>
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                {children}
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

  // Fallback for loading state or redirection
  return (
    <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading Guild Hall...</p>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
         <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased">
            <FirebaseClientProvider>
                <AppLayout>{children}</AppLayout>
            </FirebaseClientProvider>
            <Toaster />
        </body>
    </html>
  );
}
