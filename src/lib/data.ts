
import { Player, Character, CharacterClass, Application, ApplicationReview, MarketItem, MemberBounty } from './types';
import { PlaceHolderImages } from './placeholder-images';

const avatar1 = PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || 'https://picsum.photos/seed/warrior/100/100';
const avatar2 = PlaceHolderImages.find(img => img.id === 'user-avatar-2')?.imageUrl || 'https://picsum.photos/seed/rogue/100/100';
const avatar3 = PlaceHolderImages.find(img => img.id === 'user-avatar-3')?.imageUrl || 'https://picsum.photos/seed/mage/100/100';


const characters: Omit<Character, 'confirmedKills' | 'unconfirmedKills'>[] = [
  { id: 'char1', playerId: 'player1', name: 'Valerius', characterClass: 'Barbarian', totalKills: 120, totalDeaths: 30, totalBossKills: 5, isConfirmed: true },
  { id: 'char2', playerId: 'player1', name: 'Lyra', characterClass: 'Ranger', totalKills: 250, totalDeaths: 15, totalBossKills: 10, isConfirmed: true },
  { id: 'char3', playerId: 'player2', name: 'Kael', characterClass: 'Fighter', totalKills: 180, totalDeaths: 25, totalBossKills: 8, isConfirmed: false },
  { id: 'char4', playerId: 'player2', name: 'Zane', characterClass: 'Rogue', totalKills: 90, totalDeaths: 40, totalBossKills: 2, isConfirmed: true },
  { id: 'char5', playerId: 'player1', name: 'Seraphina', characterClass: 'Cleric', totalKills: 50, totalDeaths: 10, totalBossKills: 1, isConfirmed: false },
];

const enrichedCharacters: Character[] = characters.map(c => ({
    ...c,
    confirmedKills: c.isConfirmed ? c.totalKills : 0,
    unconfirmedKills: c.isConfirmed ? 0 : c.totalKills,
}));


export const players: Player[] = [
  {
    id: 'player1',
    displayName: 'Shadow',
    discordTag: 'shadow#1234',
    friends: ['player2'],
    isOnline: true,
    lifetimeHonor: 15000,
    currentHonor: 2500,
    maxHonor: 5000,
    characters: enrichedCharacters.filter(c => c.playerId === 'player1'),
    avatarUrl: avatar1,
  },
  {
    id: 'player2',
    displayName: 'Ghost',
    discordTag: 'ghost#5678',
    friends: ['player1'],
    isOnline: false,
    lifetimeHonor: 12000,
    currentHonor: 1800,
    maxHonor: 2200,
    characters: enrichedCharacters.filter(c => c.playerId === 'player2'),
    avatarUrl: avatar2,
  },
  {
    id: 'player3',
    displayName: 'Reaper',
    discordTag: 'reaper#8765',
    friends: [],
    isOnline: true,
    lifetimeHonor: 200,
    currentHonor: 200,
    maxHonor: 200,
    characters: [],
    avatarUrl: avatar3,
  }
];

export const allCharacters: Character[] = enrichedCharacters;

export const characterClasses: CharacterClass[] = ['Fighter', 'Ranger', 'Wizard', 'Rogue', 'Cleric', 'Barbarian', 'Sorcerer', 'Warlock', 'Druid', 'Bard'];

export const gameModes: string[] = ["Normal", "High Roller", "Squires to Riches", "Adventure Mode", "Arena"];

export const gameMaps = [
    { name: 'The Ruins', collection: 'The Forgotten Castle', bosses: ['Banshee', 'Spectral Knight'] },
    { name: 'The Crypt', collection: 'The Forgotten Castle', bosses: ['Lich', 'Ghost King', 'Warlord'] },
    { name: 'The Inferno', collection: 'The Forgotten Castle', bosses: ['Lich', 'Ghost King'] },
    { name: 'The Goblin Caves', collection: 'The Goblin Caves', bosses: ['Cave Troll', 'Cyclops'] },
    { name: 'The Ice Cavern', collection: 'The Frost Mountain', bosses: ['Wyvern'] },
    { name: 'The Ice Abyss', collection: 'The Frost Mountain', bosses: ['Wyvern'] },
    { name: 'The Ship Graveyard', collection: 'The Blue Maelstrom', bosses: [] },
];

