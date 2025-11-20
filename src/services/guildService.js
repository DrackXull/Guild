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

function ensureMemberNumbers(data) {
  ensureCounter(data, 'member');
  data.players.forEach((player) => {
    if (!player.memberNo) {
      const slot = ensureCounter(data, 'member');
      player.memberNo = slot;
      data.counters.member = slot + 1;
    }
  });
}

function ensurePlayerCounters(data) {
  if (!data.playerCounters) {
    data.playerCounters = {};
  }
  ensureMemberNumbers(data);
  data.players.forEach((player) => {
    if (!data.playerCounters[player.id]) {
      const existingReports = (data.reports || []).filter((r) => r.playerId === player.id).length;
      const existingRuns = (data.runs || []).filter((run) => {
        const host = (run.participants || [])[0];
        return host === player.id || run.hostPlayerId === player.id;
      }).length;
      data.playerCounters[player.id] = { report: existingReports, run: existingRuns };
    }
  });
  return data.playerCounters;
}

function ensureOfficerSeed(data) {
  const hasOfficer = (data.players || []).some((player) => ['officer', 'admin'].includes(player.role));
  if (!hasOfficer && data.players?.length) {
    data.players[0].role = 'admin';
  }
}

function ensureReportFlags(data) {
  if (!data.reports) return;
  data.reports.forEach((report) => {
    if (report.statsApplied === undefined) {
      // Existing installs already tallied stats into characters; avoid reapplying.
      report.statsApplied = true;
    }
  });
}

function hydrateData(data) {
  ensureHonorLedger(data);
  ensureMemberNumbers(data);
  ensurePlayerCounters(data);
  ensureOfficerSeed(data);
  ensureReportFlags(data);
  return data;
}

function loadAndHydrate() {
  const data = loadData();
  return hydrateData(data);
}

function persist(updater) {
  const data = loadAndHydrate();
  const result = updater(data);
  saveData(data);
  return result;
}

