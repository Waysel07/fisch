// Quelle der Sprites, die als Raster in js/fischen.js stehen (Block ART und PLAYER_*).
// Das Spiel lädt diese Datei nicht. 1 Pixel = ein halbes Welt-Pixel, die Größen passen zu den Hitboxen in PROPS.
// Koordinaten in S() meinen immer das fertige Bild inklusive Umriss.
pal({ k: '#1b1f2e' })
const INK = '#1b1f2e'

function S(name, W, H, fn, outline = true) {
  const o = outline ? 1 : 0
  const opt = { w: W - 2 * o, h: H - 2 * o }
  if (outline) opt.outline = 'k'
  sprite(name, opt, (c) => fn({
    px: (x, y, col) => c.px(x - o, y - o, col),
    rect: (x, y, w, h, col) => c.rect(x - o, y - o, w, h, col),
    hline: (x, y, n, col) => c.hline(x - o, y - o, n, col),
    vline: (x, y, n, col) => c.vline(x - o, y - o, n, col),
    line: (a, b, d, e, col, wd) => c.line(a - o, b - o, d - o, e - o, col, wd),
    ellipse: (x, y, a, b, col) => c.ellipse(x - o, y - o, a, b, col),
    ring: (x, y, r, col) => c.ring(x - o, y - o, r, col),
    poly: (p, col) => c.poly(p.map((v) => v - o), col),
  }))
}
function G(name, rows, map) {
  sprite(name, { w: rows[0].length, h: rows.length }, (c) => {
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') c.px(x, y, map[ch]) }))
  })
}

// ---------------------------------------------------------------- Spielfigur
// Die Schlüssel h H l (Hut), c C y (Jacke) und s S r B b (Kopf) färbt das Spiel um; sie müssen bleiben.
const PLAYER = { k: '#1b1f2e', h: '#22c55e', H: '#15803d', l: '#86efac', s: '#f2c9a0', S: '#d9a47a', e: '#0f172a', B: '#7c4a24', b: '#a0662f', c: '#f59e0b', C: '#c2410c', y: '#fcd34d', w: '#f8fafc', p: '#3b4a66', P: '#26324a', o: '#5b3a24', O: '#3a2416', r: '#e8a87c', g: '#94a3b8' }
const BODY = [
  '........kkkkkk........',
  '......kkhlllhhkk......',
  '.....khhlllhhhhhk.....',
  '.....khhllhhhhhHk.....',
  '.....khhhhhhhhHHk.....',
  '.....kHHHHHHHHHHk.....',
  '...kkkHHHHHHHHHHkkk...',
  '..kHHHHHHHHHHHHHHHHk..',
  '...kkkkkkkkkkkkkkkk...',
  '.....kBBSsssssssk.....',
  '.....kBBSssssewsk.....',
  '.....kBSSssssessrk....',
  '.....kBSssssssssrk....',
  '.....kBBSsssSSSSk.....',
  '......kBBSssssssk.....',
  '.......kkSSSSSSkk.....',
  '.....kkkyyyyyykkk.....',
  '....kCccccyyycccck....',
  '...kCCccccyyccccck....',
  '...kCCcccccycccccck...',
  '...kCCkccccyccccck....',
  '...kCCkccccyccccck....',
  '...kCCkcCCCyccCCck....',
  '...kSskccccyccccck....',
  '....kkkCcccyccccCk....',
  '......kCcccyccccCk....',
  '......kCCCCyCCCCCk....',
  '......kPPPPPPPPPPk....',
  '......kppppppPpppk....',
]
const LEGS = [
  ['......kpPpk.kppPk.....', '......kpPpk.kppPk.....', '......kPPpk.kPpPk.....', '......koook.koook.....', '......kOoook.kOoook...', '......kOOOOk.kOOOOk...', '.......kkkk...kkkk....'],
  ['.....kpPpk...kppPk....', '....kpPpk.....kppPk...', '....kPPpk.....kPpPk...', '...koook.......koook..', '...kOoook......kOoook.', '...kOOOOk......kOOOOk.', '....kkkk........kkkk..'],
  ['.......kpPpkppPk......', '.......kpPpkppPk......', '.......kPPpkPpPk......', '.......koookoook......', '.......kOoooooook.....', '.......kOOOOOOOOOk....', '........kkkkkkkkk.....'],
]
LEGS.forEach((l, i) => G('player_' + i, BODY.concat(l), PLAYER))

