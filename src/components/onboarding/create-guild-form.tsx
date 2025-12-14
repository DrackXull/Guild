
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { slugifyName, formatTagNumber } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';


const createGuildSchema = z.object({
    name: z.string().min(3, "Guild name must be at least 3 characters.").max(32, "Guild name is too long."),
    game: z.string().min(1, "You must select a primary game."),
    tagNumber: z.coerce.number().min(1, "Tag must be at least 1.").max(9999, "Tag cannot exceed 9999."),
});

type CreateGuildFormValues = z.infer<typeof createGuildSchema>;

export function CreateGuildForm() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isTagChecking, setIsTagChecking] = useState(false);
    const [isTagAvailable, setIsTagAvailable] = useState<boolean | null>(null);

    const form = useForm<CreateGuildFormValues>({
        resolver: zodResolver(createGuildSchema),
        defaultValues: {
            name: '',
            game: 'Dark and Darker',
            tagNumber: 1,
        },
        mode: 'onChange',
    });

    const { handleSubmit, control, watch, formState: { isSubmitting, isValid } } = form;

    const watchedName = watch('name');
    const watchedTagNumber = watch('tagNumber');

    const debouncedName = useDebounce(watchedName, 300);
    const debouncedTagNumber = useDebounce(watchedTagNumber, 300);

    const baseHandle = slugifyName(debouncedName);
    const publicTag = `${baseHandle}#${formatTagNumber(debouncedTagNumber)}`;

    useEffect(() => {
        const checkTagAvailability = async () => {
            if (!firestore || !baseHandle || debouncedTagNumber < 1) {
                setIsTagAvailable(null);
                return;
            }

            setIsTagChecking(true);
            setIsTagAvailable(null);

            try {
                const dirRef = doc(firestore, "guildDirectory", publicTag);
                const dirSnap = await getDoc(dirRef);
                setIsTagAvailable(!dirSnap.exists());
            } catch (error) {
                console.error("Error checking tag availability:", error);
                setIsTagAvailable(false); // Assume not available on error
            } finally {
                setIsTagChecking(false);
            }
        };

        checkTagAvailability();
    }, [firestore, publicTag, baseHandle, debouncedTagNumber]);


    const onSubmit = async (data: CreateGuildFormValues) => {
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be logged in to create a guild.", variant: "destructive" });
            return;
        }

        const functions = getFunctions();
        const createGuildFn = httpsCallable(functions, 'createGuild');

        try {
            const result = await createGuildFn({
                name: data.name,
                primaryGame: data.game,
                tagNumber: data.tagNumber,
            });

            toast({
                title: "Guild Created!",
                description: `Your guild "${data.name}" has been successfully created.`,
            });
            router.push('/dashboard'); // Redirect to dashboard after creation

        } catch (error: any) {
            console.error("Error creating guild:", error);
            toast({
                title: "Guild Creation Failed",
                description: error.message || "An unknown error occurred.",
                variant: "destructive",
            });
        }
    };

    const renderAvailability = () => {
        if (isTagChecking) {
            return <span className="text-xs flex items-center text-muted-foreground"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Checking...</span>;
        }
        if (isTagAvailable === null) {
            return null;
        }
        if (isTagAvailable) {
            return <span className="text-xs flex items-center text-green-500"><CheckCircle className="mr-1 h-3 w-3" />Available</span>;
        }
        return <span className="text-xs flex items-center text-destructive"><XCircle className="mr-1 h-3 w-3" />Taken</span>;
    }

    return (
        <Card className="w-full max-w-xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Create a New Guild</CardTitle>
                <CardDescription>
                    Establish a new community. Choose your name and tag wisely, as this will be your public identity.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Guild Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., The Iron First" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={control}
                            name="game"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Primary Game</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {/* TODO: Populate this list dynamically */}
                                            <SelectItem value="Dark and Darker">Dark and Darker</SelectItem>
                                            <SelectItem value="Escape From Tarkov">Escape From Tarkov</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="tagNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vanity Tag</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 7" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="p-3 bg-muted/50 rounded-md border border-dashed flex items-center justify-between">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Public Tag:</span>
                                <span className="ml-2 font-mono font-bold text-foreground">{baseHandle && watchedTagNumber > 0 ? publicTag : '...'}</span>
                            </div>
                            {renderAvailability()}
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !isValid || !isTagAvailable}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Found Guild
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
