
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircleUser, Gem, Scroll, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { MemberBounty, WithId } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function BountiesGrid({ bounties, isLoading }: { bounties: WithId<MemberBounty>[] | null, isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        );
    }
    
    if (!bounties || bounties.length === 0) {
        return <p className="text-muted-foreground text-center col-span-full py-12">No member bounties have been posted. Be the first!</p>;
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bounties.map((bounty) => (
                <Card key={bounty.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="font-headline text-xl">{bounty.title}</CardTitle>
                            <div className="flex items-center gap-1.5 font-bold text-primary">
                                <Gem className="h-4 w-4" />
                                <span>{bounty.reward.toLocaleString()}</span>
                            </div>
                        </div>
                       <CardDescription className="flex items-center gap-2 pt-1 text-xs">
                            <CircleUser className="h-3 w-3" />
                            Posted by {bounty.requestingPlayerName}
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{bounty.description}</p>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 items-stretch">
                         {bounty.status === 'open' && <Button className="w-full">Accept Bounty</Button>}
                         {bounty.status === 'in_progress' && (
                            <>
                            <Button variant="secondary" className="w-full cursor-default">In Progress by {bounty.acceptedPlayerName}</Button>
                            <Button variant="outline" size="sm">Mark Complete</Button>
                            </>
                         )}
                         {bounty.status === 'complete' && (
                            <Button variant="outline" className="w-full cursor-default" disabled>Completed by {bounty.acceptedPlayerName}</Button>
                         )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}


export default function MemberBountiesPage() {
    const firestore = useFirestore();
    const bountiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'member_bounties'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: bounties, isLoading } = useCollection<MemberBounty>(bountiesQuery);

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Scroll className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold tracking-wide">Member Bounties</h1>
                        <p className="text-muted-foreground mt-1">Post your own requests for items or services, paid for with Honor.</p>
                    </div>
                </div>
                <Button>Create Bounty</Button>
            </div>
            
            <BountiesGrid bounties={bounties} isLoading={isLoading} />
        </div>
    );
}
