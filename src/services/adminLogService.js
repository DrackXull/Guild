const { updateData } = require('../data/store');
const { createId } = require('../utils/id');

function logAdminAction({ actionType, adminPlayerId = null, targetPlayerId = null, targetCharacterId = null, targetRunId = null, metadata = {} }) {
  let entry;
  updateData((data) => {
    entry = {
      logId: createId('log'),
      adminPlayerId,
      actionType,
      targetPlayerId,
      targetCharacterId,
      targetRunId,
      metadata,
      createdAt: new Date().toISOString()
    };
    data.adminLog.push(entry);
    return data;
  });
  return entry;
}

module.exports = {
  logAdminAction
};
