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
      else if (d < 44) { const k = d / 44 + (n - .5) * .25; c = SHALLOW[Math.max(0, Math.min(3, Math.floor(k * 4)))]; if (d > 30 && (X + Y) % 2 && n > .5) c = OCEAN[0] }
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
  // Ringweg und Pfad zum Krater
  if (detail) for (let i = 0; i < 720; i++) { const a = i / 720 * Math.PI * 2, k = .82, X = (cx + Math.cos(a) * isleR(a) * 1.2 * k) * s, Y = (cy + Math.sin(a) * isleR(a) * .8 * k) * s; f.set(X, Y, C('#e2c48b')); if (detail) { f.set(X + 1, Y, C('#d6b97a')); f.set(X, Y + 1, C('#b89a5e')) } }
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
    const a = i / 90 * Math.PI * 2, k = .88 + hash(i, 81) * .06, xx = cx + Math.cos(a) * isleR(a) * 1.2 * k, yy = cy + Math.sin(a) * isleR(a) * .8 * k
    if (detail) palmTop(f, Math.round(xx), Math.round(yy), 6, i); else { f.set(xx * s, yy * s, C(JUNGLE[3])); f.set(xx * s - 1, yy * s, C(JUNGLE[1])) }
  }
  if (!detail) return
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
scene('insel-karte', MW, MH, (f) => paintMap(f, 1, true))
scene('insel-karte-mini', 384, 216, (f) => paintMap(f, 1 / 3, false))
