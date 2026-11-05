// Quelle aller Pixel-Sprites von fisch.ing (pxl-DSL). Das Spiel lädt diese Datei nicht,
// das Spiel liest nur die fertigen PNGs in img/ und die Raster in js/fischen.js.
// Reihenfolge: gemeinsame Helfer, dann die Sprite-Gruppen.
pal({ k: '#1b1f2e' })
const INK = '#1b1f2e'

// ---------------------------------------------------------------- Helfer
// Körperprofil: Kopf links (u=0) bis Schwanzansatz rechts (u=1).
function P({ x0, x1, cy, up, dn = up, peak = 0.36, hp = 0.6, tp = 1.1, end = 0.14, arch = 0 }) {
  const f = (u) => u < peak ? Math.sin((Math.PI / 2) * u / peak) ** hp : end + (1 - end) * Math.cos((Math.PI / 2) * (u - peak) / (1 - peak)) ** tp
  const uu = (x) => (x + 0.5 - x0) / (x1 - x0)
  const mid = (u) => cy + arch * Math.sin(u * Math.PI)
  return { x0, x1, cy, f, uu, top: (x) => mid(uu(x)) - up * f(uu(x)), bot: (x) => mid(uu(x)) + dn * f(uu(x)) }
}
// Färbt das Profil: skin(u, v, x, y) gibt eine Farbe (v: 0 Rücken, 1 Bauch).
function paint(c, p, skin) {
  for (let x = Math.floor(p.x0); x < p.x1; x++) {
    const t = p.top(x), b = p.bot(x), u = p.uu(x)
    for (let y = Math.floor(t); y <= Math.ceil(b); y++) {
      const m = y + 0.5
      if (m < t || m > b) continue
      const col = skin(u, (m - t) / Math.max(0.001, b - t), x, y)
      if (col) c.px(x, y, col)
    }
  }
}
// Farbbänder: B(v, .3, 'a', .7, 'b', 'c') -> a bis .3, b bis .7, sonst c
const B = (v, ...s) => { for (let i = 0; i + 1 < s.length; i += 2) if (v < s[i]) return s[i + 1]; return s[s.length - 1] }
// Schuppen im Versatz; liegen nur auf den Flanken und folgen der Körperrundung
const scale = (x, y, w = 4) => (y % 2 === 0) && ((x + (y % 4 === 0 ? 0 : w >> 1)) % w === 0)
function fan(c, [bx, by], tips, col, ray) {
  c.poly([bx, by, ...tips.flat()], col)
  if (ray) for (const [x, y] of tips.slice(1, -1)) c.line(bx, by, x, y, ray)
}
function tail(c, x, cy, len, spread, notch, col, ray) {
  const n = Math.max(2, Math.round(spread / 2))
  const tips = []
  for (let i = -n; i <= n; i++) tips.push([x + len - notch * (1 - Math.abs(i) / n), cy + spread * i / n])
  fan(c, [x, cy], tips, col, ray)
}
function eye(c, x, y, { w = '#f8fafc', p = INK, size = 3 } = {}) {
  c.rect(x, y, size, size, w)
  c.rect(x, y + (size > 2 ? 1 : 0), size - 1, size - (size > 2 ? 1 : 0), p)
  if (size > 2) c.px(x, y + 1, '#ffffff')
}
function gill(c, p, u, col, bow = 2) {
  const gx = p.x0 + u * (p.x1 - p.x0)
  const x0 = Math.round(gx), t = p.top(x0), b = p.bot(x0)
  for (let y = Math.ceil(t + (b - t) * 0.2); y <= b - (b - t) * 0.16; y++) {
    const v = (y - t) / (b - t)
    c.px(Math.round(gx + bow * Math.sin(v * Math.PI)), y, col)
  }
}
const drop = (c, x, y, a = '#7dd3fc', b = '#e0f2fe') => { c.px(x, y, a); c.px(x, y + 1, b) }
function sprk(c, x, y, a = '#fde047', b = '#fffbeb') { c.px(x, y, b); c.px(x - 1, y, a); c.px(x + 1, y, a); c.px(x, y - 1, a); c.px(x, y + 1, a) }
// W, H = Endgröße inkl. Umriss (1 Pixel je Seite)
function F(name, W, H, o, fn) {
  const opt = { w: W - 2, h: H - 2, outline: 'k' }
  if (o.flip) opt.flip = 'x'
  if (o.plain) { opt.w = W; opt.h = H; delete opt.outline }
  sprite(name, opt, fn)
}

// ---------------------------------------------------------------- Steg
F('stinkfisch', 68, 44, {}, (c) => {
  const p = P({ x0: 2, x1: 52, cy: 25, up: 14, dn: 14, peak: 0.34, hp: 0.5, tp: 1.0, end: 0.18 })
  fan(c, [20, 13], [[23, 6], [31, 7], [38, 13]], '#3f6212', '#2f4a0e')
  fan(c, [24, 37], [[24, 41], [33, 41], [34, 36]], '#3f6212', '#2f4a0e')
  tail(c, 50, 25, 15, 14, 6, '#4d7c0f', '#365314')
  paint(c, p, (u, v, x, y) => {
    const b1 = Math.hypot((x - 22) * 0.8, y - 19) < 4.5, b2 = Math.hypot((x - 37) * 0.8, y - 21) < 3.2, b3 = Math.hypot((x - 13) * 0.8, y - 15) < 2.2, b4 = Math.hypot((x - 30) * 0.8, y - 14) < 2
    if (v > 0.68) return v > 0.9 ? '#b7a95c' : '#d9c977'
    if (b1 || b2 || b3 || b4) return '#4d7c0f'
    return B(v, 0.14, '#4d7c0f', 0.26, '#7ca82a', 0.56, '#65901f', '#567e18')
  })
  gill(c, p, 0.26, '#365314')
  eye(c, 8, 18)
  c.line(3, 29, 9, 31, '#2f4a0e')
  c.px(9, 30, '#2f4a0e')
  fan(c, [18, 29], [[17, 33], [24, 34], [25, 30]], '#3f6212', '#2f4a0e')
  // Gestank: drei Schwaden über dem Rücken
  for (const [x, y] of [[12, 3], [26, 1], [40, 4]]) {
    for (let i = 0; i < 7; i++) c.px(x + (i % 4 === 0 || i % 4 === 1 ? 0 : 1), y + i, i < 3 ? '#a3e635' : '#65a30d')
  }
})

F('schlammfisch', 68, 44, {}, (c) => {
  const p = P({ x0: 2, x1: 54, cy: 22, up: 13, dn: 13, peak: 0.32, hp: 0.5, end: 0.2 })
  fan(c, [16, 11], [[20, 5], [30, 5], [40, 11]], '#3f2a18', '#2a1b0f')
  tail(c, 52, 22, 12, 11, 4, '#4a3119', '#2a1b0f')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.55 + 0.06 * Math.sin(x * 0.7)) return B(v, 0.8, '#8a5c32', '#74492a')
    if (v < 0.13) return '#55361c'
    return scale(x, y, 5) ? '#55361c' : '#6d4726'
  })
  c.rect(5, 12, 7, 2, '#8a6236')
  gill(c, p, 0.24, '#3f2a18')
  eye(c, 7, 16)
  c.line(2, 25, 8, 26, '#3f2a18')
  // Schlamm tropft vom Bauch
  for (const [x, l] of [[14, 6], [23, 8], [32, 5], [41, 4]]) {
    const y = Math.floor(p.bot(x))
    c.vline(x, y, l, '#55361c'); c.vline(x + 1, y, l - 2, '#3f2a18'); c.px(x, y + l, '#3f2a18')
  }
})

F('platschkarpfen', 68, 44, {}, (c) => {
  const p = P({ x0: 3, x1: 50, cy: 24, up: 14, dn: 12, peak: 0.34, hp: 0.5, end: 0.16 })
  fan(c, [15, 12], [[21, 6], [32, 8], [40, 16]], '#7a5a2a', '#55401c')
  tail(c, 48, 24, 16, 12, 6, '#94702f', '#6a4f20')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.74) return '#e0b561'
    if (v < 0.12) return '#7a5a2a'
    return scale(x, y) ? '#7a5a2a' : B(v, 0.4, '#a88338', '#b8913f')
  })
  gill(c, p, 0.24, '#55401c')
  fan(c, [18, 28], [[16, 34], [24, 35], [25, 29]], '#94702f', '#6a4f20')
  eye(c, 8, 18)
  // dickes Karpfenmaul mit Bartel
  c.rect(1, 25, 4, 3, '#d9a65c'); c.hline(1, 26, 4, '#55401c')
  c.line(4, 28, 3, 32, '#55401c')
  for (const [x, y] of [[8, 4], [3, 10], [14, 2], [58, 9], [61, 5], [55, 3]]) drop(c, x, y)
})

F('oelfisch', 68, 44, {}, (c) => {
  const p = P({ x0: 3, x1: 53, cy: 21, up: 13, dn: 13, peak: 0.36, hp: 0.5, end: 0.18 })
  const ir = ['#f472b6', '#a855f7', '#38bdf8', '#34d399', '#facc15']
  tail(c, 51, 21, 13, 12, 5, '#1f2937', '#111827')
  fan(c, [20, 9], [[25, 4], [34, 5], [38, 9]], '#1f2937', '#111827')
  paint(c, p, (u, v, x, y) => {
    const w = 0.28 + 0.05 * Math.sin(x * 0.45)
    if (v > w && v < w + 0.18) return ir[Math.floor((x + (v > w + 0.09 ? 2 : 0)) / 3) % 5]
    return B(v, 0.1, '#475569', 0.72, '#2f3a4e', '#232c3d')
  })
  gill(c, p, 0.25, '#111827')
  eye(c, 8, 17, { w: '#e2e8f0' })
  c.line(3, 25, 9, 26, '#111827')
  // Öltropfen mit Schillern
  for (const [x, l] of [[18, 5], [29, 7], [39, 4]]) {
    const y = Math.floor(p.bot(x))
    c.vline(x, y, l, '#1f2937'); c.px(x, y + l, '#a855f7')
  }
})

F('kritzelfisch', 68, 44, { plain: true }, (c) => {
  // Mit Bleistift gekritzelt: Linien wackeln, nichts ist ganz geschlossen
  const G = '#3f3f46', g = '#a1a1aa', W = '#f5f1e6'
  const p = P({ x0: 10, x1: 50, cy: 23, up: 14, dn: 13, peak: 0.34, hp: 0.5, end: 0.12 })
  paint(c, p, (u, v, x, y) => (v > 0.6 && (x + y) % 3 === 0 ? g : W))
  for (let x = 10; x < 50; x++) {
    const w = ((x * 7) % 5 === 0) ? 1 : 0
    if (x % 11 !== 5) c.px(x, Math.round(p.top(x)) - w, G)
    if (x % 13 !== 6) c.px(x, Math.round(p.bot(x)) + w, G)
  }
  // zweite, schief nachgezogene Linie
  for (let x = 16; x < 36; x += 1) if (x % 3) c.px(x, Math.round(p.top(x)) + 1 - (x % 2), g)
  // Schwanz: nur Schraffur
  for (let i = 0; i < 8; i++) c.line(49, 23, 65 - (i % 2) * 2, 10 + i * 3.6, i % 2 ? g : G)
  c.line(65, 9, 64, 37, G)
  eye(c, 15, 16, { w: W, p: G })
  c.line(9, 27, 15, 28, G)
  for (let y = 12; y < 34; y += 1) c.px(24 + Math.round(2 * Math.sin((y - 12) / 22 * Math.PI)) + (y % 3 === 0 ? 1 : 0), y, G)
  // Schuppen als schnelle Bögen
  for (const [x, y] of [[30, 15], [36, 18], [30, 21], [37, 25], [30, 27], [42, 21]]) { c.px(x, y, G); c.px(x + 1, y - 1, G); c.px(x + 2, y, G) }
  // Stacheln auf dem Rücken
  for (const x of [20, 26, 32, 38]) c.line(x, Math.round(p.top(x)), x + 2, Math.round(p.top(x)) - 4, G)
})

F('drachenkarpfen', 80, 48, {}, (c) => {
  // eigener Drachenkarpfen: Schlangenleib in Jade, Bauch in Gold, rote Flossen
  const yAt = (x) => 21 + 7 * Math.sin((x - 10) / 14)
  for (const [x, y] of [[17, 15], [30, 12], [42, 25], [56, 25]]) c.poly([x, y, x + 3, y - 7, x + 7, y], '#b91c1c')
  for (let x = 9; x < 68; x++) {
    const r = 6.5 - 4.5 * ((x - 9) / 59), m = yAt(x)
    for (let y = Math.floor(m - r); y <= m + r; y++) {
      const v = (y + 0.5 - (m - r)) / (2 * r)
      if (v < 0 || v > 1) continue
      const seg = (x + y) % 6 === 0
      c.px(x, y, v > 0.68 ? (x % 4 === 0 ? '#ca8a04' : '#facc15') : v < 0.16 ? '#047857' : seg ? '#059669' : '#10b981')
    }
  }
  tail(c, 67, Math.round(yAt(67)), 11, 8, 4, '#dc2626', '#991b1b')
  // Kopf mit Hörnern, Bart und offenem Maul
  c.poly([0, 20, 6, 14, 15, 13, 18, 20, 16, 29, 6, 28, 0, 26], '#10b981')
  c.poly([0, 23, 10, 24, 10, 26, 0, 25], '#7f1d1d')
  c.hline(1, 22, 3, '#f8fafc'); c.hline(1, 26, 3, '#f8fafc')
  c.rect(1, 27, 12, 2, '#facc15')
  c.line(11, 13, 17, 6, '#fde68a'); c.line(13, 13, 21, 8, '#fde68a')
  eye(c, 8, 16, { w: '#fde047' })
  c.line(2, 29, 0, 35, '#fde68a'); c.line(5, 29, 7, 37, '#fde68a')
  c.poly([16, 13, 23, 7, 22, 16], '#dc2626')
  // Wasser darunter
  for (let x = 0; x < 78; x++) { const y = 42 + Math.round(Math.sin(x * 0.5)); c.px(x, y, '#38bdf8'); if (x % 7 < 4) c.px(x, y - 1, '#e0f2fe') }
  for (const [x, y] of [[21, 38], [36, 40], [52, 37], [66, 39]]) drop(c, x, y)
})

F('fischstaebchen', 48, 22, {}, (c) => {
  c.rect(1, 7, 44, 12, '#d9962e')
  c.rect(1, 7, 44, 2, '#f2bf56')
  c.rect(1, 17, 44, 2, '#a86a1c')
  // Panade: Krümel nach festem Raster, nicht zufällig
  for (let y = 9; y < 17; y++) for (let x = 2 + (y % 3); x < 45; x += 5) c.px(x + ((y * 3) % 2), y, (x + y) % 2 ? '#f2bf56' : '#b97a20')
  c.rect(7, 10, 3, 3, '#f8fafc'); c.rect(7, 11, 2, 2, INK)
  c.rect(14, 10, 3, 3, '#f8fafc'); c.rect(14, 11, 2, 2, INK)
  c.line(8, 15, 15, 15, '#6b3f10'); c.px(16, 14, '#6b3f10')
  // Krümel und Dampf
  for (const [x, y] of [[4, 19], [12, 20], [24, 19], [33, 20], [41, 19]]) c.px(x, y, '#b97a20')
  for (const x of [22, 30, 38]) for (let i = 0; i < 5; i++) c.px(x + (i % 2), i, '#e2e8f0')
})

