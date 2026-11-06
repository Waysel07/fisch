// Quelle der Welt-Bilder in img/welt-*.png und der Schatten in img/welt-schatten.png.
// Das Spiel lädt diese Datei nicht. 1 Pixel = 1 Leinwand-Pixel (768×432), HORIZON = 184, SURFACE = 206.
// Tag-Fassung; die Nacht färbt das Spiel selbst ab. Was leuchtet oder sich bewegt, zeichnet js/fischen.js darüber.
'use maler'
const HZ = 184, SF = 206

// ---------------------------------------------------------------- Schatten
// Masken: schwarz = Körper, blau = Rücken, rot = Lichtkante, grün = Auge. Das Spiel färbt sie je Welt ein.
// Jede Form zeigt nach rechts und wird spaltenweise gebogen: Der Schwanz schlägt, der Kopf bleibt ruhig.
const CELL_W = 104, CELL_H = 60, WHALE_W = 256, WHALE_H = 100
function drawShadow(f, ox, oy, cw, ch, spec, fr) {
  const cx = cw / 2, cy = ch / 2 + (spec.dy || 0), L = spec.L, ph = fr / 4 * Math.PI * 2
  const flat = new FB(cw, ch), pt = (p) => p.map(([x, y]) => [x + cx, y + cy])
  const polys = typeof spec.polys === 'function' ? spec.polys(fr) : spec.polys
  for (const p of polys) flat.poly(pt(p), 0)
  if (spec.lines) for (const [x0, y0, x1, y1, w] of spec.lines(fr)) flat.line(x0 + cx, y0 + cy, x1 + cx, y1 + cy, 0, w || 1)
  const bend = (x) => { const u = Math.max(0, Math.min(1, (x - cx + L / 2) / L)); return spec.amp * Math.pow(1 - u, spec.pw || 1.8) * Math.sin(ph + (1 - u) * (spec.wave || 2.6)) }
  const m = new FB(cw, ch)
  for (let x = 0; x < cw; x++) { const b = Math.round(bend(x)); for (let y = 0; y < ch; y++) { const v = flat.p[y * cw + x]; if (v >= 0) m.set(x, y + b, 0) } }
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    if (m.p[y * cw + x] < 0) continue
    const up = (n) => y - n < 0 || m.p[(y - n) * cw + x] < 0
    const c = up(1) ? C('#ff0000') : (up(2) || up(3)) && !up(0) ? C('#0000ff') : C('#000000')
    f.set(ox + x, oy + y, c)
  }
  if (spec.creases) for (const [x0, y0, x1, y1] of spec.creases) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = Math.round(cx + x0 + (x1 - x0) * i / n), y = Math.round(cy + y0 + (y1 - y0) * i / n) + Math.round(bend(x)); if (m.get(x, y) >= 0) f.set(ox + x, oy + y, C('#0000ff')) } }
  if (spec.eye) { const [ex, ey] = spec.eye, gx = Math.round(cx + ex); f.rect(ox + gx, oy + Math.round(cy + ey + bend(gx)), spec.eyeS || 2, spec.eyeS || 2, C('#00ff00')) }
}
const SHADOWS = [
  ['minnow', { L: 26, amp: 2, polys: [[[-8, 0], [-3, -3], [4, -4], [9, -2], [12, 0], [9, 2], [3, 3], [-3, 2]], [[-7, 0], [-13, -4], [-11, 0], [-13, 4]], [[0, -3], [-3, -6], [-3, -3]]], eye: [8, -1], eyeS: 1 }],
  ['perch', { L: 36, amp: 3, polys: [[[-10, 0], [-5, -6], [3, -9], [11, -7], [17, -2], [18, 0], [14, 3], [5, 7], [-4, 5]], [[-6, -6], [-4, -10], [-2, -8], [0, -12], [2, -9], [4, -13], [6, -9], [8, -12], [10, -7]], [[-9, 0], [-18, -7], [-15, 0], [-18, 7]], [[2, 6], [-1, 11], [6, 7]], [[-6, 4], [-9, 9], [-2, 6]]], eye: [12, -3], creases: [[8, -5, 7, 4]] }],
  ['carp', { L: 50, amp: 3, polys: [[[-14, 0], [-8, -9], [2, -13], [14, -10], [22, -4], [25, 0], [21, 5], [10, 10], [-4, 8]], [[-8, -9], [-5, -15], [8, -14], [12, -10]], [[-13, 0], [-25, -10], [-21, 0], [-25, 10]], [[-6, 7], [-9, 13], [0, 9]], [[6, 10], [3, 15], [11, 10]]], lines: () => [[23, 3, 27, 6]], eye: [17, -4], creases: [[13, -8, 11, 7]] }],
  ['pike', { L: 66, amp: 3, pw: 2.2, polys: [[[-20, 0], [-14, -4], [0, -5], [20, -5], [32, -2], [33, 0], [28, 2], [10, 5], [-10, 4]], [[-16, -4], [-13, -10], [-5, -5]], [[-14, 4], [-12, 9], [-6, 4]], [[-19, 0], [-33, -8], [-28, 0], [-33, 8]], [[14, 4], [9, 8], [17, 5]], [[2, 4], [-1, 8], [5, 5]]], eye: [24, -3], creases: [[20, -4, 18, 4]] }],
  ['catfish', { L: 58, amp: 3, polys: [[[-20, 0], [-10, -5], [8, -8], [22, -7], [29, -3], [29, 2], [20, 6], [2, 7], [-12, 4]], [[6, -8], [8, -13], [13, -8]], [[-19, 0], [-29, -7], [-29, 6]], [[-18, 3], [-12, 8], [2, 7]], [[16, 5], [11, 10], [18, 6]]], lines: (fr) => [[28, 1, 36, 6 + (fr % 2)], [27, 3, 33, 10 - (fr % 2)], [28, -2, 37, 0 + (fr % 2)]], eye: [22, -4] }],
  ['eel', { L: 84, amp: 5, wave: 7, pw: .5, polys: [[[-40, 0], [-20, -3], [20, -4], [36, -3], [41, 0], [36, 2], [20, 3], [-20, 3]], [[-38, -1], [-14, -5], [22, -4]], [[-38, 1], [-14, 5], [10, 3]]], eye: [34, -2], eyeS: 1 }],
  ['tuna', { L: 72, amp: 2.5, pw: 3, polys: [[[-24, 0], [-14, -6], [2, -11], [18, -9], [30, -3], [34, 0], [28, 4], [14, 9], [-6, 8]], [[6, -10], [0, -20], [-2, -10]], [[-8, -9], [-14, -18], [-12, -7]], [[-8, 8], [-14, 17], [-12, 6]], [[14, 4], [2, 10], [10, 4]], [[-23, 0], [-34, -16], [-29, 0], [-34, 16]]], eye: [24, -3], creases: [[21, -7, 19, 7]] }],
  ['shark', { L: 100, amp: 3.5, pw: 2.4, polys: [[[-34, 0], [-20, -5], [0, -11], [22, -12], [40, -7], [50, -1], [44, 2], [28, 7], [6, 9], [-16, 5]], [[12, -11], [-2, -27], [-6, -26], [-4, -9]], [[-20, -5], [-26, -11], [-26, -3]], [[18, 7], [2, 22], [0, 20], [8, 8]], [[-12, 5], [-20, 11], [-20, 4]], [[-33, 0], [-50, -27], [-46, -8], [-42, 0], [-48, 13], [-34, 3]]], eye: [38, -4], creases: [[26, -3, 25, 3], [23, -3, 22, 4], [20, -3, 19, 4]] }],
  ['sword', { L: 100, dy: 2, amp: 2.5, pw: 3, polys: [[[-26, 0], [-16, -5], [4, -9], [20, -7], [28, -3], [26, 2], [12, 7], [-10, 5]], [[26, -3], [50, -1], [26, 1]], [[18, -7], [14, -24], [-2, -22], [-14, -8], [4, -8]], [[-25, 0], [-38, -14], [-33, 0], [-38, 14]], [[12, 5], [4, 14], [8, 5]]], eye: [21, -4] }],
  ['ray', { L: 70, amp: 1, pw: 1, wave: 1, polys: (fr) => { const a = [1, .68, .42, .68][fr]; return [[[-10, 0], [4, -18 * a], [14, -12 * a], [26, -3], [28, 0], [26, 3], [14, 8 * (1.3 - a)], [4, 10 * (1.3 - a)]], [[-10, -1], [-38, 0], [-10, 1]], [[-30, -1], [-34, -4], [-32, 0]]] }, eye: [20, -2] }],
  ['squid', { L: 60, amp: 0, polys: [[[-6, -6], [14, -6], [28, 0], [14, 6], [-6, 6]], [[18, -4], [26, -11], [28, 0], [26, 11], [18, 4]], [[-12, -4], [-6, -5], [-6, 5], [-12, 4]]], lines: (fr) => { const o = []; for (let a = -2; a <= 2; a++) { let px = -12, py = a * 1.6; const n = 8 - Math.abs(a); for (let i = 1; i <= n; i++) { const x = -12 - i * 2.6, y = a * (1.6 + i * .7) + Math.sin(i * .9 + fr * 1.57 + a) * (i * .3); o.push([px, py, x, y, i < 3 ? 2 : 1]); px = x; py = y } } return o }, eye: [-5, -3] }],
  ['boot', { L: 30, amp: 0, polys: (fr) => { const a = [-.12, -.04, .06, -.02][fr], R = (p) => p.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]); return [R([[-11, -14], [1, -14], [2, 2], [13, 4], [16, 8], [16, 11], [-12, 11]]), R([[-12, -16], [2, -16], [2, -13], [-12, -13]]), R([[-12, 11], [-5, 11], [-5, 14], [-12, 14]]), R([[3, 11], [15, 11], [14, 13], [3, 13]])] } }],
  ['panzer', { L: 56, amp: 2.5, polys: [[[-16, 0], [-8, -8], [4, -11], [16, -8], [24, -3], [27, 0], [22, 4], [8, 9], [-6, 7]], [[-8, -8], [-6, -14], [-3, -9], [0, -15], [3, -10], [6, -15], [9, -10], [12, -14], [15, -8]], [[-15, 0], [-27, -10], [-23, 0], [-27, 10]], [[4, 8], [0, 14], [9, 9]], [[23, 3], [29, 8], [20, 6]]], eye: [18, -3], creases: [[-2, -7, -4, 6], [5, -8, 3, 7], [12, -7, 10, 6]] }],
  ['wyrm', { L: 96, amp: 5, wave: 6.5, pw: .55, polys: () => { const p = [[[-46, 0], [-24, -3], [24, -4], [34, -7], [46, -3], [50, 0], [44, 3], [30, 4], [-24, 3]], [[33, -6], [24, -13], [30, -6]], [[38, -6], [31, -14], [36, -6]]]; for (let x = -38; x < 24; x += 7) p.push([[x, -3], [x + 3, -9], [x + 6, -4]]); return p }, eye: [38, -3] }],
]
const WHALE = { L: 236, amp: 5, pw: 2.6, wave: 2, dy: -4, eye: [84, 6], eyeS: 3,
  polys: [[[-85, 0], [-60, -12], [-20, -26], [30, -30], [85, -24], [110, -12], [116, 2], [104, 14], [60, 26], [10, 30], [-40, 18], [-70, 6]], [[-85, -3], [-110, -13], [-118, -12], [-108, -2], [-118, 12], [-110, 14], [-85, 4]], [[-30, -22], [-42, -31], [-44, -20]], [[50, 26], [22, 46], [14, 44], [34, 24]]],
  creases: [[116, 3, 62, 9], [62, 9, 52, 7], [100, 12, 56, 20], [90, 16, 48, 24], [78, 20, 42, 27]] }
