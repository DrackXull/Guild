'use server';
/**
 * @fileOverview Generates daily and weekly bounty board quests using AI, tailored to player activity.
 *
 * - generateBountyBoardQuests - A function that generates bounty board quests.
 * - GenerateBountyBoardQuestsInput - The input type for the generateBountyBoardQuests function.
 * - GenerateBountyBoardQuestsOutput - The return type for the generateBountyBoardQuests function.
 */

import {ai} from '@/ai/genkit';
import { getGuildBankItems } from '@/lib/actions';
import {z} from 'genkit';

const GenerateBountyBoardQuestsInputSchema = z.object({
  playerActivity: z
    .string()
    .describe("Description of the player's recent in-game activity and stats that can be tracked by the app (e.g., number of runs, reports submitted, player kills confirmed via screenshot)."),
});
export type GenerateBountyBoardQuestsInput = z.infer<
  typeof GenerateBountyBoardQuestsInputSchema
>;

const BountyQuestSchema = z.object({
  questName: z.string().describe('The name of the quest.'),
  questDescription: z.string().describe('A description of the quest.'),
  questType: z.enum(['daily', 'weekly']).describe('The type of quest.'),
  reward: z.string().describe('The reward for completing the quest. This can be Honor Points (e.g., "500 Honor") or an item from the guild bank (e.g., "1x Minor Rune of Holding").'),
});

const GenerateBountyBoardQuestsOutputSchema = z.array(BountyQuestSchema).describe('An array of bounty board quests.');
export type GenerateBountyBoardQuestsOutput = z.infer<
  typeof GenerateBountyBoardQuestsOutputSchema
>;

export async function generateBountyBoardQuests(
  input: GenerateBountyBoardQuestsInput
): Promise<GenerateBountyBoardQuestsOutput> {
  return generateBountyBoardQuestsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBountyBoardQuestsPrompt',
  input: {schema: GenerateBountyBoardQuestsInputSchema},
  output: {schema: GenerateBountyBoardQuestsOutputSchema},
  tools: [getGuildBankItems],
  prompt: `You are the quest master for the Dark and Darker Guild Hub.

Your primary task is to generate a list of daily and weekly quests for players.

First, you MUST use the 'getGuildBankItems' tool to see which items are available in the guild bank, their quantity, and their estimated Honor value (cost).

You can create quests that reward:
1. Only Honor Points (e.g., "500 Honor").
2. An item from the guild bank (e.g., "1x Flask of Fortune").
3. A combination of both (e.g., "200 Honor + 1x Scroll of Identification").

When suggesting an item reward, you MUST respect the available quantity. Do not suggest an item if its quantity is 0.

The quests must be based on actions that can be verified within the app's ecosystem, such as:
- Number of player kills (verified by screenshot)
- Number of guild runs completed (verified by at least 2 other players)
- Number of run reports submitted
- Number of boss kills (verified by screenshot)
- Extracting from a run

Do NOT generate quests for actions that cannot be tracked, such as killing a specific number of AI monsters (e.g., "Kill 50 Goblins").

Consider the player's recent activity to tailor the quests.

Player Activity: {{{playerActivity}}}

Generate a list of quests and return them as a JSON array.
`,
});

const generateBountyBoardQuestsFlow = ai.defineFlow(
  {
    name: 'generateBountyBoardQuestsFlow',
    inputSchema: GenerateBountyBoardQuestsInputSchema,
    outputSchema: GenerateBountyBoardQuestsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
