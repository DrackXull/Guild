"use server";

import { generateBountyBoardQuests } from "@/ai/flows/generate-bounty-board-quests";
import type { Quest } from "./types";

export async function getBounties(): Promise<Quest[]> {
  try {
    const quests = await generateBountyBoardQuests({
      playerActivity: "Player has been focusing on high-roller dungeons, playing as a Ranger. They have high kill counts but low extraction rate recently.",
    });
    return quests;
  } catch (error) {
    console.error("Error generating bounties:", error instanceof Error ? error.message : String(error));
    // Return a set of fallback quests if AI fails
    return [
      { questName: 'Headhunter', questDescription: 'Get 10 player kills confirmed via screenshot.', questType: 'daily', reward: '100 Honor' },
      { questName: 'Dedicated Reporter', questDescription: 'Submit 5 detailed run reports.', questType: 'daily', reward: '75 Honor' },
      { questName: 'Dungeon Master', questDescription: 'Successfully complete and have 10 guild runs verified.', questType: 'weekly', reward: '300 Honor' },
    ];
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
