
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import type { Player, WithId } from "@/lib/types";
import { collection, query, orderBy, limit, doc, where } from "firebase/firestore";
import { Trophy, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function LeaderboardRowSkeleton() {
    return (
        <TableRow>
            <TableCell className="w-16 text-center"><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
            <TableCell>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
            <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
            <TableCell className="hidden lg:table-cell text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
        </TableRow>
    )
}

export default function LeaderboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

     const playerDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'players', user.uid);
    }, [user, firestore]);
    const { data: currentPlayer } = useDoc<Player>(playerDocRef);
    const currentGuildId = currentPlayer?.guildId;

    const playersQuery = useMemoFirebase(() => {
        if (!firestore || !currentGuildId) return null;
        return query(
            collection(firestore, 'players'), 
            where('guildId', '==', currentGuildId),
            orderBy('lifetimeHonor', 'desc'),
            limit(50)
        );
    }, [firestore, currentGuildId]);

    const { data: players, isLoading } = useCollection<Player>(playersQuery);

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
        if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Trophy className="h-5 w-5 text-yellow-600" />;
        return <span className="font-bold text-lg">{rank}</span>;
    }
    
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Crown className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="font-headline text-4xl font-bold tracking-wide">Hall of Heroes</h1>
                    <p className="text-muted-foreground mt-1">Ranking of the most honorable members of the guild.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top 50 Members by Lifetime Honor</CardTitle>
                    <CardDescription>This leaderboard is updated in real-time based on all recorded actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center">Rank</TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-right">Lifetime Honor</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Current Honor</TableHead>
                                <TableHead className="hidden lg:table-cell text-right">Max Honor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && [...Array(5)].map((_, i) => <LeaderboardRowSkeleton key={i} />)}
                            {!isLoading && players?.map((player, index) => (
                                <TableRow key={player.id} className={index < 3 ? 'bg-primary/5' : ''}>
                                    <TableCell className="text-center font-bold text-lg">
                                        <div className="flex items-center justify-center h-full">
                                            {getRankBadge(index + 1)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={player.avatarUrl} />
                                                <AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{player.displayName}</div>
                                                <div className="text-sm text-muted-foreground">{player.rank || 'Member'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-primary">{(player.lifetimeHonor || 0).toLocaleString()}</TableCell>
                                    <TableCell className="hidden md:table-cell text-right">{(player.currentHonor || 0).toLocaleString()}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-right">{(player.maxHonor || 0).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && (!players || players.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        No players found. The leaderboard is empty!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
