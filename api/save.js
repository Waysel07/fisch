// Cloud-Spielstand für „Fischen!“: mit einem geheimen Schlüssel den Spielstand auf ein anderes
// Gerät holen. Gespeichert wird unter dem SHA-256 des Schlüssels; den Schlüssel selbst kennt nur
// der Spieler. Einträge verfallen 180 Tage nach dem letzten Speichern.
//
//   POST /api/save {action: 'put', key, data}  → speichern
//   POST /api/save {action: 'get', key}        → laden
//   POST /api/save {action: 'del', key}        → löschen
'use strict';
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/;
const TTL = 180 * 24 * 3600;
const MAX = 64 * 1024;

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
  for await (const c of req) { raw += c; if (raw.length > MAX + 1024) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

module.exports = async function handler(req, res) {
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'Cloud-Speicher ist noch nicht eingerichtet.' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Methode nicht erlaubt.' });
  try {
    const body = await readBody(req);
    const key = String(body.key || '').toUpperCase().trim();
    if (!KEY_RE.test(key)) return send(res, 400, { error: 'Ungültiger Schlüssel.' });

    // Rate-Limit pro (gehashter) IP, 60 Sekunden: 20 Speichervorgänge, 10 Ladeversuche.
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const action = body.action;
    const rl = 'sv:ip:' + action + ':' + sha(ip + new Date().toISOString().slice(0, 10)).slice(0, 24);
    const [n] = await redis([['INCR', rl], ['EXPIRE', rl, 60]]);
    if (n > (action === 'put' ? 20 : 10)) return send(res, 429, { error: 'Zu viele Anfragen – kurz warten.' });

    const k = 'sv:' + sha(key);
    if (action === 'put') {
      const data = body.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res, 400, { error: 'Kein Spielstand.' });
      const json = JSON.stringify(data);
      if (json.length > MAX) return send(res, 413, { error: 'Spielstand zu groß.' });
      await redis([['SET', k, JSON.stringify({ t: Date.now(), data }), 'EX', TTL]]);
      return send(res, 200, { ok: true });
    }
    if (action === 'get') {
      const [v] = await redis([['GET', k]]);
      if (!v) return send(res, 404, { error: 'Kein Spielstand zu diesem Schlüssel gefunden.' });
      const { t, data } = JSON.parse(v);
      return send(res, 200, { ok: true, t, data });
    }
    if (action === 'del') {
      await redis([['DEL', k]]);
      return send(res, 200, { ok: true });
    }
    return send(res, 400, { error: 'Unbekannte Aktion.' });
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Cloud-Speicher gerade nicht erreichbar.' });
  }
};
