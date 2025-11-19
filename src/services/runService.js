const { loadData, updateData } = require('../data/store');
const { createId } = require('../utils/id');
const { recordLedgerEntry } = require('./ledgerService');
const { logAdminAction } = require('./adminLogService');

function listRuns() {
  const data = loadData();
  return data.runs;
}

function getRun(runId) {
  const data = loadData();
  return data.runs.find((run) => run.runId === runId);
}

function createRun({ title, gameMode, participantIds }) {
  if (!title) {
    throw new Error('Run title is required');
  }
  if (!gameMode) {
    throw new Error('Game mode is required');
  }
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new Error('At least one participant is required');
  }

  let createdRun;
  updateData((data) => {
    const now = new Date().toISOString();
    createdRun = {
      runId: createId('run'),
      title,
      gameMode,
      participantIds,
      verified: false,
      createdAt: now,
      updatedAt: now,
      screenshots: []
    };
    data.runs.push(createdRun);
    return data;
  });

  logAdminAction({
    actionType: 'create_run',
    targetRunId: createdRun.runId,
    metadata: { title, gameMode }
  });

  return createdRun;
}

function submitRunReport(runId, payload) {
  const data = loadData();
  const run = data.runs.find((r) => r.runId === runId);
  if (!run) {
    throw new Error('Run not found');
  }

  const {
    playerId,
    characterId,
    rating,
    gameMode = run.gameMode,
    stats = {},
    traits = [],
    extracted = false,
    comment = ''
  } = payload;

  if (!playerId || !characterId) {
    throw new Error('playerId and characterId are required');
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 10) {
    throw new Error('rating must be between 1 and 10');
  }

  const settings = data.settings;
  if (rating <= settings.drasticScore.lowThreshold && (!comment || comment.length < settings.drasticScore.minCommentLow)) {
    throw new Error('Low ratings require a detailed comment');
  }
  if (rating >= settings.drasticScore.highThreshold && (!comment || comment.length < settings.drasticScore.minCommentHigh)) {
    throw new Error('High ratings require a detailed comment');
  }

  const report = {
    reportId: createId('report'),
    runId,
    playerId,
    characterId,
    rating,
    gameMode,
    stats: {
      kills: Number(stats.kills) || 0,
      deaths: Number(stats.deaths) || 0,
      bossKills: Number(stats.bossKills) || 0,
      extracted: Boolean(extracted)
    },
    traits,
    comment,
    createdAt: new Date().toISOString()
  };

  updateData((state) => {
    state.runReports.push(report);
    state.runs = state.runs.map((existing) => (existing.runId === runId ? { ...existing, updatedAt: new Date().toISOString() } : existing));
    return state;
  });

  logAdminAction({
    actionType: 'submit_report',
    targetRunId: runId,
    targetPlayerId: playerId,
    metadata: { characterId, rating }
  });

  verifyRunIfEligible(runId);

  return report;
}

function verifyRunIfEligible(runId) {
  let verifiedNow = false;
  let participants = [];
  let reportsForRun = [];
  let settingsSnapshot;

  updateData((state) => {
    const run = state.runs.find((r) => r.runId === runId);
    if (!run || run.verified) {
      return state;
    }
    const reports = state.runReports.filter((report) => report.runId === runId);
    const uniquePlayers = new Set(reports.map((report) => report.playerId));
    if (uniquePlayers.size < state.settings.runVerification.minimumReporters) {
      return state;
    }

    run.verified = true;
    run.verifiedAt = new Date().toISOString();
    verifiedNow = true;
    participants = [...uniquePlayers];
    reportsForRun = reports;
    settingsSnapshot = state.settings;
    return state;
  });

  if (!verifiedNow) {
    return;
  }

  participants.forEach((playerId) => {
    recordLedgerEntry({
      playerId,
      amount: settingsSnapshot.runVerification.participationReward,
      direction: 'earn',
      reason: 'run_participation',
      details: { runId }
    });
  });

  reportsForRun.forEach((report) => {
    recordLedgerEntry({
      playerId: report.playerId,
      amount: settingsSnapshot.runVerification.reportReward,
      direction: 'earn',
      reason: 'run_report',
      details: { runId, reportId: report.reportId }
    });
  });

  logAdminAction({
    actionType: 'verify_run',
    targetRunId: runId,
    metadata: { participantsRewarded: participants }
  });
}

module.exports = {
  listRuns,
  getRun,
  createRun,
  submitRunReport
};
