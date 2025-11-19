const { updateData } = require('../data/store');
const { createId } = require('../utils/id');
const { logAdminAction } = require('./adminLogService');

function listPlayers() {
  const data = require('../data/store').loadData();
  return data.players.map((player) => ({
    ...player,
    characters: undefined
  }));
}

function getPlayer(playerId) {
  const data = require('../data/store').loadData();
  return data.players.find((player) => player.playerId === playerId);
}

function createPlayer({ displayName, discordTag }) {
  if (!displayName) {
    throw new Error('Display name is required');
  }

  let createdPlayer;
  updateData((data) => {
    const now = new Date().toISOString();
    createdPlayer = {
      playerId: createId('player'),
      displayName,
      discordTag: discordTag || null,
      lifetimeGrimFavor: 0,
      currentGrimFavor: 0,
      characters: [],
      friends: [],
      presence: 'offline',
      createdAt: now,
      updatedAt: now
    };
    data.players.push(createdPlayer);
    return data;
  });

  logAdminAction({
    actionType: 'create_player',
    targetPlayerId: createdPlayer.playerId,
    metadata: { displayName }
  });

  return createdPlayer;
}

function addCharacter(playerId, { name, className }) {
  if (!name || !className) {
    throw new Error('Character name and class are required');
  }
  let createdCharacter;
  updateData((data) => {
    const player = data.players.find((p) => p.playerId === playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    const existingName = data.characters.find((character) => character.name.toLowerCase() === name.toLowerCase());
    if (existingName) {
      throw new Error('Character name must be unique');
    }
    const now = new Date().toISOString();
    createdCharacter = {
      characterId: createId('char'),
      playerId,
      name,
      className,
      stats: {
        kills: 0,
        deaths: 0,
        bossKills: 0,
        confirmedKills: 0,
        confirmedDeaths: 0,
        confirmedBossKills: 0
      },
      createdAt: now,
      updatedAt: now
    };
    player.characters.push(createdCharacter.characterId);
    data.characters.push(createdCharacter);
    return data;
  });

  logAdminAction({
    actionType: 'create_character',
    targetPlayerId: playerId,
    targetCharacterId: createdCharacter.characterId,
    metadata: { name: createdCharacter.name, className: createdCharacter.className }
  });

  return createdCharacter;
}

module.exports = {
  listPlayers,
  getPlayer,
  createPlayer,
  addCharacter
};
