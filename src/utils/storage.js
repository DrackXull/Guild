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
  traitOptions: ['Great comms', 'Team player', 'Loot hog', 'Toxic', 'Clutch saver']
};

const DEFAULT_DATA = {
  players: [],
  characters: [],
  runs: [],
  reports: [],
  applications: [],
  honorLedger: [],
  adminLog: [],
  bounties: [],
  notifications: [],
  messages: [],
  settings: DEFAULT_SETTINGS,
  counters: { run: 1, report: 1, application: 1 }
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
  const honorLedger = data.honorLedger || data.grimFavorLedger || [];
  clone.honorLedger = honorLedger;
  clone.adminLog = data.adminLog || [];
  clone.bounties = data.bounties || [];
  clone.notifications = data.notifications || [];
  clone.messages = data.messages || [];
  clone.counters = { run: 1, report: 1, application: 1, ...(data.counters || {}) };
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
