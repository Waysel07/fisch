// Rendert die pxl-Quellen zu Bildern, ohne npm-Pakete.
//   node img/pxl/render.js fisch [name ...]   -> img/<name>.png (Fische, Kreaturen, Figuren)
//   node img/pxl/render.js code  [name ...]   -> schreibt die Raster in js/fischen.js (Block ART)
// Das Spiel lädt weder diese Datei noch die Quellen.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..', '..');
const [which = 'fisch', ...want] = process.argv.slice(2);

// ------------------------------------------------------------ Farben
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const lum = (h) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

// ------------------------------------------------------------ Zeichnen
const FONT = {
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'],
  3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '###'], '.': ['.', '.', '.', '.', '#'], ',': ['.', '.', '.', '#', '#'], '%': ['#.#', '..#', '.#.', '#..', '#.#'],
};
let PAL = {};
const col = (c) => (c && PAL[c]) || c;
function canvas(w, h) {
  const g = Array.from({ length: h }, () => Array(w).fill(null));
  const P = (x, y, c) => {
    x = Math.round(x); y = Math.round(y); c = col(c);
    if (!c || x < 0 || y < 0 || x >= w || y >= h) return;
    // #rrggbbaa wird über das liegende Pixel gemischt
    if (c.length === 9) { const a = parseInt(c.slice(7), 16) / 255; c = g[y][x] ? mix(g[y][x], c.slice(0, 7), a) : a >= 0.5 ? c.slice(0, 7) : null; }
    if (c) g[y][x] = c;
  };
  const c = {
    w, h, g,
    get: (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : null),
    px: P,
    rect(x, y, ww, hh, k) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) P(x + i, y + j, k); },
    hline(x, y, l, k) { for (let i = 0; i < l; i++) P(x + i, y, k); },
    vline(x, y, l, k) { for (let i = 0; i < l; i++) P(x, y + i, k); },
    line(x0, y0, x1, y1, k, t = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) P(Math.round(x) + a - (t >> 1), Math.round(y) + b - (t >> 1), k);
      }
    },
    poly(pts, k) {
      const xs = [], ys = [];
      for (let i = 0; i < pts.length; i += 2) { xs.push(pts[i]); ys.push(pts[i + 1]); }
      const n = xs.length;
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
        for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
          const px = x + 0.5, py = y + 0.5; let ins = false;
          for (let i = 0, j = n - 1; i < n; j = i++) if ((ys[i] > py) !== (ys[j] > py) && px < (xs[j] - xs[i]) * (py - ys[i]) / (ys[j] - ys[i]) + xs[i]) ins = !ins;
          if (ins) P(x, y, k);
        }
      }
      for (let i = 0; i < n; i++) c.line(xs[i], ys[i], xs[(i + 1) % n], ys[(i + 1) % n], k);
    },
    ellipse(cx, cy, rx, ry, k) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2 <= 1) P(cx + x, cy + y, k); },
    circ(cx, cy, r, k) { c.ellipse(cx, cy, r, r, k); },
    ring(cx, cy, r, k) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y); if (d <= r + 0.5 && d > r - 0.5) P(cx + x, cy + y, k); } },
    // 3×5-Ziffernschrift, Punkt und Komma einen Pixel breit
    text(x, y, str, k) {
      for (const ch of String(str)) {
        const f = FONT[ch];
        if (!f) { x += 4; continue; }
        f.forEach((r, j) => [...r].forEach((v, i) => { if (v === '#') P(x + i, y + j, k); }));
        x += f[0].length + 1;
      }
    },
  };
  return c;
}
function outline(g, k) {
  const h = g.length, w = g[0].length, o = Array.from({ length: h + 2 }, () => Array(w + 2).fill(null));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[y + 1][x + 1] = g[y][x];
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : null);
  for (let y = 0; y < h + 2; y++) for (let x = 0; x < w + 2; x++) {
    if (o[y][x]) continue;
    if (at(x, y - 1) || at(x - 2, y - 1) || at(x - 1, y) || at(x - 1, y - 2)) o[y][x] = k;
  }
  return o;
}