F('flaschenpost', 44, 22, {}, (c) => {
  // Flasche liegt, Korken rechts
  c.rect(1, 3, 30, 15, '#14532d')
  c.rect(2, 4, 28, 13, '#2f855a')
  c.rect(30, 6, 3, 9, '#2f855a'); c.rect(33, 7, 5, 7, '#2f855a')
  c.rect(2, 5, 28, 2, '#86efac'); c.rect(33, 8, 5, 1, '#86efac')
  c.rect(2, 14, 28, 3, '#1f6b45')
  c.rect(38, 7, 4, 7, '#a0662f'); c.rect(38, 7, 4, 2, '#c98f4f'); c.vline(40, 9, 5, '#7c4a24')
  // Brief, mit roter Schnur
  c.rect(8, 7, 15, 8, '#f5e6c0'); c.rect(8, 13, 15, 2, '#d9c08a')
  for (let i = 0; i < 3; i++) c.hline(10, 8 + i * 2, 11 - i * 2, '#8a6a3a')
  c.vline(15, 7, 8, '#dc2626'); c.rect(14, 10, 3, 2, '#991b1b')
})

// ---------------------------------------------------------------- Wetter
F('pfuetzenspringer', 40, 28, {}, (c) => {
  const p = P({ x0: 2, x1: 29, cy: 14, up: 9, dn: 9, peak: 0.36, hp: 0.5, end: 0.2 })
  fan(c, [10, 6], [[13, 1], [18, 2], [22, 7]], '#1d4f85', '#163c66')
  tail(c, 27, 14, 10, 9, 3, '#2a78b8', '#1d4f85')
  paint(c, p, (u, v, x, y) => (v > 0.68 ? '#e0f2fe' : v < 0.14 ? '#1d6aa5' : scale(x, y) ? '#2a78b8' : '#38a0dc'))
  gill(c, p, 0.28, '#1d4f85', 1)
  eye(c, 6, 10)
  c.line(2, 17, 7, 18, '#1d4f85')
  for (const [x, y] of [[4, 2], [24, 1], [35, 4], [33, 22], [6, 23], [20, 24]]) drop(c, x, y)
})

F('nebelgeist', 44, 28, { plain: true }, (c) => {
  // ohne Umriss und halb durchsichtig; löst sich zum Schwanz hin auf
  const p = P({ x0: 2, x1: 30, cy: 12, up: 9, dn: 9, peak: 0.34, hp: 0.5, end: 0.3 })
  paint(c, p, (u, v, x, y) => {
    if (v < 0.1 || v > 0.92) return '#94a3b8cc'
    return v > 0.65 ? '#e2e8f0dd' : '#cbd5e1dd'
  })
  for (let x = 30; x < 42; x++) for (let y = 4; y < 22; y++) {
    const d = Math.abs(y - 12.5) / (4 + (x - 30) * 0.6), a = (x - 30) / 12
    if (d < 1 && (x + y * 2) % 3 !== 0 && ((x + y) % 2 === 0 || a < 0.5)) c.px(x, y, a < 0.5 ? '#cbd5e1aa' : '#cbd5e166')
  }
  // Fetzen am Bauch
  for (const [x, l] of [[8, 5], [14, 7], [20, 5], [26, 4]]) { for (let i = 0; i < l; i++) c.px(x + (i % 3 === 2 ? 1 : 0), 20 + i, i < l - 2 ? '#cbd5e1aa' : '#cbd5e155') }
  c.rect(6, 9, 3, 4, '#1e293b'); c.rect(12, 9, 3, 4, '#1e293b')
  c.px(6, 9, '#f8fafc'); c.px(12, 9, '#f8fafc')
  c.rect(8, 15, 5, 3, '#1e293b')
  for (const [x, y] of [[34, 2], [38, 6], [33, 24], [2, 25]]) c.px(x, y, '#cbd5e188')
})

F('blitzwels', 56, 30, {}, (c) => {
  const p = P({ x0: 5, x1: 43, cy: 15, up: 9, dn: 10, peak: 0.26, hp: 0.45, end: 0.2 })
  fan(c, [18, 7], [[20, 1], [27, 2], [31, 8]], '#0f1b3d', '#0a1228')
  tail(c, 41, 15, 12, 9, 3, '#1b2d5e', '#0f1b3d')
  paint(c, p, (u, v) => (v > 0.72 ? '#8ba6d6' : v < 0.12 ? '#14234a' : B(v, 0.55, '#22366e', '#2c4587')))
  // Blitze auf der Flanke
  for (const x of [15, 26, 34]) { const pts = [[x, 9], [x - 2, 12], [x + 1, 12], [x - 1, 16]]; for (let i = 0; i < 3; i++) c.line(...pts[i], ...pts[i + 1], '#facc15') }
  eye(c, 9, 11, { w: '#fde047' })
  c.line(5, 18, 12, 19, '#0f1b3d')
  // knisternde Barteln
  c.line(6, 19, 1, 24, '#fde047'); c.line(5, 16, 0, 13, '#fde047'); c.line(8, 20, 5, 26, '#ca8a04')
  sprk(c, 2, 8); sprk(c, 49, 2); sprk(c, 50, 25)
})

F('regenbogenforelle', 52, 26, {}, (c) => {
  const p = P({ x0: 2, x1: 39, cy: 12, up: 8, dn: 9, peak: 0.36, hp: 0.55, end: 0.18 })
  const rb = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7']
  fan(c, [16, 5], [[19, 1], [25, 2], [28, 6]], '#4b5a26', '#364219')
  tail(c, 37, 12, 12, 9, 3, '#5f7030', '#4b5a26')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.44 && v < 0.74) return rb[Math.min(5, Math.floor((v - 0.44) / 0.3 * 6))]
    if (v >= 0.74) return '#f8fafc'
    const spot = (x * 3 + y * 5) % 11 === 0 && x > 10
    return spot ? '#2b3412' : v < 0.15 ? '#556531' : '#7a8d3f'
  })
  gill(c, p, 0.22, '#364219', 1)
  eye(c, 6, 8)
  c.line(2, 15, 7, 16, '#364219')
  fan(c, [20, 21], [[19, 23], [24, 23], [25, 20]], '#5f7030', '#4b5a26')
})

F('kaufland-fisch', 52, 30, {}, (c) => {
  // Eingeschweißt in der Styroporschale, ohne Logo
  c.rect(0, 5, 50, 23, '#94a3b8')
  c.rect(1, 6, 48, 21, '#e2e8f0')
  c.rect(3, 8, 44, 17, '#f8fafc')
  const p = P({ x0: 5, x1: 34, cy: 16, up: 6, dn: 6, peak: 0.34, end: 0.2 })
  tail(c, 33, 16, 9, 6, 3, '#64748b', '#475569')
  paint(c, p, (u, v, x, y) => (v > 0.6 ? '#e2e8f0' : scale(x, y) ? '#64748b' : '#8496ad'))
  eye(c, 8, 13, { size: 2 })
  // Folie: harte Glanzstreifen über allem
  for (const [x, y, l] of [[6, 21, 9], [10, 24, 6], [28, 23, 9], [33, 26, 5]]) c.line(x, y, x + l, y - l, '#ffffffbb')
  // Preisschild und Rabatt
  c.rect(30, 0, 18, 6, '#facc15'); c.rect(30, 0, 18, 1, '#fef08a')
  c.hline(32, 3, 13, '#a16207')
  c.rect(30, 17, 19, 10, '#dc2626'); c.rect(30, 17, 19, 1, '#ef4444')
  c.text(32, 19, '4.99', '#ffffff')
})

F('energy-fisch', 52, 30, {}, (c) => {
  // Getränkedose mit Flossen. Eigener Blitz statt eines Markenzeichens.
  tail(c, 42, 14, 8, 10, 3, '#16a34a', '#14532d')
  fan(c, [18, 3], [[20, 0], [27, 0], [30, 3]], '#16a34a', '#14532d')
  c.rect(6, 3, 37, 23, '#18212b')
  c.rect(6, 3, 37, 2, '#364354'); c.rect(6, 22, 37, 4, '#0d131a')
  c.rect(2, 5, 4, 19, '#94a3b8'); c.rect(2, 5, 1, 19, '#cbd5e1'); c.rect(0, 7, 2, 15, '#64748b')
  c.rect(43, 5, 2, 19, '#94a3b8')
  const bolt = [[32, 5], [25, 13], [31, 13], [22, 23], [24, 15], [19, 15], [25, 5]]
  c.poly(bolt.flat(), '#4ade80')
  c.line(32, 5, 25, 13, '#bbf7d0')
  eye(c, 10, 9)
  c.line(8, 17, 14, 18, '#4ade80')
  fan(c, [15, 26], [[14, 28], [20, 28], [22, 26]], '#16a34a', '#14532d')
})

// ---------------------------------------------------------------- Hohe See
F('hering', 40, 20, {}, (c) => {
  const p = P({ x0: 2, x1: 30, cy: 9, up: 6, dn: 7, peak: 0.34, end: 0.14 })
  fan(c, [13, 4], [[15, 0], [19, 1], [21, 4]], '#2f4a75', '#1f3454')
  tail(c, 28, 9, 9, 7, 3, '#3b5f8f', '#2f4a75')
  paint(c, p, (u, v, x, y) => {
    if (v < 0.3) return v < 0.12 ? '#2f4a75' : '#3f6ca3'
    if (v > 0.75) return '#f8fafc'
    return scale(x, y, 3) ? '#a7b6c9' : '#d6dee9'
  })
  gill(c, p, 0.22, '#64748b', 1)
  eye(c, 5, 6)
  c.line(2, 12, 6, 13, '#475569')
})

F('makrele', 46, 22, {}, (c) => {
  const p = P({ x0: 2, x1: 34, cy: 10, up: 7, dn: 7, peak: 0.36, end: 0.1 })
  fan(c, [14, 4], [[15, 0], [20, 0], [21, 4]], '#14534f', '#0d3b38')
  fan(c, [24, 5], [[25, 1], [29, 3], [28, 6]], '#14534f', '#0d3b38')
  tail(c, 32, 10, 12, 8, 5, '#1b6e68', '#14534f')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.58) return v > 0.8 ? '#f1f5f9' : '#cbd5e1'
    return Math.sin((x + y * 0.6) * 1.15 + Math.sin(y * 1.3)) > 0.35 ? '#0d3b38' : '#2aa198'
  })
  gill(c, p, 0.2, '#475569', 1)
  eye(c, 5, 7)
  c.line(2, 13, 7, 14, '#475569')
})

F('thunfisch', 60, 30, {}, (c) => {
  const p = P({ x0: 2, x1: 45, cy: 14, up: 11, dn: 11, peak: 0.34, hp: 0.6, end: 0.08 })
  fan(c, [16, 4], [[19, 0], [23, 1], [25, 4]], '#ca8a04', '#92400e')
  fan(c, [20, 24], [[23, 28], [26, 28], [28, 24]], '#ca8a04', '#92400e')
  tail(c, 44, 14, 13, 13, 6, '#1e3a8a', '#172554')
  paint(c, p, (u, v) => (v < 0.45 ? (v < 0.12 ? '#172554' : '#1e3a8a') : v < 0.55 ? '#94a3b8' : v > 0.8 ? '#f8fafc' : '#dbe3ed'))
  // Flössel zum Schwanz hin
  for (let x = 30; x < 44; x += 3) { c.poly([x, Math.round(p.top(x)), x + 2, Math.round(p.top(x)) - 2, x + 2, Math.round(p.top(x))], '#facc15'); c.poly([x, Math.round(p.bot(x)), x + 2, Math.round(p.bot(x)) + 2, x + 2, Math.round(p.bot(x))], '#facc15') }
  gill(c, p, 0.2, '#172554')
  fan(c, [14, 15], [[23, 18], [24, 16]], '#172554')
  eye(c, 7, 10)
  c.line(2, 16, 8, 17, '#172554')
})

F('schwertfisch', 72, 30, {}, (c) => {
  const p = P({ x0: 18, x1: 58, cy: 15, up: 8, dn: 8, peak: 0.3, end: 0.08 })
  c.poly([0, 14, 22, 12, 22, 16], '#94a3b8'); c.line(0, 14, 21, 13, '#e2e8f0')
  fan(c, [26, 9], [[28, 0], [33, 2], [40, 9]], '#312e81', '#1e1b4b')
  fan(c, [32, 22], [[32, 27], [38, 26], [42, 21]], '#312e81', '#1e1b4b')
  tail(c, 57, 15, 13, 14, 8, '#3730a3', '#1e1b4b')
  paint(c, p, (u, v, x) => {
    if (v > 0.68) return '#f1f5f9'
    if (v > 0.52) return '#818cf8'
    return v < 0.15 ? '#1e1b4b' : Math.floor(x / 5) % 2 ? '#3730a3' : '#433db0'
  })
  gill(c, p, 0.19, '#1e1b4b', 1)
  eye(c, 22, 11)
})

F('sturmhai', 70, 32, {}, (c) => {
  const p = P({ x0: 2, x1: 54, cy: 15, up: 8, dn: 8, peak: 0.38, hp: 0.7, end: 0.1 })
  fan(c, [22, 8], [[27, 0], [30, 1], [34, 8]], '#3e4c5e', '#2c3644')
  fan(c, [24, 22], [[24, 29], [28, 28], [33, 22]], '#3e4c5e', '#2c3644')
  c.poly([54, 13, 67, 0, 62, 13, 65, 24, 54, 17], '#475569')
  paint(c, p, (u, v) => (v > 0.58 ? (v > 0.8 ? '#f1f5f9' : '#dbe3ed') : v < 0.15 ? '#3e4c5e' : '#5f7186'))
  for (const x of [16, 18, 20]) c.vline(x, 14, 4, '#2c3644')
  // Blitzmuster, passt zum Gewitter
  for (const x of [30, 40]) { c.line(x + 2, 10, x, 13, '#fde047'); c.line(x, 13, x + 2, 13, '#fde047'); c.line(x + 2, 13, x, 16, '#fde047') }
  eye(c, 8, 11, { size: 2 })
  // Maul mit Zähnen
  c.line(3, 18, 12, 20, '#7f1d1d'); for (const x of [5, 7, 9, 11]) c.px(x, 19, '#f8fafc')
  sprk(c, 3, 3); sprk(c, 46, 27)
})

