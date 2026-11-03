// Gemeinsame Namensprüfung für Bestenliste und Lobbys (Dateien mit _ sind bei Vercel keine Endpunkte).
'use strict';
const NAME_RE = /^[\p{L}\p{N} ._\-!?]{2,16}$/u;
const BLOCK = ['nazi', 'hitler', 'nigg', 'neger', 'fotze', 'hure', 'fick', 'fuck', 'cunt', 'faggot', 'schwuchtel', 'admin'];

function cleanName(n) {
  if (typeof n !== 'string') return null;
  n = n.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!NAME_RE.test(n)) return null;
  const low = n.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (BLOCK.some((b) => low.includes(b))) return null;
  return n;
}
module.exports = { cleanName };
