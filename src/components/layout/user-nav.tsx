
'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Gem, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { Player } from '@/lib/types';
import { Progress } from '../ui/progress';


export function UserNav() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);
  const { data: player } = useDoc<Player>(playerDocRef);
  
  const handleLogout = () => {
    if (auth) {
        signOut(auth);
    }
  };

  const isOfficer = player?.role === 'officer' || player?.role === 'admin';


  if (!user) {
    return null;
  }
  
  const userInitial = player?.displayName ? player.displayName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : '?';
  const honorPercentage = player && player.maxHonor > 0 ? (player.currentHonor / player.maxHonor) * 100 : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {player?.avatarUrl && <AvatarImage src={player.avatarUrl} alt={player.displayName || 'User'} />}
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div>
              <p className="text-base font-medium leading-none">{player?.displayName || 'Member'}</p>
              <p className="text-xs leading-none text-muted-foreground pt-1">
                {player?.rank || 'Neophyte'}
              </p>
            </div>
             <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-primary">{(player?.currentHonor || 0).toLocaleString()} HP</span>
                    <span className="text-muted-foreground">/ {(player?.maxHonor || 0).toLocaleString()} HP</span>
                </div>
                <Progress value={honorPercentage} className="h-1.5" />
             </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {isOfficer && (
            <DropdownMenuItem asChild>
                <Link href="/officer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Council</span>
                </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
