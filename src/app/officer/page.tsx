
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Shield, ScrollText, Users, FileText, Trash2, Gem, Repeat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getBountySuggestions } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { ApplicationReview } from "@/components/officer/application-review";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockApplications, mockReviews } from "@/lib/data";
import { useEffect, useState, useTransition } from "react";
import type { Quest, MarketItem, WithId, QuestRarity, PartialPlayer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { MarketAdmin } from "@/components/market/market-admin";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useUser } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiSettingsAdmin } from "@/components/officer/ai-settings-admin";
import { Switch } from "@/components/ui/switch";

const rarities: QuestRarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const ranks = ["Neophyte", "Voyager", "Champion", "Demigod"];


function BountyAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSuggestionPending, startSuggestionTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingBounty, setEditingBounty] = useState<Partial<WithId<Quest>> | null>(null);

  const bountiesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'bounty_board_quests');
  }, [firestore]);

  const bountiesQuery = useMemoFirebase(() => {
    if (!bountiesCollectionRef) return null;
    return query(bountiesCollectionRef, orderBy('questName'));
  }, [bountiesCollectionRef]);

  const { data: bounties, isLoading } = useCollection<Quest>(bountiesQuery);

  const handleCreateOrUpdateBounty = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const questData: Quest = {
      questName: formData.get('questName') as string,
      questDescription: formData.get('questDescription') as string,
      reward: formData.get('reward') as string,
      rarity: formData.get('rarity') as QuestRarity,
      durationDays: parseInt(formData.get('durationDays') as string, 10),
      isRepeatable: formData.get('isRepeatable') === 'on',
      maxCompletions: parseInt(formData.get('maxCompletions') as string, 10),
      requiredRank: formData.get('requiredRank') as string,
    };
    
    if (!questData.questName || !questData.questDescription || !questData.reward || !questData.rarity) {
      toast({ title: "Missing Fields", description: "Please fill out all required bounty information.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (editingBounty?.id) {
      const bountyDocRef = doc(firestore, 'bounty_board_quests', editingBounty.id);
      setDocumentNonBlocking(bountyDocRef, questData);
      toast({ title: "Bounty Updated", description: `"${questData.questName}" has been updated.` });
    } else {
      addDocumentNonBlocking(collection(firestore, 'bounty_board_quests'), questData);
      toast({ title: "Bounty Created", description: `"${questData.questName}" has been added.` });
    }

    (event.target as HTMLFormElement).reset();
    setEditingBounty(null);
    setIsSubmitting(false);
  };
  
  const handleEditBounty = (bounty: WithId<Quest>) => {
    setEditingBounty(bounty);
  }

  const handleRemoveBounty = (bountyId: string, bountyName: string) => {
    if (!firestore) return;
    if (editingBounty?.id === bountyId) {
      setEditingBounty(null); 
    }
    const bountyDocRef = doc(firestore, 'bounty_board_quests', bountyId);
    deleteDocumentNonBlocking(bountyDocRef);
    toast({ title: "Bounty Removed", description: `"${bountyName}" has been removed.`, variant: "destructive" });
  }

  const handleGenerateSuggestions = () => {
    startSuggestionTransition(async () => {
      const suggestions = await getBountySuggestions();
      if (suggestions && suggestions.length > 0) {
        const suggestion = suggestions[0];
        setEditingBounty(suggestion);
        toast({ title: "Suggestion Loaded", description: `AI suggestion is ready for review in the form.` });
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
          Add, edit, and manage the guild's bounties. AI suggestions will populate the form for review.
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
                    <Card key={bounty.id} className="bg-background/50 cursor-pointer hover:border-primary/50" onClick={() => handleEditBounty(bounty)}>
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-semibold">{bounty.questName}</CardTitle>
                                    <CardDescription className="text-xs pt-1 flex items-center gap-1.5"><Gem className="h-3 w-3" />{bounty.reward}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={bounty.rarity === 'Legendary' ? 'destructive' : 'secondary'}>{bounty.rarity}</Badge>
                                  {bounty.isRepeatable && <Repeat className="h-4 w-4 text-muted-foreground" />}
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleRemoveBounty(bounty.id, bounty.questName)}}>
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
        <form className="space-y-4 sticky top-4" onSubmit={handleCreateOrUpdateBounty}>
            <h3 className="font-headline text-xl font-semibold">{editingBounty ? "Edit Bounty" : "Create New Bounty"}</h3>
            <div className="space-y-2">
                <Label htmlFor="questName">Bounty Name</Label>
                <Input id="questName" name="questName" required defaultValue={editingBounty?.questName || ''} key={`name-${editingBounty?.id}`}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="questDescription">Description</Label>
                <Textarea id="questDescription" name="questDescription" rows={3} required defaultValue={editingBounty?.questDescription || ''} key={`desc-${editingBounty?.id}`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="reward">Reward</Label>
                    <Input id="reward" name="reward" placeholder="e.g., 100 Honor" required defaultValue={editingBounty?.reward || ''} key={`reward-${editingBounty?.id}`} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="rarity">Rarity</Label>
                     <Select name="rarity" required defaultValue={editingBounty?.rarity || 'Common'} key={`rarity-${editingBounty?.id}`}>
                      <SelectTrigger id="rarity">
                        <SelectValue placeholder="Select rarity" />
                      </SelectTrigger>
                      <SelectContent>
                        {rarities.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                    <Label htmlFor="durationDays">Duration (days)</Label>
                    <Input id="durationDays" name="durationDays" type="number" placeholder="e.g., 3" required defaultValue={editingBounty?.durationDays || 1} key={`duration-${editingBounty?.id}`} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="maxCompletions">Max Completions</Label>
                    <Input id="maxCompletions" name="maxCompletions" type="number" placeholder="0 for infinite" required defaultValue={editingBounty?.maxCompletions === undefined ? 0 : editingBounty.maxCompletions} key={`max-${editingBounty?.id}`} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="requiredRank">Required Rank (Optional)</Label>
                 <Select name="requiredRank" defaultValue={editingBounty?.requiredRank || undefined} key={`rank-${editingBounty?.id}`}>
                  <SelectTrigger id="requiredRank">
                    <SelectValue placeholder="No rank requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {ranks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="isRepeatable" name="isRepeatable" defaultChecked={editingBounty?.isRepeatable || false} key={`repeat-${editingBounty?.id}`}/>
                <Label htmlFor="isRepeatable">Repeatable by same player?</Label>
            </div>
            <div className="flex gap-2 pt-4">
              {editingBounty && <Button type="button" variant="secondary" className="w-full" onClick={() => setEditingBounty(null)}>Cancel Edit</Button>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBounty ? 'Save Changes' : 'Create Bounty'}
              </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function OfficerPage() {
  const applications = mockApplications;
  const reviews = mockReviews;

  const { user } = useUser();
  const isGuildLeader = user?.email?.toLowerCase() === 'huzzinda@gmail.com';
  const firestore = useFirestore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleGrantAdmin = () => {
      if (isProcessing || !firestore || !user) return;

      setIsProcessing(true);
      const adminRoleRef = doc(firestore, `roles_admin/${user.uid}`);
      const officerRoleRef = doc(firestore, `roles_officer/${user.uid}`);
      const playerDocRef = doc(firestore, `players/${user.uid}`);

      const newPlayerData: PartialPlayer = {
          displayName: user.email?.split('@')[0] || 'Guild Leader',
          discordTag: 'Admin#0001',
          friends: [],
          isOnline: true,
          lifetimeHonor: 100000,
          currentHonor: 100000,
          maxHonor: 100000,
          avatarUrl: '',
          role: 'admin',
      };
      
      setDocumentNonBlocking(adminRoleRef, { assignedAt: new Date().toISOString() });
      setDocumentNonBlocking(officerRoleRef, { assignedAt: new Date().toISOString() });
      setDocumentNonBlocking(playerDocRef, newPlayerData);

      toast({
          title: "Guild Leader Role Assigned",
          description: "Your player profile has been created. The page will now reload to grant you full access.",
          duration: 5000,
      });
      
      setTimeout(() => window.location.reload(), 2000);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-wide">Council Chambers</h1>
          <p className="text-muted-foreground mt-1">Manage guild settings, applications, bounties, and the market.</p>
        </div>
      </div>
      
      {isGuildLeader && (
        <Card className="border-primary/50">
          <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-3"><Shield className="text-primary"/> First-Time Admin Setup</CardTitle>
              <CardDescription>
                  This is a one-time setup to grant your account full administrative privileges and create your player profile.
              </CardDescription>
          </CardHeader>
          <CardFooter>
                <Button onClick={handleGrantAdmin} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shield className="mr-2 h-4 w-4"/>}
                  Force Admin Init
              </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <CardTitle className="font-headline text-2xl">Applicant Trials</CardTitle>
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

      <MarketAdmin />

      <Separator />

      <AiSettingsAdmin />

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <CardTitle className="font-headline text-2xl">Council Activity Log</CardTitle>
          </div>
          <CardDescription>
            A transparent record of all council and automated guild actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Activity log coming soon...</p>
        </CardContent>
      </Card>

    </div>
  );
}
