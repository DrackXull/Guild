const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/data.json');

const DEFAULT_SETTINGS = {
  drasticScore: {
    lowThreshold: 3,
    highThreshold: 9,
    lowCommentMinLength: 140,
    highCommentMinLength: 80
  },
  runVerification: {
    minReporters: 2,
    participationHonor: 5,
    reportHonor: 2
  },
  presence: {
    ttlMinutes: 5
  },
  traitOptions: ['Great comms', 'Team player', 'Loot hog', 'Toxic', 'Clutch saver'],
  honorRewards: {
    applicationReview: 3
  },
  rankBands: [
    { name: 'Initiate', minMaxHonor: 0 },
    { name: 'Apprentice', minMaxHonor: 1000 },
    { name: 'Wanderer', minMaxHonor: 2800 },
    { name: 'Pathfinder', minMaxHonor: 5500 },
    { name: 'Vanguard', minMaxHonor: 9100 },
    { name: 'Exemplar', minMaxHonor: 13750 },
    { name: 'Council', minMaxHonor: 18000 }
  },
  accessKeys: {
    memberKey: 'guild-member-demo-key',
    officerKey: 'guild-officer-demo-key'
  }
};

const DEFAULT_DATA = {
  players: [],
  characters: [],
  runs: [],
  reports: [],
  applications: [],
  lfgPosts: [],
  honorLedger: [],
  adminLog: [],
  bounties: [],
  notifications: [],
  messages: [],
  settings: DEFAULT_SETTINGS,
  counters: { run: 1, report: 1, application: 1, lfg: 1, member: 1 }
};

function ensureFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function applyDefaults(data) {
  const clone = { ...DEFAULT_DATA, ...data };
  clone.players = data.players || [];
  clone.characters = data.characters || [];
  clone.runs = data.runs || [];
  clone.reports = data.reports || [];
  clone.applications = data.applications || [];
  clone.lfgPosts = data.lfgPosts || [];
  const honorLedger = data.honorLedger || data.grimFavorLedger || [];
  clone.honorLedger = honorLedger;
  clone.adminLog = data.adminLog || [];
  clone.bounties = data.bounties || [];
  clone.notifications = data.notifications || [];
  clone.messages = data.messages || [];
  clone.counters = { run: 1, report: 1, application: 1, lfg: 1, member: 1, ...(data.counters || {}) };
  clone.settings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings || {}),
    drasticScore: {
      ...DEFAULT_SETTINGS.drasticScore,
      ...(data.settings?.drasticScore || {})
    },
    runVerification: {
      ...DEFAULT_SETTINGS.runVerification,
      ...(data.settings?.runVerification || {})
    },
    presence: {
      ...DEFAULT_SETTINGS.presence,
      ...(data.settings?.presence || {})
    },
    honorRewards: {
      ...DEFAULT_SETTINGS.honorRewards,
      ...(data.settings?.honorRewards || {})
    },
    accessKeys: {
      ...DEFAULT_SETTINGS.accessKeys,
      ...(data.settings?.accessKeys || {})
    },
    traitOptions: data.settings?.traitOptions || DEFAULT_SETTINGS.traitOptions
  };
  delete clone.grimFavorLedger;
  if (clone.settings.runVerification.participationGF !== undefined) {
    clone.settings.runVerification.participationHonor =
      clone.settings.runVerification.participationHonor ?? clone.settings.runVerification.participationGF;
    delete clone.settings.runVerification.participationGF;
  }
  if (clone.settings.runVerification.reportGF !== undefined) {
    clone.settings.runVerification.reportHonor =
      clone.settings.runVerification.reportHonor ?? clone.settings.runVerification.reportGF;
    delete clone.settings.runVerification.reportGF;
  }
  return clone;
}

function loadData() {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return applyDefaults(parsed);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  DATA_PATH,
  loadData,
  saveData
};