// ---------------------------------------------------------------- Figuren
G('bealin', [
  '.....kkkkkk.....',
  '....kggggglk....',
  '....kggggogk....',
  '...kgGGGGGGgk...',
  '..kGGGGGGGGGGk..',
  '..kkssssssssk...',
  '...ksesssseSk...',
  '...kSssrrssSk...',
  '..kbbbssssbbbk..',
  '..kbbbbBBbbbbk..',
  '..kvbbbbbbbbvk..',
  '.kvvrRbbbbRrvvk.',
  '.kvvrRrbbrRrvVss',
  '.kvpvrRrrRrvVVk.',
  'kvvpvrrRRrrvVVVk',
  'kvvvvrRrrRrvVVVk',
  'kVVVVkRrrRkVVVVk',
  'kVVVVkkkkkkVVVVk',
], { k: INK, g: '#4d7c0f', G: '#365314', l: '#ef4444', o: '#facc15', s: '#f2c9a0', S: '#d9a47a', e: '#0f172a', b: '#e5e7eb', B: '#9ca3af', r: '#dc2626', R: '#7f1d1d', v: '#6b7a3a', V: '#4a5526', p: '#a16207' })

G('bottle', ['.c.', '.k.', 'kbk', 'bob', 'bwb', 'byb', 'kbk'], { k: INK, c: '#a16207', b: '#6b2d0f', o: '#f97316', y: '#a855f7', w: '#fed7aa' })

S('glimm', 18, 20, (c) => {
  // alter Maulwurf mit Grubenhelm, schaut nach links; die Lampe wirft den Lichtstrahl im Spiel
  const B = '#6b4f3a', D = '#4a3424', L = '#a78b6d', H = '#facc15', Hd = '#b45309'
  c.ellipse(10, 15, 6, 4, D); c.ellipse(9, 15, 5, 3, B); c.ellipse(9, 16, 3, 2, L)
  c.rect(2, 16, 3, 2, '#fbcfe8'); c.px(2, 17, '#f9a8d4'); c.rect(13, 16, 3, 2, '#fbcfe8'); c.px(15, 17, '#f9a8d4')
  c.rect(5, 18, 3, 1, '#f9a8d4'); c.rect(11, 18, 3, 1, '#f9a8d4')
  c.ellipse(9, 10, 6, 4, B); c.ellipse(7, 12, 5, 2, L); c.ellipse(4, 11, 2, 2, L)
  c.rect(1, 10, 2, 2, '#f9a8d4'); c.px(1, 10, '#fce7f3')
  c.hline(4, 8, 4, '#e5e7eb'); c.rect(5, 9, 2, 1, INK); c.hline(10, 8, 3, '#e5e7eb'); c.rect(10, 9, 2, 1, INK)
  c.px(5, 13, '#f8fafc')
  c.ellipse(10, 4, 6, 3, H); c.rect(4, 5, 12, 2, H); c.hline(3, 7, 14, Hd); c.vline(10, 2, 5, '#fde047'); c.hline(6, 2, 3, '#fef9c3')
  c.rect(2, 3, 3, 4, '#475569'); c.rect(2, 4, 2, 2, '#fef9c3')
})