// ------------------------------------------------------------ Licht und Umriss (für Quellen, die sie wollen)
// light(c): Licht von oben links. Oberkanten bekommen einen warmen Glanz, Unterkanten einen kühlen Schatten,
// Seiten etwas davon. Dünne Linien (Barteln, Strahlen) und Tinte bleiben unberührt.
const GLOW = '#fff6d8', SHADE = '#2a1f4a';
function light(c, { top = 0.3, top2 = 0.12, bot = 0.3, bot2 = 0.13, side = 0.12, min = 4, core = 0, dither = false } = {}) {
  const src = c.g.map((r) => r.slice()), at = (x, y) => (y >= 0 && y < c.h && x >= 0 && x < c.w ? src[y][x] : null);
  const run = (x, y, dx, dy, cap = 8) => { let n = 0; while (n < cap && at(x + dx * (n + 1), y + dy * (n + 1))) n++; return n; };
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const k = src[y][x];
    if (!k || lum(k) < 0.13) continue;
    const up = run(x, y, 0, -1, 60), dn = run(x, y, 0, 1, 60), lf = run(x, y, -1, 0), rt = run(x, y, 1, 0);
    let t = 0, to = GLOW;
    if (up + dn + 1 >= min) {
      if (up === 0) t = top; else if (up === 1) t = top2;
      else if (dn === 0) { t = bot; to = SHADE; } else if (dn === 1) { t = bot2; to = SHADE; }
      else if (core && up + dn + 1 >= 9) {
        // Kernschatten: ein weiches Band im unteren Drittel, darunter etwas Rücklicht vor dem Rand
        const v = up / (up + dn);
        if (v > 0.6 && v < 0.84) { t = core; to = SHADE; if (dither && (v < 0.65 || v > 0.79) && (x + y) % 2) t = 0; }
        else if (v <= 0.22 && v > 0.1) { t = core * 0.6; if (dither && v > 0.17 && (x + y) % 2) t = 0; }
      }
    }
    if (!t && lf + rt + 1 >= min) { if (lf === 0) t = side; else if (rt === 0) { t = side; to = SHADE; } }
    if (t) c.g[y][x] = mix(k, to, t);
  }
}
// spec(c, x, y): kleiner Glanzpunkt (2 Pixel weiß, einer halb)
function spec(c, x, y, k = '#ffffff') { c.px(x, y, k); c.px(x + 1, y, k); c.px(x, y + 1, k + '99'); }
// ramp(base): Farbtreppe zum Grundton, heller wird wärmer, dunkler kühler: [hell, Grund, dunkel, tief]
const ramp = (b) => [mix(b, GLOW, 0.35), b, mix(b, SHADE, 0.3), mix(b, SHADE, 0.55)];
// selout(g, ink): Umriss auf der Lichtseite (oben, links) nimmt etwas Farbe vom Körper an, unten rechts bleibt er satt.
function selout(g, ink, t = 0.38) {
  const h = g.length, w = g[0].length, o = g.map((r) => r.slice()), at = (x, y) => (y >= 0 && y < h && x >= 0 && x < w ? g[y][x] : null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (g[y][x] !== ink) continue;
    const b = at(x, y + 1), r = at(x + 1, y);
    const n = b && b !== ink && !at(x, y - 1) ? b : r && r !== ink && !at(x - 1, y) ? r : null;
    if (n && lum(n) > 0.13) o[y][x] = mix(ink, n, t);
  }
  return o;
}

// ------------------------------------------------------------ PNG
function png(g, s) {
  const h = g.length, w = g[0].length, W = w * s, H = h * s, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const v = g[Math.floor(y / s)][Math.floor(x / s)], o = y * (W * 4 + 1) + 1 + x * 4;
      if (v) { const [r, gg, b] = rgb(v); raw[o] = r; raw[o + 1] = gg; raw[o + 2] = b; raw[o + 3] = 255; }
    }
  }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ------------------------------------------------------------ Lauf
const out = [];
function sprite(name, opt, fn) {
  if (want.length && !want.includes(name)) return;
  const c = canvas(opt.w, opt.h);
  fn(c);
  if (opt.post) opt.post(c);
  let g = c.g;
  if (opt.flip) g = g.map((r) => r.slice().reverse());
  if (opt.outline) g = outline(g, col(opt.outline));
  if (opt.edge) g = opt.edge(g);
  out.push({ name, g, keys: opt.keys, scale: opt.scale || 2, file: opt.file || path.join('img', name + '.png') });
}
const ctx = { sprite, light, selout, spec, ramp, pal: (p) => Object.assign(PAL, p), mix, lum, rgb, hex, Math, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, which + '.px.js'), 'utf8'), ctx, { filename: which + '.px.js' });

if (which === 'code') {
  // Raster als Zeichenreihen: Farben bekommen Buchstaben, k bleibt der Umriss
  const file = path.join(ROOT, 'js', 'fischen.js');
  let src = fs.readFileSync(file, 'utf8');
  for (const { name, g, keys: fixed = {} } of out) {
    // opt.keys = { Zeichen: Farbe } legt Buchstaben fest, die das Spiel umfärbt (z. B. Hut h H l wie bei PLAYER_PAL)
    const map = {}, inv = {}, keys = ('kabcdefghijlmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&*+-=?@^_~<>|;:' + Array.from({ length: 64 }, (_, i) => String.fromCharCode(0xc0 + i)).join('')).split('').filter((ch) => !(ch in fixed));
    // gelichtete Sprites haben viele Mischfarben; reichen die Zeichen nicht, bricht der Lauf ab statt kaputte Raster zu schreiben
    for (const [ch, v] of Object.entries(fixed)) inv[col(v)] = ch;
    let n = 0;
    const rows = g.map((r) => r.map((v) => {
      if (!v) return '.';
      if (!(v in inv)) { const ch = v === PAL.k ? 'k' : keys[1 + n++]; if (!ch) throw new Error(name + ': zu viele Farben'); inv[v] = ch; }
      map[inv[v]] = v;
      return inv[v];
    }).join(''));
    const line = `    ${name}: [${JSON.stringify(rows)}, ${JSON.stringify(map)}],`;
    const re = new RegExp(`^    ${name}: \\[.*\\],$`, 'm');
    if (re.test(src)) src = src.replace(re, () => line);
    else if (src.includes('\n  const ART = {\n')) src = src.replace('\n  const ART = {\n', () => '\n  const ART = {\n' + line + '\n');
    else console.log('kein ART-Block für', name);
  }
  fs.writeFileSync(file, src);
} else {
  for (const { g, scale, file } of out) fs.writeFileSync(path.join(ROOT, file), png(g, scale));
}
console.log(out.length + ' Sprites');
