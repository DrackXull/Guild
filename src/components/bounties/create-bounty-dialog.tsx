
'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@/lib/types";

const createBountySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(50, "Title cannot exceed 50 characters."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(200, "Description cannot exceed 200 characters."),
  reward: z.coerce.number().min(1, "Reward must be at least 1 Honor Point."),
});

type CreateBountyFormValues = z.infer<typeof createBountySchema>;

interface CreateBountyDialogProps {
    player: Player;
}

export function CreateBountyDialog({ player }: CreateBountyDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateBountyFormValues>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      title: "",
      description: "",
      reward: 10,
    },
  });
  
  const { formState: { isSubmitting }, watch } = form;
  const rewardValue = watch('reward');

  const onSubmit = (data: CreateBountyFormValues) => {
    if (!firestore || !user || !player) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (player.currentHonor < data.reward) {
        toast({ title: "Insufficient Honor", description: "You do not have enough honor to post this bounty.", variant: "destructive" });
        return;
    }

    const bountiesCollectionRef = collection(firestore, 'member_bounties');
    const newBounty = {
      requestingPlayerId: user.uid,
      requestingPlayerName: player.displayName,
      title: data.title,
      description: data.description,
      reward: data.reward,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(bountiesCollectionRef, newBounty);
    
    // Deduct honor from the player - ideally in a transaction
    const playerRef = doc(firestore, 'players', user.uid);
    updateDocumentNonBlocking(playerRef, {
        currentHonor: player.currentHonor - data.reward
    });

    toast({
      title: "Bounty Posted",
      description: `Your bounty "${data.title}" has been posted.`,
    });
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Bounty</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Create Member Bounty</DialogTitle>
          <DialogDescription>Post a task for other guild members. The reward will be deducted from your current honor upon posting.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bounty Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Need 3x Wolf Pelts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what you need done..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Honor Point Reward</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                   <FormDescription>
                     Your current honor is {player.currentHonor.toLocaleString()} HP.
                     {rewardValue > player.currentHonor && <span className="text-destructive font-bold"> You don't have enough honor for this reward.</span>}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting || rewardValue > player.currentHonor}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Post Bounty
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    