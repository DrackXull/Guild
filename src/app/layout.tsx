
'use client';
import '@/app/globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNav } from '@/components/layout/user-nav';
import { Swords, Users, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { doc } from 'firebase/firestore';
import type { Player } from '@/lib/types';
import { allCharacters, players } from '@/lib/data';

function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOfficerPage = pathname.startsWith('/officer');

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

  const onlineMembers = players.filter(p => p.isOnline).length;
  const totalGuildKills = allCharacters.reduce((acc, char) => acc + char.totalKills, 0);
  const totalBossKills = allCharacters.reduce((acc, char) => acc + char.totalBossKills, 0);

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
                        <span className="hidden sm_inline text-muted-foreground">Bosses</span>
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

  // This is the important bit. If it's the admin user, force isMember to true.
  const isGuildLeader = user?.email?.toLowerCase() === 'huzzinda@gmail.com';
  
  // This state is now derived correctly and reliably.
  const isLoading = isUserLoading || (user && isPlayerLoading);
  const isMember = !!player || isGuildLeader;

  const publicRoutes = ['/'];
  const applicantRoutes = ['/application-status', '/apply', '/profile'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApplicantRoute = applicantRoutes.includes(pathname);

  useEffect(() => {
    // Wait until all loading is finished before making routing decisions.
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
    // This dependency array ensures the effect runs only when the final state is known.
  }, [isLoading, user, isMember, pathname, router, isPublicRoute, isApplicantRoute]);


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
