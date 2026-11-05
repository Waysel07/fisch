// Quelle der Welt-Bilder in img/welt-*.png und der Schatten in img/welt-schatten.png.
// Das Spiel lädt diese Datei nicht. 1 Pixel = 1 Leinwand-Pixel (768×432), HORIZON = 184, SURFACE = 206.
// Tag-Fassung; die Nacht färbt das Spiel selbst ab. Was leuchtet oder sich bewegt, zeichnet js/fischen.js darüber.
const VW = 768, VH = 432, HZ = 184, SF = 206

// ---------------------------------------------------------------- Malwerkzeug
const C = (s) => parseInt(s.slice(1), 16)
const hx = (n) => '#' + n.toString(16).padStart(6, '0')
const mixI = (a, b, t) => {
  t = Math.max(0, Math.min(1, t))
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t, g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t, l = (a & 255) * (1 - t) + (b & 255) * t
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(l)
}
const hash = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x) }
const vn = (x, s = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, s) * (1 - u) + hash(i + 1, s) * u }
const fbm = (x, s = 0, o = 4) => { let a = .5, r = 0, f = 1; for (let i = 0; i < o; i++) { r += a * vn(x * f, s + i * 7); a *= .5; f *= 2 } return r }
const h2 = (x, y, s = 0) => hash(x * 57 + y * 131, s)
const vn2 = (x, y, s = 0) => {
  const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g)
  return (h2(i, j, s) * (1 - u) + h2(i + 1, j, s) * u) * (1 - v) + (h2(i, j + 1, s) * (1 - u) + h2(i + 1, j + 1, s) * u) * v
}
class FB {
  constructor(w, h) { this.w = w; this.h = h; this.p = new Int32Array(w * h).fill(-1) }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y * this.w + x] = c }
  get(x, y) { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.p[y * this.w + x] : -1 }
  rect(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c) }
  line(x0, y0, x1, y1, c, wd = 1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1))
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (wd === 1) this.set(x, y, c); else this.rect(Math.round(x - wd / 2), Math.round(y - wd / 2), wd, wd, c) }
  }
  poly(pts, c) {
    let y0 = 1e9, y1 = -1e9; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = []
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax)) }
      xs.sort((a, b) => a - b)
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c)
    }
  }
  ell(cx, cy, a, b, c) { for (let y = -b; y <= b; y++) { const w = a * Math.sqrt(Math.max(0, 1 - y * y / (b * b))); for (let x = Math.round(-w); x <= Math.round(w); x++) this.set(cx + x, cy + y, typeof c === 'function' ? c(cx + x, cy + y) : c) } }
  darken(fn, to) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const v = this.p[y * this.w + x]; if (v < 0) continue; const a = fn(x, y); if (a > 0) this.p[y * this.w + x] = mixI(v, to, a) } }
  flush(c) {
    for (let y = 0; y < this.h; y++) {
      let x = 0
      while (x < this.w) {
        const v = this.p[y * this.w + x]
        if (v < 0) { x++; continue }
        let e = x + 1; while (e < this.w && this.p[y * this.w + e] === v) e++
        c.rect(x, y, e - x, 1, hx(v)); x = e
      }
    }
  }
}
function art(name, w, h, paint) { sprite(name, { w, h }, (c) => { const f = new FB(w, h); paint(f); f.flush(c) }) }

