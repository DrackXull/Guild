
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Landmark, Loader2, Tag, Trash2, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import type { GuildSettings } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

const guildSettingsSchema = z.object({
    guildName: z.string().min(3, "Guild name must be at least 3 characters long.").max(50, "Guild name cannot exceed 50 characters."),
    traitOptions: z.array(z.string().min(1, "Trait cannot be empty").max(20, "Trait cannot exceed 20 characters.")).optional(),
});

type GuildSettingsFormValues = z.infer<typeof guildSettingsSchema>;

export function GuildSettingsAdmin() {
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings/guild');
    }, [firestore]);

    const { data: settings, isLoading } = useDoc<GuildSettings>(settingsDocRef);
    
    const form = useForm<GuildSettingsFormValues>({
        resolver: zodResolver(guildSettingsSchema),
        defaultValues: {
            guildName: "Black Lantern Company",
            traitOptions: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "traitOptions"
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                guildName: settings.guildName || "Black Lantern Company",
                traitOptions: settings.traitOptions || [],
            });
        }
    }, [settings, form]);
    
    const { handleSubmit, control, formState: { isSubmitting } } = form;

    const onSubmit = (data: GuildSettingsFormValues) => {
        if (!settingsDocRef) return;
        
        setDocumentNonBlocking(settingsDocRef, data, { merge: true });

        toast({
            title: "Guild Settings Saved",
            description: "The general guild settings have been updated.",
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
                    <Skeleton className="h-10 w-1/4" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Landmark className="h-6 w-6" />
                    <CardTitle className="font-headline text-2xl">General Guild Settings</CardTitle>
                </div>
                <CardDescription>
                    Manage the core identity, feedback traits, and global settings for your guild.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={control}
                            name="guildName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Guild Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is the name that will be displayed throughout the application.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="traitOptions"
                            render={() => (
                                <FormItem>
                                     <FormLabel>Run Report Feedback Traits</FormLabel>
                                     <FormDescription>
                                        Customize the one-click feedback traits available when submitting a run report. These are visible to all members.
                                     </FormDescription>
                                    <div className="flex flex-wrap gap-2">
                                        {fields.map((field, index) => (
                                            <Badge key={field.id} variant="secondary" className="flex items-center gap-2">
                                                {form.watch(`traitOptions.${index}`)}
                                                <button type="button" onClick={() => remove(index)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                    <X className="h-3 w-3"/>
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            id="new-trait"
                                            placeholder="e.g., Good Leader"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const value = e.currentTarget.value.trim();
                                                    if (value) {
                                                        append(value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                const input = document.getElementById('new-trait') as HTMLInputElement;
                                                const value = input?.value.trim();
                                                if (value) {
                                                    append(value);
                                                    input.value = '';
                                                }
                                            }}
                                        >
                                            Add Trait
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                       
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Guild Settings
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
