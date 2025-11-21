
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNav } from '@/components/layout/user-nav';
import { allCharacters, players } from '@/lib/data';
import { Swords, Users, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const onlineMembers = players.filter(p => p.isOnline).length;
  const totalGuildKills = allCharacters.reduce((acc, char) => acc + char.totalKills, 0);
  const totalBossKills = allCharacters.reduce((acc, char) => acc + char.totalBossKills, 0);
  const pathname = usePathname();
  const isOfficerPage = pathname.startsWith('/officer');
  
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login page.
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // If user is loading, you can show a loading spinner or a blank page
  if (isUserLoading || !user) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body antialiased">
                <FirebaseClientProvider>
                    <div className="flex items-center justify-center h-screen bg-background">
                        <p>Loading...</p>
                    </div>
                </FirebaseClientProvider>
                 <Toaster />
            </body>
        </html>
    );
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
         <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased">
            <FirebaseClientProvider>
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
            </FirebaseClientProvider>
            <Toaster />
        </body>
    </html>
  );
}
