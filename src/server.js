const http = require('http');
const { URL } = require('url');
const { parseBody, sendJson, notFound } = require('./utils/http');
const { listPlayers, createPlayer, addCharacter, getPlayer } = require('./services/playerService');
const { listRuns, createRun, getRun, submitRunReport } = require('./services/runService');
const { loadData } = require('./data/store');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/settings') {
      const data = loadData();
      sendJson(res, 200, data.settings);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/players') {
      sendJson(res, 200, { players: listPlayers() });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/players') {
      const body = await parseBody(req);
      const player = createPlayer(body || {});
      sendJson(res, 201, player);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/players/')) {
      const [, , , playerId] = pathname.split('/');
      if (!playerId) {
        notFound(res);
        return;
      }
      const player = getPlayer(playerId);
      if (!player) {
        notFound(res);
        return;
      }
      sendJson(res, 200, player);
      return;
    }

    if (req.method === 'POST' && pathname.match(/^\/api\/players\/.+\/characters$/)) {
      const segments = pathname.split('/');
      const playerId = segments[3];
      const body = await parseBody(req);
      const character = addCharacter(playerId, body || {});
      sendJson(res, 201, character);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/runs') {
      const runs = listRuns();
      const includeReports = searchParams.get('includeReports') === 'true';
      const data = loadData();
      const payload = includeReports ? runs.map((run) => ({
        ...run,
        reports: data.runReports.filter((report) => report.runId === run.runId)
      })) : runs;
      sendJson(res, 200, { runs: payload });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/runs') {
      const body = await parseBody(req);
      const run = createRun(body || {});
      sendJson(res, 201, run);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/runs/')) {
      const [, , , runId] = pathname.split('/');
      const run = getRun(runId);
      if (!run) {
        notFound(res);
        return;
      }
      const data = loadData();
      const reports = data.runReports.filter((report) => report.runId === runId);
      sendJson(res, 200, { ...run, reports });
      return;
    }

    if (req.method === 'POST' && pathname.match(/^\/api\/runs\/.+\/reports$/)) {
      const segments = pathname.split('/');
      const runId = segments[3];
      const body = await parseBody(req);
      const report = submitRunReport(runId, body || {});
      sendJson(res, 201, report);
      return;
    }

    notFound(res);
  } catch (error) {
    sendJson(res, 400, { message: error.message });
  }
});

function start(port = process.env.PORT || 3000) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Guild Nexus API listening on port ${port}`);
      resolve();
    });
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  start
};
