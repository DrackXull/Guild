
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleUser, Gem, Scroll, Loader2, User } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { MemberBounty, WithId, Player } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useToast } from "@/hooks/use-toast";
import { CreateBountyDialog } from "@/components/bounties/create-bounty-dialog";
import { getFunctions, httpsCallable } from 'firebase/functions';


function BountiesGrid({ bounties, isLoading, currentPlayer, currentPlayerId }: { bounties: WithId<MemberBounty>[] | null, isLoading: boolean, currentPlayer: Player | null, currentPlayerId: string | undefined }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const functions = getFunctions();

    const handleAcceptBounty = (bounty: WithId<MemberBounty>) => {
        if (!firestore || !currentPlayer || !currentPlayerId) return;

        if (bounty.requestingPlayerId === currentPlayerId) {
            toast({ title: "Cannot accept your own bounty", variant: "destructive" });
            return;
        }

        const bountyRef = doc(firestore, 'member_bounties', bounty.id);
        updateDocumentNonBlocking(bountyRef, {
            status: 'in_progress',
            acceptedPlayerId: currentPlayerId,
            acceptedPlayerName: currentPlayer.displayName,
        });

        toast({ title: "Bounty Accepted!", description: `You are now in progress on "${bounty.title}".` });
    }

    const handleMarkComplete = async (bounty: WithId<MemberBounty>) => {
        if (!firestore || !currentPlayerId) return;
        if (bounty.requestingPlayerId !== currentPlayerId) {
            toast({ title: "Only the creator can mark a bounty as complete.", variant: 'destructive' });
            return;
        }
        if (!bounty.acceptedPlayerId) {
            toast({ title: "Cannot complete a bounty that has not been accepted.", variant: 'destructive' });
            return;
        }

        try {
            const awardBountyHonor = httpsCallable(functions, 'awardBountyHonor');
            await awardBountyHonor({ bountyId: bounty.id });

            toast({ title: "Bounty Completed!", description: `"${bounty.title}" has been marked as complete and honor has been awarded.` });
        } catch(error) {
            console.error("Error completing bounty:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Completion Failed", description: errorMessage, variant: 'destructive' });
        }
    }

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
                         {bounty.status === 'open' && (
                             <Button className="w-full" onClick={() => handleAcceptBounty(bounty)} disabled={bounty.requestingPlayerId === currentPlayerId}>
                                Accept Bounty
                             </Button>
                         )}
                         {bounty.status === 'in_progress' && (
                            <>
                                {bounty.acceptedPlayerId === currentPlayerId ? (
                                    <Button variant="secondary" className="w-full cursor-default">You accepted this bounty</Button>
                                ) : (
                                    <Button variant="secondary" className="w-full cursor-default">
                                        In Progress by {bounty.acceptedPlayerName}
                                    </Button>
                                )}
                                {bounty.requestingPlayerId === currentPlayerId && (
                                    <Button variant="outline" size="sm" onClick={() => handleMarkComplete(bounty)}>
                                        Mark as Complete
                                    </Button>
                                )}
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
    const { user } = useUser();

    const bountiesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'member_bounties'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const playerDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'players', user.uid);
    }, [user, firestore]);

    const { data: bounties, isLoading } = useCollection<MemberBounty>(bountiesQuery);
    const { data: player, isLoading: isPlayerLoading } = useDoc<Player>(playerDocRef);

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
                {player && <CreateBountyDialog player={player} />}
            </div>
            
            <BountiesGrid bounties={bounties} isLoading={isLoading || isPlayerLoading} currentPlayer={player} currentPlayerId={user?.uid}/>
        </div>
    );
}

    