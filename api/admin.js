// Admin-Panel für „Fischen!“ – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
// Die Seite seiten/admin.html spricht nur mit dieser Funktion. Alle Admin-Aufgaben laufen hier:
// die anderen Funktionen nehmen kein ADMIN_TOKEN mehr an.
//
//   POST /api/admin  Authorization: Bearer <ADMIN_TOKEN>  {action: 'login'}  → { session, ttl }
//   POST /api/admin  Authorization: Bearer <Sitzung>      {action: …}        → je nach Aktion
//
// Sicherheit:
// - ADMIN_TOKEN muss mindestens 24 Zeichen lang sein, sonst ist das Panel aus (503).
// - Das Token steht nur im Authorization-Header, nie in der URL oder im Body, und gilt nur für den
//   Login. Verglichen wird in konstanter Zeit (SHA-256 beider Seiten, timingSafeEqual).
// - Fehlversuche: je (gehashter) IP höchstens 5 in 15 Minuten, insgesamt höchstens 100 pro Stunde;
//   danach sperrt der Login, auch für das richtige Token.
// - Eine Sitzung ist ein zufälliger 32-Byte-Wert; gespeichert wird nur sein Hash (adm:s:<hash>) mit
//   der gehashten IP. Sie läuft nach 30 Minuten ohne Aktion ab, spätestens nach 8 Stunden, und gilt
//   nur von derselben IP.
// - Jede Änderung (und jeder Login) landet im Protokoll adm:log (die letzten 200 Einträge).
// - Löschen braucht confirm: true. Antworten sind no-store und noindex.
'use strict';
const crypto = require('crypto');
const { cleanName, cleanText } = require('./_names');
const LB = require('./leaderboard').lib;
const IDEAS = require('./ideas').lib;

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.ADMIN_TOKEN || '';
const MIN_ADMIN = 24;

const IDLE = 30 * 60, MAX_AGE = 8 * 3600;      // Sitzung: 30 min ohne Aktion, höchstens 8 h
const FAIL_IP = 5, FAIL_IP_WIN = 15 * 60;      // Fehlversuche je IP
const FAIL_ALL = 100, FAIL_ALL_WIN = 3600;     // Fehlversuche insgesamt
const CALLS = 120;                             // Aktionen je Sitzung und Minute
const LOG = 'adm:log', LOG_KEEP = 200;
const SESS_RE = /^[a-f0-9]{64}$/;
const KEY_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/;
const MAX_GIFT_H = 1000, GIFT_TTL = 180 * 86400;
const MAX_JP_ADD = 1e8;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const same = (a, b) => crypto.timingSafeEqual(Buffer.from(sha(String(a)), 'hex'), Buffer.from(sha(String(b)), 'hex'));

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
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = '';
  for await (const c of req) { raw += c; if (raw.length > 2048) return {}; }
  try { const j = JSON.parse(raw || '{}'); return j && typeof j === 'object' ? j : {}; } catch { return {}; }
}

const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '').split(',')[0].trim();
const bearer = (req) => { const m = /^Bearer ([\x21-\x7e]{1,256})$/.exec(String(req.headers.authorization || '')); return m ? m[1] : ''; };

async function log(iph, what, detail) {
  await redis([
    ['LPUSH', LOG, JSON.stringify({ at: Date.now(), ip: iph.slice(0, 8), what, detail: String(detail || '').slice(0, 120) })],
    ['LTRIM', LOG, 0, LOG_KEEP - 1],
  ]);
}

// --- Login ---
async function login(req, res, iph) {
  const fk = 'adm:fail:' + iph, gk = 'adm:failall:' + Math.floor(Date.now() / 1000 / FAIL_ALL_WIN);
  const [fails, all] = await redis([['GET', fk], ['GET', gk]]);
  if ((+fails || 0) >= FAIL_IP || (+all || 0) >= FAIL_ALL) return send(res, 429, { error: 'Zu viele Fehlversuche – später nochmal.' });
  const tok = bearer(req);
  if (!tok || !same(tok, ADMIN)) {
    await redis([['INCR', fk], ['EXPIRE', fk, FAIL_IP_WIN], ['INCR', gk], ['EXPIRE', gk, FAIL_ALL_WIN]]);
    await log(iph, 'login-fail', '');
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300)); // bremst Durchprobieren
    return send(res, 403, { error: 'Falsches Token.' });
  }
  const session = crypto.randomBytes(32).toString('hex');
  await redis([['SET', 'adm:s:' + sha(session), JSON.stringify({ ip: iph, at: Date.now() }), 'EX', IDLE], ['DEL', fk]]);
  await log(iph, 'login', '');
  return send(res, 200, { session, ttl: IDLE });
}

