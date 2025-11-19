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
  }
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
  statusToast: document.getElementById('statusToast')
};

const defaultApiBase = localStorage.getItem('guildApiBase') || `${window.location.origin.replace(/\/$/, '')}/api`;
let toastTimer = null;

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
  const metrics = [
    { label: 'Players', value: state.players.length },
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
            <h4>${escapeHTML(player.displayName)}</h4>
            <p class="subtitle">${escapeHTML(player.discordTag)}</p>
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
          <h4>${escapeHTML(run.label)}</h4>
          <p class="subtitle">${escapeHTML(run.mode)} · ${run.reporterCount || run.reporterIds?.length || 0} reports</p>
          <p>${run.isVerified ? '✅ Verified' : '🕓 Awaiting verification'}</p>
          <p class="subtitle">Created ${formatDate(run.createdAt)}</p>
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
          return `
            <article class="card report-card">
              <h4>${escapeHTML(character?.name || 'Unknown')} · Score ${report.score}</h4>
              <p class="subtitle">${escapeHTML(player?.displayName || 'Unknown player')} in ${escapeHTML(run?.label || 'Unknown run')}</p>
              <p>${escapeHTML(report.comment)}</p>
              <ul>${traitList || '<li>No traits noted</li>'}</ul>
              <p class="subtitle">Kills ${report.stats?.kills || 0} · Deaths ${report.stats?.deaths || 0} · Boss ${report.stats?.bossKills || 0}</p>
              <p class="subtitle">${report.extracted ? 'Extracted ✅' : 'Wiped 💀'} · ${formatDate(report.createdAt)}</p>
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

document.getElementById('playerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToJSON(event.target);
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
    screenshots
  };
  try {
    await fetchJSON('/reports', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Report submitted', 'success');
    form.reset();
    loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

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

loadData();
