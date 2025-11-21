import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockPlayer, allCharacters, players } from "@/lib/data";
import { getBounties } from "@/lib/actions";
import { QuestCard } from "@/components/bounty-board/quest-card";
import {
  Shield,
  Gem,
  Skull,
  Swords,
  Target,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const player = mockPlayer;
  const bounties = await getBounties();
  const dailyBounties = bounties.filter(b => b.questType === 'daily').slice(0, 2);

  const onlineMembers = players.filter(p => p.isOnline).length;
  const totalGuildKills = allCharacters.reduce((acc, char) => acc + char.totalKills, 0);
  const totalBossKills = allCharacters.reduce((acc, char) => acc + char.totalBossKills, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-wide">Welcome, {player.displayName}</h1>
        <p className="text-muted-foreground mt-1">Here's your status in the dungeons today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineMembers}</div>
            <p className="text-xs text-muted-foreground">Ready for adventure</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guild Kills</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuildKills}</div>
            <p className="text-xs text-muted-foreground">Player kills confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boss Kills</CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBossKills}</div>
             <p className="text-xs text-muted-foreground">Across the entire guild</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Honor</CardTitle>
            <Gem className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.currentHonor.toLocaleString()} HP</div>
            <p className="text-xs text-muted-foreground">Lifetime: {player.lifetimeHonor.toLocaleString()} HP</p>
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
            {dailyBounties.map((quest) => (
              <QuestCard key={quest.questName} quest={quest} />
            ))}
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
                    <Button size="lg" variant="secondary">View Leaderboard</Button>
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