art('welt-schatten', WHALE_W * 4, CELL_H * SHADOWS.length + WHALE_H, (f) => {
  SHADOWS.forEach(([, s], row) => { for (let fr = 0; fr < 4; fr++) drawShadow(f, fr * CELL_W, row * CELL_H, CELL_W, CELL_H, s, fr) })
  for (let fr = 0; fr < 4; fr++) drawShadow(f, fr * WHALE_W, SHADOWS.length * CELL_H, WHALE_W, WHALE_H, WHALE, fr)
})
// Qualle: leuchtet, 4 Phasen zu 22×32
art('welt-qualle', 88, 32, (f) => {
  for (let fr = 0; fr < 4; fr++) {
    const sq = [1, .86, .74, .86][fr], ox = fr * 22 + 11, top = 2 + (1 - sq) * 5, a = Math.min(9, Math.round(9 * (2 - sq) * .6 + 3)), b = Math.round(8 * sq)
    f.ell(ox, Math.round(top + b), a, b, (x, y) => (y - top < 2 ? C('#fbcfe8') : (x - ox + y) % 5 === 0 ? C('#f9a8d4') : C('#c026d3')))
    f.rect(ox - a, Math.round(top + b), a * 2 + 1, b + 1, -1)
    f.rect(ox - a, Math.round(top + b), a * 2 + 1, 1, C('#f0abfc'))
    for (let i = -3; i <= 3; i++) for (let y = 0; y < 14 - Math.abs(i); y++) { if ((y + i) % 3 === 0 && i % 2) continue; f.set(ox + i * a * .28 + Math.sin(y * .5 + fr * 1.57 + i) * 1.3, top + b + 1 + y, i % 2 ? C('#a21caf') : C('#e879f9')) }
  }
})

// ---------------------------------------------------------------- Der Steg
const STEG_W = ['#46b4d0', '#3aa8c8', '#2f9bbf', '#278db6', '#207eaa', '#1a6f9d', '#156090', '#115283', '#0e4576', '#0c3a69', '#0a315d', '#092a52']
art('welt-steg', VW, VH, (f) => {
  const wat = atY(STEG_W, SF, VH, .9)
  // ferne Berge
  ridge(f, 0, VW, (x) => HZ - 8 - 34 * Math.max(0, fbm(x * .006, 3) - .32) * 2.2 * Math.min(1, Math.max(.15, (x - 120) / 300)), C('#a9cfe4'), HZ + 1)
  ridge(f, 0, VW, (x) => HZ - 3 - 26 * Math.max(0, fbm(x * .009 + 5, 9) - .36) * 2.4 * Math.min(1, Math.max(.1, (x - 240) / 240)), C('#8fbcd6'), HZ + 1, C('#a3cce0'))
  // Insel
  const hill = (x) => { const k = (x - 482) / 240; if (k <= 0 || k >= 1) return HZ + 2; return HZ + 2 - 34 * Math.pow(Math.sin(Math.PI * k), .72) * (.84 + .3 * fbm(x * .02, 4)) }
  const trees = []
  for (let i = 0; i < 58; i++) { const x = 496 + hash(i, 2) * 212; if (Math.abs(x - 636) < 13 || Math.abs(x - 586) < 12) continue; trees.push([x, 8 + hash(i, 3) * 16]) }
  trees.sort((a, b) => a[1] - b[1])
  for (const [x, h] of trees.filter((q) => q[1] > 15)) pine(f, Math.round(x), Math.round(hill(x) + 3), Math.round(h * 1.2), C('#2c6f62'), C('#3f8a70'), C('#2a4f48'))
  for (let x = 482; x < 722; x++) {
    const t = Math.round(hill(x))
    for (let y = t; y <= HZ + 2; y++) {
      const dep = y - t, n = vn2(x * .09, y * .22, 8)
      f.set(x, y, dep < 2 ? C('#a9d36f') : n > .62 ? C('#7cb765') : n < .34 ? C('#3f7d55') : C('#5a9a5d'))
    }
  }
  for (const [x, h] of trees.filter((q) => q[1] <= 15)) pine(f, Math.round(x), Math.round(hill(x) + 5), Math.round(h * 1.1), C('#1d5849'), C('#35805f'), C('#27403a'))
  // Strand und Felsen am Ufer
  for (let x = 478; x < 726; x++) { const b = 1.5 + 2.2 * fbm(x * .05, 6); for (let y = HZ - Math.round(b); y <= HZ + 1; y++) f.set(x, y, y >= HZ ? C('#c7b184') : C('#ecdcaa')) }
  for (const [x, w, h] of [[492, 18, 8], [510, 8, 4], [706, 22, 10], [724, 10, 5]]) rock(f, x, HZ + 2, w, h, ['#b3b8bb', '#8b8f96', '#5f6771', '#4a525c'], x)
  // Hütte
  const hy = Math.round(hill(586)) + 4
  f.rect(578, hy - 10, 16, 11, C('#e9dcc2')); f.rect(590, hy - 10, 4, 11, C('#bfae95'))
  f.poly([[575, hy - 10], [586, hy - 19], [597, hy - 10]], C('#b84c3c')); f.line(575, hy - 10, 586, hy - 19, C('#dd7a5d'))
  f.rect(582, hy - 6, 4, 4, C('#3b6c8f')); f.rect(582, hy - 6, 2, 2, C('#a8d8ea')); f.rect(590, hy - 16, 3, 5, C('#7b4b3a'))
  // Leuchtturm: Lampe bei x 636, y 112
  const lb = Math.round(hill(636)) + 4
  for (let y = 0; y < lb - 122; y++) {
    const w = 11 - y * .06, stripe = Math.floor(y / 9) % 2, X = Math.round(636 - w / 2)
    for (let i = 0; i < Math.round(w); i++) { const shade = i > w * .68; f.set(X + i, lb - y, i < 1 ? (stripe ? C('#e96f6a') : C('#ffffff')) : stripe ? (shade ? C('#a93139') : C('#dc4b4b')) : (shade ? C('#c3c9d6') : C('#f7f7f4'))) }
  }
  f.rect(628, 122, 16, 2, C('#27364a')); f.rect(631, 110, 1, 12, C('#27364a')); f.rect(641, 110, 1, 12, C('#27364a'))
  f.rect(632, 111, 9, 11, C('#dce7f0')); f.rect(632, 111, 3, 11, C('#ffffff'))
  f.poly([[629, 110], [636.5, 102], [644, 110]], C('#c43d3d')); f.line(629, 110, 636, 102, C('#e96f6a')); f.rect(636, 99, 1, 4, C('#27364a'))
  // Wasser in der Ferne
  bands(f, HZ + 2, SF, ['#c4ecf5', '#a9e2ef', '#8bd5e8', '#6fc8df', '#58bbd6'], 1.1, .22, 2)
  // Spiegelung der Insel, nach unten aufgelöst
  for (let y = HZ + 2; y < SF; y++) {
    const k = (y - HZ - 2) / (SF - HZ - 2), off = Math.round(Math.sin(y * 1.9) * (1 + k * 3))
    for (let x = 482; x < 722; x++) {
      const src = f.get(x + off, HZ - (y - HZ) * 1.5); if (src < 0) continue
      if (h2(Math.floor((x + y * 3) / 9), y) < .24 + k * .62) continue
      f.set(x, y, mixI(src, f.get(x, y), .5 + k * .2))
    }
  }
  // lange Lichtstriche auf dem Wasser
  for (let i = 0; i < 46; i++) { const y = HZ + 3 + Math.floor(hash(i, 11) * 21), x = hash(i, 12) * VW, n = 6 + hash(i, 13) * (8 + (y - HZ) * 2); f.rect(x, y, n, 1, y < 195 ? C('#e6f8fb') : C('#bdeaf3')) }
  // unter Wasser
  bands(f, SF, VH, STEG_W, .9, 1, 4)
  // Lichtflecken direkt unter der Oberfläche
  for (let i = 0; i < 70; i++) { const y = SF + 2 + Math.pow(hash(i, 21), 1.8) * 46, x = hash(i, 22) * VW, n = 4 + hash(i, 23) * 18; f.rect(x, y, n, 1, mixI(wat(y), C('#bff0f6'), .28 - (y - SF) * .004)) }
  // ferne Felsen, verblassen im Wasser
  ridge(f, 0, VW, (x) => 334 - 60 * Math.pow(fbm(x * .009, 14), 1.5) * (x > 470 ? 1.5 : .8), (x, y) => mixI(wat(y), C('#0b2d58'), .28), VH)
  ridge(f, 0, VW, (x) => 372 - 44 * Math.pow(fbm(x * .014 + 3, 17), 1.4) * (x > 540 ? 1.3 : .8), (x, y) => mixI(wat(y), C('#0a2a50'), .46), VH)
  // Glimms Fels reicht bis zum Grund
  strata(f, 412, SF - 3, VH, (y) => 18 + Math.pow(Math.max(0, (y - SF) / (VH - SF)), .9) * 44, ['#7fa0a8', '#4d7286', '#2a4d68', '#1a3852'], 31, (c, y) => mixI(c, wat(y), .18 + Math.max(0, y - SF) / (VH - SF) * .42))
  for (let i = 0; i < 40; i++) { const y = SF + hash(i, 35) * 70, x = 392 + hash(i, 36) * 42, n = 3 + hash(i, 37) * 9; f.rect(x, y, n, 1, mixI(C('#3f9a7a'), wat(y), .3)); if (i % 3 === 0) f.rect(x + 1, y + 1, Math.max(1, n - 2), 2, mixI(C('#2c7c6c'), wat(y), .3)) }
  // Sandgrund mit Rippeln, die dem Hang folgen
  const sand = (x) => 398 - 14 * Math.max(0, (x - 460) / 300) + 8 * (fbm(x * .012, 19) - .5) + 2 * Math.sin(x * .03)
  for (let x = 0; x < VW; x++) { const t = Math.round(sand(x)); for (let y = t; y < VH; y++) { const d = y - t; f.set(x, y, d < 1 ? C('#a7c5b0') : d < 4 ? C('#7fa5a0') : d < 12 ? C('#5f8a8e') : d < 22 ? C('#4a7180') : C('#3a5e72')) } }
  for (let i = 0; i < 60; i++) { const x0 = hash(i, 41) * VW, n = 8 + hash(i, 42) * 18, d = 3 + hash(i, 43) * 22; for (let k = 0; k < n; k++) { const x = x0 + k, y = sand(x) + d + Math.sin(k * .5) * .8; f.set(x, y, d < 12 ? C('#4f7a85') : C('#335570')) } }
  // gesunkenes Ruderboot
  { const bx = 556, by = Math.round(sand(556)) + 5, wood = C('#6b5b53'), woodL = C('#8d7a69'), dk = C('#2f3f4c')
    f.poly([[bx - 44, by - 22], [bx + 42, by - 13], [bx + 28, by + 2], [bx - 30, by + 2]], (x, y) => mixI(h2(0, Math.floor((y - (x - bx) * .11) / 4)) > .5 ? wood : mixI(wood, dk, .4), wat(y), .28))
    f.line(bx - 44, by - 22, bx + 42, by - 13, woodL, 2)
    for (const a of [-26, -10, 8, 22]) f.line(bx + a, by - 19 + a * .1, bx + a * .86, by + 1, dk, 2)
    f.poly([[bx - 10, by - 14], [bx + 8, by - 12], [bx + 4, by + 2], [bx - 12, by + 2]], C('#142f4a')) // Loch im Rumpf
    f.line(bx + 4, by - 12, bx + 20, by - 32, mixI(woodL, wat(by - 20), .35), 2); f.poly([[bx + 20, by - 32], [bx + 29, by - 40], [bx + 25, by - 28]], mixI(woodL, wat(by - 30), .35)) // Ruder
  }
  // Anker mit Kette
  { const ax = 300, ay = Math.round(sand(300)), ir = C('#37505f'), irL = C('#6e8a92')
    f.rect(ax - 1, ay - 30, 3, 30, ir); f.rect(ax - 1, ay - 30, 1, 30, irL); f.rect(ax - 7, ay - 26, 15, 2, ir); f.rect(ax - 7, ay - 26, 15, 1, irL)
    f.ell(ax, ay - 33, 3, 3, ir); f.ell(ax, ay - 33, 1, 1, wat(ay - 33))
    for (let i = -14; i <= 14; i++) { const y = ay - 2 + Math.abs(i) * -.5 + 2; f.set(ax + i, y, Math.abs(i) > 11 ? irL : ir); f.set(ax + i, y + 1, ir) }
    for (let i = 0; i < 14; i++) { const x = ax + 4 + i * 6, y = ay - 1 + Math.sin(i * 1.1) * 1.2; f.rect(x, y, 4, 2, i % 2 ? ir : irL) }
  }
  // Felsen, Muscheln, Seestern, Flasche
  const trock = (c, y) => mixI(c, wat(y), .2)
  for (const [x, w, h] of [[150, 90, 34], [216, 42, 16], [430, 70, 22], [492, 26, 10], [664, 96, 44], [722, 60, 24], [612, 34, 12], [34, 58, 22]]) rock(f, x, Math.round(sand(x)) + 8, w, h, ['#93aeb0', '#638893', '#3f6578', '#2b4d62'], x, trock)
  for (const [x, c] of [[250, '#e8846b'], [640, '#e6a15a'], [345, '#d96d80']]) { const y = Math.round(sand(x)) + 5, k = C(c), d = mixI(k, C('#30264a'), .35); for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 - 1.57; f.line(x, y, x + Math.cos(an) * 5, y + Math.sin(an) * 3, k, 2) } f.set(x, y, d) }
  for (const [x, o] of [[95, 3], [388, 8], [470, 6], [700, 8]]) { const y = Math.round(sand(x)) + o; f.ell(x, y, 3, 2, C('#30405e')); f.rect(x - 2, y - 2, 4, 1, C('#7f93b2')) }
  { const x = 196, y = Math.round(sand(196)) + 6; f.line(x - 7, y + 2, x + 6, y - 2, C('#3f8a78'), 4); f.line(x + 7, y - 2, x + 11, y - 3, C('#7cc7a6'), 2); f.line(x - 6, y, x + 4, y - 3, C('#a7e3ca')) }
  // Seegras, das steht (das bewegte zeichnet das Spiel)
  for (let i = 0; i < 90; i++) { const x = 8 + hash(i, 51) * (VW - 16), h = 6 + hash(i, 52) * 18, y0 = sand(x) + 3, dk = i % 3 === 0; for (let k = 0; k < h; k++) f.set(x + Math.sin(k * .35 + i) * (k * .12), y0 - k, dk ? C('#28615c') : C('#3f8f73')) }
  // der Steg wirft Schatten ins Wasser: wird nach unten und zur Seite schwächer, die Kante wellt sich
  f.darken((x, y) => {
    if (y <= SF) return 0
    const d = (y - SF) / 150; if (d >= 1) return 0
    const edge = 226 + (y - SF) * .3 + Math.sin(y * .13) * 4 + Math.sin(y * .37 + x * .02) * 2
    const side = Math.max(0, Math.min(1, (edge - x) / 46 + .06 * Math.sin(y * 1.7)))
    return Math.round(side * (1 - d) * Math.min(1, (y - SF) / 5) * 5) / 5 * .34
  }, C('#06223f'))
})

