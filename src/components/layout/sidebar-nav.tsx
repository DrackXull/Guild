
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Swords,
  ScrollText,
  UserCircle,
  LifeBuoy,
  Settings,
  Store,
  Scroll,
  Trophy,
  Shield,
  Users,
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useRef } from 'react';
import { GUILD_NAME } from '@/lib/config';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Player } from '@/lib/types';
import { useAudio } from '@/hooks/use-audio';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/bounty-board', label: 'Guild Bounties', icon: <ScrollText /> },
  { href: '/member-bounties', label: 'Member Bounties', icon: <Scroll /> },
  { href: '/market', label: 'Honor Market', icon: <Store /> },
  { href: '/runs/new', label: 'New Run Report', icon: <Swords /> },
  { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy /> },
  { href: '/members', label: 'Members', icon: <Users /> },
  { href: '/profile', label: 'My Profile', icon: <UserCircle /> },
];

const officerNavItem = { href: '/officer', label: 'Council', icon: <Shield /> };


export function SidebarNav() {
  const pathname = usePathname();
  const { playSound } = useAudio();
  
  const { user } = useUser();
  const firestore = useFirestore();

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);
  const { data: player } = useDoc<Player>(playerDocRef);

  const isOfficer = player?.role === 'officer' || player?.role === 'admin';
  
  const [firstWord, secondWord, ...restOfName] = GUILD_NAME.split(' ');

  const playHoverSound = () => {
    playSound('hover');
  }

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="font-headline text-2xl font-bold guild-title-word">
            <span className="text-muted-foreground">{firstWord}</span> <span className="guild-title-gradient">{secondWord}</span> <span>{restOfName.join(' ')}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            return (
              <SidebarMenuItem key={item.label} onMouseEnter={playHoverSound}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {isOfficer && (
             <SidebarMenuItem onMouseEnter={playHoverSound}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(officerNavItem.href)}
                  tooltip={officerNavItem.label}
                >
                  <Link href={officerNavItem.href}>
                    {officerNavItem.icon}
                    <span>{officerNavItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Separator className="my-2" />
        <div className="flex flex-col gap-2">
           <Button variant="ghost" className="justify-start gap-2" onMouseEnter={playHoverSound}>
            <LifeBuoy className="h-4 w-4" />
            <span className="text-sm">Support</span>
          </Button>
          <Button variant="ghost" className="justify-start gap-2" onMouseEnter={playHoverSound}>
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
