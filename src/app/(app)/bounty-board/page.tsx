import { getBounties } from "@/lib/actions";
import { QuestCard } from "@/components/bounty-board/quest-card";
import { ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function BountyBoardPage() {
  const quests = await getBounties();
  const dailyQuests = quests.filter((q) => q.questType === "daily");
  const weeklyQuests = quests.filter((q) => q.questType === "weekly");

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <ScrollText className="h-10 w-10 text-primary" />
        <div>
            <h1 className="font-headline text-4xl font-bold tracking-wide">Bounty Board</h1>
            <p className="text-muted-foreground mt-1">New challenges await. Complete them for honor and rewards.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Daily Bounties</CardTitle>
          <p className="text-muted-foreground pt-1">Resets every 24 hours.</p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dailyQuests.map((quest) => (
            <QuestCard key={quest.questName} quest={quest} />
          ))}
          {dailyQuests.length === 0 && <p className="text-muted-foreground">No daily bounties available. Check back later!</p>}
        </CardContent>

        <Separator className="my-8" />
        
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Weekly Bounties</CardTitle>
           <p className="text-muted-foreground pt-1">Resets every 7 days.</p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {weeklyQuests.map((quest) => (
            <QuestCard key={quest.questName} quest={quest} />
          ))}
           {weeklyQuests.length === 0 && <p className="text-muted-foreground">No weekly bounties available. Check back later!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
