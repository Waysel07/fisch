// Multiplayer-Lobbys für „Fischen!“ – Vercel Function + Upstash Redis (REST, ohne npm-Pakete).
// Kein WebSocket: jedes Spiel in einer Lobby fragt alle paar Sekunden den Stand ab (sync) und
// schickt dabei seinen eigenen mit. Lobbys verfallen 2 Stunden nach der letzten Aktivität.
//
//   POST /api/lobby {action: 'create', id, name}               → { code }
//   POST /api/lobby {action: 'join',   code, id, name}         → { ok }
//   POST /api/lobby {action: 'sync',   code, id, me, ev?, msg?, dmg?, boss?} → { players, feed, chat, me, boss }
//   POST /api/lobby {action: 'boss',   code, id, me}           → { boss, fresh }  (Odfisch rufen)
//   POST /api/lobby {action: 'leave',  code, id}               → { ok }
//
// Bossfight: Der Odfisch hat einen gemeinsamen Lebensbalken für alle in der Lobby. Wer ihn ruft,
// muss auf Hoher See sein (me.m = 'see'), und es muss nach der gemeinsamen Uhr Nacht sein. Jeder
// Sync schickt den eigenen Schaden seit dem letzten Sync mit (gedeckelt), der Server zählt ihn pro
// Spieler; HP = max − Summe. Nach 3 Minuten ist er weg.
//
// `id` ist eine zufällige Geheim-ID des Spielers; nach außen geht nur ein Kürzel ihres Hashs.
'use strict';
const crypto = require('crypto');
const { cleanName, cleanChat } = require('./_names');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const TTL = 2 * 3600;            // Lobby verfällt 2 h nach der letzten Aktivität
const MAX_PLAYERS = 8;
const ACTIVE_MS = 20000;         // wer sich 20 s nicht meldet, wird nicht mehr angezeigt
const GONE_MS = 90000;           // … und nach 90 s aus der Lobby entfernt
const FEED = 15;
const CHAT = 30;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;
const ID_RE = /^[a-f0-9]{32,64}$/;
const RARITIES = ['common', 'uncommon', 'rare', 'wii', 'epic', 'legendary', 'junk'];
const BOSS_HP = 1000;            // pro Angler auf Hoher See beim Start
const BOSS_MS = 180000;          // 3 Minuten Zeit
const BOSS_DMG_MAX = 400;        // höchstens so viel Schaden pro Sync
const DAY_LENGTH = 300;          // wie im Spiel: ein Tag alle 5 Minuten, ab der Unix-Epoche
const isNight = (now) => { const t = (now / 1000 / DAY_LENGTH) % 1; return t < .2 || t > .82; };

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pub = (id) => sha('lobby:' + id).slice(0, 10);

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

const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo; };
const str = (v, max) => (typeof v === 'string' ? v.normalize('NFC').replace(/[\u0000-\u001f<>]/g, '').slice(0, max) : '');

const cosm = (v) => (typeof v === 'string' && /^[a-z-]{1,16}$/.test(v) ? v : '');

function cleanMe(me) {
  me = me && typeof me === 'object' ? me : {};
  return {
    x: Math.round(num(me.x, 0, 400) * 10) / 10,
    d: me.d < 0 ? -1 : 1,
    s: ['i', 'w', 'r'].includes(me.s) ? me.s : 'i', // idle, waiting for a bite, reeling
    hat: Math.round(num(me.hat, 0, 9)),
    m: me.m === 'see' || me.m === 'lava' ? me.m : 'steg', // Steg, Hohe See oder Glutgrotte
    ch: cosm(me.ch), cj: cosm(me.cj), cb: cosm(me.cb),  // Kosmetik: Hut, Jacke, Pose (IDs aus dem Laden)
    sk: cosm(me.sk), hr: cosm(me.hr),                   // Haut- und Haarfarbe
    sc: Math.round(num(me.sc, 0, 1e9)),               // Taler gefangen, seit man in der Lobby ist
    n: Math.round(num(me.n, 0, 1e6)),                 // Fänge in der Lobby
    rk: Math.round(num(me.rk, 0, 99)),                // Wiedergeburten, für den Rang am Namensschild
    pr: Math.round(num(me.pr, 0, 99)),                // Prestige, als ✦ vor dem Rang
    ti: typeof me.ti === 'string' && /^[a-z0-9-]{1,16}$/.test(me.ti) ? me.ti : '', // Titel am Namensschild (ID einer Sammlung)
    bs: Math.round(num(me.bs, 0, 3)),                 // Odfisch-Stufe, die dieser Spieler ruft (0–3)
  };
}