F('seeteufel', 50, 40, {}, (c) => {
  const p = P({ x0: 5, x1: 39, cy: 24, up: 13, dn: 13, peak: 0.3, hp: 0.42, end: 0.2 })
  tail(c, 37, 24, 10, 8, 2, '#3f2a2a', '#2a1b1b')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.66) return '#7d5a50'
    return v < 0.12 ? '#3f2a2a' : (x * 2 + y * 3) % 9 === 0 ? '#3f2a2a' : '#5b3f3a'
  })
  // Riesenmaul
  c.poly([4, 25, 25, 28, 21, 35, 7, 34], '#1a0f12')
  for (let x = 6; x < 23; x += 3) c.poly([x, 25 + (x - 4) * 0.14, x + 2, 25 + (x - 4) * 0.14, x + 1, 29], '#f8fafc')
  for (let x = 8; x < 21; x += 3) c.poly([x, 34, x + 2, 34, x + 1, 31], '#f8fafc')
  eye(c, 11, 17, { w: '#fde047' })
  c.line(9, 15, 15, 15, '#2a1b1b')
  // Angel mit Laterne
  c.line(15, 11, 12, 5, '#7d5a50'); c.line(12, 5, 6, 3, '#7d5a50'); c.line(6, 3, 4, 5, '#7d5a50')
  c.rect(2, 6, 4, 4, '#fde047'); c.rect(3, 7, 2, 2, '#fffbeb')
  c.px(1, 5, '#fef08a'); c.px(6, 5, '#fef08a'); c.px(1, 10, '#fef08a'); c.px(6, 10, '#fef08a')
  fan(c, [26, 26], [[28, 33], [33, 31], [33, 25]], '#3f2a2a', '#2a1b1b')
})

F('riesenkalmar', 64, 36, {}, (c) => {
  // Fangarme links, Mantel läuft nach rechts in eine Pfeilspitze aus
  const p = P({ x0: 18, x1: 62, cy: 17, up: 9, dn: 9, peak: 0.2, hp: 0.6, tp: 1.0, end: 0.03 })
  c.poly([36, 10, 50, 3, 61, 17, 50, 31, 36, 24], '#7f1d3f')
  c.poly([38, 11, 50, 5, 58, 15, 40, 15], '#a11d4a')
  for (let i = 0; i < 6; i++) {
    const y0 = 13 + i * 1.6, long = i === 1 || i === 4
    for (let x = long ? 1 : 7; x < 21; x++) {
      const t = (21 - x) / 20
      const y = Math.round(y0 + (i - 2.5) * t * 3.6 + (1 + t * 2) * Math.sin(x * 0.7 + i * 1.7))
      c.px(x, y, i % 2 ? '#7f1d3f' : '#a11d4a')
      if (t < 0.45) c.px(x, y + 1, i % 2 ? '#7f1d3f' : '#a11d4a')
      else if (x % 3 === 0) c.px(x, y + 1, '#fda4af')
    }
    if (long) { const yy = Math.round(y0 + (i - 2.5) * 3.6 + 3 * Math.sin(0.7 + i * 1.7)); c.rect(0, yy - 1, 3, 3, '#c2264f') }
  }
  paint(c, p, (u, v, x, y) => {
    const dot = (x * 3 + y * 7) % 13 === 0
    return dot ? '#7f1d3f' : v > 0.7 ? '#c2264f' : v < 0.16 ? '#a11d4a' : '#dc3a5e'
  })
  c.hline(22, 12, 14, '#fda4af')
  c.rect(21, 13, 5, 5, '#fef3c7'); c.rect(21, 14, 3, 4, INK); c.px(21, 14, '#ffffff')
})

F('miesmuschel', 36, 30, {}, (c) => {
  // Spiralgehäuse: große Windung zuerst, jede kleinere liegt darauf und wirft eine Naht
  const pk = '#f9a8d4', m = '#ec6fb0', L = '#fce7f3', D = '#b83b82'
  c.ellipse(21, 18, 10, 9, D); c.ellipse(20, 17, 9, 8, pk); c.ellipse(18, 21, 6, 3, m)
  const W = [[15, 11, 6.5], [10.5, 7.5, 4.8], [7, 4.5, 3.4], [4, 2.5, 2.4], [2, 1, 1.4]]
  for (const [x, y, r] of W) {
    c.ellipse(x, y, r, r, D); c.ellipse(x - 1, y - 1, r - 1, r - 1, pk)
    if (r > 2) { c.px(Math.round(x - r * 0.5), Math.round(y - r * 0.5), L); c.px(Math.round(x + r * 0.3), Math.round(y + r * 0.1), m) }
  }
  c.line(14, 14, 18, 11, L)
  c.ellipse(26, 18, 6, 8, D); c.ellipse(26, 18, 5, 7, '#fde7c8'); c.ellipse(27, 19, 3, 5, '#f4b98b'); c.ellipse(27, 20, 1, 3, '#c9744f')
  // Zugschnur
  c.line(24, 25, 22, 25, '#a16207'); c.ring(19, 25, 2, '#facc15')
})

F('schummelfisch', 52, 34, {}, (c) => {
  // ein Fisch mit Scherzbrille und Plastiknase
  const p = P({ x0: 6, x1: 40, cy: 17, up: 12, dn: 11, peak: 0.34, hp: 0.5, end: 0.18 })
  fan(c, [20, 6], [[24, 0], [30, 2], [33, 8]], '#6b7050', '#50553a')
  tail(c, 38, 17, 11, 11, 4, '#7d8360', '#5e6346')
  paint(c, p, (u, v, x, y) => (v > 0.68 ? '#c8ccae' : v < 0.13 ? '#6b7050' : scale(x, y) ? '#7d8360' : '#969b78'))
  gill(c, p, 0.34, '#50553a')
  c.ring(9, 13, 4, INK); c.ring(18, 13, 4, INK); c.hline(12, 12, 3, INK)
  c.circ(9, 13, 3, '#dbeafe'); c.circ(18, 13, 3, '#dbeafe')
  c.rect(8, 12, 2, 3, INK); c.rect(17, 12, 2, 3, INK)
  c.px(7, 11, '#ffffff'); c.px(16, 11, '#ffffff')
  c.rect(11, 16, 5, 4, '#fb7185'); c.rect(11, 16, 2, 1, '#fecdd3')
  c.line(4, 21, 9, 23, '#50553a')
})

F('dosensardine', 40, 20, {}, (c) => {
  // Hinten der aufgerollte Deckel, davor schaut die Sardine aus der Dose
  c.poly([24, 10, 28, 2, 38, 2, 38, 10], '#64748b')
  c.poly([26, 10, 29, 3, 37, 3, 37, 10], '#94a3b8')
  c.line(28, 1, 37, 1, '#e2e8f0'); c.line(28, 2, 26, 6, '#cbd5e1')
  const p = P({ x0: 1, x1: 27, cy: 6, up: 5, dn: 6, peak: 0.24, hp: 0.5, end: 0.45 })
  paint(c, p, (u, v, x, y) => {
    if (v < 0.42) return v < 0.18 ? '#1f3f73' : '#2f5f9e'
    if (v > 0.78) return '#ffffff'
    return scale(x, y, 3) ? '#b6c4d6' : '#e4eaf2'
  })
  fan(c, [13, 1], [[15, 0], [20, 0], [21, 2]], '#1f3f73', '#16305a')
  gill(c, p, 0.27, '#475569', 1)
  eye(c, 4, 3)
  c.line(1, 8, 5, 9, '#334155')
  // Dose: blanker Rand, rotes Etikett mit Fischchen
  c.rect(7, 11, 31, 7, '#b91c1c')
  c.hline(7, 10, 31, '#f8fafc'); c.hline(7, 11, 31, '#94a3b8')
  c.hline(7, 12, 31, '#ef4444'); c.hline(7, 16, 31, '#7f1d1d'); c.hline(7, 17, 31, '#64748b')
  c.vline(7, 12, 5, '#7f1d1d'); c.vline(37, 12, 5, '#7f1d1d')
  c.rect(16, 13, 8, 3, '#fde68a'); c.rect(24, 14, 1, 1, '#fde68a'); c.rect(25, 13, 2, 3, '#fde68a'); c.px(17, 14, '#7f1d1d')
  // Öl läuft über den Rand
  c.vline(10, 11, 3, '#fbbf24'); c.px(10, 14, '#fde68a')
})

F('kapitaensfisch', 48, 26, {}, (c) => {
  const p = P({ x0: 6, x1: 36, cy: 15, up: 8, dn: 8, peak: 0.32, hp: 0.5, end: 0.16 })
  fan(c, [20, 9], [[22, 5], [28, 5], [31, 9]], '#9a3412', '#7c2d12')
  fan(c, [22, 21], [[23, 24], [28, 24], [30, 20]], '#9a3412', '#7c2d12')
  tail(c, 34, 15, 11, 8, 3, '#c2410c', '#9a3412')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.68) return v > 0.86 ? '#fde7c7' : '#fed7aa'
    if (v < 0.16) return '#9a3412'
    return scale(x, y, 4) && u > 0.28 ? '#c2410c' : v < 0.42 ? '#ea580c' : '#fb923c'
  })
  gill(c, p, 0.24, '#7c2d12')
  fan(c, [18, 16], [[25, 20], [26, 16]], '#c2410c', '#7c2d12')
  // weißer Seemannsbart
  c.poly([7, 18, 14, 19, 14, 22, 12, 24, 11, 22, 9, 23, 8, 21], '#f1f5f9')
  c.hline(9, 22, 4, '#cbd5e1')
  eye(c, 10, 10)
  // Pfeife im Maul, Bauch hängt nach unten, oben raucht es
  c.line(8, 18, 4, 20, '#7c4a24')
  c.rect(0, 18, 4, 5, '#7c4a24'); c.rect(1, 21, 2, 2, '#5c3517'); c.hline(0, 18, 4, '#a0662f'); c.rect(1, 18, 2, 1, '#fb923c')
  for (const [x, y] of [[1, 16], [2, 14], [1, 12], [2, 10]]) c.px(x, y, '#cbd5e1')
  // Kapitänsmütze: weißer Deckel, blaues Band, schwarzer Schirm, goldenes Abzeichen
  c.poly([6, 2, 8, 0, 20, 0, 23, 3, 21, 6, 8, 6], '#f8fafc')
  c.poly([8, 5, 21, 5, 21, 6, 8, 6], '#cbd5e1')
  c.hline(9, 0, 10, '#ffffff')
  c.rect(8, 6, 13, 2, '#1e3a8a'); c.hline(8, 7, 13, '#172554')
  c.line(4, 9, 13, 8, INK); c.hline(5, 8, 5, '#334155')
  c.rect(11, 3, 3, 3, '#facc15'); c.px(12, 4, '#a16207'); c.hline(9, 6, 7, '#fde047')
})

F('ankerbarsch', 50, 28, {}, (c) => {
  // Kräftiger Barsch, vor dem Maul hängt ein rostiger Anker an der Kette
  const p = P({ x0: 13, x1: 38, cy: 12, up: 10, dn: 9, peak: 0.36, hp: 0.5, end: 0.14 })
  fan(c, [20, 4], [[21, 0], [23, 2], [25, 0], [27, 2], [29, 0], [31, 2], [33, 1], [35, 7]], '#3f6212', '#27400c')
  fan(c, [27, 19], [[28, 24], [33, 24], [34, 17]], '#ea580c', '#9a3412')
  tail(c, 36, 12, 11, 9, 2, '#ea580c', '#9a3412')
  paint(c, p, (u, v, x) => {
    if (v > 0.72) return v > 0.88 ? '#f3f4c8' : '#d9e29a'
    if (u > 0.3 && u < 0.92 && (x - 21) % 6 < 2) return v < 0.2 ? '#27400c' : '#3f6212'
    return v < 0.16 ? '#3f6212' : v < 0.5 ? '#65a30d' : '#84b82a'
  })
  gill(c, p, 0.28, '#27400c')
  fan(c, [24, 12], [[30, 16], [31, 12]], '#ea580c', '#9a3412')
  eye(c, 16, 8)
  c.line(13, 14, 17, 15, '#27400c')
  // Kette vom Maul zum Ankerring
  for (const [i, [x, y]] of [[12, 12], [11, 10], [10, 8], [9, 6], [8, 4]].entries()) c.rect(x, y, 2, 2, i % 2 ? '#78716c' : '#a8a29e')
  // Anker: Ring, Stock, Schaft, Arme mit Flunken
  const R = '#92400e', RL = '#c2702a', RD = '#5b2c10'
  c.ring(6, 3, 2, R)
  c.rect(5, 5, 3, 16, R); c.vline(5, 5, 16, RL); c.vline(7, 5, 16, RD)
  c.rect(1, 7, 11, 2, R); c.hline(1, 7, 11, RL); c.hline(1, 8, 11, RD)
  c.line(6, 23, 2, 20, R, 2); c.line(6, 23, 10, 20, R, 2); c.rect(5, 21, 3, 3, R)
  c.poly([0, 16, 4, 20, 0, 22], RL); c.poly([12, 16, 8, 20, 12, 22], R)
  for (const [x, y] of [[6, 11], [6, 16], [3, 22], [9, 22], [10, 7]]) c.px(x, y, RD)
  c.px(6, 14, RL)
})

F('rettungsrochen', 56, 32, {}, (c) => {
  // Von oben: Rochen in den Farben eines Rettungsrings. Kopf links, Flügelspitzen oben und unten, langer Schwanz rechts.
  const cx = 20, cy = 15, RIM = 40
  const hh = (x) => {
    const u = x + 0.5
    const wing = u < cx ? 15 * (u / cx) ** 1.25 : 15 * Math.max(0, (RIM - u) / (RIM - cx)) ** 0.8
    return Math.max(wing, u < 11 ? 5.5 * Math.sqrt(Math.min(1, u / 4)) : 0)
  }
  // Schwanz liegt unter dem Körper
  for (let x = RIM - 3; x < 54; x++) {
    const y = Math.round(14 + Math.sin((x - RIM) * 0.55) * 2)
    c.rect(x, y, 1, 2, Math.floor((x - RIM) / 3) % 2 ? '#f8fafc' : '#ef4444')
  }
  for (let x = 0; x < RIM; x++) {
    const H = hh(x)
    for (let y = 0; y < 30; y++) {
      const dy = y + 0.5 - cy, dx = x + 0.5 - cx
      if (Math.abs(dy) > H) continue
      const r = Math.hypot(dx * 0.9, dy)
      if (r < 4.6) continue
      const a = ((Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI / 2)) / (Math.PI / 2)
      const red = a > 0.26 && a < 0.74, low = dy > 4
      let col = red ? (low ? '#c81e1e' : '#ef4444') : (low ? '#cbd5e1' : '#f8fafc')
      if (r < 6) col = red ? '#991b1b' : '#94a3b8'
      if (Math.abs(dy) > H - 1.4 && x > 3) col = (x + y) % 4 < 2 ? '#d6a45e' : '#92602c' // Tau am Rand
      c.px(x, y, col)
    }
  }
  eye(c, 5, 10); eye(c, 5, 18)
  c.px(2, 14, '#64748b'); c.px(2, 16, '#64748b')
})

