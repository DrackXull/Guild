
'use server';

import { ai } from '@/ai/genkit';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { collection, getDocs } from 'firebase/firestore';
import { z } from 'zod';
import type { WithId, MarketItem } from './types';


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
