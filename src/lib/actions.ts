"use server";

import { generateBountyBoardQuests } from "@/ai/flows/generate-bounty-board-quests";
import { suggestRunFeedbackTraits } from "@/ai/flows/suggest-run-feedback-traits";
import type { Quest } from "./types";
import { z } from "zod";

export async function getBounties(): Promise<Quest[]> {
  try {
    const quests = await generateBountyBoardQuests({
      playerActivity: "Player has been focusing on high-roller dungeons, playing as a Ranger. They have high kill counts but low extraction rate recently.",
    });
    return quests;
  } catch (error) {
    console.error("Error generating bounties:", error);
    // Return a set of fallback quests if AI fails
    return [
      { questName: 'Goblin Slayer', questDescription: 'Kill 50 Goblins in the Goblin Caves.', questType: 'daily', reward: '50 Honor' },
      { questName: 'Treasurer', questDescription: 'Extract with at least 1000 gold worth of loot.', questType: 'daily', reward: '75 Honor' },
      { questName: 'Crypt Delver', questDescription: 'Successfully extract from the Crypts 5 times.', questType: 'weekly', reward: '250 Honor' },
    ];
  }
}

const SuggestTraitsSchema = z.object({
  runNotes: z.string(),
});

export async function suggestTraits(input: { runNotes: string }): Promise<{ suggestedTraits: string[] }> {
  const parsedInput = SuggestTraitsSchema.safeParse(input);
  if (!parsedInput.success) {
    return { suggestedTraits: [] };
  }
  
  try {
    const result = await suggestRunFeedbackTraits(parsedInput.data);
    return result;
  } catch (error) {
    console.error("Error suggesting traits:", error);
    return { suggestedTraits: [] };
  }
}

export async function submitRunReport(formData: unknown) {
  // In a real app, you would validate formData against a Zod schema
  // and then save it to your database.
  console.log("Run report submitted:", formData);

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, message: "Run report submitted successfully!" };
}