const WELS_MAP = { k: '#111827', H: '#1f2937', h: '#4b5563', R: '#7f1d1d', r: '#b91c1c', G: '#6b7a5e', g: '#8a9a7b', D: '#4f5b45', e: '#0b0f19', w: '#f8fafc', L: '#c9a99a', l: '#e2c7b9', m: '#3b1d1d', p: '#d16b78', B: '#d9d2c0', b: '#bfb6a1' }
const WELS_TOP = [
  '......kkkkkkkkkk......',
  '.....kHhhHHHHHHHk.....',
  '.....kHhHHHHHHHHk.....',
  '.....kHhHHHHHHHHk.....',
  '.....kHHHHHHHHHHk.....',
  '.....kHHHHHHHHHHk.....',
  '.....kRrrRRRRRRRk.....',
  '.....kRRRRRRRRRRk.....',
  '..kkkkHHHHHHHHHHkkkk..',
  '.kHhhhHHHHHHHHHHHHHHk.',
  '..kkkkkkkkkkkkkkkkkk..',
  '...kGGgggGGGGGGGGGk...',
  '..kGGgggGDGGGGDGGGGk..',
  '.kGGGGGGGGGGGGGGGGGGk.',
]
const WELS_EYES = [['.kGwweGGGGGGGGGGwweGk.', '.kGweeGGGGGGGGGGweeGk.'], ['.kGDDDGGGGGGGGGGDDDGk.', '.kGGGGGGGGGGGGGGGGGGk.']]
const WELS_MOUTH = [
  ['kGGGGGGGGGGGGGGGGGGGGk', 'kDLLLLLLLLLLLLLLLLLLDk', 'kLllllllllllllllllllLk', 'kLmmmmmmmmmmmmmmmmmmLk', 'kLLLLLLLLLLLLLLLLLLLLk'],
  ['kGGGGGGGGGGGGGGGGGGGGk', 'kDLLLLLLLLLLLLLLLLLLDk', 'kLmmmmmmmmmmmmmmmmmmLk', 'kLmmmmppppppppppmmmmLk', 'kLLLLLLLLLLLLLLLLLLLLk'],
]
const WELS_BELLY = ['.kBBBbBBBBBBBBBBbBBBk.', '.kBBBBBBBBBBBBBBBBBBk.', '..kBBBBBBBBBBBBBBBBk..', '..kbbbbbbbbbbbbbbbbk..']
for (const bl of [0, 1]) for (const ta of [0, 1]) G(`wels_${bl}${ta}`, [...WELS_TOP, ...WELS_EYES[bl], ...WELS_MOUTH[ta], ...WELS_BELLY], WELS_MAP)

