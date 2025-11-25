
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Player, WithId } from "@/lib/types";
import { collection, query, orderBy } from "firebase/firestore";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const guildRanks: { rank: string; description: string; honorRequirement: number }[] = [
    { rank: 'Neophyte', description: 'A new recruit, learning the ropes and proving their worth in the dungeons.', honorRequirement: 0 },
    { rank: 'Initiate', description: 'A member who has shown dedication and completed several successful runs.', honorRequirement: 1000 },
    { rank: 'Soldier', description: 'A dependable combatant, regularly participating in guild activities and runs.', honorRequirement: 2500 },
    { rank: 'Sergeant', description: 'A seasoned member who begins to show leadership qualities and helps guide newer recruits.', honorRequirement: 5000 },
    { rank: 'Knight', description: 'A proven warrior, respected for their skill, honor, and commitment to the guild.', honorRequirement: 10000 },
    { rank: 'Captain', description: 'An exemplary member trusted with leading parties and upholding the guild\'s values.', honorRequirement: 20000 },
    { rank: 'Champion', description: 'A celebrated hero of the guild, known for their exceptional prowess and numerous victories.', honorRequirement: 50000 },
    { rank: 'Elder', description: 'A veteran member whose wisdom and experience are invaluable to the guild council.', honorRequirement: 100000 },
    { rank: 'Legend', description: 'A living legend whose deeds are sung in taverns and recorded in the guild\'s history.', honorRequirement: 250000 }
];


function MemberRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
        </TableRow>
    )
}

function MemberList() {
    const firestore = useFirestore();

    const playersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'players'), orderBy('lifetimeHonor', 'desc'));
    }, [firestore]);

    const { data: players, isLoading } = useCollection<Player>(playersQuery);

    return (
         <Card>
            <CardHeader>
                <CardTitle>Guild Roster</CardTitle>
                <CardDescription>All active members of the guild.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead className="text-right">Lifetime Honor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && [...Array(5)].map((_, i) => <MemberRowSkeleton key={i} />)}
                        {!isLoading && players?.map((player) => (
                            <TableRow key={player.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={player.avatarUrl} />
                                            <AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{player.displayName}</div>
                                            <div className="text-sm text-muted-foreground">{player.discordTag}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{player.rank || 'Neophyte'}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">{(player.lifetimeHonor || 0).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && (!players || players.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    The guild roster is currently empty.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function RankStructure() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Rank Structure</CardTitle>
                <CardDescription>Honor is earned through participation. Ranks are awarded based on lifetime honor.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-40">Rank</TableHead>
                            <TableHead className="w-48">Honor Required</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guildRanks.map(rankInfo => (
                            <TableRow key={rankInfo.rank}>
                                <TableCell className="font-semibold">{rankInfo.rank}</TableCell>
                                <TableCell className="font-mono text-primary">{(rankInfo.honorRequirement).toLocaleString()} HP</TableCell>
                                <TableCell className="text-muted-foreground">{rankInfo.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export default function MembersPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Users className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="font-headline text-4xl font-bold tracking-wide">Guild Members</h1>
                    <p className="text-muted-foreground mt-1">The brave adventurers who call our guild home.</p>
                </div>
            </div>

            <MemberList />
            <RankStructure />
        </div>
    );
}
