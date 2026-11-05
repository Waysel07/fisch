// Quelle der Sport-Kulissen der Sonneninsel (img/sport-*.png) und der Inselkarte (img/insel-karte*.png).
// Das Spiel lädt diese Datei nicht: node img/pxl/render.js sport. 1 Pixel = 1 Leinwand-Pixel (768×432, Welt × 2).
// Was sich bewegt (Wolken, Glitzern, Bälle, Figuren), zeichnet js/fischen.js darüber.
'use maler'

const SKY = ['#4ea9e6', '#5fb4ea', '#72bfef', '#86caf2', '#9bd5f5', '#b0dff8', '#c6e9fa', '#dcf3fc']
const SEA = ['#a6efe6', '#86e4dc', '#6cd8d3', '#55c9ca', '#41b7c0', '#32a2b4', '#268ca6', '#1d7696']
const SAND = ['#fbeec5', '#f4e1ad', '#ead196', '#d9bb7c', '#c4a065', '#a88350']
const LEAF = ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d']
const WOOD = ['#f0c890', '#d9a35c', '#b97f3c', '#935f28', '#6b421b']
const INK = C('#1b1f2e')
// 1 Rasterpixel = 1 Bildpixel (wie die Welt-Bilder)
function scene(name, w, h, paint) { sprite(name, { w, h, scale: 1 }, (c) => { const f = new FB(w, h); paint(f); f.flush(c) }) }

// ---------------------------------------------------------------- Bausteine
// Himmel mit Sonne und Fernsicht, darunter das Meer mit Glanzstreifen
function vista(f, hz, { sun = true, isles = true } = {}) {
  bands(f, 0, hz, SKY, 1.1, .35, 3)
  if (sun && hz > 120) {
    const sx = 636, sy = Math.round(hz * .32)
    f.ell(sx, sy, 30, 30, (x, y) => (x + y) % 2 ? C('#fff6cf') : C('#bfe6f9')) // Hof, gerastert
    f.ell(sx, sy, 22, 22, C('#fff1b8')); f.ell(sx, sy, 17, 17, C('#fde68a')); f.ell(sx - 4, sy - 4, 8, 8, C('#fffbeb'))
  }
  if (isles) {
    // ferne Inseln: blaugrau, mit hellem Saum und zwei Palmen
    for (const [a, b, h, s] of [[40, 210, 22, 5], [470, 560, 12, 6]]) {
      const top = (x) => hz - 1 - h * Math.pow(Math.sin(Math.PI * (x - a) / (b - a)), .7) * (.8 + .3 * fbm(x * .04, s))
      ridge(f, a, b, top, (x, y) => vn2(x * .15, y * .2, s) > .55 ? C('#6aa7a8') : C('#5a9698'), hz + 1, C('#9fd4cf'), 1)
      palm(f, Math.round(a + (b - a) * .4), Math.round(top(a + (b - a) * .4)) + 2, h + 10, .5, s, .55)
      palm(f, Math.round(a + (b - a) * .62), Math.round(top(a + (b - a) * .62)) + 2, h + 4, -.4, s + 1, .55)
    }
  }
  bands(f, hz, VH, SEA, .85, .9, 7)
  f.rect(0, hz, VW, 1, C('#effffb'))
  // Glanzlinien: oben fein und dicht, unten länger
  for (let i = 0; i < 140; i++) {
    const k = Math.pow(hash(i, 31), 1.6), y = hz + 3 + Math.round(k * (VH - hz - 6)), x = hash(i, 32) * VW, n = 4 + k * 26 * hash(i, 33)
    f.rect(x, y, n, 1, k < .3 ? C('#e6fffb') : C('#b8f3ec'))
  }
  if (sun && hz > 120) for (let i = 0; i < 18; i++) { const y = hz + 3 + i * 4, w = 22 - i; f.rect(636 - w / 2 + (hash(i, 34) - .5) * 10, y, w, 1, C('#fff7d1')) }
}
// Strand ab y: nasse Kante mit Schaum, trockener Sand mit Körnung, Muscheln und Spuren
function beach(f, y0, x0 = 0, x1 = VW, seed = 1) {
  const edge = (x) => y0 + Math.round(Math.sin(x * .05 + seed) * 2 + (fbm(x * .02, seed) - .5) * 4)
  for (let x = x0; x < x1; x++) {
    const e = edge(x)
    for (let y = e; y < VH; y++) {
      const d = y - e
      let c = d < 3 ? C('#c9b07a') : d < 8 ? ((x + y) % 2 && d > 5 ? C(SAND[1]) : C(SAND[3])) : sandAt(x, y, seed)
      f.set(x, y, c)
    }
    if (hash(Math.floor(x / 3), seed + 2) > .25) f.set(x, e - 1, C('#ffffff'))
    if (hash(Math.floor(x / 5), seed + 3) > .55) f.set(x, e - 2, C('#e9fffb'))
  }
  for (let i = 0; i < 10; i++) { // Muscheln
    const x = x0 + hash(i, seed + 4) * (x1 - x0), y = y0 + 16 + hash(i, seed + 5) * (VH - y0 - 20)
    if (i % 2) { f.ell(x, y, 2, 1, C('#fde7e4')); f.set(x - 1, y - 1, C('#ffffff')); f.set(x + 1, y + 1, C('#e0a8a0')) }
    else { f.rect(x, y, 3, 2, C('#f8d7a8')); f.set(x, y, C('#ffffff')); f.set(x + 2, y + 1, C('#c79a5e')) }
  }
}
// trockener Sand: ein Grundton, weiche Flecken mit gerasterten Rändern, vereinzelte Körner
function sandAt(x, y, seed) {
  const n = vn2(x * .03, y * .06, seed) + (vn2(x * .2, y * .35, seed + 9) - .5) * .12
  const g = hash(x * 7 + y * 13, seed)
  if (g > .992) return C(SAND[4])
  if (g > .975) return C(SAND[0])
  if (n > .74 || (n > .7 && (x + y) % 2)) return C(SAND[0])
  if (n < .24 || (n < .28 && (x + y) % 2)) return C(SAND[2])
  return C(SAND[1])
}
// Palme von oben: Wedel als Stern, Licht von links oben, Schatten nach rechts unten
function palmTop(f, x, y, r, seed = 1) {
  // weicher Schatten nach rechts unten: innen voll, am Rand gerastert
  for (let Y = -r; Y <= r; Y++) for (let X = -r; X <= r; X++) {
    const d = Math.hypot(X / (r * .9), Y / (r * .62)); if (d > 1) continue
    const px2 = Math.round(x + r * .4 + X), py2 = Math.round(y + r * .35 + Y), v = f.get(px2, py2)
    if (v >= 0 && (d < .75 || (px2 + py2) % 2 === 0)) f.set(px2, py2, mixI(v, C('#6b5530'), .3))
  }
  const fronds = []
  for (let j = 0; j < 11; j++) fronds.push({ a: j / 11 * Math.PI * 2 + (hash(j, seed) - .5) * .35, len: r * (.8 + hash(j + 3, seed) * .25) })
  fronds.sort((p, q) => Math.sin(p.a) - Math.sin(q.a)) // hintere (oben) zuerst
  for (const { a, len } of fronds) {
    const lit = Math.cos(a - Math.PI * 1.25), ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux
    for (let s = 1; s <= len; s++) {
      const k = s / len, X = x + ux * s, Y = y + uy * s, w = Math.round(Math.sin(Math.min(1, k * 1.3) * Math.PI) * r * .18) + 1
      for (let q = -w; q <= w; q++) {
        if (Math.abs(q) === w && w > 2 && s % 2) continue // gezackte Fiederkante
        const side = q < 0 ? lit : -lit, tone = side > .3 ? 1 : side > -.3 ? 2 : 3
        f.set(X + vx * q, Y + vy * q + Math.abs(q) * .25, C(LEAF[tone + (k > .8 ? 1 : 0)]))
      }
      f.set(X, Y, C(lit > 0 ? LEAF[0] : LEAF[2]))
    }
  }
  f.ell(x, y, 2, 2, C('#854d0e')); f.set(x - 1, y - 1, C('#fbbf24')); f.set(x + 1, y, C('#78350f'))
}
// Holzdielen: Bretter mit Fugen, versetzten Stößen und Maserung, Licht von oben
function planks(f, x0, y0, w, h, dir = 'h', pal = WOOD, board = 12, seed = 1) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const a = dir === 'h' ? y - y0 : x - x0, b = dir === 'h' ? x - x0 : y - y0, row = Math.floor(a / board), off = a % board
    const joint = (b + Math.floor(hash(row, seed) * 90)) % 90 === 0
    let c = pal[1]
    if (off === 0) c = pal[3]
    else if (off === 1) c = pal[0]
    else if (joint) c = pal[3]
    else if ((off * 5 + row * 3) % 7 === 0 && vn2(b * .04, row + off * .1, seed) > .42) c = pal[2]
    else if (off === board - 1) c = pal[2]
    f.set(x, y, C(c))
  }
}
// Palme von der Seite für nahe Kulissen: dicker Stamm mit Ringen (Licht links), breite Wedel mit Fiedern, Kokosnüsse
function bigPalm(f, x, base, h, lean, seed = 1) {
  const T = ['#e0b06a', '#c08a3e', '#9a6527', '#6f4318'].map(C)
  let tx = x, ty = base
  for (let i = 0; i <= h; i++) {
    const k = i / h, w = Math.round(7 - k * 3); tx = x + lean * k * k * h * .32; ty = base - i
    const ring = i % 7 < 1
    for (let q = 0; q < w; q++) { const u = q / (w - 1 || 1); f.set(Math.round(tx) - Math.floor(w / 2) + q, ty, ring ? T[3] : u < .25 ? T[0] : u < .7 ? T[1] : T[2]) }
    if (i % 7 === 1) f.set(Math.round(tx) - Math.floor(w / 2), ty, C('#f4d39a'))
  }
  const cx = Math.round(tx), cy = Math.round(ty)
  const fronds = []
  for (let j = 0; j < 9; j++) fronds.push({ a: -Math.PI + (j + .5) / 9 * Math.PI + (hash(j, seed) - .5) * .25, len: h * (.42 + hash(j + 9, seed) * .2) })
  fronds.push({ a: -Math.PI * .9, len: h * .35 }, { a: -Math.PI * .1, len: h * .35 })
  for (const { a, len } of fronds) {
    const up = -Math.sin(a) // 1 = nach oben
    for (let s = 0; s <= len; s++) {
      const k = s / len, X = cx + Math.cos(a) * s, Y = cy + Math.sin(a) * s * .6 + k * k * len * .7
      const w = Math.round(Math.sin(Math.min(1, k * 1.2) * Math.PI) * 9) + 1
      for (let q = 1; q <= w; q++) {
        if ((s + q) % 3 === 0) continue
        const dy = q * (.6 + k * .8)
        f.set(X - Math.cos(a) * q * .25, Y + dy, C(LEAF[q < 3 ? 3 : 4]))
        f.set(X + Math.cos(a) * q * .25, Y - dy * .45 * up, C(LEAF[up > .5 ? 1 : 2]))
      }
      f.set(X, Y, C(LEAF[0])); f.set(X, Y + 1, C(LEAF[2]))
    }
  }
  for (const [dx, dy] of [[-3, 3], [2, 4], [-1, 6]]) { f.ell(cx + dx, cy + dy, 2, 2, C('#5b3317')); f.set(cx + dx - 1, cy + dy - 1, C('#a16207')) }
}
function frame(f, x, y, w, h, c, t = 2) { f.rect(x, y, w, t, c); f.rect(x, y + h - t, w, t, c); f.rect(x, y, t, h, c); f.rect(x + w - t, y, t, h, c) }
// Strandtuch und Kühlbox als kleine Requisiten
function towel(f, x, y, a, b) { for (let j = 0; j < 14; j++) for (let i = 0; i < 26; i++) f.set(x + i + Math.round(j * .3), y + j, Math.floor(i / 4) % 2 ? C(a) : C(b)); f.rect(x, y + 14, 27, 1, C('#c9b07a')) }
function cooler(f, x, y) { f.rect(x, y - 12, 22, 12, C('#2563eb')); f.rect(x, y - 12, 22, 2, C('#93c5fd')); f.rect(x, y - 2, 22, 2, C('#1e3a8a')); f.rect(x - 1, y - 15, 24, 3, C('#f8fafc')); f.rect(x + 8, y - 17, 6, 2, C('#e2e8f0')); f.rect(x + 23, y, 6, 2, C('#c9b07a')) }
function grass(f, x, y, n, seed) { for (let i = 0; i < n; i++) { const X = x + i * 2 + Math.round(hash(i, seed) * 2), h = 4 + Math.round(hash(i + 7, seed) * 6); for (let k = 0; k < h; k++) f.set(X + Math.round(k * (hash(i, seed + 1) - .5) * .6), y - k, C(k > h - 2 ? '#bef264' : k % 2 ? '#65a30d' : '#84cc16')) } }