// Wasser/Lava: Farbbänder mit welligen Kanten, an den Übergängen waagerechte Striche statt Schachbrett
function bandIdx(x, y, y0, y1, n, p, wob, s) {
  const k = (y - y0) / (y1 - y0)
  const w = (Math.sin(x * .017 + y * .09 + s) * 3.5 + Math.sin(x * .043 - y * .05 + s * 2) * 2 + (fbm(x * .013 + y * .01, s) - .45) * 12) * wob / (y1 - y0)
  return Math.pow(Math.max(0, Math.min(.9999, k + w)), p) * n
}
function bands(f, y0, y1, cols, p = 1, wob = 1, s = 0) {
  const ci = cols.map(C), n = ci.length
  for (let y = y0; y < y1; y++) for (let x = 0; x < f.w; x++) {
    const v = bandIdx(x, y, y0, y1, n, p, wob, s); let i = Math.floor(v); const fr = v - i
    if (fr > .7 && hash(Math.floor((x + (y % 5) * 3) / (4 + y % 7)), y) < (fr - .7) * 2.4) i++
    f.p[y * f.w + x] = ci[Math.min(n - 1, i)]
  }
}
const atY = (cols, y0, y1, p) => (y) => C(cols[Math.min(cols.length - 1, Math.floor(Math.pow(Math.max(0, Math.min(.9999, (y - y0) / (y1 - y0))), p) * cols.length))])
// Grat: alles unter topFn(x) füllen, oben eine helle Kante
function ridge(f, x0, x1, topFn, colFn, y1 = VH, rim = 0, rimN = 1) {
  for (let x = x0; x < x1; x++) { const t = Math.round(topFn(x)); for (let y = t; y < y1; y++) f.set(x, y, y - t < rimN && rim ? (typeof rim === 'function' ? rim(x, y) : rim) : typeof colFn === 'function' ? colFn(x, y) : colFn) }
}
// Fels mit Licht von oben und groben Facetten
function rock(f, cx, by, w, h, pal, seed = 1, tint = (c) => c) {
  const [L, M, D, K] = pal.map(C)
  for (let x = Math.round(cx - w / 2); x < cx + w / 2; x++) {
    const u = (x - cx + w / 2) / w, top = by - h * Math.pow(Math.sin(Math.PI * u), .55) * (.78 + .44 * fbm(x * .05, seed))
    for (let y = Math.round(top); y < by; y++) {
      const dep = y - top, fac = vn2(x * .11 + y * .05, y * .13, seed)
      let c = M
      if (dep < 2) c = L
      else if (fac > .63 && u < .62) c = L
      else if (fac < .36 || u > .72) c = D
      if (y > by - 3 || (u > .86 && fac < .55)) c = K
      f.set(x, y, tint(c, y))
    }
  }
}
// Fels aus schräg liegenden Gesteinsschichten: Die Kante springt von Schicht zu Schicht, oben fängt jede Licht
function strata(f, cx, y0, y1, hwFn, pal, seed, tint) {
  const [L, M, D, K] = pal.map(C), top = []
  let yy = y0 - 60; for (let i = 0; yy < y1 + 60; i++) { top.push(yy); yy += 7 + Math.floor(hash(i, seed) * 20) }
  const rowAt = (v) => { let i = 0; while (i + 1 < top.length && top[i + 1] <= v) i++; return i }
  for (let y = y0; y < y1; y++) {
    const hw = hwFn(y), a0 = cx - hw * 1.5 - 20, b0 = cx + hw * 1.5 + 20
    for (let x = Math.round(a0); x < b0; x++) {
      const v = y + (x - cx) * .2 + Math.sin(x * .06 + seed) * 2.5, i = rowAt(v), dt = v - top[i], h = top[i + 1] - top[i]
      const e = hw + (fbm(y * .035, seed) - .5) * hw * .5
      const l = cx - e - (hash(i, seed + 1) - .5) * 15, r = cx + e + (hash(i, seed + 2) - .5) * 15
      if (x < l || x >= r) continue
      const u = (x - l) / (r - l), col = Math.floor((x + i * 13) / 9), crack = (x + i * 13) % 9 === 0 && hash(col, i) < .12
      let c = u > .68 ? D : M
      if (dt < 1.6 && hash(Math.floor(x / 14), i) > .22) c = u > .8 ? M : L
      else if (dt > h - 1.6 && hash(Math.floor(x / 11), i + 3) > .35) c = K
      else if (crack) c = K
      else if (u < .08) c = L
      f.set(x, y, tint(c, y))
    }
  }
}
function pine(f, x, base, h, D, L, T) {
  f.rect(x - 1, base - 2, 2, 3, T)
  const tiers = Math.max(2, Math.round(h / 7))
  for (let i = 0; i < tiers; i++) {
    const top = base - h + i * (h / tiers) * .86, bot = top + h / tiers * 1.55
    for (let y = Math.round(top); y < bot; y++) {
      const hw = Math.round((y - top) / (bot - top) * (2 + (i + 1) * h * .09))
      for (let dx = -hw; dx <= hw; dx++) f.set(x + dx, y, (dx < -hw * .25 && (y + dx) % 3 !== 0) ? L : D)
    }
  }
}

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
const INSEL_W = ['#4fd8cf', '#3ccbc8', '#2bb9c0', '#20a5b6', '#198fa8', '#147898', '#106385', '#0c5072', '#093f5f', '#07304c', '#05233a', '#03182a']
// Palme: krummer Stamm mit Ringen, hängende Wedel, Kokosnüsse
function palm(f, x, base, h, lean, seed = 1, shade = 0) {
  const T = [C('#a16207'), C('#854d0e'), C('#713f12')].map(c => mixI(c, C('#2b4a5e'), shade)), Lf = [C('#4ade80'), C('#16a34a'), C('#166534')].map(c => mixI(c, C('#2b4a5e'), shade))
  let tx = x, ty = base
  for (let i = 0; i <= h; i++) { const k = i / h; tx = x + lean * k * k * h * .5; ty = base - i; f.rect(Math.round(tx) - 1, ty, 3, 1, i % 4 === 0 ? T[2] : T[0]); f.set(Math.round(tx) + 1, ty, T[1]) }
  const cx = Math.round(tx), cy = Math.round(ty)
  for (let j = 0; j < 7; j++) {
    const a = -Math.PI + j / 6 * Math.PI + (hash(j, seed) - .5) * .3, len = h * (.45 + hash(j + 9, seed) * .25)
    for (let s = 0; s <= len; s++) {
      const k = s / len, X = cx + Math.cos(a) * s, Y = cy + Math.sin(a) * s * .55 + k * k * len * .55
      f.set(X, Y, Lf[1]); f.set(X, Y - 1, k < .6 ? Lf[0] : Lf[1])
      if (s % 2 === 0 && k > .15) { f.set(X, Y + 1 + Math.round(k * 2), Lf[2]); f.set(X + (Math.cos(a) > 0 ? -1 : 1), Y + 2 + Math.round(k * 2), Lf[2]) }
    }
  }
  for (const [dx, dy] of [[-1, 2], [1, 2], [0, 3]]) { f.ell(cx + dx, cy + dy, 1, 1, mixI(C('#78350f'), C('#2b4a5e'), shade)) }
}
function hut(f, x, y, w = 22) { // Strandhütte mit Strohdach
  f.rect(x + 3, y - 10, w - 6, 10, C('#d6a35c')); for (let i = 0; i < w - 6; i += 3) f.rect(x + 3 + i, y - 10, 1, 10, C('#b07d3a'))
  f.rect(x + w / 2 - 2, y - 7, 4, 7, C('#5b3a1a'))
  f.poly([[x - 2, y - 9], [x + w / 2, y - 20], [x + w + 2, y - 9]], (X, Y) => (X + Y) % 3 ? C('#e9c77b') : C('#c79a4a'))
}
function umbrella(f, x, y, a, b) { f.rect(x, y - 10, 1, 10, C('#e5e7eb')); for (let i = -6; i <= 6; i++) { const yy = y - 11 + Math.round(Math.abs(i) * .5); f.rect(x + i, yy - 1, 1, 2, Math.floor((i + 6) / 3) % 2 ? C(a) : C(b)) } }
function islandHill(f, x0, x1, top, seed, shade = 0) {
  const g = [C('#15803d'), C('#166534'), C('#22c55e')].map(c => mixI(c, C('#8fb7c9'), shade))
  ridge(f, x0, x1, (x) => { const u = (x - x0) / (x1 - x0); return HZ - 2 - top * Math.pow(Math.sin(Math.PI * u), .7) * (.8 + .3 * fbm(x * .03, seed)) }, (x, y) => vn2(x * .2, y * .2, seed) > .6 ? g[2] : vn2(x * .1, y * .3, seed + 1) > .5 ? g[0] : g[1], HZ + 1, mixI(C('#4ade80'), C('#8fb7c9'), shade), 1)
  f.rect(x0 + 4, HZ - 1, x1 - x0 - 8, 3, mixI(C('#fde68a'), C('#8fb7c9'), shade))
}
function coral(f, x, y, kind, s) {
  const P = [['#f472b6', '#be185d'], ['#fb923c', '#c2410c'], ['#a78bfa', '#6d28d9'], ['#facc15', '#a16207'], ['#22d3ee', '#0e7490']][kind % 5]
  if (s % 3 === 0) { f.ell(x, y - 6, 10, 7, (X, Y) => (X + Y * 2) % 4 ? C(P[0]) : C(P[1])) } // Hirnkoralle
  else if (s % 3 === 1) { for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .35; for (let k = 0; k < 20; k++) f.set(x + Math.cos(a) * k, y + Math.sin(a) * k, k > 14 ? C(P[0]) : C(P[1])) } } // Fächer
  else { for (let i = -2; i <= 2; i++) { const hh = 12 + hash(i, s) * 12; f.rect(x + i * 3, y - hh, 3, hh, C(P[1])); f.rect(x + i * 3, y - hh, 2, 2, C(P[0])) } } // Röhren
}
function inselBase(f, bay) {
  const wat = atY(INSEL_W, SF, VH, .8)
  // ferne Inseln am Horizont
  for (const [a, b, h, s] of [[10, 150, 14, 3], [170, 250, 8, 4]]) islandHill(f, a, b, h, s, .55)
  bands(f, HZ + 1, SF, ['#b5f5e8', '#8eeadf', '#6ddcd5', '#55cdcc', '#47c2c6'], 1, .25, 11 + bay)
  for (let i = 0; i < 50; i++) { const y = HZ + 2 + Math.floor(hash(i, 171) * 20), x = hash(i, 172) * VW, n = 8 + hash(i, 173) * 18; f.rect(x, y, n, 1, C('#e0fbf6')) }
  bands(f, SF, VH, INSEL_W, .8, 1.2, 19 + bay)
  // Sonnenflecken im Flachwasser
  for (let i = 0; i < 70; i++) { const y = SF + 3 + Math.pow(hash(i, 181), 1.6) * 70, x = hash(i, 182) * VW, n = 4 + hash(i, 183) * 16; f.rect(x, y, n, 1, mixI(wat(y), C('#d5fff7'), .35 - (y - SF) * .004)) }
  // Sandgrund mit Rippeln
  const floor = (x) => 396 + 9 * (fbm(x * .01, 190 + bay) - .5) + 3 * Math.sin(x * .03)
  ridge(f, 0, VW, (x) => 300 + 40 * fbm(x * .006, 191 + bay), (x, y) => mixI(wat(y), C('#0a4a63'), .35), VH, (x, y) => mixI(wat(y), C('#3fb6b3'), .2), 1)
  ridge(f, 0, VW, floor, (x, y) => { const d = y - floor(x); return d < 3 ? C('#e9d39a') : (x + Math.round(Math.sin(y) * 3)) % 9 === 0 ? C('#b89a5e') : d < 12 ? C('#d4b97a') : C('#a88e58') }, VH, C('#f7e7b5'), 1)
  for (let i = 0; i < 12; i++) { const x = hash(i, 195 + bay) * VW, y = Math.round(floor(x)) + 4; if (i % 3 === 0) { f.set(x, y, C('#fb7185')); f.set(x - 1, y + 1, C('#fb7185')); f.set(x + 1, y + 1, C('#fb7185')); f.set(x, y + 2, C('#e11d48')) } else f.ell(x, y, 2, 1, C('#fef3c7')) }
  return { wat, floor }
}
for (let bay = 1; bay <= 5; bay++) art(`welt-insel-${bay}`, VW, VH, (f) => {
  // Himmel bleibt durchsichtig: Hauptinsel zuerst, damit die Wasserbänder sie unten sauber abschneiden
  if (bay === 1) {
    islandHill(f, 420, 768, 44, 201)
    for (const [x, h, l] of [[452, 40, 1], [480, 52, -.6], [538, 46, .5], [610, 58, -.4], [672, 44, .7], [728, 50, -.8]]) palm(f, x, HZ - 1, h, l, x)
    hut(f, 560, HZ - 1); hut(f, 640, HZ - 1, 18)
    umbrella(f, 470, HZ, '#ef4444', '#f8fafc'); umbrella(f, 520, HZ, '#3b82f6', '#fde047'); umbrella(f, 700, HZ, '#f97316', '#f8fafc')
  } else if (bay === 2) {
    for (const [a, b, h, s] of [[330, 420, 16, 210], [520, 600, 12, 211], [650, 760, 22, 212]]) { islandHill(f, a, b, h, s); palm(f, (a + b) / 2 - 8, HZ - 1, 34, .6, s); palm(f, (a + b) / 2 + 12, HZ - 1, 28, -.5, s + 1) }
  } else if (bay === 3) {
    islandHill(f, 470, 768, 30, 220)
    for (const [x, h, l] of [[700, 46, -.5], [740, 40, .6]]) palm(f, x, HZ - 1, h, l, x)
    // Bootshaus auf Stelzen, Rampe, Fahnen
    { const x = 520, y = HZ - 4; for (const s of [0, 10, 30, 40]) f.rect(x + s, y, 2, 10, C('#6b4423')); f.rect(x - 4, y - 2, 52, 3, C('#a16207')); f.rect(x, y - 18, 44, 16, C('#38bdf8')); for (let i = 0; i < 44; i += 4) f.rect(x + i, y - 18, 1, 16, C('#0ea5e9')); f.rect(x + 16, y - 12, 10, 10, C('#0c4a6e')); f.poly([[x - 4, y - 18], [x + 22, y - 30], [x + 48, y - 18]], C('#f43f5e')); f.rect(x - 4, y - 19, 52, 1, C('#be123c')) }
    f.poly([[600, HZ + 3], [640, HZ - 8], [646, HZ - 8], [646, HZ + 3]], C('#eab308')); f.line(600, HZ + 3, 640, HZ - 8, C('#fde047'))
    for (const [x, c] of [[660, '#ef4444'], [676, '#facc15'], [692, '#22c55e']]) { f.rect(x, HZ - 34, 1, 34, C('#e5e7eb')); f.poly([[x + 1, HZ - 34], [x + 12, HZ - 31], [x + 1, HZ - 28]], C(c)) }
  } else if (bay === 4) {
    // Felsklippe mit Wasserfall, Dschungel
    ridge(f, 480, 768, (x) => HZ - 8 - 90 * Math.pow(Math.min(1, (x - 480) / 140), .8) * (.85 + .25 * fbm(x * .04, 230)), (x, y) => vn2(x * .15, y * .1, 231) > .55 ? C('#64748b') : C('#475569'), HZ + 1, C('#22c55e'), 3)
    for (let i = 0; i < 18; i++) { const x = 500 + i * 15, y = HZ - 30 - 60 * Math.min(1, (x - 480) / 140) + hash(i, 232) * 10; f.ell(Math.round(x), Math.round(y), 9, 6, (X, Y) => vn2(X * .3, Y * .3, i) > .5 ? C('#16a34a') : C('#15803d')) }
    for (let y = HZ - 92; y < HZ + 2; y++) { f.rect(586, y, 12, 1, C('#e0f2fe')); f.rect(588 + (y % 3), y, 3, 1, C('#7dd3fc')); f.rect(595 - (y % 4), y, 2, 1, C('#bae6fd')) }
    f.ell(592, HZ + 2, 18, 3, C('#f0fdfa'))
    palm(f, 450, HZ - 1, 40, .5, 4); islandHill(f, 380, 480, 12, 233)
  } else {
    // Pokalbucht: Landzunge mit Leuchtturm und goldener Pokal-Statue
    islandHill(f, 380, 768, 50, 240)
    { const x = 660, y = HZ - 40; for (let i = 0; i < 60; i++) f.rect(x - 7 + Math.round(i * .06), y - i, 14 - Math.round(i * .12), 1, Math.floor(i / 8) % 2 ? C('#14b8a6') : C('#f8fafc')); f.rect(x - 6, y - 70, 12, 10, C('#fde68a')); f.rect(x - 7, y - 72, 14, 2, C('#0f766e')); f.poly([[x - 7, y - 72], [x, y - 80], [x + 7, y - 72]], C('#0f766e')) }
    { const x = 520, y = HZ - 44; f.rect(x - 12, y + 30, 24, 6, C('#94a3b8')); f.rect(x - 9, y + 24, 18, 6, C('#64748b')); f.rect(x - 3, y + 12, 6, 12, C('#ca8a04')); f.ell(x, y, 14, 12, (X, Y) => X < x - 4 ? C('#fde047') : X > x + 6 ? C('#a16207') : C('#eab308')); f.rect(x - 14, y - 12, 28, 6, C('#ca8a04')); f.line(x - 14, y - 4, x - 22, y + 2, C('#ca8a04'), 3); f.line(x + 14, y - 4, x + 22, y + 2, C('#ca8a04'), 3); f.set(x - 6, y - 4, C('#fffbeb')); f.set(x - 7, y - 3, C('#fffbeb')) }
    for (const [x, h, l] of [[430, 44, .6], [600, 40, -.5], [740, 48, -.7]]) palm(f, x, HZ - 1, h, l, x)
  }
  const { wat, floor } = inselBase(f, bay)
  // Riff-Felsen mit Korallen und Seegras
  const RP = ['#5fb3b0', '#3b8d93', '#256a76', '#123f4d']
  for (const [x, w, h] of [[120, 120, 46], [400, 80, 30], [640, 140, 56]]) {
    const by = Math.round(floor(x)) + 6; rock(f, x, by, w, h, RP, x + bay, (c, y) => mixI(c, wat(y), .25))
    for (let i = 0; i < 5; i++) { const cx = x - w * .35 + i * w * .18; coral(f, Math.round(cx), Math.round(by - h * (.55 + .4 * Math.sin(Math.PI * (i + .5) / 5))) + 2, i + x, i * 3 + bay) }
  }
  for (let i = 0; i < 40; i++) { const x = hash(i, 270 + bay) * VW, y = Math.round(floor(x)) + 1, hh = 6 + hash(i, 271) * 16; for (let k = 0; k < hh; k++) f.set(x + Math.sin(k * .4 + i) * 1.5, y - k, k % 3 ? C('#16a34a') : C('#4ade80')) }
  // unter Wasser je nach Bucht
  if (bay === 2) for (let i = 0; i < 26; i++) { const x = 20 + i * 29 + hash(i, 250) * 12; coral(f, x, Math.round(floor(x)) + 2, i, i * 7) }
  else for (let i = 0; i < 8; i++) { const x = 40 + i * 95 + hash(i, 251 + bay) * 30; coral(f, x, Math.round(floor(x)) + 2, i + bay, i + bay) }
  if (bay === 3) { for (const x of [220, 236, 480]) { f.ell(x, Math.round(floor(x)) - 2, 7, 4, C('#1f2937')); f.ell(x, Math.round(floor(x)) - 2, 3, 2, mixI(wat(380), C('#0a2b3c'), .4)) } // alte Reifen
    f.poly([[600, 392], [640, 386], [656, 392], [640, 398], [604, 398]], C('#e11d48')); f.rect(616, 386, 10, 3, C('#f8fafc')) } // versunkener Jetski
  if (bay === 4) for (let i = 0; i < 9; i++) { const x = 560 + i * 22; for (let k = 0; k < 90; k++) f.set(x + Math.sin(k * .1 + i) * 4, SF + k, mixI(C('#3f2e1c'), wat(SF + k), k / 140)) } // Mangrovenwurzeln
  if (bay === 5) { for (const x of [200, 250, 300]) { const top = 340 + hash(x, 260) * 20; f.rect(x - 6, top, 12, VH - top, mixI(C('#cbd5e1'), wat(380), .45)); f.rect(x - 8, top - 3, 16, 3, mixI(C('#e2e8f0'), wat(380), .4)) }
    for (const x of [420, 560]) { const y = Math.round(floor(x)); f.rect(x - 3, y - 4, 6, 4, C('#ca8a04')); f.ell(x, y - 8, 5, 4, C('#eab308')); f.set(x - 2, y - 9, C('#fef08a')) }
    f.rect(470, Math.round(floor(470)) - 10, 22, 12, C('#78350f')); f.rect(470, Math.round(floor(470)) - 10, 22, 3, C('#a16207')); f.rect(479, Math.round(floor(470)) - 7, 4, 4, C('#facc15')) }
})
