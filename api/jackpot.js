// Gemeinsamer Jackpot-Topf des Fischautomaten – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
// Alle Spieler zahlen in denselben Topf ein: die Hälfte jedes Einsatzes. Ob ein Dreh den Topf knackt,
// würfelt der Server (so selten wie drei Odfische auf den Walzen); der Topf wird dabei atomar
// geleert, damit ihn nie zwei Spieler gleichzeitig gewinnen.
//
//   GET  /api/jackpot                                  → { pot, last }
//   POST /api/jackpot {action: 'spin', stake, name?}   → { pot, jack, win? }
//
// `last` ist der letzte Gewinner ({ name, amount, at }); der Name kommt nur mit, wenn der Spieler
// in der Bestenliste steht, sonst bleibt er leer.
'use strict';
const crypto = require('crypto');
const { cleanName } = require('./_names');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const POT = 'jp:pot', LAST = 'jp:last';
const SEED = 1000;               // so viel liegt nach einem Gewinn wieder im Topf
const CUT = 0.5;                 // Anteil jedes Einsatzes
const MAX_STAKE = 50000;         // höchster Einsatz im Spiel
const MIN_STAKE = 50;
const ODDS = Math.pow(3 / 100, 3); // drei Odfische: Gewicht 3 von 100 je Walze
const SPINS_PER_MIN = 60;        // pro (gehashter) IP
// einmalige Aufstockungen des Topfs: jede id wird genau einmal gutgeschrieben (SET NX)
const BOOSTS = [['jp:boost:2026-11-06', 2000000]];

async function boost() {
  const done = await redis(BOOSTS.map(([k]) => ['SET', k, '1', 'NX']));
  const add = BOOSTS.reduce((a, [, n], i) => a + (done[i] === 'OK' ? n : 0), 0);
  if (add) await redis([['INCRBY', POT, add]]);
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function redis(cmds) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  return out.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > 1024) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

const potOf = (v) => SEED + Math.max(0, Math.round(Number(v) || 0));
function lastOf(v) {
  try {
    const j = JSON.parse(v);
    if (!j || typeof j !== 'object') return null;
    return { name: typeof j.name === 'string' ? j.name : '', amount: Math.round(Number(j.amount) || 0), at: Math.round(Number(j.at) || 0) };
  } catch { return null; }
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Der Jackpot ist noch nicht eingerichtet.' });
  try {
    await boost();
    if (req.method === 'GET') {
      const [p, l] = await redis([['GET', POT], ['GET', LAST]]);
      return send(res, 200, { pot: potOf(p), last: l ? lastOf(l) : null });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'Methode nicht erlaubt.' });
    const body = await readBody(req);
    if (body.action !== 'spin') return send(res, 400, { error: 'Unbekannte Aktion.' });
    const stake = Math.round(Number(body.stake));
    if (!Number.isFinite(stake) || stake < MIN_STAKE) return send(res, 400, { error: 'Ungültiger Einsatz.' });

    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const rl = 'jp:ip:' + sha(ip + new Date().toISOString().slice(0, 10)).slice(0, 24);
    const [n] = await redis([['INCR', rl], ['EXPIRE', rl, 60]]);
    if (n > SPINS_PER_MIN) return send(res, 429, { error: 'Zu viele Drehs – kurz warten.' });

    const add = Math.max(1, Math.round(Math.min(stake, MAX_STAKE) * CUT));
    const [after] = await redis([['INCRBY', POT, add]]);
    if (Math.random() >= ODDS) return send(res, 200, { pot: potOf(after), jack: false });

    // geknackt: Topf atomar auf null setzen und nehmen, was drin war
    const [was] = await redis([['GETSET', POT, '0']]);
    const win = potOf(was);
    const name = cleanName(body.name) || '';
    await redis([['SET', LAST, JSON.stringify({ name, amount: win, at: Date.now() })]]);
    return send(res, 200, { pot: SEED, jack: true, win });
  } catch (e) {
    return send(res, 500, { error: 'Serverfehler – bitte später nochmal.' });
  }
};