// ---------------------------------------------------------------- Kulissen
scene('sport-frisbee', VW, VH, (f) => { vista(f, 280) })
// das Ufer vorne links, das in Weitwurf mit der Kamera mitläuft (Welt 0–46 × 138–216)
scene('sport-ufer', 92, 156, (f) => {
  for (let y = 0; y < 156; y++) for (let x = 0; x < 88; x++) { const n = vn2(x * .3, y * .4, 9); f.set(x, y, C(y < 3 ? '#c9b07a' : n > .62 ? SAND[0] : n < .3 ? SAND[2] : SAND[1])) }
  for (let x = 0; x < 88; x++) if (hash(Math.floor(x / 3), 4) > .25) f.set(x, 0, C('#ffffff'))
  // Holzkante zum Wasser mit Pfosten
  for (let y = 0; y < 156; y++) { f.rect(80, y, 12, 1, C(y % 18 === 0 ? WOOD[3] : WOOD[1])); f.set(80, y, C(WOOD[0])); f.set(91, y, C(WOOD[4])) }
  for (const y of [6, 60, 114]) { f.rect(82, y, 8, 6, C(WOOD[3])); f.rect(83, y + 1, 3, 2, C(WOOD[0])) }
  grass(f, 4, 40, 6, 3); grass(f, 30, 120, 5, 4)
})
scene('sport-bogen', VW, VH, (f) => {
  vista(f, 240)
  beach(f, 300, 0, VW, 2)
  // Dünengras und ein Windsack am Mast
  grass(f, 120, 330, 10, 5); grass(f, 560, 340, 12, 6); grass(f, 20, 400, 8, 7)
  f.rect(640, 230, 2, 80, C('#e5e7eb')); f.rect(641, 230, 1, 80, C('#94a3b8'))
  for (let i = 0; i < 22; i++) f.rect(642 + i, 232 + Math.round(i * .15), 1, 10 - Math.round(i * .25), C(Math.floor(i / 5) % 2 ? '#f8fafc' : '#ef4444'))
  for (const [x, h, l, s] of [[60, 120, 1, 1], [700, 140, -1, 2], [140, 80, 1, 3]]) bigPalm(f, x, 306, h, l, s)
  towel(f, 470, 380, '#38bdf8', '#f8fafc'); cooler(f, 520, 378)
})
scene('sport-volley', VW, VH, (f) => {
  vista(f, 220)
  beach(f, 300, 0, VW, 3)
  for (const [x, h, l, s] of [[40, 100, 1, 4], [720, 116, -1, 5]]) bigPalm(f, x, 306, h, l, s)
  // Spielfeld: Seil als Linie, Ecken mit Pflöcken
  for (let x = 16; x < 752; x++) { f.set(x, 352, C('#f8fafc')); f.set(x, 353, C('#d9c08a')) }
  for (const x of [16, 750]) { f.rect(x - 1, 348, 4, 6, C(WOOD[3])); f.rect(x - 1, 348, 4, 1, C(WOOD[0])) }
  // Netz mit Pfosten, Band und Maschen
  for (const x of [372, 396]) { f.rect(x, 214, 4, 142, C('#475569')); f.rect(x, 214, 1, 142, C('#94a3b8')); f.ell(x + 2, 357, 5, 2, C('#c9b07a')) }
  for (let y = 220; y < 268; y++) for (let x = 376; x < 396; x++) if ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) f.set(x, y, C('#e2e8f0'))
  f.rect(372, 216, 28, 4, C('#f8fafc')); f.rect(372, 219, 28, 1, C('#cbd5e1')); f.rect(372, 266, 28, 2, C('#f8fafc'))
  towel(f, 90, 392, '#f472b6', '#fde68a'); cooler(f, 650, 410)
})
scene('sport-tt', VW, VH, (f) => {
  // Pavillon von oben: Holzboden, Rand mit Pflanzkübeln, der Tisch mit Schatten
  planks(f, 0, 0, VW, VH, 'v', ['#f6dcae', '#e7c389', '#d6ac6c', '#b98a4c', '#8c6431'], 16, 3)
  frame(f, 0, 0, VW, VH, C('#8c6431'), 6)
  for (const [x, y] of [[40, 40], [728, 40], [40, 392], [728, 392], [560, 216]]) {
    f.ell(x + 3, y + 3, 20, 20, C('#b98a4c')); f.ell(x, y, 18, 18, C('#c2410c')); f.ell(x, y, 15, 15, C('#9a3412'))
    palmTop(f, x, y, 20, x + y)
  }
  // Schatten, Rand, Platte mit Licht, Linien, Netz
  f.rect(266, 42, 256, 368, C('#b98a4c'))
  f.rect(256, 32, 256, 368, INK)
  for (let y = 36; y < 396; y++) for (let x = 260; x < 508; x++) { const k = (x - 260) / 248 + (y - 36) / 720; f.set(x, y, C(k < .35 ? '#1593b3' : k < .9 ? '#0e7490' : '#0b5f78')) }
  for (let i = 0; i < 60; i++) f.rect(262 + hash(i, 41) * 240, 40 + hash(i, 42) * 350, 1, 1, C('#38b2cf'))
  f.rect(260, 36, 248, 2, C('#f8fafc')); f.rect(260, 394, 248, 2, C('#f8fafc')); f.rect(260, 36, 2, 360, C('#f8fafc')); f.rect(506, 36, 2, 360, C('#f8fafc')); f.rect(383, 36, 2, 360, C('#f8fafc'))
  f.rect(252, 212, 264, 6, C('#e2e8f0')); f.rect(252, 212, 264, 1, C('#ffffff')); f.rect(252, 217, 264, 1, C('#64748b'))
  for (let x = 256; x < 512; x += 3) f.rect(x, 213, 1, 4, C('#94a3b8'))
  for (const x of [248, 512]) { f.rect(x, 208, 8, 14, C('#334155')); f.rect(x, 208, 8, 2, C('#64748b')) }
  // Ballkorb und Tafel für den Spielstand links
  f.ell(640, 360, 16, 12, C('#7c2d12')); f.ell(640, 358, 13, 9, C('#a16207')); for (let i = 0; i < 9; i++) f.ell(632 + (i % 3) * 7, 354 + Math.floor(i / 3) * 4, 2, 2, C(i % 2 ? '#ffffff' : '#fb923c'))
  f.rect(70, 170, 118, 84, C('#5b3a1a')); f.rect(74, 174, 110, 76, C('#f8fafc')); f.rect(74, 174, 110, 3, C('#ffffff')); f.rect(74, 247, 110, 3, C('#cbd5e1'))
})
scene('sport-bowling', VW, VH, (f) => {
  // Sand von oben, Palmen von oben, die Bahn mit Rinnen, Pfeilen und Foullinie
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) f.set(x, y, sandAt(x, y, 51))
  for (const [x, y, r] of [[80, 330, 40], [688, 90, 46], [150, 70, 30], [610, 360, 34]]) palmTop(f, x, y, r, x)
  f.rect(300, 0, 184, VH, C('#c4a065'))
  f.rect(292, 0, 184, VH, C('#57301a'))
  f.rect(292, 0, 12, VH, C('#3f2a1a')); f.rect(464, 0, 12, VH, C('#3f2a1a'))
  for (let y = 0; y < VH; y++) { f.set(293, y, C('#6b4423')); f.set(465, y, C('#6b4423')); f.set(303, y, C('#1c1209')); f.set(475, y, C('#1c1209')) }
  planks(f, 304, 0, 160, VH, 'v', ['#f3d29b', '#e3b877', '#d4a35f', '#b8864a', '#8c6431'], 8, 7)
  // Pin-Deck oben heller, Glanz in der Bahnmitte
  for (let y = 0; y < 150; y++) for (let x = 304; x < 464; x++) if (f.get(x, y) === C('#e3b877')) f.set(x, y, C('#ecc78d'))
  for (let y = 0; y < VH; y += 2) { f.set(380, y, C('#fbe3b6')); f.set(388, y + 1, C('#fbe3b6')) }
  for (let i = -2; i <= 2; i++) { const x = 384 + i * 20, y = 300 - Math.abs(i) * 8; f.poly([[x - 3, y + 8], [x, y], [x + 3, y + 8]], C('#7c2d12')); f.set(x, y + 1, C('#fca5a5')) }
  for (let i = 0; i < 7; i++) f.ell(320 + i * 22, 340, 1, 1, C('#7c2d12'))
  f.rect(304, 372, 160, 2, C('#ef4444')); f.rect(304, 374, 160, 1, C('#991b1b'))
  // Ballrücklauf links (rechts steht im Spiel der Hinweis)
  f.rect(252, 300, 26, 110, C('#334155')); f.rect(255, 303, 20, 104, C('#1e293b')); for (const [y, c] of [[320, '#22c55e'], [346, '#3b82f6'], [372, '#ef4444']]) { f.ell(265, y, 8, 8, C(c)); f.set(262, y - 4, C('#ffffff')); f.set(263, y - 4, C('#ffffff')) }
})
// Jetski: senkrecht kachelbares Wasser mit Sandufern links und rechts; das Spiel schiebt es nach unten
scene('sport-jetski', VW, VH, (f) => {
  const P = Math.PI * 2 / VH, cols = ['#5ad7cf', '#45c8c8', '#36b6be', '#2aa3b2'].map(C)
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
    const v = .5 + .22 * Math.sin(y * P * 3 + x * .021) + .18 * Math.sin(y * P * 5 - x * .013 + 1) + .1 * Math.sin(y * P * 11 + x * .05)
    let i = Math.max(0, Math.min(3, Math.floor(v * 4))); const fr = v * 4 - i
    if (fr > .75 && (x + y) % 2) i = Math.min(3, i + 1)
    f.set(x, y, cols[i])
  }
  for (let i = 0; i < 90; i++) { const x = 40 + hash(i, 61) * 690, y = Math.floor(hash(i, 62) * VH), n = 6 + hash(i, 63) * 14; for (let k = 0; k < n; k++) f.set(x + k, (y + Math.round(Math.sin(k * .5) * 1)) % VH, C(k % 5 ? '#e0fffa' : '#b8f3ec')) }
  for (const side of [0, 1]) for (let y = 0; y < VH; y++) {
    const w = 26 + Math.round(3 * Math.sin(y * P * 2 + side * 2) + 2 * Math.sin(y * P * 7 + side))
    for (let k = 0; k < w; k++) { const x = side ? VW - 1 - k : k, n = vn2(x * .3, y * .3, 64 + side); f.set(x, y, C(k > w - 3 ? '#c9b07a' : n > .6 ? SAND[0] : SAND[1])) }
    for (let k = 0; k < 3; k++) if (hash(Math.floor(y / 3) + k * 99, 65 + side) > .2) f.set(side ? VW - w - k : w + k, y, C(k ? '#e6fffb' : '#ffffff'))
  }
})
scene('sport-surf', VW, VH, (f) => { vista(f, 112, { sun: false }) })

