'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Swords, Loader2, Info } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { timezones, convertToEST, getESTAbbreviation } from '@/lib/timezones';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Form, FormItem, FormLabel, FormControl, FormField } from '@/components/ui/form';

const applicationSchema = z.object({
  applicantName: z.string().min(1, 'Name is required.'),
  discordTag: z.string().min(1, 'Discord tag is required.'),
  mainCharacters: z.string().min(1, "Please list your main character(s)."),
  mainClasses: z.string().min(1, "Please list your main class(es)."),
  mainRoles: z.string().optional(),
  hoursInGame: z.coerce.number().min(1, 'Please enter a valid number of hours.'),
  favoriteModes: z.string().min(1, 'Please list your favorite mode(s).'),
  bossesKilled: z.string().optional(),
  memorableExperience: z.string().min(50, 'Please share a bit more (at least 50 characters).'),
  isContentCreator: z.boolean().default(false),
  twitchUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  availabilityDays: z.string().min(1, 'Please state which days you typically play.'),
  availabilityTimezone: z.string().min(1, 'Please select your timezone.'),
  availabilityStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format.'),
  availabilityEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use HH:MM format.'),
  guildExpectations: z.string().min(20, 'Please share a bit more (at least 20 characters).'),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const LOCAL_STORAGE_KEY = 'application-draft';

export default function ApplyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [savedDraft, setSavedDraft] = useLocalStorage<Partial<ApplicationFormValues>>(LOCAL_STORAGE_KEY, {});

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      applicantName: '',
      discordTag: '',
      mainCharacters: '',
      mainClasses: '',
      mainRoles: '',
      hoursInGame: 0,
      favoriteModes: '',
      bossesKilled: '',
      memorableExperience: '',
      isContentCreator: false,
      twitchUrl: '',
      youtubeUrl: '',
      availabilityDays: '',
      availabilityTimezone: '',
      availabilityStart: '17:00',
      availabilityEnd: '22:00',
      guildExpectations: '',
      ...savedDraft,
    }
  });

  const { handleSubmit, control, watch, formState: { errors, isSubmitting } } = form;

  const watchedValues = watch();
  
  useEffect(() => {
    // By stringifying the watched values, we ensure this effect only runs
    // when the actual data changes, not just on re-render. This breaks the infinite loop.
    const stringifiedValues = JSON.stringify(watchedValues);
    setSavedDraft(JSON.parse(stringifiedValues));
  }, [JSON.stringify(watchedValues), setSavedDraft]);

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
      attemptCount: 1, // Will need logic to increment this later
    };

    try {
      await addDocumentNonBlocking(applicationsCollection, applicationData);
      toast({
        title: 'Application Submitted',
        description: 'Thank you for your summons. The council will review your application.',
      });
      // Clear the saved draft from local storage after successful submission
      setSavedDraft({});
      form.reset();
      router.refresh(); 
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const estTime = convertToEST(watchedValues.availabilityStart, watchedValues.availabilityEnd, watchedValues.availabilityTimezone);
  const estAbbreviation = getESTAbbreviation();

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-wide">A Summons to The Black Lantern Company</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          We seek stalwart adventurers to delve into the depths. Answer the call by completing the fields below. The council will review your petition.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><Swords/> Petition for Membership</CardTitle>
          <CardDescription>Provide as much detail as you can. Your responses here will form our first impression of you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Info */}
              <fieldset className="space-y-4">
                <legend className="font-headline text-xl mb-2">Your Identity</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name or Handle</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        {errors.applicantName && <p className="text-destructive text-xs">{errors.applicantName.message}</p>}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discordTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="player#1234" {...field} />
                        </FormControl>
                        {errors.discordTag && <p className="text-destructive text-xs">{errors.discordTag.message}</p>}
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              {/* In-Game Experience */}
              <fieldset className="space-y-4">
                 <legend className="font-headline text-xl mb-2">Your Experience</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="mainCharacters" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Characters</FormLabel>
                        <FormControl><Input placeholder="e.g., Grog, Pike" {...field} /></FormControl>
                        {errors.mainCharacters && <p className="text-destructive text-xs">{errors.mainCharacters.message}</p>}
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="mainClasses" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Classes</FormLabel>
                        <FormControl><Input placeholder="e.g., Barbarian, Cleric" {...field} /></FormControl>
                        {errors.mainClasses && <p className="text-destructive text-xs">{errors.mainClasses.message}</p>}
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="mainRoles" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Roles (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Frontline, Support, DPS" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hoursInGame" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours in Game (Approx.)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        {errors.hoursInGame && <p className="text-destructive text-xs">{errors.hoursInGame.message}</p>}
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="favoriteModes" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Favorite Game Modes</FormLabel>
                        <FormControl><Input placeholder="e.g., High-Roller Crypts, Normal Goblin Caves" {...field} /></FormControl>
                        {errors.favoriteModes && <p className="text-destructive text-xs">{errors.favoriteModes.message}</p>}
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bossesKilled" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Bosses Killed (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Lich, Ghost King, Cave Troll" {...field} /></FormControl>
                      </FormItem>
                    )} />
                 </div>
                 <FormField control={form.control} name="memorableExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us a memorable or fun in-game experience.</FormLabel>
                        <FormControl><Textarea rows={4} {...field} /></FormControl>
                        {errors.memorableExperience && <p className="text-destructive text-xs">{errors.memorableExperience.message}</p>}
                      </FormItem>
                    )} />
              </fieldset>

              {/* Availability */}
               <fieldset className="space-y-4">
                <legend className="font-headline text-xl mb-2">Your Availability</legend>
                  <FormField control={form.control} name="availabilityDays" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What days of the week do you typically play?</FormLabel>
                        <FormControl><Input placeholder="e.g., Weekdays, Weekends, Mon/Weds/Fri" {...field} /></FormControl>
                        {errors.availabilityDays && <p className="text-destructive text-xs">{errors.availabilityDays.message}</p>}
                      </FormItem>
                    )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <FormField control={form.control} name="availabilityTimezone" render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                           <FormLabel>Your Timezone</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                               <SelectTrigger id="availabilityTimezone"><SelectValue placeholder="Select your timezone" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timezones.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {errors.availabilityTimezone && <p className="text-destructive text-xs">{errors.availabilityTimezone.message}</p>}
                        </FormItem>
                      )} />
                       <FormField control={form.control} name="availabilityStart" render={({ field }) => (
                        <FormItem>
                          <FormLabel>From (24h)</FormLabel>
                          <FormControl><Input placeholder="HH:MM" {...field} /></FormControl>
                          {errors.availabilityStart && <p className="text-destructive text-xs">{errors.availabilityStart.message}</p>}
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="availabilityEnd" render={({ field }) => (
                        <FormItem>
                          <FormLabel>To (24h)</FormLabel>
                          <FormControl><Input placeholder="HH:MM" {...field} /></FormControl>
                          {errors.availabilityEnd && <p className="text-destructive text-xs">{errors.availabilityEnd.message}</p>}
                        </FormItem>
                      )} />
                  </div>
                   {estTime.start && (
                    <div className="p-3 bg-muted/30 rounded-md border border-dashed text-sm flex items-center gap-3">
                      <Info className="h-5 w-5 text-primary shrink-0"/>
                      <div>
                        For coordination, your typical hours convert to <span className="font-bold text-foreground">{estTime.start} - {estTime.end} {estAbbreviation}</span>. This helps us find you party members.
                      </div>
                    </div>
                  )}
              </fieldset>

              {/* Content Creator */}
               <fieldset className="space-y-4">
                  <legend className="font-headline text-xl mb-2">Content Creation (Optional)</legend>
                  <FormField
                    control={form.control}
                    name="isContentCreator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Are you a content creator?</FormLabel>
                      </FormItem>
                    )}
                  />
                  {watch('isContentCreator') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="twitchUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitch URL</FormLabel>
                          <FormControl><Input placeholder="https://twitch.tv/yourchannel" {...field} /></FormControl>
                          {errors.twitchUrl && <p className="text-destructive text-xs">{errors.twitchUrl.message}</p>}
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="youtubeUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube URL</FormLabel>
                          <FormControl><Input placeholder="https://youtube.com/yourchannel" {...field} /></FormControl>
                          {errors.youtubeUrl && <p className="text-destructive text-xs">{errors.youtubeUrl.message}</p>}
                        </FormItem>
                      )} />
                    </div>
                  )}
              </fieldset>
              
              {/* Final Question */}
               <fieldset className="space-y-4">
                  <legend className="font-headline text-xl mb-2">Your Intentions</legend>
                   <FormField control={form.control} name="guildExpectations" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are you looking to gain from and add to The Black Lantern Company?</FormLabel>
                        <FormControl><Textarea rows={4} {...field} /></FormControl>
                        {errors.guildExpectations && <p className="text-destructive text-xs">{errors.guildExpectations.message}</p>}
                      </FormItem>
                    )} />
              </fieldset>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Petition
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
    