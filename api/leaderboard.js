// Bestenliste für „Fischen!“ – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
//
//   GET    /api/leaderboard                     → Top 10 jeder Liste (30 s im CDN gecacht;
//                                                  „klein“ aufsteigend, sonst absteigend)
//   POST   /api/leaderboard {id, token, name, scores}  → eintragen/aktualisieren, liefert eigene Plätze
//   DELETE /api/leaderboard {id, token}         → eigenen Eintrag löschen
//   DELETE /api/leaderboard {id, admin}         → Eintrag als Admin löschen (ADMIN_TOKEN)
//
// Zugangsdaten kommen aus der Vercel-Upstash-Integration (KV_REST_API_* oder UPSTASH_REDIS_REST_*).
'use strict';
const crypto = require('crypto');
const { cleanName } = require('./_names');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.ADMIN_TOKEN || '';

// Listen und was ein Wert höchstens sein kann (grobe Plausibilitätsprüfung; das Spiel läuft im
// Browser, echtes Schummeln lässt sich nicht verhindern, nur eindämmen).
const BOARDS = {
  taler:  { max: 1e10, step: (dt) => 200000 + dt * 20000 }, // insgesamt verdiente Taler
  wieder: { max: 1000, step: (dt) => 1 + dt / 240 },        // Wiedergeburten
  dex:    { max: 9999, step: () => 9999 },                  // Fische × 100 + Mutationen
  rekord: { max: 400,  step: () => 400 },                   // größter Fang in cm
  klein:  { max: 400,  step: () => 400, asc: true },        // kleinster Fang in cm (0 = noch keiner), kleiner ist besser
};
const TOP = 10;
const ID_RE = /^[a-f0-9]{16,40}$/;

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

function send(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > 4096) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}


async function top() {
  const keys = Object.keys(BOARDS);
  const lists = await redis(keys.map((b) => [BOARDS[b].asc ? 'ZRANGE' : 'ZREVRANGE', 'lb:' + b, 0, TOP - 1, 'WITHSCORES']));
  const ids = [...new Set(lists.flatMap((l) => l.filter((_, i) => i % 2 === 0)))];
  const names = ids.length ? await redis([['HMGET', 'lb:names', ...ids]]) : [[]];
  const nameOf = Object.fromEntries(ids.map((id, i) => [id, names[0][i] || '???']));
  const boards = {};
  keys.forEach((b, k) => {
    const l = lists[k], rows = [];
    for (let i = 0; i < l.length; i += 2) rows.push({ name: nameOf[l[i]], score: Number(l[i + 1]), me: sha(l[i]).slice(0, 12) });
    boards[b] = rows;
  });
  return boards;
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Die Bestenliste ist noch nicht eingerichtet.' });
  try {
    if (req.method === 'GET') {
      return send(res, 200, { boards: await top() }, 'public, s-maxage=30, stale-while-revalidate=60');
    }

    const body = await readBody(req);
    const id = String(body.id || '');
    if (!ID_RE.test(id)) return send(res, 400, { error: 'Ungültige ID.' });

    if (req.method === 'DELETE') {
      const isAdmin = ADMIN && typeof body.admin === 'string' && body.admin.length >= 16 && body.admin === ADMIN;
      if (!isAdmin) {
        const [stored] = await redis([['GET', 'lb:tok:' + id]]);
        if (!stored || stored !== sha(String(body.token || ''))) return send(res, 403, { error: 'Nicht erlaubt.' });
      }
      await redis([
        ...Object.keys(BOARDS).map((b) => ['ZREM', 'lb:' + b, id]),
        ['HDEL', 'lb:names', id], ['DEL', 'lb:tok:' + id, 'lb:last:' + id],
      ]);
      return send(res, 200, { ok: true });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Methode nicht erlaubt.' });

    const token = String(body.token || '');
    if (!/^[a-f0-9]{32,64}$/.test(token)) return send(res, 400, { error: 'Ungültiges Token.' });
    const name = cleanName(body.name);
    if (!name) return send(res, 400, { error: 'Bitte einen anderen Namen wählen (2–16 Zeichen, keine Beleidigungen).' });

    // Rate-Limit: pro Spieler 1 Eintrag / 50 s, pro IP 30 / Minute. Die IP wird nur gehasht
    // und nur für 60 Sekunden als Zähler gehalten.
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const ipKey = 'lb:ip:' + sha(ip + new Date().toISOString().slice(0, 10)).slice(0, 24);
    const [okId, ipCount] = await redis([['SET', 'lb:rl:' + id, '1', 'NX', 'EX', 50], ['INCR', ipKey], ['EXPIRE', ipKey, 60]]);
    if (okId !== 'OK') return send(res, 429, { error: 'Zu oft – gleich nochmal.' });
    if (ipCount > 30) return send(res, 429, { error: 'Zu viele Anfragen.' });

    // Token: der erste Eintrag legt es fest, danach muss es passen.
    const tokHash = sha(token);
    const [setTok, stored, last] = await redis([['SET', 'lb:tok:' + id, tokHash, 'NX'], ['GET', 'lb:tok:' + id], ['GET', 'lb:last:' + id]]);
    if (setTok !== 'OK' && stored !== tokHash) return send(res, 403, { error: 'Dieser Eintrag gehört jemand anderem.' });

    // Plausibilität gegenüber dem letzten Stand
    const prev = last ? JSON.parse(last) : { t: Date.now() - 3600e3, s: {} };
    const dt = Math.max(0, (Date.now() - prev.t) / 1000);
    const scores = {};
    for (const [b, rule] of Object.entries(BOARDS)) {
      // ältere Spielversionen schicken neue Listen noch nicht mit: dann 0 (= kein Eintrag dort)
      const raw = body.scores && body.scores[b];
      const v = raw === undefined ? 0 : Math.floor(Number(raw));
      if (!Number.isFinite(v) || v < 0 || v > rule.max) return send(res, 400, { error: 'Unplausibler Wert: ' + b });
      if (!rule.asc && v - (prev.s[b] || 0) > rule.step(dt)) return send(res, 400, { error: 'Unplausibler Sprung: ' + b });
      scores[b] = v;
    }

    const keys = Object.keys(BOARDS);
    const out = await redis([
      ['HSET', 'lb:names', id, name],
      ['SET', 'lb:last:' + id, JSON.stringify({ t: Date.now(), s: scores })],
      // aufsteigende Listen (kleinster Fang): nur echte Werte eintragen und nur verbessern (LT)
      ...keys.map((b) => BOARDS[b].asc
        ? (scores[b] > 0 ? ['ZADD', 'lb:' + b, 'LT', scores[b], id] : ['ZSCORE', 'lb:' + b, id])
        : ['ZADD', 'lb:' + b, 'GT', scores[b], id]),
      ...keys.map((b) => [BOARDS[b].asc ? 'ZRANK' : 'ZREVRANK', 'lb:' + b, id]),
      ...keys.map((b) => ['ZCARD', 'lb:' + b]),
    ]);
    const n = keys.length, ranks = {};
    keys.forEach((b, i) => { const r = out[2 + n + i]; ranks[b] = { rank: r === null ? null : r + 1, of: out[2 + 2 * n + i] }; });
    return send(res, 200, { ok: true, ranks, me: sha(id).slice(0, 12) });
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Bestenliste gerade nicht erreichbar.' });
  }
};