// ---------------------------------------------------------------- Inselkarte von oben
// Dieselbe Geometrie wie im Spiel (isleR, isleAt, LANDMARKS in js/fischen.js); 1 Pixel = 1 Kartenpixel (1152×648).
const MW = 1152, MH = 648
const BAY_ANG = [Math.PI / 2, 0, -Math.PI / 4, Math.PI, -Math.PI / 2]
const isleR = (a) => 300 + 40 * Math.sin(a * 3 + 1) + 22 * Math.sin(a * 5 + 2) + 14 * Math.sin(a * 9) - BAY_ANG.reduce((s, b) => { let d = Math.abs(a - b); d = Math.min(d, Math.PI * 2 - d); return s + Math.max(0, 70 - d * 260) }, 0)
const isleAt = (bay, da, k) => { const a = BAY_ANG[bay - 1] + da, R = isleR(a) * k; return [MW / 2 + Math.cos(a) * R * 1.2, MH / 2 + Math.sin(a) * R * .8] }
const MARKS = [[1, 0, .97], [1, -.35, .92], [1, .3, 1.08], [1, .55, .8], [1, -.6, .75], [1, .12, .55], [2, 0, 1.12], [2, .3, 1.02], [2, -.3, 1.05], [2, .5, .85], [2, -.12, .7], [2, .15, .45],
  [3, 0, 1.12], [3, .35, .9], [3, -.3, .9], [3, .1, 1.0], [3, -.1, .62], [3, .25, .5], [4, 0, .95], [4, .3, 1.02], [4, -.32, .88], [4, .5, .72], [4, -.12, .6], [4, .15, .38],
  [5, 0, 1.25], [5, .32, 1.0], [5, -.3, .95], [5, .12, .32], [5, -.12, .18], [5, .5, .6]].map(([b, d, k]) => isleAt(b, d, k).map(Math.round))
const cx = MW / 2, cy = MH / 2
const coastAt = (a, k) => [cx + Math.cos(a) * isleR(a) * 1.2 * k, cy + Math.sin(a) * isleR(a) * .8 * k]
const nearMark = (x, y, r, skip = []) => MARKS.some((p, i) => !skip.includes(i) && Math.hypot(p[0] - x, p[1] - y) < r)
const riverY = (xx) => cy + Math.sin((cx - xx) * .025) * 16 + (cx - xx) * .04
// Lage eines Kartenpunkts: e = Abstand zur Küste (+ an Land), h = 0 Gipfel … 1 Küste
function geo(xx, yy) { const dx = (xx - cx) / 1.2, dy = (yy - cy) / .8, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), R = isleR(a); return { e: R - r, h: r / R, r } }
const height = (xx, yy) => { const g = geo(xx, yy); if (g.e <= 0) return 0; return Math.pow(1 - g.h, 1.3) * 60 + (vn2(xx * .02, yy * .02, 71) - .5) * 12 + (vn2(xx * .045, yy * .045, 73) - .5) * 5 + (vn2(xx * .07, yy * .07, 72) - .5) * 5 - (g.r < 34 ? (34 - g.r) * 1.2 : 0) }

