
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quest, WithId, QuestRarity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Gem, Calendar, Zap, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  const handleClaim = () => {
    // In a real app, you'd have logic to verify if the quest is completed.
    // For now, we'll just show a toast.
    toast({
      title: "Claim Submitted",
      description: `Your claim for "${quest.questName}" is being processed.`,
    });
  };

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
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="flex items-center font-bold text-primary">
            <Gem className="mr-2 h-5 w-5" />
            <span>{quest.reward}</span>
        </div>
        <Button className="w-full font-bold" onClick={handleClaim}>Claim Reward</Button>
      </CardFooter>
    </Card>
  );
}
