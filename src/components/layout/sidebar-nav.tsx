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
  Shield,
  LifeBuoy,
  Settings,
  Store,
  Scroll,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Button } from '../ui/button';
import { useRef } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/bounty-board', label: 'Guild Bounties', icon: <ScrollText /> },
  { href: '/member-bounties', label: 'Member Bounties', icon: <Scroll /> },
  { href: '/market', label: 'Honor Market', icon: <Store /> },
  { href: '/runs/new', label: 'New Run Report', icon: <Swords /> },
  { href: '/profile', label: 'My Profile', icon: <UserCircle /> },
  { href: '/officer', label: 'Officer Lounge', icon: <Shield />, officerOnly: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  // Mock officer status
  const isOfficer = true; 
  const hoverAudioRef = useRef<HTMLAudioElement>(null);

  const playHoverSound = () => {
    // hoverAudioRef.current?.play().catch(e => console.error("Error playing hover sound:", e));
  }

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-headline text-2xl font-bold text-primary">
          <Icons.logo className="h-8 w-8" />
          <span>Guild Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.officerOnly && !isOfficer) return null;
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
      <audio ref={hoverAudioRef} src="/sounds/ui-hover.mp3" preload="auto"></audio>
    </>
  );
}
