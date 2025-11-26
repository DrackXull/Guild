
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Character, WithId } from "@/lib/types";
import { CheckCircle, Shield, Swords, Users, Edit, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

type CharacterCardProps = {
  character: WithId<Character>;
};

const editCharacterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(20, "Name cannot exceed 20 characters."),
});

type EditCharacterFormValues = z.infer<typeof editCharacterSchema>;

function EditCharacterDialog({ character, onOpenChange }: { character: WithId<Character>, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const form = useForm<EditCharacterFormValues>({
        resolver: zodResolver(editCharacterSchema),
        defaultValues: {
            name: character.name,
        },
    });

    const onSubmit = (data: EditCharacterFormValues) => {
        if (!firestore) return;
        const charRef = doc(firestore, `users/${character.playerId}/characters`, character.id);
        updateDocumentNonBlocking(charRef, { name: data.name });
        toast({ title: "Character Updated", description: "Your character's name has been changed." });
        onOpenChange(false); // Close the parent dialog
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full"><Edit className="mr-2 h-4 w-4"/>Edit Character</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {character.name}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Character Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
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

function DeleteCharacterAlert({ character, onOpenChange }: { character: WithId<Character>, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleDelete = () => {
        if (!firestore) return;
        const charRef = doc(firestore, `users/${character.playerId}/characters`, character.id);
        deleteDocumentNonBlocking(charRef);
        toast({
            title: "Character Deleted",
            description: `${character.name} has been retired.`,
            variant: "destructive",
        });
        onOpenChange(false);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the character "{character.name}" and all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export function CharacterCard({ character }: CharacterCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                        <EditCharacterDialog character={character} onOpenChange={setIsDialogOpen} />
                        <DeleteCharacterAlert character={character} onOpenChange={setIsDialogOpen} />
                    </div>
                </DialogContent>
            </Dialog>
        </CardFooter>
        </Card>
    );
}