// ---------------------------------------------------------------- Die Hohe See: hier wird es richtig tief
const SEE_W = ['#2885b4', '#1f75a6', '#176596', '#105686', '#0c4775', '#093b65', '#073055', '#062646', '#051e38', '#04172c', '#031122', '#020c18', '#020810', '#01050b']
art('welt-see', VW, VH, (f) => {
  const wat = atY(SEE_W, SF, VH, .75)
  // Wolkentürme am Horizont
  const puff = (x, y, r) => { f.ell(x, y, r, Math.round(r * .78), (X, Y) => { const k = (Y - y + r * .5) / r + (X - x) * .006; return k < .22 ? C('#ffffff') : k < .75 ? C('#e6eef7') : C('#b4cadf') }) }
  for (let i = 0; i < 7; i++) { const x = 300 + i * 66 + hash(i, 61) * 30, H0 = 14 + hash(i, 62) * 26; for (let j = 0; j < 8; j++) puff(Math.round(x + (hash(j + i * 9, 63) - .5) * 70), Math.round(HZ - 2 - hash(j + i * 9, 64) * H0), Math.round(6 + hash(j + i * 9, 65) * 11)) }
  f.rect(0, HZ - 3, VW, 5, -1)
  ridge(f, 280, 760, (x) => HZ - 6 - 3 * Math.sin(x * .05) - 2 * vn(x * .12, 2), C('#a6bfd8'), HZ + 2)
  // Frachter am Horizont, mit Rauch
  { const x = 496, y = HZ, hl = C('#54677f'), dk = C('#3c4d64')
    f.poly([[x, y - 5], [x + 44, y - 5], [x + 40, y], [x + 4, y]], hl); f.rect(x + 2, y - 2, 40, 2, dk); f.rect(x + 6, y - 10, 10, 5, hl); f.rect(x + 22, y - 8, 14, 3, hl); f.rect(x + 9, y - 16, 4, 6, dk)
    for (let i = 0; i < 10; i++) f.ell(Math.round(x + 10 - i * 4 - i * i * .1), Math.round(y - 18 - i * 1.3), Math.round(1 + i * .25), Math.round(1 + i * .15), mixI(C('#7d8ea5'), C('#bcd0e2'), i / 10)) }
  bands(f, HZ + 1, SF, ['#7cc3de', '#62b2d4', '#4a9fc7', '#3a8fbb', '#2f85b4'], 1, .22, 6)
  // lange Dünung: helle Kämme mit dunkler Rückseite
  for (let i = 0; i < 60; i++) { const y = HZ + 2 + Math.floor(hash(i, 71) * 20), x = hash(i, 72) * VW, n = 10 + hash(i, 73) * (12 + (y - HZ) * 3); f.rect(x, y + 1, n, 1, C('#215f90')); f.rect(x + 3, y, n * .7, 1, C('#a9e0ee')) }
  bands(f, SF, VH, SEE_W, .75, 1.3, 9)
  // Mattes Licht im obersten Stockwerk
  for (let i = 0; i < 40; i++) { const y = SF + 2 + Math.pow(hash(i, 81), 1.8) * 40, x = hash(i, 82) * VW, n = 6 + hash(i, 83) * 20; f.rect(x, y, n, 1, mixI(wat(y), C('#8fdcf0'), .2 - (y - SF) * .004)) }
  // Tiefseegebirge in Schichten
  ridge(f, 0, VW, (x) => 318 - 74 * Math.pow(fbm(x * .0065 + 2, 91), 1.6) * 1.4, (x, y) => mixI(wat(y), C('#04223f'), .35), VH, (x, y) => mixI(wat(y), C('#1e6f96'), .1), 1)
  ridge(f, 0, VW, (x) => 362 - 66 * Math.pow(fbm(x * .011 + 8, 93), 1.5) * 1.4, (x, y) => mixI(wat(y), C('#020d1f'), .62), VH, (x, y) => mixI(wat(y), C('#1a6288'), .16), 1)
  // Glimms Fels: ein Seeberg, der aus dem Abgrund kommt
  strata(f, 412, SF + 38, VH, (y) => 5 + Math.pow(Math.max(0, (y - SF - 38) / (VH - SF - 38)), 1.05) * 128, ['#4a8ea6', '#1f5878', '#0c3350', '#061d33'], 33, (c, y) => mixI(c, wat(y), .12 + Math.max(0, y - SF) / (VH - SF) * .5))
  for (let i = 0; i < 26; i++) { const y = SF + 62 + hash(i, 38) * 44, x = 392 + hash(i, 39) * 42, n = 3 + hash(i, 40) * 7; f.rect(x, y, n, 1, mixI(C('#3a8a84'), wat(y), .3)) }
  // Abgrund-Sockel und Säulen rechts
  const spire = (cx, top, w, seed) => {
    for (let y = top; y < VH; y++) {
      const k = (y - top) / (VH - top), hw = w * (.12 + Math.pow(k, 1.5) * .9) + (fbm(y * .07, seed) - .5) * w * .3
      for (let x = Math.round(cx - hw); x < cx + hw; x++) { const u = (x - cx + hw) / (2 * hw); f.set(x, y, u < .16 ? mixI(C('#25668a'), wat(y), .35) : u > .6 ? C('#010812') : C('#041627')) }
    }
  }
  spire(700, 268, 56, 41); spire(742, 306, 44, 43); spire(644, 332, 34, 45); spire(58, 340, 50, 47); spire(236, 362, 34, 49)
  const floor = (x) => 402 + 10 * (fbm(x * .012, 95) - .5) + 3 * Math.sin(x * .04)
  // Wrack eines Segelschiffs
  { const ang = -.07, cx = 520, cy = 388, R = (x, y) => [cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)], P = (a) => a.map(([x, y]) => R(x, y))
    const dk = C('#06192c'), md = C('#0d2c47'), lt = C('#2a6b8a'), pl = C('#134060')
    f.line(...R(-14, -30), ...R(-14, -92), C('#102f4a'), 3); f.line(...R(-40, -68), ...R(14, -74), C('#102f4a'), 2); f.line(...R(-40, -68), ...R(-46, -30), dk); f.line(...R(14, -74), ...R(30, -28), dk)
    f.poly(P([[-34, -66], [-18, -68], [-20, -42], [-30, -38]]), mixI(C('#0f3350'), wat(330), .15)); f.poly(P([[28, -30], [34, -58], [46, -30]]), C('#0c2a44')) // Segelfetzen, Mastrest
    f.poly(P([[-92, -32], [-62, -38], [66, -32], [96, -44], [86, -18], [60, 10], [-70, 12], [-86, -6]]), (x, y) => {
      const v = (x - cx) * Math.sin(-ang) + (y - cy) * Math.cos(-ang)
      return Math.floor((v + 40) / 6) % 2 ? md : mixI(md, pl, .45)
    })
    f.line(...R(-92, -32), ...R(-62, -38), lt, 2); f.line(...R(-62, -38), ...R(66, -32), lt, 2); f.line(...R(66, -32), ...R(96, -44), lt, 2)
    f.poly(P([[-92, -32], [-104, -42], [-112, -30], [-86, -16]]), md); f.line(...R(-104, -42), ...R(-136, -56), C('#102f4a'), 2) // Heck, Bugspriet zeigt nach links
    f.poly(P([[16, -24], [46, -20], [50, 4], [26, 8], [10, -2]]), C('#020a14')) // Loch
    for (const a of [24, 34, 44]) f.line(...R(a, -24), ...R(a - 2, 6), md, 2)
    for (const a of [-60, -38, -16]) { const [x, y] = R(a, -16); f.ell(Math.round(x), Math.round(y), 3, 3, C('#020a14')); f.set(Math.round(x) - 1, Math.round(y) - 2, lt) }
    // Fässer
    for (const [x, y] of [[-126, 8], [108, 12]]) { const [X, Y] = R(x, y); f.ell(Math.round(X), Math.round(Y), 7, 8, md); f.rect(X - 7, Y - 3, 15, 1, lt); f.rect(X - 7, Y + 3, 15, 1, dk) }
  }
  // Grund: fast schwarz, die Kanten fangen noch etwas Licht
  ridge(f, 0, VW, floor, (x, y) => (y - floor(x) < 5 ? C('#041525') : C('#01060e')), VH, C('#1b5777'), 1)
  for (const [x, w, h] of [[110, 90, 26], [312, 54, 16], [652, 88, 24], [752, 50, 18]]) rock(f, x, Math.round(floor(x)) + 10, w, h, ['#1b5777', '#0a2c47', '#04162a', '#01060e'], x)
  // Röhrenwürmer und Knochen eines Wals
  for (const [x, n] of [[176, 8], [388, 6], [612, 9]]) for (let i = 0; i < n; i++) { const X = x + i * 4 - n * 2 + hash(i, x) * 2, Y = floor(X), H1 = 7 + hash(i, x + 1) * 14; f.rect(X, Y - H1, 2, H1 + 2, C('#0d2c44')); f.rect(X, Y - H1, 1, H1, C('#1c5573')) }
  { const y0 = Math.round(floor(246)) + 2; for (let i = 0; i < 8; i++) { const x = 212 + i * 11, h = 26 - Math.abs(i - 3) * 2.5; for (let a = 0; a <= h; a++) { const X = x + Math.sin(a / h * 1.6) * 7; f.rect(X, y0 - a, 2, 1, mixI(C('#7c9fb2'), C('#0a2b45'), a / h * .3 + .35)) } } f.rect(206, y0 - 1, 100, 2, C('#2d5468')) }
})