F('gummistiefel', 40, 28, {}, (c) => {
  // Alter gelber Gummistiefel, Spitze zeigt nach links wie die Köpfe der Fische
  const Y = '#d4a017', L = '#eeca4a', D = '#a16207', DD = '#713f12'
  c.poly([20, 3, 34, 3, 34, 22, 3, 22, 3, 19, 7, 16, 14, 14, 20, 12], Y)
  c.vline(23, 6, 9, L); c.vline(22, 6, 7, L)
  c.rect(31, 5, 3, 17, D)
  c.line(5, 19, 13, 16, L); c.line(4, 20, 7, 18, L)
  c.hline(4, 21, 30, D)
  // Falten am Knöchel, Risse und ein aufgeklebter Flicken
  c.line(20, 13, 28, 15, D); c.line(18, 16, 27, 18, D); c.line(25, 12, 30, 13, D)
  c.rect(25, 6, 5, 4, '#78716c'); c.rect(26, 7, 3, 2, '#a8a29e')
  c.line(9, 20, 12, 18, DD); c.line(12, 18, 13, 19, DD)
  // Oben der umgerollte Rand und die dunkle Öffnung
  c.rect(19, 2, 16, 3, L); c.hline(19, 4, 16, D); c.ellipse(27, 2, 7, 1, '#1c1208')
  // Sohle mit Profil
  c.rect(2, 22, 33, 2, '#292524'); for (let x = 3; x < 34; x += 3) c.px(x, 23, '#57534e')
  c.rect(23, 22, 2, 2, '#1c1917')
  // Seetang hängt über den Rand
  c.line(23, 1, 19, 3, '#15803d'); c.line(19, 3, 18, 11, '#15803d'); c.px(17, 6, '#22c55e'); c.px(19, 9, '#22c55e'); c.px(17, 10, '#22c55e')
  c.line(29, 1, 33, 3, '#16a34a'); c.line(33, 3, 35, 9, '#16a34a'); c.px(36, 6, '#22c55e'); c.px(34, 8, '#4ade80')
  c.line(26, 2, 26, 7, '#22c55e')
  // Tropfen
  drop(c, 12, 24); drop(c, 37, 12)
})

// ---------------------------------------------------------------- Boss
F('odfisch-boss', 100, 58, {}, (c) => {
  // Eigener getigerter Katerkopf auf einem Stachel-Fischleib.
  // Die Augen liegen dort, wo drawBoss in Phase 3 die roten Glutaugen aufmalt (x 12 und 25, y 25).
  const p = P({ x0: 22, x1: 82, cy: 33, up: 15, dn: 15, peak: 0.3, hp: 0.6, end: 0.14 })
  for (let x = 34; x < 74; x += 5) { const t = Math.round(p.top(x)); c.poly([x - 3, t + 1, x + 2, t - 8 + ((x * 3) % 4), x + 4, t + 1], '#334155') ; c.line(x + 2, t - 7 + ((x * 3) % 4), x, t, '#475569') }
  fan(c, [50, 44], [[48, 54], [56, 54], [64, 44]], '#334155', '#1e293b')
  tail(c, 80, 33, 17, 18, 7, '#475569', '#334155')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.66) return v > 0.86 ? '#cbd5e1' : '#e2e8f0'
    if (v < 0.12) return '#475569'
    return scale(x, y, 6) ? '#475569' : '#7286a0'
  })
  // Kampfnarben
  for (const [x, y] of [[50, 26], [54, 28], [58, 25]]) c.line(x, y, x + 3, y + 7, '#dc2626')
  // Kopf
  c.poly([2, 14, 8, 6, 12, 15, 26, 15, 32, 6, 36, 16, 37, 36, 28, 46, 10, 46, 2, 36], '#8d99ab')
  c.poly([5, 13, 8, 9, 10, 15], '#fda4af'); c.poly([30, 15, 32, 9, 34, 15], '#fda4af')
  // Tigerstreifen an Stirn und Wange
  for (const x of [15, 19, 23]) c.vline(x, 15, 6, '#475569')
  c.hline(2, 30, 5, '#475569'); c.hline(32, 30, 5, '#475569'); c.hline(3, 34, 4, '#475569'); c.hline(32, 34, 4, '#475569')
  // Schnauze, Augen, Fänge
  c.ellipse(19, 38, 11, 7, '#e2e8f0')
  c.rect(9, 23, 7, 6, '#fef08a'); c.rect(22, 23, 7, 6, '#fef08a')
  c.rect(11, 23, 3, 6, INK); c.rect(24, 23, 3, 6, INK)
  c.line(8, 21, 16, 24, INK); c.line(30, 21, 22, 24, INK)
  c.rect(17, 32, 4, 3, '#fb7185')
  c.poly([11, 37, 27, 37, 24, 44, 14, 44], '#7f1d1d')
  c.poly([12, 37, 15, 37, 14, 42], '#f8fafc'); c.poly([23, 37, 26, 37, 24, 42], '#f8fafc')
  // Krone
  c.poly([9, 7, 11, 0, 15, 5, 19, 0, 23, 5, 27, 0, 29, 7, 29, 12, 9, 12], '#facc15')
  c.hline(9, 11, 21, '#b45309'); c.rect(18, 7, 3, 3, '#dc2626'); c.px(12, 8, '#38bdf8'); c.px(26, 8, '#38bdf8')
})

// ---------------------------------------------------------------- Lavasee (Kopf rechts, außer Kraterwächter)
F('lava-aschebarsch', 56, 32, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 42, cy: 15, up: 11, dn: 11, peak: 0.36, hp: 0.55, end: 0.14 })
  fan(c, [14, 5], [[20, 0], [27, 0], [31, 6]], '#ea580c', '#9a3412')
  fan(c, [20, 25], [[21, 29], [27, 29], [30, 24]], '#ea580c', '#9a3412')
  tail(c, 40, 15, 13, 13, 5, '#f97316', '#c2410c')
  paint(c, p, (u, v, x) => {
    const bar = u > 0.28 && u < 0.86 && Math.floor((x - 12) / 7) % 2 === 0 && (x - 12) % 7 < 3
    if (v > 0.74) return '#dbe0e6'
    if (bar) return v < 0.2 ? '#374151' : '#4b5563'
    return B(v, 0.14, '#6b7280', 0.5, '#9ca3af', '#b6bcc5')
  })
  gill(c, p, 0.24, '#374151')
  fan(c, [14, 16], [[21, 21], [23, 17]], '#f97316', '#c2410c')
  eye(c, 6, 11)
  c.line(2, 18, 7, 19, '#374151')
})

F('lava-basaltbutt', 68, 36, { flip: true }, (c) => {
  // Plattfisch von oben: dunkle Basaltplatte mit großen Säulenflächen, nur der Rand ist heiß
  const cx = 27, cy = 17, rx = 26, ry = 16
  tail(c, 50, 17, 15, 12, 3, '#44403c', '#f97316')
  const cells = []
  for (let r = -1; r < 6; r++) for (let q = -1; q < 7; q++) cells.push([q * 11 + (r % 2 ? 5.5 : 0) + 1, r * 8 + 2, ((q * 7 + r * 13 + 40) % 4 + 4) % 4])
  for (let y = 0; y < 34; y++) for (let x = 0; x < 54; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, e = (Math.abs(dx) / rx) ** 1.8 + (Math.abs(dy) / ry) ** 1.8
    if (e > 1) continue
    if (e > 0.72) { // Flossensaum läuft als heißer Rand einmal herum
      const ray = Math.floor((Math.atan2(dy, dx) + Math.PI) * 11) % 2 === 0
      if (e > 0.93 && !ray) continue
      c.px(x, y, e > 0.86 ? (ray ? '#fde047' : '#fb923c') : ray ? '#f97316' : '#c2410c')
      continue
    }
    const near = cells.map(([gx, gy, id]) => [Math.hypot(x + 0.5 - gx, (y + 0.5 - gy) * 1.2), gy, id]).sort((a, b) => a[0] - b[0])
    const [d1, gy, id] = near[0]
    if (near[1][0] - d1 < 0.9) { c.px(x, y, e > 0.5 ? '#ea580c' : '#18181b'); continue }
    const lift = y + 0.5 - gy
    c.px(x, y, lift < -3 ? '#78716c' : lift > 3 ? '#292524' : ['#44403c', '#3f3f46', '#57534e', '#4b4640'][id])
  }
  // beide Augen auf einer Seite, schiefes Maul
  c.circ(10, 10, 3, '#292524'); eye(c, 9, 9, { w: '#fef08a', p: INK })
  c.circ(15, 16, 3, '#292524'); eye(c, 14, 15, { w: '#fef08a', p: INK })
  c.line(3, 20, 9, 24, INK); c.line(4, 20, 9, 23, '#fb923c')
  sprk(c, 59, 3); sprk(c, 62, 30)
})

F('lava-bimsfisch', 56, 32, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 42, cy: 15, up: 12, dn: 12, peak: 0.4, hp: 0.5, end: 0.34 })
  fan(c, [20, 4], [[23, 0], [28, 0], [32, 5]], '#a8a29e', '#78716c')
  tail(c, 40, 15, 12, 11, 1, '#a8a29e', '#78716c')
  paint(c, p, (u, v) => (v > 0.76 ? '#a8a29e' : v < 0.16 ? '#d6d3d1' : '#e7e5e4'))
  // Bims hat Blasenlöcher, Oberkante im Schatten
  for (const [x, y, r] of [[13, 8, 1], [21, 7, 2], [30, 10, 1], [16, 15, 2], [25, 15, 1], [34, 16, 2], [11, 21, 1], [21, 21, 2], [30, 21, 1]]) {
    c.rect(x, y, r + 1, r + 1, '#a8a29e'); c.hline(x, y, r + 1, '#78716c')
  }
  eye(c, 6, 11)
  c.line(2, 18, 7, 19, '#78716c')
})

F('lava-bratfisch', 56, 30, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 42, cy: 18, up: 9, dn: 9, peak: 0.34, hp: 0.5, end: 0.15 })
  fan(c, [16, 11], [[19, 8], [27, 8], [31, 12]], '#92400e', '#451a03')
  tail(c, 40, 18, 13, 9, 3, '#92400e', '#451a03')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.8) return '#fcd34d'
    if (v < 0.1) return '#92400e'
    if (u > 0.22 && u < 0.97 && (((x - y * 0.7) % 9) + 9) % 9 < 2) return '#451a03' // Grillstreifen
    return v < 0.34 ? '#b45309' : v < 0.6 ? '#d97706' : '#f59e0b'
  })
  // knusprige Stellen auf der Kruste
  for (const [x, y] of [[15, 21], [23, 13], [29, 22], [34, 16], [20, 18]]) c.px(x, y, '#fde68a')
  gill(c, p, 0.2, '#78350f')
  // gar: helles, trübes Auge und offener Mund
    c.rect(6, 13, 5, 5, '#451a03'); c.rect(7, 14, 3, 3, '#fef3c7'); c.px(8, 15, '#78350f')
  c.line(2, 21, 7, 22, '#451a03')
  // Dampf steigt auf
  for (const [bx, n] of [[14, 7], [24, 7], [34, 8]]) for (let i = 0; i < n; i++) c.px(bx + Math.round(Math.sin(i * 1.1 + bx) * 1.4), i, i % 3 === 0 ? '#ffffff' : '#cbd5e1')
})

F('lava-funkenforelle', 64, 32, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 48, cy: 15, up: 11, dn: 11, peak: 0.38, hp: 0.55, end: 0.14 })
  fan(c, [18, 5], [[22, 0], [30, 0], [36, 6]], '#991b1b', '#6d1414')
  fan(c, [24, 25], [[25, 29], [30, 29], [33, 24]], '#991b1b', '#6d1414')
  tail(c, 46, 15, 14, 13, 6, '#991b1b', '#6d1414')
  paint(c, p, (u, v) => {
    if (v < 0.42) return v < 0.14 ? '#991b1b' : '#b91c1c'
    if (v < 0.56) return '#fb7185'
    if (v < 0.66) return '#fecdd3'
    return v < 0.84 ? '#fda4af' : '#ffe4e6'
  })
  for (const [x, y] of [[14, 8], [22, 6], [29, 9], [36, 8], [18, 11], [26, 12], [41, 12]]) c.rect(x, y, 2, 2, '#fde047')
  gill(c, p, 0.2, '#6d1414')
  eye(c, 6, 11)
  c.line(2, 18, 7, 19, '#7f1d1d')
  sprk(c, 4, 3); sprk(c, 50, 3); sprk(c, 54, 27)
})

F('lava-glutgrundel', 48, 28, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 36, cy: 13, up: 10, dn: 10, peak: 0.3, hp: 0.45, end: 0.26 })
  fan(c, [13, 4], [[16, 0], [21, 0], [25, 5]], '#c2410c', '#7c2d12')
  fan(c, [12, 23], [[13, 25], [20, 25], [21, 22]], '#c2410c', '#7c2d12')
  tail(c, 34, 13, 11, 10, 1, '#c2410c', '#7c2d12')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.68) return v > 0.88 ? '#fdba74' : '#fed7aa'
    if ((x * 5 + y * 3) % 17 === 0 && x > 9) return '#7c2d12'
    return v < 0.14 ? '#c2410c' : v < 0.45 ? '#ea580c' : '#fb923c'
  })
  gill(c, p, 0.22, '#9a3412', 1)
  eye(c, 5, 8)
  c.line(2, 15, 7, 16, '#7c2d12')
})

F('lava-kohlestint', 46, 24, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 33, cy: 11, up: 8, dn: 8, peak: 0.34, hp: 0.55, end: 0.14 })
  fan(c, [13, 5], [[16, 1], [22, 1], [25, 5]], '#3f3f46', '#18181b')
  fan(c, [16, 18], [[17, 21], [22, 21], [24, 17]], '#3f3f46', '#18181b')
  tail(c, 31, 11, 12, 8, 3, '#52525b', '#27272a')
  // Holzkohle: gebrochene Flächen statt Schuppen, oben hell wie Asche
  paint(c, p, (u, v, x, y) => {
    if (v < 0.14) return '#71717a'
    const f = (Math.floor((x + y) / 5) * 3 + Math.floor((x - y) / 6) * 5 + 50) % 4
    return v > 0.74 ? '#27272a' : ['#3f3f46', '#52525b', '#3f3f46', '#63636b'][f]
  })
  // Glutrisse: außen Orange, im Kern Gelb
  for (const pts of [[[12, 5], [15, 9], [13, 13], [16, 17]], [[21, 5], [19, 9], [23, 12], [21, 17]], [[28, 8], [26, 11], [29, 14]]]) {
    for (let i = 0; i + 1 < pts.length; i++) c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#f97316')
    for (const [x, y] of pts.slice(1, -1)) c.px(x, y, '#fde047')
  }
  c.px(42, 4, '#f97316'); c.px(42, 18, '#f97316'); c.px(21, 1, '#f97316')
  eye(c, 5, 8, { w: '#fef08a', p: INK })
  c.line(2, 14, 6, 15, '#f97316')
})