// ---------------------------------------------------------------- Requisiten am Steg
S('slot', 26, 40, (c) => {
  const r = '#c42634', L = '#ec6064', D = '#881622'
  c.rect(3, 1, 16, 2, r); c.rect(1, 3, 20, 36, r); c.hline(3, 1, 16, L); c.vline(1, 3, 34, L); c.rect(18, 3, 3, 36, D)
  c.rect(3, 4, 16, 6, '#f59e0b'); c.hline(3, 9, 16, '#b45309')
  for (let i = 0; i < 4; i++) c.rect(3 + i * 4, 4, 4, 1, '#b45309')
  c.rect(3, 12, 16, 11, INK); c.rect(4, 13, 14, 9, '#f8fafc'); c.vline(8, 13, 9, '#cbd5e1'); c.vline(13, 13, 9, '#cbd5e1'); c.hline(4, 21, 14, '#cbd5e1')
  c.rect(6, 25, 8, 1, INK); c.rect(15, 25, 2, 2, '#fbbf24'); c.px(3, 25, '#4ade80'); c.px(3, 27, '#f472b6')
  c.rect(3, 30, 16, 6, INK); c.rect(4, 31, 14, 4, '#475569'); c.hline(4, 31, 14, '#334155'); c.rect(9, 32, 3, 2, '#fbbf24'); c.px(9, 32, '#fde68a')
  c.rect(1, 37, 20, 2, D)
  c.rect(21, 15, 2, 4, '#64748b'); c.rect(22, 5, 2, 11, '#94a3b8'); c.vline(23, 5, 11, '#64748b')
  c.ellipse(23, 3, 2, 2, '#ef4444'); c.px(22, 2, '#fecaca')
})
S('dex', 16, 17, (c) => {
  const w = '#96663a', L = '#ba8652', D = '#684224'
  c.rect(1, 8, 14, 8, w); c.hline(1, 8, 14, L); c.vline(5, 9, 7, D); c.vline(10, 9, 7, D); c.hline(1, 15, 14, D)
  c.px(2, 9, D); c.px(13, 9, D); c.px(2, 14, D); c.px(13, 14, D)
  c.rect(1, 5, 14, 3, '#2563eb'); c.hline(1, 7, 14, '#1e3a8a'); c.px(8, 6, '#facc15')
  c.rect(2, 2, 6, 3, '#f8fafc'); c.rect(8, 2, 6, 3, '#f1f5f9'); c.vline(8, 2, 3, '#94a3b8')
  c.hline(3, 3, 4, '#94a3b8'); c.hline(9, 3, 4, '#38bdf8'); c.hline(3, 1, 4, '#e2e8f0'); c.hline(9, 1, 4, '#e2e8f0')
})
S('news', 16, 11, (c) => {
  c.rect(1, 6, 14, 4, '#cbd5e1'); c.hline(1, 8, 14, '#94a3b8'); c.hline(1, 9, 14, '#e2e8f0')
  c.rect(1, 1, 14, 5, '#f1f5f9')
  c.rect(2, 2, 5, 2, INK); c.hline(9, 2, 5, '#475569'); c.hline(9, 4, 5, '#475569'); c.hline(2, 5, 5, '#94a3b8')
  c.vline(8, 1, 9, '#b45309')
})
S('trophy', 20, 20, (c) => {
  const g = '#fbbf24', L = '#fde68a', D = '#d97706'
  c.hline(2, 3, 3, g); c.vline(2, 3, 5, g); c.hline(2, 8, 4, D)
  c.hline(15, 3, 3, g); c.vline(17, 3, 5, D); c.hline(14, 8, 4, D)
  c.hline(4, 1, 12, L); c.rect(5, 2, 10, 7, g); c.poly([5, 9, 14, 9, 11, 12, 8, 12], g)
  c.rect(12, 2, 3, 7, D); c.line(12, 9, 11, 11, D); c.vline(7, 3, 5, L); c.px(8, 3, L)
  c.rect(9, 12, 2, 3, D); c.px(9, 12, g); c.px(9, 13, g)
  c.rect(7, 15, 6, 1, g); c.rect(5, 16, 10, 3, '#7c4a24'); c.hline(5, 16, 10, '#a0662f'); c.rect(8, 17, 4, 1, L)
})
S('board', 20, 40, (c) => {
  const P = '#603e24', L = '#785028', cork = '#b7834a', cD = '#9a6c3a'
  c.rect(3, 19, 3, 20, P); c.rect(13, 19, 3, 20, P); c.vline(3, 19, 20, L); c.vline(13, 19, 20, L)
  c.rect(1, 1, 18, 19, L); c.hline(1, 1, 18, '#96663a'); c.hline(1, 19, 18, P); c.rect(2, 2, 16, 17, cork)
  const paper = (x, y, w, h, col) => {
    c.rect(x + 1, y + 1, w, h, cD); c.rect(x, y, w, h, col)
    for (let yy = y + 2; yy < y + h - 1; yy += 2) c.hline(x + 1, yy, w - 2, '#94a3b8')
  }
  paper(3, 3, 6, 6, '#fef3c7'); paper(10, 4, 7, 5, '#bfdbfe'); paper(5, 11, 8, 6, '#fecaca')
  c.px(5, 3, '#ef4444'); c.px(13, 4, '#22c55e'); c.px(8, 11, '#3b82f6')
})