// ---------------------------------------------------------------- Die Glutgrotte, fünf Tiefen
const DEPTH = {
  1: { wall: ['#100a10', '#160c12', '#1f0f14', '#2b1218', '#3a161a', '#4f1c1a', '#6b2518', '#8c3214', '#b44512'], lava: ['#ffc65a', '#ffaa36', '#fb8a22', '#ef6817', '#d94c11', '#b8370e', '#952a0d', '#74200c', '#55180b', '#3c120a', '#2a0e09', '#1d0b08'], hot: ['#ffe9a3', '#ffd877', '#ffc24e', '#ffa930', '#ff8f22'], seed: 101 },
  2: { wall: ['#120f11', '#191416', '#221b1c', '#2f2322', '#3f2d27', '#533529', '#6f3f27', '#92491f', '#b4531a'], lava: ['#ffb84c', '#fb9a2e', '#ee7a20', '#d95c18', '#be4513', '#9d3510', '#7d2a0f', '#60220e', '#471b0d', '#33160c', '#25110b', '#1a0d0a'], hot: ['#ffdf94', '#ffc867', '#ffae43', '#f8942c', '#ec7d20'], seed: 102 },
  3: { wall: ['#14070c', '#1f0a0f', '#2d0d11', '#401214', '#581815', '#772015', '#9b2c12', '#c23c10', '#e4530e'], lava: ['#ffd65e', '#ffb733', '#ff931f', '#fa6d12', '#e64a0d', '#c7320b', '#a2230b', '#7f190b', '#5e130a', '#430f09', '#2e0b08', '#1f0807'], hot: ['#fff0ad', '#ffe07c', '#ffc94d', '#ffae2c', '#ff931f'], seed: 103 },
  4: { wall: ['#0f0912', '#180c18', '#25101c', '#34141e', '#49191f', '#65211c', '#8a2e18', '#b44213', '#dd5f12'], lava: ['#ffdc6e', '#ffc040', '#ffa126', '#f97d17', '#e45710', '#c33c0d', '#9d2c0c', '#7a210b', '#5a190a', '#40130a', '#2c0e08', '#1e0a07'], hot: ['#fff3b8', '#ffe68a', '#ffd25a', '#ffb935', '#ffa126'], seed: 104 },
  5: { wall: ['#1a0a10', '#2a0f12', '#3e1612', '#581f10', '#7a2d0f', '#a0420d', '#c75c0c', '#e8800f', '#ffa820'], lava: ['#fff1a8', '#ffe072', '#ffc947', '#ffa82a', '#fb841b', '#e85f12', '#c9420e', '#a42f0c', '#7f220b', '#5c190a', '#401208', '#2b0d07'], hot: ['#ffffe0', '#fff6b3', '#ffe880', '#ffd455', '#ffbe35'], seed: 105 },
}
function basalt(f, x0, x1, base, hFn, col, lit, top, w = 13, heat = 0) {
  for (let x = x0; x < x1; x += w) {
    const h = Math.round(hFn(x)), X = x, Y = Math.round(base - h)
    for (let y = Y; y < base + 3; y++) { const q = Math.max(0, 1 - (base - y) / 46); f.rect(X, y, w - 1, 1, mixI(col, heat, Math.round(q * q * 4) / 4 * .85)) }
    f.rect(X + w - 3, Y, 2, h + 3, lit)   // Lavaschein von rechts unten
    for (let y = Y + 6; y < base; y += 7 + (x % 5)) f.rect(X + 1, y, w - 5, 1, mixI(col, 0, .3))
    f.poly([[X, Y], [X + 3, Y - 3], [X + w - 4, Y - 3], [X + w - 1, Y]], top)
    f.rect(X, Y, w - 1, 1, mixI(top, lit, .5))
  }
}
function stal(f, x, y0, len, w, body, rim, seed) { // hängt von der Decke, unten vom Lavaschein angestrahlt
  for (let dx = -w; dx <= w; dx++) {
    const k = 1 - Math.abs(dx) / w, b = y0 + len * Math.pow(k, 1.5) * (.9 + .2 * vn(dx * .3, seed))
    for (let y = Math.round(y0 - 20); y < b; y++) f.set(x + dx, y, b - y < 2 ? rim : b - y < 5 && (dx + y) % 3 ? mixI(body, rim, .5) : dx > w * .35 ? mixI(body, rim, .22) : body)
  }
}
function magmaSection(f, d) {
  // Abgekühlte Platten treiben in der Tiefe, dazwischen glühende Risse
  const pts = []; for (let i = 0; i < 120; i++) pts.push([hash(i, d.seed + 1) * VW, SF + 30 + hash(i, d.seed + 2) * (VH - SF), hash(i, d.seed + 3)])
  for (let y = SF + 28; y < VH; y++) for (let x = 0; x < VW; x++) {
    let d1 = 1e9, d2 = 1e9, id = 0
    for (let i = 0; i < pts.length; i++) { const dx = x - pts[i][0], dy = (y - pts[i][1]) * 1.5, q = dx * dx + dy * dy; if (q < d1) { d2 = d1; d1 = q; id = i } else if (q < d2) d2 = q }
    const k = (y - SF - 28) / (VH - SF - 28), keep = pts[id][2] < .06 + Math.pow(k, 1.4) * .9
    if (!keep) continue
    const e = Math.sqrt(d2) - Math.sqrt(d1), rad = 12 + pts[id][2] * 26 + k * 14
    const r = rad - Math.sqrt(d1) + (vn2(x * .2, y * .2, id) - .5) * 5
    if (e < 2.2 + k || r < 0) continue
    const edge = Math.min(e - 2.2 - k, r)
    const top = edge < 2.5, base = mixI(C('#2a1110'), C('#120808'), k)
    f.set(x, y, top ? mixI(C('#6d2a14'), C('#3a1610'), k) : vn2(x * .07, y * .1, id) > .6 ? mixI(base, C('#4a2018'), .45) : base)
  }
}
for (const n of [1, 2, 3, 4, 5]) {
  const d = DEPTH[n], s = d.seed
  art('welt-lava-' + n, VW, VH, (f) => {
    // Rückwand: unten vom Lavasee angeglüht, mit Rissen, die der Hitze folgen
    bands(f, 0, HZ + 2, d.wall, 1.55, 1.3, s)
    for (let i = 0; i < 16; i++) { // Risse: laufen von unten zur Wand hinauf
      let x = 240 + hash(i, s + 4) * 530, y = HZ - hash(i, s + 5) * 10; const L = 30 + hash(i, s + 6) * 70
      for (let k = 0; k < L; k++) { x += (vn(k * .13, s + i) - .5) * 2.4; y -= .9; f.set(x, y, k < L * .55 ? C(d.hot[3]) : C(d.lava[5])); if (k % 2) f.set(x + 1, y, C(d.lava[6])) }
    }
    // Basaltsäulen: eine geschlossene Wand, deren Kanten nur wenig springen; dazu zwei große Pfeiler
    const wallLit = C(d.wall[8]), bump = (x) => Math.pow(fbm(x * .009, s), 2) * 190
    const rise = (x) => Math.min(1, Math.max(0, (x - 130) / 110))
    basalt(f, 130, VW + 13, HZ + 2, (x) => (26 + bump(x) + ((x * 7) % 9)) * rise(x), C(d.wall[2]), mixI(C(d.wall[3]), wallLit, .22), C(d.wall[4]), 12, C(d.wall[7]))
    basalt(f, 130, VW + 13, HZ + 2, (x) => (8 + Math.pow(fbm(x * .014 + 4, s + 1), 2) * 120 + ((x * 11) % 7)) * rise(x), C(d.wall[1]), mixI(C(d.wall[2]), wallLit, .5), C(d.wall[3]), 16, C(d.wall[8]))
    // Tiefe 2: Aschedünen und gebrochene Bögen
    if (n === 2) {
      const ash = C('#8d8380'), ashL = C('#c6bbb0'), ashD = C('#5a4f4d')
      for (const [cx, h, w] of [[380, 86, 22], [610, 110, 26]]) { f.poly([[cx - w, HZ + 2], [cx - w * .7, HZ - h], [cx + w * .5, HZ - h - 8], [cx + w, HZ + 2]], C('#2e2321')); f.rect(cx + w * .5, HZ - h, 3, h + 2, wallLit); f.poly([[cx - w * .7, HZ - h], [cx + w * .5, HZ - h - 8], [cx + w * .4, HZ - h - 2], [cx - w * .7, HZ - h + 5]], ashL) }
      f.poly([[380 + 12, HZ - 86], [610 - 18, HZ - 112], [610 - 18, HZ - 100], [504, HZ - 88], [392, HZ - 74]], C('#2e2321'))
      ridge(f, 244, VW, (x) => HZ - 6 - 16 * Math.pow(fbm(x * .018, s + 7), 1.6), (x, y) => (vn2(x * .05, y * .3, 5) > .6 ? ash : ashD), HZ + 3, ashL, 2)
    }
    // Tiefe 4: Drachenskelett und Goldhaufen
    if (n === 4) {
      const bone = C('#d9c7a5'), boneD = C('#8d6f55'), gold = C('#f4bd38'), goldL = C('#ffe788'), goldD = C('#a8631a')
      for (let x = 650; x < VW; x++) { const t = HZ + 2 - 42 * Math.pow(Math.sin(Math.PI * Math.min(1, (x - 650) / 130)), .8) * (.86 + .3 * fbm(x * .06, 3)); for (let y = Math.round(t); y < HZ + 3; y++) { const v = h2(Math.floor(x / 3), Math.floor((y + x % 2) / 2)); f.set(x, y, y - t < 2 ? goldL : v > .7 ? goldL : v > .28 ? gold : goldD) } }
      for (let i = 0; i < 8; i++) { const x = 296 + i * 30, h = 60 - Math.abs(i - 2.5) * 6; for (let a = 0; a <= h; a++) { const X = x + Math.sin(a / h * 2.3) * 22; f.rect(X, HZ + 3 - a, 3, 1, a % 11 === 0 ? boneD : bone); f.set(X + 3, HZ + 3 - a, boneD) } }
      for (let x = 286; x < 545; x++) { const y = HZ - 56 - (x - 286) * -.02 - Math.sin((x - 286) / 258 * Math.PI) * 12; f.rect(x, y + 1, 1, 2, boneD); f.rect(x, y - 1, 1, 2, bone) }
      for (let i = 0; i < 9; i++) f.rect(292 + i * 28, HZ - 62 - Math.sin(i / 9 * Math.PI) * 12, 4, 6, bone)
      // Schädel
      const sx = 560, sy = HZ - 44
      f.poly([[sx - 18, sy - 12], [sx + 20, sy - 22], [sx + 62, sy - 6], [sx + 66, sy + 4], [sx + 34, sy + 12], [sx + 30, sy + 22], [sx + 2, sy + 22], [sx - 14, sy + 12]], bone)
      f.poly([[sx + 20, sy - 22], [sx + 62, sy - 6], [sx + 66, sy + 4], [sx + 40, sy + 2]], C('#c3ad8a'))
      f.poly([[sx - 16, sy - 12], [sx - 36, sy - 30], [sx - 8, sy - 18]], bone); f.poly([[sx + 2, sy - 18], [sx - 14, sy - 42], [sx + 16, sy - 22]], bone) // Hörner
      f.ell(sx + 18, sy - 6, 7, 5, C('#180a0c')); f.rect(sx + 18, sy - 7, 3, 3, C(d.hot[2])); f.ell(sx + 52, sy - 3, 3, 2, C('#180a0c'))
      for (let i = 0; i < 6; i++) f.poly([[sx + 26 + i * 6, sy + 5 - i], [sx + 30 + i * 6, sy + 5 - i], [sx + 28 + i * 6, sy + 13 - i]], C('#f4ecd6'))
      f.poly([[sx + 2, sy + 22], [sx + 36, sy + 26], [sx + 56, sy + 42], [sx + 26, sy + 40], [sx - 2, sy + 42]], bone)
      for (let i = 0; i < 5; i++) f.poly([[sx + 18 + i * 7, sy + 28 + i * 1.6], [sx + 22 + i * 7, sy + 29 + i * 1.6], [sx + 20 + i * 7, sy + 21 + i * 1.6]], C('#f4ecd6'))
    }
    // Tiefe 5: Felsnadel mit Phönixnest
    if (n === 5) {
      const sp = (x, y) => (vn2(x * .07, y * .05, 5) > .62 ? C('#5a2a18') : x > 600 ? C('#7a3a14') : C('#2d1410'))
      for (let y = 120; y < HZ + 3; y++) { const k = (y - 120) / (HZ + 3 - 120), hw = 12 + Math.pow(k, 1.6) * 44 + (fbm(y * .06, 7) - .5) * 12; for (let x = Math.round(590 - hw); x < 590 + hw; x++) f.set(x, y, x > 590 + hw - 3 ? C('#ffb030') : sp(x, y)) }
      for (let i = 0; i < 210; i++) { const a = hash(i, 8) * Math.PI * 2, r = .35 + hash(i, 9) * .65, cx = 590 + Math.cos(a) * 46 * r, cy = 110 + Math.sin(a) * 15 * r, l = 8 + hash(i, 10) * 16, an = (hash(i, 11) - .5) * 1.2; f.line(cx - Math.cos(an) * l, cy - Math.sin(an) * l, cx + Math.cos(an) * l, cy + Math.sin(an) * l, i % 3 === 0 ? C('#d8a15a') : i % 3 === 1 ? C('#8a5428') : C('#5c3218')) }
      f.ell(590, 100, 26, 7, C('#2c140c')); // Mulde (das Ei und der Schein kommen vom Spiel)
      for (let i = 0; i < 70; i++) { const a = hash(i, 14) * 3.14, cx = 590 + Math.cos(a) * 42, cy = 104 + Math.sin(a) * 15, l = 6 + hash(i, 15) * 12, an = (hash(i, 16) - .5) * 1; f.line(cx - l * Math.cos(an), cy - l * Math.sin(an), cx + l * Math.cos(an), cy + l * Math.sin(an), i % 2 ? C('#f3c47f') : C('#a4692f')) }
    }
    // Decke und Stalaktiten
    const ceil = (x) => 18 + 28 * fbm(x * .008, s + 8)
    const stone = C(n === 5 ? '#2a1110' : '#160d10'), rim = C(d.wall[7])
    for (let i = 0; i < 46; i++) { const x = hash(i, s + 9) * VW, len = 14 + Math.pow(hash(i, s + 10), 1.7) * (n === 3 ? 96 : 76), w = 6 + hash(i, s + 11) * (6 + len * .14); stal(f, Math.round(x), Math.round(ceil(x)) + 2, Math.round(len), Math.round(w), stone, rim, s + i) }
    for (let x = 0; x < VW; x++) { const t = Math.round(ceil(x)); for (let y = 0; y <= t; y++) f.set(x, y, stone); f.set(x, t + 1, mixI(stone, rim, .5)) }
    // Kristalle ab Tiefe 3
    if (n >= 3) for (let i = 0; i < 26; i++) {
      const x = 30 + hash(i, s + 12) * (VW - 60), y = ceil(x) + 2, h = 7 + hash(i, s + 13) * 14, c = i % 3 === 0 ? ['#a5f3fc', '#22d3ee', '#0e7490'] : i % 3 === 1 ? ['#f5d0fe', '#d946ef', '#86198f'] : ['#fef3c7', '#fbbf24', '#b45309']
      f.poly([[x - 3, y], [x + 3, y], [x, y + h]], C(c[1])); f.line(x - 2, y, x, y + h - 2, C(c[0])); f.line(x + 2, y, x + 1, y + h - 2, C(c[2]))
    }
    // Lavasee in der Ferne
    bands(f, HZ + 2, SF, d.hot, 1, .22, s)
    for (let i = 0; i < 34; i++) { const y = HZ + 3 + Math.floor(hash(i, s + 14) * 20), x = hash(i, s + 15) * VW, w = 8 + hash(i, s + 16) * (10 + (y - HZ) * 2.6), h = y > 196 ? 2 : 1; f.rect(x, y, w, h, C(d.lava[8])); f.rect(x, y, w, 1, C(d.lava[6])) }
    // die Säulen spiegeln sich
    for (let y = HZ + 2; y < SF; y++) for (let x = 244; x < VW; x++) { const src = f.get(x, HZ - (y - HZ) * 2); if (h2(Math.floor((x + y) / 6), y) < .55) continue; if (src >= 0 && ((src & 255) < 40) && ((src >> 16) & 255) < 90) f.set(x, y, mixI(f.get(x, y), C(d.lava[3]), .55)) }
    // Magma im Querschnitt
    bands(f, SF, VH, d.lava, .85, 1.7, s + 3)
    magmaSection(f, d)
    // Grund: erkaltetes Gestein
    const bed = (x) => 402 + 34 * (fbm(x * .018, s + 17) - .5) + 9 * (fbm(x * .07, s + 18) - .5) - 7 * Math.pow(Math.abs(Math.sin(x * .021 + s)), 6)
    ridge(f, 0, VW, bed, (x, y) => (y - bed(x) < 4 ? C('#2a1210') : C('#120808')), VH, C(d.lava[4]), 1)
  })
}
// Der Felsvorsprung, auf dem man in der Grotte steht: Basaltsäulen, die zur Lava hin glühen
art('welt-lava-fels', 234, 238, (f) => {
  const W0 = 232, cols = [15, 17, 13, 18, 14, 16, 15, 17, 13, 16, 19, 15, 14, 16, 14]
  let x = 0, ci = 0
  while (x < W0) {
    const w = Math.min(cols[ci++ % cols.length], W0 - x), drop = Math.round(2 + hash(ci, 2) * 6), heat = Math.pow(x / W0, 3.2)
    const base = mixI(C('#2a2220'), C('#3f2420'), heat), lit = mixI(C('#4a3d38'), C('#b4501e'), heat), dk = mixI(C('#191414'), C('#2a1614'), heat)
    f.rect(x, 12 + drop, w, 226, base)
    f.rect(x, 12 + drop, 2, 226, lit); f.rect(x + w - 2, 12 + drop, 2, 226, dk)
    for (let y = 22 + (ci * 7) % 11; y < 238; y += 11 + (ci * 3) % 13) { f.rect(x + 2, y, w - 4, 1, dk); f.rect(x + 2, y + 1, w - 4, 1, lit) }
    x += w
  }
  // Deckplatte mit Kante
  ridge(f, 0, 232, () => 1, (X, y) => { const v = vn2(X * .05, y * .4, 3); return y < 5 ? C('#6f5f58') : v > .6 ? C('#544641') : C('#403431') }, 15)
  for (let X = 0; X < 232; X++) { const dp = 15 + Math.round(fbm(X * .08, 4) * 7); for (let y = 15; y < dp; y++) f.set(X, y, y === dp - 1 ? C('#1a1414') : C('#2d2523')) }
  for (let i = 0; i < 14; i++) f.rect(hash(i, 5) * 226, 3 + hash(i, 6) * 8, 3 + hash(i, 7) * 12, 1, C('#2a2220'))
  // Glühende Adern und die heiße Kante rechts
  for (let i = 0; i < 9; i++) { let X = 40 + hash(i, 9) * 190, y = 60 + hash(i, 10) * 150; const n = 20 + hash(i, 11) * 34; for (let k = 0; k < n; k++) { X += (vn(k * .2, i + 3) - .5) * 2.6; y += .9; f.set(X, y, k % 4 === 0 ? C('#ffd98a') : C('#f97316')); f.set(X + 1, y, C('#9a3412')) } }
  for (let y = 14; y < 238; y++) { f.set(231, y, C('#fb923c')); f.set(232, y, y % 3 ? C('#ea580c') : C('#fbbf24')); f.set(230, y, y % 2 ? C('#9a3412') : C('#c2410c')) }
  f.rect(0, 232, 232, 6, C('#b23a10')); f.rect(0, 230, 232, 2, C('#7c2610'))
})

