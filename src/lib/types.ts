
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
  rank?: string;
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
  code?: string;
  runId: string;
  reporterId: string;
  playerId: string;
  characterId: string;
  gameMode: 'Normal' | 'High-Roller';
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

export type Quest = {
  questName: string;
  questDescription: string;
  questType: 'daily' | 'weekly';
  reward: string;
  requirements?: any;
  rewardAmount?: number;
  isActive?: boolean;
  createdAt?: Date;
  title?: string;
  description?: string;
  type?: 'daily' | 'weekly';
};


export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

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

export type Application = {
  id: string;
  applicantName: string;
  discordTag: string;
  email?: string;
  server?: string;
  status: 'pending' | 'approved' | 'denied';
  isRepeat?: boolean;
  notes?: string;
  decisionNote?: string;
  createdAt: string;
  code?: string;
  roles?: string[];
  characters?: { name: string }[];
  bosses?: string;
  availability?: {
    daysPerWeek?: string;
    usualDays?: string;
    timeWindow?: string;
  };
  gameplay?: {
    hoursInGame?: string;
    favoriteMode?: string;
    mostPlayedMode?: string;
    bosses?: string;
  };
  reviewTrail?: ApplicationReview[];
  vote?: number;
};

export type ApplicationReview = {
  adminPlayerId: string;
  status: 'pending' | 'approved' | 'denied';
  vote?: number;
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
};