const OCEAN = ['#2fa9c4', '#2696b6', '#1e84a6', '#187394', '#136383', '#0f5472']
const SHALLOW = ['#9af0e2', '#7fe6da', '#64d9d0', '#4fcbc8']
const JUNGLE = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d']
const MEADOW = ['#bef264', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f']
const ROCK = ['#d6d3d1', '#a8a29e', '#8a8580', '#6b6560', '#4f4a45']

function paintMap(f, s, detail) {
  const W2 = Math.round(MW * s), H2 = Math.round(MH * s), at = (X, Y) => [X / s, Y / s]
  for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) {
    const [xx, yy] = at(X, Y), g = geo(xx, yy), n = vn2(X * .5, Y * .5, 70)
    let c
    if (g.e < 0) {
      const d = -g.e
      if (d < 3 / s * .34 && hash(Math.floor(X / 2) * 7 + Y, 73) > .3) c = '#ffffff' // Brandung
      else if (d < 44) { const k = d / 44 + (n - .5) * .25; c = SHALLOW[Math.max(0, Math.min(3, Math.floor(k * 4)))]; if (d > 30 && (X + Y) % 2 && n > .5) c = OCEAN[0]; if (detail && d > 4 && d < 34 && d < 26 && Math.abs(vn2(X * .07, Y * .1, 96) - .5) < .012 && (X + Y) % 2) c = '#c4f7ee' }
      else { const k = Math.min(1, (d - 44) / 240) + (vn2(X * .03, Y * .03, 74) - .5) * .18; c = OCEAN[Math.max(0, Math.min(5, Math.floor(k * 6)))] }
    } else if (g.e < 3) c = '#e3c98f'
    else if (g.e < 10) c = n > .6 ? SAND[0] : n < .25 ? SAND[2] : SAND[1]
    else {
      // Höhenlicht von links oben aus dem Höhenfeld
      const e2 = detail ? .7 : 1.5, sh = (height(xx - e2, yy - e2) - height(xx + e2, yy + e2)) * (detail ? 1.2 : .7)
      const tone = (pal, base) => pal[Math.max(0, Math.min(pal.length - 1, base - Math.round(sh) + (detail ? (n > .7 ? -1 : n < .2 ? 1 : 0) : 0)))]
      g.h += (vn2(xx * .05, yy * .05, 82) - .5) * .08 + (detail && (X + Y) % 2 ? .006 : 0)
      if (g.r < 18) c = g.r < 14 ? (n > .55 ? '#5eead4' : '#2dd4bf') : '#0f766e'
      else if (g.r < 34) c = tone(ROCK, 2)
      else if (g.h < .22) c = tone(ROCK, 1)
      else if (g.h < .42) c = tone(MEADOW, 2)
      else c = tone(JUNGLE, 3)
      if (xx < cx - 30 && Math.abs(yy - riverY(xx)) < 2.5 + (cx - xx) / 140) c = Math.abs(yy - riverY(xx)) < 1.5 + (cx - xx) / 200 ? (hash(X + Y * 3, 75) > .8 ? '#e0f2fe' : '#7dd3fc') : '#38bdf8'
    }
    f.set(X, Y, C(c))
  }
  // Wellenstriche im tiefen Wasser
  for (let i = 0; i < 260 * s; i++) { const X = hash(i, 76) * W2, Y = hash(i, 77) * H2, g = geo(X / s, Y / s); if (g.e > -60) continue; for (let k = 0; k < 6 * s + 2; k++) f.set(X + k, Y + Math.round(Math.sin(k * .9)), C(k % 3 ? '#5cc4d8' : '#8ad8e6')) }
  // Ringstraße (Winkel −π…π: isleR kennt nur diesen Bereich) und Pfad zum Krater
  if (detail) for (let i = 0; i < 1800; i++) {
    const a = i / 1800 * Math.PI * 2 - Math.PI, [X, Y] = coastAt(a, .82)
    if (geo(X, Y).e < 4) continue
    f.rect(X - 1, Y - 1, 3, 3, C('#e8d3a0')); f.set(X + 1, Y + 1, C('#b99a62')); if (hash(i, 99) > .93) f.set(X, Y, C('#c9ab72'))
  }
  for (let i = 0; i < 120; i++) { const k = .2 + i / 120 * .6, a = BAY_ANG[0] + Math.sin(i * .25) * .12, X = (cx + Math.cos(a) * isleR(a) * 1.2 * k) * s, Y = (cy + Math.sin(a) * isleR(a) * .8 * k) * s; if (i % 3) f.set(X, Y, C('#d6b97a')) }
  // Baumkronen im Dschungel: runde Tupfen mit Licht oben links
  const blobs = detail ? 1400 : 0
  for (let i = 0; i < blobs; i++) {
    const xx = hash(i, 78) * MW, yy = hash(i, 79) * MH, g = geo(xx, yy)
    if (g.e < 14 || g.h + (hash(i, 83) - .5) * .12 < .42 || g.r < 40) continue
    if (xx < cx - 30 && Math.abs(yy - riverY(xx)) < 8 + (cx - xx) / 140) continue
    const r = 3 + Math.round(hash(i, 80) * 3)
    f.ell(xx + 1, yy + 2, r, r - 1, C(JUNGLE[5])); f.ell(xx, yy, r, r - 1, C(JUNGLE[3])); f.ell(xx - 1, yy - 1, r - 2, r - 2, C(JUNGLE[2])); f.set(xx - 2, yy - 2, C(JUNGLE[0]))
  }
  // Palmen an der Küste
  for (let i = 0; i < 90; i++) {
    const a = i / 90 * Math.PI * 2 - Math.PI, k = .88 + hash(i, 81) * .06, xx = cx + Math.cos(a) * isleR(a) * 1.2 * k, yy = cy + Math.sin(a) * isleR(a) * .8 * k
    if (detail) palmTop(f, Math.round(xx), Math.round(yy), 6, i); else { f.set(xx * s, yy * s, C(JUNGLE[3])); f.set(xx * s - 1, yy * s, C(JUNGLE[1])) }
  }
  if (!detail) return miniAreas(f, s)
  areas(f)
  props(f)
}
// kleine Hilfen für Gebäude von oben
function roof(f, x, y, w, h, a, b) { f.rect(x + 2, y + 2, w, h, C('#3f6212')); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) f.set(x + i, y + j, C(j < h / 2 ? (i % 3 ? a : '#fff7d1') : b)); f.rect(x, y + Math.floor(h / 2), w, 1, C('#78350f')) }
function wood(f, x, y, w, h) { planks(f, x, y, w, h, 'h', WOOD, 3, x + y) }
function props(f) {
  const L = (i) => MARKS[i]
  { const [X, Y] = L(0); f.ell(X, Y, 16, 8, C(SAND[0])); f.ell(X, Y, 5, 4, C('#94a3b8')); f.ell(X, Y, 3, 2, C('#38bdf8')); f.set(X - 1, Y - 1, C('#e0f2fe')) } // Strandplatz mit Brunnen
  { const [X, Y] = L(1); for (let i = 0; i < 5; i++) roof(f, X - 22 + i * 9, Y - 5 + (i % 2) * 4, 7, 6, '#e9c77b', '#c79a4a') } // Hüttendorf
  { const [X, Y] = L(2); wood(f, X - 3, Y - 22, 6, 36); for (let y = Y - 22; y < Y + 14; y += 6) { f.set(X - 4, y, C(WOOD[4])); f.set(X + 3, y, C(WOOD[4])) } } // Langer Steg
  { const [X, Y] = L(3); f.rect(X - 13, Y - 8, 26, 16, C(MEADOW[1])); frame(f, X - 13, Y - 8, 26, 16, C('#f8fafc'), 1); f.ell(X, Y, 3, 3, C('#f97316')) } // Frisbeewiese
  { const [X, Y] = L(4); wood(f, X - 11, Y - 6, 22, 12); f.rect(X - 11, Y - 7, 22, 2, C('#ef4444')); f.rect(X - 4, Y - 2, 8, 3, C('#fde047')) } // Turnierbühne
  { const [X, Y] = L(5); for (let i = 0; i < 6; i++) palmTop(f, X - 12 + (i % 3) * 12, Y - 6 + Math.floor(i / 3) * 12, 5, i + 20) } // Palmenhain
  { const [X, Y] = L(6); for (let i = 0; i < 40; i++) f.ell(X - 22 + hash(i, 90) * 44, Y - 12 + hash(i, 91) * 24, 1, 1, C(['#f472b6', '#fb923c', '#a78bfa', '#facc15'][i % 4])) } // Korallenriff
  { const [X, Y] = L(7); for (let i = 0; i < 4; i++) { f.ell(X - 8 + i * 5, Y + (i % 2) * 3, 1, 1, C('#f97316')); f.set(X - 8 + i * 5, Y - 1 + (i % 2) * 3, C('#ffffff')) } } // Schnorchelplatz
  { const [X, Y] = L(8); wood(f, X - 8, Y - 3, 16, 6); for (const d of [-6, 3]) { f.rect(X + d, Y + 5, 5, 3, C('#e11d48')); f.set(X + d + 1, Y + 5, C('#fda4af')) } } // Jetski-Start
  { const [X, Y] = L(9); for (let i = 0; i < 4; i++) { const c = ['#f97316', '#38bdf8', '#facc15', '#f472b6'][i]; f.rect(X - 9 + i * 5, Y - 6, 3, 12, C(c)); f.rect(X - 9 + i * 5, Y - 6, 1, 12, C('#ffffff')) } } // Surfstrand
  { const [X, Y] = L(10); for (const [dx, dy] of [[-6, 0], [5, 3]]) { f.ell(X + dx, Y + dy, 3, 2, C('#4d7c0f')); f.set(X + dx - 1, Y + dy - 1, C('#a3e635')); f.set(X + dx + 3, Y + dy, C('#65a30d')) } } // Schildkrötenbucht
  { const [X, Y] = L(11); for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { f.ell(X - 12 + i * 5, Y - 8 + j * 5, 1, 1, C('#166534')); f.set(X - 12 + i * 5, Y - 9 + j * 5, C('#4ade80')); f.set(X - 11 + i * 5, Y - 7 + j * 5, C('#b91c1c')) } } // Kaffeeplantage
  { const [X, Y] = L(12); for (let i = 0; i < 10; i++) { f.ell(X - 40 + i * 9, Y + Math.round(Math.sin(i) * 10), 1, 1, C(i % 2 ? '#ef4444' : '#facc15')); f.set(X - 41 + i * 9, Y - 1 + Math.round(Math.sin(i) * 10), C('#ffffff')) } } // Bojenparcours
  { const [X, Y] = L(13); for (const d of [-10, 0, 10]) { f.ell(X + d, Y, 4, 4, C('#f8fafc')); f.ell(X + d, Y, 3, 3, C('#3b82f6')); f.ell(X + d, Y, 1, 1, C('#ef4444')) } } // Bogenwiese
  { const [X, Y] = L(14); f.rect(X - 12, Y - 7, 24, 14, C(SAND[1])); frame(f, X - 12, Y - 7, 24, 14, C('#f8fafc'), 1); f.rect(X, Y - 8, 1, 16, C('#475569')) } // Volleyballfeld
  { const [X, Y] = L(15); roof(f, X - 9, Y - 7, 18, 10, '#f43f5e', '#be123c'); wood(f, X - 4, Y + 3, 8, 6) } // Bootshaus
  { const [X, Y] = L(16); f.poly([[X - 3, Y + 8], [X - 2, Y - 6], [X + 2, Y - 6], [X + 3, Y + 8]], C('#eab308')); f.rect(X - 2, Y - 6, 1, 14, C('#fde047')) } // Sprungschanze
  { const [X, Y] = L(17); f.rect(X - 3, Y - 3, 6, 6, C(WOOD[3])); f.rect(X - 4, Y - 5, 8, 3, C(SAND[0])); f.rect(X - 4, Y - 5, 8, 1, C('#ffffff')) } // Aussichtsturm
  { const [X, Y] = L(18); for (let i = 0; i < 26; i++) { f.rect(X - 2 + Math.round(Math.sin(i) * 1.5), Y - 26 + i, 5, 1, C(i % 3 ? '#e0f2fe' : '#ffffff')) } f.ell(X - 2, Y + 8, 16, 7, C('#5eead4')); f.ell(X - 2, Y + 7, 10, 3, C('#ccfbf1')) } // Wasserfall
  { const [X, Y] = L(19); for (let i = 0; i < 14; i++) { f.ell(X - 14 + hash(i, 92) * 28, Y - 8 + hash(i, 93) * 16, 3, 2, C(JUNGLE[4])); f.set(X - 14 + hash(i, 92) * 28, Y - 9 + hash(i, 93) * 16, C(JUNGLE[2])) } } // Mangroven
  { const [X, Y] = L(20); roof(f, X - 10, Y - 7, 20, 14, '#f8fafc', '#cbd5e1'); f.rect(X - 6, Y - 3, 12, 7, C('#0e7490')); f.rect(X, Y - 3, 1, 7, C('#f8fafc')) } // Tischtennis-Pavillon
  { const [X, Y] = L(21); for (const d of [-5, 3]) { f.rect(X + d, Y - 12, 4, 24, C(WOOD[1])); f.set(X + d + 1, Y - 11, C('#ffffff')) } } // Strandbowling
  { const [X, Y] = L(22); for (let i = 0; i < 14; i++) { const yy = Y + Math.round(Math.sin(i / 13 * Math.PI) * 3); f.rect(X - 14 + i * 2, yy, 2, 2, C(i % 2 ? WOOD[2] : WOOD[1])) } } // Hängebrücke
  { const [X, Y] = L(23); f.ell(X, Y, 5, 4, C('#7dd3fc')); f.ell(X - 1, Y - 1, 2, 1, C('#e0f2fe')) } // Flussquelle
  { const [X, Y] = L(24); f.ell(X, Y + 2, 18, 11, C(SAND[1])); f.ell(X, Y + 2, 18, 11, (x, y) => geo(x, y).e < -1 ? (y > Y + 8 ? C('#ffffff') : C(SAND[(x + y) % 3 ? 1 : 0])) : C(SAND[1])); f.rect(X - 3, Y - 9, 6, 6, C('#eab308')); f.rect(X - 2, Y - 12, 4, 3, C('#fde047')); f.rect(X - 4, Y - 3, 8, 3, C('#a16207')); f.set(X - 2, Y - 8, C('#fffbeb')) } // Pokalinsel
  { const [X, Y] = L(25); f.ell(X, Y, 4, 4, C('#f8fafc')); f.ell(X, Y, 3, 3, C('#ef4444')); f.ell(X, Y, 1, 1, C('#fde047')) } // Leuchtturm
  { const [X, Y] = L(26); for (const [dx, h0, c0] of [[-7, 4, '#94a3b8'], [0, 7, '#facc15'], [7, 2, '#b45309']]) { f.rect(X + dx - 3, Y - h0, 6, h0 + 2, C(c0)); f.rect(X + dx - 3, Y - h0, 6, 1, C('#ffffff')) } } // Siegertreppe
  { const [X, Y] = L(29); for (let i = 0; i < 34; i++) { const x = X - 18 + hash(i, 94) * 36, y = Y - 12 + hash(i, 95) * 24; f.ell(x, y, 2, 1, C(i % 3 ? '#44403c' : '#ea580c')); if (i % 3 === 0) f.set(x, y, C('#fde047')) } } // Lavafelder
}
// ---------------------------------------------------------------- Orte zwischen den Aussichtspunkten
// Alles hier liegt in freien Flächen; MARKS bleiben, wo sie sind. Licht kommt von links oben, Schatten fallen nach rechts unten.
const ROOFS = { terra: ['#f59e6b', '#dc6a42', '#a3412a'], ocker: ['#f8d27c', '#de9f45', '#9c6526'], blau: ['#9cc3e6', '#6a92c2', '#41618f'],
  weiss: ['#ffffff', '#e5e9f0', '#9aa7b8'], tuerkis: ['#86e0cc', '#40ad9c', '#25716a'], stroh: ['#f3d58e', '#d6ac5c', '#9b7433'] }
