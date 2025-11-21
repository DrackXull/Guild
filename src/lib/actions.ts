'use server';

import { generateBountyBoardQuests } from '@/ai/flows/generate-bounty-board-quests';
import { Quest, WithId } from './types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

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

export async function submitRunReport(formData: unknown) {
  // In a real app, you would validate formData against a Zod schema
  // and then save it to your database.
  console.log('Run report submitted:', formData);

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true, message: 'Run report submitted successfully!' };
}

export async function getBounties(): Promise<WithId<Quest>[]> {
    // HACK: This is a workaround to initialize Firebase on the server.
    // In a real app, you would want to use a singleton pattern to ensure
    // Firebase is only initialized once.
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    const { firestore } = getSdks(getApps()[0]);
    const bountiesCollectionRef = collection(firestore, 'bounty_board_quests');
    const q = query(bountiesCollectionRef, orderBy('questName'));
    const querySnapshot = await getDocs(q);
    const bounties: WithId<Quest>[] = [];
    querySnapshot.forEach(doc => {
        bounties.push({ id: doc.id, ...(doc.data() as Quest) });
    });
    return bounties;
}