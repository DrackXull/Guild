const state = {
  players: [],
  characters: [],
  runs: [],
  reports: [],
  bounties: [],
  adminLog: [],
  settings: {
    drasticScore: { lowThreshold: 3, highThreshold: 9, lowCommentMinLength: 140, highCommentMinLength: 80 },
    runVerification: { minReporters: 2, participationGF: 5, reportGF: 2 },
    traitOptions: []
  },
  search: { runs: [], reports: [] },
  view: 'member'
};

const elements = {
  apiBaseInput: document.getElementById('apiBase'),
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
  membershipPlayerSelect: document.getElementById('membershipPlayerId'),
  membershipRankSelect: document.getElementById('membershipRank'),
  membershipRoleSelect: document.getElementById('membershipRole'),
  membershipIsMember: document.getElementById('membershipIsMember'),
  runSearchForm: document.getElementById('runSearchForm'),
  reportSearchForm: document.getElementById('reportSearchForm'),
  clearSearchButton: document.getElementById('clearSearch'),
  uploadPreview: document.getElementById('uploadPreview'),
  screenshotInput: document.getElementById('reportScreenshotFiles'),
  statusToast: document.getElementById('statusToast')
};

const rankOptions = ['Initiate', 'Recruit', 'Raider', 'Veteran', 'Champion', 'Officer', 'Overseer'];
const roleOptions = ['guest', 'member', 'officer', 'admin'];

const defaultApiBase = localStorage.getItem('guildApiBase') || `${window.location.origin.replace(/\/$/, '')}/api`;
let toastTimer = null;
let uploadBlobs = [];

function getApiBase() {
  return (elements.apiBaseInput.value || defaultApiBase).replace(/\/$/, '');
}

function updateStoredApiBase(value) {
  const safeValue = value.replace(/\/$/, '');
  localStorage.setItem('guildApiBase', safeValue);
  elements.apiBaseInput.value = safeValue;
}

elements.apiBaseInput.value = defaultApiBase;
elements.apiBaseInput.addEventListener('change', (event) => {
  updateStoredApiBase(event.target.value.trim() || defaultApiBase);
  loadData();
});

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
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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

function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMetrics() {
  const verifiedRuns = state.runs.filter((run) => run.isVerified).length;
  const memberCount = state.players.filter((player) => player.isMember).length;
  const officerCount = state.players.filter((player) => ['officer', 'admin'].includes(player.role)).length;
  const metrics = [
    { label: 'Active members', value: memberCount },
    { label: 'Officers', value: officerCount },
    { label: 'Characters', value: state.characters.length },
    { label: 'Runs', value: state.runs.length },
    { label: 'Verified runs', value: verifiedRuns },
    { label: 'Reports', value: state.reports.length }
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
      return `
        <article class="card player-card">
          <div>
            <h4>${escapeHTML(player.displayName)} <span class="sub">${escapeHTML(player.rank)}</span></h4>
            <p class="subtitle">${escapeHTML(player.discordTag)}</p>
            <p class="subtitle">${player.isMember ? 'Guild member' : 'Guest'} · ${player.role}</p>
          </div>
          <div class="gf-pill">
            <span>Lifetime ${player.lifetimeGF}</span>
            <span>Current ${player.currentGF}</span>
          </div>
          <p class="subtitle">Joined ${formatDate(player.createdAt)}</p>
          <ul>${characterList || '<li>No characters yet</li>'}</ul>
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
          <h4>${escapeHTML(run.label)} <span class="sub">${escapeHTML(run.code)}</span></h4>
          <p class="subtitle">${escapeHTML(run.mode)} · ${run.reporterCount || run.reporterIds?.length || 0} reports</p>
          <p>${run.isVerified ? '✅ Verified' : '🕓 Awaiting verification'}</p>
          <p class="subtitle">Scheduled ${formatDate(run.scheduledAt || run.createdAt)}</p>
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
          <p class="subtitle">Reward: ${bounty.rewardAmount} GF</p>
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

function renderSelects() {
  const playerOptions = state.players
    .map((player) => `<option value="${player.id}">${escapeHTML(player.displayName)}</option>`)
    .join('');
  elements.characterPlayerSelect.innerHTML = `<option value="" disabled selected>Select player</option>${playerOptions}`;
  elements.participantsSelect.innerHTML = playerOptions;
  elements.awardPlayerSelect.innerHTML = `<option value="" disabled selected>Select player</option>${playerOptions}`;
  elements.membershipPlayerSelect.innerHTML = `<option value="" disabled selected>Select player</option>${playerOptions}`;

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
  }
}

function populateSettingsForm() {
  const form = document.getElementById('settingsForm');
  const { drasticScore, runVerification, traitOptions } = state.settings;
  form.lowThreshold.value = drasticScore.lowThreshold;
  form.highThreshold.value = drasticScore.highThreshold;
  form.lowCommentMinLength.value = drasticScore.lowCommentMinLength;
  form.highCommentMinLength.value = drasticScore.highCommentMinLength;
  form.minReporters.value = runVerification.minReporters;
  form.participationGF.value = runVerification.participationGF;
  form.reportGF.value = runVerification.reportGF;
  form.traitOptions.value = (traitOptions || []).join(', ');
}

function renderAll() {
  renderMetrics();
  renderPlayers();
  renderRuns();
  renderReports();
  renderBounties();
  renderAdminLog();
  renderTraitOptions();
  renderSelects();
  populateSettingsForm();
  renderSearchResults();
}

async function loadData() {
  try {
    showToast('Refreshing data…');
    const [settings, players, runs, reports, bounties, adminLog, characters] = await Promise.all([
      fetchJSON('/settings'),
      fetchJSON('/players'),
      fetchJSON('/runs'),
      fetchJSON('/reports'),
      fetchJSON('/bounties'),
      fetchJSON('/admin-log'),
      fetchJSON('/characters')
    ]);
    state.settings = settings;
    state.players = players;
    state.runs = runs;
    state.reports = reports;
    state.bounties = bounties;
    state.adminLog = adminLog;
    state.characters = characters;
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

function setView(view) {
  state.view = view;
  document.body.classList.remove('view-member', 'view-officer');
  document.body.classList.add(`view-${view}`);
  document.querySelectorAll('#viewToggle button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
}

document.body.classList.add('view-member');
setupScrollLinks();
document.querySelectorAll('#viewToggle button').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});
setView('member');

document.getElementById('playerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToJSON(event.target);
  data.isMember = data.isMember === 'on';
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

const membershipForm = document.getElementById('membershipForm');
if (membershipForm) {
  membershipForm.addEventListener('submit', async (event) => {
    event.preventDefault();
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
    try {
      await fetchJSON(`/players/${playerId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Player updated', 'success');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

document.getElementById('bountyForm').addEventListener('submit', async (event) => {
  event.preventDefault();
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
    isActive: formData.get('isActive') === 'on'
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
      participationGF: Number(formData.get('participationGF')),
      reportGF: Number(formData.get('reportGF'))
    },
    traitOptions
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
  const formData = new FormData(event.target);
  let details = {};
  const detailsInput = (formData.get('details') || '').trim();
  if (detailsInput) {
    try {
      details = JSON.parse(detailsInput);
    } catch (error) {
      details = { note: detailsInput };
    }
  }
  const payload = {
    playerId: formData.get('playerId'),
    amount: Number(formData.get('amount')),
    reason: formData.get('reason') === 'adjustment' ? 'adjustment' : formData.get('reason'),
    details
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
