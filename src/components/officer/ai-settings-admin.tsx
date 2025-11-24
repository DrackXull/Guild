'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Wand2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import type { GuildSettings } from "@/lib/types";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Skeleton } from "../ui/skeleton";

const aiSettingsSchema = z.object({
    enableAutoBoosting: z.boolean().default(false),
    boostPercentage: z.number().min(0).max(100).default(50),
    maxAttempts: z.number().min(1).max(10).default(3),
});

type AiSettingsFormValues = z.infer<typeof aiSettingsSchema>;

export function AiSettingsAdmin() {
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings/guild');
    }, [firestore]);

    const { data: settings, isLoading } = useDoc<GuildSettings>(settingsDocRef);
    
    const form = useForm<AiSettingsFormValues>({
        resolver: zodResolver(aiSettingsSchema),
        defaultValues: {
            enableAutoBoosting: false,
            boostPercentage: 50,
            maxAttempts: 3,
        }
    });

    useEffect(() => {
        if (settings?.bountyAI) {
            form.reset(settings.bountyAI);
        }
    }, [settings, form]);
    
    const { handleSubmit, control, watch, formState: { isSubmitting } } = form;
    const watchedBoost = watch('boostPercentage');

    const onSubmit = (data: AiSettingsFormValues) => {
        if (!settingsDocRef) return;
        
        setDocumentNonBlocking(settingsDocRef, { bountyAI: data }, { merge: true });

        toast({
            title: "AI Settings Saved",
            description: "The bounty AI configuration has been updated.",
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Wand2 className="h-6 w-6" />
                    <CardTitle className="font-headline text-2xl">Bounty AI Configuration</CardTitle>
                </div>
                <CardDescription>
                    Configure how the AI automatically manages and enhances guild bounties that are not being completed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={control}
                            name="enableAutoBoosting"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Enable Bounty Boosting</FormLabel>
                                        <FormDescription>
                                            Allow the AI to automatically repost and boost the reward for expiring, uncompleted bounties.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="boostPercentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reward Boost ({watchedBoost}%)</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={10}
                                            max={100}
                                            step={5}
                                            value={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                            disabled={!watch('enableAutoBoosting')}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The percentage of the original Honor value to add on each repost.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name="maxAttempts"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Reposts Before Review</FormLabel>
                                    <FormControl>
                                         <Select 
                                            onValueChange={(value) => field.onChange(parseInt(value))} 
                                            value={String(field.value)}
                                            disabled={!watch('enableAutoBoosting')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select max attempts" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...Array(10).keys()].map(i => (
                                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                                        {i + 1} attempt{i > 0 ? 's' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                       How many times an incomplete bounty should be reposted before it is flagged for officer review.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save AI Settings
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
