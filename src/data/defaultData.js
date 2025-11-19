const defaultSettings = {
  drasticScore: {
    lowThreshold: 3,
    highThreshold: 9,
    minCommentLow: 140,
    minCommentHigh: 80
  },
  runVerification: {
    minimumReporters: 2,
    participationReward: 5,
    reportReward: 3
  },
  runModes: [
    'High Roller',
    'Squire to Riches',
    'PvE',
    'PvP'
  ],
  traits: [
    'Great comms',
    'Team player',
    'Loot hog',
    'Toxic',
    'Clutch saver'
  ],
  maxKillsBeforeFlag: 40,
  dailyLoginReward: 1
};

function createDefaultData() {
  return {
    meta: {
      createdAt: new Date().toISOString()
    },
    settings: defaultSettings,
    players: [],
    characters: [],
    runs: [],
    runReports: [],
    ledgers: [],
    adminLog: [],
    bounties: [],
    notifications: [],
    friendships: [],
    messages: []
  };
}

module.exports = {
  defaultSettings,
  createDefaultData
};
