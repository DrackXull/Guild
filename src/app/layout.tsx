
'use client';
import * as React from 'react';
import '@/app/globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNav } from '@/components/layout/user-nav';
import { Swords, Users, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { doc, collection, collectionGroup, query, where } from 'firebase/firestore';
import type { Player, Character, Quest } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

function MemberLayout({ children, allCharacters, onlinePlayers }: { children: React.ReactNode, allCharacters: Character[], onlinePlayers: Player[] }) {
  const pathname = usePathname();
  const isOfficerPage = pathname.startsWith('/officer');

  useEffect(() => {
    if (isOfficerPage) {
      document.body.classList.add('view-officer');
    } else {
      document.body.classList.remove('view-officer');
    }
    // Cleanup function to remove the class when the component unmounts
    return () => {
      document.body.classList.remove('view-officer');
    };
  }, [isOfficerPage]);

  const onlineMembers = onlinePlayers?.length || 0;
  const totalGuildKills = allCharacters?.reduce((acc, char) => acc + (char.confirmedKills || 0), 0) || 0;
  const totalBossKills = allCharacters?.reduce((acc, char) => acc + (char.totalBossKills || 0), 0) || 0;


  return (
    <div className={cn({ 'officer-theme': isOfficerPage })}>
      <SidebarProvider>
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 flex h-[60px] items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
             <TooltipProvider>
              <div className="flex-1 flex items-center gap-6 text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-default">
                            <Users className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-bold">{onlineMembers}</span>
                            <span className="hidden sm:inline text-muted-foreground">Online</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Guild Members Online</p>
                    </TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-default">
                        <Swords className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-bold">{totalGuildKills.toLocaleString()}</span>
                            <span className="hidden sm:inline text-muted-foreground">Kills</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Total Guild Kills</p>
                    </TooltipContent>
                   </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <div className="flex items-center gap-2 cursor-default">
                                <Skull className="h-4 w-4 text-muted-foreground"/>
                                <span className="font-bold">{totalBossKills.toLocaleString()}</span>
                                <span className="hidden sm_inline text-muted-foreground">Bosses</span>
                           </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Total Guild Boss Kills</p>
                        </TooltipContent>
                    </Tooltip>
              </div>
              </TooltipProvider>
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


function AppManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);
  const { data: player, isLoading: isPlayerLoading } = useDoc<Player>(playerDocRef);

  // Guild-wide data, fetched only when the user is a logged-in member
  const charactersQuery = useMemoFirebase(() => {
    if (!firestore || !player) return null; // Only fetch if user is a member
    return query(collectionGroup(firestore, 'characters'));
  }, [firestore, player]);
  const { data: allCharacters, isLoading: isLoadingCharacters } = useCollection<Character>(charactersQuery);

  const onlinePlayersQuery = useMemoFirebase(() => {
    if (!firestore || !player) return null;
    return query(collection(firestore, 'players'), where('isOnline', '==', true));
  }, [firestore, player]);
  const { data: onlinePlayers, isLoading: isLoadingOnlinePlayers } = useCollection<Player>(onlinePlayersQuery);
  
  const isLoading = isUserLoading || (user && (isPlayerLoading || isLoadingCharacters || isLoadingOnlinePlayers));
  const isMember = !!player;

  const publicRoutes = ['/'];
  const applicantRoutes = ['/application-status', '/apply', '/profile'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApplicantRoute = applicantRoutes.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (isMember) {
        // User is a full member. Redirect to dashboard if they land on a public/applicant page.
        if (isPublicRoute || pathname === '/application-status' || pathname === '/apply') {
          router.replace('/dashboard');
        }
      } else {
        // User is an applicant (logged in but not a member).
        // They should only be on applicant-safe routes.
        if (!isApplicantRoute) {
          router.replace('/application-status');
        }
      }
    } else {
      // User is not logged in. They should only be on the public landing page.
      if (!isPublicRoute) {
        router.replace('/');
      }
    }
  }, [isLoading, user, player, isMember, pathname, router, isPublicRoute, isApplicantRoute]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading Guild Hall...</p>
      </div>
    );
  }

  // Determine which layout to render
  if (!user) {
    // Not logged in: Show public pages without any layout.
    return <>{children}</>;
  }

  if (isMember) {
    // Logged-in Guild Member: Show the full member layout.
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { allCharacters, onlinePlayers });
        }
        return child;
    });
    return <MemberLayout allCharacters={allCharacters || []} onlinePlayers={onlinePlayers || []}>{childrenWithProps}</MemberLayout>;
  } else {
    // Logged-in Applicant: Show pages without the member layout.
    return <>{children}</>;
  }
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
                <AppManager>{children}</AppManager>
            </FirebaseClientProvider>
            <Toaster />
        </body>
    </html>
  );
}