// Kiosk: Rückwand, davor Wels und Barteln, davor die Front. Das Wort auf dem Schild kommt als Text dazu.
S('kiosk_back', 44, 42, (c) => {
  c.rect(0, 0, 44, 42, '#5c3e28')
  for (let x = 4; x < 44; x += 8) c.vline(x, 0, 42, '#684226')
  c.rect(24, 13, 20, 2, '#7c4a24'); c.hline(24, 15, 20, '#3f2a1b')
  c.rect(24, 26, 20, 2, '#7c4a24'); c.hline(24, 28, 20, '#3f2a1b')
  c.rect(26, 8, 4, 5, '#bae6fd'); c.rect(26, 8, 4, 1, '#475569'); c.rect(27, 10, 2, 3, '#f472b6')
  c.rect(32, 6, 3, 7, '#6b2d0f'); c.rect(33, 4, 1, 2, '#6b2d0f'); c.rect(32, 8, 3, 2, '#f97316')
  c.rect(37, 9, 5, 4, '#2563eb'); c.hline(37, 9, 5, '#60a5fa')
  c.rect(26, 21, 6, 5, '#b45309'); c.hline(26, 23, 6, '#7c2d12'); c.rect(34, 20, 3, 6, '#94a3b8'); c.rect(39, 22, 3, 4, '#facc15')
}, false)
S('kiosk_front', 60, 75, (c) => {
  const w = '#96623a', L = '#ba804e', D = '#684226'
  // Pfosten
  c.rect(6, 12, 3, 43, L); c.vline(8, 12, 43, w); c.rect(52, 12, 3, 43, w); c.vline(54, 12, 43, D)
  // Tresen
  c.rect(6, 57, 48, 17, w); c.hline(6, 57, 48, L); c.hline(6, 73, 48, D)
  for (let x = 12; x < 54; x += 10) c.vline(x, 58, 15, D)
  c.rect(5, 54, 50, 3, D); c.hline(5, 54, 50, L)
  // Ware auf dem Tresen
  c.rect(8, 47, 6, 7, '#bae6fd'); c.rect(8, 46, 6, 1, '#475569'); c.rect(9, 50, 4, 3, '#f472b6'); c.px(10, 49, '#ec4899'); c.vline(8, 48, 5, '#e0f2fe')
  c.rect(46, 50, 4, 4, '#fbbf24'); c.px(49, 53, '#b45309'); c.vline(47, 48, 2, '#64748b')
  // Schild
  c.rect(15, 59, 30, 12, '#7c4a24'); c.rect(16, 60, 28, 10, '#fef3c7'); c.hline(16, 60, 28, '#fffbeb'); c.hline(16, 69, 28, '#d6c49a')
  // Markise, Bahnen mit Bogenkante
  const ws = [8, 8, 9, 8, 8, 9, 8]
  let x = 1
  ws.forEach((n, i) => {
    const m = i % 2 ? '#f8fafc' : '#dc2626', d = i % 2 ? '#cbd5e1' : '#b91c1c'
    c.rect(x, 1, n, 8, m); c.hline(x, 1, n, i % 2 ? '#ffffff' : '#ef4444'); c.rect(x, 9, n, 1, d); c.rect(x + 1, 10, n - 2, 2, m); c.hline(x + 1, 11, n - 2, d)
    x += n
  })
})
// Glutflosses Stand: dieselbe Schichtung; der Hai wippt zwischen Rückwand und Tresen
S('lava_back', 44, 34, (c) => {
  c.rect(0, 0, 44, 34, '#2a2220'); c.rect(2, 2, 40, 30, '#3f3533')
  for (let x = 12; x < 42; x += 11) c.vline(x, 2, 30, '#2a2220')
  for (const [a, b, d, e] of [[5, 10, 8, 14], [8, 14, 7, 18], [27, 6, 30, 10], [36, 16, 33, 21]]) c.line(a, b, d, e, '#7c2d12')
  c.px(7, 12, '#f97316'); c.px(29, 8, '#f97316'); c.px(34, 19, '#f97316')
}, false)
S('lava_fin', 16, 18, (c) => {
  const b = '#3b82f6', D = '#1d4ed8', L = '#60a5fa'
  c.poly([6, 5, 9, 1, 11, 2, 12, 6], L); c.line(9, 2, 8, 5, '#93c5fd')
  c.ellipse(8, 10, 6, 5, b); c.rect(2, 10, 12, 6, b); c.hline(3, 5, 10, L); c.rect(12, 8, 2, 8, D)
  c.rect(4, 9, 2, 2, '#f8fafc'); c.px(5, 10, INK); c.rect(10, 9, 2, 2, '#f8fafc'); c.px(11, 10, INK)
})
S('lava_front', 58, 61, (c) => {
  const s = '#44403c', L = '#78716c', D = '#292524'
  c.rect(5, 9, 3, 34, s); c.vline(5, 9, 34, L); c.rect(50, 9, 3, 34, s); c.vline(52, 9, 34, D)
  c.rect(5, 44, 48, 16, s); c.rect(4, 42, 50, 2, L); c.hline(5, 59, 48, D)
  // Basaltblöcke im Versatz
  for (let y = 44; y < 60; y += 5) { c.hline(5, y + 4, 48, D); for (let x = 9 + ((y - 44) / 5 % 2) * 6; x < 53; x += 12) c.vline(x, y, 4, D) }
  c.rect(14, 45, 30, 12, '#57190a'); c.rect(15, 46, 28, 10, '#1c0a05')
  c.rect(1, 1, 56, 7, '#7f1d1d')
  for (let x = 5; x < 56; x += 8) c.rect(x, 1, 4, 7, '#b91c1c')
  c.hline(1, 8, 56, '#450a0a')
})
S('buoy', 14, 32, (c) => {
  const r = '#dc3232', d = '#a11d1d', w = '#f0f0f0', g = '#a8b0bf'
  c.rect(6, 1, 2, 16, '#475569'); c.vline(6, 1, 16, '#94a3b8')
  c.rect(3, 17, 8, 1, r)
  c.rect(2, 18, 10, 5, r); c.rect(2, 23, 10, 4, w); c.rect(2, 27, 10, 3, r); c.rect(3, 30, 8, 1, d)
  c.rect(10, 18, 2, 5, d); c.rect(10, 23, 2, 4, g); c.rect(10, 27, 2, 3, d)
  c.vline(3, 19, 3, '#f87171'); c.vline(3, 24, 2, '#ffffff'); c.vline(3, 28, 2, '#f87171')
})
S('rift', 38, 28, (c) => {
  const r = '#58504c', L = '#807670', D = '#3c3634'
  c.poly([2, 27, 8, 10, 17, 2, 26, 6, 36, 27], r)
  c.poly([8, 10, 17, 2, 18, 8, 12, 16], L)
  c.poly([26, 6, 36, 27, 24, 27, 26, 14], D)
  c.line(5, 21, 13, 19, D); c.line(14, 12, 18, 11, D); c.line(3, 25, 22, 24, D)
  c.hline(13, 4, 3, '#a8a29e'); c.line(10, 10, 13, 7, '#a8a29e')
  c.hline(2, 26, 34, '#2a2523')
})
S('ladder', 20, 56, (c) => {
  const w = '#96623a', D = '#6e4628'
  c.rect(1, 1, 2, 54, w); c.vline(2, 1, 54, D); c.rect(17, 1, 2, 54, w); c.vline(18, 1, 54, D)
  for (let y = 4; y < 54; y += 8) { c.rect(3, y, 14, 2, w); c.hline(3, y + 1, 14, D); c.px(2, y, '#d4b483'); c.px(17, y, '#d4b483') }
})
for (let f = 0; f < 5; f++) S('wheel_' + f, 28, 44, (c) => {
  const w = '#96623a', D = '#6e4628', L = '#ba804e', a0 = (f / 2 - 1) * 0.3
  // ohne Auto-Umriss: der würde zwischen den Speichen ein Netz zeichnen
  c.rect(12, 14, 5, 30, INK); c.rect(13, 14, 3, 30, w); c.vline(15, 14, 30, D); c.vline(13, 14, 30, L)
  c.ring(14, 14, 10, INK); c.ring(14, 14, 9, w); c.ring(14, 14, 8, INK)
  for (let i = 0; i < 4; i++) {
    const a = a0 + i * Math.PI / 4, X = Math.round(Math.cos(a) * 12), Y = Math.round(Math.sin(a) * 12)
    c.line(14 - X, 14 - Y, 14 + X, 14 + Y, D)
    for (const s of [-1, 1]) { c.rect(14 + s * X - 1, 14 + s * Y - 1, 3, 3, INK); c.px(14 + s * X, 14 + s * Y, L) }
  }
  c.rect(12, 12, 5, 5, INK); c.rect(13, 13, 3, 3, '#fbbf24'); c.px(13, 13, '#fde68a')
}, false)
S('muschelrock', 26, 8, (c) => {
  c.poly([1, 7, 3, 3, 9, 1, 19, 1, 24, 4, 25, 7], '#64748b')
  c.hline(4, 2, 12, '#94a3b8'); c.hline(9, 1, 8, '#94a3b8')
  c.poly([16, 7, 19, 4, 24, 5, 25, 7], '#475569')
})

