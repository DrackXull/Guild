

'use server';

import { generateBountyBoardQuests } from '@/ai/flows/generate-bounty-board-quests';
import { MarketItem, Quest, WithId, RunReport } from './types';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { collection, getDocs } from 'firebase/firestore';

// This function is now simplified to only be used for AI generation,
// not for fetching the main list of bounties.
export async function getBountySuggestions(): Promise<Quest[]> {
  try {
    const quests = await generateBountyBoardQuests({
      playerActivity:
        'Player has been focusing on high-roller dungeons, playing as a Ranger. They have high kill counts but low extraction rate recently.',
    });
    return quests;
  } catch (error) {
    console.error(
      'Error generating bounties:',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

export async function submitRunReport(formData: Omit<RunReport, 'id' | 'createdAt' | 'reporterId' | 'guildId' | 'isConfirmed' | 'runId'>) {
  // In a real app, you would validate formData against a Zod schema
  // and then save it to your database.
  console.log('Run report submitted:', formData);

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Here you would add the logic to save the report to Firestore
  // For example:
  // const firestore = getAdminFirestore();
  // const reportData = {
  //   ...formData,
  //   reporterId: 'get-current-user-id', // Replace with actual user ID
  //   guildId: 'get-current-guild-id', // Replace with actual guild ID
  //   createdAt: new Date().toISOString(),
  //   isConfirmed: false,
  //   runId: 'generate-or-find-run-id', // Logic to group reports from the same run
  // };
  // await firestore.collection('run_reports').add(reportData);


  return { success: true, message: 'Run report submitted successfully!' };
}
