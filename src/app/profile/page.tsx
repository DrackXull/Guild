
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Gem, Shield, Users, UserCircle, Crown, UserPlus, Loader2, History } from "lucide-react";
import { CharacterCard, CreateCharacterDialog } from "@/components/profile/character-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Player, WithId, Character, CharacterClass, PartialPlayer } from "@/lib/types";
import { useCollection } from "@/firebase/firestore/use-collection";
import { query } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


const editProfileSchema = z.object({
    displayName: z.string().min(2, "Display name must be at least 2 characters.").max(24, "Display name cannot exceed 24 characters."),
    discordTag: z.string().min(2, "Discord tag must be at least 2 characters."),
    avatarUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;


function EditProfileDialog({ player }: { player: WithId<Player> }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<EditProfileFormValues>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            displayName: player.displayName,
            discordTag: player.discordTag,
            avatarUrl: player.avatarUrl || '',
        },
    });

    const onSubmit = (data: EditProfileFormValues) => {
        if (!firestore) return;

        const playerDocRef = doc(firestore, 'players', player.id);
        
        const updateData: Partial<Player> = {
            displayName: data.displayName,
            discordTag: data.discordTag,
            avatarUrl: data.avatarUrl,
        };

        // If display name has changed, log the old one
        if (data.displayName !== player.displayName) {
             const nameHistoryEntry = {
                name: player.displayName,
                changedAt: new Date().toISOString(),
            };
            // Use arrayUnion to add to the history
            (updateData as any).displayNameHistory = arrayUnion(nameHistoryEntry);
        }
        
        updateDocumentNonBlocking(playerDocRef, updateData);

        toast({
            title: "Profile Updated",
            description: "Your changes have been saved.",
        });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Edit Profile</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="displayName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="discordTag" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Discord Tag</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avatar URL</FormLabel>
                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {player.displayNameHistory && player.displayNameHistory.length > 0 && (
                            <div>
                                <h4 className="font-headline text-lg mb-2 flex items-center gap-2"><History className="h-4 w-4" /> Alias History</h4>
                                <div className="space-y-2 rounded-md border bg-muted/50 p-3 max-h-32 overflow-y-auto">
                                    {player.displayNameHistory.slice().reverse().map((entry, index) => (
                                        <div key={index} className="text-sm">
                                            <span className="font-semibold">{entry.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">({new Date(entry.changedAt).toLocaleDateString()})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <DialogFooter className="pt-4">
                           <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ProfileContent({ player }: { player: WithId<Player> }) {
    const firestore = useFirestore();
    const friendCount = player.friends?.length || 0;
    const MAX_CHARACTERS = 11;
    
    const charactersQuery = useMemoFirebase(() => {
        if (!firestore || !player.id) return null;
        return query(collection(firestore, `users/${player.id}/characters`));
    }, [firestore, player.id]);

    const { data: characters, isLoading: isLoadingCharacters } = useCollection<Character>(charactersQuery);
    
    const hasMaxCharacters = (characters?.length || 0) >= MAX_CHARACTERS;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <UserCircle className="h-10 w-10 text-primary" />
                <div>
                <h1 className="font-headline text-4xl font-bold tracking-wide">My Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your identity in the guild.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={player.avatarUrl} alt={player.displayName} />
                    <AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                    <CardTitle className="font-headline text-3xl">{player.displayName}</CardTitle>
                    <CardDescription>{player.discordTag}</CardDescription>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                        <Gem className="h-4 w-4 text-primary" />
                        <span><span className="font-bold text-foreground">{player.currentHonor.toLocaleString()}</span> Current Honor</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        <span><span className="font-bold text-foreground">{(player.maxHonor || 0).toLocaleString()}</span> Max Honor</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span><span className="font-bold text-foreground">{player.lifetimeHonor.toLocaleString()}</span> Lifetime Honor</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span><span className="font-bold text-foreground">{friendCount}</span> Friends</span>
                        </div>
                    </div>
                    </div>
                    <EditProfileDialog player={player} />
                </div>
                </CardHeader>
            </Card>
            
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-headline text-3xl font-bold">My Characters ({characters?.length || 0}/{MAX_CHARACTERS})</h2>
                    <div className="flex gap-2">
                      <CreateCharacterDialog isDisabled={hasMaxCharacters} player={player} />
                    </div>
                </div>

                {isLoadingCharacters ? (
                     <div className="flex items-center justify-center col-span-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                     </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {characters?.map(char => (
                            <CharacterCard key={char.id} character={char} />
                        ))}
                         {(!characters || characters.length === 0) && (
                            <p className="text-muted-foreground col-span-full">You have not created any characters yet.</p>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const playerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'players', user.uid);
  }, [user, firestore]);
  const { data: player, isLoading: isPlayerLoading, error } = useDoc<Player>(playerDocRef);

  const isLoading = isUserLoading || (user && isPlayerLoading);
  
  if (isLoading) {
     return (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading Profile...</p>
          </div>
      );
  }
  
  return (
      <div className="space-y-8 container mx-auto p-4 md:p-6 lg:p-8">
          {player ? (
              <ProfileContent player={player} />
          ) : (
             user && (
                <>
                  <div className="flex items-center gap-4">
                      <UserCircle className="h-10 w-10 text-primary" />
                      <div>
                          <h1 className="font-headline text-4xl font-bold tracking-wide">My Profile</h1>
                          <p className="text-muted-foreground mt-1">
                              Your player profile is not yet active. It will be created once your application is approved. If you are the guild leader, please use the setup tools in the Council Chambers.
                          </p>
                      </div>
                  </div>
                </>
             )
          )}
      </div>
  );
}
