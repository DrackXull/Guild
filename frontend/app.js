const state = {
  players: [],
  characters: [],
  runs: [],
  reports: [],
  lfgPosts: [],
  applications: [],
  bounties: [],
  adminLog: [],
  settings: {
    drasticScore: { lowThreshold: 3, highThreshold: 9, lowCommentMinLength: 140, highCommentMinLength: 80 },
    runVerification: { minReporters: 2, participationHonor: 5, reportHonor: 2 },
    presence: { ttlMinutes: 5 },
    traitOptions: []
  },
  search: { runs: [], reports: [] },
  view: 'member'
};

const elements = {
  apiBaseInput: document.getElementById('apiBase'),
  memberKeyInput: document.getElementById('memberKey'),
  officerKeyInput: document.getElementById('officerKey'),
  metricCards: document.getElementById('metricCards'),
  playersList: document.getElementById('playersList'),
  characterPlayerSelect: document.getElementById('characterPlayerId'),
  participantsSelect: document.getElementById('runParticipants'),
  reportRunSelect: document.getElementById('reportRunId'),
  reportCharacterSelect: document.getElementById('reportCharacterId'),
  traitFieldset: document.getElementById('traitOptions'),
  runsList: document.getElementById('runsList'),
  reportsList: document.getElementById('reportsList'),
  bountyList: document.getElementById('bountyList'),
  awardPlayerSelect: document.getElementById('awardPlayerId'),
  adminLogList: document.getElementById('adminLogList'),
  runSearchResults: document.getElementById('runSearchResults'),
  reportSearchResults: document.getElementById('reportSearchResults'),
  applicationList: document.getElementById('applicationList'),
  applicationFilter: document.getElementById('applicationFilter'),
  applicationReviewerId: document.getElementById('applicationReviewerId'),
  applicationBadge: document.getElementById('applicationBadge'),
  lfgList: document.getElementById('lfgList'),
  lfgPostForm: document.getElementById('lfgPostForm'),
  lfgHostSelect: document.getElementById('lfgHostPlayerId'),
  lfgHostCharacterSelect: document.getElementById('lfgHostCharacterId'),
  lfgActorSelect: document.getElementById('lfgActorSelect'),
  membershipPlayerSelect: document.getElementById('membershipPlayerId'),
  membershipRankSelect: document.getElementById('membershipRank'),
  membershipRoleSelect: document.getElementById('membershipRole'),
  membershipIsMember: document.getElementById('membershipIsMember'),
  membershipReasonRow: document.getElementById('membershipReasonRow'),
  membershipReason: document.getElementById('membershipReason'),
  applicationForm: document.getElementById('applicationForm'),
  applicationScheduleForm: document.getElementById('applicationSchedule'),
  runSearchForm: document.getElementById('runSearchForm'),
  reportSearchForm: document.getElementById('reportSearchForm'),
  clearSearchButton: document.getElementById('clearSearch'),
  uploadPreview: document.getElementById('uploadPreview'),
  screenshotInput: document.getElementById('reportScreenshotFiles'),
  statusToast: document.getElementById('statusToast'),
  presenceSummary: document.getElementById('presenceSummary'),
  presenceList: document.getElementById('presenceList'),
  presencePlayerSelect: document.getElementById('presencePlayerId'),
  presenceStatus: document.getElementById('presenceStatus'),
  presenceNote: document.getElementById('presenceNote'),
  presenceForm: document.getElementById('presenceForm'),
  topbarOnline: document.getElementById('topbarOnline'),
  topbarInGame: document.getElementById('topbarInGame'),
  topbarPresenceDot: document.getElementById('topbarPresenceDot'),
  presenceToggle: document.getElementById('presenceToggle'),
  presencePanel: document.getElementById('presencePanel'),
  topbarPresenceList: document.getElementById('topbarPresenceList'),
  inboxToggle: document.getElementById('inboxToggle'),
  inboxPanel: document.getElementById('inboxPanel'),
  inboxList: document.getElementById('inboxList'),
  inboxBadge: document.getElementById('inboxBadge')
};

const rankOptions = ['Initiate', 'Recruit', 'Raider', 'Veteran', 'Champion', 'Officer', 'Overseer'];
const roleOptions = ['guest', 'member', 'officer', 'admin'];

const DEFAULT_MEMBER_KEY = 'guild-member-demo-key';
const DEFAULT_OFFICER_KEY = 'guild-officer-demo-key';
const defaultApiBase = localStorage.getItem('guildApiBase') || `${window.location.origin.replace(/\/$/, '')}/api`;
let toastTimer = null;
let uploadBlobs = [];
let activeActorId = localStorage.getItem('guildActorId') || '';

function getApiBase() {
  return (elements.apiBaseInput.value || defaultApiBase).replace(/\/$/, '');
}

function updateStoredApiBase(value) {
  const safeValue = value.replace(/\/$/, '');
  localStorage.setItem('guildApiBase', safeValue);
  elements.apiBaseInput.value = safeValue;
}

function getMemberKey() {
  const stored = localStorage.getItem('guildMemberKey');
  if (stored) return stored;
  localStorage.setItem('guildMemberKey', DEFAULT_MEMBER_KEY);
  return DEFAULT_MEMBER_KEY;
}

function getOfficerKey() {
  return localStorage.getItem('guildOfficerKey') || '';
}

function setMemberKey(value) {
  const trimmed = (value || '').trim();
  if (trimmed) {
    localStorage.setItem('guildMemberKey', trimmed);
  }
  if (elements.memberKeyInput) {
    elements.memberKeyInput.value = trimmed;
  }
}

function setOfficerKey(value) {
  const trimmed = (value || '').trim();
  localStorage.setItem('guildOfficerKey', trimmed);
  if (elements.officerKeyInput) {
    elements.officerKeyInput.value = trimmed;
  }
}

function getActorId() {
  if (activeActorId && state.players.some((player) => player.id === activeActorId)) {
    return activeActorId;
  }
  activeActorId = state.players[0]?.id || '';
  return activeActorId;
}

function getActor() {
  return state.players.find((player) => player.id === getActorId());
}

function actorIsOfficer() {
  const actor = getActor();
  return Boolean(actor && ['officer', 'admin'].includes(actor.role));
}

function actorIsMember() {
  const actor = getActor();
  return Boolean(actor && actor.isMember);
}

function setActorId(value) {
  activeActorId = value;
  localStorage.setItem('guildActorId', value);
  if (elements.lfgActorSelect) {
    elements.lfgActorSelect.value = value;
  }
  if (elements.lfgHostSelect) {
    elements.lfgHostSelect.value = value;
  }
  renderLfgCharacters();
  renderLfgBoard();
  setView(state.view || 'member');
}

elements.apiBaseInput.value = defaultApiBase;
elements.apiBaseInput.addEventListener('change', (event) => {
  updateStoredApiBase(event.target.value.trim() || defaultApiBase);
  loadData();
});