// Bossstand für den Client: HP aus der Schadens-Hash, eigene Schadenssumme, Anzahl Kämpfer
function bossView(meta, dmgHash, k, now) {
  if (!meta) return null;
  let sum = 0, mine = 0, n = 0;
  for (let i = 0; i < (dmgHash || []).length; i += 2) {
    const v = Number(dmgHash[i + 1]) || 0; sum += v; n++;
    if (dmgHash[i] === k) mine = v;
  }
  return { id: meta.id, max: meta.max, hp: Math.max(0, meta.max - sum), ends: meta.ends, now, mine, n: Math.max(1, n), st: meta.st | 0 };
}

function players(hash, now) {
  const list = [];
  for (let i = 0; i < hash.length; i += 2) {
    try { const p = JSON.parse(hash[i + 1]); p.k = hash[i]; list.push(p); } catch { /* skip */ }
  }
  return list.filter((p) => now - p.t < ACTIVE_MS);
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Lobbys sind noch nicht eingerichtet.' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Methode nicht erlaubt.' });
  try {
    const body = await readBody(req);
    const id = String(body.id || '');
    if (!ID_RE.test(id)) return send(res, 400, { error: 'Ungültige ID.' });
    const k = pub(id), now = Date.now();

    // Bremse: höchstens eine Anfrage pro Spieler und Sekunde
    const [ok] = await redis([['SET', 'lobby:rl:' + k, '1', 'NX', 'PX', 900]]);
    if (ok !== 'OK') return send(res, 429, { error: 'Zu schnell.' });

    if (body.action === 'create') {
      const name = cleanName(body.name);
      if (!name) return send(res, 400, { error: 'Bitte einen anderen Namen wählen (1–16 Zeichen, keine Beleidigungen).' });
      const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
      const ipKey = 'lobby:ip:' + sha(ip + new Date().toISOString().slice(0, 10)).slice(0, 24);
      const [cnt] = await redis([['INCR', ipKey], ['EXPIRE', ipKey, 600]]);
      if (cnt > 10) return send(res, 429, { error: 'Zu viele neue Lobbys – bitte kurz warten.' });
      for (let tries = 0; tries < 8; tries++) {
        const code = [...crypto.randomBytes(4)].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
        const [made] = await redis([['SET', 'lobby:' + code, JSON.stringify({ host: k, created: now }), 'NX', 'EX', TTL]]);
        if (made !== 'OK') continue;
        const p = { ...cleanMe(body.me), name, t: now };
        await redis([['HSET', `lobby:${code}:p`, k, JSON.stringify(p)], ['EXPIRE', `lobby:${code}:p`, TTL]]);
        return send(res, 200, { code, me: k });
      }
      return send(res, 503, { error: 'Gerade kein Lobby-Code frei, bitte nochmal.' });
    }

    const code = String(body.code || '').toUpperCase();
    if (!CODE_RE.test(code)) return send(res, 400, { error: 'Ungültiger Lobby-Code.' });
    const L = 'lobby:' + code, P = L + ':p', F = L + ':feed';

    if (body.action === 'leave') {
      await redis([['HDEL', P, k]]);
      return send(res, 200, { ok: true });
    }

    if (body.action === 'join') {
      const name = cleanName(body.name);
      if (!name) return send(res, 400, { error: 'Bitte einen anderen Namen wählen (1–16 Zeichen, keine Beleidigungen).' });
      const [meta, hash] = await redis([['GET', L], ['HGETALL', P]]);
      if (!meta) return send(res, 404, { error: 'Diese Lobby gibt es nicht (mehr).' });
      const act = players(hash || [], now).filter((p) => p.k !== k);
      if (act.length >= MAX_PLAYERS) return send(res, 409, { error: 'Die Lobby ist voll (8 Angler).' });
      const p = { ...cleanMe(body.me), name, t: now };
      await redis([['HSET', P, k, JSON.stringify(p)], ['EXPIRE', P, TTL], ['EXPIRE', L, TTL]]);
      return send(res, 200, { ok: true, me: k });
    }

    const B = L + ':boss';

    if (body.action === 'boss') {
      const [meta, prevRaw, bossRaw, hash] = await redis([['GET', L], ['HGET', P, k], ['GET', B], ['HGETALL', P]]);
      if (!meta) return send(res, 404, { error: 'Diese Lobby gibt es nicht (mehr).' });
      if (!prevRaw) return send(res, 410, { error: 'Du bist nicht mehr in dieser Lobby.' });
      if (cleanMe(body.me).m !== 'see') return send(res, 409, { error: 'Der Odfisch lebt nur auf Hoher See.' });
      let b = null; try { b = JSON.parse(bossRaw); } catch { /* none */ }
      if (b) { // already one going: join it
        const [dmg] = await redis([['HGETALL', `${B}:${b.id}`]]);
        return send(res, 200, { boss: bossView(b, dmg, k, now), fresh: false });
      }
      if (!isNight(now)) return send(res, 409, { error: 'Der Odfisch kommt nur nachts.' });
      const onSea = players(hash || [], now).filter((p) => p.m === 'see').length;
      const st = cleanMe(body.me).bs; // the caller's Odfisch-Stufe: +50 % HP per stage
      const fresh = { id: crypto.randomBytes(5).toString('hex'), max: Math.round(BOSS_HP * (1 + .5 * st)) * Math.max(1, onSea), ends: now + BOSS_MS, by: k, st };
      const [made] = await redis([['SET', B, JSON.stringify(fresh), 'NX', 'PX', BOSS_MS + 5000]]);
      if (made !== 'OK') return send(res, 409, { error: 'Gerade taucht schon ein Odfisch auf – nochmal versuchen.' });
      return send(res, 200, { boss: bossView(fresh, [], k, now), fresh: true });
    }

    if (body.action === 'sync') {
      const [meta, prevRaw, bossRaw] = await redis([['GET', L], ['HGET', P, k], ['GET', B]]);
      if (!meta) return send(res, 404, { error: 'Diese Lobby gibt es nicht (mehr).' });
      if (!prevRaw) return send(res, 410, { error: 'Du bist nicht mehr in dieser Lobby.' });
      const prev = JSON.parse(prevRaw);
      const p = { ...cleanMe(body.me), name: prev.name, t: now, big: prev.big };
      const cmds = [];
      const ev = body.ev && typeof body.ev === 'object' ? body.ev : null;
      if (ev) {
        const e = { k, n: prev.name, f: str(ev.f, 40), cm: Math.round(num(ev.cm, 0, 2000)), r: RARITIES.includes(ev.r) ? ev.r : 'common', sh: !!ev.sh, t: now };
        if (e.f) {
          cmds.push(['LPUSH', F, JSON.stringify(e)], ['LTRIM', F, 0, FEED - 1], ['EXPIRE', F, TTL]);
          if (e.r !== 'junk' && (!p.big || e.cm > p.big.cm)) p.big = { f: e.f, cm: e.cm };
        }
      }
      const C = L + ':chat', msg = cleanChat(body.msg);
      if (msg) cmds.push(['LPUSH', C, JSON.stringify({ k, n: prev.name, m: msg, t: now })], ['LTRIM', C, 0, CHAT - 1], ['EXPIRE', C, TTL]);
      let b = null; try { b = JSON.parse(bossRaw); } catch { /* none */ }
      const D = b ? `${B}:${b.id}` : null;
      const dmg = Math.round(num(body.dmg, 0, BOSS_DMG_MAX));
      if (b && dmg > 0 && body.boss === b.id && now < b.ends + 2000 && !b.won) cmds.push(['HINCRBY', D, k, dmg], ['PEXPIRE', D, BOSS_MS + 60000]);
      cmds.push(['HSET', P, k, JSON.stringify(p)], ['EXPIRE', P, TTL], ['EXPIRE', L, TTL], ['HGETALL', P], ['LRANGE', F, 0, FEED - 1], ['LRANGE', C, 0, 19]);
      if (D) cmds.push(['HGETALL', D]);
      const out = await redis(cmds);
      const off = D ? 1 : 0;
      const hash = out[out.length - 3 - off] || [], feedRaw = out[out.length - 2 - off] || [], chatRaw = out[out.length - 1 - off] || [];
      const boss = b ? bossView(b, out[out.length - 1], k, now) : null;
      // beaten: keep the result 15 s so every client sees it, then a new Odfisch can be called
      if (boss && boss.hp <= 0 && !b.won) await redis([['SET', B, JSON.stringify({ ...b, won: now }), 'PX', 15000]]);
      // tidy up anglers who left without saying goodbye
      const gone = [];
      for (let i = 0; i < hash.length; i += 2) { try { if (now - JSON.parse(hash[i + 1]).t > GONE_MS) gone.push(hash[i]); } catch { gone.push(hash[i]); } }
      if (gone.length) await redis([['HDEL', P, ...gone]]);
      const parse = (l) => l.map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
      return send(res, 200, { players: players(hash, now).map(({ t, ...rest }) => rest), feed: parse(feedRaw), chat: parse(chatRaw), me: k, now, boss });
    }

    return send(res, 400, { error: 'Unbekannte Aktion.' });
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Lobby-Server gerade nicht erreichbar.' });
  }
};
