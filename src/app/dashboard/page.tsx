
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestCard } from "@/components/bounty-board/quest-card";
import {
  Gem,
  Crown,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Quest, WithId, Player } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);
  const { data: player, isLoading: isPlayerLoading } = useDoc<Player>(playerDocRef);
  const currentGuildId = player?.guildId;

  const bountiesQuery = useMemoFirebase(() => {
    if (!firestore || !currentGuildId) return null;
    // We only need a few bounties for the dashboard
    return query(
        collection(firestore, 'bounty_board_quests'), 
        where('guildId', '==', currentGuildId),
        limit(2)
    );
  }, [firestore, currentGuildId]);
  const { data: dailyBounties, isLoading: areBountiesLoading } = useCollection<Quest>(bountiesQuery);

  const isLoading = isPlayerLoading || areBountiesLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        {isPlayerLoading ? (
            <Skeleton className="h-10 w-1/2" />
        ) : (
            <h1 className="font-headline text-4xl font-bold tracking-wide">Welcome, {player?.displayName || 'Adventurer'}</h1>
        )}
        <p className="text-muted-foreground mt-1">Here's your status in the dungeons today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Honor</CardTitle>
            <Gem className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
             {isPlayerLoading ? <Skeleton className="h-7 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{(player?.currentHonor || 0).toLocaleString()} HP</div>
                <p className="text-xs text-muted-foreground">Ready to spend</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Honor</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isPlayerLoading ? <Skeleton className="h-7 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{(player?.maxHonor || 0).toLocaleString()} HP</div>
                <p className="text-xs text-muted-foreground">Highest ever held</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Honor</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPlayerLoading ? <Skeleton className="h-7 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{(player?.lifetimeHonor || 0).toLocaleString()} HP</div>
                <p className="text-xs text-muted-foreground">Total earned</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-3xl font-bold">Daily Bounties</h2>
            <Button variant="outline" asChild>
                <Link href="/bounty-board">View All</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </>
            ) : (
              dailyBounties && dailyBounties.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))
            )}
            {!isLoading && (!dailyBounties || dailyBounties.length === 0) && <p className="text-muted-foreground col-span-2">No daily bounties available.</p>}
          </div>
        </div>
        <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
                 <CardHeader>
                    <CardTitle className="font-headline text-3xl font-bold flex items-center gap-2">
                        <Target className="text-primary"/>
                        Quick Actions
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="flex-grow flex flex-col justify-center gap-4">
                    <Button size="lg" asChild><Link href="/runs/new">Submit New Run</Link></Button>
                    <Button size="lg" variant="secondary" asChild><Link href="/profile">Manage Characters</Link></Button>
                    <Button size="lg" variant="secondary" asChild><Link href="/leaderboard">View Leaderboard</Link></Button>
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
