import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNav } from '@/components/layout/user-nav';
import { allCharacters, players } from '@/lib/data';
import { Swords, Users, Skull } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const onlineMembers = players.filter(p => p.isOnline).length;
  const totalGuildKills = allCharacters.reduce((acc, char) => acc + char.totalKills, 0);
  const totalBossKills = allCharacters.reduce((acc, char) => acc + char.totalBossKills, 0);

  return (
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
  );
}
