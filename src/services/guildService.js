const fs = require('fs');
const path = require('path');
const { loadData, saveData } = require('../utils/storage');
const { randomUUID } = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../../data/uploads');
const PRESENCE_STATES = new Set(['offline', 'online', 'in_game']);

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).toLowerCase();
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  return fallback;
}

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function ensureHonorLedger(data) {
  if (!data.honorLedger) {
    data.honorLedger = data.grimFavorLedger || [];
    delete data.grimFavorLedger;
  }
  return data.honorLedger;
}

function persist(updater) {
  const data = loadData();
  ensureHonorLedger(data);
  const result = updater(data);
  saveData(data);
  return result;
}

function ensureCounter(data, key) {
  if (!data.counters) {
    data.counters = { run: 1, report: 1, application: 1 };
  }
  if (typeof data.counters[key] !== 'number') {
    data.counters[key] = 1;
  }
  return data.counters[key];
}

function nextCode(data, key, prefix) {
  const current = ensureCounter(data, key);
  data.counters[key] = current + 1;
  return `${prefix}-${String(current).padStart(4, '0')}`;
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
  const ledger = ensureHonorLedger(data);
  const entries = ledger.filter((entry) => entry.playerId === playerId);
  const current = entries.reduce((sum, entry) => sum + entry.changeAmount, 0);
  const lifetime = entries
    .filter((entry) => entry.direction === 'earn')
    .reduce((sum, entry) => sum + entry.changeAmount, 0);
  return { current, lifetime };
}

function getPresenceSettings(data) {
  const ttlMinutes = data.settings?.presence?.ttlMinutes ?? 5;
  const safeMinutes = Math.max(1, Number(ttlMinutes) || 5);
  return { ttlMinutes: safeMinutes, ttlMs: safeMinutes * 60 * 1000 };
}

function buildPresence(data, player) {
  const { ttlMs } = getPresenceSettings(data);
  const lastSeenMs = player.lastSeenAt ? Date.parse(player.lastSeenAt) : 0;
  const isFresh = lastSeenMs && Date.now() - lastSeenMs <= ttlMs;
  const state = isFresh ? player.status || 'online' : 'offline';
  const note =
    player.presenceNote ||
    (state === 'in_game'
      ? 'In Dark and Darker'
      : state === 'online'
        ? 'Online via Guild Nexus'
        : 'Offline');
  return {
    state,
    isOnline: state !== 'offline',
    lastSeenAt: player.lastSeenAt || null,
    expiresAt: isFresh ? new Date(lastSeenMs + ttlMs).toISOString() : null,
    source: player.presenceSource || 'web',
    note
  };
}

function logAdminAction(data, action) {
  data.adminLog.push({
    id: randomUUID(),
    createdAt: now(),
    ...action
  });
}