// ---------------------------------------------------------------- Die Sonneninsel: türkises Flachwasser, Palmen und Sport (5 Buchten)
// Aufbau je Bucht: Ferne im Dunst, die Hauptkulisse der Bucht mit Strand und Spiegelung, darunter ein Riff im Flachwasser.
const INSEL_W = ['#4fd8cf', '#3ccbc8', '#2bb9c0', '#20a5b6', '#198fa8', '#147898', '#106385', '#0c5072', '#093f5f', '#07304c', '#05233a', '#03182a']
const HAZE = C('#a9dcea')
const hz = (c, k) => mixI(C(c), HAZE, k)
// ferne Inseln: weiche Hügel im Dunst, je weiter, desto blasser; winzige Palmen-Silhouetten auf dem Kamm
function farIsle(f, x0, x1, top, seed, k) {
  const fn = (x) => { const u = (x - x0) / (x1 - x0); return HZ - 1 - top * Math.pow(Math.sin(Math.PI * u), .8) * (.75 + .35 * fbm(x * .03, seed)) }
  ridge(f, x0, x1, fn, (x, y) => vn2(x * .12, y * .2, seed) > .58 ? hz('#3f9a6e', k) : hz('#2f7d5c', k), HZ + 1, hz('#7cc79a', k), 1)
  for (let i = 0; i < (x1 - x0) / 26; i++) { const x = Math.round(x0 + 10 + hash(i, seed) * (x1 - x0 - 20)), t = Math.round(fn(x)); if (t > HZ - 6) continue; f.rect(x, t - 6, 1, 6, hz('#2f5d46', k)); for (const d of [-3, -2, -1, 1, 2, 3]) f.set(x + d, t - 6 + Math.abs(d) * .5, hz('#2f7d5c', k)) }
  f.rect(x0 + 6, HZ - 1, x1 - x0 - 12, 2, hz('#f1e3b0', k))
}
// Baumkrone von oben links beleuchtet
const CAN = [['#86efac', '#4ade80', '#22c55e', '#15803d', '#14532d'], ['#a3e635', '#65a30d', '#4d7c0f', '#3f6212', '#283f0e'], ['#6ee7b7', '#34d399', '#059669', '#047857', '#064e3b']]
function crown(f, x, y, r, seed, pal = CAN[0], shade = 0) {
  const P = pal.map((c) => mixI(C(c), HAZE, shade))
  f.ell(x, y, r, Math.max(2, Math.round(r * .8)), (X, Y) => {
    const dx = (X - x) / r, dy = (Y - y) / r, l = -dx * .6 - dy * .8 + (vn2(X * .5, Y * .5, seed) - .5) * .9
    return l > .75 ? P[0] : l > .25 ? P[1] : l > -.3 ? P[2] : l > -.75 ? P[3] : P[4]
  })
}
// Dschungelhügel: dunkler Rücken, darauf viele Kronen von hinten nach vorn, unten Strand mit nassem Saum
function jungle(f, x0, x1, top, seed, { pal = 0, beach = true, shade = 0, peakAt = .5 } = {}) {
  const fn = (x) => { const u = (x - x0) / (x1 - x0), w = u < peakAt ? u / peakAt : (1 - u) / (1 - peakAt); return HZ - 3 - top * Math.pow(Math.sin(Math.PI / 2 * Math.max(0, w)), .75) * (.8 + .3 * fbm(x * .025, seed)) }
  ridge(f, x0, x1, (x) => fn(x) + 4, (x, y) => mixI(C('#14532d'), HAZE, shade), HZ + 1)
  const crowns = []
  for (let i = 0; i < (x1 - x0) * top / 90; i++) { const x = x0 + 6 + hash(i, seed) * (x1 - x0 - 12), t = fn(x), y = t + 4 + hash(i + 50, seed) * (HZ - t - 6); crowns.push([x, y, 4 + Math.round(hash(i + 90, seed) * 5)]) }
  crowns.sort((a, b) => a[1] - b[1])
  for (const [x, y, r] of crowns) crown(f, Math.round(x), Math.round(y), r, seed + Math.round(x), CAN[(pal + (x % 3 === 0 ? 1 : 0)) % 3], shade)
  if (beach) {
    for (let x = x0 - 6; x < x1 + 6; x++) {
      const b = 2 + Math.round(2 * fbm(x * .05, seed + 3))
      for (let y = HZ - b; y <= HZ + 1; y++) f.set(x, y, y >= HZ + 1 ? mixI(C('#c9a96a'), HAZE, shade) : y === HZ ? mixI(C('#e2c98c'), HAZE, shade) : mixI(C('#f6e6b4'), HAZE, shade))
      if (hash(x, seed) < .3) f.set(x, HZ + 1, C('#f0fdfa'))
    }
  }
  return fn
}
// Felsen am Ufer, sonnig
const SUNROCK = ['#e7ded0', '#bfb3a2', '#8c8170', '#5f5649']
// Spiegelung im Wasser direkt unter dem Horizont, nach unten aufgelöst
function mirror(f, x0, x1, alpha = .5) {
  for (let y = HZ + 2; y < SF; y++) {
    const k = (y - HZ - 2) / (SF - HZ - 2), off = Math.round(Math.sin(y * 1.9) * (1 + k * 3))
    for (let x = x0; x < x1; x++) {
      const src = f.get(x + off, HZ - (y - HZ) * 1.6); if (src < 0) continue
      if (h2(Math.floor((x + y * 3) / 9), y) < .2 + k * .65) continue
      f.set(x, y, mixI(src, f.get(x, y), alpha + k * .2))
    }
  }
}
// Korallen mit Licht: 0 Hirn, 1 Geweih, 2 Fächer, 3 Röhren, 4 Tisch, 5 Anemone
const CPAL = [['#fbcfe8', '#f472b6', '#db2777', '#831843'], ['#fed7aa', '#fb923c', '#ea580c', '#7c2d12'], ['#ddd6fe', '#a78bfa', '#7c3aed', '#4c1d95'],
  ['#fef08a', '#facc15', '#ca8a04', '#713f12'], ['#a5f3fc', '#22d3ee', '#0891b2', '#164e63'], ['#bbf7d0', '#4ade80', '#16a34a', '#14532d']]
