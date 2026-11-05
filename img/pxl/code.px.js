// Quelle der Sprites, die als Raster in js/fischen.js stehen (Block ART und PLAYER_*).
// Das Spiel lädt diese Datei nicht. 1 Pixel = ein halbes Welt-Pixel, die Größen passen zu den Hitboxen in PROPS.
// Koordinaten in S() meinen immer das fertige Bild inklusive Umriss.
pal({ k: '#1b1f2e' })
const INK = '#1b1f2e'

function S(name, W, H, fn, outline = true, keys, lit) {
  const o = outline ? 1 : 0
  const opt = { w: W - 2 * o, h: H - 2 * o, keys }
  if (outline) opt.outline = 'k'
  // lit: Glanz, Kernschatten und getönter Umriss wie bei den Inselfischen
  if (lit) { opt.post = (c) => light(c, { core: 0.14 }); if (outline) opt.edge = (g) => selout(g, INK) }
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

// ---------------------------------------------------------------- Sonneninsel: Sportstationen
// Der Jetski von oben, Bug nach oben. Fahrer mit Hut (h H l), Jacke (c C y) und Haut (s S) wie die Spielfigur;
// das Spiel färbt diese Buchstaben in deinen Look um (sportLook).
const LOOK = { h: '#22c55e', H: '#15803d', l: '#86efac', c: '#f59e0b', C: '#c2410c', y: '#fcd34d', s: '#f2c9a0', S: '#d9a47a' }
S('sp_jetski', 22, 36, (c) => {
  const A = '#e11d48', D = '#9f1239', L = '#fb7185', W = '#f8fafc', G = '#334155', M = '#7dd3fc'
  c.poly([11, 1, 15, 5, 18, 12, 19, 24, 18, 32, 15, 34, 7, 34, 4, 32, 3, 24, 4, 12, 7, 5], A)
  c.poly([11, 2, 8, 6, 5, 13, 5, 24, 6, 30, 8, 30, 7, 24, 7, 13, 9, 7], L)
  c.poly([18, 13, 18, 24, 17, 31, 15, 33, 16, 24, 16, 13], D)
  c.line(5, 26, 6, 32, W); c.line(17, 26, 16, 32, W); c.hline(8, 33, 7, D)
  // Windschild und Lenker
  c.poly([8, 9, 14, 9, 15, 12, 7, 12], M); c.hline(9, 9, 3, W)
  c.hline(5, 14, 13, G); c.px(5, 13, G); c.px(17, 13, G)
  // Sitzbank
  c.rect(8, 21, 7, 10, '#1f2937'); c.vline(8, 22, 8, '#475569')
  // Fahrer: Arme zum Lenker, Schultern, Hut von oben
  c.line(7, 15, 7, 19, LOOK.C); c.line(15, 15, 15, 19, LOOK.C)
  c.rect(6, 13, 2, 2, LOOK.s); c.rect(15, 13, 2, 2, LOOK.s)
  c.ellipse(11, 21, 5, 3, LOOK.c); c.hline(8, 19, 7, LOOK.y); c.hline(7, 23, 9, LOOK.C)
  c.ellipse(11, 18, 3, 3, LOOK.H); c.ellipse(11, 18, 2, 2, LOOK.h); c.px(10, 17, LOOK.l); c.px(11, 17, LOOK.l)
}, true, LOOK)

// ---------------------------------------------------------------- Steg: Bealins Ruderboot und der Inselflieger (mit Licht)
// Das Spiel tönt sie nachts selbst ab; Laterne, Propeller und Wellen zeichnet es dazu.
S('bealin_boat', 62, 16, (c) => {
  const H = '#a8442a', Hd = '#7a2f1c', Hl = '#c75a3a', Cr = '#efe0c0', Wd = '#a0662f', Wl = '#c98a4b'
  c.poly([2, 4, 60, 4, 58, 9, 53, 13, 9, 13, 4, 9], H)
  c.hline(4, 5, 55, Cr); c.hline(4, 6, 55, '#d9c59c')                                    // helle Bordwand-Leiste
  c.hline(5, 8, 53, Hl); c.hline(6, 10, 50, Hd); c.hline(8, 12, 46, '#5e2416')            // Planken
  for (const x of [14, 26, 38, 50]) c.vline(x, 7, 5, Hd)                                  // Nietreihen der Spanten
  c.hline(1, 3, 60, '#e8d3a8'); c.hline(2, 2, 58, '#fff1d0')                              // Dollbord
  c.rect(1, 0, 3, 4, Wd); c.vline(1, 0, 4, Wl)                                            // Bugpfosten
  c.rect(57, 1, 3, 3, Wd); c.px(57, 1, Wl)                                                // Heck
  // Riemen ruht schräg an der Bordwand, Blatt im Wasser
  c.line(10, 0, 16, 11, Wd, 2); c.line(10, 0, 16, 11, Wl); c.rect(15, 11, 4, 4, Wd); c.vline(15, 11, 4, Wl)
  c.rect(9, 1, 3, 2, '#64748b')                                                           // Dolle
  // Name am Bug
  for (const [x, w] of [[42, 2], [45, 1], [47, 3], [51, 2]]) c.hline(x, 9, w, Cr)
}, true, undefined, true)
S('plane', 56, 34, (c) => {
  const R = '#ef4444', Rd = '#b91c1c', Rl = '#fca5a5', Wt = '#f8fafc', Wg = '#cbd5e1', G = '#94a3b8', Gd = '#475569', Gl = '#64748b', N = '#1e3a8a', Gl2 = '#7dd3fc'
  // Schwimmer mit Streben
  c.line(14, 19, 12, 25, Gd, 2); c.line(36, 19, 38, 25, Gd, 2); c.line(15, 19, 13, 25, Gl); c.line(37, 19, 39, 25, Gl)
  c.poly([2, 27, 6, 25, 44, 25, 49, 27, 45, 31, 8, 31, 4, 30], Wg)
  c.hline(6, 25, 38, Wt); c.hline(5, 26, 42, '#e2e8f0'); c.hline(8, 30, 37, G); c.poly([2, 27, 6, 25, 7, 30, 4, 30], R); c.px(4, 26, Rl)
  c.vline(30, 26, 4, G)                                                                   // Stufe im Schwimmer
  // Rumpf
  c.poly([5, 11, 9, 8, 30, 8, 47, 9, 52, 10, 52, 13, 40, 17, 30, 19, 9, 19, 5, 16], Wt)
  c.hline(9, 9, 38, '#ffffff'); c.hline(7, 18, 30, Wg)
  c.hline(6, 14, 42, R); c.hline(6, 15, 40, Rd); c.hline(8, 16, 34, N)                   // Zierstreifen
  // Motorhaube und Spinner
  c.poly([3, 10, 9, 9, 10, 18, 3, 17], G); c.vline(3, 10, 8, Gl); c.hline(4, 10, 5, Wg); c.vline(9, 10, 8, Gd)
  for (const y of [12, 14, 16]) c.hline(5, y, 3, Gd)
  c.rect(0, 12, 3, 4, R); c.px(0, 12, Rl)
  // Fenster
  c.poly([11, 9, 16, 9, 16, 13, 10, 13], Gl2); c.line(12, 12, 14, 10, '#ecfeff')
  c.rect(18, 10, 5, 3, '#38bdf8'); c.hline(18, 10, 5, '#bae6fd'); c.rect(25, 10, 5, 3, '#38bdf8'); c.hline(25, 10, 5, '#bae6fd')
  c.rect(19, 11, 2, 2, '#1e293b'); c.px(19, 11, '#f2c9a0')                               // Pilot im Fenster
  c.vline(32, 9, 9, Wg); c.px(33, 13, G)                                                  // Tür
  // Leitwerk
  c.poly([41, 9, 46, 1, 52, 1, 53, 10], R); c.line(47, 2, 51, 2, Rl); c.line(45, 5, 52, 5, Wt); c.vline(52, 2, 8, Rd)
  c.poly([44, 11, 55, 10, 55, 12, 44, 13], '#e2e8f0'); c.hline(45, 11, 9, Wt)
  // Hochdecker-Flügel mit Streben
  c.poly([10, 6, 13, 4, 42, 4, 44, 6, 42, 8, 12, 8], R)
  c.hline(13, 4, 29, Rl); c.hline(12, 5, 31, '#f87171'); c.hline(12, 8, 30, Rd); c.rect(40, 5, 3, 2, '#fde047') // Positionslicht
  c.line(17, 17, 12, 9, Gl); c.line(35, 17, 41, 9, Gl)                                    // Flügelstreben
}, true, undefined, true)

// ---------------------------------------------------------------- Sonneninsel: Coach Pelle und die Strandbude (mit Licht)
// Pelle stehend: 32×37 (16×18,5 Welt), Füße unten Mitte bei x 19; pelle_1 hebt den Flügel (Pfiff)
function pelleStand(c, wingUp) {
  const W = '#f8fafc', Wd = '#cbd5e1', Gr = '#e2e8f0', Gd = '#94a3b8', O = '#f59e0b', Ol = '#fbbf24', Od = '#d97706', F = '#f97316'
  // Beine und Schwimmfüße
  c.rect(15, 30, 2, 5, F); c.rect(21, 30, 2, 5, F); c.hline(12, 35, 6, F); c.hline(20, 35, 6, F); c.px(12, 34, F); c.px(25, 34, F)
  // Körper, Bauch etwas grauer
  c.ellipse(19, 24, 8, 7, W); c.ellipse(19, 27, 6, 3, Wd); c.ellipse(17, 21, 4, 3, '#ffffff')
  // Hals und Kopf mit Stirnband
  c.rect(16, 9, 5, 10, W); c.vline(20, 10, 9, Wd)
  c.ellipse(19, 5, 5, 4, W); c.hline(14, 3, 11, '#ef4444'); c.hline(15, 2, 9, '#f87171'); c.px(24, 4, '#b91c1c'); c.px(25, 5, '#ef4444')
  c.rect(16, 4, 2, 2, INK); c.px(16, 4, '#ffffff')
  // langer Schnabel mit Kehlsack
  c.poly([15, 5, 2, 6, 1, 8, 15, 8], O); c.hline(3, 6, 12, Ol); c.px(1, 8, Od); c.px(2, 9, Od)
  c.poly([15, 8, 3, 9, 6, 12, 10, 13, 14, 11], Ol); c.line(4, 10, 13, 12, Od)
  // Pfeife an der Schnur
  c.line(17, 11, 14, 15, '#475569'); c.rect(12, 15, 3, 2, '#facc15'); c.px(12, 15, '#fef08a')
  // Flügel
  if (wingUp) { c.poly([25, 19, 27, 7, 30, 4, 31, 8, 28, 19], Gr); c.line(28, 7, 27, 17, Gd); c.line(30, 6, 29, 12, Gd) }
  else { c.poly([21, 18, 27, 19, 28, 27, 24, 29, 21, 25], Gr); c.line(23, 21, 26, 27, Gd); c.line(25, 20, 27, 25, Gd) }
}
S('pelle_0', 32, 37, (c) => pelleStand(c, false), true, undefined, true)
S('pelle_1', 32, 37, (c) => pelleStand(c, true), true, undefined, true)
// Pelle fliegt: 40×22 (20×11 Welt), Kopf links
function pelleFly(c, up) {
  const W = '#f8fafc', Wd = '#cbd5e1', Gr = '#e2e8f0', Gd = '#94a3b8', O = '#f59e0b', Ol = '#fbbf24', Od = '#d97706'
  c.ellipse(25, 14, 9, 4, W); c.hline(18, 17, 14, Wd)
  c.poly([34, 12, 39, 10, 39, 16, 34, 15], Gr)                                              // Schwanz
  if (up) { c.poly([20, 12, 26, 1, 31, 2, 30, 12], Gr); c.line(26, 3, 26, 11, Gd); c.line(29, 3, 28, 11, Gd) }
  else { c.poly([20, 15, 31, 15, 29, 21, 24, 21], Gr); c.line(24, 16, 25, 20, Gd); c.line(28, 16, 28, 20, Gd) }
  c.ellipse(13, 12, 4, 3, W); c.hline(10, 10, 7, '#ef4444'); c.rect(11, 11, 2, 2, INK); c.px(11, 11, '#ffffff')
  c.poly([10, 12, 1, 13, 1, 14, 10, 14], O); c.hline(2, 13, 8, Ol); c.poly([10, 14, 3, 15, 7, 17, 10, 16], Ol); c.px(1, 14, Od)
  c.rect(16, 15, 2, 2, '#facc15')
}
S('pelle_fly_0', 40, 22, (c) => pelleFly(c, true), true, undefined, true)
S('pelle_fly_1', 40, 22, (c) => pelleFly(c, false), true, undefined, true)
// Strandbude: 64×64 (32×32 Welt), steht mit der Theke auf dem Steg
S('beachhut', 64, 64, (c) => {
  const Bm = '#c9a15a', Bl = '#e6c47e', Bd = '#9a7333', N = '#7a5726', S1 = '#e9c77b', S2 = '#c99a4a', S3 = '#a87b34'
  // Pfosten
  for (const x of [8, 52]) { c.rect(x, 14, 4, 22, Bm); c.vline(x, 14, 22, Bl); c.vline(x + 3, 14, 22, Bd); for (let y = 18; y < 36; y += 6) c.hline(x, y, 4, N) }
  // Strohdach in Lagen, unten Fransen
  c.poly([3, 15, 10, 2, 54, 2, 61, 15], S2)
  for (let y = 3; y < 15; y++) { const w0 = 10 - (y - 2) * 0.54, w1 = 54 + (y - 2) * 0.54; for (let x = Math.ceil(w0); x < w1; x++) if ((x * 3 + y * 5) % 7 < 3) c.px(x, y, y % 4 < 2 ? S1 : S2) }
  for (const y of [6, 10]) c.hline(8, y, 48, S3)
  c.hline(11, 2, 43, '#f6e2a8')
  for (let x = 3; x < 61; x += 2) { const l = 3 + ((x * 7) % 5); c.vline(x, 15, l, x % 4 ? S2 : S3); c.px(x, 15 + l - 1, S3) }
  // Tafel unter dem Dach
  c.rect(25, 19, 14, 9, '#3b2a1a'); c.rect(26, 20, 12, 7, '#1f2a24'); for (const [x, y, w] of [[27, 21, 7], [27, 23, 9], [27, 25, 5]]) c.hline(x, y, w, '#e2e8f0')
  c.vline(28, 17, 2, '#57301a'); c.vline(35, 17, 2, '#57301a')
  // Getränke auf der Theke
  c.rect(12, 27, 5, 6, '#fb923c'); c.hline(12, 27, 5, '#fed7aa'); c.vline(16, 28, 5, '#ea580c'); c.line(15, 27, 17, 23, '#22c55e')
  c.rect(45, 27, 5, 6, '#38bdf8'); c.hline(45, 27, 5, '#bae6fd'); c.vline(49, 28, 5, '#0284c7'); c.poly([44, 25, 48, 22, 52, 25], '#f472b6'); c.vline(48, 25, 3, '#a16207')
  c.ellipse(31, 31, 3, 2, '#7c4a24'); c.hline(29, 30, 5, '#a0662f'); c.line(32, 29, 34, 25, '#facc15')
  // Theke: Brett oben, Bambus-Lamellen vorne mit Knoten
  c.rect(1, 33, 62, 4, '#8b5a2b'); c.hline(1, 33, 62, '#b07a44'); c.hline(1, 36, 62, '#5b3416')
  for (let x = 3; x < 61; x += 4) { c.rect(x, 37, 4, 26, Bm); c.vline(x, 37, 26, Bl); c.vline(x + 3, 37, 26, Bd); for (let y = 41 + (x % 8 ? 3 : 0); y < 62; y += 7) c.hline(x, y, 4, N) }
  c.hline(1, 62, 62, '#5b3416')
}, true, undefined, true)

// ---------------------------------------------------------------- Sonneninsel: Zuschauer
// 10×15 (5×7,5 Welt), Füße unten Mitte. h H = Haare, c C = Shirt, s S = Haut; das Spiel färbt jeden Zuschauer anders ein (sfan).
// sp_fan_1 reißt die Arme hoch (Jubel).
const FAN = { h: '#7c4a24', H: '#4a2a12', c: '#ef4444', C: '#b91c1c', s: '#f2c9a0', S: '#d9a47a', p: '#334155', P: '#1e293b' }
function fan(c, up) {
  c.rect(4, 11, 1, 3, FAN.p); c.rect(6, 11, 1, 3, FAN.P)
  c.rect(3, 6, 5, 5, FAN.c); c.vline(7, 6, 5, FAN.C); c.hline(3, 10, 5, FAN.C)
  if (up) { c.vline(2, 2, 5, FAN.c); c.vline(8, 2, 5, FAN.C); c.px(2, 1, FAN.s); c.px(8, 1, FAN.S) }
  else { c.vline(2, 7, 3, FAN.c); c.vline(8, 7, 3, FAN.C); c.px(2, 10, FAN.s); c.px(8, 10, FAN.S) }
  c.ellipse(5, 3, 2, 2, FAN.s); c.vline(6, 2, 3, FAN.S); c.hline(3, 1, 5, FAN.h); c.px(3, 2, FAN.h); c.px(7, 2, FAN.H); c.hline(4, 0, 3, FAN.h)
}
S('sp_fan_0', 11, 16, (c) => fan(c, false), true, FAN)
S('sp_fan_1', 11, 16, (c) => fan(c, true), true, FAN)
