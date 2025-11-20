const http = require('http');
const https = require('https');

const API_BASE = process.env.GUILD_API_BASE || 'http://localhost:3000/api';
const PLAYER_ID = process.env.GUILD_PLAYER_ID;
const STATUS = process.env.GUILD_PRESENCE || process.env.GUILD_STATUS || 'in_game';
const NOTE = process.env.GUILD_PRESENCE_NOTE || '';

if (!PLAYER_ID) {
  console.error('GUILD_PLAYER_ID is required.');
  process.exit(1);
}

const url = new URL('/presence/ping', API_BASE.replace(/\/$/, ''));
const payload = JSON.stringify({
  playerId: PLAYER_ID,
  status: STATUS,
  source: 'desktop-helper',
  note: NOTE
});

const client = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = client.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Presence updated:', data);
    } else {
      console.error('Presence update failed:', res.statusCode, data);
      process.exitCode = 1;
    }
  });
});

req.on('error', (error) => {
  console.error('Presence helper error:', error);
  process.exitCode = 1;
});

req.write(payload);
req.end();
