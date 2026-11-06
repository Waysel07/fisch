// Ideenbrett für „Fischen!“ – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
// Wer einen Ideenfisch fängt, darf eine Idee ans Brett hängen; alle können sie öffentlich hoch- oder runterwählen.
//
//   GET    /api/ideas                                   → { ideas }
//   POST   /api/ideas {action: 'list', voter}           → { ideas, mine: {id: 1|-1} }
//   POST   /api/ideas {action: 'post', voter, text, name?} → { idea }
//   POST   /api/ideas {action: 'vote', voter, idea, v}  → { idea, v }   (v: 1 hoch, -1 runter, 0 zurücknehmen)
//   DELETE /api/ideas {id, admin}                       → { ok }        (nur mit ADMIN_TOKEN)
//
// `voter` ist eine zufällige Geheim-ID des Spielers; gespeichert wird nur ein Kürzel ihres Hashs.
// Schlüssel: ideas (ZSET id → Zeitpunkt), idea:<id> (JSON: Text, Name, Zeitpunkt), idea:<id>:c (Hash up/dn),
// idea:<id>:v (Hash Stimme je Spieler). Ideen verfallen 180 Tage nach dem Einreichen; es bleiben höchstens 200.
'use strict';
const crypto = require('crypto');
const { cleanName, cleanText, isBad } = require('./_names');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.ADMIN_TOKEN;

