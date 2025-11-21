'use server';
/**
 * @fileOverview Generates daily and weekly bounty board quests using AI, tailored to player activity.
 *
 * - generateBountyBoardQuests - A function that generates bounty board quests.
 * - GenerateBountyBoardQuestsInput - The input type for the generateBountyBoardQuests function.
 * - GenerateBountyBoardQuestsOutput - The return type for the generateBountyBoardQuests function.
 */

import {ai} from '@/ai/genkit';
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
  reward: z.string().describe('The reward for completing the quest.'),
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
  prompt: `You are the quest master for the Dark and Darker Guild Hub.

You will generate a list of daily and weekly quests for players to complete.

The quests should be engaging and tailored to the player's recent activity. The quests must be based on actions that can be verified within the app's ecosystem, such as:
- Number of player kills (verified by screenshot)
- Number of guild runs completed (verified by at least 2 other players)
- Number of run reports submitted
- Number of boss kills (verified by screenshot)
- Extracting from a run

Do NOT generate quests for actions that cannot be tracked, such as killing a specific number of AI monsters (e.g., "Kill 50 Goblins").

Player Activity: {{{playerActivity}}}

Generate a list of quests with the following properties:
- questName: The name of the quest.
- questDescription: A description of the quest.
- questType: The type of quest (daily or weekly).
- reward: The reward for completing the quest.

Return the quests as a JSON array.
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
