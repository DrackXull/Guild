export type Player = {
  id: string;
  displayName: string;
  discordTag: string;
  friends: string[];
  isOnline: boolean;
  lifetimeHonor: number;
  currentHonor: number;
  characters: Character[];
  avatarUrl: string;
};

export type CharacterClass = 'Fighter' | 'Ranger' | 'Wizard' | 'Rogue' | 'Cleric' | 'Barbarian';

export type Character = {
  id: string;
  playerId: string;
  name: string;
  characterClass: CharacterClass;
  totalKills: number;
  totalDeaths: number;
  totalBossKills: number;
  isConfirmed: boolean;
};

export type RunParticipantStats = {
  characterId: string;
  kills: number;
  deaths: number;
  extracted: boolean;
  bossKills: number;
};

export type RunFeedback = {
  reporterId: string;
  characterId: string;
  rating: number;
  traits: string[];
  notes?: string;
};

export type RunReport = {
  id: string;
  runId: string;
  reporterId: string;
  characterId: string;
  gameMode: 'Normal' | 'High-Roller';
  participantStats: RunParticipantStats[];
  feedback: RunFeedback[];
  screenshotUrl?: string;
  createdAt: Date;
};

export type Run = {
  id: string;
  reports: string[]; // array of report IDs
  isVerified: boolean;
  createdAt: Date;
};

export type Quest = {
  questName: string;
  questDescription: string;
  questType: 'daily' | 'weekly';
  reward: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};