const LIST = 'ideas';
const KEEP = 200, SHOW = 100;
const TTL = 180 * 86400;
const MIN_LEN = 8, MAX_LEN = 160;
const POSTS_PER_DAY = 3;         // je Spieler
const ID_RE = /^[a-f0-9]{32,64}$/;
const IDEA_RE = /^[a-z0-9]{8,16}$/;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pub = (voter) => sha('idea:' + voter).slice(0, 16);
const day = () => new Date().toISOString().slice(0, 10);

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
  for await (const c of req) { raw += c; if (raw.length > 4096) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

function parse(id, json, c) {
  try {
    const j = JSON.parse(json);
    return { id, text: String(j.t || ''), name: String(j.n || ''), at: Number(j.at) || 0, up: Math.max(0, +c[0] || 0), down: Math.max(0, +c[1] || 0) };
  } catch { return null; }
}

// die neuesten Ideen mit Stimmen; mit `me` auch die eigene Stimme je Idee
async function list(me) {
  const ids = (await redis([['ZREVRANGE', LIST, 0, SHOW - 1]]))[0] || [];
  if (!ids.length) return { ideas: [], mine: {} };
  const cmds = [];
  for (const id of ids) {
    cmds.push(['GET', 'idea:' + id], ['HMGET', 'idea:' + id + ':c', 'up', 'dn']);
    if (me) cmds.push(['HGET', 'idea:' + id + ':v', me]);
  }
  const out = await redis(cmds), step = me ? 3 : 2;
  const ideas = [], mine = {}, gone = [];
  ids.forEach((id, i) => {
    const j = out[i * step];
    if (!j) { gone.push(id); return; }
    const idea = parse(id, j, out[i * step + 1] || []);
    if (!idea) return;
    ideas.push(idea);
    if (me) { const v = +out[i * step + 2]; if (v === 1 || v === -1) mine[id] = v; }
  });
  if (gone.length) await redis(gone.map((id) => ['ZREM', LIST, id])); // abgelaufen
  return { ideas, mine };
}

async function limit(req, action, max) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const rl = 'ideas:ip:' + action + ':' + sha(ip + day()).slice(0, 24);
  const [n] = await redis([['INCR', rl], ['EXPIRE', rl, 60]]);
  return n > max;
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Das Ideenbrett ist noch nicht eingerichtet.' });
  try {
    if (req.method === 'GET') return send(res, 200, { ideas: (await list(null)).ideas });

    const body = await readBody(req);
    if (req.method === 'DELETE') {
      if (!ADMIN || typeof body.admin !== 'string' || body.admin.length !== ADMIN.length
        || !crypto.timingSafeEqual(Buffer.from(body.admin), Buffer.from(ADMIN))) return send(res, 403, { error: 'Nicht erlaubt.' });
      const id = String(body.id || '');
      if (!IDEA_RE.test(id)) return send(res, 400, { error: 'Unbekannte Idee.' });
      await redis([['ZREM', LIST, id], ['DEL', 'idea:' + id, 'idea:' + id + ':c', 'idea:' + id + ':v']]);
      return send(res, 200, { ok: true });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'Methode nicht erlaubt.' });

    const voter = String(body.voter || '');
    if (!ID_RE.test(voter)) return send(res, 400, { error: 'Ungültige Spieler-ID.' });
    const me = pub(voter);

    if (body.action === 'list') {
      if (await limit(req, 'list', 60)) return send(res, 429, { error: 'Zu viele Anfragen – kurz warten.' });
      return send(res, 200, await list(me));
    }

    if (body.action === 'post') {
      if (await limit(req, 'post', 5)) return send(res, 429, { error: 'Zu viele Anfragen – kurz warten.' });
      const raw = typeof body.text === 'string' ? body.text : '';
      if (isBad(raw)) return send(res, 400, { error: 'Bitte ohne Schimpfwörter.' });
      const text = cleanText(raw, MAX_LEN);
      if (text.length < MIN_LEN) return send(res, 400, { error: 'Die Idee ist zu kurz.' });
      const per = 'ideas:by:' + me + ':' + day();
      const [n] = await redis([['INCR', per], ['EXPIRE', per, 86400]]);
      if (n > POSTS_PER_DAY) return send(res, 429, { error: 'Heute hast du schon genug Ideen eingereicht.' });
      const id = crypto.randomBytes(6).toString('hex');
      const at = Date.now(), name = cleanName(body.name) || '';
      await redis([
        ['SET', 'idea:' + id, JSON.stringify({ t: text, n: name, at, by: me }), 'EX', TTL],
        ['ZADD', LIST, at, id],
        ['ZREMRANGEBYRANK', LIST, 0, -(KEEP + 1)],
      ]);
      return send(res, 200, { idea: { id, text, name, at, up: 0, down: 0 } });
    }

    if (body.action === 'vote') {
      if (await limit(req, 'vote', 60)) return send(res, 429, { error: 'Zu viele Anfragen – kurz warten.' });
      const id = String(body.idea || ''), v = [1, -1, 0].includes(body.v) ? body.v : null;
      if (!IDEA_RE.test(id) || v === null) return send(res, 400, { error: 'Unbekannte Idee.' });
      const V = 'idea:' + id + ':v', C = 'idea:' + id + ':c';
      const [json, old0, ttl] = await redis([['GET', 'idea:' + id], ['HGET', V, me], ['TTL', 'idea:' + id]]);
      if (!json) return send(res, 404, { error: 'Unbekannte Idee.' });
      const old = +old0 === 1 || +old0 === -1 ? +old0 : 0;
      if (old !== v) {
        const cmds = [v ? ['HSET', V, me, String(v)] : ['HDEL', V, me]];
        if (old === 1) cmds.push(['HINCRBY', C, 'up', -1]);
        if (old === -1) cmds.push(['HINCRBY', C, 'dn', -1]);
        if (v === 1) cmds.push(['HINCRBY', C, 'up', 1]);
        if (v === -1) cmds.push(['HINCRBY', C, 'dn', 1]);
        const left = +ttl > 0 ? +ttl : TTL; // Stimmen verfallen zusammen mit der Idee
        cmds.push(['EXPIRE', V, left], ['EXPIRE', C, left]);
        await redis(cmds);
      }
      const [c] = await redis([['HMGET', C, 'up', 'dn']]);
      return send(res, 200, { idea: parse(id, json, c || []), v });
    }

    return send(res, 400, { error: 'Unbekannte Aktion.' });
  } catch (e) {
    return send(res, 500, { error: 'Serverfehler – bitte später nochmal.' });
  }
};
