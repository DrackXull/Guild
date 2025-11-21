'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ScrollText, Users, FileText, Trash2, Gem, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getBountySuggestions } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { ApplicationReview } from "@/components/officer/application-review";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { marketItems as initialMarketItems, mockApplications, mockReviews } from "@/lib/data";
import { useEffect, useState, useTransition, useMemo } from "react";
import type { Quest, MarketItem, WithId } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MarketAdmin } from "@/components/market/market-admin";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useUser } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function BountyAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSuggestionPending, startSuggestionTransition] = useTransition();

  const bountiesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'bounty_board_quests');
  }, [firestore]);

  const bountiesQuery = useMemoFirebase(() => {
    if (!bountiesCollectionRef) return null;
    return query(bountiesCollectionRef, orderBy('questName'));
  }, [bountiesCollectionRef]);

  const { data: bounties, isLoading } = useCollection<Quest>(bountiesQuery);

  const handleCreateBounty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bountiesCollectionRef) return;

    const formData = new FormData(event.currentTarget);
    const newBounty = {
      questName: formData.get('questName') as string,
      questDescription: formData.get('questDescription') as string,
      reward: formData.get('reward') as string,
      questType: formData.get('questType') as 'daily' | 'weekly',
    };

    if (!newBounty.questName || !newBounty.questDescription || !newBounty.reward || !newBounty.questType) {
      toast({ title: "Missing Fields", description: "Please fill out all bounty information.", variant: "destructive" });
      return;
    }

    addDocumentNonBlocking(bountiesCollectionRef, newBounty);
    toast({ title: "Bounty Created", description: `"${newBounty.questName}" has been added.` });
    (event.target as HTMLFormElement).reset();
  };

  const handleRemoveBounty = (bountyId: string, bountyName: string) => {
    if (!firestore) return;
    const bountyDocRef = doc(firestore, 'bounty_board_quests', bountyId);
    deleteDocumentNonBlocking(bountyDocRef);
    toast({ title: "Bounty Removed", description: `"${bountyName}" has been removed.`, variant: "destructive" });
  }

  const handleGenerateSuggestions = () => {
    startSuggestionTransition(async () => {
      const suggestions = await getBountySuggestions();
      if (suggestions.length > 0 && bountiesCollectionRef) {
        // For now, let's just add the first suggestion
        const suggestionToAdd = suggestions[0];
         addDocumentNonBlocking(bountiesCollectionRef, suggestionToAdd);
         toast({ title: "Suggestion Added", description: `Added "${suggestionToAdd.questName}" to the board.` });
      } else {
        toast({ title: "No suggestions returned", variant: "destructive" });
      }
    })
  }

  return (
    <Card>
      <CardHeader>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <ScrollText className="h-6 w-6" />
                  <CardTitle className="font-headline text-2xl">Guild Bounty Administration</CardTitle>
              </div>
               <Button onClick={handleGenerateSuggestions} disabled={isSuggestionPending}>
                  {isSuggestionPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate AI Suggestion
              </Button>
          </div>
        <CardDescription>
          Add, remove, and manage the guild's daily and weekly bounties.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
            <h3 className="font-headline text-xl font-semibold">Active Bounties</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                {isLoading && (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {!isLoading && (!bounties || bounties.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">No active bounties. Create one to get started.</p>
                )}
                {bounties?.map((bounty: WithId<Quest>) => (
                    <Card key={bounty.id} className="bg-background/50">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-semibold">{bounty.questName}</CardTitle>
                                    <CardDescription className="text-xs pt-1 flex items-center gap-1.5"><Gem className="h-3 w-3" />{bounty.reward}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={bounty.questType === 'daily' ? 'default' : 'secondary'}>{bounty.questType}</Badge>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveBounty(bounty.id, bounty.questName)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{bounty.questDescription}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
        <form className="space-y-4 sticky top-4" onSubmit={handleCreateBounty}>
            <h3 className="font-headline text-xl font-semibold">Create New Bounty</h3>
            <div className="space-y-2">
                <Label htmlFor="questName">Bounty Name</Label>
                <Input id="questName" name="questName" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="questDescription">Description</Label>
                <Textarea id="questDescription" name="questDescription" rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="reward">Reward</Label>
                    <Input id="reward" name="reward" placeholder="e.g., 100 Honor" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="questType">Type</Label>
                     <Select name="questType" required defaultValue="daily">
                      <SelectTrigger id="questType">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            </div>
            <Button type="submit" className="w-full">Create Bounty</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function FirstAdminSetup() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    if (!user || user.email !== 'Huzzinda@gmail.com') {
        return null;
    }

    const handleBecomeAdmin = () => {
        if (!firestore || !user) return;

        const adminRoleRef = doc(firestore, `roles_admin/${user.uid}`);
        
        setDocumentNonBlocking(adminRoleRef, { assignedAt: new Date().toISOString() }, {});

        toast({
            title: "Admin Role Assigned",
            description: "You have been granted admin privileges. Please remove the temporary setup code now.",
        });
    };

    return (
        <Card className="border-destructive">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <UserPlus className="h-6 w-6 text-destructive" />
                    <CardTitle className="font-headline text-2xl text-destructive">One-Time Admin Setup</CardTitle>
                </div>
                <CardDescription>
                    This is a temporary panel to grant the first admin role. Click the button below to become an admin.
                    After succeeding, you should remove this functionality.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" className="w-full" onClick={handleBecomeAdmin}>
                    Become Guild Admin
                </Button>
            </CardContent>
        </Card>
    );
}

export default function OfficerPage() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>(initialMarketItems);
  const applications = mockApplications;
  const reviews = mockReviews;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Officer Lounge</h1>
          <p className="text-muted-foreground mt-1">Manage guild settings, applications, bounties, and the market.</p>
        </div>
      </div>
      
      <FirstAdminSetup />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <CardTitle className="font-headline text-2xl">Applicant Review</CardTitle>
          </div>
          <CardDescription>Review, rate, and decide on new guild applicants.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-center">Reviews</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(app => {
                const appReviews = reviews.filter(r => r.applicationId === app.id);
                const avgScore = appReviews.length > 0 ? appReviews.reduce((acc, r) => acc + r.vote, 0) / appReviews.length : 0;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.applicantName}</div>
                      <div className="text-sm text-muted-foreground">{app.discordTag}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">{appReviews.length}</TableCell>
                    <TableCell className="text-center font-mono">{avgScore.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <ApplicationReview application={app} reviews={appReviews} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      <BountyAdmin />
      
      <Separator />

      <MarketAdmin items={marketItems} setItems={setMarketItems} />

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <CardTitle className="font-headline text-2xl">Admin Activity Log</CardTitle>
          </div>
          <CardDescription>
            A transparent record of all officer and automated guild actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Activity log coming soon...</p>
        </CardContent>
      </Card>

    </div>
  );
}