function shadow(f, x, y, w, h, a = .42, to = '#0d2a1c') { const t = C(to); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = f.get(x + i, y + j); if (v >= 0) f.set(x + i, y + j, mixI(v, t, a)) } }
function shadowEll(f, x, y, rx, ry, a = .38) { const t = C('#0d2a1c'); f.ell(x, y, rx, ry, (X, Y) => { const v = f.get(X, Y); return v >= 0 ? mixI(v, t, a) : t }) }
// Haus von schräg oben: Dach mit Lichtseite, First, Traufe und 2 Pixel Hauswand mit Fenstern
function house(f, x, y, w, h, pal, seed = 1, wall = '#f6eedf') {
  x = Math.round(x); y = Math.round(y)
  shadow(f, x + 2, y + 2, w + 1, h + 2)
  const vert = h > w + 2
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const lit = vert ? i < w / 2 : j < h / 2, row = vert ? i : j
    let c = lit ? pal[0] : pal[1]
    if (row % 2 === 1 && (vert ? j : i) % 3 === (row % 4 === 1 ? 0 : 1)) c = lit ? pal[1] : pal[2]
    f.set(x + i, y + j, C(c))
  }
  if (vert) f.rect(x + Math.floor(w / 2), y, 1, h, C(mixI(C(pal[0]), C('#ffffff'), .5) === 0 ? pal[0] : hx(mixI(C(pal[0]), C('#ffffff'), .45))))
  else f.rect(x, y + Math.floor(h / 2) - 1, w, 1, C(hx(mixI(C(pal[0]), C('#ffffff'), .45))))
  f.rect(x + w - 1, y, 1, h, C(pal[2]))
  f.rect(x, y + h, w, 2, C(wall)); f.rect(x, y + h + 1, w, 1, C(hx(mixI(C(wall), C('#000000'), .18))))
  for (let i = 1 + (seed % 2); i < w - 1; i += 3) f.set(x + i, y + h, C('#3d6ea8'))
  if (w > 6) f.rect(x + Math.floor(w / 2), y + h, 1, 2, C('#7c4a24'))
  if (hash(seed, 101) > .55) { const k = x + 1 + Math.floor(hash(seed, 102) * (w - 3)); f.rect(k, y + 1, 1, 2, C('#6b625a')); f.set(k, y, C('#a8a29e')) }
}
function flatRoof(f, x, y, w, h, seed = 1) { // Flachdach mit Brüstung (Hotel, Hangar-Büro)
  shadow(f, x + 3, y + 3, w, h + 2, .45)
  f.rect(x, y, w, h, C('#e2e8f0')); f.rect(x + 1, y + 1, w - 2, h - 2, C('#cbd5e1'))
  for (let j = 2; j < h - 2; j++) for (let i = 2; i < w - 2; i++) if (h2(i + x, j + y, seed) > .93) f.set(x + i, y + j, C('#b6c2d1'))
  f.rect(x, y, w, 1, C('#ffffff')); f.rect(x, y, 1, h, C('#ffffff'))
  f.rect(x, y + h, w, 3, C('#f8fafc')); for (let i = 1; i < w - 1; i += 2) { f.set(x + i, y + h, C('#7dd3fc')); f.set(x + i, y + h + 1, C('#38bdf8')) }
  f.rect(x, y + h + 2, w, 1, C('#94a3b8'))
}
function tree(f, x, y, r = 3, pal = JUNGLE, fruit) {
  shadowEll(f, x + 2, y + 2, r, r - 1, .4)
  f.ell(x, y, r, r - 1, C(pal[3])); f.ell(x - 1, y - 1, r - 1, r - 2, C(pal[2])); f.set(x - 1, y - 2, C(pal[0])); f.set(x - 2, y - 1, C(pal[1]))
  if (fruit) for (let k = 0; k < 3; k++) f.set(x - 1 + k, y + (k % 2), C(fruit))
}
function road(f, pts, w = 3, col = '#e8d3a0', edge = '#b99a62') {
  for (let k = 0; k + 1 < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; f.line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, C(edge), w); }
  for (let k = 0; k + 1 < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; f.line(x0, y0, x1, y1, C(col), w) }
}
function clearing(f, x, y, rx, ry, pal, seed) { // gemähte Fläche mit ausgefranstem Rand
  for (let j = -ry - 3; j <= ry + 3; j++) for (let i = -rx - 3; i <= rx + 3; i++) {
    const d = Math.hypot(i / rx, j / ry) + (vn2((x + i) * .2, (y + j) * .2, seed) - .5) * .25
    if (d > 1 || geo(x + i, y + j).e < 6) continue
    f.set(x + i, y + j, C(pal[(Math.floor((x + i + (y + j) * .3) / 3) % 2) + (d > .9 && (i + j) % 2 ? 2 : 0)]))
  }
}
const LAWN = ['#a8de6a', '#9bd35c', '#7fbf45', '#6fae3a']
function umbrellaTop(f, x, y, a, b) {
  shadowEll(f, x + 2, y + 2, 3, 2, .35)
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { if (i * i + j * j > 10) continue; const s = Math.floor((Math.atan2(j, i) + Math.PI) / (Math.PI / 3)) % 2; f.set(x + i, y + j, C(s ? a : b)) }
  f.set(x - 1, y - 2, C('#ffffff')); f.set(x, y, C('#ffffff'))
}
function boat(f, x, y, dir, kind = 'segel', col = '#ef4444', wake = true) { // von oben, dir = Fahrtrichtung in Bogenmaß
  const ux = Math.cos(dir), uy = Math.sin(dir), px_ = -uy, py_ = ux
  // Kielwasser: zwei Schaumlinien, die hinter dem Boot auseinanderlaufen
  const L = kind === 'faehre' ? 34 : kind === 'motor' ? 26 : 16
  if (wake) for (let t = 4; t < L; t++) for (const sd of [-1, 1]) { const wv = 1 + t * .22, X = x - ux * t + px_ * wv * sd, Y = y - uy * t + py_ * wv * sd; if (hash(t * 3 + sd, 103) > t / L * .9) f.set(X, Y, C(t < 8 ? '#ffffff' : '#bfeef5')) }
  const len = kind === 'faehre' ? 9 : kind === 'motor' ? 4 : 5, wd = kind === 'faehre' ? 3 : 2
  for (let t = -len; t <= len; t++) for (let k = -wd; k <= wd; k++) {
    const taper = t > len - 3 ? (len - t) / 3 : 1; if (Math.abs(k) > wd * taper + .3) continue
    const X = x + ux * t + px_ * k, Y = y + uy * t + py_ * k
    f.set(X + 1, Y + 1, C('#0e5e7a'))
  }
  for (let t = -len; t <= len; t++) for (let k = -wd; k <= wd; k++) {
    const taper = t > len - 3 ? (len - t) / 3 : 1; if (Math.abs(k) > wd * taper + .3) continue
    const X = x + ux * t + px_ * k, Y = y + uy * t + py_ * k
    f.set(X, Y, C(Math.abs(k) >= wd * taper - .5 ? col : k * py_ + k * px_ < 0 ? '#ffffff' : '#e2e8f0'))
  }
  if (kind === 'segel') { for (let t = -3; t <= 3; t++) for (let k = 0; k <= 3 - Math.abs(t) * .7; k++) f.set(x + ux * t + px_ * (k + 1), y + uy * t + py_ * (k + 1), C(k > 1 ? '#f8fafc' : '#ffffff')); f.set(x, y, C('#78350f')) }
  if (kind === 'faehre') { for (let t = -4; t <= 3; t++) for (let k = -1; k <= 1; k++) f.set(x + ux * t + px_ * k, y + uy * t + py_ * k, C(k < 0 ? '#fde68a' : '#facc15')); f.set(x + ux * 5, y + uy * 5, C('#1e3a8a')) }
  if (kind === 'motor') f.set(x + ux * -1, y + uy * -1, C('#1e293b'))
}
function rocks(f, x, y, n, seed) {
  for (let i = 0; i < n; i++) {
    const X = x + (hash(i, seed) - .5) * 18, Y = y + (hash(i, seed + 1) - .5) * 10, r = 1 + Math.round(hash(i, seed + 2) * 2.4)
    if (geo(X, Y).e < 0) f.ell(X, Y + 1, r + 1, r, C('#ffffff'))
    f.ell(X + 1, Y + 1, r, r, C('#4f4a45')); f.ell(X, Y, r, r, C('#8a8580')); f.ell(X - .5, Y - .5, Math.max(0, r - 1), Math.max(0, r - 1), C('#a8a29e')); f.set(X - r * .6, Y - r * .6, C('#d6d3d1'))
  }
}
function islet(f, x, y, rx, ry, seed) {
  f.ell(x, y, rx + 9, ry + 6, (X, Y) => C(SHALLOW[Math.max(0, Math.min(3, Math.floor(Math.hypot((X - x) / (rx + 9), (Y - y) / (ry + 6)) * 4 + (h2(X, Y, seed) - .5) * .6)))]))
  f.ell(x, y + 1, rx + 1, ry + 1, (X, Y) => hash(X * 3 + Y, seed) > .35 ? C('#ffffff') : C('#c4f7ee'))
  f.ell(x, y, rx, ry, (X, Y) => C(SAND[(h2(X, Y, seed) > .7 ? 0 : 1) + (Y > y + ry * .5 ? 1 : 0)]))
  palmTop(f, x - 1, y - 2, 5, seed); if (rx > 10) palmTop(f, x + rx * .45, y, 4, seed + 1)
}