function coral(f, x, y, kind, pi, tint) {
  const P = CPAL[pi % CPAL.length].map(C), t = (c, Y) => (tint ? tint(c, Y) : c)
  if (kind === 0) { // Hirnkoralle: Kuppel mit gewundenen Rillen
    f.ell(x, y - 7, 12, 8, (X, Y) => { const l = -(X - x) / 12 - (Y - y + 7) / 8, g = Math.sin((X - x) * .9 + Math.sin((Y - y) * .8) * 2) > .55; return t(g ? P[3] : l > .6 ? P[0] : l > -.2 ? P[1] : P[2], Y) })
  } else if (kind === 1) { // Geweihkoralle: verzweigt
    const br = (X, Y, a, len, d) => { for (let k = 0; k < len; k++) { const px = X + Math.cos(a) * k, py = Y + Math.sin(a) * k; f.set(px, py, t(P[2], py)); f.set(px - 1, py, t(P[1], py)) } const ex = X + Math.cos(a) * len, ey = Y + Math.sin(a) * len; f.set(ex, ey, t(P[0], ey)); if (d > 0) { br(ex, ey, a - .45, len * .7, d - 1); br(ex, ey, a + .4, len * .65, d - 1) } }
    br(x, y, -Math.PI / 2 - .2, 9, 2); br(x + 3, y, -Math.PI / 2 + .35, 7, 2)
  } else if (kind === 2) { // Fächer: Gitter
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .2; for (let k = 0; k < 24; k++) { const X = x + Math.cos(a) * k, Y = y + Math.sin(a) * k; f.set(X, Y, t(k > 18 ? P[0] : i < 4 ? P[1] : P[2], Y)) } }
    for (let k = 6; k < 24; k += 4) for (let i = -8; i <= 8; i++) { const a = -Math.PI / 2 + i * .1; f.set(x + Math.cos(a) * k, y + Math.sin(a) * k, t(P[2], y - k)) }
    f.rect(x - 1, y - 2, 3, 3, t(P[3], y))
  } else if (kind === 3) { // Röhrenschwamm: Licht links, dunkle Öffnung oben
    for (let i = -2; i <= 2; i++) { const hh = 10 + Math.round(hash(i, x) * 14), X = x + i * 4; f.rect(X, y - hh, 4, hh, t(P[1], y)); f.rect(X, y - hh, 1, hh, t(P[0], y)); f.rect(X + 3, y - hh, 1, hh, t(P[2], y)); f.rect(X + 1, y - hh, 2, 1, t(P[3], y - hh)); f.rect(X, y - hh - 1, 4, 1, t(P[0], y - hh)) }
  } else if (kind === 4) { // Tischkoralle: flache Platte auf einem Stiel
    f.rect(x - 1, y - 8, 3, 8, t(P[2], y)); f.ell(x, y - 10, 15, 3, (X, Y) => t(Y < y - 11 ? P[0] : Y > y - 9 ? P[2] : P[1], Y)); for (let i = -14; i <= 14; i += 3) f.set(x + i, y - 7, t(P[3], y))
  } else { // Anemone: wogende Tentakel mit hellen Spitzen
    f.ell(x, y - 2, 6, 3, t(P[2], y)); for (let i = 0; i < 11; i++) { const a = -Math.PI + i / 10 * Math.PI; for (let k = 0; k < 9; k++) { const X = x + Math.cos(a) * k * .9 + Math.sin(k * .7 + i) * .8, Y = y - 3 + Math.sin(a) * k; f.set(X, Y, t(k > 6 ? P[0] : P[1], Y)) } }
  }
}
function starfish(f, x, y, col) { const k = C(col), d = mixI(k, C('#30264a'), .35), l = mixI(k, C('#ffffff'), .35); for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 - 1.57; f.line(x, y, x + Math.cos(an) * 6, y + Math.sin(an) * 3.5, k, 2); f.set(x + Math.cos(an) * 3, y + Math.sin(an) * 2 - 1, l) } f.set(x, y, d) }
function urchin(f, x, y) { f.ell(x, y, 3, 2, C('#1e1b4b')); for (let a = 0; a < 6.28; a += .5) f.line(x, y, x + Math.cos(a) * 6, y + Math.sin(a) * 4 - 1, C('#312e81')); f.set(x - 1, y - 1, C('#6366f1')) }
function shell(f, x, y) { f.ell(x, y, 3, 2, C('#fde7d6')); for (let i = -2; i <= 2; i++) f.line(x, y + 2, x + i * 1.4, y - 2, C('#e8b9a0')); f.set(x - 1, y - 1, C('#ffffff')) }

