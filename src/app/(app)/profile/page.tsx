import { mockPlayer, characterClasses } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gem, Shield, Users, UserCircle, Crown } from "lucide-react";
import { CharacterCard } from "@/components/profile/character-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ProfilePage() {
  const player = mockPlayer;
  const friendCount = player.friends.length;
  
  const charImages = Object.fromEntries(
    PlaceHolderImages.filter(p => p.id.startsWith('character-')).map(p => {
        const className = p.id.replace('character-', '');
        return [className.charAt(0).toUpperCase() + className.slice(1), p.imageUrl];
    })
  );
  
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
                  <span><span className="font-bold text-foreground">{player.maxHonor.toLocaleString()}</span> Max Honor</span>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {player.characters.map(char => (
                <CharacterCard key={char.id} character={char} imageUrl={charImages[char.characterClass as keyof typeof charImages]}/>
            ))}
        </div>
      </div>
    </div>
  );
}