setMemberKey(getMemberKey());
setOfficerKey(getOfficerKey());

if (elements.memberKeyInput) {
  elements.memberKeyInput.addEventListener('change', (event) => {
    setMemberKey(event.target.value || DEFAULT_MEMBER_KEY);
    loadData();
  });
}

if (elements.officerKeyInput) {
  elements.officerKeyInput.addEventListener('change', (event) => {
    setOfficerKey(event.target.value || '');
    loadData();
  });
}

function showToast(message, type = 'info') {
  const toast = elements.statusToast;
  toast.textContent = message;
  toast.className = `status-toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

async function fetchJSON(path, options = {}) {
  const authHeaders = {
    'Content-Type': 'application/json',
    'X-Guild-Key': getMemberKey()
  };
  const officerKey = getOfficerKey();
  if (officerKey) {
    authHeaders['X-Officer-Key'] = officerKey;
  }
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: { ...authHeaders, ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || response.statusText);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatRelativeTime(value) {
  if (!value) return '—';
  const target = new Date(value).getTime();
  const diffMs = target - Date.now();
  const diffMinutes = Math.round(Math.abs(diffMs) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ${diffMs >= 0 ? 'from now' : 'ago'}`;
  const hours = Math.round(diffMinutes / 60);
  return `${hours}h ${diffMs >= 0 ? 'from now' : 'ago'}`;
}

function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildInboxItems() {
  const actorId = getActorId();
  if (!actorId) return [];
  const actorCharacters = state.characters.filter((char) => char.playerId === actorId).map((char) => char.id);
  const runs = state.runs
    .filter((run) => (run.participants || []).includes(actorId))
    .map((run) => ({
      label: `Tagged in ${run.code || run.label || 'run'}`,
      detail: `${run.mode || 'Unknown mode'} · ${formatDate(run.scheduledAt)}`,
      ts: run.createdAt,
      type: 'run'
    }));

  const reportMentions = state.reports
    .filter((report) => actorCharacters.includes(report.characterId))
    .map((report) => ({
      label: `Report ${report.code || 'entry'} saved for your character`,
      detail: `${report.score}/10 · ${formatDate(report.createdAt)}`,
      ts: report.createdAt,
      type: 'report'
    }));

  const lfgSignals = state.lfgPosts
    .filter(
      (post) =>
        post.hostPlayerId === actorId ||
        (post.requests || []).some((req) => req.playerId === actorId || req.responderId === actorId)
    )
    .map((post) => {
      const pending = (post.requests || []).filter((req) => req.status === 'pending');
      const replied = (post.requests || []).filter((req) => req.status !== 'pending');
      const note =
        post.hostPlayerId === actorId && pending.length
          ? `${pending.length} pending request(s)`
          : replied.length
            ? `${replied.length} decision(s)`
            : 'New LFG activity';
      return {
        label: `${post.code || 'LFG'} · ${post.mode}`,
        detail: `${note} · ${formatDate(post.createdAt)}`,
        ts: post.createdAt,
        type: 'lfg'
      };
    });

  return [...runs, ...reportMentions, ...lfgSignals].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 12);
}

function renderMetrics() {
  const verifiedRuns = state.runs.filter((run) => run.isVerified).length;
  const memberCount = state.players.filter((player) => player.isMember).length;
  const officerCount = state.players.filter((player) => ['officer', 'admin'].includes(player.role)).length;
  const onlineCount = state.players.filter((player) => player.presence?.isOnline).length;
  const inGameCount = state.players.filter((player) => player.presence?.state === 'in_game').length;
  const pendingApplications = state.applications.filter((app) => app.status === 'pending').length;
  const openLfg = state.lfgPosts.filter((post) => post.status === 'open').length;
  const metrics = [
    { label: 'Active now', value: onlineCount },
    { label: 'In game', value: inGameCount },
    { label: 'Members', value: memberCount },
    { label: 'Officers', value: officerCount },
    { label: 'Open LFG posts', value: openLfg },
    { label: 'Characters', value: state.characters.length },
    { label: 'Runs', value: state.runs.length },
    { label: 'Verified runs', value: verifiedRuns },
    { label: 'Reports', value: state.reports.length },
    { label: 'Pending applications', value: pendingApplications }
  ];
  elements.metricCards.innerHTML = metrics
    .map(
      (metric) => `
        <div class="metric-card">
          <span>${metric.value}</span>
          <p>${metric.label}</p>
        </div>
      `
    )
    .join('');
}

function renderPresence() {
  if (!elements.presenceSummary || !elements.presenceList) return;
  const onlinePlayers = state.players.filter((player) => player.presence?.isOnline);
  const inGamePlayers = onlinePlayers.filter((player) => player.presence?.state === 'in_game');

  if (elements.topbarOnline) {
    elements.topbarOnline.textContent = `${onlinePlayers.length} online`;
  }
  if (elements.topbarInGame) {
    elements.topbarInGame.textContent = `${inGamePlayers.length} in game`;
  }
  if (elements.topbarPresenceDot) {
    const stateClass = inGamePlayers.length ? 'in_game' : onlinePlayers.length ? 'online' : 'offline';
    elements.topbarPresenceDot.className = `dot ${stateClass}`;
  }

  if (elements.topbarPresenceList) {
    elements.topbarPresenceList.innerHTML = onlinePlayers.length
      ? onlinePlayers
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
          .map((player) => {
            const presence = player.presence;
            const expires = presence.expiresAt ? `fresh for ${formatRelativeTime(presence.expiresAt)}` : 'recent ping';
            return `
              <li>
                <div>
                  <div class="player-status"><span class="dot ${presence.state}"></span>${escapeHTML(player.displayName)}</div>
                  <div class="presence-note">${escapeHTML(presence.note || '')}</div>
                </div>
                <div class="presence-meta">${expires}<br />${presence.state === 'in_game' ? 'In game' : 'Online'}</div>
              </li>
            `;
          })
          .join('')
      : '<li class="presence-note">The hall is quiet—no members online.</li>';
  }

  elements.presenceSummary.textContent = `${onlinePlayers.length} online · ${inGamePlayers.length} in game`;
  if (!onlinePlayers.length) {
    elements.presenceList.innerHTML = '<li class="presence-chip">The hall is quiet—no members online.</li>';
    return;
  }
  elements.presenceList.innerHTML = onlinePlayers
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((player) => {
      const presence = player.presence;
      const label = presence.state === 'in_game' ? 'In game' : 'Online';
      return `
        <li class="presence-chip ${presence.state}" title="${escapeHTML(presence.note || '')}">
          <strong>${escapeHTML(player.displayName)}</strong>
          <span class="note">${escapeHTML(label)}</span>
        </li>
      `;
    })
    .join('');
}