// Sitzung prüfen und verlängern; liefert null, wenn sie nicht (mehr) gilt
async function session(req, iph) {
  const s = bearer(req);
  if (!SESS_RE.test(s)) return null;
  const k = 'adm:s:' + sha(s);
  const [json] = await redis([['GET', k]]);
  if (!json) return null;
  let j; try { j = JSON.parse(json); } catch { return null; }
  if (!j || j.ip !== iph || !(Date.now() - j.at < MAX_AGE * 1000)) { await redis([['DEL', k]]); return null; }
  const rk = 'adm:rl:' + sha(s).slice(0, 24) + ':' + Math.floor(Date.now() / 60000);
  const [, n] = await redis([['EXPIRE', k, IDLE], ['INCR', rk], ['EXPIRE', rk, 60]]);
  return { k, busy: n > CALLS };
}

// --- Aktionen ---
const int = (v, lo, hi) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo; };

async function jackpot() {
  const [p, l] = await redis([['GET', 'jp:pot'], ['GET', 'jp:last']]);
  let last = null; try { last = l ? JSON.parse(l) : null; } catch { /* kaputt */ }
  return { pot: 1000 + Math.max(0, Math.round(Number(p) || 0)), last: last && { name: cleanName(last.name) || '', amount: +last.amount || 0, at: +last.at || 0 } };
}