F('lava-kraterwaechter', 92, 52, {}, (c) => {
  // Kopf links wie im Original; gepanzert, Glut zwischen den Platten
  const p = P({ x0: 3, x1: 70, cy: 26, up: 17, dn: 17, peak: 0.28, hp: 0.5, tp: 0.9, end: 0.2 })
  for (let x = 20; x < 58; x += 6) { const t = Math.round(p.top(x)); c.poly([x - 3, t + 1, x + 1, t - 8, x + 3, t + 1], '#44403c'); c.line(x + 1, t - 7, x, t, '#78716c') }
  fan(c, [36, 42], [[34, 49], [44, 49], [52, 41]], '#44403c', '#292524')
  tail(c, 68, 26, 19, 21, 8, '#57534e', '#292524')
  paint(c, p, (u, v, x, y) => {
    const seam = u > 0.2 && u < 0.97 && (x - 16) % 9 === 0
    if (seam) return (y % 4 === 0) ? '#fde047' : '#ea580c'
    if (v > 0.8) return '#292524'
    if (v < 0.13) return '#78716c'
    return (x - 16) % 9 === 1 ? '#78716c' : v > 0.6 ? '#44403c' : '#57534e'
  })
  // Glut unter dem Bauchpanzer
  for (const [x, w] of [[12, 12], [32, 9], [50, 8]]) { c.hline(x, Math.round(p.bot(x + w / 2)) - 2, w, '#fb923c'); c.hline(x + 2, Math.round(p.bot(x + w / 2)) - 3, w - 5, '#fde047') }
  gill(c, p, 0.18, '#292524', 2)
  c.rect(9, 18, 7, 7, '#292524'); c.rect(10, 19, 5, 5, '#fde047'); c.rect(11, 20, 2, 3, INK)
  c.line(7, 16, 17, 18, '#292524', 2)
  c.line(3, 31, 15, 33, '#292524')
  for (const x of [5, 8, 11, 14]) c.px(x, 32, '#fdba74')
})

F('lava-kristallwels', 76, 40, { flip: true }, (c) => {
  const p = P({ x0: 4, x1: 58, cy: 25, up: 10, dn: 11, peak: 0.24, hp: 0.5, end: 0.2 })
  // Kristalle: je eine helle und eine dunkle Facette
  for (const [x, h, w] of [[16, 11, 3], [23, 17, 4], [31, 20, 4], [39, 15, 4], [46, 10, 3]]) {
    const t = Math.round(p.top(x + w)) + 1
    c.poly([x, t, x + w, t - h, x + w * 2, t], '#22d3ee'); c.poly([x + w, t, x + w, t - h, x + w * 2, t], '#0e7490'); c.line(x + 1, t - 1, x + w - 1, t - h + 2, '#cffafe')
  }
  tail(c, 56, 25, 15, 11, 2, '#0e7490', '#155e75')
  paint(c, p, (u, v) => (v > 0.72 ? (v > 0.9 ? '#a5f3fc' : '#cffafe') : v < 0.14 ? '#155e75' : v < 0.45 ? '#0e7490' : '#0891b2'))
  gill(c, p, 0.2, '#155e75')
  eye(c, 9, 20)
  c.line(4, 28, 11, 29, '#155e75')
  c.line(6, 29, 1, 34, '#67e8f9'); c.line(5, 26, 0, 24, '#67e8f9'); c.line(8, 30, 6, 36, '#0e7490')
  fan(c, [21, 33], [[20, 37], [27, 37], [30, 32]], '#0e7490', '#155e75')
})

F('lava-lavadrache', 96, 52, { flip: true }, (c) => {
  // Glühender Schlangenleib in zwei Wellen, Kopf vorne mit Hörnern
  const yAt = (x) => 25 + 8 * Math.sin((x - 8) / 11)
  const r = (x) => 7.5 - 4.5 * ((x - 14) / 66)
  for (let x = 22; x < 76; x += 7) { const t = Math.round(yAt(x) - r(x)); c.poly([x - 2, t + 1, x + 1, t - 6, x + 3, t + 1], '#facc15'); c.line(x + 1, t - 5, x + 1, t, '#b45309') }
  for (let x = 14; x < 80; x++) {
    const m = yAt(x), R = r(x)
    for (let y = Math.floor(m - R); y <= m + R; y++) {
      const v = (y + 0.5 - (m - R)) / (2 * R)
      if (v < 0 || v > 1) continue
      c.px(x, y, v > 0.72 ? (x % 5 === 0 ? '#ea580c' : '#fdba74') : v < 0.16 ? '#7f1d1d' : (x + y) % 7 === 0 ? '#7f1d1d' : v < 0.45 ? '#b91c1c' : '#dc2626')
    }
  }
  tail(c, 79, Math.round(yAt(79)), 14, 9, 3, '#ea580c', '#9a3412')
  c.poly([0, 26, 7, 19, 18, 17, 22, 24, 21, 34, 9, 34, 0, 31], '#dc2626')
  c.poly([0, 26, 7, 19, 18, 17, 19, 21, 8, 23], '#b91c1c')
  c.poly([0, 28, 13, 29, 12, 32, 0, 31], '#450a0a')
  for (const x of [1, 4, 7, 10]) { c.px(x, 29, '#f8fafc'); c.px(x + 1, 31, '#f8fafc') }
  c.rect(1, 33, 13, 2, '#fdba74')
  c.line(15, 17, 22, 8, '#fde68a'); c.line(18, 18, 26, 11, '#fde68a'); c.line(16, 16, 21, 10, '#b45309')
  c.rect(10, 21, 4, 4, '#fde047'); c.rect(10, 22, 2, 3, INK)
  c.px(2, 22, '#fb923c'); c.px(1, 19, '#fde047'); c.px(3, 16, '#fb923c')
})

F('lava-magmakarpfen', 72, 40, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 54, cy: 20, up: 15, dn: 15, peak: 0.4, hp: 0.5, end: 0.12 })
  fan(c, [18, 6], [[26, 0], [32, 0], [40, 7]], '#ea580c', '#9a3412')
  fan(c, [24, 35], [[28, 37], [33, 37], [36, 34]], '#ea580c', '#9a3412')
  tail(c, 52, 20, 17, 18, 7, '#ea580c', '#9a3412')
  paint(c, p, (u, v) => (v < 0.45 ? (v < 0.1 ? '#57534e' : '#292524') : v < 0.52 ? '#1c1917' : v > 0.88 ? '#292524' : '#44403c'))
  // Risse: von Platte zu Platte verbunden, nicht gestreut
  const cr = [[14, 9, 21, 13], [21, 13, 19, 18], [21, 13, 29, 11], [29, 11, 35, 15], [35, 15, 33, 21], [35, 15, 43, 14], [17, 24, 25, 27], [25, 27, 33, 26], [25, 27, 24, 31], [38, 25, 45, 22]]
  for (const [a, b, d, e] of cr) c.line(a, b, d, e, '#ea580c')
  for (const [x, y] of [[21, 13], [29, 11], [35, 15], [25, 27], [33, 21]]) c.rect(x, y, 2, 2, '#fde047')
  eye(c, 7, 15, { w: '#fde047' })
  c.rect(1, 22, 4, 3, '#fb923c'); c.hline(1, 23, 4, '#7c2d12')
})

F('lava-mitternachtsfunke', 52, 32, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 38, cy: 16, up: 11, dn: 11, peak: 0.4, hp: 0.55, end: 0.16 })
  fan(c, [13, 6], [[19, 0], [24, 0], [28, 7]], '#581c87', '#3b0764')
  fan(c, [16, 26], [[20, 29], [25, 29], [27, 25]], '#581c87', '#3b0764')
  tail(c, 36, 16, 12, 13, 4, '#6b21a8', '#3b0764')
  paint(c, p, (u, v) => (v < 0.14 ? '#1e1b6b' : v > 0.8 ? '#1e1b6b' : v < 0.5 ? '#312e9e' : '#3a38c0'))
  sprk(c, 19, 15, '#fde047', '#ffffff')
  for (const [x, y] of [[11, 10], [15, 21], [25, 9], [28, 19], [32, 14], [23, 23]]) c.px(x, y, '#fde047')
  eye(c, 6, 12)
  c.line(2, 19, 6, 20, '#1e1b6b')
  sprk(c, 3, 3); sprk(c, 44, 2); sprk(c, 47, 28)
})

F('lava-obsidianhecht', 80, 28, { flip: true }, (c) => {
  const p = P({ x0: 1, x1: 64, cy: 13, up: 7, dn: 7, peak: 0.34, hp: 0.85, end: 0.12 })
  fan(c, [36, 7], [[41, 1], [46, 2], [50, 7]], '#312e81', '#1e1b4b')
  fan(c, [40, 19], [[44, 24], [48, 24], [50, 19]], '#312e81', '#1e1b4b')
  tail(c, 62, 13, 15, 10, 4, '#312e81', '#1e1b4b')
  paint(c, p, (u, v) => (v < 0.3 ? (v < 0.14 ? '#4338ca' : '#1e1b4b') : v > 0.76 ? '#312e81' : '#17153b'))
  // Glasglanz in einer Linie, wie auf poliertem Obsidian
  for (let x = 12; x < 60; x += 4) { c.px(x, Math.round(p.top(x)) + 3, x % 8 === 0 ? '#ffffff' : '#a5b4fc') }
  c.line(1, 14, 12, 14, '#4338ca')
  for (const x of [3, 6, 9]) c.px(x, 15, '#e0e7ff')
  eye(c, 11, 9, { w: '#e0e7ff' })
})

F('lava-phoenixfisch', 92, 52, { flip: true }, (c) => {
  const p = P({ x0: 4, x1: 60, cy: 26, up: 14, dn: 14, peak: 0.36, hp: 0.55, end: 0.1 })
  // Federn statt Flossen: Stufen aus Gold, Orange, Rot
  const plume = (x, y, a, b, col) => c.poly([x, y, x + a, y + b, x + a + 3, y + b + 2, x + 4, y + 2], col)
  for (const [x, y, a, b, col] of [[22, 15, 3, -14, '#fde047'], [27, 14, 7, -14, '#facc15'], [32, 15, 11, -12, '#fb923c'], [37, 17, 13, -9, '#ea580c']]) plume(x, y, a, b, col)
  for (const [x, y, a, b, col] of [[26, 36, 4, 12, '#fb923c'], [32, 36, 9, 10, '#ea580c']]) plume(x, y, a, b, col)
  for (let i = -3; i <= 3; i++) {
    const col = ['#fde047', '#fb923c', '#ea580c', '#dc2626'][Math.abs(i)]
    c.line(58, 26 + i, 88 - Math.abs(i) * 2, 26 + i * 7, col, 2)
    c.px(88 - Math.abs(i) * 2, 26 + i * 7, '#fde047')
  }
  paint(c, p, (u, v) => {
    if (v < 0.14) return '#b91c1c'
    if (v < 0.42) return '#dc2626'
    if (v < 0.5) return '#fde047'
    if (v < 0.72) return '#f97316'
    return v > 0.88 ? '#fed7aa' : '#fdba74'
  })
  for (let x = 16; x < 54; x += 5) c.px(x, Math.round(p.top(x) + (p.bot(x) - p.top(x)) * 0.61), '#fffbeb')
  gill(c, p, 0.2, '#991b1b', 2)
  eye(c, 10, 20)
  c.poly([1, 27, 8, 25, 8, 30], '#facc15'); c.line(1, 27, 8, 28, '#92400e')
  sprk(c, 3, 8); sprk(c, 12, 44); sprk(c, 52, 46, '#fb923c')
})

F('lava-russaal', 80, 24, { flip: true }, (c) => {
  const yAt = (x) => 10 + 4 * Math.sin((x - 4) / 8.5)
  const R = (x) => (x < 8 ? 2.5 + (x - 2) * 0.55 : 5.5 - 4 * ((x - 8) / 64))
  for (let x = 2; x < 72; x++) {
    const m = yAt(x), r = R(x)
    for (let y = Math.floor(m - r); y <= m + r; y++) {
      const v = (y + 0.5 - (m - r)) / (2 * r)
      if (v < 0 || v > 1) continue
      c.px(x, y, v < 0.25 ? '#57534e' : v > 0.75 ? '#1c1917' : '#292524')
    }
  }
  // Rückenflossensaum und Glutpunkte entlang der Seitenlinie
  for (let x = 16; x < 72; x += 2) c.px(x, Math.round(yAt(x) - R(x)) - 1, '#44403c')
  for (let x = 12; x < 68; x += 7) { c.rect(x, Math.round(yAt(x)), 2, 1, x % 2 ? '#fb923c' : '#ea580c'); c.px(x + 1, Math.round(yAt(x)), '#fde047') }
  // Rußwolke am Schwanz
  for (const [x, y] of [[73, 5], [75, 8], [72, 2], [76, 3], [74, 11]]) c.rect(x, y, 2, 2, '#44403c')
  c.rect(5, 7, 3, 3, '#fdba74'); c.rect(5, 8, 2, 2, INK)
  c.line(2, 12, 7, 13, '#1c1917')
})

F('lava-salamanderfisch', 80, 32, { flip: true }, (c) => {
  const p = P({ x0: 2, x1: 66, cy: 13, up: 7, dn: 7, peak: 0.16, hp: 0.5, tp: 0.8, end: 0.1 })
  // Vier kurze Beinchen unter dem Leib
  for (const x of [15, 22, 44, 51]) { c.poly([x, 18, x + 4, 18, x + 1, 26], '#292524'); c.hline(x - 2, 26, 5, '#57534e') }
  c.poly([62, 13, 77, 9, 76, 15, 62, 16], '#292524')
  for (let x = 12; x < 66; x += 5) { const t = Math.round(p.top(x)); c.poly([x, t, x + 2, t - 3, x + 4, t], '#44403c') }
  paint(c, p, (u, v) => (v < 0.2 ? '#57534e' : v > 0.75 ? '#fb923c' : v > 0.62 ? '#c2410c' : '#292524'))
  for (const [x, y] of [[13, 9], [21, 12], [28, 9], [36, 12], [44, 9], [52, 11], [59, 12]]) { c.rect(x, y, 3, 2, '#ea580c'); c.px(x + 1, y, '#fde047') }
  c.rect(6, 8, 3, 3, '#fde047'); c.rect(6, 9, 2, 2, INK)
  c.line(2, 15, 9, 15, '#1c1917')
})

F('lava-schlacke', 44, 28, {}, (c) => {
  // Klumpen, der noch glüht: Fließkante oben, Risse in der Mitte
  c.poly([1, 12, 5, 6, 10, 3, 18, 1, 28, 2, 36, 5, 41, 11, 41, 19, 37, 25, 25, 25, 11, 25, 3, 21], '#44403c')
  c.poly([2, 12, 6, 7, 11, 4, 18, 2, 28, 3, 35, 6, 39, 11, 30, 10, 20, 9, 9, 12], '#57534e')
  c.line(7, 7, 18, 3, '#78716c'); c.px(28, 4, '#78716c'); c.rect(32, 8, 2, 2, '#a8a29e')
  for (const [x, y, w] of [[6, 21, 9], [24, 22, 12]]) c.hline(x, y, w, '#292524')
  const cr = [[8, 15, 13, 13], [13, 13, 16, 17], [16, 17, 22, 14], [22, 14, 25, 18], [25, 18, 33, 15], [33, 15, 37, 16]]
  for (const [a, b, d, e] of cr) { c.line(a, b, d, e, '#ea580c'); c.line(a, b + 1, d, e + 1, '#9a3412') }
  for (const [x, y] of [[13, 13], [22, 14], [25, 17]]) c.rect(x, y, 2, 2, '#fde047')
})

