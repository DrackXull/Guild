const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const {
  awardHonor,
  createApplicant,
  createBounty,
  createApplication,
  createCharacter,
  createPlayer,
  createLfgPost,
  createRun,
  listApplications,
  listAdminLog,
  listCharacters,
  listBounties,
  listLfgPosts,
  listPlayers,
  listReports,
  listRuns,
  listApplicationsForApplicant,
  applyToLfgPost,
  decideLfgRequest,
  reviewApplication,
  pingPresence,
  submitReport,
  updatePlayer,
  upsertSettings
} = require('./services/guildService');
const { loadData } = require('./utils/storage');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function resolveAccess(headers) {
  const data = loadData();
  const accessKeys = data.settings?.accessKeys || {};
  const memberKey = headers['x-guild-key'] || headers['x-member-key'];
  const officerKey = headers['x-officer-key'] || headers['x-admin-key'];
  const isOfficer = Boolean(officerKey && accessKeys.officerKey && officerKey === accessKeys.officerKey);
  const isMember = isOfficer || Boolean(memberKey && accessKeys.memberKey && memberKey === accessKeys.memberKey);
  return { isMember, isOfficer, settings: data.settings };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (error) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  send(res, 404, { error: 'Not found' });
}

function serveStatic(res, pathname) {
  let relativePath = pathname;
  if (relativePath === '/') {
    relativePath = '/index.html';
  }
  let filePath = path.join(FRONTEND_DIR, relativePath);
  if (!filePath.startsWith(FRONTEND_DIR)) {
    send(res, 403, { error: 'Forbidden' });
    return true;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function serveUpload(res, pathname) {
  const relative = pathname.replace('/uploads/', '');
  const filePath = path.join(UPLOAD_DIR, relative);
  if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Guild-Key, X-Member-Key, X-Officer-Key, X-Admin-Key');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const allowUnauthed =
    url.pathname === '/api/health' || (url.pathname === '/api/applications' && method === 'POST');
  const access = url.pathname.startsWith('/api/') && !allowUnauthed ? resolveAccess(req.headers) : { isMember: true, isOfficer: false };

  if (url.pathname.startsWith('/api/') && !allowUnauthed && !access.isMember) {
    send(res, 403, { error: 'Guild key required for member areas.' });
    return;
  }

  try {
    if (url.pathname === '/api/health' && method === 'GET') {
      send(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    if (url.pathname === '/api/settings' && method === 'GET') {
      const data = loadData();
      send(res, 200, data.settings);
      return;
    }

    if (url.pathname === '/api/settings' && method === 'PUT') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to change settings.' });
        return;
      }
      const body = await readBody(req);
      const settings = upsertSettings(body, body.adminPlayerId || null);
      send(res, 200, settings);
      return;
    }

    if (url.pathname === '/api/players' && method === 'GET') {
      send(res, 200, listPlayers());
      return;
    }

    if (url.pathname === '/api/players' && method === 'POST') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to add players.' });
        return;
      }
      const body = await readBody(req);
      const player = createPlayer(body, body.adminPlayerId || null);
      send(res, 201, player);
      return;
    }

    if (url.pathname === '/api/applications' && method === 'GET') {
      const filters = Object.fromEntries(url.searchParams.entries());
      if (filters.applicantPlayerId && !access.isOfficer) {
        send(res, 200, listApplicationsForApplicant(filters.applicantPlayerId));
        return;
      }
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to view applications.' });
        return;
      }
      send(res, 200, listApplications(filters));
      return;
    }

    if (url.pathname === '/api/applicants' && method === 'POST') {
      const body = await readBody(req);
      const applicant = createApplicant(body);
      send(res, 201, applicant);
      return;
    }

    if (url.pathname === '/api/applications' && method === 'POST') {
      const body = await readBody(req);
      const application = createApplication(body);
      send(res, 201, application);
      return;
    }

    if (url.pathname.startsWith('/api/applications/') && method === 'PUT') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to review applications.' });
        return;
      }
      const applicationId = url.pathname.split('/')[3];
      const body = await readBody(req);
      const application = reviewApplication(applicationId, body);
      send(res, 200, application);
      return;
    }

    if (url.pathname === '/api/lfg' && method === 'GET') {
      const filters = Object.fromEntries(url.searchParams.entries());
      send(res, 200, listLfgPosts(filters));
      return;
    }

    if (url.pathname === '/api/lfg' && method === 'POST') {
      const body = await readBody(req);
      const post = createLfgPost(body, body.actorPlayerId || body.hostPlayerId || null);
      send(res, 201, post);
      return;
    }

    if (url.pathname.startsWith('/api/lfg/') && url.pathname.endsWith('/requests') && method === 'POST') {
      const postId = url.pathname.split('/')[3];
      const body = await readBody(req);
      const request = applyToLfgPost(postId, body);
      send(res, 201, request);
      return;
    }

    if (url.pathname.startsWith('/api/lfg/') && url.pathname.includes('/requests/') && method === 'PUT') {
      const [, , , postId, , requestId] = url.pathname.split('/');
      const body = await readBody(req);
      const request = decideLfgRequest(postId, requestId, body);
      send(res, 200, request);
      return;
    }

    if (url.pathname.startsWith('/api/players/') && url.pathname.endsWith('/characters') && method === 'POST') {
      const playerId = url.pathname.split('/')[3];
      const body = await readBody(req);
      const character = createCharacter(playerId, body);
      send(res, 201, character);
      return;
    }

    if (url.pathname === '/api/runs' && method === 'GET') {
      const filters = Object.fromEntries(url.searchParams.entries());
      send(res, 200, listRuns(filters));
      return;
    }

    if (url.pathname === '/api/runs' && method === 'POST') {
      const body = await readBody(req);
      const run = createRun(body);
      send(res, 201, run);
      return;
    }

    if (url.pathname === '/api/reports' && method === 'GET') {
      const filters = Object.fromEntries(url.searchParams.entries());
      send(res, 200, listReports(filters));
      return;
    }

    if (url.pathname === '/api/reports' && method === 'POST') {
      const body = await readBody(req);
      const report = submitReport(body);
      send(res, 201, report);
      return;
    }

    if (url.pathname.startsWith('/api/players/') && method === 'PUT') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to update players.' });
        return;
      }
      const playerId = url.pathname.split('/')[3];
      const body = await readBody(req);
      const player = updatePlayer(playerId, body, body.adminPlayerId || null);
      send(res, 200, player);
      return;
    }

    if (url.pathname === '/api/ledger/award' && method === 'POST') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to adjust Honor.' });
        return;
      }
      const body = await readBody(req);
      const totals = awardHonor(body.playerId, body.amount, body.reason, body.details, body.adminPlayerId || null);
      send(res, 200, totals);
      return;
    }

    if (url.pathname === '/api/presence/ping' && method === 'POST') {
      const body = await readBody(req);
      const presence = pingPresence(body);
      send(res, 200, presence);
      return;
    }

    if (url.pathname === '/api/admin-log' && method === 'GET') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to view admin log.' });
        return;
      }
      send(res, 200, listAdminLog());
      return;
    }

    if (url.pathname === '/api/characters' && method === 'GET') {
      const playerId = url.searchParams.get('playerId');
      send(res, 200, listCharacters(playerId));
      return;
    }

    if (url.pathname === '/api/bounties' && method === 'GET') {
      send(res, 200, listBounties());
      return;
    }

    if (url.pathname === '/api/bounties' && method === 'POST') {
      if (!access.isOfficer) {
        send(res, 403, { error: 'Officer key required to create bounties.' });
        return;
      }
      const body = await readBody(req);
      const bounty = createBounty(body, body.adminPlayerId || null);
      send(res, 201, bounty);
      return;
    }

    if (url.pathname.startsWith('/uploads/') && method === 'GET') {
      if (serveUpload(res, url.pathname)) {
        return;
      }
      notFound(res);
      return;
    }

    if (!url.pathname.startsWith('/api/') && method === 'GET') {
      serveStatic(res, url.pathname);
      return;
    }

    notFound(res);
  } catch (error) {
    console.error(error);
    send(res, 400, { error: error.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Guild Nexus API server listening on port ${PORT}`);
  });
}

module.exports = server;
