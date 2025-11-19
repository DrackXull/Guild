const { updateData } = require('../data/store');
const { createId } = require('../utils/id');
const { logAdminAction } = require('./adminLogService');

function recordLedgerEntry({ playerId, amount, direction, reason, details = {}, adminPlayerId = null }) {
  if (!playerId) {
    throw new Error('playerId is required');
  }
  if (!['earn', 'spend', 'adjust'].includes(direction)) {
    throw new Error('Invalid direction');
  }

  let entry;
  updateData((data) => {
    const player = data.players.find((p) => p.playerId === playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    entry = {
      ledgerId: createId('ledger'),
      playerId,
      amount,
      direction,
      reason,
      details,
      createdAt: new Date().toISOString()
    };
    data.ledgers.push(entry);
    if (direction === 'earn') {
      player.currentGrimFavor += amount;
      player.lifetimeGrimFavor += amount;
    } else if (direction === 'spend') {
      player.currentGrimFavor -= amount;
    } else {
      player.currentGrimFavor += amount;
    }
    player.updatedAt = new Date().toISOString();
    return data;
  });

  logAdminAction({
    actionType: direction === 'spend' ? 'spend_points' : 'award_points',
    adminPlayerId,
    targetPlayerId: playerId,
    metadata: { amount, reason, direction, details }
  });

  return entry;
}

module.exports = {
  recordLedgerEntry
};
