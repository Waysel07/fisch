// Bestenliste für „Fischen!“ – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
//
//   GET    /api/leaderboard                     → Top 10 jeder Liste (30 s im CDN gecacht), dazu die
//                                                  Top 3 der Wochenliste der letzten Woche (prev)
//   POST   /api/leaderboard {id, token, name, scores}  → eintragen/aktualisieren, liefert eigene Plätze
//   DELETE /api/leaderboard {id, token}         → eigenen Eintrag löschen
//   DELETE /api/leaderboard {id, admin}         → Eintrag als Admin löschen (ADMIN_TOKEN)
//   POST   /api/leaderboard {action:'stats', admin} → anonyme Zahlen für Admins: Einträge pro Liste,
//                                                  Verteilung von Prestige und Wiedergeburten
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
// Eine Liste, die ein bekannter Spieler zum ersten Mal schickt (eine neue Liste), prüft nur den
// Maximalwert, nicht den Sprung. „week“-Listen liegen pro Woche unter eigenem Schlüssel und laufen ab.
const BOARDS = {
  taler:  { max: 1e10, step: (dt) => 200000 + dt * 20000 }, // insgesamt verdiente Taler
  woche:  { max: 1200, step: () => 1200, week: true },      // größter Fisch dieser Woche in cm (ohne Müll), Montag neu
  reb:    { max: 1e5,  step: (dt) => 1 + dt / 240 },        // Wiedergeburten insgesamt (fallen beim Prestige nicht)
  dex:    { max: 99999, step: () => 99999 },                // Fische × 100 + Mutationen (über 100 Fische geht es über 9999)
  diamant: { max: 1000, step: (dt) => 1 + dt / 60 },        // Fische mit Diamant-Medaille
  rekord: { max: 1200, step: () => 1200 },                  // größter Fang in cm (Monster-Klasse und Mutationen können weit übers Maximum gehen)
  monster: { max: 1e6, step: (dt) => 20 + dt / 20 },        // Fänge der Größenklasse „Monster“
  boss:   { max: 1e5,  step: (dt) => 2 + dt / 60 },         // besiegte Odfische
  spent:  { max: 1e10, step: (dt) => 200000 + dt * 20000 }, // im Laden ausgegebene Taler
  prestige: { max: 1000, step: (dt) => 1 + dt / 3600 },     // Prestige (das erste braucht 7 Wiedergeburten, danach weniger)
};
const WEEK_TTL = 21 * 86400; // Wochenlisten bleiben drei Wochen, dann löscht Redis sie
const weekId = (t = Date.now()) => Math.floor((t / 864e5 + 3) / 7); // wie im Spiel: Wochen beginnen montags
const keyOf = (b, wk = weekId()) => BOARDS[b].week ? `lb:${b}:${wk}` : 'lb:' + b;
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
  const keys = Object.keys(BOARDS), wk = weekId();
  const lists = await redis([
    ...keys.map((b) => ['ZREVRANGE', keyOf(b, wk), 0, TOP - 1, 'WITHSCORES']),
    ['ZREVRANGE', keyOf('woche', wk - 1), 0, 2, 'WITHSCORES'], // last week's top 3, for their prize
  ]);
  const ids = [...new Set(lists.flatMap((l) => l.filter((_, i) => i % 2 === 0)))];
  const names = ids.length ? await redis([['HMGET', 'lb:names', ...ids]]) : [[]];
  // names from before a filter change are hidden too
  const nameOf = Object.fromEntries(ids.map((id, i) => [id, cleanName(names[0][i]) || '???']));
  const rowsOf = (l) => { const rows = []; for (let i = 0; i < l.length; i += 2) rows.push({ name: nameOf[l[i]], score: Number(l[i + 1]), me: sha(l[i]).slice(0, 12) }); return rows; };
  const boards = {};
  keys.forEach((b, k) => { boards[b] = rowsOf(lists[k]); });
  return { boards, prev: { woche: rowsOf(lists[keys.length]) }, week: wk };
}

