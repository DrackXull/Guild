
'use client';

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gem, Repeat, Trash2, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { Quest, WithId, QuestRarity } from "@/lib/types";
import { getBountySuggestions } from "@/lib/actions";

const rarities: QuestRarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const ranks = ["Neophyte", "Initiate", "Soldier", "Knight", "Champion", "Elder"];

const bountySchema = z.object({
    questName: z.string().min(1, "Name is required."),
    questDescription: z.string().min(1, "Description is required."),
    reward: z.string().min(1, "Reward is required."),
    rarity: z.enum(rarities),
    durationDays: z.coerce.number().min(1),
    isRepeatable: z.boolean().default(false),
    maxCompletions: z.coerce.number().min(0),
    requiredRank: z.string().optional(),
});

type BountyFormValues = z.infer<typeof bountySchema>;


export function BountyAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSuggestionPending, startSuggestionTransition] = useTransition();
  
  const [editingBounty, setEditingBounty] = useState<Partial<WithId<Quest>> | null>(null);

  const form = useForm<BountyFormValues>({
    resolver: zodResolver(bountySchema),
    defaultValues: {
        questName: "",
        questDescription: "",
        reward: "",
        rarity: "Common",
        durationDays: 1,
        isRepeatable: false,
        maxCompletions: 0,
        requiredRank: "",
    }
  });

  const { formState: { isSubmitting }, reset } = form;

  const bountiesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'bounty_board_quests');
  }, [firestore]);

  const bountiesQuery = useMemoFirebase(() => {
    if (!bountiesCollectionRef) return null;
    return query(bountiesCollectionRef, orderBy('questName'));
  }, [bountiesCollectionRef]);

  const { data: bounties, isLoading } = useCollection<Quest>(bountiesQuery);

  const handleCreateOrUpdateBounty = (data: BountyFormValues) => {
    if (!firestore) return;

    const questData: Quest = {
      ...data,
      requiredRank: data.requiredRank === 'none' || !data.requiredRank ? undefined : data.requiredRank,
    };
    
    if (editingBounty?.id) {
      const bountyDocRef = doc(firestore, 'bounty_board_quests', editingBounty.id);
      setDocumentNonBlocking(bountyDocRef, questData);
      toast({ title: "Bounty Updated", description: `"${questData.questName}" has been updated.` });
    } else {
      addDocumentNonBlocking(collection(firestore, 'bounty_board_quests'), questData);
      toast({ title: "Bounty Created", description: `"${questData.questName}" has been added.` });
    }

    reset();
    setEditingBounty(null);
  };
  
  const handleEditBounty = (bounty: WithId<Quest>) => {
    setEditingBounty(bounty);
    reset({
      ...bounty,
      requiredRank: bounty.requiredRank || "none",
    });
  }

  const handleCancelEdit = () => {
    setEditingBounty(null);
    reset();
  }

  const handleRemoveBounty = (bountyId: string, bountyName: string) => {
    if (!firestore) return;
    if (editingBounty?.id === bountyId) {
      handleCancelEdit();
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
        setEditingBounty({ ...suggestion, id: undefined }); // Treat as a new bounty
        reset(suggestion);
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
        <form className="space-y-4 sticky top-4" onSubmit={form.handleSubmit(handleCreateOrUpdateBounty)}>
            <h3 className="font-headline text-xl font-semibold">{editingBounty ? "Edit Bounty" : "Create New Bounty"}</h3>
            <div className="space-y-2">
                <Label htmlFor="questName">Bounty Name</Label>
                <Input id="questName" {...form.register('questName')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="questDescription">Description</Label>
                <Textarea id="questDescription" rows={3} {...form.register('questDescription')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="reward">Reward</Label>
                    <Input id="reward" placeholder="e.g., 100 Honor" {...form.register('reward')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="rarity">Rarity</Label>
                     <Select name="rarity" value={form.watch('rarity')} onValueChange={(v) => form.setValue('rarity', v as QuestRarity)}>
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
                    <Input id="durationDays" type="number" {...form.register('durationDays')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="maxCompletions">Max Completions</Label>
                    <Input id="maxCompletions" type="number" placeholder="0 for infinite" {...form.register('maxCompletions')} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="requiredRank">Required Rank (Optional)</Label>
                 <Select name="requiredRank" value={form.watch('requiredRank') || "none"} onValueChange={(v) => form.setValue('requiredRank', v)}>
                  <SelectTrigger id="requiredRank">
                    <SelectValue placeholder="No rank requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ranks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="isRepeatable" {...form.register('isRepeatable')} checked={form.watch('isRepeatable')} onCheckedChange={(c) => form.setValue('isRepeatable', c)} />
                <Label htmlFor="isRepeatable">Repeatable by same player?</Label>
            </div>
            <div className="flex gap-2 pt-4">
              {editingBounty && <Button type="button" variant="secondary" className="w-full" onClick={handleCancelEdit}>Cancel Edit</Button>}
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
