const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/data.json');

function ensureFile() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({
      players: [],
      characters: [],
      runs: [],
      reports: [],
      grimFavorLedger: [],
      adminLog: [],
      bounties: [],
      notifications: [],
      messages: [],
      settings: {}
    }, null, 2));
  }
}

function loadData() {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  DATA_PATH,
  loadData,
  saveData
};
