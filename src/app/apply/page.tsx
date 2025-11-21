'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';

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

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = form;

  const watchedValues = watch();
  
  useEffect(() => {
    setSavedDraft(watchedValues);
  }, [watchedValues, setSavedDraft]);

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Info */}
            <fieldset className="space-y-4">
              <legend className="font-headline text-xl mb-2">Your Identity</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </fieldset>

            {/* In-Game Experience */}
            <fieldset className="space-y-4">
               <legend className="font-headline text-xl mb-2">Your Experience</legend>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="mainCharacters">Main Characters</Label>
                      <Input id="mainCharacters" {...register('mainCharacters')} placeholder="e.g., Grog, Pike" />
                      {errors.mainCharacters && <p className="text-destructive text-xs">{errors.mainCharacters.message}</p>}
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="mainClasses">Main Classes</Label>
                      <Input id="mainClasses" {...register('mainClasses')} placeholder="e.g., Barbarian, Cleric" />
                      {errors.mainClasses && <p className="text-destructive text-xs">{errors.mainClasses.message}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="mainRoles">Main Roles (Optional)</Label>
                      <Input id="mainRoles" {...register('mainRoles')} placeholder="e.g., Frontline, Support, DPS" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="hoursInGame">Hours in Game (Approx.)</Label>
                      <Input id="hoursInGame" type="number" {...register('hoursInGame')} />
                      {errors.hoursInGame && <p className="text-destructive text-xs">{errors.hoursInGame.message}</p>}
                  </div>
                   <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="favoriteModes">Favorite Game Modes</Label>
                      <Input id="favoriteModes" {...register('favoriteModes')} placeholder="e.g., High-Roller Crypts, Normal Goblin Caves"/>
                      {errors.favoriteModes && <p className="text-destructive text-xs">{errors.favoriteModes.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bossesKilled">Bosses Killed (Optional)</Label>
                      <Input id="bossesKilled" {...register('bossesKilled')} placeholder="e.g., Lich, Ghost King, Cave Troll"/>
                  </div>
               </div>
               <div className="space-y-2">
                    <Label htmlFor="memorableExperience">Tell us a memorable or fun in-game experience.</Label>
                    <Textarea id="memorableExperience" rows={4} {...register('memorableExperience')} />
                    {errors.memorableExperience && <p className="text-destructive text-xs">{errors.memorableExperience.message}</p>}
                </div>
            </fieldset>

            {/* Availability */}
             <fieldset className="space-y-4">
              <legend className="font-headline text-xl mb-2">Your Availability</legend>
                <div className="space-y-2">
                  <Label htmlFor="availabilityDays">What days of the week do you typically play?</Label>
                  <Input id="availabilityDays" {...register('availabilityDays')} placeholder="e.g., Weekdays, Weekends, Mon/Weds/Fri" />
                  {errors.availabilityDays && <p className="text-destructive text-xs">{errors.availabilityDays.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="availabilityTimezone">Your Timezone</Label>
                       <Controller
                        name="availabilityTimezone"
                        control={control}
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="availabilityTimezone"><SelectValue placeholder="Select your timezone" /></SelectTrigger>
                            <SelectContent>
                              {timezones.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.availabilityTimezone && <p className="text-destructive text-xs">{errors.availabilityTimezone.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="availabilityStart">From (24h)</Label>
                        <Input id="availabilityStart" {...register('availabilityStart')} placeholder="HH:MM"/>
                        {errors.availabilityStart && <p className="text-destructive text-xs">{errors.availabilityStart.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="availabilityEnd">To (24h)</Label>
                        <Input id="availabilityEnd" {...register('availabilityEnd')} placeholder="HH:MM"/>
                         {errors.availabilityEnd && <p className="text-destructive text-xs">{errors.availabilityEnd.message}</p>}
                    </div>
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
                <Controller
                  name="isContentCreator"
                  control={control}
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
                    <div className="space-y-2">
                      <Label htmlFor="twitchUrl">Twitch URL</Label>
                      <Input id="twitchUrl" {...register('twitchUrl')} placeholder="https://twitch.tv/yourchannel" />
                       {errors.twitchUrl && <p className="text-destructive text-xs">{errors.twitchUrl.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl">YouTube URL</Label>
                      <Input id="youtubeUrl" {...register('youtubeUrl')} placeholder="https://youtube.com/yourchannel" />
                       {errors.youtubeUrl && <p className="text-destructive text-xs">{errors.youtubeUrl.message}</p>}
                    </div>
                  </div>
                )}
            </fieldset>
            
            {/* Final Question */}
             <fieldset className="space-y-4">
                <legend className="font-headline text-xl mb-2">Your Intentions</legend>
                 <div className="space-y-2">
                    <Label htmlFor="guildExpectations">What are you looking to gain from and add to The Black Lantern Company?</Label>
                    <Textarea id="guildExpectations" rows={4} {...register('guildExpectations')} />
                    {errors.guildExpectations && <p className="text-destructive text-xs">{errors.guildExpectations.message}</p>}
                </div>
            </fieldset>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Petition
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
