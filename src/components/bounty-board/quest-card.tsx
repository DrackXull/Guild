
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quest, WithId } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Gem, Calendar, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type QuestCardProps = {
  quest: WithId<Quest>;
};

export function QuestCard({ quest }: QuestCardProps) {
  const isDaily = quest.questType === 'daily';
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
    <Card className="flex flex-col transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl">{quest.questName}</CardTitle>
            <Badge variant={isDaily ? "default" : "secondary"} className="capitalize">
                {isDaily ? <Zap className="mr-1 h-3 w-3" /> : <Calendar className="mr-1 h-3 w-3" />}
                {quest.questType}
            </Badge>
        </div>
        <CardDescription className="pt-2">{quest.questDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow" />
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
