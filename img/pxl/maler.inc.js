// Gemeinsames Malwerkzeug für welt.px.js und sport.px.js (render.js lädt es, wenn eine Quelle `'use maler'` enthält).
// 1 Pixel = 1 Leinwand-Pixel (768×432 für ganze Szenen).
const VW = 768, VH = 432
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
function art(name, w, h, paint) { sprite(name, { w, h, scale: 1 }, (c) => { const f = new FB(w, h); paint(f); f.flush(c) }) }

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


// ---------------------------------------------------------------- Strand-Requisiten
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
