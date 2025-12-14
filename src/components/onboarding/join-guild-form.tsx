
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const joinGuildSchema = z.object({
    publicTag: z.string().min(3, "Public tag is required.").regex(/.*#\d+/, "Tag must be in the format 'name#123'."),
});

type JoinGuildFormValues = z.infer<typeof joinGuildSchema>;

export function JoinGuildForm() {
    const { user } = useUser();
    const router = useRouter();

    const form = useForm<JoinGuildFormValues>({
        resolver: zodResolver(joinGuildSchema),
        defaultValues: {
            publicTag: '',
        },
        mode: 'onChange',
    });

    const { handleSubmit, control, formState: { isSubmitting, isValid } } = form;

    const onSubmit = async (data: JoinGuildFormValues) => {
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be logged in to join a guild.", variant: "destructive" });
            return;
        }

        const functions = getFunctions();
        const joinGuildFn = httpsCallable(functions, 'joinGuildByPublicTag');

        try {
            await joinGuildFn({ publicTag: data.publicTag });

            toast({
                title: "Application Sent!",
                description: `Your request to join the guild has been sent for review.`,
            });
            // Redirect to the application status page so the user can see their pending application
            router.push('/application-status');

        } catch (error: any) {
            console.error("Error joining guild:", error);
            toast({
                title: "Join Request Failed",
                description: error.message || "An unknown error occurred. Please check the tag and try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Join an Existing Guild</CardTitle>
                <CardDescription>
                    Enter the public tag of the guild you wish to join. Your request will be sent to the guild's council for approval.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={control}
                            name="publicTag"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Guild Public Tag</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., the-iron-fist#001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !isValid}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Join Request
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
