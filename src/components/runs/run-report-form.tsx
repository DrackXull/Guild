
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { submitRunReport } from "@/lib/actions";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, MapPin } from "lucide-react";
import type { Character, WithId } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { gameModes, gameMaps } from "@/lib/data";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { query, collection } from "firebase/firestore";

const availableTraits = ["great comms", "team player", "loot hog", "toxic"];
const RATING_LOW_THRESHOLD = 3;
const RATING_HIGH_THRESHOLD = 9;
const LOW_RATING_COMMENT_LENGTH = 140;
const HIGH_RATING_COMMENT_LENGTH = 80;

const runReportSchema = z.object({
  gameMode: z.string().min(1, "Please select a game mode."),
  map: z.string().optional(),
  gameType: z.enum(["PvE", "PvP"]),
  rating: z.number().min(1).max(10),
  bossesKilled: z.array(z.string()).optional(),
  runNotes: z.string().optional(),
  screenshot: z.any().optional(),
  teammates: z.array(
    z.object({
      characterId: z.string().min(1, "Please select a character."),
      kills: z.coerce.number().min(0),
      deaths: z.coerce.number().min(0),
      extracted: z.boolean(),
      // bossKills is now derived from the main `bossesKilled` array
      traits: z.array(z.string()),
      notes: z.string().optional(),
    })
  ).min(2, "A guild run must have at least 2 teammates.").max(3, "A guild run can have at most 3 teammates."),
  officerNotes: z.string().optional(),
  evidenceLinks: z.string().optional(),
  requestMeeting: z.boolean().default(false),
}).refine(data => {
  if (data.rating <= RATING_LOW_THRESHOLD) {
    return data.runNotes && data.runNotes.length >= LOW_RATING_COMMENT_LENGTH;
  }
  return true;
}, {
  message: `Comments must be at least ${LOW_RATING_COMMENT_LENGTH} characters for ratings of ${RATING_LOW_THRESHOLD} or lower.`,
  path: ["runNotes"],
}).refine(data => {
  if (data.rating >= RATING_HIGH_THRESHOLD) {
    return data.runNotes && data.runNotes.length >= HIGH_RATING_COMMENT_LENGTH;
  }
  return true;
}, {
  message: `Comments must be at least ${HIGH_RATING_COMMENT_LENGTH} characters for ratings of ${RATING_HIGH_THRESHOLD} or higher.`,
  path: ["runNotes"],
});

type RunReportFormValues = z.infer<typeof runReportSchema>;

