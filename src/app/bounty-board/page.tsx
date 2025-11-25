
import { QuestCard } from "@/components/bounty-board/quest-card";
import { ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WithId, Quest } from "@/lib/types";
import { getBounties } from "@/lib/actions";

function BountiesList({ quests }: { quests: WithId<Quest>[] | null }) {
  if (!quests || quests.length === 0) {
    return <p className="text-muted-foreground">No bounties available. Check back later!</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </div>
  );
}


export default async function BountyBoardPage() {
  const quests = await getBounties();

  const shortDurationQuests = quests?.filter((q) => q.durationDays <= 4) || [];
  const longDurationQuests = quests?.filter((q) => q.durationDays > 4) || [];

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
          <CardTitle className="font-headline text-3xl">Short-Term Bounties</CardTitle>
          <p className="text-muted-foreground pt-1">Quests that are available for a limited time.</p>
        </CardHeader>
        <CardContent>
          <BountiesList quests={shortDurationQuests} />
        </CardContent>

        <Separator className="my-8" />
        
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Long-Term Bounties</CardTitle>
           <p className="text-muted-foreground pt-1">Quests that are available for an extended period.</p>
        </CardHeader>
        <CardContent>
           <BountiesList quests={longDurationQuests} />
        </CardContent>
      </Card>
    </div>
  );
}
