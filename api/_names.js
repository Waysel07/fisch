// Gemeinsame Namensprüfung für Bestenliste und Lobbys (Dateien mit _ sind bei Vercel keine Endpunkte).
'use strict';
const NAME_RE = /^[\p{L}\p{N} ._\-!?]{1,16}$/u;
const BLOCK = ['nazi', 'hitler', 'nigg', 'neger', 'fotze', 'hure', 'fick', 'fuck', 'cunt', 'faggot', 'schwuchtel', 'admin'];

function cleanName(n) {
  if (typeof n !== 'string') return null;
  n = n.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!NAME_RE.test(n)) return null;
  const low = n.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (BLOCK.some((b) => low.includes(b))) return null;
  return n;
}
// Chat: Steuerzeichen raus, Beleidigungen aus der Liste durch *** ersetzen
function cleanChat(m) {
  if (typeof m !== 'string') return '';
  m = m.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  for (const b of BLOCK) m = m.replace(new RegExp(b, 'gi'), '***');
  return m;
}
module.exports = { cleanName, cleanChat };
