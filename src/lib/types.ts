














export type WithId<T> = T & { id: string };

export type Rank = 'Neophyte' | 'Initiate' | 'Soldier' | 'Sergeant' | 'Knight' | 'Captain' | 'Champion' | 'Elder' | 'Legend';

export type Player = {
  id: string;
  displayName: string;
  discordTag: string;
  friends: string[];
  isOnline: boolean;
  lifetimeHonor: number;
  currentHonor: number;
  maxHonor: number;
  characters?: Character[];
  avatarUrl?: string;
  rank?: Rank;
  role?: 'guest' | 'member' | 'officer' | 'admin';
  isMember?: boolean;
  removalReason?: string;
  memberNo?: number;
  presence?: Presence;
};

export type Presence = {
  isOnline: boolean;
  state: 'online' | 'in_game' | 'offline';
  note?: string;
  expiresAt: string;
};

export type CharacterClass = 'Fighter' | 'Ranger' | 'Wizard' | 'Rogue' | 'Cleric' | 'Barbarian' | 'Sorcerer' | 'Warlock' | 'Druid' | 'Bard';

export type Character = {
  id: string;
  playerId: string;
  name: string;
  characterClass: CharacterClass;
  level?: number;
  rank?: string;
  isConfirmed: boolean;
  confirmedKills: number;
  unconfirmedKills: number;
  totalBossKills: number;
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
  code?: string;
  runId: string;
  reporterId: string;
  playerId: string;
  characterId: string;
  gameMode: 'Normal' | 'High-Roller';
  map: string;
  gameType: 'PvE' | 'PvP';
  participantStats: RunParticipantStats[];
  feedback: RunFeedback[];
  screenshotUrl?: string;
  screenshots?: string[];
  uploadBlobs?: any[];
  score: number;
  comment: string;
  stats: {
    kills: number;
    deaths: number;
    bossKills: number;
  };
  extracted: boolean;
  traits: string[];
  createdAt: Date;
  officerNotes?: string;
  requestMeeting?: boolean;
  evidenceLinks?: string[];
  isConfirmed: boolean;
  bossesKilled: string[];
};

export type Run = {
  id: string;
  code?: string;
  label?: string;
  reports: string[]; // array of report IDs
  reporterCount?: number;
  reporterIds?: string[];
  isVerified: boolean;
  createdAt: Date;
  scheduledAt?: Date;
  participants?: string[];
  mode?: string;
  screenshots?: string[];
};

export type QuestRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export type Quest = {
  questName: string;
  questDescription: string;
  reward: string;
  rarity: QuestRarity;
  durationDays: number;
  isRepeatable: boolean;
  maxCompletions: number; // 0 for infinite
  requiredRank?: string;
};


export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export type MarketItem = {
    name: string;
    description: string;
    price: number;
    category: string;
    quantity: number;
};

export type MemberBounty = {
    id: string;
    requestingPlayerId: string;
    requestingPlayerName: string;
    acceptedPlayerId?: string;
    acceptedPlayerName?: string;
    title: string;
    description: string;
    reward: number;
    status: 'open' | 'in_progress' | 'complete';
    createdAt: string;
    completedAt?: string;
}

// Types from the provided script
export type LfgPost = {
  id: string;
  hostPlayerId: string;
  characterId: string;
  status: 'open' | 'closed';
  label?: string;
  code?: string;
  mode?: string;
  goal?: string;
  scheduledAt?: string;
  createdAt: string;
  requests: LfgRequest[];
};

export type LfgRequest = {
  id: string;
  playerId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  note?: string;
  isRepeat?: boolean;
  createdAt: string;
  responderId?: string;
};

export type ApplicationReviewDecision = 'approved' | 'denied';

export type ApplicationReviewLog = {
    officerId: string,
    decision: ApplicationReviewDecision,
    notes: string,
    timestamp: string,
}

export type Application = {
  id: string;
  applicantName: string;
  inGameName: string;
  discordTag: string;
  status: 'pending' | 'approved' | 'denied' | 'withdrawn';
  createdAt: string;
  mainCharacters: string;
  mainClasses: string[];
  hoursInGame: number;
  favoriteModes: string[];
  memorableExperience: string;
  availabilityDays: string[];
  availabilityTimezone: string;
  availabilityStart: string;
  availabilityEnd: string;
  guildExpectations: string;
  isContentCreator?: boolean;
  twitchUrl?: string;
  youtubeUrl?: string;
  kickUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  otherUrl?: string;
  userId: string;
  attemptCount: number;
  reviewHistory?: ApplicationReviewLog[];
  references?: string;
  bossesKilled?: string[];
  mainRoles?: string;
};

export type ApplicationReview = {
  applicationId: string;
  adminPlayerId: string;
  status: 'pending' | 'approved' | 'denied';
  vote: number;
  note: string;
  createdAt: string;
};

export type AdminLogEntry = {
  id: string;
  adminPlayerId: string;
  actionType: string;
  metadata?: any;
  createdAt: string;
};

export type GuildSettings = {
  drasticScore: {
    lowThreshold: number;
    highThreshold: number;
    lowCommentMinLength: number;
    highCommentMinLength: number;
  };
  runVerification: {
    minReporters: number;
    participationHonor: number;
    reportHonor: number;
  };
  presence: {
    ttlMinutes: number;
  };
  traitOptions: string[];
  bountyAI?: {
    enableAutoBoosting: boolean;
    boostPercentage: number;
    maxAttempts: number;
  };
};

// This is not a complete type, but it's what we need for the setup button
export type PartialPlayer = Partial<Omit<Player, 'id' | 'characters'>>;

    