F('lava-schwefelkugel', 52, 44, { flip: true }, (c) => {
  // Kugelfisch aus Schwefel: Stacheln rundum, Bauch heller
  const cx = 21, cy = 21, R = 16
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2
    c.line(cx + Math.cos(a) * R, cy + Math.sin(a) * R, cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4), '#a16207')
  }
  tail(c, 36, 21, 12, 9, 2, '#ca8a04', '#92400e')
  c.circ(cx, cy, R, '#ca8a04')
  c.circ(cx - 1, cy - 1, R - 1, '#facc15')
  for (let y = 27; y < 38; y++) for (let x = 4; x < 38; x++) if (Math.hypot(x - cx, y - cy) < R - 1) c.px(x, y, y > 34 ? '#fde68a' : '#fef08a')
  c.rect(11, 9, 8, 2, '#fef9c3')
  // Schwefelkristalle auf der Haut
  for (const [x, y] of [[23, 9], [30, 14], [27, 21], [32, 24], [20, 27], [28, 31]]) c.rect(x, y, 2, 2, '#a3a30f')
  c.rect(10, 15, 6, 6, '#f8fafc'); c.rect(10, 17, 4, 4, INK); c.px(10, 17, '#ffffff')
  c.rect(6, 25, 7, 3, '#92400e'); c.hline(7, 26, 5, '#451a03')
})

F('lava-streichholzfisch', 48, 20, { flip: true }, (c) => {
  // Hölzchen als Körper
  tail(c, 37, 12, 9, 5, 2, '#d9a75f', '#a8743a')
  c.rect(11, 10, 28, 4, '#e0b070'); c.hline(11, 10, 28, '#f2d19b'); c.hline(11, 13, 28, '#b9854a')
  for (const [x, y, n] of [[18, 11, 5], [27, 12, 4], [33, 11, 3]]) c.hline(x, y, n, '#c4935a')
  fan(c, [22, 10], [[24, 7], [28, 7], [30, 10]], '#d9a75f', '#a8743a')
  fan(c, [23, 14], [[24, 17], [28, 17], [29, 14]], '#d9a75f', '#a8743a')
  // angekohlter Übergang
  c.rect(12, 10, 3, 4, '#44403c'); c.px(15, 10, '#44403c'); c.px(15, 13, '#44403c'); c.px(16, 11, '#78716c')
  // Zündkopf
  c.ellipse(7, 12, 6, 5, '#dc2626')
  c.line(3, 9, 7, 8, '#f87171'); c.hline(3, 16, 7, '#7f1d1d'); c.line(10, 16, 12, 14, '#7f1d1d')
  eye(c, 4, 10)
  c.line(1, 14, 4, 15, '#7f1d1d')
  // Flamme weht nach hinten
  c.poly([2, 9, 3, 5, 6, 4, 7, 1, 9, 3, 12, 0, 13, 4, 15, 3, 14, 7, 12, 9], '#f97316')
  c.poly([4, 9, 5, 6, 8, 5, 9, 3, 11, 5, 12, 3, 12, 7, 11, 9], '#fde047')
  c.poly([6, 9, 7, 7, 9, 6, 10, 7, 10, 9], '#fffbeb')
  c.px(17, 2, '#fb923c'); c.px(20, 5, '#fde047')
})

F('lava-verkohlte-angel', 44, 28, {}, (c) => {
  // Griff unten links, Rute schräg nach oben, an der Bruchstelle glüht es noch
  const A = '#57534e', AL = '#8a8580', AD = '#1c1917'
  c.line(1, 25, 12, 17, A, 3); c.line(2, 23, 11, 17, AL)
  for (const [x, y] of [[4, 23], [8, 20]]) c.line(x, y, x + 1, y + 2, AD)
  c.line(12, 17, 31, 5, A, 2); c.line(14, 15, 30, 5, AL)
  for (const [x, y] of [[18, 12], [23, 9], [27, 7]]) { c.px(x, y, '#f97316'); c.px(x + 1, y, '#7c2d12') }
  // Bruch: Splitter und Glut
  c.line(31, 5, 34, 1, A); c.line(31, 5, 35, 4, AL); c.line(30, 4, 31, 1, A)
  c.px(32, 3, '#fde047'); c.px(33, 4, '#fb923c'); c.px(31, 3, '#f97316')
  // abgebrochene Spitze baumelt an der Schnur
  c.line(34, 3, 37, 7, '#d6d3d1')
  c.line(37, 7, 41, 18, A, 2); c.line(37, 8, 40, 16, AL); c.px(39, 12, '#f97316')
  // geschmolzene Rolle: oben noch rund, unten zerlaufen
  c.circ(14, 17, 4, '#6b7280'); c.circ(14, 17, 2, '#9ca3af'); c.px(14, 17, '#374151'); c.px(13, 15, '#e5e7eb')
  c.rect(10, 20, 9, 2, '#6b7280'); c.hline(10, 20, 9, '#9ca3af')
  c.vline(11, 21, 4, '#6b7280'); c.px(11, 25, '#e5e7eb')
  c.vline(14, 21, 3, '#9ca3af'); c.px(14, 24, '#fb923c')
  c.vline(17, 21, 5, '#6b7280'); c.px(17, 25, '#e5e7eb')
  // verschmorte Schnur kräuselt sich aus der Rolle
  c.line(12, 13, 9, 10, '#d6d3d1'); c.line(9, 10, 11, 7, '#a8a29e'); c.line(11, 7, 8, 5, '#d6d3d1')
})

// ---------------------------------------------------------------- Lavasee-Kreaturen
F('kreatur-aschekrabbe', 34, 20, {}, (c) => {
  for (const s of [0, 1]) {
    const X = (x) => (s ? 31 - x : x)
    for (const [x, d] of [[8, 0], [10, 1], [12, 2]]) { c.line(X(x), 12, X(x - 3), 15 + d, '#44403c'); c.line(X(x - 3), 15 + d, X(x - 3), 17, '#292524') }
    // Schere: Oberteil, Unterteil, Glutspalt dazwischen
    c.poly([X(0), 2, X(3), 0, X(6), 1, X(7), 5, X(6), 8, X(2), 8, X(0), 6], '#ea580c')
    c.poly([X(0), 2, X(3), 0, X(6), 1, X(6), 3, X(2), 3], '#fb923c')
    c.line(X(0), 4, X(4), 5, '#7c2d12')
    c.line(X(6), 8, X(8), 11, '#c2410c')
    // Stielauge
    c.vline(X(13), 2, 5, '#44403c'); c.rect(s ? 17 : 12, 0, 3, 3, '#fde047'); c.px(s ? 18 : 13, 1, INK)
  }
  c.poly([6, 10, 11, 6, 20, 6, 25, 10, 24, 14, 21, 16, 10, 16, 7, 14], '#78716c')
  c.poly([9, 9, 12, 7, 19, 7, 22, 9, 19, 11, 12, 11], '#d6d3d1')
  for (const [x, y] of [[12, 9], [16, 8], [19, 9]]) c.px(x, y, '#a8a29e')
  c.hline(11, 13, 10, '#ea580c'); c.hline(13, 14, 6, '#fde047')
})

F('kreatur-basaltgolem', 38, 36, {}, (c) => {
  // Säulen aus Basalt, die Fugen glühen
  c.rect(1, 8, 7, 18, '#44403c'); c.rect(28, 8, 7, 18, '#44403c')
  c.rect(1, 8, 7, 2, '#78716c'); c.rect(28, 8, 7, 2, '#78716c')
  c.rect(1, 26, 7, 5, '#292524'); c.rect(28, 26, 7, 5, '#292524')
  c.vline(4, 12, 11, '#ea580c'); c.vline(31, 12, 11, '#ea580c')
  c.rect(8, 7, 20, 26, '#57534e'); c.rect(8, 7, 20, 2, '#78716c'); c.rect(8, 28, 20, 5, '#44403c')
  for (const x of [13, 18, 23]) c.vline(x, 9, 19, '#44403c')
  const cr = [[13, 11, 17, 18], [23, 11, 19, 18], [17, 18, 19, 18], [17, 18, 13, 26], [19, 18, 23, 26]]
  for (const [a, b, d, e] of cr) c.line(a, b, d, e, '#ea580c')
  c.rect(17, 17, 3, 3, '#fde047')
  c.rect(12, 0, 12, 7, '#78716c'); c.rect(12, 0, 12, 1, '#a8a29e'); c.rect(12, 6, 12, 1, '#44403c')
  c.rect(14, 2, 3, 2, '#fde047'); c.rect(19, 2, 3, 2, '#fde047')
  c.hline(15, 5, 6, '#ea580c')
})

F('kreatur-flammenqualle', 28, 32, {}, (c) => {
  // Fangarme: die Welle läuft versetzt, unten kühlt die Glut ab
  for (let i = 0; i < 6; i++) {
    const x0 = 3 + i * 4
    for (let y = 13; y < 30; y++) { const x = x0 + Math.round(1.4 * Math.sin(y * 0.7 + i * 1.3)); c.px(x, y, y > 24 ? '#7f1d1d' : i % 2 ? '#ea580c' : '#fb923c'); if (y < 20) c.px(x + 1, y, '#9a3412') }
  }
  c.poly([0, 13, 1, 7, 5, 2, 10, 0, 16, 0, 21, 2, 25, 7, 25, 13, 22, 15, 18, 13, 14, 15, 10, 13, 6, 15, 3, 13], '#ea580c')
  c.poly([2, 11, 3, 7, 6, 3, 10, 1, 15, 1, 20, 3, 23, 7, 23, 11], '#fb923c')
  c.poly([5, 11, 6, 7, 9, 4, 16, 4, 19, 7, 20, 11], '#fde047')
  c.rect(8, 8, 2, 3, INK); c.rect(16, 8, 2, 3, INK)
  c.hline(11, 12, 4, '#9a3412')
  c.hline(7, 2, 3, '#fef9c3')
})

F('kreatur-glutkraken', 52, 40, {}, (c) => {
  // Sechs dicke Arme, die Spitzen rollen sich ein; Saugnäpfe in Glut
  const arms = [
    [[14, 21], [8, 23], [3, 24], [1, 21], [3, 19], [5, 20]],
    [[17, 25], [11, 29], [5, 30], [2, 33], [4, 36], [7, 35]],
    [[21, 26], [18, 32], [14, 35], [11, 37], [13, 37], [15, 36]],
  ]
  for (const s of [0, 1]) {
    const X = (x) => (s ? 49 - x : x)
    arms.forEach((a, ai) => {
      for (let i = 0; i + 1 < a.length; i++) {
        c.line(X(a[i][0]), a[i][1], X(a[i + 1][0]), a[i + 1][1], ai === 1 ? '#991b1b' : '#b91c1c', i < 3 ? 2 : 1)
      }
      for (let i = 0; i < 3; i++) c.px(X(a[i][0]), a[i][1] + 1, '#fb923c')
    })
  }
  c.ellipse(25, 14, 14, 14, '#991b1b')
  c.ellipse(24, 13, 13, 13, '#dc2626')
  c.ellipse(24, 21, 10, 5, '#b91c1c')
  c.rect(16, 4, 5, 2, '#fda4af'); c.px(15, 6, '#fda4af'); c.rect(24, 3, 2, 2, '#fda4af')
  c.rect(17, 15, 5, 5, '#fde047'); c.rect(29, 15, 5, 5, '#fde047')
  c.rect(18, 16, 3, 4, INK); c.rect(30, 16, 3, 4, INK)
  c.hline(16, 14, 6, '#7f1d1d'); c.hline(29, 14, 6, '#7f1d1d')
  c.hline(23, 22, 5, '#7f1d1d')
})

F('kreatur-glutschnecke', 30, 18, {}, (c) => {
  // Fuß und Kopf aus Stein, Haus aus Glut mit eingerollter Spirale
  c.poly([1, 15, 5, 13, 27, 13, 27, 15, 25, 15, 2, 15], '#44403c')
  c.hline(4, 15, 22, '#ea580c')
  c.poly([2, 14, 2, 8, 4, 5, 8, 5, 10, 8, 10, 14], '#57534e')
  c.line(3, 7, 2, 1, '#44403c'); c.line(7, 6, 7, 1, '#44403c')
  c.px(2, 0, '#fde047'); c.px(7, 0, '#fde047')
  c.rect(3, 8, 2, 2, '#fde047'); c.px(3, 9, INK)
  c.circ(18, 7, 7, '#7c2d12')
  c.circ(18, 7, 6, '#c2410c')
  c.circ(18, 7, 4, '#f97316')
  c.circ(18, 7, 2, '#fde047')
  c.px(18, 7, '#7c2d12')
  for (let t = 0; t < 12; t += 0.3) { const r = 0.5 * t + 1; c.px(Math.round(18 + Math.cos(t) * r), Math.round(7 + Math.sin(t) * r), '#7c2d12') }
  c.rect(12, 2, 3, 1, '#fdba74')
})

F('kreatur-schlackwurm', 26, 34, {}, (c) => {
  // Glieder von unten nach oben, das Maul schaut nach vorn
  const segs = [[15, 27, 8], [16, 22, 8], [14, 18, 7], [11, 14, 7], [9, 9, 7]]
  for (const [x, y, r] of segs) {
    c.ellipse(x, y, r, 4, '#292524')
    c.ellipse(x - 1, y - 1, r - 1, 3, '#57534e')
    c.hline(x - r + 3, y - 3, 2 * r - 6, '#78716c')
    c.px(x + r - 2, y + 1, '#ea580c')
  }
  c.ellipse(9, 5, 6, 5, '#292524')
  c.ellipse(9, 5, 5, 4, '#b91c1c')
  c.ellipse(9, 6, 3, 2, '#fb923c'); c.rect(8, 5, 2, 2, '#fde047')
  for (const [x, y] of [[5, 2], [8, 1], [11, 1], [13, 3], [4, 6], [14, 6]]) c.px(x, y, '#f8fafc')
})

