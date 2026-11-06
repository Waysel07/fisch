// Bestenliste für „Fischen!“ – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
//
//   GET    /api/leaderboard                     → Top 10 jeder Liste (30 s im CDN gecacht), dazu die
//                                                  Top 3 der Wochenliste der letzten Woche (prev)
//   GET    /api/leaderboard?p=<me>              → Spielerprofil: Name, Profil (Aussehen, Titel, Rang, Lieblings-
//                                                  und größter Fisch …), Werte und Plätze in jeder Liste
//   POST   /api/leaderboard {id, token, name, scores, prof?}  → eintragen/aktualisieren, liefert eigene Plätze
//   DELETE /api/leaderboard {id, token}         → eigenen Eintrag löschen
//
// Admin-Aufgaben (Auswertung, Einträge löschen) laufen nur noch über /api/admin (siehe dort);
// dafür exportiert diese Datei unten `lib`.
//
// Zugangsdaten kommen aus der Vercel-Upstash-Integration (KV_REST_API_* oder UPSTASH_REDIS_REST_*).
'use strict';
const crypto = require('crypto');
const { cleanName } = require('./_names');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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
  prestige: { max: 1000, step: (dt) => 1 + dt / 3600 },     // Prestige (braucht 5–7 Wiedergeburten, später mehr)
  sport:  { max: 22500, step: (dt) => 300 + dt * 3 },       // Sonneninsel: Summe des Könnens an allen 9 Sportstationen (je 0–2500)
};
const WEEK_TTL = 21 * 86400; // Wochenlisten bleiben drei Wochen, dann löscht Redis sie
const weekId = (t = Date.now()) => Math.floor((t / 864e5 + 3) / 7); // wie im Spiel: Wochen beginnen montags
const keyOf = (b, wk = weekId()) => BOARDS[b].week ? `lb:${b}:${wk}` : 'lb:' + b;
const TOP = 10;
const ID_RE = /^[a-f0-9]{16,40}$/;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pubOf = (id) => sha(id).slice(0, 12); // öffentliches Kürzel eines Eintrags (Feld `me` in den Listen)
const PUB_RE = /^[a-f0-9]{12}$/;

// Profil: nur diese Felder, mit Grenzen (Whitelist wie cleanMe in lobby.js)
const num = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo; };
const slug = (v, max = 24) => (typeof v === 'string' && new RegExp(`^[a-z0-9-]{1,${max}}$`).test(v) ? v : '');
function cleanProf(p) {
  p = p && typeof p === 'object' ? p : {};
  const lk = p.lk && typeof p.lk === 'object' ? p.lk : {};
  const fish = (f) => (f && typeof f === 'object' && slug(f.f) ? { f: slug(f.f), n: num(f.n, 0, 1e7) } : null);
  return {
    lk: { t: num(lk.t, 0, 9), h: slug(lk.h, 16), j: slug(lk.j, 16), b: slug(lk.b, 16), s: slug(lk.s, 16), r: slug(lk.r, 16) }, // Aussehen
    ti: slug(p.ti, 16),           // Titel (ID einer Fischdex-Belohnung)
    lv: num(p.lv, 1, 9999),       // Level
    rk: num(p.rk, 0, 1e5),        // Wiedergeburten insgesamt (Rang)
    pr: num(p.pr, 0, 1000),       // Prestige
    sp: num(p.sp, 0, 9),          // Sportarten auf Profi-Niveau
    pt: num(p.pt, 0, 1e6),        // Spielzeit in Stunden
    best: fish(p.best),           // größter Fang: Fisch-ID und Größe (n in cm)
    fav: fish(p.fav),             // Lieblingsfisch: am häufigsten gefangen (n Fänge)
  };
}

// Profil eines Eintrags: gespeichertes Profil plus aktuelle Werte und Plätze in jeder Liste
async function profile(pub) {
  const [id, json, since] = (await redis([['HGET', 'lb:pubid', pub], ['GET', 'lb:prof:' + pub], ['HGET', 'lb:since', pub]]));
  if (!id) return null;
  const keys = Object.keys(BOARDS), wk = weekId();
  const out = await redis([
    ['HGET', 'lb:names', id],
    ...keys.map((b) => ['ZSCORE', keyOf(b, wk), id]),
    ...keys.map((b) => ['ZREVRANK', keyOf(b, wk), id]),
    ...keys.map((b) => ['ZCARD', keyOf(b, wk)]),
  ]);
  const n = keys.length, boards = {};
  keys.forEach((b, i) => {
    const s = out[1 + i], r = out[1 + n + i];
    if (s !== null && s !== undefined) boards[b] = { score: Number(s), rank: r === null ? null : r + 1, of: out[1 + 2 * n + i] };
  });
  let prof = null; try { prof = json ? cleanProf(JSON.parse(json)) : null; } catch { /* old or broken */ }
  return { me: pub, name: cleanName(out[0]) || '???', prof, boards, since: Number(since) || null };
}

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
  const rowsOf = (l) => { const rows = []; for (let i = 0; i < l.length; i += 2) rows.push({ name: nameOf[l[i]], score: Number(l[i + 1]), me: pubOf(l[i]) }); return rows; };
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

