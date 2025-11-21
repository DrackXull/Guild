'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Loader2 } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const applicationSchema = z.object({
  applicantName: z.string().min(1, 'Name is required.'),
  discordTag: z.string().min(1, 'Discord tag is required.'),
  email: z.string().email().optional().or(z.literal('')),
  server: z.string().min(1, 'Please select a server.'),
  notes: z.string().min(20, 'Please provide more detail in your notes (min 20 characters).'),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema)
  });

  const servers = [
    'NA East (Virginia)',
    'NA West (Oregon)',
    'EU Central (Frankfurt)',
    'Asia (Seoul)',
    'Asia (Tokyo)',
  ];

  const onSubmit = async (data: ApplicationFormValues) => {
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to apply.',
        variant: 'destructive',
      });
      return;
    }

    const applicationsCollection = collection(firestore, 'applications');
    const applicationData = {
      ...data,
      userId: user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await addDocumentNonBlocking(applicationsCollection, applicationData);
      toast({
        title: 'Application Submitted',
        description: 'Thank you! The council will review your application soon.',
      });
      // Potentially redirect to a "status" view on this same page
      router.refresh(); 
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <UserPlus className="h-12 w-12 text-primary mb-4" />
        <h1 className="font-headline text-4xl font-bold tracking-wide">Join the Guild</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          We are looking for dedicated adventurers to join our ranks. Fill out the application below and our officers will review it.
        </p>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Application Form</CardTitle>
          <CardDescription>Tell us about yourself. The more detail, the better.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="applicantName">Name or Handle</Label>
              <Input id="applicantName" {...register('applicantName')} />
              {errors.applicantName && <p className="text-destructive text-xs">{errors.applicantName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="discordTag">Discord Tag</Label>
              <Input id="discordTag" placeholder="player#1234" {...register('discordTag')} />
              {errors.discordTag && <p className="text-destructive text-xs">{errors.discordTag.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server">Server / Region</Label>
              <Select name="server" onValueChange={(value) => (document.getElementsByName('server')[0] as HTMLInputElement).value = value}>
                <SelectTrigger id="server">
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server} value={server}>
                      {server}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.server && <p className="text-destructive text-xs">{errors.server.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Tell us about your playstyle</Label>
              <Textarea id="notes" rows={4} placeholder="What are your goals? What kind of teammate are you? What's your availability?" {...register('notes')} />
              {errors.notes && <p className="text-destructive text-xs">{errors.notes.message}</p>}
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}