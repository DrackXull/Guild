const { loadData, saveData } = require('../utils/storage');
const { randomUUID } = require('crypto');

function persist(updater) {
  const data = loadData();
  const result = updater(data);
  saveData(data);
  return result;
}

function now() {
  return new Date().toISOString();
}

function findPlayer(data, playerId) {
  const player = data.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }
  return player;
}

function getPlayerLedgerTotals(data, playerId) {
  const entries = data.grimFavorLedger.filter((entry) => entry.playerId === playerId);
  const current = entries.reduce((sum, entry) => sum + entry.changeAmount, 0);
  const lifetime = entries
    .filter((entry) => entry.direction === 'earn')
    .reduce((sum, entry) => sum + entry.changeAmount, 0);
  return { current, lifetime };
}

function logAdminAction(data, action) {
  data.adminLog.push({
    id: randomUUID(),
    createdAt: now(),
    ...action
  });
}

function awardGrimFavor(playerId, amount, reason, details = {}, adminPlayerId = null) {
  return persist((data) => {
    findPlayer(data, playerId);
    const direction = amount >= 0 ? (reason === 'reward_purchase' ? 'spend' : 'earn') : 'adjust';
    data.grimFavorLedger.push({
      id: randomUUID(),
      playerId,
      changeAmount: amount,
      direction,
      reason,
      details,
      createdAt: now()
    });

    logAdminAction(data, {
      adminPlayerId,
      actionType: 'award_points',
      targetPlayerId: playerId,
      metadata: { amount, reason, details }
    });

    return getPlayerLedgerTotals(data, playerId);
  });
}

function createPlayer(payload) {
  return persist((data) => {
    const id = randomUUID();
    const player = {
      id,
      discordTag: payload.discordTag,
      displayName: payload.displayName || payload.discordTag,
      friends: [],
      status: 'offline',
      lifetimeGF: 0,
      currentGF: 0,
      characterIds: [],
      createdAt: now()
    };
    data.players.push(player);
    return player;
  });
}

function createCharacter(playerId, payload) {
  return persist((data) => {
    const player = findPlayer(data, playerId);
    if (data.characters.some((char) => char.name.toLowerCase() === payload.name.toLowerCase())) {
      throw new Error('Character name already taken');
    }
    const character = {
      id: randomUUID(),
      playerId,
      name: payload.name,
      clazz: payload.clazz,
      stats: {
        kills: 0,
        deaths: 0,
        bossKills: 0,
        runs: 0,
        confirmedKills: 0,
        confirmedDeaths: 0,
        confirmedBossKills: 0
      },
      createdAt: now()
    };
    data.characters.push(character);
    player.characterIds.push(character.id);
    return character;
  });
}

function listPlayers() {
  const data = loadData();
  return data.players.map((player) => {
    const ledger = getPlayerLedgerTotals(data, player.id);
    return {
      ...player,
      lifetimeGF: ledger.lifetime,
      currentGF: ledger.current
    };
  });
}

function listCharacters(playerId = null) {
  const data = loadData();
  if (!playerId) {
    return data.characters;
  }
  return data.characters.filter((character) => character.playerId === playerId);
}

function createRun(payload) {
  return persist((data) => {
    const id = randomUUID();
    const run = {
      id,
      label: payload.label || `Run-${data.runs.length + 1}`,
      mode: payload.mode,
      scheduledAt: payload.scheduledAt || now(),
      participants: payload.participants || [],
      reporterIds: [],
      isVerified: false,
      screenshots: payload.screenshots || [],
      createdAt: now()
    };
    data.runs.push(run);
    return run;
  });
}

function getRun(data, runId) {
  const run = data.runs.find((r) => r.id === runId);
  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }
  return run;
}

function updateCharacterStats(character, stats, confirmed) {
  character.stats.kills += stats.kills || 0;
  character.stats.deaths += stats.deaths || 0;
  character.stats.bossKills += stats.bossKills || 0;
  character.stats.runs += 1;
  if (confirmed) {
    character.stats.confirmedKills += stats.kills || 0;
    character.stats.confirmedDeaths += stats.deaths || 0;
    character.stats.confirmedBossKills += stats.bossKills || 0;
  }
}