function inselBase(f, bay) {
  const wat = atY(INSEL_W, SF, VH, .8)
  // Oberflächenwasser zwischen Horizont und Wasserlinie, Lichtstriche
  bands(f, HZ + 1, SF, ['#c8f7ee', '#a6efe4', '#84e4da', '#69d8d2', '#55cdcc', '#47c2c6'], 1, .25, 11 + bay)
  for (let i = 0; i < 60; i++) { const y = HZ + 2 + Math.floor(hash(i, 171) * 20), x = hash(i, 172) * VW, n = 6 + hash(i, 173) * (8 + (y - HZ) * 1.6); if (f.get(x, y) >= 0) f.rect(x, y, n, 1, y < HZ + 9 ? C('#f0fffb') : C('#d3faf2')) }
  bands(f, SF, VH, INSEL_W, .8, 1.2, 19 + bay)
  // Lichtnetz (Kaustik) knapp unter der Oberfläche
  for (let y = SF + 1; y < SF + 90; y++) for (let x = 0; x < VW; x++) {
    const n = Math.abs(Math.sin(x * .09 + Math.sin(y * .11 + bay) * 2.2) + Math.sin(y * .23 + Math.sin(x * .05) * 1.6))
    if (n < .1 && hash(x, y) < .85 - (y - SF) / 100) f.set(x, y, mixI(wat(y), C('#e0fffa'), .32 - (y - SF) * .0032))
  }
  // ferne Riffkanten, die im Blau verschwinden
  ridge(f, 0, VW, (x) => 310 + 34 * fbm(x * .007, 191 + bay), (x, y) => mixI(wat(y), C('#0b5770'), .3), VH, (x, y) => mixI(wat(y), C('#5ed0c8'), .25), 1)
  ridge(f, 0, VW, (x) => 350 + 26 * fbm(x * .012 + 4, 192 + bay), (x, y) => mixI(wat(y), C('#094560'), .45), VH, (x, y) => mixI(wat(y), C('#49b5b4'), .3), 1)
  // Sandgrund mit Rippeln, Licht auf den Kämmen
  const floor = (x) => 394 + 10 * (fbm(x * .01, 190 + bay) - .5) + 3 * Math.sin(x * .03) - 6 * Math.max(0, (x - 520) / 248)
  ridge(f, 0, VW, floor, (x, y) => { const d = y - floor(x), r = Math.sin(x * .45 + Math.sin(y * .4) * 1.5 + y * .9); return d < 2 ? C('#f6e3a8') : r > .82 ? C('#f2dca0') : r < -.82 ? C('#b99a5e') : d < 10 ? C('#dcc287') : d < 22 ? C('#c9ac70') : C('#b08f57') }, VH)
  for (let i = 0; i < 14; i++) { const x = hash(i, 195 + bay) * VW, y = Math.round(floor(x)) + 5 + hash(i, 196) * 10; i % 3 === 0 ? starfish(f, x, y, ['#fb7185', '#f97316', '#e11d48'][i % 3]) : i % 3 === 1 ? shell(f, x, y) : f.ell(x, y, 2, 1, C('#8a7650')) }
  return { wat, floor }
}
// Riff: Felsen mit Algen, oben drauf Korallen
const RP = ['#7cc6bf', '#4b9a9a', '#2b6f7a', '#163f4f']
function reef(f, x, w, h, floor, wat, seed, n = 5) {
  const by = Math.round(floor(x)) + 6, tint = (c, y) => mixI(c, wat(y), .2)
  rock(f, x, by, w, h, RP, seed, tint)
  for (let i = 0; i < w / 6; i++) { const X = x - w / 2 + hash(i, seed) * w, Y = by - h * .3 * hash(i + 3, seed) - 4; f.rect(X, Y, 2 + hash(i, seed + 1) * 4, 1, mixI(C('#4ade80'), wat(Y), .45)) }
  for (let i = 0; i < n; i++) { const cx = x - w * .38 + i * w * .76 / Math.max(1, n - 1), top = by - h * Math.pow(Math.sin(Math.PI * (cx - x + w / 2) / w), .55) * .9; coral(f, Math.round(cx), Math.round(top) + 3, (i + seed) % 6, i + seed, (c, Y) => mixI(c, wat(Y), .12)) }
}
function seagrass(f, floor, wat, seed, n, x0 = 0, x1 = VW) {
  for (let i = 0; i < n; i++) { const x = x0 + hash(i, seed) * (x1 - x0), y = Math.round(floor(x)) + 2, hh = 6 + hash(i, seed + 1) * 20, dk = i % 3 === 0; for (let k = 0; k < hh; k++) f.set(x + Math.sin(k * .3 + i) * (k * .1), y - k, mixI(dk ? C('#0f766e') : k > hh - 3 ? C('#86efac') : C('#22a06b'), wat(y - k), .15)) }
}
// Schatten des Stegs links (wie am Steg)
function dockShade(f) {
  f.darken((x, y) => {
    if (y <= SF) return 0
    const d = (y - SF) / 160; if (d >= 1) return 0
    const edge = 226 + (y - SF) * .3 + Math.sin(y * .13) * 4 + Math.sin(y * .37 + x * .02) * 2
    const side = Math.max(0, Math.min(1, (edge - x) / 46 + .06 * Math.sin(y * 1.7)))
    return Math.round(side * (1 - d) * Math.min(1, (y - SF) / 5) * 5) / 5 * .28
  }, C('#063a4a'))
}
// Requisiten über Wasser
function towelS(f, x, y, a, b) { for (let i = 0; i < 9; i++) f.rect(x + i, y, 1, 2, Math.floor(i / 2) % 2 ? C(a) : C(b)) }
function sail(f, x, y, s = 1, col = '#f8fafc') { // kleines Segelboot in der Ferne
  f.poly([[x - 9 * s, y], [x + 9 * s, y], [x + 6 * s, y + 3 * s], [x - 6 * s, y + 3 * s]], C('#334155')); f.rect(x, y - 16 * s, 1, 16 * s, C('#475569'))
  f.poly([[x + 1, y - 15 * s], [x + 1, y - 1], [x + 9 * s, y - 1]], C(col)); f.poly([[x - 1, y - 12 * s], [x - 1, y - 1], [x - 7 * s, y - 1]], mixI(C(col), C('#94a3b8'), .3))
}
function buoy(f, x, y, col) { f.ell(x, y, 2, 2, C(col)); f.set(x - 1, y - 1, C('#ffffff')); f.rect(x - 2, y + 2, 5, 1, C('#e0fbf6')) }
function hutL(f, x, y, w = 24) { // Strandhütte mit Schattenseite und Fenster
  const wall = C('#d9a866'), wallD = C('#b07d3a')
  f.rect(x + 3, y - 12, w - 6, 12, wall); for (let i = 0; i < w - 6; i += 3) f.rect(x + 3 + i, y - 12, 1, 12, C('#c08a45')); f.rect(x + w - 7, y - 12, 4, 12, wallD)
  f.rect(x + w / 2 - 2, y - 8, 5, 8, C('#4a2c12')); f.rect(x + 6, y - 9, 4, 3, C('#7dd3fc')); f.rect(x + 6, y - 9, 2, 1, C('#e0f2fe'))
  f.poly([[x - 3, y - 11], [x + w / 2, y - 23], [x + w + 3, y - 11]], (X, Y) => X > x + w / 2 + 2 ? ((X + Y) % 3 ? C('#c79a4a') : C('#a87a33')) : ((X + Y) % 3 ? C('#f0d48c') : C('#d9b062')))
  f.line(x - 3, y - 11, x + w + 3, y - 11, C('#8a6326'))
}