// ---------------------------------------------------------------- Icons
function iconFish(c, S, ox = 0, oy = 0) {
  // Kopf oben links, Schwanz unten rechts. Abgewickelt entlang der Diagonale.
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const a = (x + 0.5) / S, b = (y + 0.5) / S
    const u = (a + b) * 0.5 / 0.74 * 0.98 - 0.02, w = (a - b) * 0.72
    if (u < 0 || u > 1) continue
    const up = 0.2 * Math.sin(Math.PI * Math.min(1, u / 0.42) / 2) ** 0.7 * (u > 0.42 ? (1 - (u - 0.42) / 0.58) ** 0.9 * 0.9 + 0.1 : 1)
    if (Math.abs(w) > up) continue
    const v = (w + up) / (2 * up)
    const mark = ((x + y) % 4 === 0 && (x - y + 400) % 4 === 0)
    c.px(ox + x, oy + y, v > 0.72 ? '#7fe3cf' : v < 0.22 ? '#0e6e6e' : mark ? '#178f89' : '#2dbdaf')
  }
}
function iconTail(c, S, ox = 0, oy = 0) {
  const a = Math.round(S * 0.7), z = S - 1
  c.poly([ox + a, oy + a, ox + z, oy + Math.round(S * 0.62), ox + z - Math.round(S * 0.1), oy + z - Math.round(S * 0.1), ox + Math.round(S * 0.62), oy + z], '#a7c7d9')
  c.line(ox + a, oy + a, ox + z - Math.round(S * 0.12), oy + z - Math.round(S * 0.12), '#5d8aa8')
}
F('fish-icon', 32, 32, {}, (c) => {
  iconTail(c, 30); iconFish(c, 30)
  c.rect(4, 5, 4, 4, '#f8fafc'); c.rect(4, 6, 3, 3, INK); c.px(4, 6, '#ffffff')
  c.line(9, 11, 12, 8, '#0e6e6e')
  c.poly([12, 6, 18, 3, 19, 9], '#a7c7d9')
  c.poly([9, 19, 12, 25, 15, 21], '#a7c7d9')
})
F('fish-cursor', 16, 16, {}, (c) => {
  iconTail(c, 14); iconFish(c, 14)
  c.rect(2, 2, 2, 2, '#f8fafc'); c.px(2, 3, INK)
})
sprite('apple-touch-icon', { w: 45, h: 45 }, (c) => {
  c.rect(0, 0, 45, 45, '#10233b')
  c.rect(0, 33, 45, 12, '#0d3b52')
  for (const [x, w] of [[3, 9], [20, 13], [36, 7]]) c.hline(x, 36, w, '#1d6a84')
  for (const [x, w] of [[9, 7], [28, 9]]) c.hline(x, 40, w, '#1d6a84')
  const ox = 8, oy = 6, S = 30
  iconTail(c, S, ox, oy); iconFish(c, S, ox, oy)
  c.rect(ox + 4, oy + 5, 4, 4, '#f8fafc'); c.rect(ox + 4, oy + 6, 3, 3, INK); c.px(ox + 4, oy + 6, '#ffffff')
  c.line(ox + 9, oy + 11, ox + 12, oy + 8, '#0e6e6e')
})
// Schattenriss im langen Mantel, vornübergebeugt. Die Hand liegt dort, wo das Spiel die Angelschnur ansetzt (drawNpc).
sprite('spezifischfischer-pixel', { w: 20, h: 44 }, (c) => {
  const a = '#141c2c', b = '#22304a'
  // Kopf mit Kapuze, nach vorn geneigt
  c.poly([8, 3, 10, 0, 14, 0, 16, 3, 16, 6, 14, 8, 10, 9, 7, 7], a); c.rect(15, 4, 2, 2, a)
  // Rücken und Mantel, unten weiter werdend
  c.poly([6, 8, 12, 8, 14, 12, 14, 18, 15, 24, 16, 31, 17, 36, 17, 41, 5, 41, 6, 34, 6, 26, 4, 22, 3, 17, 3, 12], a)
  // Arm zur Hand mit der Rute
  c.line(9, 13, 15, 17, a, 3); c.rect(16, 15, 3, 2, a); c.px(19, 14, a); c.px(17, 18, a)
  // Stiefel, leicht versetzt
  c.rect(4, 42, 7, 2, a); c.rect(12, 42, 7, 2, a); c.px(3, 43, a); c.rect(6, 41, 4, 1, a); c.rect(13, 41, 4, 1, a)
  // Licht fällt von hinten auf Schulter und Mantel, dazu eine Falte
  c.line(5, 11, 4, 16, b); c.line(5, 23, 7, 27, b); c.line(7, 28, 7, 39, b); c.line(12, 26, 13, 39, b)
})

// Boot-Skin: ein riesiger Schwimmer auf dem Bauch, Füße links, Kopf rechts; die Spielfigur steht auf dem Rücken (y≈33)
F('boot-hoff', 158, 52, {}, (c) => {
  const S = '#c98a55', L = '#e0a870', D = '#a86a3c', DD = '#7c4a28'
  const H = '#3a2210', HL = '#5c3a1c', R = '#dc2626', RD = '#991b1b', RL = '#f87171', W = '#f8fafc', W2 = '#bfdbfe'
  // Füße
  c.poly([0, 32, 4, 29, 11, 31, 11, 38, 3, 38], D); c.poly([1, 32, 4, 30, 10, 32, 10, 34, 2, 34], S)
  for (let i = 0; i < 4; i++) c.px(1 + i * 2, 32 - (i > 1 ? 1 : 0), L)
  // Beine, Wade und Oberschenkel
  c.poly([9, 32, 20, 30, 28, 30, 28, 46, 16, 44, 9, 38], S)
  c.poly([9, 36, 16, 39, 28, 41, 28, 46, 16, 44, 9, 38], D)
  c.hline(12, 31, 15, L); c.hline(20, 30, 8, L)
  c.line(18, 33, 22, 36, D)
  // Badehose mit Bund und Seitennaht
  c.poly([26, 29, 54, 30, 55, 48, 26, 47], R)
  c.poly([26, 41, 55, 43, 55, 48, 26, 47], RD)
  c.hline(27, 30, 26, RL)
  c.rect(50, 30, 5, 18, RD); c.vline(51, 31, 16, RL)
  c.vline(38, 32, 10, RD); c.px(44, 36, RL); c.px(32, 37, RL)
  // Rücken: oben flach, damit man darauf stehen kann
  c.poly([54, 33, 90, 33, 112, 30, 122, 34, 120, 48, 54, 48], S)
  c.poly([54, 43, 120, 42, 120, 48, 54, 48], D)
  c.hline(55, 33, 34, L); c.hline(56, 34, 30, L)
  // Wirbelsäule und Schulterblätter als Muskelkerben
  for (let x = 60; x < 88; x += 6) c.hline(x, 37, 3, D)
  c.line(88, 40, 96, 36, D); c.line(100, 40, 108, 36, D); c.hline(96, 35, 12, L)
  // Schulter und nach vorn gestreckter Arm
  c.ellipse(112, 37, 12, 9, S); c.ellipse(111, 34, 9, 4, L); c.line(103, 44, 120, 44, D)
  c.poly([118, 37, 152, 36, 156, 39, 154, 44, 120, 46], S)
  c.poly([120, 42, 154, 41, 154, 44, 120, 46], D)
  c.hline(124, 37, 26, L)
  for (let i = 0; i < 3; i++) c.vline(150 + i * 2, 38, 3, D)
  // Kopf
  c.ellipse(127, 19, 17, 17, S)
  c.ellipse(129, 22, 14, 13, L)
  c.ellipse(116, 25, 3, 5, D); c.px(115, 25, DD); c.px(116, 23, DD)
  // Haar aus Locken, hinten und oben dicht, vorn im Stirnansatz
  const curls = [[112, 16], [115, 11], [119, 7], [124, 4], [130, 3], [136, 5], [141, 9], [143, 13], [111, 21], [114, 19], [118, 14], [123, 10], [129, 9], [135, 10], [139, 13], [112, 27], [120, 19]]
  for (const [x, y] of curls) { c.ellipse(x, y, 3.4, 3.4, H) }
  for (const [x, y] of curls) { c.px(x - 1, y - 1, HL); c.px(x, y - 1, HL) }
  c.ellipse(142, 17, 2, 3, H)
  // Gesicht schaut nach rechts
  c.rect(126, 16, 6, 2, H); c.rect(136, 16, 6, 2, H)
  c.rect(127, 19, 5, 4, W); c.rect(137, 19, 4, 4, W)
  c.rect(129, 20, 3, 3, '#2563eb'); c.rect(138, 20, 3, 3, '#2563eb'); c.px(130, 21, INK); c.px(139, 21, INK); c.px(129, 20, '#ffffff'); c.px(138, 20, '#ffffff')
  c.poly([133, 20, 135, 20, 137, 26, 133, 27], D); c.line(134, 21, 134, 25, L)
  // schiefes Grinsen, Kinnschatten
  c.line(127, 29, 133, 31, DD); c.line(133, 31, 139, 29, DD); c.line(139, 29, 141, 27, DD)
  c.hline(129, 32, 8, D); c.line(123, 30, 128, 35, D)
  // Hals
  c.rect(117, 32, 8, 5, S); c.hline(118, 36, 7, D)
  // Schaumkante: gestuft, liegt auf dem Wasser
  const foam = [[0, 41, 12], [8, 44, 18], [24, 46, 22], [44, 47, 34], [76, 46, 26], [100, 47, 24], [122, 45, 18], [138, 43, 18]]
  for (const [x, y, w] of foam) { c.rect(x, y, w, 2, W); c.hline(x + 2, y + 2, Math.max(0, w - 4), W2) }
})

// ---------------------------------------------------------------- Neu 2026-11-05: Glutgrotte
F('lava-schmelzente', 44, 30, { flip: true }, (c) => {
  // Quietscheente, halb geschmolzen: oben noch Ente, unten eine gelbe Pfütze mit Tropfen
  c.ellipse(20, 23, 19, 4, '#ca8a04'); c.ellipse(20, 22, 18, 3, '#eab308'); c.ellipse(16, 21, 8, 1, '#fde047')
  c.ellipse(22, 16, 12, 7, '#eab308'); c.ellipse(21, 15, 11, 6, '#facc15'); c.ellipse(18, 13, 6, 2, '#fde68a')
  for (const [x, l] of [[13, 6], [19, 8], [26, 5], [31, 7]]) { c.vline(x, 19, l, '#eab308'); c.vline(x + 1, 19, l - 2, '#facc15'); c.px(x, 19 + l, '#ca8a04') }
  c.circ(10, 8, 6, '#eab308'); c.circ(10, 7, 5, '#facc15'); c.ellipse(8, 4, 2, 1, '#fde68a')
  c.poly([2, 8, -1, 10, 2, 12, 5, 11], '#ea580c'); c.hline(0, 10, 4, '#c2410c')
  c.rect(8, 6, 2, 2, INK); c.px(8, 6, '#ffffff')
  c.ellipse(30, 13, 4, 2, '#ca8a04') // Flügelrest
  for (const [x, y] of [[36, 4], [39, 9], [3, 18]]) c.px(x, y, '#cbd5e1')
  c.px(37, 3, '#e2e8f0'); c.px(38, 8, '#e2e8f0')
})

F('lava-lavalampe', 58, 30, { flip: true }, (c) => {
  // Lavalampe als Fisch: Glaskörper mit wabernden Blasen, Metallkappen an Maul und Schwanz
  const p = P({ x0: 6, x1: 44, cy: 14, up: 11, dn: 11, peak: 0.5, hp: 0.7, tp: 1, end: 0.35 })
  tail(c, 46, 14, 10, 9, 3, '#9ca3af', '#4b5563')
  c.rect(44, 9, 4, 11, '#6b7280'); c.vline(45, 9, 11, '#d1d5db')
  paint(c, p, (u, v, x, y) => {
    const blob = [[14, 9, 4], [24, 17, 5], [33, 8, 3], [38, 17, 3], [19, 21, 2]].some(([bx, by, r]) => Math.hypot(x - bx, (y - by) * 1.2) < r)
    if (blob) return v < 0.3 ? '#fdba74' : '#f97316'
    return v < 0.18 ? '#c084fc' : v > 0.82 ? '#6b21a8' : '#9333ea'
  })
  for (let y = 5; y < 13; y++) c.px(10 + (y >> 2), y, '#e9d5ff') // Glanz auf dem Glas
  c.rect(0, 8, 7, 13, '#6b7280'); c.vline(2, 8, 13, '#d1d5db'); c.hline(0, 8, 7, '#9ca3af'); c.hline(0, 20, 7, '#4b5563')
  c.rect(3, 11, 3, 3, '#fef08a'); c.px(4, 12, INK)
  c.hline(0, 16, 3, INK)
})

F('lava-feuerkoi', 70, 36, { flip: true }, (c) => {
  // Koi: weiß mit flammenden Flecken in Rot und Orange, lange, wehende Flossen
  const p = P({ x0: 2, x1: 50, cy: 17, up: 10, dn: 10, peak: 0.32, hp: 0.55, end: 0.16 })
  fan(c, [18, 8], [[22, 1], [30, 2], [38, 9]], '#fb923c', '#ea580c')
  fan(c, [20, 25], [[17, 33], [25, 34], [28, 26]], '#fdba74', '#f97316')
  tail(c, 48, 17, 19, 15, 7, '#fb923c', '#dc2626')
  paint(c, p, (u, v, x, y) => {
    const fl = Math.sin(x * 0.42) * 2.4 + Math.sin(x * 0.17 + 1) * 3
    const patch = (u > 0.12 && v < 0.55 + fl * 0.04 && ((x > 9 && x < 21) || (x > 27 && x < 41))) || (u > 0.04 && u < 0.18 && v < 0.35)
    if (patch) return v < 0.18 ? '#b91c1c' : (y + x) % 7 === 0 ? '#fde047' : '#dc2626'
    if (v > 0.8) return '#e5e7eb'
    return scale(x, y, 5) ? '#fed7aa' : '#fff7ed'
  })
  // Flammenzungen auf dem Rücken
  for (const x of [12, 16, 31, 35, 39]) { const t = Math.round(p.top(x)); c.vline(x, t - 2, 2, '#f97316'); c.px(x, t - 3, '#fde047') }
  gill(c, p, 0.22, '#fdba74')
  eye(c, 6, 13)
  c.line(1, 20, 5, 21, '#b91c1c'); c.line(2, 22, 0, 26, '#fb923c'); c.line(3, 22, 2, 25, '#fb923c') // Barteln
  sprk(c, 62, 4)
})

F('lava-hortbarsch', 70, 40, { flip: true }, (c) => {
  // Lebt im Drachenhort und frisst Gold: Schuppen wie Münzen, Rubinauge, eine kleine Krone
  const p = P({ x0: 3, x1: 52, cy: 21, up: 14, dn: 13, peak: 0.34, hp: 0.5, end: 0.16 })
  fan(c, [18, 8], [[22, 2], [32, 2], [42, 10]], '#ca8a04', '#92400e')
  fan(c, [24, 33], [[24, 38], [32, 38], [35, 32]], '#ca8a04', '#92400e')
  tail(c, 50, 21, 16, 14, 6, '#eab308', '#a16207')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.78) return v > 0.92 ? '#ca8a04' : '#fde68a'
    if (v < 0.1) return '#a16207'
    const cx = ((x + (Math.floor(y / 4) % 2) * 2) % 4), cy = y % 4
    if (u > 0.22 && (cx === 0 || cy === 0)) return '#b45309' // Münzrand
    if (u > 0.22 && cx === 1 && cy === 1) return '#fef9c3'
    return v < 0.4 ? '#eab308' : '#facc15'
  })
  gill(c, p, 0.22, '#92400e')
  c.rect(8, 15, 5, 5, '#7f1d1d'); c.rect(9, 16, 3, 3, '#ef4444'); c.px(9, 16, '#fecaca')
  c.line(3, 26, 9, 27, '#92400e')
  // Krone
  c.rect(10, 5, 9, 3, '#facc15'); c.hline(10, 7, 9, '#a16207')
  for (const x of [10, 14, 18]) { c.vline(x, 2, 3, '#facc15'); c.px(x, 1, '#fef08a') }
  c.px(14, 6, '#ef4444'); c.px(11, 6, '#38bdf8'); c.px(17, 6, '#22c55e')
  sprk(c, 30, 14, '#fde047', '#ffffff'); sprk(c, 41, 25, '#fde047', '#ffffff'); sprk(c, 64, 5)
})

