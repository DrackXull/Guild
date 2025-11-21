
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
import { Form, FormItem, FormLabel, FormControl, FormField, FormDescription, FormMessage } from '@/components/ui/form';
import { characterClasses, gameModes, bossList, daysOfWeek } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


const applicationSchema = z.object({
  applicantName: z.string().min(1, 'Name is required.'),
  inGameName: z.string().min(1, 'In-game name is required.'),
  discordTag: z.string().min(1, 'Discord tag is required.'),
  mainCharacters: z.string().min(1, "Please list your main character(s)."),
  mainClasses: z.array(z.string()).min(1, "Please select at least one class."),
  mainRoles: z.string().optional(),
  hoursInGame: z.coerce.number().min(1, 'Please enter a valid number of hours.'),
  favoriteModes: z.array(z.string()).min(1, 'Please select at least one game mode.'),
  bossesKilled: z.array(z.string()).optional(),
  memorableExperience: z.string().min(50, 'Please share a bit more (at least 50 characters).'),
  isContentCreator: z.boolean().default(false),
  twitchUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  kickUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  tiktokUrl: z.string().url().optional().or(z.literal('')),
  otherUrl: z.string().url().optional().or(z.literal('')),
  availabilityDays: z.array(z.string()).min(1, 'Please select at least one day.'),
  availabilityTimezone: z.string().min(1, 'Please select your timezone.'),
  availabilityStart: z.string().min(1, 'Please select a start time.'),
  availabilityEnd: z.string().min(1, 'Please select an end time.'),
  guildExpectations: z.string().min(20, 'Please share a bit more (at least 20 characters).'),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const LOCAL_STORAGE_KEY = 'application-draft';

const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    const time24 = `${String(hours).padStart(2, '0')}:${minutes}`;
    const h12 = ((hours + 11) % 12 + 1);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const time12 = `${h12}:${minutes} ${suffix}`;
    return { value: time24, label: `${time24} (${time12})`};
});


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
      inGameName: '',
      discordTag: '',
      mainCharacters: '',
      mainClasses: [],
      mainRoles: '',
      hoursInGame: 0,
      favoriteModes: [],
      bossesKilled: [],
      memorableExperience: '',
      isContentCreator: false,
      twitchUrl: '',
      youtubeUrl: '',
      kickUrl: '',
      twitterUrl: '',
      tiktokUrl: '',
      otherUrl: '',
      availabilityDays: [],
      availabilityTimezone: 'GMT-5',
      availabilityStart: '17:00',
      availabilityEnd: '22:00',
      guildExpectations: '',
      ...savedDraft,
    }
  });

  const { handleSubmit, control, watch, formState: { isSubmitting } } = form;

  const watchedValues = watch();
  
  useEffect(() => {
    setSavedDraft(JSON.parse(JSON.stringify(watchedValues)));
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
      attemptCount: 1, 
    };

    try {
      await addDocumentNonBlocking(applicationsCollection, applicationData);
      toast({
        title: 'Application Submitted',
        description: 'Thank you for your summons. The council will review your application.',
      });
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
                          <Input placeholder="Your preferred name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="inGameName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dark and Darker Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your character name in-game" {...field} />
                        </FormControl>
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                 <legend className="font-headline text-xl mb-2">Your Experience</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={control} name="mainCharacters" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Characters</FormLabel>
                        <FormControl><Input placeholder="e.g., Grim, Elara" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={control} name="mainClasses" render={({ field }) => (
                        <FormItem className="flex flex-col">
                           <FormLabel>Main Classes</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value?.length && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value?.length > 0
                                      ? field.value.join(", ")
                                      : "Select your class(es)"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                 <Command>
                                    <CommandInput placeholder="Search classes..." />
                                    <CommandEmpty>No class found.</CommandEmpty>
                                    <CommandList>
                                      <CommandGroup>
                                        {characterClasses.map((characterClass) => (
                                          <CommandItem
                                            key={characterClass}
                                            value={characterClass}
                                            onSelect={() => {
                                              const selected = field.value || [];
                                              const newValue = selected.includes(characterClass)
                                                ? selected.filter((c) => c !== characterClass)
                                                : [...selected, characterClass];
                                              field.onChange(newValue);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                (field.value || []).includes(characterClass) ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {characterClass}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                              </PopoverContent>
                            </Popover>
                           <FormMessage />
                        </FormItem>
                      )} />
                    <FormField control={control} name="mainRoles" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Roles (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Frontline, Support, DPS" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={control} name="hoursInGame" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours in Game (Approx.)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                 </div>
                  <FormField
                    control={control}
                    name="favoriteModes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favorite Game Modes</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {gameModes.map((mode) => (
                            <FormItem key={mode} className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(mode)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), mode])
                                      : field.onChange(
                                          (field.value || [])?.filter(
                                            (value) => value !== mode
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{mode}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="bossesKilled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bosses Killed (Optional)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {bossList.map((boss) => (
                              <FormItem key={boss} className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(boss)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValues, boss])
                                        : field.onChange(currentValues.filter((value) => value !== boss));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{boss}</FormLabel>
                              </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField control={control} name="memorableExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us a memorable or fun in-game experience.</FormLabel>
                        <FormControl><Textarea rows={4} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
              </fieldset>

               <fieldset className="space-y-4">
                <legend className="font-headline text-xl mb-2">Your Availability</legend>
                    <FormField
                        control={control}
                        name="availabilityDays"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>What days of the week do you typically play?</FormLabel>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {daysOfWeek.map((day) => (
                                    <FormItem
                                        key={day}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(day)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), day])
                                                : field.onChange(
                                                    (field.value || [])?.filter(
                                                    (value) => value !== day
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        {day}
                                        </FormLabel>
                                    </FormItem>
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <FormField control={control} name="availabilityTimezone" render={({ field }) => (
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
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={control} name="availabilityStart" render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select start time" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {timeOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={control} name="availabilityEnd" render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select end time" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {timeOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                  </div>
                   {estTime.start && estTime.end && (
                    <div className="p-3 bg-muted/30 rounded-md border border-dashed text-sm flex items-center gap-3">
                      <Info className="h-5 w-5 text-primary shrink-0"/>
                      <div>
                        For coordination, your typical hours convert to <span className="font-bold text-foreground">{estTime.start} - {estTime.end} {estAbbreviation}</span>. This helps us find you party members.
                      </div>
                    </div>
                  )}
              </fieldset>

               <fieldset className="space-y-4">
                  <legend className="font-headline text-xl mb-2">Content Creation (Optional)</legend>
                  <FormField
                    control={control}
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
                      <FormField control={control} name="twitchUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitch URL</FormLabel>
                          <FormControl><Input placeholder="https://twitch.tv/yourchannel" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={control} name="youtubeUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube URL</FormLabel>
                          <FormControl><Input placeholder="https://youtube.com/yourchannel" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={control} name="kickUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kick URL</FormLabel>
                          <FormControl><Input placeholder="https://kick.com/yourchannel" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={control} name="twitterUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter/X URL</FormLabel>
                          <FormControl><Input placeholder="https://x.com/yourhandle" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={control} name="tiktokUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok URL</FormLabel>
                          <FormControl><Input placeholder="https://tiktok.com/@yourhandle" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={control} name="otherUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other URL</FormLabel>
                          <FormControl><Input placeholder="Your personal site or other platform" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}
              </fieldset>
              
               <fieldset className="space-y-4">
                  <legend className="font-headline text-xl mb-2">Your Intentions</legend>
                   <FormField control={control} name="guildExpectations" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are you looking to gain from and add to The Black Lantern Company?</FormLabel>
                        <FormControl><Textarea rows={4} {...field} /></FormControl>
                        <FormMessage />
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

    