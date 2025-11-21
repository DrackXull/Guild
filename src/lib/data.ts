import { Player, Character, CharacterClass } from './types';
import { PlaceHolderImages } from './placeholder-images';

const avatar1 = PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || 'https://picsum.photos/seed/warrior/100/100';
const avatar2 = PlaceHolderImages.find(img => img.id === 'user-avatar-2')?.imageUrl || 'https://picsum.photos/seed/rogue/100/100';

const characters: Character[] = [
  { id: 'char1', playerId: 'player1', name: 'Grog', characterClass: 'Barbarian', totalKills: 120, totalDeaths: 30, totalBossKills: 5, isConfirmed: true },
  { id: 'char2', playerId: 'player1', name: 'Vex', characterClass: 'Ranger', totalKills: 250, totalDeaths: 15, totalBossKills: 10, isConfirmed: true },
  { id: 'char3', playerId: 'player2', name: 'Percy', characterClass: 'Fighter', totalKills: 180, totalDeaths: 25, totalBossKills: 8, isConfirmed: false },
  { id: 'char4', playerId: 'player2', name: 'Scanlan', characterClass: 'Rogue', totalKills: 90, totalDeaths: 40, totalBossKills: 2, isConfirmed: true },
  { id: 'char5', playerId: 'player1', name: 'Pike', characterClass: 'Cleric', totalKills: 50, totalDeaths: 10, totalBossKills: 1, isConfirmed: false },
];

export const players: Player[] = [
  {
    id: 'player1',
    displayName: 'CritRoleFan',
    discordTag: 'critrole#1234',
    friends: ['player2'],
    isOnline: true,
    lifetimeHonor: 15000,
    currentHonor: 2500,
    characters: characters.filter(c => c.playerId === 'player1'),
    avatarUrl: avatar1,
  },
  {
    id: 'player2',
    displayName: 'Mercer',
    discordTag: 'matt#5678',
    friends: ['player1'],
    isOnline: false,
    lifetimeHonor: 12000,
    currentHonor: 1800,
    characters: characters.filter(c => c.playerId === 'player2'),
    avatarUrl: avatar2,
  },
];

export const allCharacters: Character[] = characters;

export const characterClasses: CharacterClass[] = ['Fighter', 'Ranger', 'Wizard', 'Rogue', 'Cleric', 'Barbarian'];

export const mockPlayer = players[0];