async function readLog(n) {
  const [rows] = await redis([['LRANGE', LOG, 0, n - 1]]);
  return (rows || []).map((r) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
}

async function board(b, from) {
  const wk = LB.weekId();
  const [rows, total] = await redis([['ZREVRANGE', LB.keyOf(b, wk), from, from + 49, 'WITHSCORES'], ['ZCARD', LB.keyOf(b, wk)]]);
  const ids = rows.filter((_, i) => i % 2 === 0);
  const [names] = ids.length ? await redis([['HMGET', 'lb:names', ...ids]]) : [[]];
  const out = [];
  for (let i = 0; i < rows.length; i += 2) {
    const raw = names[i / 2] || '';
    out.push({ rank: from + i / 2 + 1, name: cleanName(raw) || '???', raw: String(raw).slice(0, 32), score: Number(rows[i + 1]), pub: LB.pubOf(rows[i]) });
  }
  return { board: b, from, total, rows: out };
}

async function find(q) {
  const [flat] = await redis([['HGETALL', 'lb:names']]);
  const rows = [], needle = q.toLowerCase();
  // Upstash liefert HGETALL als flache Liste [feld, wert, …]
  for (let i = 0; i + 1 < (flat || []).length && rows.length < 30; i += 2) {
    const name = String(flat[i + 1] || '');
    if (name.toLowerCase().includes(needle) || LB.pubOf(flat[i]).startsWith(needle)) rows.push({ name: cleanName(name) || '???', raw: name.slice(0, 32), pub: LB.pubOf(flat[i]) });
  }
  return { rows };
}

async function act(body, iph) {
  const a = body.action;
  if (a === 'overview') {
    const [st, jp, ideas, lg] = await Promise.all([LB.stats(), jackpot(), redis([['ZCARD', IDEAS.LIST]]), readLog(15)]);
    return [200, { stats: st, jackpot: jp, ideas: ideas[0], log: lg, boards: Object.keys(LB.BOARDS), week: LB.weekId() }];
  }
  if (a === 'board') {
    const b = String(body.board || '');
    if (!Object.prototype.hasOwnProperty.call(LB.BOARDS, b)) return [400, { error: 'Unbekannte Liste.' }];
    return [200, await board(b, int(body.from, 0, 1e6))];
  }
  if (a === 'find') {
    const q = String(body.q || '').trim().slice(0, 32);
    if (q.length < 2) return [400, { error: 'Mindestens 2 Zeichen.' }];
    return [200, await find(q)];
  }
  if (a === 'player') {
    const pub = String(body.pub || '');
    if (!LB.PUB_RE.test(pub)) return [400, { error: 'Unbekannter Spieler.' }];
    const p = await LB.profile(pub);
    return p ? [200, p] : [404, { error: 'Unbekannter Spieler.' }];
  }
  if (a === 'delete_player') {
    const pub = String(body.pub || '');
    if (!LB.PUB_RE.test(pub)) return [400, { error: 'Unbekannter Spieler.' }];
    if (body.confirm !== true) return [400, { error: 'Bitte bestätigen.' }];
    const [id] = await redis([['HGET', 'lb:pubid', pub]]);
    if (!id) return [404, { error: 'Unbekannter Spieler.' }];
    const [nm] = await redis([['HGET', 'lb:names', id]]);
    await LB.removeEntry(id);
    await log(iph, 'delete_player', pub + ' ' + String(nm || '').slice(0, 32));
    return [200, { ok: true }];
  }
  if (a === 'ideas') return [200, { ideas: (await IDEAS.list(null)).ideas }];
  if (a === 'delete_idea') {
    const id = String(body.id || '');
    if (!IDEAS.IDEA_RE.test(id)) return [400, { error: 'Unbekannte Idee.' }];
    if (body.confirm !== true) return [400, { error: 'Bitte bestätigen.' }];
    const [json] = await redis([['GET', 'idea:' + id]]);
    await redis([['ZREM', IDEAS.LIST, id], ['DEL', 'idea:' + id, 'idea:' + id + ':c', 'idea:' + id + ':v']]);
    let t = ''; try { t = JSON.parse(json).t; } catch { /* schon weg */ }
    await log(iph, 'delete_idea', id + ' ' + cleanText(String(t || ''), 60));
    return [200, { ok: true }];
  }
  if (a === 'gift') {
    const key = String(body.key || '').toUpperCase().trim();
    if (!KEY_RE.test(key)) return [400, { error: 'Ungültiger Schlüssel.' }];
    const hours = Number(body.hours);
    if (!(hours > 0 && hours <= MAX_GIFT_H)) return [400, { error: 'Ungültige Stundenzahl.' }];
    const k = 'sv:' + sha(key), gk = 'sv:gift:' + sha(key);
    const [v] = await redis([['GET', k]]);
    if (!v) return [404, { error: 'Kein Spielstand zu diesem Schlüssel gefunden.' }];
    const [total] = await redis([['INCRBY', gk, Math.round(hours * 3600)], ['EXPIRE', gk, GIFT_TTL]]);
    await log(iph, 'gift', hours + ' h → ' + sha(key).slice(0, 8)); // nie den Schlüssel selbst
    return [200, { ok: true, pendingHours: total / 3600 }];
  }
  if (a === 'jackpot_add') {
    const n = Math.floor(Number(body.amount));
    if (!(n > 0 && n <= MAX_JP_ADD)) return [400, { error: 'Ungültiger Betrag.' }];
    await redis([['INCRBY', 'jp:pot', n]]);
    await log(iph, 'jackpot_add', String(n));
    return [200, await jackpot()];
  }
  if (a === 'log') return [200, { log: await readLog(LOG_KEEP) }];
  return [400, { error: 'Unbekannte Aktion.' }];
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN || ADMIN.length < MIN_ADMIN) return send(res, 503, { error: 'Das Admin-Panel ist nicht eingerichtet.' });
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Methode nicht erlaubt.' }); }
  if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return send(res, 415, { error: 'Nur JSON.' });
  try {
    const iph = sha('adm:' + ipOf(req));
    const body = await readBody(req);
    if (body.action === 'login') return await login(req, res, iph);
    const s = await session(req, iph);
    if (!s) return send(res, 401, { error: 'Bitte neu anmelden.' });
    if (s.busy) return send(res, 429, { error: 'Zu viele Anfragen – kurz warten.' });
    if (body.action === 'logout') { await redis([['DEL', s.k]]); await log(iph, 'logout', ''); return send(res, 200, { ok: true }); }
    const [status, out] = await act(body, iph);
    return send(res, status, out);
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Server gerade nicht erreichbar.' });
  }
};