export function RunReportForm({ allCharacters }: { allCharacters: WithId<Character>[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userCharactersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/characters`));
  }, [firestore, user]);

  const { data: playerCharacters, isLoading: isLoadingPlayerCharacters } = useCollection<Character>(userCharactersQuery);

  const form = useForm<RunReportFormValues>({
    resolver: zodResolver(runReportSchema),
    defaultValues: {
      gameMode: "Normal",
      gameType: "PvP",
      map: "none",
      rating: 5,
      bossesKilled: [],
      teammates: [{
        characterId: "",
        kills: 0,
        deaths: 0,
        extracted: false,
        traits: [],
        notes: "",
      }, {
        characterId: "",
        kills: 0,
        deaths: 0,
        extracted: false,
        traits: [],
        notes: "",
      }],
      runNotes: "",
      officerNotes: "",
      evidenceLinks: "",
      requestMeeting: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "teammates",
  });
  
  const watchedGameMode = form.watch("gameMode");
  const watchedMap = form.watch("map");
  const rating = form.watch("rating");
  const runNotes = form.watch("runNotes");
  
  const selectedMapData = gameMaps.find(m => m.name === watchedMap);
  const isGameTypeDisabled = watchedGameMode === 'Arena' || watchedGameMode === 'Adventure Mode';

  useEffect(() => {
    if (watchedGameMode === 'Arena') {
        form.setValue('gameType', 'PvP');
    } else if (watchedGameMode === 'Adventure Mode') {
        form.setValue('gameType', 'PvE');
    }
  }, [watchedGameMode, form]);


  const onSubmit = (data: RunReportFormValues) => {
    startTransition(async () => {
      // Split evidence links into an array
      const processedData = {
        ...data,
        evidenceLinks: data.evidenceLinks ? data.evidenceLinks.split(',').map(link => link.trim()) : [],
      };
      const result = await submitRunReport(processedData);
      if (result.success) {
        toast({
          title: "Report Submitted!",
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: "Submission Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };
  
  if (isLoadingPlayerCharacters) {
    return <div className="flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle className="font-headline text-2xl">Overall Run Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gameMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a game mode" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {gameModes.map((mode) => (
                            <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="map"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Map (Optional)</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value === 'none' ? undefined : value); form.setValue('bossesKilled', []); }} value={field.value || 'none'}>
                      <FormControl><SelectTrigger><MapPin className="mr-2 h-4 w-4" /><SelectValue placeholder="Select a map" /></SelectTrigger></FormControl>
                      <SelectContent>
                         <SelectItem value="none">None</SelectItem>
                        {gameMaps.map((map) => (
                            <SelectItem key={map.name} value={map.name}>{map.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gameType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Game Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isGameTypeDisabled}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="PvP" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          PvP <span className="text-muted-foreground text-xs">(Player vs. Player focus)</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="PvE" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          PvE <span className="text-muted-foreground text-xs">(Player vs. Environment focus)</span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedMapData && selectedMapData.bosses.length > 0 && (
                <FormField
                  control={form.control}
                  name="bossesKilled"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Bosses Defeated</FormLabel>
                        <FormDescription>Select any bosses you and your team defeated on this run.</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMapData.bosses.map((boss) => (
                           <FormField
                            key={boss}
                            control={form.control}
                            name="bossesKilled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(boss)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = Array.isArray(field.value) ? field.value : [];
                                        return checked
                                          ? field.onChange([...currentValues, boss])
                                          : field.onChange(
                                              currentValues.filter((value) => value !== boss)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{boss}</FormLabel>
                                </FormItem>
                              )}
                            />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Run Rating: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="runNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Run Notes (Visible to Teammates)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the run, notable events, general performance..." {...field} />
                  </FormControl>
                  <FormDescription>
                    {rating <= RATING_LOW_THRESHOLD && `Rating is ${rating}. Min ${LOW_RATING_COMMENT_LENGTH} chars required. (${(runNotes?.length || 0)}/${LOW_RATING_COMMENT_LENGTH})`}
                    {rating >= RATING_HIGH_THRESHOLD && `Rating is ${rating}. Min ${HIGH_RATING_COMMENT_LENGTH} chars required. (${(runNotes?.length || 0)}/${HIGH_RATING_COMMENT_LENGTH})`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Separator />

        <div>
          <h2 className="font-headline text-2xl mb-4">Teammate Stats & Feedback</h2>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline text-xl">{index === 0 ? "Your Character" : `Teammate ${index + 1}`}</CardTitle>
                  {fields.length > 2 && index > 1 && ( // Allow removing only teammates beyond the first two
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`teammates.${index}.characterId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Character</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a character" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {(index === 0 ? (playerCharacters || []) : (allCharacters || []))
                              .filter(c => c.id) // Ensure character has a valid ID
                              .map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.characterClass})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name={`teammates.${index}.kills`} render={({ field }) => (<FormItem><FormLabel>Player Kills</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`teammates.${index}.deaths`} render={({ field }) => (<FormItem><FormLabel>Deaths</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`teammates.${index}.extracted`} render={({ field }) => (<FormItem className="pt-8"><FormControl><div className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} id={`extracted-${index}`} /><label htmlFor={`extracted-${index}`} className="text-sm font-medium leading-none">Extracted</label></div></FormControl></FormItem>)} />
                  </div>

                  <FormField
                    control={form.control}
                    name={`teammates.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes on this Teammate</FormLabel>
                        <FormControl><Textarea rows={2} placeholder={`Public notes about ${index === 0 ? "your performance" : "this teammate"}...`} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`teammates.${index}.traits`}
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">{index === 0 ? "Self-Assessment" : "Feedback Traits"}</FormLabel>
                          <FormDescription>
                            {index === 0 ? "How do you think you performed?" : "Select traits that apply to this teammate's performance."}
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {availableTraits.map((trait) => (
                            <FormField
                              key={trait}
                              control={form.control}
                              name={`teammates.${index}.traits`}
                              render={({ field }) => {
                                return (
                                  <FormItem key={trait} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(trait)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, trait])
                                            : field.onChange(field.value?.filter((value) => value !== trait));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal capitalize">{trait}</FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ characterId: "", kills: 0, deaths: 0, extracted: false, traits: [], notes: "" })}
              disabled={fields.length >= 3}
            >
              Add Teammate
            </Button>
          </div>
        </div>

        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Confidential Report</CardTitle>
            <FormDescription>This section is for sensitive information and is only visible to Officers.</FormDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="officerNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Officer Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Report sensitive issues like toxic behavior, cheating, or other concerns here. This is NOT visible to other players." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="screenshot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scoreboard Screenshot</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={e => field.onChange(e.target.files)} />
                    </FormControl>
                    <FormDescription>Upload proof to have your stats confirmed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evidenceLinks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Links (VODs, etc.)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="https://youtube.com/watch?v=..., https://twitch.tv/videos/..." {...field} />
                    </FormControl>
                     <FormDescription>Provide comma-separated URLs to videos or other evidence.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestMeeting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I would like to request a meeting with an officer about this report.
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
          </CardContent>
        </Card>


        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Report
        </Button>
      </form>
    </Form>
  );
}