function submitReport(payload) {
  const {
    runId,
    characterId,
    score,
    comment,
    stats = {},
    extracted = false,
    traits = [],
    screenshots = [],
    adminPlayerId = null
  } = payload;

  return persist((data) => {
    const settings = data.settings;
    const { drasticScore } = settings;
    if (score <= drasticScore.lowThreshold && (!comment || comment.length < drasticScore.lowCommentMinLength)) {
      throw new Error(`Scores of ${drasticScore.lowThreshold} or below require ${drasticScore.lowCommentMinLength} characters of feedback.`);
    }
    if (score >= drasticScore.highThreshold && (!comment || comment.length < drasticScore.highCommentMinLength)) {
      throw new Error(`Scores of ${drasticScore.highThreshold} or above require ${drasticScore.highCommentMinLength} characters of feedback.`);
    }

    const run = getRun(data, runId);
    const character = data.characters.find((c) => c.id === characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const id = randomUUID();
    const report = {
      id,
      runId,
      characterId,
      playerId: character.playerId,
      score,
      comment,
      stats,
      extracted,
      traits,
      screenshots,
      createdAt: now()
    };

    data.reports.push(report);

    if (!run.reporterIds.includes(character.playerId)) {
      run.reporterIds.push(character.playerId);
    }
    if (screenshots.length) {
      run.screenshots = Array.from(new Set([...(run.screenshots || []), ...screenshots]));
    }

    const confirmed = screenshots.length > 0;
    updateCharacterStats(character, stats, confirmed);

    const { minReporters, participationGF, reportGF } = settings.runVerification;
    if (!run.isVerified && run.reporterIds.length >= minReporters) {
      run.isVerified = true;
      run.verifiedAt = now();
      run.participants.forEach((playerId) => {
        awardGrimFavor(playerId, participationGF, 'run_participation', { runId: run.id }, adminPlayerId);
      });
    }

    if (run.isVerified) {
      awardGrimFavor(character.playerId, reportGF, 'report_submission', { runId: run.id, reportId: id }, adminPlayerId);
    }

    logAdminAction(data, {
      adminPlayerId,
      actionType: 'submit_report',
      targetRunId: runId,
      targetPlayerId: character.playerId,
      metadata: { reportId: id, score }
    });

    return report;
  });
}

function listRuns() {
  const data = loadData();
  return data.runs.map((run) => ({
    ...run,
    reporterCount: run.reporterIds.length
  }));
}

function listReports() {
  return loadData().reports;
}

function listAdminLog() {
  return loadData().adminLog;
}

function upsertSettings(partial, adminPlayerId = null) {
  return persist((data) => {
    data.settings = {
      ...data.settings,
      ...partial,
      drasticScore: {
        ...data.settings.drasticScore,
        ...(partial.drasticScore || {})
      },
      runVerification: {
        ...data.settings.runVerification,
        ...(partial.runVerification || {})
      },
      traitOptions: partial.traitOptions || data.settings.traitOptions
    };

    logAdminAction(data, {
      adminPlayerId,
      actionType: 'change_setting',
      metadata: partial
    });

    return data.settings;
  });
}

function createBounty(payload, adminPlayerId = null) {
  return persist((data) => {
    const bounty = {
      id: randomUUID(),
      title: payload.title,
      description: payload.description,
      type: payload.type,
      requirements: payload.requirements,
      rewardAmount: payload.rewardAmount,
      isActive: payload.isActive ?? true,
      createdAt: now()
    };
    data.bounties.push(bounty);
    logAdminAction(data, {
      adminPlayerId,
      actionType: 'create_bounty',
      metadata: bounty
    });
    return bounty;
  });
}

function listBounties() {
  return loadData().bounties;
}

module.exports = {
  awardGrimFavor,
  createBounty,
  createCharacter,
  createPlayer,
  createRun,
  listAdminLog,
  listCharacters,
  listBounties,
  listPlayers,
  listReports,
  listRuns,
  submitReport,
  upsertSettings
};
