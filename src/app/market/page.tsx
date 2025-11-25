
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Gem, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import type { MarketItem, Player, WithId, Rank } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { guildRanks } from "@/app/members/page";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function MarketItemsGrid({ items, isLoading, player }: { items: WithId<MarketItem>[] | null, isLoading: boolean, player: Player | null }) {
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        );
    }

    if (!items || items.length === 0) {
        return <p className="text-muted-foreground">The market is currently empty. Check back later!</p>;
    }
    
    const getRankIndex = (rank?: Rank) => rank ? guildRanks.findIndex(r => r.rank === rank) : -1;
    const currentRankIndex = getRankIndex(player?.rank);


    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
                const requiredRankIndex = getRankIndex(item.requiredRank);
                const isRankLocked = requiredRankIndex > -1 && currentRankIndex < requiredRankIndex;

                const purchaseButton = (
                    <Button className="w-full" disabled={isRankLocked}>
                         {isRankLocked && <Lock className="mr-2 h-4 w-4" />}
                        Purchase
                    </Button>
                );

                return (
                    <Card key={item.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                <div className="flex items-center gap-1.5 font-bold text-primary">
                                    <Gem className="h-4 w-4" />
                                    <span>{item.price.toLocaleString()}</span>
                                </div>
                            </div>
                           <CardDescription>{item.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2">
                            {item.requiredRank && (
                               <p className="text-xs text-muted-foreground w-full">Requires Rank: <span className="font-bold text-foreground">{item.requiredRank}</span></p> 
                            )}
                             {isRankLocked ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild><div className="w-full">{purchaseButton}</div></TooltipTrigger>
                                        <TooltipContent>
                                            <p>You must be rank '{item.requiredRank}' to purchase this item.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                             ) : (
                                purchaseButton
                             )}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

export default function MarketPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const playerDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'players', user.uid);
    }, [user, firestore]);
    const { data: player, isLoading: isPlayerLoading } = useDoc<Player>(playerDocRef);

    const marketItemsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'guild_bank_items'), orderBy('name'));
    }, [firestore]);

    const { data: marketItems, isLoading: areItemsLoading } = useCollection<MarketItem>(marketItemsQuery);

    const isLoading = isPlayerLoading || areItemsLoading;

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Store className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold tracking-wide">Honor Market</h1>
                        <p className="text-muted-foreground mt-1">Spend your hard-earned Honor on valuable goods and services.</p>
                    </div>
                </div>
                <div className="text-right">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : (
                        <div className="flex items-center gap-2 justify-end">
                            <Gem className="h-5 w-5 text-primary"/>
                            <span className="text-2xl font-bold">{(player?.currentHonor || 0).toLocaleString()}</span>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground">Your Honor Points</p>
                </div>
            </div>

            <MarketItemsGrid items={marketItems} isLoading={areItemsLoading} player={player} />
        </div>
    );
}