F('lava-phoenixkueken', 50, 38, { flip: true }, (c) => {
  // Frisch geschlüpft im Phönixnest: rund, flaumig, mit kleiner Flammenhaube
  for (const [x, h, col] of [[14, 9, '#f97316'], [18, 12, '#fb923c'], [22, 10, '#f97316'], [26, 7, '#ef4444']]) {
    c.poly([x - 3, 13, x, 13 - h, x + 3, 13], col); c.line(x, 13 - h + 2, x, 12, '#fde047')
  }
  tail(c, 34, 23, 12, 9, 4, '#f97316', '#fde047')
  c.circ(20, 23, 13, '#ea580c'); c.circ(19, 22, 12, '#f97316'); c.circ(18, 21, 10, '#fb923c')
  c.ellipse(19, 28, 8, 5, '#fde68a'); c.ellipse(19, 27, 6, 3, '#fef3c7')
  for (const [x, y] of [[10, 15], [26, 16], [29, 22], [8, 24], [15, 33], [25, 32]]) c.px(x, y, '#fdba74') // Flaum
  c.poly([22, 22, 33, 18, 31, 25, 25, 27], '#ef4444'); c.line(24, 23, 31, 20, '#fde047') // Flügelchen
  c.rect(10, 17, 4, 4, '#fef9c3'); c.rect(11, 18, 2, 3, INK); c.px(11, 18, '#ffffff')
  c.poly([6, 22, 1, 24, 6, 26], '#facc15'); c.hline(2, 24, 4, '#ca8a04')
  c.px(9, 23, '#fca5a5'); c.px(8, 23, '#fca5a5')
  // Eierschale klebt noch am Bauch
  c.poly([12, 33, 14, 30, 16, 33, 19, 30, 22, 33, 25, 30, 27, 33, 27, 36, 12, 36], '#fef3c7'); c.hline(12, 35, 16, '#e7e5e4')
  sprk(c, 40, 6); sprk(c, 4, 6)
})

F('lava-glutwal', 104, 52, { flip: true }, (c) => {
  // Riesiger Wal aus Basalt, Bauchfurchen glühen, aus dem Blasloch spritzt Lava
  const p = P({ x0: 4, x1: 82, cy: 30, up: 17, dn: 15, peak: 0.24, hp: 0.6, tp: 1.2, end: 0.1, arch: -1 })
  // Fluke
  c.poly([80, 30, 90, 22, 101, 15, 98, 25, 93, 30, 98, 35, 101, 45, 90, 38], '#44403c'); c.line(84, 30, 99, 18, '#57534e'); c.line(84, 30, 99, 42, '#292524')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.56) { // Bauchfurchen
      if (u < 0.6 && y % 3 === 0) return v > 0.85 ? '#fde047' : '#f97316'
      return u < 0.6 ? '#c2410c' : '#7c2d12'
    }
    if (v < 0.1) return '#78716c'
    const crack = ((x * 7 + y * 11) % 53 === 0) || ((x * 3 - y * 5) % 47 === 0)
    if (crack && u > 0.15) return '#f97316'
    return v < 0.3 ? '#57534e' : '#44403c'
  })
  // Brustflosse
  c.poly([30, 38, 26, 49, 34, 50, 42, 39], '#44403c'); c.line(33, 40, 30, 48, '#f97316')
  // Rückenhöcker
  c.poly([58, Math.round(p.top(58)) + 1, 64, Math.round(p.top(62)) - 4, 68, Math.round(p.top(68)) + 1], '#44403c')
  // Auge und Maul
  c.rect(14, 30, 4, 3, '#fde047'); c.rect(15, 31, 2, 2, INK)
  c.line(3, 35, 24, 38, '#1c1917'); c.line(4, 36, 24, 39, '#fb923c')
  // Lavafontäne
  const bx = 24, by = Math.round(p.top(24))
  for (let i = 0; i < 9; i++) { c.px(bx + (i % 2), by - 1 - i, i < 4 ? '#f97316' : '#fde047') }
  for (const [dx, dy] of [[-4, -9], [-6, -6], [-7, -2], [5, -9], [7, -6], [8, -2], [-2, -11], [3, -11]]) c.rect(bx + dx, by + dy, 2, 2, dy < -7 ? '#fde047' : '#f97316')
  sprk(c, 50, 4); sprk(c, 95, 6)
})

// ---------------------------------------------------------------- Neu 2026-11-05: Tiefsee (Hohe See)
F('beilfisch', 40, 26, {}, (c) => {
  // Silbriger Tiefsee-Beilfisch: vorn hoch wie eine Axt, hinten schmal, Leuchtpunkte am Bauch
  c.poly([3, 6, 12, 2, 20, 3, 28, 9, 30, 12, 28, 15, 20, 20, 12, 23, 6, 21, 2, 14], '#94a3b8')
  c.poly([4, 7, 12, 3, 19, 4, 27, 9, 27, 11, 4, 12], '#cbd5e1')
  c.poly([4, 13, 27, 12, 27, 14, 20, 19, 12, 22, 6, 20], '#e2e8f0')
  c.line(4, 7, 18, 4, '#475569')
  tail(c, 29, 12, 8, 6, 3, '#94a3b8', '#64748b')
  for (let x = 7; x < 22; x += 3) c.px(x, Math.round(20 - (x - 7) * 0.42), '#38bdf8')
  for (let x = 8; x < 20; x += 3) c.px(x, Math.round(22 - (x - 8) * 0.5), '#7dd3fc')
  c.rect(5, 7, 6, 6, '#e2e8f0'); c.rect(6, 8, 4, 4, INK); c.px(6, 8, '#ffffff'); c.px(9, 11, '#38bdf8')
  c.line(1, 14, 5, 16, '#475569')
  c.poly([14, 2, 17, -1, 19, 3], '#64748b')
})

F('taucherhelm', 34, 34, {}, (c) => {
  // Alter Messing-Taucherhelm mit rundem Fenster, ein bisschen Seetang
  c.circ(15, 14, 13, '#92400e'); c.circ(15, 13, 12, '#b45309'); c.circ(13, 11, 9, '#d97706'); c.ellipse(10, 6, 4, 2, '#fbbf24')
  c.rect(2, 25, 26, 6, '#92400e'); c.hline(2, 25, 26, '#d97706'); c.hline(2, 30, 26, '#78350f')
  for (const x of [5, 11, 17, 23]) c.px(x, 27, '#fde68a')
  c.circ(15, 14, 6, '#78350f'); c.circ(15, 14, 5, '#1e3a5f'); c.circ(14, 13, 3, '#2563eb')
  c.line(12, 11, 14, 10, '#bfdbfe')
  for (const [x, y] of [[15, 8], [15, 20], [9, 14], [21, 14]]) c.px(x, y, '#fde68a')
  c.circ(28, 15, 2, '#78350f'); c.px(28, 15, '#fbbf24')
  // Seetang
  for (let i = 0; i < 9; i++) c.px(3 + Math.round(Math.sin(i * 0.8) * 1.2), 24 - i, i % 2 ? '#15803d' : '#22c55e')
  for (let i = 0; i < 6; i++) c.px(26 + Math.round(Math.sin(i) * 1.2), 31 - i, '#16a34a')
})

F('riesenassel', 56, 28, {}, (c) => {
  // Riesenassel von der Seite: gewölbter Panzer aus Platten, viele Beinchen, lange Fühler
  for (let x = 6; x < 46; x += 4) for (let k = 0; k < 5; k++) c.px(x + (k > 2 ? 1 : 0) - (k > 3 ? 1 : 0), 18 + k, '#a78b7a')
  c.ellipse(26, 14, 21, 8, '#78716c'); c.ellipse(26, 13, 20, 7, '#a8a29e')
  for (let x = 10; x < 46; x += 4) { c.vline(x, 7, 12, '#78716c'); c.vline(x + 1, 7, 4, '#d6d3d1') }
  c.hline(8, 19, 36, '#57534e'); c.ellipse(22, 9, 10, 2, '#d6d3d1')
  // Kopf links mit großem Facettenauge
  c.ellipse(7, 15, 5, 5, '#a8a29e'); c.rect(3, 12, 4, 3, '#1c1917'); c.px(4, 12, '#a3e635'); c.px(5, 13, '#4d7c0f')
  c.line(4, 11, 0, 3, '#78716c'); c.line(5, 11, 3, 1, '#a8a29e'); c.line(2, 17, 0, 23, '#78716c')
  // Schwanzfächer
  c.poly([46, 10, 53, 9, 54, 18, 46, 19], '#78716c'); c.line(48, 11, 53, 12, '#a8a29e'); c.line(48, 17, 53, 16, '#57534e')
})

F('leuchtqualle', 32, 44, {}, (c) => {
  // Leuchtqualle: türkiser Schirm, pinkes Innenleben, wehende Tentakel mit Leuchtpunkten
  for (const [x0, l, col] of [[7, 22, '#67e8f9'], [11, 26, '#f0abfc'], [15, 24, '#67e8f9'], [19, 27, '#f0abfc'], [23, 21, '#67e8f9']]) {
    for (let i = 0; i < l; i++) { const x = x0 + Math.round(Math.sin(i * 0.45 + x0) * 1.5); c.px(x, 16 + i, i % 5 === 4 ? '#ffffff' : col) }
  }
  c.ellipse(15, 11, 13, 9, '#0891b2'); c.ellipse(15, 10, 12, 8, '#22d3ee'); c.rect(2, 12, 27, 6, null)
  for (let x = 2; x < 29; x++) c.px(x, 17 + (x % 3 === 0 ? 1 : 0), '#0891b2')
  for (let y = 12; y < 18; y++) for (let x = 2; x < 29; x++) if ((x - 15) ** 2 / 169 + (y - 11) ** 2 / 81 <= 1) c.px(x, y, '#22d3ee')
  c.ellipse(15, 11, 6, 4, '#e879f9'); c.ellipse(14, 10, 3, 2, '#fae8ff')
  c.ellipse(9, 5, 3, 1, '#cffafe'); c.px(20, 4, '#cffafe')
  c.rect(9, 9, 2, 2, INK); c.rect(20, 9, 2, 2, INK); c.hline(13, 14, 4, '#0e7490')
})

F('fangzahn', 54, 34, {}, (c) => {
  // Fangzahnfisch: riesiger Kopf, winziger Körper, Zähne länger als gut für ihn ist
  const p = P({ x0: 2, x1: 40, cy: 17, up: 14, dn: 14, peak: 0.22, hp: 0.4, tp: 0.8, end: 0.2 })
  tail(c, 38, 17, 13, 9, 4, '#1e293b', '#0f172a')
  fan(c, [22, 6], [[25, 2], [31, 4], [34, 9]], '#1e293b', '#0f172a')
  paint(c, p, (u, v, x, y) => {
    if (v < 0.12) return '#475569'
    return scale(x, y, 4) && u > 0.35 ? '#1e293b' : v > 0.7 ? '#1e293b' : '#334155'
  })
  // Maul offen, rote Kehle
  c.poly([1, 17, 16, 15, 16, 25, 2, 27], '#7f1d1d'); c.poly([3, 19, 14, 17, 14, 23, 4, 25], '#450a0a')
  for (const x of [3, 7, 11]) { c.line(x, 16, x + 1, 24, '#f8fafc'); c.px(x + 1, 25, '#cbd5e1') }
  for (const x of [5, 9, 13]) c.line(x, 26, x, 20, '#e2e8f0')
  c.rect(11, 9, 4, 4, '#cbd5e1'); c.rect(12, 10, 2, 2, INK)
  gill(c, p, 0.42, '#0f172a')
  for (const [x, y] of [[24, 20], [28, 18], [32, 19]]) c.px(x, y, '#38bdf8')
})

F('pelikanaal', 80, 40, {}, (c) => {
  // Pelikanaal: ein Maul wie ein Sack, dahinter ein peitschendünner Körper mit leuchtender Spitze
  // Körper als Peitsche
  let lx = 26, ly = 20
  for (let x = 26; x < 76; x++) {
    const y = 20 + Math.round(Math.sin((x - 26) * 0.15) * 5 * (x - 26) / 50), t = x < 44 ? 2 : x < 62 ? 1 : 0
    c.line(lx, ly, x, y, '#1e1b4b'); for (let k = 1; k <= t; k++) { c.px(x, y + k, '#312e81'); c.px(x, y - k, '#1e1b4b') }
    lx = x; ly = y
  }
  const tx = lx, ty = ly
  c.rect(tx, ty - 1, 2, 3, '#f472b6'); c.px(tx + 2, ty, '#fbcfe8'); sprk(c, tx + 1, ty - 4, '#f472b6', '#fdf2f8')
  // Kopf und Sackmaul
  c.poly([2, 10, 26, 15, 28, 22, 4, 36, 0, 33, 20, 22, 1, 13], '#312e81')
  c.poly([3, 14, 20, 20, 22, 21, 4, 33, 2, 31, 16, 22, 2, 16], '#1e1b4b')
  c.ellipse(13, 28, 10, 5, '#3730a3'); c.ellipse(12, 28, 8, 3, '#4338ca')
  c.line(1, 12, 24, 16, '#6366f1')
  c.rect(22, 13, 3, 3, '#e0e7ff'); c.px(23, 14, INK)
  for (const x of [4, 9, 14]) c.px(x, 13 + Math.round(x / 6), '#a5b4fc')
})

F('megalodon', 120, 56, {}, (c) => {
  // Riesenhai aus der Urzeit: graues Schwergewicht, offenes Maul mit Zahnreihen, Narben
  const p = P({ x0: 4, x1: 92, cy: 28, up: 17, dn: 16, peak: 0.3, hp: 0.6, tp: 1.2, end: 0.1 })
  fan(c, [40, Math.round(p.top(40)) + 2], [[48, 0], [54, 1], [60, Math.round(p.top(60)) + 2]], '#475569', '#334155')
  fan(c, [44, 40], [[38, 53], [46, 54], [56, 41]], '#475569', '#334155')
  fan(c, [76, Math.round(p.bot(76)) - 1], [[78, 43], [82, 42], [83, Math.round(p.bot(83)) - 1]], '#475569', '#334155')
  c.poly([90, 28, 104, 10, 117, 2, 108, 24, 116, 51, 104, 40], '#475569'); c.line(94, 26, 114, 5, '#64748b'); c.line(94, 30, 112, 47, '#334155')
  paint(c, p, (u, v, x, y) => {
    if (v > 0.6 + 0.05 * Math.sin(x * 0.3)) return v > 0.9 ? '#cbd5e1' : '#e2e8f0'
    if (v < 0.1) return '#334155'
    return v < 0.35 ? '#475569' : '#64748b'
  })
  for (let i = 0; i < 5; i++) gill(c, p, 0.24 + i * 0.025, '#334155', 1)
  // Narben
  c.line(52, 18, 60, 22, '#94a3b8'); c.line(55, 16, 62, 20, '#94a3b8'); c.line(70, 24, 74, 30, '#94a3b8')
  // Maul
  c.poly([2, 31, 26, 33, 24, 42, 6, 40], '#7f1d1d'); c.poly([4, 33, 22, 34, 21, 40, 7, 38], '#450a0a')
  for (let x = 4; x < 25; x += 3) { c.poly([x, 32, x + 2, 32, x + 1, 35], '#f8fafc'); c.poly([x + 1, 41, x + 3, 41, x + 2, 38], '#e2e8f0') }
  c.rect(14, 22, 5, 4, INK); c.px(15, 22, '#ffffff'); c.line(12, 20, 20, 21, '#334155')
  for (const [x, y] of [[96, 50], [100, 54], [8, 8]]) drop(c, x, y)
})