// ---------------------------------------------------------------- Köder (16×16)
const hook = (c, x, y) => { c.vline(x, y, 3, '#94a3b8'); c.hline(x, y + 3, 3, '#cbd5e1'); c.vline(x + 3, y + 1, 2, '#cbd5e1') }
function lure(c, A, a, W, P) {
  c.vline(7, 0, 2, '#94a3b8')
  c.ellipse(7, 6, 5, 5, A); c.ellipse(7, 6, 3, 3, a); c.rect(6, 5, 3, 3, W); c.px(7, 6, P); c.px(4, 3, W)
  hook(c, 7, 11)
}
S('bait_wurm', 16, 16, (c) => {
  const p = '#f472b6', D = '#be185d'
  c.vline(11, 1, 9, '#94a3b8'); c.line(11, 10, 9, 13, '#cbd5e1'); c.hline(5, 13, 4, '#cbd5e1'); c.vline(4, 11, 2, '#cbd5e1')
  const path = [[3, 3], [6, 2], [9, 3], [11, 5], [9, 8], [6, 8], [4, 9], [3, 11]]
  for (let i = 0; i + 1 < path.length; i++) c.line(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1], p, 2)
  for (const [x, y] of path.slice(1, -1)) c.px(x, y + 1, D)
  c.px(3, 3, '#fbcfe8'); c.px(2, 3, INK)
})
S('bait_spezi', 16, 16, (c) => {
  const b = '#6b2d0f', B = '#4a1f0a'
  c.rect(6, 1, 4, 1, '#facc15'); c.rect(7, 2, 2, 3, b); c.poly([7, 5, 8, 5, 11, 7, 11, 14, 4, 14, 4, 7], b)
  c.rect(4, 8, 8, 5, '#f97316'); c.rect(6, 9, 4, 3, '#a855f7'); c.px(7, 10, '#f3e8ff')
  c.rect(10, 7, 2, 8, B); c.vline(5, 6, 2, '#a16207')
})
S('bait_glitzer', 16, 16, (c) => {
  c.vline(7, 0, 2, '#94a3b8'); c.ellipse(7, 6, 4, 5, '#94a3b8'); c.ellipse(6, 6, 3, 4, '#e2e8f0'); c.line(5, 4, 5, 7, '#ffffff')
  c.px(8, 4, '#fde68a'); c.px(7, 8, '#fde68a'); c.px(9, 7, '#f9a8d4'); hook(c, 7, 11)
  c.px(12, 2, '#fde68a'); c.px(11, 2, '#fbbf24'); c.px(13, 2, '#fbbf24'); c.px(12, 1, '#fbbf24'); c.px(12, 3, '#fbbf24')
})
S('bait_mond', 16, 16, (c) => {
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) {
    const a = Math.hypot(x - 7, y - 8), b = Math.hypot(x - 10.5, y - 7)
    if (a <= 6.4 && b > 5) c.px(x, y, x - y * 0.2 > 3.4 ? '#fbbf24' : '#fde68a')
  }
  c.px(12, 3, '#ffffff'); c.px(11, 3, '#fde68a'); c.px(13, 3, '#fde68a'); c.px(12, 2, '#fde68a'); c.px(12, 4, '#fde68a')
  c.px(4, 6, '#d97706'); c.px(5, 10, '#d97706')
})
S('bait_abyss', 16, 16, (c) => lure(c, '#0e7490', '#22d3ee', '#ecfeff', '#0b0f19'))
S('bait_glutkoeder', 16, 16, (c) => {
  lure(c, '#dc2626', '#f97316', '#fef9c3', '#b91c1c')
  c.px(3, 2, '#f97316'); c.px(11, 1, '#fbbf24'); c.px(12, 3, '#f97316')
})
S('bait_lockkoeder', 16, 16, (c) => lure(c, '#57534e', '#a8a29e', '#ef4444', '#450a0a'))
S('bait_odkoeder', 16, 16, (c) => {
  // schwarz-weißer Mini-Fisch mit großem Auge
  c.poly([11, 6, 15, 3, 15, 10, 11, 7], '#94a3b8'); c.vline(14, 5, 3, '#64748b')
  c.ellipse(6, 6, 5, 4, '#94a3b8'); c.ellipse(5, 5, 4, 3, '#f8fafc'); c.line(8, 3, 9, 8, '#475569')
  c.rect(3, 4, 3, 3, INK); c.px(4, 5, '#ef4444'); c.hline(1, 8, 3, '#475569')
  hook(c, 6, 10)
})

