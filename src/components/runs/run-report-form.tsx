"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2 } from "lucide-react";
import type { Character } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { mockPlayer } from "@/lib/data";

const availableTraits = ["great comms", "team player", "loot hog", "toxic"];
const RATING_LOW_THRESHOLD = 3;
const RATING_HIGH_THRESHOLD = 9;
const LOW_RATING_COMMENT_LENGTH = 140;
const HIGH_RATING_COMMENT_LENGTH = 80;

const runReportSchema = z.object({
  gameMode: z.enum(["Normal", "High-Roller"]),
  rating: z.number().min(1).max(10),
  runNotes: z.string().optional(),
  screenshot: z.any().optional(),
  teammates: z.array(
    z.object({
      characterId: z.string().min(1, "Please select a character."),
      kills: z.coerce.number().min(0),
      deaths: z.coerce.number().min(0),
      extracted: z.boolean(),
      bossKills: z.coerce.number().min(0),
      traits: z.array(z.string()),
    })
  ).min(2, "A guild run must have at least 2 teammates.").max(3, "A guild run can have at most 3 teammates."),
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

export function RunReportForm({ allCharacters }: { allCharacters: Character[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const playerCharacters = mockPlayer.characters;

  const form = useForm<RunReportFormValues>({
    resolver: zodResolver(runReportSchema),
    defaultValues: {
      gameMode: "Normal",
      rating: 5,
      teammates: [{
        characterId: "",
        kills: 0,
        deaths: 0,
        extracted: false,
        bossKills: 0,
        traits: [],
      }, {
        characterId: "",
        kills: 0,
        deaths: 0,
        extracted: false,
        bossKills: 0,
        traits: [],
      }],
      runNotes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "teammates",
  });

  const rating = form.watch("rating");
  const runNotes = form.watch("runNotes");

  const onSubmit = (data: RunReportFormValues) => {
    startTransition(async () => {
      const result = await submitRunReport(data);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle className="font-headline text-2xl">Overall Run</CardTitle></CardHeader>
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
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High-Roller">High-Roller</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <FormField
              control={form.control}
              name="runNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Run Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the run, teammate performance, notable events..." {...field} />
                  </FormControl>
                  <FormDescription>
                    {rating <= RATING_LOW_THRESHOLD && `Rating is ${rating}. Min ${LOW_RATING_COMMENT_LENGTH} chars required. (${(runNotes?.length || 0)}/${LOW_RATING_COMMENT_LENGTH})`}
                    {rating >= RATING_HIGH_THRESHOLD && `Rating is ${rating}. Min ${HIGH_RATING_COMMENT_LENGTH} chars required. (${(runNotes?.length || 0)}/${HIGH_RATING_COMMENT_LENGTH})`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="screenshot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scoreboard Screenshot (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" onChange={e => field.onChange(e.target.files)} />
                  </FormControl>
                  <FormDescription>Upload proof to have your stats confirmed.</FormDescription>
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
                  {fields.length > 2 && (
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
                            {(index === 0 ? playerCharacters : allCharacters).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.characterClass})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name={`teammates.${index}.kills`} render={({ field }) => (<FormItem><FormLabel>Kills</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`teammates.${index}.deaths`} render={({ field }) => (<FormItem><FormLabel>Deaths</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`teammates.${index}.bossKills`} render={({ field }) => (<FormItem><FormLabel>Boss Kills</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`teammates.${index}.extracted`} render={({ field }) => (<FormItem className="pt-8"><FormControl><div className="flex items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} id={`extracted-${index}`} /><label htmlFor={`extracted-${index}`} className="text-sm font-medium leading-none">Extracted</label></div></FormControl></FormItem>)} />
                  </div>

                  <FormField
                    control={form.control}
                    name={`teammates.${index}.traits`}
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Feedback Traits</FormLabel>
                          <FormDescription>Select traits that apply to this teammate's performance.</FormDescription>
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
              onClick={() => append({ characterId: "", kills: 0, deaths: 0, extracted: false, bossKills: 0, traits: [] })}
              disabled={fields.length >= 3}
            >
              Add Teammate
            </Button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Report
        </Button>
      </form>
    </Form>
  );
}
