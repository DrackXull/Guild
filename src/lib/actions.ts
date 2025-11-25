
'use server';

import { generateBountyBoardQuests } from '@/ai/flows/generate-bounty-board-quests';
import { ApiCharacter, MarketItem, Quest, WithId } from './types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
    const firestore = getAdminFirestore();
    const bountiesCollectionRef = collection(firestore, 'bounty_board_quests');
    const q = query(bountiesCollectionRef, orderBy('questName'));
    const querySnapshot = await getDocs(q);
    const bounties: WithId<Quest>[] = [];
    querySnapshot.forEach(doc => {
        bounties.push({ id: doc.id, ...(doc.data() as Quest) });
    });
    return bounties;
}

const guildBankItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    category: z.string(),
    quantity: z.number(),
});

export const getGuildBankItems = ai.defineTool(
    {
        name: 'getGuildBankItems',
        description: 'Get a list of all items currently available in the guild bank.',
        inputSchema: z.void(),
        outputSchema: z.array(guildBankItemSchema),
    },
    async () => {
        console.log('Fetching items from guild bank...');
        const firestore = getAdminFirestore();
        const itemsCollectionRef = collection(firestore, 'guild_bank_items');
        const querySnapshot = await getDocs(itemsCollectionRef);
        const items: WithId<MarketItem>[] = [];
        querySnapshot.forEach(doc => {
            items.push({ id: doc.id, ...(doc.data() as MarketItem) });
        });
        return items;
    }
);

export async function findCharacterFromApi(characterName: string) {
    const apiKey = process.env.DARKERDB_API_KEY;
    if (!apiKey) {
        console.error("DarkerDB API key is not set in environment variables.");
        return { success: false, message: "Server is not configured for API access." };
    }

    const url = `https://api.darkerdb.com/v1/characters?name=${encodeURIComponent(characterName)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("DarkerDB API request failed:", response.status, response.statusText);
            return { success: false, message: `API error: ${response.statusText}` };
        }
        const data = await response.json();
        return { success: true, data: data.body };
    } catch (error) {
        console.error("Failed to fetch from DarkerDB API:", error);
        return { success: false, message: "Failed to connect to the character database." };
    }
}