// ---------------------------------------------------------------- Snacks (16×16)
S('snack_kaffee', 16, 16, (c) => {
  c.rect(2, 6, 9, 8, '#f8fafc'); c.vline(9, 6, 8, '#cbd5e1'); c.vline(10, 6, 8, '#cbd5e1'); c.hline(2, 13, 9, '#cbd5e1')
  c.rect(3, 6, 7, 1, '#5b3416'); c.rect(4, 9, 4, 2, '#ef4444')
  c.ring(12, 9, 2, '#f8fafc')
  c.vline(4, 2, 3, '#cbd5e1'); c.vline(5, 1, 1, '#cbd5e1'); c.vline(8, 1, 3, '#cbd5e1'); c.vline(7, 4, 1, '#cbd5e1')
})
S('snack_broetchen', 16, 16, (c) => {
  c.ellipse(8, 5, 6, 3, '#e9b872'); c.hline(3, 3, 7, '#f5d79a'); c.hline(3, 7, 11, '#c98a45'); c.px(6, 4, '#fff7cc'); c.px(9, 3, '#fff7cc'); c.px(11, 5, '#fff7cc')
  c.hline(1, 8, 14, '#22c55e'); c.px(3, 9, '#16a34a'); c.px(8, 9, '#16a34a'); c.px(12, 9, '#16a34a')
  c.rect(2, 9, 12, 2, '#cbd5e1'); c.hline(2, 9, 12, '#e2e8f0'); c.px(4, 10, INK); c.poly([13, 9, 15, 8, 15, 11, 13, 10], '#94a3b8')
  c.rect(3, 11, 10, 2, '#d9a05b'); c.hline(3, 12, 10, '#a86a3c')
})
S('snack_keks', 16, 16, (c) => {
  c.ellipse(8, 8, 6, 6, '#b97a3d'); c.ellipse(7, 7, 5, 5, '#d9a05b')
  c.px(4, 5, '#7c4a24'); c.px(11, 10, '#7c4a24'); c.px(5, 11, '#7c4a24'); c.px(11, 5, '#7c4a24')
  const g = '#22c55e', D = '#15803d'
  c.rect(5, 6, 2, 2, g); c.rect(8, 6, 2, 2, g); c.rect(5, 9, 2, 2, g); c.rect(8, 9, 2, 2, g); c.rect(7, 8, 1, 1, D); c.px(5, 6, '#86efac'); c.px(8, 6, '#86efac'); c.line(8, 9, 10, 12, D)
})
S('snack_limo', 16, 16, (c) => {
  c.rect(6, 1, 4, 1, '#fbbf24'); c.rect(7, 2, 2, 3, '#f0abfc'); c.poly([7, 5, 8, 5, 11, 7, 11, 14, 4, 14, 4, 7], '#f0abfc')
  c.rect(4, 9, 8, 6, '#d946ef'); c.vline(5, 7, 7, '#fae8ff'); c.vline(10, 8, 6, '#a21caf')
  c.px(7, 11, '#ffffff'); c.px(9, 13, '#ffffff'); c.px(8, 8, '#ffffff'); c.px(6, 13, '#fae8ff')
  c.px(13, 3, '#fff7cc'); c.px(12, 3, '#fde047'); c.px(14, 3, '#fde047'); c.px(13, 2, '#fde047'); c.px(13, 4, '#fde047'); c.px(2, 5, '#fde047')
})