function persistUploads(uploadBlobs = []) {
  if (!uploadBlobs.length) {
    return [];
  }
  ensureUploadDir();
  return uploadBlobs
    .map((blob) => {
      if (!blob || !blob.data) return null;
      const matches = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(blob.data);
      if (!matches) return null;
      const mime = matches[1];
      const base64 = matches[2];
      const extension = mime.split('/')[1]?.split('+')[0] || 'png';
      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      try {
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        return `/uploads/${filename}`;
      } catch (error) {
        console.error('Failed to save screenshot', error);
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeScreenshots(existing = [], uploads = []) {
  const merged = [...(existing || []), ...(uploads || [])].filter(Boolean);
  return Array.from(new Set(merged));
}

function awardHonor(playerId, amount, reason, details = {}, adminPlayerId = null) {
  if (!reason || !String(reason).trim()) {
    throw new Error('A detailed reason is required when adjusting Honor.');
  }
  return persist((data) => {
    findPlayer(data, playerId);
    const ledger = ensureHonorLedger(data);
    const direction = amount >= 0 ? (reason === 'reward_purchase' ? 'spend' : 'earn') : 'adjust';
    ledger.push({
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
      actionType: 'award_honor',
      targetPlayerId: playerId,
      metadata: { amount, reason, details }
    });

    return getPlayerLedgerTotals(data, playerId);
  });
}

const DEFAULT_RANK = 'Initiate';
const DEFAULT_ROLE = 'member';

function createPlayer(payload) {
  return persist((data) => {
    const id = randomUUID();
    const player = {
      id,
      discordTag: payload.discordTag,
      displayName: payload.displayName || payload.discordTag,
      rank: payload.rank || DEFAULT_RANK,
      role: payload.role || DEFAULT_ROLE,
      isMember: coerceBoolean(payload.isMember, true),
      friends: [],
      status: 'offline',
      lastSeenAt: null,
      presenceSource: 'web',
      presenceNote: '',
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
  ensureHonorLedger(data);
  return data.players.map((player) => {
    const ledger = getPlayerLedgerTotals(data, player.id);
    const presence = buildPresence(data, player);
    return {
      ...player,
      lifetimeHonor: ledger.lifetime,
      currentHonor: ledger.current,
      presence
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

function pingPresence(payload) {
  const { playerId, status = 'online', source = 'web', note = '' } = payload;
  if (!playerId) {
    throw new Error('playerId is required for presence pings.');
  }
  return persist((data) => {
    const player = findPlayer(data, playerId);
    const normalized = PRESENCE_STATES.has(status) ? status : 'online';
    player.status = normalized;
    player.lastSeenAt = now();
    player.presenceSource = source || 'web';
    if (note) {
      player.presenceNote = note;
    } else if (normalized === 'in_game') {
      player.presenceNote = 'In Dark and Darker';
    } else if (normalized === 'online') {
      player.presenceNote = 'Online via Guild Nexus';
    } else {
      player.presenceNote = 'Offline';
    }
    return buildPresence(data, player);
  });
}

function createRun(payload) {
  return persist((data) => {
    const id = randomUUID();
    const run = {
      id,
      code: nextCode(data, 'run', 'RUN'),
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
    uploadBlobs = [],
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

    const storedUploads = persistUploads(uploadBlobs);
    const allScreenshots = normalizeScreenshots(screenshots, storedUploads);

    const id = randomUUID();
    const report = {
      id,
      code: nextCode(data, 'report', 'REP'),
      runId,
      characterId,
      playerId: character.playerId,
      score,
      comment,
      stats,
      extracted,
      traits,
      screenshots: allScreenshots,
      createdAt: now()
    };

    data.reports.push(report);

    if (!run.reporterIds.includes(character.playerId)) {
      run.reporterIds.push(character.playerId);
    }
    if (allScreenshots.length) {
      run.screenshots = Array.from(new Set([...(run.screenshots || []), ...allScreenshots]));
    }

    const confirmed = allScreenshots.length > 0;
    updateCharacterStats(character, stats, confirmed);

    const { minReporters } = settings.runVerification;
    const participationHonor =
      settings.runVerification.participationHonor ?? settings.runVerification.participationGF ?? 0;
    const reportHonor = settings.runVerification.reportHonor ?? settings.runVerification.reportGF ?? 0;
    if (!run.isVerified && run.reporterIds.length >= minReporters) {
      run.isVerified = true;
      run.verifiedAt = now();
      run.participants.forEach((playerId) => {
        awardHonor(playerId, participationHonor, 'run_participation', { runId: run.id }, adminPlayerId);
      });
    }

    if (run.isVerified) {
      awardHonor(character.playerId, reportHonor, 'report_submission', { runId: run.id, reportId: id }, adminPlayerId);
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

function matchesDate(targetDate, iso) {
  if (!targetDate) return true;
  if (!iso) return false;
  return iso.slice(0, 10) === targetDate;
}

function matchesQuery(value, query) {
  if (!query) return true;
  if (!value) return false;
  return value.toLowerCase().includes(query.toLowerCase());
}

function listRuns(filters = {}) {
  const data = loadData();
  const players = new Map(data.players.map((player) => [player.id, player]));
  const query = filters.q?.toLowerCase();
  const playerQuery = filters.playerName?.toLowerCase() || filters.playerQuery?.toLowerCase();

  return data.runs
    .filter((run) => {
      if (!matchesDate(filters.date, run.scheduledAt)) return false;
      if (filters.playerId && !run.participants.includes(filters.playerId)) return false;
      if (playerQuery) {
        const match = run.participants.some((id) => {
          const participant = players.get(id);
          if (!participant) return false;
          return (
            participant.displayName.toLowerCase().includes(playerQuery) ||
            participant.discordTag?.toLowerCase().includes(playerQuery)
          );
        });
        if (!match) return false;
      }
      if (query) {
        const haystack = `${run.code || ''} ${run.label || ''} ${run.id}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .map((run) => ({
      ...run,
      code: run.code || `RUN-${run.id.slice(0, 6).toUpperCase()}`,
      reporterCount: run.reporterIds.length,
      participantDetails: run.participants.map((id) => {
        const participant = players.get(id);
        return participant
          ? { id, displayName: participant.displayName, discordTag: participant.discordTag, rank: participant.rank }
          : { id, displayName: 'Unknown', discordTag: null, rank: null };
      })
    }));
}

function listReports(filters = {}) {
  const data = loadData();
  const characters = new Map(data.characters.map((char) => [char.id, char]));
  const players = new Map(data.players.map((player) => [player.id, player]));
  const runs = new Map(data.runs.map((run) => [run.id, run]));
  const playerQuery = filters.playerName?.toLowerCase() || filters.playerQuery?.toLowerCase();
  const characterQuery = filters.characterName?.toLowerCase();
  const query = filters.q?.toLowerCase();
  const codeQuery = filters.code?.toLowerCase();

  return data.reports
    .filter((report) => {
      if (!matchesDate(filters.date, report.createdAt)) return false;
      if (filters.playerId && report.playerId !== filters.playerId) return false;
      if (filters.characterId && report.characterId !== filters.characterId) return false;
      if (filters.runId && report.runId !== filters.runId) return false;
      const player = players.get(report.playerId);
      const character = characters.get(report.characterId);
      if (playerQuery && !(player?.displayName?.toLowerCase().includes(playerQuery) || player?.discordTag?.toLowerCase().includes(playerQuery))) {
        return false;
      }
      if (characterQuery && !character?.name?.toLowerCase().includes(characterQuery)) {
        return false;
      }
      if (codeQuery) {
        const codeHaystack = `${report.code || ''} ${report.id}`.toLowerCase();
        if (!codeHaystack.includes(codeQuery)) {
          return false;
        }
      }
      if (query) {
        const run = runs.get(report.runId);
        const haystack = `${report.comment || ''} ${report.traits?.join(' ') || ''} ${run?.label || ''}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    })
    .map((report) => ({
      ...report,
      code: report.code || `REP-${report.id.slice(0, 6).toUpperCase()}`
    }));
}

function createApplication(payload) {
  return persist((data) => {
    if (!data.applications) {
      data.applications = [];
    }

    const normalize = (value = '') => String(value).trim().toLowerCase();
    const newCharacters = (payload.characters || [])
      .map((c) => c && c.name ? c.name : c)
      .filter(Boolean)
      .map((name) => normalize(name));

    const repeatMatches = data.applications.filter((existing) => {
      const sameDiscord = payload.discordTag && normalize(existing.discordTag) === normalize(payload.discordTag);
      const sameEmail = payload.email && normalize(existing.email) === normalize(payload.email);
      const overlappingCharacters = (existing.characters || [])
        .map((c) => c && c.name ? c.name : c)
        .filter(Boolean)
        .map((name) => normalize(name))
        .some((name) => newCharacters.includes(name));
      return sameDiscord || sameEmail || overlappingCharacters;
    });

    const application = {
      id: randomUUID(),
      code: nextCode(data, 'application', 'APP'),
      applicantName: payload.applicantName,
      discordTag: payload.discordTag,
      email: payload.email || '',
      server: payload.server || '',
      availability: {
        daysPerWeek: payload.daysPerWeek || '',
        usualDays: payload.usualDays || '',
        timeWindow: payload.timeWindow || ''
      },
      gameplay: {
        hoursInGame: payload.hoursInGame || '',
        favoriteMode: payload.favoriteMode || '',
        mostPlayedMode: payload.mostPlayedMode || '',
        bosses: payload.bosses || ''
      },
      roles: payload.roles || [],
      characters: payload.characters || [],
      notes: payload.notes || '',
      status: 'pending',
      isRepeat: repeatMatches.length > 0,
      repeatMatches: repeatMatches.map((match) => ({ id: match.id, code: match.code, createdAt: match.createdAt })),
      reviewTrail: [],
      createdAt: now()
    };

    data.applications.push(application);

    logAdminAction(data, {
      adminPlayerId: null,
      actionType: 'submit_application',
      targetPlayerId: null,
      metadata: { applicationId: application.id, applicantName: application.applicantName }
    });

    return application;
  });
}

function listApplications(filters = {}) {
  const data = loadData();
  const normalize = (value = '') => String(value).toLowerCase();
  const query = normalize(filters.q || '');
  return (data.applications || [])
    .filter((application) => {
      if (filters.status && application.status !== filters.status) return false;
      if (filters.repeatOnly && !application.isRepeat) return false;
      if (!query) return true;
      const haystack = `${application.applicantName || ''} ${application.discordTag || ''} ${application.email || ''} ${application.notes || ''}`.toLowerCase();
      const characterNames = (application.characters || [])
        .map((c) => (c && c.name ? c.name : c) || '')
        .join(' ')
        .toLowerCase();
      return haystack.includes(query) || characterNames.includes(query);
    })
    .map((application) => ({
      ...application,
      code: application.code || `APP-${application.id.slice(0, 6).toUpperCase()}`
    }));
}

function reviewApplication(applicationId, payload) {
  const { status, note, adminPlayerId } = payload;
  if (!adminPlayerId) {
    throw new Error('An officer/admin ID is required to review applications.');
  }
  if (!status || !['approved', 'denied', 'pending'].includes(status)) {
    throw new Error('Status must be approved, denied, or pending.');
  }
  if (!note || !note.trim()) {
    throw new Error('A short note is required when responding to an application.');
  }

  return persist((data) => {
    const application = (data.applications || []).find((app) => app.id === applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const reviewEntry = { status, note, adminPlayerId, createdAt: now() };
    application.status = status;
    application.reviewedAt = reviewEntry.createdAt;
    application.reviewedBy = adminPlayerId;
    application.decisionNote = note;
    application.reviewTrail = application.reviewTrail || [];
    application.reviewTrail.push(reviewEntry);

    logAdminAction(data, {
      adminPlayerId,
      actionType: 'review_application',
      metadata: { applicationId, status, note }
    });

    return application;
  });
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

function updatePlayer(playerId, payload, adminPlayerId = null) {
  return persist((data) => {
    const player = findPlayer(data, playerId);
    if (payload.displayName) {
      player.displayName = payload.displayName;
    }
    if (payload.discordTag) {
      player.discordTag = payload.discordTag;
    }
    if (payload.rank) {
      player.rank = payload.rank;
    }
    if (payload.role) {
      player.role = payload.role;
    }
    if (payload.isMember !== undefined) {
      const nextMembership = coerceBoolean(payload.isMember, player.isMember);
      if (nextMembership !== player.isMember && !nextMembership) {
        if (!payload.removalReason || !payload.removalReason.trim()) {
          throw new Error('Removing a player from the guild requires a reason.');
        }
        player.removalReason = payload.removalReason.trim();
        player.removedAt = now();
      } else if (nextMembership) {
        player.removalReason = null;
        player.removedAt = null;
      }
      player.isMember = nextMembership;
    }

    logAdminAction(data, {
      adminPlayerId,
      actionType: 'update_player',
      targetPlayerId: playerId,
      metadata: { rank: player.rank, role: player.role, isMember: player.isMember, removalReason: player.removalReason || null }
    });

    return player;
  });
}

module.exports = {
  awardHonor,
  createBounty,
  createCharacter,
  createPlayer,
  createRun,
  createApplication,
  listApplications,
  listAdminLog,
  listCharacters,
  listBounties,
  listPlayers,
  listReports,
  listRuns,
  reviewApplication,
  pingPresence,
  submitReport,
  updatePlayer,
  upsertSettings
};