function buildPlayerStatSheet(player) {
  const characters = state.characters.filter((char) => char.playerId === player.id);
  const runs = new Map(state.runs.map((run) => [run.id, run]));
  const playerReports = state.reports.filter((report) => report.playerId === player.id);
  const aggregate = characters.reduce(
    (acc, char) => {
      acc.kills += char.stats?.kills || 0;
      acc.deaths += char.stats?.deaths || 0;
      acc.bossKills += char.stats?.bossKills || 0;
      acc.confirmedKills += char.stats?.confirmedKills || 0;
      acc.confirmedBossKills += char.stats?.confirmedBossKills || 0;
      acc.runs += char.stats?.runs || 0;
      return acc;
    },
    { kills: 0, deaths: 0, bossKills: 0, confirmedKills: 0, confirmedBossKills: 0, runs: 0 }
  );

  const perCharacter = characters
    .map((char) => `
      <li class="stat-line">
        <div>
          <strong>${escapeHTML(char.name)}</strong>
          <p class="subtitle">${escapeHTML(char.clazz)}</p>
        </div>
        <span class="pill">${char.stats?.confirmedKills || 0} confirmed kills</span>
        <span class="pill">${char.stats?.confirmedBossKills || 0} bosses</span>
      </li>
    `)
    .join('');

  const recentReports = playerReports
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map((report) => {
      const run = runs.get(report.runId);
      return `
        <li class="stat-line minor">
          <div>
            <strong>${escapeHTML(run?.code || 'Run')}</strong>
            <p class="subtitle">${escapeHTML(run?.mode || '')} · ${formatDate(run?.createdAt)}</p>
          </div>
          <span class="pill">Kills ${report.stats?.kills || 0}</span>
          <span class="pill">Boss ${report.stats?.bossKills || 0}</span>
        </li>
      `;
    })
    .join('');

  return `
    <div class="stat-sheet">
      <div class="stat-grid">
        <div><p class="eyebrow">Confirmed kills</p><strong>${aggregate.confirmedKills}</strong></div>
        <div><p class="eyebrow">Boss kills</p><strong>${aggregate.confirmedBossKills}</strong></div>
        <div><p class="eyebrow">Runs logged</p><strong>${aggregate.runs}</strong></div>
      </div>
      <ul class="stat-list">${perCharacter || '<li class="stat-line">No characters yet.</li>'}</ul>
      ${recentReports ? `<div class="stat-subtitle">Recent runs</div><ul class="stat-list">${recentReports}</ul>` : ''}
    </div>
  `;
}

