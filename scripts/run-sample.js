const http = require('http');
const { spawn } = require('child_process');

function request(options, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function run() {
  const server = spawn('node', ['src/server.js'], { env: { ...process.env, PORT: '3100' } });
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('listening')) {
        resolve();
      }
    });
  });

  const unique = Date.now().toString().slice(-6);

  const baseOptions = {
    hostname: '127.0.0.1',
    port: 3100,
    headers: { 'Content-Type': 'application/json' }
  };

  const player = await request({ ...baseOptions, path: '/api/players', method: 'POST' }, {
    discordTag: `tester#${unique}`,
    displayName: `Test Pilot ${unique}`
  });

  const character = await request({ ...baseOptions, path: `/api/players/${player.body.id}/characters`, method: 'POST' }, {
    name: `PilotMain-${unique}`,
    clazz: 'Fighter'
  });

  const run = await request({ ...baseOptions, path: '/api/runs', method: 'POST' }, {
    label: `Sample Run ${unique}`,
    mode: 'High Roller',
    participants: [player.body.id]
  });

  const report = await request({ ...baseOptions, path: '/api/reports', method: 'POST' }, {
    runId: run.body.id,
    characterId: character.body.id,
    score: 5,
    comment: 'Solid performance with detailed test script feedback to meet drastic rules requirements.',
    stats: { kills: 3, deaths: 1, bossKills: 0 },
    traits: ['Team player']
  });

  console.log('Sample test run complete:', {
    player: player.body.id,
    character: character.body.id,
    run: run.body.id,
    reportStatus: report.status
  });

  server.kill();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