// einen Eintrag mit allem, was dazugehört, löschen (eigener Austrag und Admin)
async function removeEntry(id) {
  await redis([
    ...Object.keys(BOARDS).map((b) => ['ZREM', keyOf(b), id]),
    ['HDEL', 'lb:names', id], ['DEL', 'lb:tok:' + id, 'lb:last:' + id, 'lb:prof:' + pubOf(id)],
    ['HDEL', 'lb:pubid', pubOf(id)], ['HDEL', 'lb:since', pubOf(id)],
  ]);
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Die Bestenliste ist noch nicht eingerichtet.' });
  try {
    if (req.method === 'GET') {
      const p = new URL(req.url || '/', 'http://x').searchParams.get('p');
      if (p !== null) {
        if (!PUB_RE.test(p)) return send(res, 400, { error: 'Unbekannter Spieler.' });
        const pr = await profile(p);
        return pr ? send(res, 200, pr, 'public, s-maxage=30, stale-while-revalidate=60') : send(res, 404, { error: 'Unbekannter Spieler.' });
      }
      return send(res, 200, await top(), 'public, s-maxage=30, stale-while-revalidate=60');
    }

    const body = await readBody(req);
    const id = String(body.id || '');
    if (!ID_RE.test(id)) return send(res, 400, { error: 'Ungültige ID.' });

    if (req.method === 'DELETE') {
      const [stored] = await redis([['GET', 'lb:tok:' + id]]);
      if (!stored || stored !== sha(String(body.token || ''))) return send(res, 403, { error: 'Nicht erlaubt.' });
      await removeEntry(id);
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
    // each list keeps its own clock: a skipped list keeps its old time, so the allowed jump grows until it catches up
    const now = Date.now(), times = {}, skipped = [], scores = {};
    for (const [b, rule] of Object.entries(BOARDS)) {
      const since = prev.ts && Number.isFinite(prev.ts[b]) ? prev.ts[b] : prev.t;
      const dt = Math.max(0, (now - since) / 1000);
      // ältere Spielversionen schicken neue Listen noch nicht mit: dann 0 (= kein Eintrag dort)
      const raw = body.scores && body.scores[b];
      const v = raw === undefined ? 0 : Math.floor(Number(raw));
      // a board this player never sent before (a new list) only checks the maximum; brand-new players still check the jump
      const known = !last || prev.s[b] !== undefined;
      // an implausible value only skips that one list (it keeps its last value) instead of blocking every other list
      if (!Number.isFinite(v) || v < 0 || v > rule.max || (known && v - (prev.s[b] || 0) > rule.step(dt))) {
        skipped.push(b); times[b] = since; if (prev.s[b] !== undefined) scores[b] = Math.max(0, Math.floor(Number(prev.s[b]) || 0)); continue;
      }
      scores[b] = v; times[b] = now;
    }

    const keys = Object.keys(BOARDS), wk = weekId(), pub = pubOf(id);
    // Profil: ältere Spielversionen schicken keins, dann bleibt das alte stehen
    if (body.prof && typeof body.prof === 'object') await redis([['SET', 'lb:prof:' + pub, JSON.stringify(cleanProf(body.prof))]]);
    const out = await redis([
      ['HSET', 'lb:names', id, name],
      ['SET', 'lb:last:' + id, JSON.stringify({ t: now, s: scores, ts: times })],
      // Werte dürfen nur steigen (GT); 0 heißt „noch nichts“ und wird nicht eingetragen
      ...keys.map((b) => scores[b] > 0 ? ['ZADD', keyOf(b, wk), 'GT', scores[b], id] : ['ZSCORE', keyOf(b, wk), id]),
      ...keys.map((b) => ['ZREVRANK', keyOf(b, wk), id]),
      ...keys.map((b) => ['ZCARD', keyOf(b, wk)]),
      ['EXPIRE', keyOf('woche', wk), WEEK_TTL],
      ['HSET', 'lb:pubid', pub, id], ['HSETNX', 'lb:since', pub, String(now)],
    ]);
    const n = keys.length, ranks = {};
    keys.forEach((b, i) => { const r = out[2 + n + i]; ranks[b] = { rank: r === null ? null : r + 1, of: out[2 + 2 * n + i] }; });
    return send(res, 200, { ok: true, ranks, me: pub, skipped });
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Bestenliste gerade nicht erreichbar.' });
  }
};

// für /api/admin
module.exports.lib = { BOARDS, keyOf, weekId, pubOf, PUB_RE, stats, profile, removeEntry };
