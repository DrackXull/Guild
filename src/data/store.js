const fs = require('fs');
const path = require('path');
const { createDefaultData } = require('./defaultData');

const DATA_PATH = path.join(__dirname, '../../data/data.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify(createDefaultData(), null, 2));
    return;
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  if (!raw.trim()) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(createDefaultData(), null, 2));
  }
}

function loadData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return {
    ...createDefaultData(),
    ...parsed
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function updateData(mutator) {
  const data = loadData();
  const updated = mutator(data) || data;
  saveData(updated);
  return updated;
}

module.exports = {
  loadData,
  saveData,
  updateData
};