const BAYS = {
  1(f) { // Palmenstrand: lange Insel mit Strand, Hütten, Schirmen, ein Segler draußen
    farIsle(f, 0, 170, 12, 3, .6); farIsle(f, 150, 300, 7, 4, .7); farIsle(f, 300, 420, 9, 5, .5)
    sail(f, 330, HZ + 1, .9)
    const fn = jungle(f, 400, 790, 52, 201, { peakAt: .55 })
    for (const [x, h, l] of [[440, 44, 1.1], [470, 56, -.6], [532, 50, .5], [604, 62, -.4], [668, 48, .8], [726, 54, -.9], [752, 40, .4]]) palm(f, x, HZ - 2, h, l, x)
    hutL(f, 556, HZ - 2); hutL(f, 636, HZ - 2, 20)
    umbrella(f, 462, HZ - 1, '#ef4444', '#f8fafc'); umbrella(f, 514, HZ - 1, '#3b82f6', '#fde047'); umbrella(f, 700, HZ - 1, '#f97316', '#f8fafc')
    towelS(f, 476, HZ - 2, '#f43f5e', '#fde047'); towelS(f, 520, HZ - 2, '#22d3ee', '#f8fafc'); towelS(f, 684, HZ - 2, '#a855f7', '#f8fafc')
    rock(f, 410, HZ + 2, 22, 8, SUNROCK, 7); rock(f, 770, HZ + 2, 30, 10, SUNROCK, 8)
    f.mir = [395, 768]
  },
  2(f) { // Korallenriff: kleine Inselchen mit Palmen, eine Sandbank, ein Katamaran
    farIsle(f, 0, 160, 10, 3, .6); farIsle(f, 170, 260, 6, 4, .7)
    for (const [a, b, h, s] of [[320, 420, 18, 210], [500, 590, 12, 211], [640, 790, 26, 212]]) { jungle(f, a, b, h, s, { pal: s % 3 }); palm(f, Math.round((a + b) / 2) - 10, HZ - 2, 36, .7, s); palm(f, Math.round((a + b) / 2) + 14, HZ - 2, 30, -.6, s + 1) }
    for (let x = 430; x < 492; x++) { const b = Math.round(1 + Math.sin((x - 430) / 62 * Math.PI) * 2); for (let y = HZ - b; y <= HZ; y++) f.set(x, y, y === HZ ? C('#e2c98c') : C('#f8ecc4')) } // Sandbank
    { const x = 600, y = HZ + 1; f.rect(x - 16, y - 3, 32, 2, C('#f8fafc')); f.rect(x - 14, y - 1, 10, 2, C('#cbd5e1')); f.rect(x + 4, y - 1, 10, 2, C('#cbd5e1')); f.rect(x - 1, y - 30, 1, 27, C('#64748b')); f.poly([[x + 1, y - 29], [x + 1, y - 4], [x + 14, y - 4]], C('#f8fafc')); f.poly([[x + 1, y - 29], [x + 1, y - 18], [x + 7, y - 18]], C('#38bdf8')) }
    f.mir = [300, 768]
  },
  3(f) { // Sportbucht: Bootshaus auf Stelzen, Rampe, Fahnen, Bojenkette
    farIsle(f, 0, 200, 11, 3, .6); farIsle(f, 200, 330, 6, 4, .7)
    jungle(f, 470, 790, 34, 220, { pal: 1, peakAt: .7 })
    for (const [x, h, l] of [[700, 48, -.5], [742, 42, .6], [486, 34, .5]]) palm(f, x, HZ - 2, h, l, x)
    { const x = 520, y = HZ - 4
      for (const sx of [0, 10, 30, 40]) { f.rect(x + sx, y, 2, 9, C('#5b3a1a')); f.set(x + sx, y, C('#8a5a2b')) }
      f.rect(x - 4, y - 2, 52, 3, C('#a16207')); f.rect(x - 4, y - 2, 52, 1, C('#d4a24a'))
      f.rect(x, y - 18, 44, 16, C('#38bdf8')); for (let i = 0; i < 44; i += 4) f.rect(x + i, y - 18, 1, 16, C('#0ea5e9')); f.rect(x + 34, y - 18, 10, 16, C('#0284c7'))
      f.rect(x + 14, y - 13, 12, 11, C('#0c4a6e')); f.rect(x + 14, y - 13, 12, 2, C('#075985')); f.rect(x + 4, y - 14, 6, 4, C('#e0f2fe')); f.rect(x + 4, y - 14, 3, 2, C('#ffffff'))
      f.poly([[x - 5, y - 18], [x + 22, y - 31], [x + 49, y - 18]], (X, Y) => X > x + 24 ? C('#be123c') : (Math.floor((X - x) / 5) % 2 ? C('#f43f5e') : C('#fb7185')))
      f.rect(x - 5, y - 19, 54, 1, C('#9f1239')); }
    f.poly([[596, HZ + 3], [638, HZ - 9], [646, HZ - 9], [646, HZ + 3]], C('#ca8a04')); f.line(596, HZ + 3, 638, HZ - 9, C('#fde047')); for (let i = 0; i < 5; i++) f.line(604 + i * 8, HZ + 1 - i * 2.3, 604 + i * 8, HZ + 3, C('#a16207'))
    for (const [x, c] of [[660, '#ef4444'], [676, '#facc15'], [692, '#22c55e']]) { f.rect(x, HZ - 36, 1, 36, C('#e5e7eb')); f.poly([[x + 1, HZ - 36], [x + 13, HZ - 33], [x + 1, HZ - 29]], (X, Y) => X > x + 8 ? mixI(C(c), C('#1e293b'), .25) : C(c)) }
    for (let i = 0; i < 14; i++) buoy(f, 250 + i * 24, HZ + 4 + Math.round(Math.sin(i) * .6), i % 2 ? '#f97316' : '#f8fafc')
    f.mir = [460, 768]
  },
  4(f) { // Wasserfall-Lagune: hohe Klippe mit Schichten, Dschungel hängt über die Kante, Wasserfall mit Gischt
    farIsle(f, 0, 180, 12, 3, .6); farIsle(f, 200, 330, 8, 4, .7)
    jungle(f, 370, 480, 16, 233, { pal: 2 }); palm(f, 448, HZ - 2, 40, .5, 4)
    const top = (x) => HZ - 6 - 96 * Math.pow(Math.min(1, Math.max(0, (x - 478) / 130)), .7) * (.86 + .22 * fbm(x * .04, 230))
    const CL = ['#9aa6b8', '#717d93', '#4f5a70', '#353e52'].map(C)
    for (let x = 478; x < 768; x++) {
      const t = Math.round(top(x))
      for (let y = t; y <= HZ + 1; y++) {
        const v = y + (x - 478) * .14 + 6 * fbm(x * .02, 231) + 2 * Math.sin(x * .09), layer = Math.floor(v / 14), dl = v - layer * 14
        const n = vn2(x * .07, y * .11, layer + 3), lit = (x - 478) / 290 + (t - y) / 120 * -.3
        let c = dl < 1.2 && n > .35 ? CL[0] : dl > 12.5 && n < .7 ? CL[3] : n > .62 - lit * .2 ? CL[1] : n < .28 ? CL[3] : CL[2]
        if (Math.abs(Math.sin(x * .13 + layer * 2.1)) < .03 && n < .5) c = CL[3]
        if (y - t < 2) c = CL[0]
        f.set(x, y, c)
      }
    }
    // Dschungel auf der Kante und Ranken
    for (let i = 0; i < 46; i++) { const x = 482 + hash(i, 232) * 290, t = top(x); crown(f, Math.round(x), Math.round(t + 2 + hash(i, 233) * 6), 5 + Math.round(hash(i, 234) * 6), i, CAN[i % 3]) }
    for (let i = 0; i < 26; i++) { const x = 500 + hash(i, 235) * 260, t = top(x) + 6, len = 10 + hash(i, 236) * 40; for (let k = 0; k < len; k++) f.set(x + Math.sin(k * .2 + i) * 1.4, t + k, k % 4 ? C('#15803d') : C('#4ade80')) }
    // Wasserfall: Bahnen, Schaum am Fuß, Nebel
    const wx = 586, wt = Math.round(top(wx)) + 4
    for (let y = wt; y < HZ + 1; y++) for (let i = 0; i < 14; i++) { const n = (y * 3 + i * 17 + Math.floor(y / 5) * 11) % 7; f.set(wx + i, y, i < 2 ? C('#bae6fd') : n === 0 ? C('#7dd3fc') : n < 3 ? C('#e0f2fe') : C('#f8fafc')) }
    f.rect(wx - 2, wt - 1, 18, 2, C('#e0f2fe'))
    for (let i = 0; i < 40; i++) { const a = hash(i, 240) * Math.PI, r = 4 + hash(i, 241) * 16; f.ell(Math.round(wx + 7 + Math.cos(a) * r * 1.6), Math.round(HZ - Math.sin(a) * r * .6), 2, 1, C(i % 2 ? '#ffffff' : '#e0fbf6')) }
    f.mir = [360, 768, .45]
  },
  5(f) { // Pokalbucht: Landzunge mit gestreiftem Leuchtturm und goldener Pokal-Statue auf einem Sockel
    farIsle(f, 0, 180, 12, 3, .6); farIsle(f, 180, 300, 7, 4, .7)
    const fn = jungle(f, 380, 790, 50, 240, { peakAt: .65 })
    for (const [x, h, l] of [[420, 46, .7], [600, 42, -.5], [744, 50, -.7], [470, 38, -.4]]) palm(f, x, HZ - 2, h, l, x)
    { // Leuchtturm mit Galerie, schattiert wie am Steg
      const x = 664, base = Math.round(fn(664)) + 6
      for (let y = 0; y < base - (HZ - 112); y++) { const w = 13 - y * .05, stripe = Math.floor(y / 10) % 2, X = Math.round(x - w / 2); for (let i = 0; i < Math.round(w); i++) { const sh = i > w * .66; f.set(X + i, base - y, i < 1 ? (stripe ? C('#5eead4') : C('#ffffff')) : stripe ? (sh ? C('#0f766e') : C('#14b8a6')) : (sh ? C('#c3c9d6') : C('#f7f7f4'))) } }
      const ty = HZ - 112
      f.rect(x - 9, ty, 18, 2, C('#1f3a3a')); f.rect(x - 5, ty - 12, 10, 12, C('#fde68a')); f.rect(x - 5, ty - 12, 3, 12, C('#fffbeb')); f.rect(x - 6, ty - 12, 1, 12, C('#1f3a3a')); f.rect(x + 5, ty - 12, 1, 12, C('#1f3a3a'))
      f.poly([[x - 8, ty - 12], [x, ty - 21], [x + 8, ty - 12]], (X) => X > x ? C('#0f766e') : C('#14b8a6')); f.rect(x, ty - 25, 1, 4, C('#1f3a3a'))
    }
    { // Pokal-Statue
      const x = 524, y = Math.round(fn(524)) - 30
      f.rect(x - 14, y + 34, 28, 7, C('#94a3b8')); f.rect(x - 14, y + 34, 28, 1, C('#e2e8f0')); f.rect(x + 8, y + 35, 6, 6, C('#64748b'))
      f.rect(x - 10, y + 27, 20, 7, C('#64748b')); f.rect(x - 10, y + 27, 20, 1, C('#cbd5e1'))
      f.rect(x - 3, y + 14, 6, 13, C('#ca8a04')); f.rect(x - 3, y + 14, 2, 13, C('#fde047'))
      f.ell(x, y + 2, 15, 13, (X, Y) => { const l = -(X - x) / 15 - (Y - y) / 13; return l > .7 ? C('#fef9c3') : l > .1 ? C('#fde047') : l > -.6 ? C('#eab308') : C('#a16207') })
      f.rect(x - 15, y - 11, 30, 5, C('#ca8a04')); f.rect(x - 15, y - 11, 30, 1, C('#fef08a'))
      f.line(x - 15, y - 3, x - 23, y + 4, C('#ca8a04'), 3); f.line(x + 15, y - 3, x + 23, y + 4, C('#a16207'), 3)
      for (const [dx, dy] of [[-7, -2], [-8, -1], [-6, 5]]) f.set(x + dx, y + dy, C('#ffffff'))
    }
    for (const [x, c] of [[560, '#facc15'], [576, '#38bdf8']]) { const t = Math.round(fn(x)) + 2; f.rect(x, t - 26, 1, 26, C('#e5e7eb')); f.poly([[x + 1, t - 26], [x + 12, t - 23], [x + 1, t - 20]], C(c)) }
    f.mir = [370, 768]
  },
}

for (let bay = 1; bay <= 5; bay++) art(`welt-insel-${bay}`, VW, VH, (f) => {
  // Himmel bleibt durchsichtig; erst die Kulisse über Wasser, dann das Wasser darunter, zuletzt die Spiegelung
  const above = new FB(VW, VH)
  BAYS[bay](above)
  f.p.set(above.p)
  const { wat, floor } = inselBase(f, bay)
  // Kulisse über dem Horizont zurück (die Wasserbänder haben ab HZ + 1 übermalt)
  for (let y = 0; y <= HZ + 1; y++) for (let x = 0; x < VW; x++) { const v = above.get(x, y); if (v >= 0) f.set(x, y, v) }
  above.mir && mirror(f, ...above.mir)
  // Riff und Grund
  const reefs = { 1: [[130, 120, 44], [404, 84, 30], [640, 150, 58]], 2: [[110, 110, 40], [300, 70, 26], [470, 120, 50], [680, 120, 46]], 3: [[140, 100, 36], [660, 130, 48]], 4: [[120, 110, 40], [420, 70, 26]], 5: [[120, 110, 42], [640, 140, 54]] }[bay]
  seagrass(f, floor, wat, 300 + bay, bay === 4 ? 120 : 60)
  reefs.forEach(([x, w, h], i) => reef(f, x, w, h, floor, wat, bay * 10 + i, Math.round(w / 26)))
  if (bay === 2) for (let i = 0; i < 24; i++) { const x = 16 + i * 32 + hash(i, 250) * 14; coral(f, Math.round(x), Math.round(floor(x)) + 3, i % 6, i * 7) }
  else for (let i = 0; i < 9; i++) { const x = 30 + i * 86 + hash(i, 251 + bay) * 30; coral(f, Math.round(x), Math.round(floor(x)) + 3, (i + bay) % 6, i + bay) }
  for (let i = 0; i < 5; i++) { const x = 60 + hash(i, 260 + bay) * 650; urchin(f, x, Math.round(floor(x)) + 6) }
  if (bay === 3) {
    for (const x of [220, 238, 480]) { const y = Math.round(floor(x)) - 1; f.ell(x, y, 8, 5, C('#1f2937')); f.ell(x, y, 4, 2, mixI(wat(380), C('#0a2b3c'), .4)); f.set(x - 5, y - 3, C('#4b5563')) } // alte Reifen
    { const x = 600, y = Math.round(floor(600)) - 2; f.poly([[x - 22, y], [x + 18, y - 6], [x + 32, y], [x + 18, y + 6], [x - 18, y + 6]], C('#be123c')); f.poly([[x - 20, y], [x + 16, y - 5], [x + 26, y - 1]], C('#f43f5e')); f.rect(x - 4, y - 8, 12, 3, C('#e2e8f0')); f.rect(x + 2, y - 12, 2, 4, C('#475569')) } // versunkener Jetski
    for (let i = 0; i < 6; i++) { const x = 260 + i * 60, y0 = Math.round(floor(x)); f.rect(x, y0 - 6, 3, 6, C('#57534e')); for (let y = SF + 4; y < y0 - 6; y += 3) f.set(x + 1, y, mixI(C('#d6d3d1'), wat(y), .45 + (y - SF) / 400)) } // Bojenleinen, gestrichelt
  }
  if (bay === 4) for (let i = 0; i < 9; i++) { // Mangrovenwurzeln: dicke Bögen aus dem Ufer, verjüngt, im Blau verblassend
    const x = 500 + i * 30 + hash(i, 270) * 10, len = 26 + hash(i, 271) * 30, dir = i % 2 ? 1 : -1
    for (let k = 0; k < len; k++) { const u = k / len, X = x + dir * Math.sin(u * 2.2) * 9, Y = SF - 2 + k, w = Math.max(1, Math.round(4 * (1 - u))), a = .15 + u * .7
      f.rect(X - w / 2, Y, w, 1, mixI(C('#4a3420'), wat(Y), a)); f.set(X - w / 2, Y, mixI(C('#8a6238'), wat(Y), a)) }
  }
  if (bay === 5) {
    for (const x of [200, 252, 304]) { const top = 330 + hash(x, 260) * 24, t = (c, y) => mixI(C(c), wat(y), .4); for (let y = top; y < VH; y++) { f.rect(x - 6, y, 12, 1, t('#cbd5e1', y)); f.rect(x - 6, y, 2, 1, t('#f1f5f9', y)); f.rect(x + 4, y, 2, 1, t('#94a3b8', y)) } f.rect(x - 9, top - 4, 18, 4, t('#e2e8f0', top)) }
    { const x = 470, y = Math.round(floor(470)); f.rect(x, y - 12, 26, 13, C('#78350f')); f.rect(x, y - 12, 26, 3, C('#a16207')); f.rect(x + 11, y - 9, 4, 5, C('#facc15')); for (let i = 0; i < 8; i++) f.ell(x - 6 + i * 5, y + 1, 2, 1, C(i % 2 ? '#fde047' : '#eab308')) }
    for (const x of [420, 560]) { const y = Math.round(floor(x)); f.rect(x - 3, y - 4, 6, 4, C('#ca8a04')); f.ell(x, y - 8, 5, 4, C('#eab308')); f.set(x - 2, y - 9, C('#fef08a')) }
  }
  dockShade(f)
})
