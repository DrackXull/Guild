
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quest, WithId, QuestRarity, Player, Rank } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Gem, Calendar, Zap, Repeat, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { guildRanks } from "@/app/members/page";

type QuestCardProps = {
  quest: WithId<Quest>;
};

const rarityStyles: Record<QuestRarity, string> = {
    Common: "bg-gray-500/10 text-gray-300 border-gray-500/20",
    Uncommon: "bg-green-500/10 text-green-300 border-green-500/20",
    Rare: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    Epic: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    Legendary: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

export function QuestCard({ quest }: QuestCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);
  const { data: player } = useDoc<Player>(playerDocRef);

  const handleClaim = () => {
    toast({
      title: "Claim Submitted",
      description: `Your claim for "${quest.questName}" is being processed.`,
    });
  };

  const currentRankIndex = player?.rank ? guildRanks.findIndex(r => r.rank === player.rank) : 0;
  const requiredRankIndex = quest.requiredRank ? guildRanks.findIndex(r => r.rank === quest.requiredRank) : -1;
  const isRankLocked = requiredRankIndex !== -1 && currentRankIndex < requiredRankIndex;

  const claimButton = (
    <Button className="w-full font-bold" onClick={handleClaim} disabled={isRankLocked}>
        {isRankLocked && <Lock className="mr-2 h-4 w-4" />}
        Claim Reward
    </Button>
  );

  return (
    <Card className={cn("flex flex-col transition-all duration-300 hover:shadow-lg", rarityStyles[quest.rarity], `hover:shadow-${quest.rarity.toLowerCase()}-500/10`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl">{quest.questName}</CardTitle>
             <Badge variant="outline" className={cn("capitalize", rarityStyles[quest.rarity])}>
                {quest.rarity}
            </Badge>
        </div>
        <CardDescription className="pt-2">{quest.questDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
         <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Duration: {quest.durationDays} day{quest.durationDays > 1 ? 's' : ''}</span>
        </div>
        {quest.isRepeatable && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Repeat className="h-3 w-3" />
                <span>Repeatable</span>
            </div>
        )}
        {quest.requiredRank && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Lock className="h-3 w-3" />
                <span>Requires Rank: {quest.requiredRank}</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="flex items-center font-bold text-primary">
            <Gem className="mr-2 h-5 w-5" />
            <span>{quest.reward}</span>
        </div>
        
        {isRankLocked ? (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-full">{claimButton}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>You must be rank '{quest.requiredRank}' to claim this bounty.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : (
            claimButton
        )}
      </CardFooter>
    </Card>
  );
}
