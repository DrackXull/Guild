
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Character } from "@/lib/types";
import { CheckCircle, Shield, Swords, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

type CharacterCardProps = {
  character: Character;
};

export function CharacterCard({ character }: CharacterCardProps) {
    const totalKills = (character.confirmedKills || 0) + (character.unconfirmedKills || 0);
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-2xl">{character.name}</CardTitle>
                <CardDescription>{character.characterClass} - Level {character.level || 'N/A'}</CardDescription>
            </div>
             <Badge variant={character.isConfirmed ? "default" : "secondary"}>
                <CheckCircle className="mr-1 h-3 w-3" />
                {character.isConfirmed ? "Verified" : "Unverified"}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
         <div className="text-sm text-muted-foreground flex justify-between items-center">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> Confirmed Kills</span>
            <span className="font-bold text-foreground">{character.confirmedKills || 0}</span>
        </div>
        <div className="text-sm text-muted-foreground flex justify-between items-center">
            <span className="flex items-center gap-2"><Swords className="h-4 w-4"/> Unconfirmed Kills</span>
            <span className="font-bold text-foreground">{character.unconfirmedKills || 0}</span>
        </div>
         <div className="text-sm text-muted-foreground flex justify-between items-center">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4"/> Boss Kills</span>
            <span className="font-bold text-foreground">{character.totalBossKills || 0}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">View Details</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{character.name}</DialogTitle>
                    <DialogDescription>{character.characterClass} - Level {character.level || 'N/A'}</DialogDescription>
                </DialogHeader>
                 <div className="space-y-3 pt-4">
                    <div className="text-sm text-muted-foreground flex justify-between items-center">
                        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/> Confirmed Kills</span>
                        <span className="font-bold text-foreground">{character.confirmedKills || 0}</span>
                    </div>
                     <div className="text-sm text-muted-foreground flex justify-between items-center">
                        <span className="flex items-center gap-2"><Swords className="h-4 w-4"/> Unconfirmed Kills</span>
                        <span className="font-bold text-foreground">{character.unconfirmedKills || 0}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between items-center">
                        <span className="flex items-center gap-2"><Shield className="h-4 w-4"/> Boss Kills</span>
                        <span className="font-bold text-foreground">{character.totalBossKills || 0}</span>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <Button className="w-full">Edit Character</Button>
                    <Button variant="destructive" className="w-full">Delete</Button>
                </div>
            </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

    