function areas(f) {
  // --- Hafenstadt rund um den Strandplatz (Bucht 1)
  const [PX, PY] = MARKS[0]
  for (let j = -40; j <= 16; j++) for (let i = -110; i <= 110; i++) {
    const X = PX + i, Y = PY + j, d = Math.hypot(i / 104, (j + 14) / 30) + (vn2(X * .15, Y * .15, 104) - .5) * .25
    if (d > 1 || geo(X, Y).e < 7 || Math.hypot(X - MARKS[5][0], Y - MARKS[5][1]) < 22) continue
    f.set(X, Y, C(LAWN[(h2(X, Y, 105) > .6 ? 1 : 0) + (d > .92 && (X + Y) % 2 ? 2 : 0)]))
  }
  const town = (X, Y) => { const d = Math.hypot((X - PX) / 100, (Y - PY + 14) / 28); return d < .95 && geo(X, Y).e > 9 && Math.hypot(X - MARKS[5][0], Y - MARKS[5][1]) > 24 }
  const STREETS_X = [-74, -50, -26, 26, 50, 74], ST = '#d8c9a8', STE = '#a8916a'
  for (let i = -100; i <= 100; i++) for (const [yy, w] of [[-26, 2], [-8, 3]]) { const X = PX + i, Y = PY + yy; if (town(X, Y)) { f.rect(X, Y, 1, w, C(ST)); f.set(X, Y + w, C(STE)) } }
  for (const dx of STREETS_X) for (let j = -40; j <= 14; j++) { const X = PX + dx, Y = PY + j; if (town(X, Y)) { f.rect(X, Y, 2, 1, C(ST)); f.set(X + 2, Y, C(STE)) } }
  // Häuserblöcke
  const pals = [ROOFS.terra, ROOFS.terra, ROOFS.ocker, ROOFS.terra, ROOFS.blau, ROOFS.weiss, ROOFS.tuerkis]
  const rowsY = [[-40, -27], [-24, -17], [-17, -9], [-4, 5], [5, 14]]
  let seed = 0
  for (let b = 0; b + 1 < STREETS_X.length + 2; b++) {
    const xs = [-104, ...STREETS_X, 104], x0 = xs[b] + 3, x1 = xs[b + 1] - 2
    if (x1 - x0 < 6) continue
    for (const [y0, y1] of rowsY) {
      let x = x0
      while (x < x1 - 5) {
        const w = 5 + Math.floor(hash(++seed, 106) * 4), h = Math.max(3, Math.min(y1 - y0 - 3, 4 + Math.floor(hash(seed, 107) * 3)))
        const X = PX + x, Y = PY + y0
        if (x + w <= x1 && town(X, Y) && town(X + w, Y + h + 2) && !(Math.abs(X + w / 2 - PX) < 20 && Y > PY - 12)) house(f, X, Y, w, h, pals[Math.floor(hash(seed, 109) * pals.length)], seed)
        else if (town(X + 2, Y + 2) && hash(seed, 110) > .4) tree(f, X + 3, Y + 3, 3, LEAF.slice(1))
        x += w + 1 + (hash(seed, 111) > .85 ? 3 : 0)
      }
    }
  }
  // Rathaus mit Turm am Platz, Markt mit Ständen
  house(f, PX + 2, PY - 24, 16, 10, ROOFS.terra, 7)
  f.rect(PX + 4, PY - 31, 5, 8, C('#f6eedf')); f.rect(PX + 4, PY - 31, 5, 3, C('#2f8f83')); f.set(PX + 5, PY - 31, C('#7fe0cf')); f.rect(PX + 6, PY - 28, 1, 2, C('#1e293b')); shadow(f, PX + 9, PY - 29, 3, 7)
  for (let i = 0; i < 6; i++) { const X = PX - 24 + (i % 3) * 7, Y = PY - 22 + Math.floor(i / 3) * 6; shadow(f, X + 1, Y + 1, 5, 4); for (let k = 0; k < 5; k++) f.rect(X + k, Y, 1, 3, C(k % 2 ? '#ffffff' : ['#ef4444', '#f59e0b', '#3b82f6'][i % 3])); f.rect(X, Y + 3, 5, 1, C('#8b5a2b')) }
  // Hafen: Kaimauer im Buchtinneren, Stege, Boote, Fähre
  for (let a = BAY_ANG[0] - .3; a <= BAY_ANG[0] + .2; a += .002) {
    const [X, Y] = coastAt(a, 1.0); if (nearMark(X, Y, 12, [0])) continue
    f.rect(X - 1, Y - 3, 3, 3, C('#c9c2b6')); f.set(X, Y - 3, C('#ece7de')); f.rect(X - 1, Y, 3, 1, C('#5f5850'))
  }
  for (const [da, len] of [[-.07, 16], [-.16, 20], [-.24, 14], [.1, 12]]) {
    const [X, Y] = coastAt(BAY_ANG[0] + da, 1.0)
    shadow(f, X + 1, Y + 1, 3, len, .35, '#0b4a63'); planks(f, X - 1, Y, 3, len, 'v', WOOD, 3, X)
    for (let t = 6, k = 0; t < len + 2; t += 11, k++) { const sd = k % 2 ? -5 : 5; shadowEll(f, X + sd + 2, Y + t + 1, 2, 5, .3); boat(f, X + sd, Y + t, Math.PI / 2, 'motor', ['#ef4444', '#2563eb', '#f59e0b', '#10b981'][(t + len + k) % 4], false) }
  }
  { const [X, Y] = coastAt(BAY_ANG[0] - .05, 1.16); boat(f, X, Y, Math.PI * .62, 'faehre', '#1e3a8a') }

  // --- Ferienanlage an der Ostbucht (Bucht 2)
  { const X = 872, Y = 357
    clearing(f, X, Y, 30, 24, LAWN, 112)
    road(f, [[X - 30, Y - 4], [X - 52, Y - 14], [X - 80, Y - 6]], 2)
    f.rect(X - 14, Y + 1, 34, 16, C('#eedcb6')); for (let j = 0; j < 16; j++) for (let i = 0; i < 34; i++) if ((i + j) % 4 === 0) f.set(X - 14 + i, Y + 1 + j, C('#e2cc9f'))
    f.ell(X + 4, Y + 9, 11, 5, C('#f1f5f9')); f.ell(X - 5, Y + 11, 6, 4, C('#f1f5f9'))
    f.ell(X + 4, Y + 9, 10, 4, (x, y) => C((x + y * 2) % 7 === 0 ? '#bae6fd' : y < Y + 8 ? '#38bdf8' : '#0ea5e9')); f.ell(X - 5, Y + 11, 5, 3, (x, y) => C((x + y * 2) % 7 === 0 ? '#bae6fd' : '#38bdf8'))
    for (let i = 0; i < 6; i++) { f.rect(X - 12 + i * 5, Y + 2, 3, 1, C('#ffffff')); f.set(X - 12 + i * 5, Y + 2, C(['#f472b6', '#facc15', '#22d3ee'][i % 3])) }
    umbrellaTop(f, X + 18, Y + 4, '#f97316', '#ffffff'); umbrellaTop(f, X - 10, Y + 15, '#14b8a6', '#ffffff')
    flatRoof(f, X - 22, Y - 22, 40, 10, 113); flatRoof(f, X - 22, Y - 9, 10, 8, 114); flatRoof(f, X + 20, Y - 20, 8, 22, 115)
    for (let i = 0; i < 5; i++) tree(f, X - 28 + i * 3, Y + 18 + (i % 2) * 3, 2, LEAF.slice(1))
    palmTop(f, X + 26, Y + 10, 5, 116); palmTop(f, X - 27, Y - 4, 5, 117)
    // Wasserbungalows auf Stelzen in der Lagune
    const [BX, BY] = coastAt(BAY_ANG[1] + .12, 1.0)
    shadow(f, BX + 1, BY + 1, 34, 2, .35, '#0b4a63'); planks(f, BX - 2, BY - 1, 36, 2, 'h', WOOD, 3, 7)
    for (let i = 0; i < 5; i++) { const x = BX + 4 + i * 7, y = BY + (i % 2 ? 3 : -8); f.rect(x + 2, i % 2 ? y - 2 : y + 5, 1, 3, C(WOOD[2])); house(f, x, y, 6, 4, ROOFS.stroh, 30 + i, '#c08a4a') }
    for (let i = 0; i < 7; i++) { const [x, y] = coastAt(BAY_ANG[1] + .16 + i * .035, 1 - 7 / isleR(BAY_ANG[1] + .16 + i * .035)); umbrellaTop(f, x, y, ['#f43f5e', '#0ea5e9', '#facc15'][i % 3], '#ffffff') }
  }

  // --- Flugplatz im Nordwesten
  { const x0 = 352, x1 = 462, y = 172
    clearing(f, 407, 179, 62, 16, LAWN, 118)
    for (let i = x0; i <= x1; i++) for (let j = 0; j < 9; j++) f.set(i, y + j, C(j === 0 || j === 8 ? '#e5e7eb' : h2(i, j, 119) > .85 ? '#5b6573' : '#4b5563'))
    for (let i = x0 + 8; i < x1 - 8; i += 8) f.rect(i, y + 4, 4, 1, C('#f8fafc'))
    for (const e of [x0 + 2, x1 - 6]) for (let j = 2; j < 7; j += 2) f.rect(e, y + j, 4, 1, C('#f8fafc'))
    f.rect(404, y + 9, 3, 6, C('#6b7280')); f.rect(388, y + 14, 34, 7, C('#9ca3af')); f.rect(388, y + 14, 34, 1, C('#d1d5db'))
    shadow(f, 427, 189, 18, 11, .45)
    for (let j = 0; j < 9; j++) for (let i = 0; i < 16; i++) f.set(425 + i, 187 + j, C(i % 2 ? '#94a3b8' : j < 4 ? '#e2e8f0' : '#cbd5e1'))
    f.rect(425, 196, 16, 2, C('#64748b')); f.rect(430, 196, 6, 2, C('#1e293b'))
    f.rect(378, 184, 4, 4, C('#f8fafc')); f.rect(378, 184, 4, 2, C('#7dd3fc')); shadow(f, 382, 186, 2, 4)
    // geparktes Flugzeug von oben
    const plane = (X, Y) => { shadow(f, X - 3, Y + 1, 9, 2, .4); shadow(f, X + 2, Y - 1, 2, 9, .4); f.rect(X, Y - 3, 1, 9, C('#f8fafc')); f.rect(X - 4, Y, 9, 2, C('#f8fafc')); f.rect(X - 4, Y + 1, 9, 1, C('#e11d48')); f.rect(X - 1, Y + 5, 3, 1, C('#e11d48')); f.set(X, Y - 3, C('#38bdf8')) }
    plane(398, 188); plane(414, 188)
    f.rect(366, 170, 1, 2, C('#374151')); f.rect(367, 170, 3, 1, C('#f97316'))
    road(f, [[392, 198], [380, 214], [372, 236]], 2)
  }

  // --- Stadion im Nordosten
  { const X = 814, Y = 266
    clearing(f, X, Y, 36, 20, LAWN, 120)
    shadowEll(f, X + 3, Y + 3, 33, 17, .45)
    f.ell(X, Y, 33, 17, (x, y) => { const k = (x * 3 + y * 7) % 5; return C(['#ef4444', '#f8fafc', '#3b82f6', '#facc15', '#22c55e'][Math.floor(h2(x, y, 121) * 5)] ) })
    f.ell(X, Y, 33, 17, (x, y) => { const d = Math.hypot((x - X) / 33, (y - Y) / 17); return d > .96 ? C('#64748b') : h2(x, y, 121) > .45 ? C(['#ef4444', '#f8fafc', '#3b82f6', '#facc15', '#a855f7'][Math.floor(h2(x, y, 122) * 5)]) : C('#94a3b8') })
    f.ell(X, Y, 27, 12, C('#e2e8f0'))
    f.ell(X, Y, 26, 11, (x, y) => { const d = Math.hypot((x - X) / 26, (y - Y) / 11); return C(d > .82 ? (Math.abs(d - .91) < .03 ? '#fde7d4' : '#c2410c') : (Math.floor((x - X + 40) / 4) % 2 ? '#4ade80' : '#22c55e')) })
    f.rect(X - 8, Y - 4, 16, 8, C('#ffffff')); f.rect(X - 7, Y - 3, 14, 6, C('#22c55e')); f.rect(X, Y - 3, 1, 6, C('#ffffff'))
    for (const [dx, dy] of [[-32, -15], [32, -15], [-32, 15], [32, 15]]) { f.rect(X + dx, Y + dy - 4, 1, 5, C('#334155')); f.rect(X + dx - 1, Y + dy - 5, 3, 1, C('#fef9c3')) }
    road(f, [[X - 30, Y + 18], [X - 40, Y + 40], [X - 52, Y + 70]], 2)
  }

  // --- Felder und Windmühle im Südwesten, Obstgärten im Südosten
  { const x0 = 304, y0 = 424, cw = 17, ch = 12
    const kinds = ['weizen', 'beet', 'acker', 'wiese', 'blumen', 'ananas', 'weizen', 'beet']
    for (let r = 0; r < 5; r++) for (let q = 0; q < 5; q++) {
      const X = x0 + q * cw + (r % 2) * 4, Y = y0 + r * ch, kind = kinds[Math.floor(h2(q, r, 123) * kinds.length)]
      if (geo(X, Y).e < 12 || geo(X + cw, Y + ch).e < 12 || nearMark(X + cw / 2, Y + ch / 2, 22)) continue
      for (let j = 0; j < ch - 1; j++) for (let i = 0; i < cw - 1; i++) {
        let c
        if (kind === 'weizen') c = j % 2 ? '#e3b94f' : '#f2d37a'
        else if (kind === 'beet') c = j % 3 === 0 ? '#8a5a32' : (i + j) % 2 ? '#4d9a32' : '#62b041'
        else if (kind === 'acker') c = j % 2 ? '#8f5c33' : '#a8703f'
        else if (kind === 'wiese') c = h2(X + i, Y + j, 124) > .96 ? '#ffffff' : '#9fd36a'
        else if (kind === 'blumen') c = j % 2 ? (i % 3 ? '#f472b6' : '#fde047') : '#6fbf4a'
        else c = j % 3 === 0 ? '#a6763f' : (i % 2 ? '#2f7d3a' : (h2(X + i, Y + j, 125) > .7 ? '#facc15' : '#3f9b48'))
        f.set(X + i, Y + j, C(c))
      }
      f.rect(X, Y + ch - 1, cw, 1, C('#3f6f22')); f.rect(X + cw - 1, Y, 1, ch, C('#3f6f22'))
      if (h2(q, r, 126) > .6) tree(f, X + cw - 1, Y + ch - 1, 2, LEAF.slice(1))
    }
    house(f, 360, 444, 10, 7, ROOFS.terra, 41); house(f, 372, 446, 12, 8, ['#e46b5a', '#b9473a', '#7f2a22'], 42, '#f3e3cf')
    f.ell(390, 452, 3, 3, C('#cbd5e1')); f.ell(389, 451, 2, 2, C('#f1f5f9'))
    { const mx = 344, my = 470; shadowEll(f, mx + 2, my + 2, 3, 3); f.ell(mx, my, 3, 3, C('#e9dcc3')); f.ell(mx - 1, my - 1, 1, 1, C('#fff7ea'))
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) for (let t = 2; t < 9; t++) { f.set(mx + dx * t, my + dy * t * .8, C('#7c4a24')); f.set(mx + dx * t + dx, my + dy * t * .8, C(t > 3 ? '#ffffff' : '#7c4a24')) } }
    road(f, [[362, 456], [398, 476], [440, 482]], 2)
  }
  for (let r = 0; r < 4; r++) for (let q = 0; q < 9; q++) { const X = 646 + q * 8 + (r % 2) * 4, Y = 390 + r * 9; if (geo(X, Y).e > 14 && !nearMark(X, Y, 14)) { if (q === 0) f.rect(X - 4, Y - 4, 76, 8, C('#93cf5a')); tree(f, X, Y, 3, LEAF.slice(1), ['#f97316', '#ef4444', '#facc15'][r % 3]) } }

  // --- Vulkan: Lavarinnen vom Krater zu den Lavafeldern, Basalt, Hütte am Rand, Serpentinen von Norden
  { const [LX, LY] = MARKS[29]
    f.ell(LX, LY, 30, 18, (x, y) => { const d = Math.hypot((x - LX) / 30, (y - LY) / 18) + (vn2(x * .2, y * .2, 127) - .5) * .35; const v = f.get(x, y); return d > 1 ? v : C(h2(x, y, 128) > .75 ? '#57534e' : d > .85 && (x + y) % 2 ? '#6b6560' : '#44403c') })
    const lav = (t) => [600 + (LX - 600) * t + Math.sin(t * 9) * 7, 294 + (LY - 294) * t + Math.cos(t * 7) * 3]
    for (let t = 0; t <= 1; t += .003) { const [x, y] = lav(t); f.ell(x + 1, y + 1, 4, 3, (X, Y) => { const v = f.get(X, Y); return v >= 0 ? mixI(v, C('#1c1917'), .28) : v }) }
    for (let t = 0; t <= 1; t += .003) { const [x, y] = lav(t), w = 1 + (Math.sin(t * 23) > -.3 ? 1 : 0); f.rect(x - 1, y - 1, w + 1, w + 1, C('#9a3412')); f.rect(x - 1, y - 1, w, w, C('#ea580c')) }
    for (let t = 0; t <= 1; t += .006) { const [x, y] = lav(t); f.set(x - 1, y - 1, C(hash(t * 999, 129) > .55 ? '#fde047' : '#fb923c')) }
    for (let i = 0; i < 5; i++) { const x = LX - 16 + hash(i, 130) * 32, y = LY - 8 + hash(i, 131) * 16; f.ell(x + 1, y + 1, 3, 2, C('#1c1917')); f.ell(x, y, 3, 2, C('#ea580c')); f.ell(x - 1, y, 1, 1, C('#fde047')) }
    const [KX, KY] = MARKS[27]; house(f, KX - 38, KY + 2, 8, 6, ROOFS.stroh, 51, '#c9b08a')
    const zz = []; for (let i = 0; i <= 10; i++) zz.push([576 + (i % 2 ? 10 : -10) * (1 - i / 14), 146 + i * 9.5]); for (let k = 0; k + 1 < zz.length; k++) for (let t = 0; t <= 1; t += .08) if (Math.round(t * 12) % 2 === 0) { const X = zz[k][0] + (zz[k + 1][0] - zz[k][0]) * t, Y = zz[k][1] + (zz[k + 1][1] - zz[k][1]) * t; if (geo(X, Y).r > 36) f.set(X, Y, C('#e8d3a0')) }
  }

  // --- Brücke, wo die Ringstraße den Fluss quert
  { let best = null; for (let i = 0; i < 1800; i++) { const a = i / 1800 * Math.PI * 2 - Math.PI, [X, Y] = coastAt(a, .82); if (X < cx - 40) { const d = Math.abs(Y - riverY(X)); if (!best || d < best[2]) best = [X, Y, d] } }
    const [X] = best, Y = riverY(X); shadow(f, X - 1, Y - 6, 6, 12, .35, '#0b4a63'); planks(f, X - 2, Y - 7, 5, 13, 'v', WOOD, 2, 9); f.rect(X - 3, Y - 7, 1, 13, C(WOOD[4])); f.rect(X + 3, Y - 7, 1, 13, C(WOOD[4])) }

  // --- Küste: Felsnasen, Sonnenschirme, Boote, Inselchen, Sandbank, Seegras
  for (const a of [-2.75, -1.95, -.95, .6, 1.25, 2.3, 2.85]) { const [X, Y] = coastAt(a, 1.0); if (!nearMark(X, Y, 20)) rocks(f, X, Y, 8, Math.round(a * 100)) }
  for (const [a0, n] of [[1.75, 6], [2.05, 4], [-1.25, 5], [.95, 5], [-2.45, 4]]) for (let i = 0; i < n; i++) { const a = a0 + i * .028, [x, y] = coastAt(a, 1 - 6 / isleR(a)); if (!nearMark(x, y, 14)) umbrellaTop(f, x, y, ['#f43f5e', '#0ea5e9', '#facc15', '#a855f7'][(i + n) % 4], '#ffffff') }
  for (const [x, y, d, k, c] of [[640, 600, -.3, 'segel'], [470, 610, 3.3, 'motor', '#2563eb'], [1010, 250, -1.2, 'segel'], [1040, 400, 1.9, 'motor', '#f59e0b'], [200, 200, -.6, 'segel'], [160, 470, 2.6, 'segel'],
    [780, 70, .2, 'motor', '#10b981'], [330, 60, 3.0, 'segel'], [880, 560, -2.6, 'segel'], [960, 160, -2.2, 'motor', '#ef4444']]) if (geo(x, y).e < -20) boat(f, x, y, d, k, c || '#ef4444')
  islet(f, 136, 120, 12, 7, 131); islet(f, 1040, 560, 9, 5, 132); islet(f, 1072, 110, 7, 4, 133); islet(f, 96, 560, 6, 4, 134)
  for (let i = -30; i <= 30; i++) { const X = 300 + i * 2, Y = 588 + i * i * .022, t = Math.round(3.4 * (1 - Math.abs(i) / 31)); for (let j = -1; j <= t + 1; j++) f.set(X, Y + j, C(j < 0 || j > t ? SHALLOW[0] : SAND[j === t ? 2 : (h2(X, Y + j, 138) > .6 ? 0 : 1)])); f.set(X + 1, Y + t + 2, C('#ffffff')) }
  for (let i = 0; i < 900; i++) { const X = hash(i, 135) * MW, Y = hash(i, 136) * MH, g = geo(X, Y); if (g.e < -70 && g.e > -170 && vn2(X * .03, Y * .03, 137) > .62) { const v = f.get(X, Y); if (v >= 0) f.set(X, Y, mixI(v, C('#0b3f57'), .45)); f.set(X + 1, Y - 1, mixI(f.get(X + 1, Y - 1), C('#0b3f57'), .3)) } }
}
// Kleine Karte: die Orte aus der großen Karte auf ein Drittel verkleinert (nächster Bildpunkt), damit Stadt, Flugplatz und Anlagen dort auch zu sehen sind
function miniAreas(f, s) {
  const big = bigMap(), boxes = [[470, 440, 690, 510], [835, 330, 960, 385], [345, 160, 470, 200], [775, 244, 852, 290], [300, 420, 400, 490], [640, 382, 720, 425], [590, 186, 705, 300]]
  for (const [x0, y0, x1, y1] of boxes) for (let Y = Math.floor(y0 * s); Y <= y1 * s; Y++) for (let X = Math.floor(x0 * s); X <= x1 * s; X++) {
    const xx = X / s + 1, yy = Y / s + 1, v = big.get(xx, yy), g = big.get(xx - 1, yy - 1)
    if (v >= 0 && geo(xx, yy).e > 2) f.set(X, Y, v === g ? v : big.get(xx, yy))
  }
}
let BIG = null
const bigMap = () => { if (!BIG) { BIG = new FB(MW, MH); paintMap(BIG, 1, true) } return BIG }
scene('insel-karte', MW, MH, (f) => f.p.set(bigMap().p))
scene('insel-karte-mini', 384, 216, (f) => paintMap(f, 1 / 3, false))
