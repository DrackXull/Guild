
'use client';
import { QuestCard } from "@/components/bounty-board/quest-card";
import { ScrollText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WithId, Quest } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

function BountiesList({ quests, isLoading }: { quests: WithId<Quest>[] | null, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-64 animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }
  
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


export default function BountyBoardPage() {
  const firestore = useFirestore();

  const bountiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bounty_board_quests'), orderBy('questName'));
  }, [firestore]);

  const { data: quests, isLoading } = useCollection<Quest>(bountiesQuery);

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
          <BountiesList quests={shortDurationQuests} isLoading={isLoading} />
        </CardContent>

        <Separator className="my-8" />
        
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Long-Term Bounties</CardTitle>
           <p className="text-muted-foreground pt-1">Quests that are available for an extended period.</p>
        </CardHeader>
        <CardContent>
           <BountiesList quests={longDurationQuests} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
