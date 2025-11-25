
'use client';
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
import type { Player, Character } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOfficerPage = pathname.startsWith('/officer');
  const firestore = useFirestore();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), where('isOnline', '==', true));
  }, [firestore]);
  const { data: onlinePlayers } = useCollection<Player>(playersQuery);

  const charactersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'characters'));
  }, [firestore]);
  const { data: allCharacters } = useCollection<Character>(charactersQuery);


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
  const [logCounter, setLogCounter] = useState(0);

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);

  const { data: player, isLoading: isPlayerLoading } = useDoc<Player>(playerDocRef);

  const isGuildLeader = user?.email?.toLowerCase() === 'huzzinda@gmail.com';
  
  const isLoading = isUserLoading || (user && isPlayerLoading);
  const isMember = !!player || isGuildLeader;

  const publicRoutes = ['/'];
  const applicantRoutes = ['/application-status', '/apply', '/profile'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApplicantRoute = applicantRoutes.includes(pathname);

  useEffect(() => {
    console.group(`[AppManager Debug] - Render #${logCounter}`);
    console.log('Current Pathname:', pathname);
    console.log('Auth User (from useUser):', user);
    console.log('Player Profile (from Firestore):', player);
    console.log('--- Evaluation ---');
    console.log('isUserLoading:', isUserLoading);
    console.log('isPlayerLoading:', isPlayerLoading);
    console.log('Final isLoading state:', isLoading);
    console.log('Is Guild Leader:', isGuildLeader);
    console.log('Is Member (has player profile):', isMember);
    console.groupEnd();
    setLogCounter(c => c + 1);

    // Wait until all loading is finished before making routing decisions.
    if (isLoading) return;

    if (user) {
      if (isMember) {
        // User is a full member. Redirect to dashboard if they land on a public/applicant page.
        if (isPublicRoute || pathname === '/application-status' || pathname === '/apply') {
          console.log('[AppManager] User is member, redirecting from public/applicant route to /dashboard');
          router.replace('/dashboard');
        }
      } else {
        // User is an applicant (logged in but not a member).
        // They should only be on applicant-safe routes.
        if (!isApplicantRoute) {
          console.log('[AppManager] User is applicant, redirecting from member route to /application-status');
          router.replace('/application-status');
        }
      }
    } else {
      // User is not logged in. They should only be on the public landing page.
      if (!isPublicRoute) {
        console.log('[AppManager] User is not logged in, redirecting to /');
        router.replace('/');
      }
    }
  }, [isLoading, user, player, isMember, pathname, router, isPublicRoute, isApplicantRoute, isGuildLeader]);


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
    return <MemberLayout>{children}</MemberLayout>;
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
 