export const bossList: string[] = ["Cave Troll", "Cyclops", "Lich", "Ghost King", "Warlord", "Banshee", "Spectral Knight", "Wyvern"];

export const daysOfWeek: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const mockPlayer = players[0];

export const mockApplications: Application[] = [
    {
        id: 'app1',
        userId: "user1",
        applicantName: 'Taryon Darrington',
        inGameName: 'Taryon',
        discordTag: 'tary#1111',
        status: 'pending',
        mainCharacters: "Doty",
        mainClasses: ["Fighter"],
        hoursInGame: 500,
        favoriteModes: ["Normal"],
        memorableExperience: 'I am a best-selling author and a renowned adventurer. My skills would be a great asset to your guild. Also, I have a construct named Doty.',
        createdAt: '2024-07-28T10:00:00Z',
        availabilityDays: ['Monday', 'Wednesday', 'Friday'],
        availabilityTimezone: 'GMT-5',
        availabilityStart: '18:00',
        availabilityEnd: '23:00',
        guildExpectations: 'To chronicle the adventures of this guild.',
        attemptCount: 1,
    },
    {
        id: 'app2',
        userId: "user2",
        applicantName: 'Calianna',
        inGameName: 'Cali',
        discordTag: 'cali#2222',
        status: 'pending',
        mainCharacters: "Cali",
        mainClasses: ["Sorcerer"],
        hoursInGame: 200,
        favoriteModes: ["High Roller"],
        memorableExperience: 'Quiet, but a very capable sorcerer. Seeking a group that values teamwork and discretion. I have a secret I must protect.',
        createdAt: '2024-07-27T18:30:00Z',
        availabilityDays: ['Saturday', 'Sunday'],
        availabilityTimezone: 'GMT+1',
        availabilityStart: '14:00',
        availabilityEnd: '20:00',
        guildExpectations: 'A safe place to practice my craft.',
        attemptCount: 1,
    }
];

export const mockReviews: ApplicationReview[] = [
    {
        applicationId: 'app1',
        adminPlayerId: 'player2',
        status: 'approved',
        vote: 8,
        note: 'Seems a bit eccentric, but his stories check out. Could bring some flair to the guild. Let\'s give him a shot.',
        createdAt: '2024-07-28T12:00:00Z',
    },
     {
        applicationId: 'app1',
        adminPlayerId: 'player1',
        status: 'pending',
        vote: 6,
        note: 'A bit of a peacock. Worried about himgrandstanding, but the golem is a plus. On the fence.',
        createdAt: '2024-07-28T14:00:00Z',
    }
];

export const marketItems: MarketItem[] = [
    { name: "Minor Rune of Holding", description: "Increases your inventory space by one row.", price: 500, category: "Utility" },
    { name: "Flask of Fortune", description: "Slightly increases your luck for one dungeon run.", price: 250, category: "Consumable" },
    { name: "Scroll of Identification", description: "Reveals the properties of a single magic item.", price: 100, category: "Utility" },
    { name: "Guild Tabard", description: "A cosmetic tabard displaying the guild's crest.", price: 2000, category: "Cosmetic" },
    { name: "Officer's Commendation", description: "A note that can be exchanged for a rare crafting material from a guild officer.", price: 5000, category: "Special" },
    { name: "Elixir of the Iron Will", description: "Grants resistance to slows and stuns for 30 seconds.", price: 750, category: "Consumable" },
];

export const mockPlayerBounties: MemberBounty[] = [
    {
        id: 'pb1',
        requestingPlayerId: 'player2',
        requestingPlayerName: 'Mercer',
        title: 'Need Cockatrice Feather',
        description: 'Willing to pay a good price for a cockatrice feather for my quest. Please help!',
        reward: 200,
        status: 'open',
        createdAt: '2024-07-29T10:00:00Z',
    },
    {
        id: 'pb2',
        requestingPlayerId: 'player3',
        requestingPlayerName: 'Marisha',
        title: 'Buying Tattered Royal Tapestry',
        description: 'I need one more for my collection. Will pay 500 HP.',
        reward: 500,
        status: 'in_progress',
        acceptedPlayerId: 'player1',
        acceptedPlayerName: 'Soon',
        createdAt: '2024-07-28T15:00:00Z',
    }
];
