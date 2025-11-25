
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Gem, Shield, Users, UserCircle, Crown, UserPlus, Loader2 } from "lucide-react";
import { CharacterCard } from "@/components/profile/character-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Player, WithId, Character, CharacterClass } from "@/lib/types";
import { characterClasses } from "@/lib/data";
import { useCollection } from "@/firebase/firestore/use-collection";
import { query } from "firebase/firestore";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const createCharacterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(20, "Name cannot exceed 20 characters."),
  characterClass: z.string().min(1, "Please select a class."),
});

type CreateCharacterFormValues = z.infer<typeof createCharacterSchema>;

function CreateCharacterDialog() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateCharacterFormValues>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      name: "",
      characterClass: "",
    },
  });

  const onSubmit = (data: CreateCharacterFormValues) => {
    if (!firestore || !user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const charactersCollectionRef = collection(firestore, `users/${user.uid}/characters`);
    const newCharacter: Omit<Character, 'id'> = {
      playerId: user.uid,
      name: data.name,
      characterClass: data.characterClass as CharacterClass,
      totalBossKills: 0,
      isConfirmed: false,
      confirmedKills: 0,
      unconfirmedKills: 0,
    };

    addDocumentNonBlocking(charactersCollectionRef, newCharacter);
    toast({
      title: "Character Created",
      description: `${data.name} the ${data.characterClass} is ready for adventure!`,
    });
    form.reset();
    setIsOpen(false);
  };

  return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Character</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Create New Character</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Character Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="characterClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {characterClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="p-0 pt-4">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Create
              </Button>
            </CardFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function FirstAdminSetup() {
    const { user, isUserLoading: isUserAuthLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const isGuildLeaderEmail = user?.email?.toLowerCase() === 'huzzinda@gmail.com';

    const playerDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'players', user.uid);
    }, [user, firestore]);
    const { data: player, isLoading: isPlayerDocLoading } = useDoc<Player>(playerDocRef);

    const isLoading = isUserAuthLoading || (user && isPlayerDocLoading);

    const handleGrantAdmin = () => {
        if (isProcessing || !firestore || !user) return;

        setIsProcessing(true);
        const adminRoleRef = doc(firestore, `roles_admin/${user.uid}`);
        const officerRoleRef = doc(firestore, `roles_officer/${user.uid}`);
        const playerDocRef = doc(firestore, `players/${user.uid}`);

        const newPlayerData: Omit<Player, 'id' | 'characters'> = {
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
        
        // Non-blocking writes
        setDocumentNonBlocking(adminRoleRef, { assignedAt: new Date().toISOString() });
        setDocumentNonBlocking(officerRoleRef, { assignedAt: new Date().toISOString() });
        setDocumentNonBlocking(playerDocRef, newPlayerData);

        toast({
            title: "Guild Leader Role Assigned",
            description: "Your player profile has been created. The page will now reload to grant you full access.",
            duration: 5000,
        });
        
        // Reload the page to apply the new role and data
        setTimeout(() => window.location.reload(), 2000);
    };

    if (isLoading) {
        return (
            <Card className="border-primary/50 mb-8">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                        <p>Checking for Guild Leader status...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    // Only show this button for the specific user IF they don't have a player profile yet.
    if (isGuildLeaderEmail && !player) {
         return (
            <Card className="border-primary/50 mb-8">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">First-Time Admin Setup</CardTitle>
                    <CardDescription>
                        As the Guild Leader, you need to initialize your player profile and grant yourself admin privileges.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGrantAdmin} disabled={isProcessing} className="w-full" size="lg">
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin"/> : <Shield className="mr-2 h-5 w-5"/>}
                        Grant Admin Access
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null;
}

function ProfileContent({ player }: { player: WithId<Player> }) {
    const firestore = useFirestore();
    const friendCount = player.friends?.length || 0;
    
    const charactersQuery = useMemoFirebase(() => {
        if (!firestore || !player.id) return null;
        return query(collection(firestore, `users/${player.id}/characters`));
    }, [firestore, player.id]);

    const { data: characters, isLoading: isLoadingCharacters } = useCollection<Character>(charactersQuery);

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
                    <Dialog>
                    <DialogTrigger asChild>
                        <Button>Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="displayName" className="text-right">Display Name</Label>
                            <Input id="displayName" defaultValue={player.displayName} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="discordTag" className="text-right">Discord Tag</Label>
                            <Input id="discordTag" defaultValue={player.discordTag} className="col-span-3" />
                        </div>
                        </div>
                        <Button type="submit">Save Changes</Button>
                    </DialogContent>
                    </Dialog>
                </div>
                </CardHeader>
            </Card>
            
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-headline text-3xl font-bold">My Characters</h2>
                    <div className="flex gap-2">
                      <CreateCharacterDialog />
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
  const { data: player, isLoading: isPlayerLoading } = useDoc<Player>(playerDocRef);

  const isLoading = isUserLoading || (user && isPlayerLoading);
  
  return (
      <div className="space-y-8 container mx-auto p-4 md:p-6 lg:p-8">
          <FirstAdminSetup />
          
          {isLoading ? (
              <div className="flex justify-center items-center">
                {/* Don't show a loader here if FirstAdminSetup is already showing one */}
              </div>
          ) : player ? (
              <ProfileContent player={player} />
          ) : (
             user && !player && user.email?.toLowerCase() !== 'huzzinda@gmail.com' && (
                <div className="flex items-center gap-4">
                    <UserCircle className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold tracking-wide">My Profile</h1>
                        <p className="text-muted-foreground mt-1">
                            Your player profile is not yet active. It will be created once your application is approved.
                        </p>
                    </div>
                </div>
             )
          )}
      </div>
  );
}