function ensureCounter(data, key) {
  if (!data.counters) {
    data.counters = { run: 1, report: 1, application: 1, lfg: 1, member: 1 };
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

function formatPersonalCode(memberNo, sequence, type) {
  const memberSlot = String(memberNo || 1).padStart(3, '0');
  const seqSlot = String(sequence || 1).padStart(3, '0');
  return `${type === 'run' ? 'RUN' : 'REP'}-${memberSlot}${seqSlot}`;
}

function nextPersonalCode(data, playerId, type) {
  const counters = ensurePlayerCounters(data);
  const player = findPlayer(data, playerId);
  const key = type === 'run' ? 'run' : 'report';
  const current = counters[playerId]?.[key] || 0;
  const next = current + 1;
  counters[playerId][key] = next;
  return formatPersonalCode(player.memberNo, next, type);
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

function requireMember(data, playerId) {
  const player = findPlayer(data, playerId);
  if (!player.isMember) {
    throw new Error('This action is restricted to guild members.');
  }
  return player;
}

function requireOfficer(data, playerId) {
  const player = findPlayer(data, playerId);
  if (!['officer', 'admin'].includes(player.role)) {
    throw new Error('Officer or admin access is required for this action.');
  }
  return player;
}

function findCharacter(data, characterId) {
  const character = data.characters.find((char) => char.id === characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }
  return character;
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
  if (!adminPlayerId) {
    throw new Error('An officer/admin ID is required to award Honor.');
  }
  return persist((data) => {
    requireOfficer(data, adminPlayerId);
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

function createPlayer(payload, adminPlayerId = null) {
  return persist((data) => {
    const isBootstrap = (data.players || []).length === 0;
    if (!adminPlayerId && !isBootstrap) {
      throw new Error('Officer/admin ID required to create players.');
    }
    const admin = isBootstrap ? null : requireOfficer(data, adminPlayerId);
    const id = randomUUID();
    const player = {
      id,
      discordTag: payload.discordTag,
      displayName: payload.displayName || payload.discordTag,
      rank: payload.rank || DEFAULT_RANK,
      role: payload.role || (isBootstrap ? 'admin' : DEFAULT_ROLE),
      isMember: coerceBoolean(payload.isMember, true),
      friends: [],
      status: 'offline',
      lastSeenAt: null,
      presenceSource: 'web',
      presenceNote: '',
      characterIds: [],
      createdAt: now(),
      memberNo: ensureCounter(data, 'member')
    };
    data.counters.member = player.memberNo + 1;
    data.players.push(player);
    logAdminAction(data, {
      adminPlayerId: admin?.id || null,
      actionType: 'create_player',
      targetPlayerId: player.id,
      metadata: { displayName: player.displayName, discordTag: player.discordTag }
    });
    return player;
  });
}

function registerRecruit(payload) {
  return persist((data) => {
    const normalize = (value = '') => String(value).trim().toLowerCase();
    if (!payload.displayName || !payload.discordTag) {
      throw new Error('Display name and Discord tag are required to register.');
    }
    const existing = data.players.find(
      (player) => normalize(player.discordTag) === normalize(payload.discordTag) || normalize(player.displayName) === normalize(payload.displayName)
    );
    if (existing) {
      return existing;
    }
    const player = {
      id: randomUUID(),
      discordTag: payload.discordTag,
      displayName: payload.displayName,
      rank: 'Applicant',
      role: 'guest',
      isMember: false,
      friends: [],
      status: 'offline',
      lastSeenAt: now(),
      presenceSource: 'web',
      presenceNote: payload.note || '',
      characterIds: [],
      createdAt: now(),
      memberNo: ensureCounter(data, 'member')
    };
    data.counters.member = player.memberNo + 1;
    data.players.push(player);
    logAdminAction(data, {
      adminPlayerId: null,
      actionType: 'register_recruit',
      targetPlayerId: player.id,
      metadata: { displayName: player.displayName, discordTag: player.discordTag }
    });
    return player;
  });
}

function createCharacter(playerId, payload) {
  return persist((data) => {
    const player = requireMember(data, playerId);
    if (!payload.name || !payload.clazz) {
      throw new Error('Character name and class are required');
    }
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
  const data = loadAndHydrate();
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
  const data = loadAndHydrate();
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
    (payload.participants || []).forEach((participantId) => requireMember(data, participantId));
    const id = randomUUID();
    const hostPlayerId = payload.hostPlayerId || (payload.participants || [])[0] || null;
    const run = {
      id,
      code: hostPlayerId ? nextPersonalCode(data, hostPlayerId, 'run') : nextCode(data, 'run', 'RUN'),
      hostPlayerId,
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

function applyReportStatsIfEligible(data, report) {
  if (!report || report.statsApplied) return;
  const run = data.runs.find((r) => r.id === report.runId);
  if (!run || !run.isVerified) return;
  const hasProof = (report.screenshots || []).length > 0;
  if (!hasProof) return;
  const character = findCharacter(data, report.characterId);
  updateCharacterStats(character, report.stats || {}, true);
  report.statsApplied = true;
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
    requireMember(data, character.playerId);

    const storedUploads = persistUploads(uploadBlobs);
    const allScreenshots = normalizeScreenshots(screenshots, storedUploads);

    const id = randomUUID();
    const report = {
      id,
      code: nextPersonalCode(data, character.playerId, 'report'),
      runId,
      characterId,
      playerId: character.playerId,
      score,
      comment,
      stats,
      extracted,
      traits,
      screenshots: allScreenshots,
      createdAt: now(),
      statsApplied: false
    };

    data.reports.push(report);

    if (!run.reporterIds.includes(character.playerId)) {
      run.reporterIds.push(character.playerId);
    }
    if (allScreenshots.length) {
      run.screenshots = Array.from(new Set([...(run.screenshots || []), ...allScreenshots]));
    }

    const { minReporters } = settings.runVerification;
    const participationHonor =
      settings.runVerification.participationHonor ?? settings.runVerification.participationGF ?? 0;
    const reportHonor = settings.runVerification.reportHonor ?? settings.runVerification.reportGF ?? 0;
    const justVerified = !run.isVerified && run.reporterIds.length >= minReporters;
    if (justVerified) {
      run.isVerified = true;
      run.verifiedAt = now();
      run.participants.forEach((playerId) => {
        awardHonor(playerId, participationHonor, 'run_participation', { runId: run.id }, adminPlayerId);
      });
      // Apply stats for every submitted, screenshot-backed report now that the run is confirmed.
      data.reports
        .filter((r) => r.runId === run.id)
        .forEach((r) => applyReportStatsIfEligible(data, r));
    }

    if (run.isVerified) {
      applyReportStatsIfEligible(data, report);
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
  const data = loadAndHydrate();
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
      code: run.code || (() => {
        const hostId = run.hostPlayerId || (run.participants || [])[0] || data.players[0]?.id;
        const host = players.get(hostId);
        const peerRuns = data.runs.filter((entry) => (entry.hostPlayerId || (entry.participants || [])[0]) === hostId);
        const position = peerRuns.findIndex((entry) => entry.id === run.id);
        const sequence = position >= 0 ? position + 1 : peerRuns.length + 1;
        return formatPersonalCode(host?.memberNo || 0, sequence, 'run');
      })(),
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
  const data = loadAndHydrate();
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
      code: report.code || (() => {
        const player = players.get(report.playerId);
        const peerReports = data.reports.filter((entry) => entry.playerId === report.playerId);
        const position = peerReports.findIndex((entry) => entry.id === report.id);
        const sequence = position >= 0 ? position + 1 : peerReports.length + 1;
        return formatPersonalCode(player?.memberNo || 0, sequence, 'report');
      })()
    }));
}

function createApplication(payload) {
  return persist((data) => {
    if (!data.applications) {
      data.applications = [];
    }
    if (!payload.playerId) {
      throw new Error('Create a recruit profile before submitting an application.');
    }
    const applicant = findPlayer(data, payload.playerId);
    if (applicant.isMember) {
      throw new Error('Members do not need to submit applications.');
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
      playerId: applicant.id,
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

    applicant.applicationId = application.id;

    logAdminAction(data, {
      adminPlayerId: null,
      actionType: 'submit_application',
      targetPlayerId: null,
      metadata: { applicationId: application.id, applicantName: application.applicantName }
    });

    return application;
  });
}

  function listRecruitApplications(playerId) {
    const data = loadAndHydrate();
    if (!playerId) return [];
    return (data.applications || [])
      .filter((app) => app.playerId === playerId)
      .map((app) => ({ id: app.id, code: app.code, status: app.status, reviewerNotes: app.reviewTrail, createdAt: app.createdAt }));
  }

  function listApplicationsForApplicant(playerId) {
    const data = loadAndHydrate();
    if (!playerId) return [];
    return (data.applications || []).filter((app) => app.playerId === playerId);
  }

function listApplications(filters = {}) {
  const data = loadAndHydrate();
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
  const vote = Number.isFinite(payload.vote) ? Number(payload.vote) : null;
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
    requireOfficer(data, adminPlayerId);
    const application = (data.applications || []).find((app) => app.id === applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const reviewEntry = { status, note, adminPlayerId, vote, createdAt: now() };
    application.status = status;
    application.reviewedAt = reviewEntry.createdAt;
    application.reviewedBy = adminPlayerId;
    application.decisionNote = note;
    application.reviewTrail = application.reviewTrail || [];
    application.reviewTrail.push(reviewEntry);

    const reward = data.settings?.honorRewards?.applicationReview || 0;
    if (reward) {
      const ledger = ensureHonorLedger(data);
      ledger.push({
        id: randomUUID(),
        playerId: adminPlayerId,
        changeAmount: reward,
        direction: 'earn',
        reason: 'application_review',
        details: { applicationId, status },
        createdAt: now()
      });
    }

    logAdminAction(data, {
      adminPlayerId,
      actionType: 'review_application',
      metadata: { applicationId, status, note, vote }
    });

    return application;
  });
}

function listAdminLog() {
  return loadAndHydrate().adminLog;
}

function upsertSettings(partial, adminPlayerId = null) {
  return persist((data) => {
    if (!adminPlayerId) {
      throw new Error('Officer/admin ID is required to change settings.');
    }
    requireOfficer(data, adminPlayerId);
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
      honorRewards: {
        ...data.settings.honorRewards,
        ...(partial.honorRewards || {})
      },
      accessKeys: {
        ...data.settings.accessKeys,
        ...(partial.accessKeys || {})
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
    if (!adminPlayerId) {
      throw new Error('Officer/admin ID is required to create bounties.');
    }
    requireOfficer(data, adminPlayerId);
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
  return loadAndHydrate().bounties;
}

function ensureLfg(data) {
  if (!data.lfgPosts) {
    data.lfgPosts = [];
  }
  return data.lfgPosts;
}

function createLfgPost(payload, actorPlayerId = null) {
  return persist((data) => {
    const host = requireMember(data, payload.hostPlayerId);
    if (payload.characterId) {
      const character = findCharacter(data, payload.characterId);
      if (character.playerId !== host.id) {
        throw new Error('Character must belong to the host player');
      }
    }

    const lfgPosts = ensureLfg(data);
    const post = {
      id: randomUUID(),
      code: nextCode(data, 'lfg', 'LFG'),
      hostPlayerId: host.id,
      characterId: payload.characterId || null,
      mode: payload.mode || 'High Roller',
      label: payload.label || 'Guild run',
      goal: (payload.goal || payload.note || '').trim().slice(0, 180),
      scheduledAt: payload.scheduledAt || now(),
      status: 'open',
      requests: [],
      createdAt: now()
    };
    lfgPosts.push(post);

    logAdminAction(data, {
      adminPlayerId: actorPlayerId || host.id,
      actionType: 'create_lfg',
      targetPlayerId: host.id,
      metadata: { postId: post.id, code: post.code, mode: post.mode }
    });

    return post;
  });
}

function listLfgPosts(filters = {}) {
  const data = loadAndHydrate();
  const lfgPosts = ensureLfg(data);
  const { status, hostPlayerId } = filters;
  return lfgPosts
    .filter((post) => !status || post.status === status)
    .filter((post) => !hostPlayerId || post.hostPlayerId === hostPlayerId)
    .map((post) => ({ ...post, requests: post.requests || [] }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function applyToLfgPost(postId, payload) {
  return persist((data) => {
    const lfgPosts = ensureLfg(data);
    const post = lfgPosts.find((item) => item.id === postId);
    if (!post) {
      throw new Error('LFG post not found');
    }
    if (post.status !== 'open') {
      throw new Error('This LFG post is closed');
    }

    const applicant = requireMember(data, payload.playerId);
    const note = (payload.message || payload.note || '').trim().slice(0, 160);
    const requests = post.requests || [];
    const isRepeat = requests.some((req) => req.playerId === applicant.id);
    const request = {
      id: randomUUID(),
      playerId: applicant.id,
      message: note,
      status: 'pending',
      isRepeat,
      createdAt: now()
    };
    post.requests = [...requests, request];

    logAdminAction(data, {
      adminPlayerId: applicant.id,
      actionType: 'apply_lfg',
      targetPlayerId: post.hostPlayerId,
      metadata: { postId: post.id, requestId: request.id, isRepeat }
    });

    return request;
  });
}

function decideLfgRequest(postId, requestId, payload) {
  return persist((data) => {
    const lfgPosts = ensureLfg(data);
    const post = lfgPosts.find((item) => item.id === postId);
    if (!post) {
      throw new Error('LFG post not found');
    }
    const responder = findPlayer(data, payload.responderId);
    const request = (post.requests || []).find((req) => req.id === requestId);
    if (!request) {
      throw new Error('Request not found');
    }
    if (request.status !== 'pending') {
      throw new Error('This request has already been handled');
    }
    if (responder.id !== post.hostPlayerId && !['officer', 'admin'].includes(responder.role)) {
      throw new Error('Only the host or an officer can respond to this request');
    }

    const decision = payload.decision === 'accept' ? 'accepted' : 'declined';
    request.status = decision;
    request.note = (payload.note || '').trim().slice(0, 160);
    request.decidedAt = now();
    request.decidedBy = responder.id;

    if (decision === 'accepted' && payload.closePost !== false) {
      post.status = 'closed';
      post.closedAt = now();
    }

    logAdminAction(data, {
      adminPlayerId: responder.id,
      actionType: 'decide_lfg',
      targetPlayerId: request.playerId,
      metadata: { postId: post.id, requestId: request.id, decision, closePost: payload.closePost !== false }
    });

    return request;
  });
}

function updatePlayer(playerId, payload, adminPlayerId = null) {
  return persist((data) => {
    if (!adminPlayerId) {
      throw new Error('Officer/admin ID required to change player records.');
    }
    requireOfficer(data, adminPlayerId);
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
  registerRecruit,
  createLfgPost,
  listApplications,
  listApplicationsForApplicant,
  listRecruitApplications,
  listAdminLog,
  listCharacters,
  listBounties,
  listLfgPosts,
  listPlayers,
  listReports,
  listRuns,
  applyToLfgPost,
  decideLfgRequest,
  reviewApplication,
  pingPresence,
  submitReport,
  updatePlayer,
  upsertSettings
};
