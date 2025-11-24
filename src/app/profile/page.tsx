
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gem, Shield, Users, UserCircle, Crown, UserPlus, Loader2 } from "lucide-react";
import { CharacterCard } from "@/components/profile/character-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Player, WithId, Character, CharacterClass } from "@/lib/types";
import { characterClasses } from "@/lib/data";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";

function FirstAdminSetup() {
    const { user, isUserLoading: isUserAuthLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const playerDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'players', user.uid);
    }, [user, firestore]);
    const { data: player, isLoading: isPlayerDocLoading } = useDoc<Player>(playerDocRef);

    const isLoading = isUserAuthLoading || (user && isPlayerDocLoading);

    const handleBecomeAdmin = () => {
        if (!firestore || !user) return;

        const adminRoleRef = doc(firestore, `roles_admin/${user.uid}`);
        const playerDocRef = doc(firestore, `players/${user.uid}`);

        const newPlayerData: Omit<Player, 'id'> = {
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
        setDocumentNonBlocking(playerDocRef, newPlayerData);

        toast({
            title: "Guild Leader Role Assigned",
            description: "Your player profile has been created. The page will now reload to grant you full access.",
        });
        
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
    
    // This logic now runs only after loading is complete.
    if (!player && user && user.email === 'Huzzinda@gmail.com') {
      return (
          <Card className="border-destructive mb-8">
              <CardHeader>
                  <div className="flex items-center gap-3">
                      <UserPlus className="h-6 w-6 text-destructive" />
                      <CardTitle className="font-headline text-2xl text-destructive">One-Time Guild Leader Setup</CardTitle>
                  </div>
                  <CardDescription>
                      You are logged in as the designated Guild Leader. Click the button below to claim your role and create your player profile. This will grant you full access to the member hub.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button variant="destructive" className="w-full" onClick={handleBecomeAdmin}>
                      Become Guild Leader
                  </Button>
              </CardContent>
          </Card>
      );
    }

    // If not loading and the conditions are not met, render nothing.
    return null;
}


function ProfileContent({ player }: { player: WithId<Player> }) {
    const firestore = useFirestore();
    const friendCount = player.friends?.length || 0;
  
    const charImages = Object.fromEntries(
      PlaceHolderImages.filter(p => p.id.startsWith('character-')).map(p => {
          const className = p.id.replace('character-', '');
          return [className.charAt(0).toUpperCase() + className.slice(1), p.imageUrl];
      })
    );
    
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
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Create Character</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-headline text-2xl">Create New Character</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" placeholder="Character Name" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="class" className="text-right">Class</Label>
                                    <Select>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select a class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {characterClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit">Create</Button>
                        </DialogContent>
                    </Dialog>
                </div>
                {isLoadingCharacters ? (
                     <div className="flex items-center justify-center col-span-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                     </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {characters?.map(char => (
                            <CharacterCard key={char.id} character={char} imageUrl={charImages[char.characterClass as keyof typeof charImages]}/>
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          ) : player ? (
              <ProfileContent player={player} />
          ) : (
             user && !player && (
                <div className="flex items-center gap-4">
                    <UserCircle className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="font-headline text-4xl font-bold tracking-wide">My Profile</h1>
                        <p className="text-muted-foreground mt-1">
                            Your player profile has not been created yet. If you are the Guild Leader, you may see an option above to create it.
                        </p>
                    </div>
                </div>
             )
          )}
      </div>
  );
}
    

    
