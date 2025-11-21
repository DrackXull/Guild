'use server';

/**
 * @fileOverview This file contains a Genkit flow that suggests relevant traits
 * (e.g., great comms, loot hog) based on run notes provided by a player submitting a run report.
 *
 * @Exported Members:
 *   - suggestRunFeedbackTraits: The main function to trigger the trait suggestion flow.
 *   - SuggestRunFeedbackTraitsInput: The input type for the suggestRunFeedbackTraits function.
 *   - SuggestRunFeedbackTraitsOutput: The output type for the suggestRunFeedbackTraits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRunFeedbackTraitsInputSchema = z.object({
  runNotes: z
    .string()
    .describe('Detailed notes describing the run and player behavior.'),
});
export type SuggestRunFeedbackTraitsInput = z.infer<
  typeof SuggestRunFeedbackTraitsInputSchema
>;

const SuggestRunFeedbackTraitsOutputSchema = z.object({
  suggestedTraits: z
    .array(z.string())
    .describe('An array of suggested traits based on the run notes.'),
});
export type SuggestRunFeedbackTraitsOutput = z.infer<
  typeof SuggestRunFeedbackTraitsOutputSchema
>;

export async function suggestRunFeedbackTraits(
  input: SuggestRunFeedbackTraitsInput
): Promise<SuggestRunFeedbackTraitsOutput> {
  return suggestRunFeedbackTraitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRunFeedbackTraitsPrompt',
  input: {schema: SuggestRunFeedbackTraitsInputSchema},
  output: {schema: SuggestRunFeedbackTraitsOutputSchema},
  prompt: `Based on the following run notes, suggest relevant traits from the list below:

Run Notes: {{{runNotes}}}

Traits: great comms, team player, loot hog, toxic

Output the suggestions as a JSON array of strings. Only include traits that are highly relevant to the run notes.
Do not include any explanation or other text.`,
});

const suggestRunFeedbackTraitsFlow = ai.defineFlow(
  {
    name: 'suggestRunFeedbackTraitsFlow',
    inputSchema: SuggestRunFeedbackTraitsInputSchema,
    outputSchema: SuggestRunFeedbackTraitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
