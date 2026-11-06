// Gemeinsame Namens- und Textprüfung für Bestenliste, Lobbys und das Ideenbrett (Dateien mit _ sind bei Vercel keine Endpunkte).
//
// Zwei Listen:
//  - BLOCK: kurze Wortteile, die auch mitten in einem Wort nicht vorkommen dürfen (z. B. „hitler“ in „xhitlerx“).
//  - Die große Wortliste aus _badwords.js (28 Sprachen, CC BY 4.0). Ihre Einträge zählen nur als ganze Wörter,
//    sonst würden harmlose Wörter wie „Kanal“ (anal) oder „Klasse“ (ass) hängen bleiben. Chinesisch, Japanisch,
//    Koreanisch und Thai trennen Wörter nicht mit Leerzeichen; dort zählt jedes Vorkommen.
'use strict';
const WORDS = require('./_badwords');

const NAME_RE = /^[\p{L}\p{N} ._\-!?]{1,16}$/u;
const BLOCK = ['nazi', 'hitler', 'nigg', 'neger', 'fotze', 'hure', 'fick', 'fuck', 'cunt', 'faggot', 'schwuchtel', 'admin',
  'penis', 'pimmel', 'vagina', 'porno', 'wichs', 'nutte', 'spast', 'missgeburt', 'kanake', 'bitch', 'cock'];
// Einträge der großen Liste, die im Deutschen oder Englischen ganz normale Wörter sind
const ALLOW = new Set(['am', 'amı', 'ass', 'fan', 'pot', 'mama', 'trio', 'gat', 'hol', 'paal', 'poot', 'con', 'duro', 'nudo',
  'pipa', 'biga', 'mona', 'fava', 'cu', 'pau', 'saco', 'gol', 'molo', 'pano', 'reva', 'olla', 'jajo', 'cyc', 'knor', 'delg',
  'fing', 'pele', 'byk', 'asno', 'sm', '3p', '13.', 'mufti', 'bonze', 'fratze', 'popel', 'kimme', 'lümmel', 'nackt',
  'nicht', 'bitte', 'bite', 'stake', 'anita', 'regina', 'johny', 'griet', 'pippa', 'moona', 'satan', 'inferno', 'idiota', 'burro',
  'comer', 'amador', 'consolo', 'drogas', 'concha', 'franc', 'marha', 'pesce', 'pistola', 'carità', 'venire', 'aranha', 'cerveja',
  'pinto', 'corno', 'balle', 'palle', 'balen', 'palen', 'standje', 'watje', 'beurt', 'racista', 'tavara', 'panna', 'pipari',
  'haahka', 'viiksi', 'tirare', 'battere', 'montare', 'monta', 'manico', 'lumaca', 'guanto', 'cozza', 'quaglia', 'patacca',
  'matje', 'schatje', 'zaadje', 'stootje', 'asbak', 'jajko', 'jajco', 'cailler', 'bosser', 'drague', 'veuve', 'kanen', 'luder']);
const NOSPACE = new Set(['zh', 'ja', 'ko', 'th']);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const spaced = [], dense = [];
for (const [lang, list] of Object.entries(WORDS)) {
  for (const w of list) {
    if (ALLOW.has(w)) continue;
    if (NOSPACE.has(lang) && !/^[a-z0-9 ]+$/.test(w)) dense.push(w); else spaced.push(w);
  }
}
const byLen = (a, b) => b.length - a.length; // längste zuerst, damit „arschloch“ vor „arsch“ greift
// Ganze Wörter: davor und dahinter kein Buchstabe (Ziffern zählen als Trenner, damit „fick1“ hängen bleibt)
const WORD_RE = new RegExp('(?<!\\p{L})(?:' + [...new Set(spaced)].sort(byLen).map((w) => esc(w).replace(/ +/g, '[\\s._-]+')).join('|') + ')(?!\\p{L})', 'giu');
const DENSE_RE = dense.length ? new RegExp([...new Set(dense)].sort(byLen).map(esc).join('|'), 'gu') : null;
const BLOCK_RE = new RegExp(BLOCK.join('|'), 'gi');

const test = (re, s) => { re.lastIndex = 0; const hit = re.test(s); re.lastIndex = 0; return hit; };

// true, wenn der Text etwas aus einer der Listen enthält
function isBad(s) {
  if (typeof s !== 'string') return false;
  s = s.normalize('NFC');
  const low = s.toLowerCase().replace(/[^a-zäöüß]/g, '');
  return BLOCK.some((b) => low.includes(b)) || test(WORD_RE, s) || (DENSE_RE ? test(DENSE_RE, s) : false);
}

function cleanName(n) {
  if (typeof n !== 'string') return null;
  n = n.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!NAME_RE.test(n)) return null;
  if (isBad(n)) return null;
  return n;
}
// Freitext (Chat, Ideen): Steuerzeichen raus, Treffer aus den Listen durch *** ersetzen
function cleanText(m, max) {
  if (typeof m !== 'string') return '';
  m = m.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  m = m.replace(BLOCK_RE, '***').replace(WORD_RE, '***');
  if (DENSE_RE) m = m.replace(DENSE_RE, '***');
  return m;
}
const cleanChat = (m) => cleanText(m, 100);
module.exports = { cleanName, cleanChat, cleanText, isBad };