// Anonyme Zahlen für Admins: wie viele in jeder Liste stehen, und wie sich Prestige und Wiedergeburten verteilen
async function stats() {
  const keys = Object.keys(BOARDS);
  const ranges = (b, edges) => edges.map(([lo, hi]) => ['ZCOUNT', 'lb:' + b, lo, hi]);
  const PRES = [[1, 1], [2, 2], [3, 3], [4, '+inf']], REB = [[1, 2], [3, 6], [7, 12], [13, 24], [25, '+inf']];
  const out = await redis([['HLEN', 'lb:names'], ...keys.map((b) => ['ZCARD', keyOf(b)]), ...ranges('prestige', PRES), ...ranges('reb', REB)]);
  const n = keys.length;
  return {
    players: out[0],
    boards: Object.fromEntries(keys.map((b, i) => [b, out[1 + i]])),
    prestige: Object.fromEntries(PRES.map(([lo, hi], i) => [hi === lo ? String(lo) : lo + '+', out[1 + n + i]])),
    rebirths: Object.fromEntries(REB.map(([lo, hi], i) => [hi === '+inf' ? lo + '+' : `${lo}-${hi}`, out[1 + n + PRES.length + i]])),
  };
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Die Bestenliste ist noch nicht eingerichtet.' });
  try {
    if (req.method === 'GET') {
      return send(res, 200, await top(), 'public, s-maxage=30, stale-while-revalidate=60');
    }

    const body = await readBody(req);
    if (req.method === 'POST' && body.action === 'stats') {
      if (!(ADMIN && typeof body.admin === 'string' && body.admin.length >= 16 && body.admin === ADMIN)) return send(res, 403, { error: 'Nicht erlaubt.' });
      return send(res, 200, await stats());
    }
    const id = String(body.id || '');
    if (!ID_RE.test(id)) return send(res, 400, { error: 'Ungültige ID.' });

    if (req.method === 'DELETE') {
      const isAdmin = ADMIN && typeof body.admin === 'string' && body.admin.length >= 16 && body.admin === ADMIN;
      if (!isAdmin) {
        const [stored] = await redis([['GET', 'lb:tok:' + id]]);
        if (!stored || stored !== sha(String(body.token || ''))) return send(res, 403, { error: 'Nicht erlaubt.' });
      }
      await redis([
        ...Object.keys(BOARDS).map((b) => ['ZREM', keyOf(b), id]),
        ['HDEL', 'lb:names', id], ['DEL', 'lb:tok:' + id, 'lb:last:' + id],
      ]);
      return send(res, 200, { ok: true });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Methode nicht erlaubt.' });

    const token = String(body.token || '');
    if (!/^[a-f0-9]{32,64}$/.test(token)) return send(res, 400, { error: 'Ungültiges Token.' });
    const name = cleanName(body.name);
    if (!name) return send(res, 400, { error: 'Bitte einen anderen Namen wählen (1–16 Zeichen, keine Beleidigungen).' });

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
    const scores = {}, skipped = [];
    for (const [b, rule] of Object.entries(BOARDS)) {
      // ältere Spielversionen schicken neue Listen noch nicht mit: dann 0 (= kein Eintrag dort)
      const raw = body.scores && body.scores[b];
      const v = raw === undefined ? 0 : Math.floor(Number(raw));
      // a board this player never sent before (a new list) only checks the maximum; brand-new players still check the jump
      const known = !last || prev.s[b] !== undefined;
      // an implausible value only skips that one list (it keeps its last value) instead of blocking every other list
      if (!Number.isFinite(v) || v < 0 || v > rule.max || (known && v - (prev.s[b] || 0) > rule.step(dt))) {
        skipped.push(b); if (prev.s[b] !== undefined) scores[b] = Math.max(0, Math.floor(Number(prev.s[b]) || 0)); continue;
      }
      scores[b] = v;
    }

    const keys = Object.keys(BOARDS), wk = weekId();
    const out = await redis([
      ['HSET', 'lb:names', id, name],
      ['SET', 'lb:last:' + id, JSON.stringify({ t: Date.now(), s: scores })],
      // Werte dürfen nur steigen (GT); 0 heißt „noch nichts“ und wird nicht eingetragen
      ...keys.map((b) => scores[b] > 0 ? ['ZADD', keyOf(b, wk), 'GT', scores[b], id] : ['ZSCORE', keyOf(b, wk), id]),
      ...keys.map((b) => ['ZREVRANK', keyOf(b, wk), id]),
      ...keys.map((b) => ['ZCARD', keyOf(b, wk)]),
      ['EXPIRE', keyOf('woche', wk), WEEK_TTL],
    ]);
    const n = keys.length, ranks = {};
    keys.forEach((b, i) => { const r = out[2 + n + i]; ranks[b] = { rank: r === null ? null : r + 1, of: out[2 + 2 * n + i] }; });
    return send(res, 200, { ok: true, ranks, me: sha(id).slice(0, 12), skipped });
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Bestenliste gerade nicht erreichbar.' });
  }
};