function renderInbox() {
  if (!elements.inboxList || !elements.inboxBadge || !elements.inboxPanel) return;
  const items = buildInboxItems();
  elements.inboxBadge.textContent = items.length;
  elements.inboxList.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <li class="inbox-item ${item.type}">
              <div>
                <strong>${escapeHTML(item.label)}</strong>
                <p class="subtitle">${escapeHTML(item.detail)}</p>
              </div>
              <span class="timestamp">${formatDate(item.ts)}</span>
            </li>
          `
        )
        .join('')
    : '<li class="inbox-item">No new signals—light a torch and start a run.</li>';
}

function renderPlayers() {
  if (!state.players.length) {
    elements.playersList.innerHTML = '<div class="empty-state">Add your first player to begin tracking.</div>';
    return;
  }

  elements.playersList.innerHTML = state.players
    .map((player) => {
      const characters = state.characters.filter((char) => char.playerId === player.id);
      const characterList = characters
        .map((char) => `<li>${escapeHTML(char.name)} <span class="sub">${escapeHTML(char.clazz)}</span></li>`)
        .join('');
      const presence = player.presence || { state: 'offline', note: 'Offline' };
      const presenceLabel = presence.state === 'in_game' ? 'In game' : presence.state === 'online' ? 'Online' : 'Offline';
      const removalNote = !player.isMember && player.removalReason
        ? `<p class="subtitle">Removed: ${escapeHTML(player.removalReason)}</p>`
        : '';
      return `
        <article class="card player-card">
          <div>
            <h4>${escapeHTML(player.displayName)} <span class="sub">${escapeHTML(player.rank)}</span></h4>
            <p class="subtitle">${escapeHTML(player.discordTag)}</p>
            <p class="subtitle">#${String(player.memberNo || 0).toString().padStart(3, '0')} · ${player.isMember ? 'Guild member' : 'Guest'} · ${player.role}</p>
            <div class="player-status" title="${escapeHTML(presence.note || '')}">
              <span class="dot ${presence.state || 'offline'}"></span>
              ${presenceLabel}
            </div>
          </div>
          <div class="honor-pill">
            <span>Lifetime ${player.lifetimeHonor}</span>
            <span>Current ${player.currentHonor}</span>
          </div>
          <p class="subtitle">Joined ${formatDate(player.createdAt)}</p>
          ${removalNote}
          <ul>${characterList || '<li>No characters yet</li>'}</ul>
          ${buildPlayerStatSheet(player)}
        </article>
      `;
    })
    .join('');
}

function renderRuns() {
  if (!state.runs.length) {
    elements.runsList.innerHTML = '<div class="empty-state">No runs logged yet.</div>';
    return;
  }
  const sorted = [...state.runs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  elements.runsList.innerHTML = sorted
    .map((run) => {
      const participants = (run.participants || [])
        .map((id) => state.players.find((player) => player.id === id)?.displayName || 'Unknown')
        .map((name) => `<li>${escapeHTML(name)}</li>`)
        .join('');
      return `
        <article class="card run-card">
          <h4>${escapeHTML(run.code || run.label || 'Run')}</h4>
          <p class="subtitle">${escapeHTML(run.mode || 'Mode TBD')} · ${run.reporterCount || run.reporterIds?.length || 0} reports · ${formatDate(run.scheduledAt || run.createdAt)}</p>
          <p>${run.isVerified ? '✅ Verified' : '🕓 Awaiting verification'} · Screenshots ${run.screenshots?.length || 0}</p>
          <h5>Participants</h5>
          <ul>${participants || '<li>None recorded</li>'}</ul>
        </article>
      `;
    })
    .join('');
}

function renderReports() {
  if (!state.reports.length) {
    elements.reportsList.innerHTML = '<div class="empty-state">Reports will appear after runs are submitted.</div>';
    return;
  }
  const sorted = [...state.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  elements.reportsList.innerHTML = `
    <div class="report-grid">
      ${sorted
        .map((report) => {
          const character = state.characters.find((char) => char.id === report.characterId);
          const player = state.players.find((p) => p.id === report.playerId);
          const run = state.runs.find((r) => r.id === report.runId);
          const traitList = (report.traits || [])
            .map((trait) => `<li>${escapeHTML(trait)}</li>`)
            .join('');
          const screenshots = (report.screenshots || [])
            .map((url) => `<li><a href="${escapeHTML(url)}" target="_blank" rel="noreferrer">Proof</a></li>`)
            .join('');
          return `
            <article class="card report-card">
              <h4>${escapeHTML(character?.name || 'Unknown')} · Score ${report.score}</h4>
              <p class="subtitle">${escapeHTML(player?.displayName || 'Unknown player')} in ${escapeHTML(run?.label || 'Unknown run')}</p>
              <p class="subtitle">Report ID ${escapeHTML(report.code || report.id)}</p>
              <p>${escapeHTML(report.comment)}</p>
              <ul>${traitList || '<li>No traits noted</li>'}</ul>
              <p class="subtitle">Kills ${report.stats?.kills || 0} · Deaths ${report.stats?.deaths || 0} · Boss ${report.stats?.bossKills || 0}</p>
              <p class="subtitle">${report.extracted ? 'Extracted ✅' : 'Wiped 💀'} · ${formatDate(report.createdAt)}</p>
              ${screenshots ? `<div class="subtitle">${screenshots}</div>` : ''}
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderApplications() {
  if (!elements.applicationList) return;
  const filter = elements.applicationFilter?.value || 'pending';
  const filtered = state.applications.filter((app) => filter === 'all' || app.status === filter);
  const pendingCount = state.applications.filter((app) => app.status === 'pending').length;
  if (elements.applicationBadge) {
    elements.applicationBadge.textContent = pendingCount ? pendingCount : '';
  }

  if (!filtered.length) {
    elements.applicationList.innerHTML = '<div class="empty-state">No applications match this view.</div>';
    return;
  }

  elements.applicationList.innerHTML = filtered
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((application) => {
      const roles = Array.isArray(application.roles) ? application.roles.join(', ') : application.roles || '—';
      const characters = (application.characters || [])
        .map((char) => (char && char.name ? char.name : char))
        .filter(Boolean)
        .map((name) => `<span class="pill">${escapeHTML(name)}</span>`)
        .join('');
      const repeats = application.isRepeat
        ? '<span class="application-pill" title="Matching Discord, email, or characters found">Repeat applicant</span>'
        : '';
      const trail = (application.reviewTrail || [])
        .map((entry) => {
          const reviewer = state.players.find((player) => player.id === entry.adminPlayerId);
          const vote = entry.vote ? `<span class="application-pill">Vote ${entry.vote}/5</span>` : '';
          return `<li><div class="trail-head"><strong>${escapeHTML(reviewer?.displayName || 'Officer')}</strong><span class="application-pill">${escapeHTML(entry.status)}</span>${vote}</div><p class="subtitle">${formatDate(entry.createdAt)}</p><p>${escapeHTML(entry.note)}</p></li>`;
        })
        .join('');
      const trailBlock = trail
        ? `<div class="application-trail"><h5>Officer votes</h5><ul>${trail}</ul></div>`
        : '<p class="subtitle">No officer has weighed in yet.</p>';
      const voteValue = Number((application.reviewTrail || []).slice(-1)[0]?.vote ?? application.vote ?? '');
      return `
        <article class="card application-card">
          <div>
            <h4>${escapeHTML(application.applicantName || 'Unknown')}
              <span class="sub">${escapeHTML(application.code || '')}</span>
            </h4>
            <p class="subtitle">${escapeHTML(application.discordTag || '')} · ${escapeHTML(application.email || 'No email')}</p>
            <p class="subtitle">Server ${escapeHTML(application.server || 'Unknown')} · Submitted ${formatDate(application.createdAt)}</p>
            <div class="application-grid">
              <div>
                <p class="eyebrow">Schedule</p>
                <p>${escapeHTML(application.availability?.daysPerWeek || '—')} days · ${escapeHTML(application.availability?.usualDays || 'No days listed')}</p>
                <p class="subtitle">${escapeHTML(application.availability?.timeWindow || '')}</p>
              </div>
              <div>
                <p class="eyebrow">Playstyle</p>
                <p>Hours in game: ${escapeHTML(application.gameplay?.hoursInGame || '—')}</p>
                <p class="subtitle">Fav: ${escapeHTML(application.gameplay?.favoriteMode || '—')} · Most played: ${escapeHTML(application.gameplay?.mostPlayedMode || '—')}</p>
              </div>
              <div>
                <p class="eyebrow">Bosses</p>
                <p>${escapeHTML(application.gameplay?.bosses || 'Not shared')}</p>
              </div>
              <div>
                <p class="eyebrow">Roles / characters</p>
                <p>${escapeHTML(roles)}</p>
                <div class="pill-row">${characters || '<span class="pill muted">No characters listed</span>'}</div>
              </div>
            </div>
            <p class="subtitle">${escapeHTML(application.notes || '')}</p>
            <footer>
              <span class="application-pill">Status: ${escapeHTML(application.status)}</span>
              ${repeats}
              <span class="application-pill">${application.reviewTrail?.length || 0} review notes</span>
            </footer>
            ${trailBlock}
          </div>
          <div>
            <form class="decision-form application-review" data-id="${application.id}">
              <label>Status<select name="status">
                <option value="approved" ${application.status === 'approved' ? 'selected' : ''}>Approve</option>
                <option value="denied" ${application.status === 'denied' ? 'selected' : ''}>Deny</option>
                <option value="pending" ${application.status === 'pending' ? 'selected' : ''}>Pending</option>
              </select></label>
              <label>Vote
                <select name="vote">
                  <option value="">—</option>
                  <option value="1" ${voteValue === 1 ? 'selected' : ''}>1</option>
                  <option value="2" ${voteValue === 2 ? 'selected' : ''}>2</option>
                  <option value="3" ${voteValue === 3 ? 'selected' : ''}>3</option>
                  <option value="4" ${voteValue === 4 ? 'selected' : ''}>4</option>
                  <option value="5" ${voteValue === 5 ? 'selected' : ''}>5</option>
                </select>
              </label>
              <label>Reply / reason<textarea name="note" rows="3" required>${escapeHTML(application.decisionNote || '')}</textarea></label>
              <button type="submit">Send decision</button>
            </form>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderBounties() {
  if (!state.bounties.length) {
    elements.bountyList.innerHTML = '<div class="empty-state">Create daily or weekly bounties to motivate the guild.</div>';
    return;
  }
  const sorted = [...state.bounties].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  elements.bountyList.innerHTML = sorted
    .map(
      (bounty) => `
        <article class="card">
          <h4>${escapeHTML(bounty.title)}</h4>
          <p class="subtitle">${escapeHTML(bounty.type)} · ${bounty.isActive ? 'Active' : 'Disabled'}</p>
          <p>${escapeHTML(bounty.description)}</p>
          <p class="subtitle">Reward: ${bounty.rewardAmount} HP</p>
          <pre>${escapeHTML(JSON.stringify(bounty.requirements || {}, null, 2))}</pre>
        </article>
      `
    )
    .join('');
}

function renderAdminLog() {
  if (!state.adminLog.length) {
    elements.adminLogList.innerHTML = '<div class="empty-state">Admin actions will appear here.</div>';
    return;
  }
  const sorted = [...state.adminLog].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  elements.adminLogList.innerHTML = `
    <div class="card">
      <div class="table-scroll">
        <table class="admin-log-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            ${sorted
              .map((entry) => {
                const admin = state.players.find((player) => player.id === entry.adminPlayerId);
                const meta = entry.metadata ? escapeHTML(JSON.stringify(entry.metadata)) : '—';
                return `
                  <tr>
                    <td>${formatDate(entry.createdAt)}</td>
                    <td>${escapeHTML(admin?.displayName || 'System')}</td>
                    <td>${escapeHTML(entry.actionType)}</td>
                    <td><code>${meta}</code></td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTraitOptions() {
  const traits = state.settings.traitOptions || [];
  if (!traits.length) {
    elements.traitFieldset.innerHTML = '<p class="subtitle">No custom trait tags configured.</p>';
    return;
  }
  elements.traitFieldset.innerHTML = traits
    .map(
      (trait) => `
        <label>
          <input type="checkbox" name="traits" value="${escapeHTML(trait)}" />
          ${escapeHTML(trait)}
        </label>
      `
    )
    .join('');
}

function renderLfgCharacters() {
  if (!elements.lfgHostCharacterSelect || !elements.lfgHostSelect) return;
  const hostId = elements.lfgHostSelect.value || getActorId();
  const options = state.characters
    .filter((char) => char.playerId === hostId)
    .map((char) => `<option value="${char.id}">${escapeHTML(char.name)} · ${escapeHTML(char.clazz)}</option>`)
    .join('');
  elements.lfgHostCharacterSelect.innerHTML = options || '<option value="">No characters on file</option>';
}

function renderSelects() {
  const playerOptions = state.players
    .map((player) => `<option value="${player.id}">${escapeHTML(player.displayName)}</option>`)
    .join('');
  elements.characterPlayerSelect.innerHTML = playerOptions;
  elements.characterPlayerSelect.value = getActorId() || state.players[0]?.id || '';
  elements.participantsSelect.innerHTML = playerOptions;
  elements.awardPlayerSelect.innerHTML = `<option value="" disabled selected>Select player</option>${playerOptions}`;
  elements.membershipPlayerSelect.innerHTML = `<option value="" disabled selected>Select player</option>${playerOptions}`;
  if (elements.presencePlayerSelect) {
    elements.presencePlayerSelect.innerHTML = `<option value="" disabled selected>Select player</option>${playerOptions}`;
  }
  if (elements.lfgActorSelect) {
    elements.lfgActorSelect.innerHTML = `<option value="" disabled>Select player</option>${playerOptions}`;
    const actorId = getActorId();
    elements.lfgActorSelect.value = actorId;
  }
  if (elements.lfgHostSelect) {
    elements.lfgHostSelect.innerHTML = `<option value="" disabled>Select player</option>${playerOptions}`;
    elements.lfgHostSelect.value = getActorId();
  }

  renderLfgCharacters();

  const runOptions = state.runs
    .map((run) => `<option value="${run.id}">${escapeHTML(run.label)}</option>`)
    .join('');
  elements.reportRunSelect.innerHTML =
    runOptions || '<option value="" disabled selected>Create a run first</option>';

  const characterOptions = state.characters
    .map((char) => {
      const owner = state.players.find((player) => player.id === char.playerId);
      return `<option value="${char.id}">${escapeHTML(char.name)} · ${escapeHTML(owner?.displayName || 'Unknown')}</option>`;
    })
    .join('');
  elements.reportCharacterSelect.innerHTML =
    characterOptions || '<option value="" disabled selected>Create a character first</option>';

  const rankSet = Array.from(new Set([...rankOptions, ...state.players.map((player) => player.rank).filter(Boolean)]));
  elements.membershipRankSelect.innerHTML = rankSet
    .map((rank) => `<option value="${rank}">${escapeHTML(rank)}</option>`)
    .join('');
  elements.membershipRoleSelect.innerHTML = roleOptions
    .map((role) => `<option value="${role}">${escapeHTML(role)}</option>`)
    .join('');

  if (elements.applicationReviewerId) {
    const reviewers = state.players.filter((player) => ['officer', 'admin'].includes(player.role));
    const reviewerOptions = reviewers
      .map((player) => `<option value="${player.id}">${escapeHTML(player.displayName)} (${escapeHTML(player.role)})</option>`)
      .join('');
    elements.applicationReviewerId.innerHTML = `<option value="" disabled selected>Choose reviewer</option>${reviewerOptions}`;
  }

  updateMembershipDefaults();
}

function updateMembershipDefaults() {
  if (!elements.membershipPlayerSelect) return;
  const selectedId = elements.membershipPlayerSelect.value || state.players[0]?.id;
  if (selectedId && !elements.membershipPlayerSelect.value) {
    elements.membershipPlayerSelect.value = selectedId;
  }
  const player = state.players.find((p) => p.id === elements.membershipPlayerSelect.value);
  if (player) {
    if (player.rank && Array.from(elements.membershipRankSelect.options).some((opt) => opt.value === player.rank)) {
      elements.membershipRankSelect.value = player.rank;
    }
    if (player.role && Array.from(elements.membershipRoleSelect.options).some((opt) => opt.value === player.role)) {
      elements.membershipRoleSelect.value = player.role;
    }
    elements.membershipIsMember.checked = Boolean(player.isMember);
    updateMembershipReasonVisibility();
  }
}

function updateMembershipReasonVisibility() {
  if (!elements.membershipReasonRow) return;
  const isMember = elements.membershipIsMember?.checked;
  elements.membershipReasonRow.hidden = Boolean(isMember);
}

function populateSettingsForm() {
  const form = document.getElementById('settingsForm');
  const { drasticScore, runVerification, traitOptions } = state.settings;
  form.lowThreshold.value = drasticScore.lowThreshold;
  form.highThreshold.value = drasticScore.highThreshold;
  form.lowCommentMinLength.value = drasticScore.lowCommentMinLength;
  form.highCommentMinLength.value = drasticScore.highCommentMinLength;
  form.minReporters.value = runVerification.minReporters;
  if (form.participationHonor) {
    form.participationHonor.value = runVerification.participationHonor ?? runVerification.participationGF ?? 0;
  }
  if (form.reportHonor) {
    form.reportHonor.value = runVerification.reportHonor ?? runVerification.reportGF ?? 0;
  }
  if (form.presenceTtl) {
    form.presenceTtl.value = state.settings.presence?.ttlMinutes ?? 5;
  }
  form.traitOptions.value = (traitOptions || []).join(', ');
}

function renderAll() {
  renderMetrics();
  renderPresence();
  renderInbox();
  renderPlayers();
  renderRuns();
  renderReports();
  renderApplications();
  renderBounties();
  renderAdminLog();
  renderTraitOptions();
  renderSelects();
  renderLfgBoard();
  populateSettingsForm();
  renderSearchResults();
}

async function loadData() {
  try {
    showToast('Refreshing data…');
    const [settings, players, runs, reports, applications, bounties, lfgPosts, adminLog, characters] = await Promise.all([
      fetchJSON('/settings'),
      fetchJSON('/players'),
      fetchJSON('/runs'),
      fetchJSON('/reports'),
      fetchJSON('/applications'),
      fetchJSON('/bounties'),
      fetchJSON('/lfg'),
      fetchJSON('/admin-log'),
      fetchJSON('/characters')
    ]);
    state.settings = settings;
    state.players = players;
    state.runs = runs;
    state.reports = reports;
    state.applications = applications;
    state.bounties = bounties;
    state.lfgPosts = lfgPosts;
    state.adminLog = adminLog;
    state.characters = characters;
    setActorId(getActorId());
    const desiredView = actorIsOfficer() ? 'officer' : actorIsMember() ? 'member' : 'recruit';
    setView(desiredView);
    renderAll();
    showToast('Data refreshed', 'success');
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

function formToJSON(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function renderSearchResults() {
  if (elements.runSearchResults) {
    elements.runSearchResults.innerHTML = state.search.runs.length
      ? state.search.runs
          .map((run) => {
            const participants = (run.participantDetails || run.participants || [])
              .map((participant) => {
                if (typeof participant === 'string') {
                  const player = state.players.find((p) => p.id === participant);
                  return escapeHTML(player?.displayName || 'Unknown');
                }
                return escapeHTML(participant.displayName || 'Unknown');
              })
              .map((name) => `<li>${name}</li>`)
              .join('');
            return `
              <article class="card search-result">
                <h4>${escapeHTML(run.code || run.id)} · ${escapeHTML(run.label || 'Untitled run')}</h4>
                <p class="subtitle">${escapeHTML(run.mode || '')} · ${run.reporterCount || 0} reports · ${formatDate(run.scheduledAt || run.createdAt)}</p>
                <ul>${participants || '<li>No participants recorded</li>'}</ul>
              </article>
            `;
          })
          .join('')
      : '<div class="empty-state">Search to see runs by date or teammate.</div>';
  }

  if (elements.reportSearchResults) {
    elements.reportSearchResults.innerHTML = state.search.reports.length
      ? state.search.reports
          .map((report) => {
            const character = state.characters.find((char) => char.id === report.characterId);
            const player = state.players.find((p) => p.id === report.playerId);
            const run = state.runs.find((r) => r.id === report.runId);
            return `
              <article class="card search-result">
                <h4>${escapeHTML(report.code || report.id)} · ${escapeHTML(character?.name || 'Unknown')}</h4>
                <p class="subtitle">${escapeHTML(player?.displayName || 'Unknown')} · ${escapeHTML(run?.label || 'Run')}</p>
                <p class="subtitle">${formatDate(report.createdAt)} · Score ${report.score}</p>
                <p>${escapeHTML(report.comment || '')}</p>
              </article>
            `;
          })
          .join('')
      : '<div class="empty-state">Search by character, report ID, or day.</div>';
  }
}

function renderLfgBoard() {
  if (!elements.lfgList) return;
  if (!state.lfgPosts.length) {
    elements.lfgList.innerHTML = '<div class="empty-state">No squads posted yet. Light the brazier to start one.</div>';
    return;
  }
  const actorId = getActorId();
  const actor = state.players.find((player) => player.id === actorId);
  const canModerate = (hostId) => {
    if (!actor) return false;
    if (actor.id === hostId) return true;
    return ['officer', 'admin'].includes(actor.role);
  };

  elements.lfgList.innerHTML = state.lfgPosts
    .map((post) => {
      const host = state.players.find((player) => player.id === post.hostPlayerId);
      const character = state.characters.find((char) => char.id === post.characterId);
      const requests = post.requests || [];
      const statusChip =
        post.status === 'open'
          ? '<span class="chip">Open</span>'
          : '<span class="chip danger">Closed</span>';
      const requestList = requests.length
        ? requests
            .map((request) => {
              const applicant = state.players.find((player) => player.id === request.playerId);
              const statusClass =
                request.status === 'accepted' ? 'success' : request.status === 'declined' ? 'danger' : 'neutral';
              const statusLabel = request.status === 'pending' ? 'Pending' : request.status;
              const repeat = request.isRepeat ? '<span class="chip danger">Repeat</span>' : '';
              const actions =
                request.status === 'pending' && canModerate(post.hostPlayerId)
                  ? `
                      <div class="lfg-actions">
                        <button type="button" data-lfg-action="accept" data-post-id="${post.id}" data-request-id="${request.id}">Accept</button>
                        <button type="button" class="ghost" data-lfg-action="decline" data-post-id="${post.id}" data-request-id="${request.id}">Decline</button>
                      </div>
                    `
                  : '';
              const note = request.note ? `<p class="subtitle">Note: ${escapeHTML(request.note)}</p>` : '';
              return `
                <div class="lfg-request">
                  <header>
                    <strong>${escapeHTML(applicant?.displayName || 'Unknown')}</strong>
                    <span class="chip ${statusClass}">${escapeHTML(statusLabel)}</span>
                  </header>
                  <p class="subtitle">${escapeHTML(request.message || 'No message')}</p>
                  ${repeat}
                  ${note}
                  <p class="subtitle">${formatDate(request.createdAt)}</p>
                  ${actions}
                </div>
              `;
            })
            .join('')
        : '<p class="subtitle">No join requests yet.</p>';

      const applyForm =
        post.status === 'open'
          ? `
              <form class="lfg-apply" data-post-id="${post.id}">
                <textarea name="message" rows="2" maxlength="160" placeholder="I can join 9-11pm. Bringing heals."></textarea>
                <button type="submit">Request to join</button>
              </form>
            `
          : '<p class="subtitle">Closed to new requests</p>';

      return `
        <article class="card lfg-card">
          <div class="lfg-meta">
            <h4>${escapeHTML(post.label || 'Guild run')} <span class="sub">${escapeHTML(post.code || '')}</span> ${statusChip}</h4>
            <p class="subtitle">Host: ${escapeHTML(host?.displayName || 'Unknown')} ${character ? `· ${escapeHTML(character.name)} (${escapeHTML(character.clazz)})` : ''}</p>
            <p class="subtitle">${escapeHTML(post.mode || '')} · ${formatDate(post.scheduledAt || post.createdAt)}</p>
            <p>${escapeHTML(post.goal || 'Bring your best loot bag.')}</p>
            ${applyForm}
          </div>
          <div class="lfg-requests">
            <h5>Requests (${requests.length})</h5>
            ${requestList}
          </div>
        </article>
      `;
    })
    .join('');
}

async function performRunSearch(formData) {
  const params = new URLSearchParams();
  ['date', 'playerQuery', 'q'].forEach((key) => {
    const value = formData.get(key);
    if (value) params.append(key, value.trim());
  });
  const query = params.toString();
  const results = await fetchJSON(`/runs${query ? `?${query}` : ''}`);
  state.search.runs = results;
  renderSearchResults();
}

async function performReportSearch(formData) {
  const params = new URLSearchParams();
  ['date', 'playerName', 'characterName', 'code'].forEach((key) => {
    const value = formData.get(key);
    if (value) params.append(key, value.trim());
  });
  const query = params.toString();
  const results = await fetchJSON(`/reports${query ? `?${query}` : ''}`);
  state.search.reports = results;
  renderSearchResults();
}

function setupScrollLinks() {
  document.querySelectorAll('[data-scroll]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const selector = trigger.getAttribute('data-scroll');
      const target = document.querySelector(selector);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function guardMemberAction() {
  if (!actorIsMember()) {
    showToast('Members only—apply in the Recruit desk first.', 'error');
    setView('recruit');
    return false;
  }
  return true;
}

function guardOfficerAction() {
  if (!actorIsOfficer()) {
    showToast('Officer Lounge is locked—use an officer profile + key.', 'error');
    setView(actorIsMember() ? 'member' : 'recruit');
    return false;
  }
  return true;
}

function setView(view) {
  let nextView = view;
  if (view === 'officer' && !actorIsOfficer()) {
    nextView = actorIsMember() ? 'member' : 'recruit';
  }
  if (view === 'member' && !actorIsMember()) {
    nextView = 'recruit';
  }
  state.view = nextView;
  document.body.classList.remove('view-member', 'view-officer', 'view-recruit');
  document.body.classList.add(`view-${nextView}`);
  document.querySelectorAll('#viewToggle button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === nextView);
    if (button.dataset.view === 'member') {
      button.disabled = !actorIsMember();
    }
    if (button.dataset.view === 'officer') {
      button.disabled = !actorIsOfficer();
    }
  });
}

document.body.classList.add('view-member');
setupScrollLinks();
document.querySelectorAll('#viewToggle button').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});
setView('member');

if (elements.lfgActorSelect) {
  elements.lfgActorSelect.addEventListener('change', (event) => {
    if (event.target.value) {
      setActorId(event.target.value);
    }
  });
}

if (elements.lfgHostSelect) {
  elements.lfgHostSelect.addEventListener('change', () => {
    renderLfgCharacters();
  });
}

if (elements.applicationFilter) {
  elements.applicationFilter.addEventListener('change', renderApplications);
}

if (elements.inboxToggle) {
  elements.inboxToggle.addEventListener('click', () => {
    const isHidden = elements.inboxPanel.hidden;
    elements.inboxPanel.hidden = !isHidden;
    elements.inboxToggle.setAttribute('aria-expanded', String(isHidden));
  });
}

if (elements.applicationScheduleForm) {
  elements.applicationScheduleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (elements.applicationForm && !elements.applicationForm.reportValidity()) {
      return;
    }
    if (!event.target.reportValidity()) {
      return;
    }
    const basics = elements.applicationForm ? formToJSON(elements.applicationForm) : {};
    const schedule = formToJSON(event.target);
    const payload = {
      ...basics,
      ...schedule,
      roles: schedule.roles ? schedule.roles.split(',').map((item) => item.trim()).filter(Boolean) : [],
      characters: schedule.characters
        ? schedule.characters
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
            .map((name) => ({ name }))
        : [],
      bosses: schedule.bosses
    };
    try {
      await fetchJSON('/applications', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Application submitted—officers will reply soon.', 'success');
      event.target.reset();
      if (elements.applicationForm) {
        elements.applicationForm.reset();
      }
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.lfgPostForm) {
  elements.lfgPostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!guardMemberAction()) return;
    const payload = formToJSON(event.target);
    if (!payload.hostPlayerId) {
      showToast('Pick the host player first', 'error');
      return;
    }
    if (payload.scheduledAt) {
      payload.scheduledAt = new Date(payload.scheduledAt).toISOString();
    }
    try {
      await fetchJSON('/lfg', {
        method: 'POST',
        body: JSON.stringify({ ...payload, actorPlayerId: getActorId() })
      });
      showToast('LFG posted', 'success');
      event.target.reset();
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.lfgList) {
  elements.lfgList.addEventListener('submit', async (event) => {
    const form = event.target.closest('.lfg-apply');
    if (!form) return;
    event.preventDefault();
    if (!guardMemberAction()) return;
    const message = form.message?.value || '';
    const playerId = getActorId();
    if (!playerId) {
      showToast('Choose who is applying first', 'error');
      return;
    }
    try {
      await fetchJSON(`/lfg/${form.dataset.postId}/requests`, {
        method: 'POST',
        body: JSON.stringify({ playerId, message })
      });
      showToast('Request sent', 'success');
      form.reset();
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  elements.lfgList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-lfg-action]');
    if (!button) return;
    event.preventDefault();
    const decision = button.dataset.lfgAction;
    const postId = button.dataset.postId;
    const requestId = button.dataset.requestId;
    const responderId = getActorId();
    if (!responderId) {
      showToast('Select who is responding first', 'error');
      return;
    }
    try {
      await fetchJSON(`/lfg/${postId}/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ decision, responderId })
      });
      showToast('Request updated', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.applicationList) {
  elements.applicationList.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form.classList.contains('application-review')) return;
    if (!guardOfficerAction()) return;
    event.preventDefault();
    const data = formToJSON(form);
    const adminPlayerId = elements.applicationReviewerId?.value;
    if (!adminPlayerId) {
      showToast('Choose a reviewer before sending a decision.', 'error');
      return;
    }
    const vote = Number(data.vote);
    try {
      await fetchJSON(`/applications/${form.dataset.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: data.status,
          note: data.note,
          vote: Number.isFinite(vote) ? vote : null,
          adminPlayerId
        })
      });
      showToast('Application updated', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

document.getElementById('playerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guardOfficerAction()) return;
  const data = formToJSON(event.target);
  data.isMember = data.isMember === 'on';
  data.adminPlayerId = getActorId();
  try {
    await fetchJSON('/players', { method: 'POST', body: JSON.stringify(data) });
    showToast('Player created', 'success');
    event.target.reset();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('characterForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToJSON(event.target);
  if (!data.playerId) {
    showToast('Select a player first', 'error');
    return;
  }
  try {
    await fetchJSON(`/players/${data.playerId}/characters`, { method: 'POST', body: JSON.stringify(data) });
    showToast('Character added', 'success');
    event.target.reset();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('runForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guardMemberAction()) return;
  const form = event.target;
  const formData = new FormData(form);
  const participants = Array.from(form.participants.selectedOptions || []).map((option) => option.value);
  const payload = {
    label: formData.get('label'),
    mode: formData.get('mode'),
    participants
  };
  try {
    await fetchJSON('/runs', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Run logged', 'success');
    form.reset();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('reportForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guardMemberAction()) return;
  const form = event.target;
  const formData = new FormData(form);
  const traits = Array.from(form.querySelectorAll('input[name="traits"]:checked')).map((input) => input.value);
  const screenshots = (formData.get('screenshots') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const payload = {
    runId: formData.get('runId'),
    characterId: formData.get('characterId'),
    score: Number(formData.get('score')),
    comment: formData.get('comment'),
    stats: {
      kills: Number(formData.get('kills') || 0),
      deaths: Number(formData.get('deaths') || 0),
      bossKills: Number(formData.get('bossKills') || 0)
    },
    extracted: formData.get('extracted') === 'on',
    traits,
    screenshots,
    uploadBlobs
  };
  try {
    await fetchJSON('/reports', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Report submitted', 'success');
    form.reset();
    uploadBlobs = [];
    renderUploadPreview();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

if (elements.membershipPlayerSelect) {
  elements.membershipPlayerSelect.addEventListener('change', updateMembershipDefaults);
}

if (elements.membershipIsMember) {
  elements.membershipIsMember.addEventListener('change', updateMembershipReasonVisibility);
}

const membershipForm = document.getElementById('membershipForm');
if (membershipForm) {
  membershipForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!guardOfficerAction()) return;
    const formData = new FormData(event.target);
    const playerId = formData.get('playerId');
    if (!playerId) {
      showToast('Select a player to update', 'error');
      return;
    }
    const payload = {
      rank: formData.get('rank'),
      role: formData.get('role'),
      isMember: formData.get('isMember') === 'on'
    };
    const removalReason = (formData.get('removalReason') || '').trim();
    if (!payload.isMember && !removalReason) {
      showToast('Share why this player is losing membership.', 'error');
      return;
    }
    if (!payload.isMember) {
      payload.removalReason = removalReason;
    }
    payload.adminPlayerId = getActorId();
    try {
      await fetchJSON(`/players/${playerId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Player updated', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.presenceForm) {
  elements.presenceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!guardMemberAction()) return;
    const formData = new FormData(event.target);
    const playerId = formData.get('playerId');
    if (!playerId) {
      showToast('Select a player to ping.', 'error');
      return;
    }
    const payload = {
      playerId,
      status: formData.get('status'),
      note: (formData.get('note') || '').trim()
    };
    try {
      await fetchJSON('/presence/ping', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Presence updated', 'success');
      event.target.reset();
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.presenceToggle && elements.presencePanel) {
  elements.presenceToggle.addEventListener('click', () => {
    const isHidden = elements.presencePanel.hidden;
    elements.presencePanel.hidden = !isHidden;
    elements.presenceToggle.setAttribute('aria-expanded', String(isHidden));
  });
}

document.getElementById('bountyForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guardOfficerAction()) return;
  const formData = new FormData(event.target);
  const requirementsInput = formData.get('requirements');
  let requirements = {};
  if (requirementsInput) {
    try {
      requirements = JSON.parse(requirementsInput);
    } catch (error) {
      requirements = { note: requirementsInput };
    }
  }
  const payload = {
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    requirements,
    rewardAmount: Number(formData.get('rewardAmount')),
    isActive: formData.get('isActive') === 'on',
    adminPlayerId: getActorId()
  };
  try {
    await fetchJSON('/bounties', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Bounty created', 'success');
    event.target.reset();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('settingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guardOfficerAction()) return;
  const formData = new FormData(event.target);
  const traitOptions = (formData.get('traitOptions') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const payload = {
    drasticScore: {
      lowThreshold: Number(formData.get('lowThreshold')),
      highThreshold: Number(formData.get('highThreshold')),
      lowCommentMinLength: Number(formData.get('lowCommentMinLength')),
      highCommentMinLength: Number(formData.get('highCommentMinLength'))
    },
    runVerification: {
      minReporters: Number(formData.get('minReporters')),
      participationHonor: Number(formData.get('participationHonor')),
      reportHonor: Number(formData.get('reportHonor'))
    },
    presence: {
      ttlMinutes: Number(formData.get('presenceTtl')) || 5
    },
    traitOptions,
    adminPlayerId: getActorId()
  };
  try {
    await fetchJSON('/settings', { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Settings saved', 'success');
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('awardForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guardOfficerAction()) return;
  const formData = new FormData(event.target);
  const reasonDetail = (formData.get('reasonDetail') || '').trim();
  if (!reasonDetail) {
    showToast('Explain why you are granting Honor.', 'error');
    return;
  }
  let details = { narrative: reasonDetail };
  const detailsInput = (formData.get('detailsJson') || '').trim();
  if (detailsInput) {
    try {
      details = { ...details, ...JSON.parse(detailsInput) };
    } catch (error) {
      details.extra = detailsInput;
    }
  }
  const payload = {
    playerId: formData.get('playerId'),
    amount: Number(formData.get('amount')),
    reason: formData.get('reason') === 'adjustment' ? 'adjustment' : formData.get('reason'),
    details,
    adminPlayerId: getActorId()
  };
  if (!payload.playerId) {
    showToast('Select a player first', 'error');
    return;
  }
  try {
    await fetchJSON('/ledger/award', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Ledger entry recorded', 'success');
    event.target.reset();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

['syncPlayers', 'syncRuns', 'syncBounties', 'syncSettings', 'syncAdminLog', 'refreshButton'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      loadData();
    });
  }
});

if (elements.runSearchForm) {
  elements.runSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
      await performRunSearch(formData);
      showToast('Run search complete', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.reportSearchForm) {
  elements.reportSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
      await performReportSearch(formData);
      showToast('Report search complete', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

if (elements.clearSearchButton) {
  elements.clearSearchButton.addEventListener('click', () => {
    state.search = { runs: [], reports: [] };
    if (elements.runSearchForm) elements.runSearchForm.reset();
    if (elements.reportSearchForm) elements.reportSearchForm.reset();
    renderSearchResults();
  });
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderUploadPreview() {
  if (!elements.uploadPreview) return;
  if (!uploadBlobs.length) {
    elements.uploadPreview.innerHTML = '';
    return;
  }
  elements.uploadPreview.innerHTML = uploadBlobs
    .map(
      (blob) => `
        <li>
          <img src="${blob.data}" alt="${escapeHTML(blob.name)} preview" />
          <span>${escapeHTML(blob.name)} · ${(blob.size / 1024).toFixed(0)} KB</span>
        </li>
      `
    )
    .join('');
}

if (elements.screenshotInput) {
  elements.screenshotInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      uploadBlobs = [];
      renderUploadPreview();
      return;
    }
    try {
      const payload = await Promise.all(
        files.map(async (file) => ({ name: file.name, size: file.size, data: await toDataUrl(file) }))
      );
      uploadBlobs = payload;
      renderUploadPreview();
    } catch (error) {
      console.error(error);
      showToast('Unable to read file(s)', 'error');
    }
  });
}

loadData();
