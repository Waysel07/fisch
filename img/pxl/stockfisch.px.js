// Stockfisch und Schachfiguren. Quelle fuer das Werkzeug claude-pxl, nicht fuer img/pxl/render.js:
//   pxl build stockfisch.px.js   danach out/sprites/stockfisch.png nach img/stockfisch.png kopieren
//   Die Figuren stehen als Raster (figur_*) im Block ART in js/fischen.js, die Buchstaben w, s, k faerbt das Spiel um.
pal({
  k: "#1f2230",                                       // outline
  D: "#6f6a5c", M: "#a29a83", L: "#cfc7ad", W: "#efe8d2", // dried, stiff cod
  c: "#8a8371",                                       // the drying cracks
  B: "#23273a", I: "#f4efe0",                         // chequered flank
  g: "#fbbf24", G: "#b45309", r: "#c0392b",           // crown
  e: "#10121c", E: "#ffffff",                         // eye
  w: "#f8f4e6", s: "#c9c2a8",                         // chess pieces: main, shade
  x: "#454b6b", X: "#2c3050", h: "#e6cc9f", d: "#94704a", // preview only: black pieces, board squares
})

const BODY = [6,24, 10,20, 18,16, 30,14, 44,14, 54,16, 60,20, 60,24, 54,28, 44,31, 30,32, 18,31, 10,28]
sprite("stockfisch", { w: 74, h: 40, outline: "k" },
  // stiff tail and fins: dried flat, not flowing
  poly([58,20, 64,14, 72,10, 70,22, 72,34, 64,30, 58,25], "M"),
  (c) => { for (const [x, y] of [[70,13],[68,18],[67,22],[68,26],[70,31]]) c.line(60, 22, x, y, "c") },
  poly([26,15, 30,9, 40,8, 48,14], "M"), (c) => { for (const x of [31,35,39,43]) c.line(x, 14, x + 1, 10, "c") },
  poly([30,31, 34,37, 42,36, 44,30], "M"), (c) => { for (const x of [34,37,40]) c.line(x, 31, x + 1, 35, "c") },
  // body
  poly(BODY, "L"),
  clip(BODY,
    poly([0,0, 74,0, 74,19, 44,17, 26,18, 10,23, 0,24], "M"),
    poly([0,26, 18,27, 44,27, 74,21, 74,40, 0,40], "W"),
    // the chequered flank, the one thing that gives it away
    (c) => { for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) c.rect(26 + x * 3, 17 + y * 3, 3, 3, (x + y) % 2 ? "B" : "I") },
    // gill and drying cracks
    line(20, 18, 17, 29, "D"), line(50, 17, 53, 21, "c"), line(52, 25, 56, 23, "c")),
  // tired eye and a thin, unimpressed mouth
  rect(11, 19, 5, 5, "E"), rect(12, 20, 3, 3, "e"), hline(11, 19, 5, "D"), px(12, 20, "E"),
  line(6, 25, 12, 26, "D"),
  // a king's crown on its head
  rect(11, 14, 9, 4, "g"), rect(11, 17, 9, 1, "G"), px(12, 15, "r"), px(15, 15, "r"), px(18, 15, "r"),
  rect(11, 12, 2, 2, "g"), rect(18, 12, 2, 2, "g"), rect(15, 10, 1, 4, "G"), rect(14, 11, 3, 1, "G"))

// Schachfiguren: 16x16 mit Umriss. Nur linke Haelfte zeichnen.
const P = { mx: true, outline: "k" }
sprite("figur_p", P, `
  ......
  ......
  ......
  ....ww
  ...www
  ...wws
  ....ws
  ...www
  ...wws
  ..wwws
  ..wwss
  .wwwss
  .sssss
  ......`)
sprite("figur_r", P, `
  ......
  ......
  .ww.ww
  .wwwww
  .wwwss
  ..wwss
  ..wwws
  ..wwws
  ..wwws
  ..wwws
  ..wwws
  .wwwss
  .sssss
  ......`)
sprite("figur_b", P, `
  ......
  ......
  .....w
  ....ww
  ...wws
  ...www
  ....ws
  ...wws
  ...wws
  ..wwws
  ..wwss
  .wwwss
  .sssss
  ......`)
sprite("figur_q", P, `
  ......
  w....w
  .w..ww
  .ww.ww
  .wwwww
  ..wwws
  ..wwss
  ...wws
  ...wws
  ...wws
  ..wwws
  .wwwss
  .sssss
  ......`)
sprite("figur_k", P, `
  .....w
  ....ww
  .....w
  ...www
  ..wwww
  ..wwws
  ...wws
  ...wws
  ...wws
  ...wws
  ..wwws
  .wwwss
  .sssss
  ......`)
sprite("figur_n", { outline: "k" }, `
  ............
  .....ww.....
  ....wwwww...
  ...wwkwwww..
  ..wwwwwwwss.
  .wwwwwwwwss.
  .wwsswwwwss.
  ..ss.wwwwss.
  ....wwwwwss.
  ...wwwwwwss.
  ...wwwwwsss.
  ..wwwwwwsss.
  .wwwwwwwssss
  .sssssssssss`)

// nur Vorschau: alle Figuren auf echten Feldern, der Bereich zaehlt nicht fuers Spiel
for (const n of "prnbqk") sprite("_s_" + n, { base: "figur_" + n, swap: { w: "x", s: "X" } })
scene("brett", { w: 96, h: 64, bg: "h" },
  (c) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) if ((x + y) % 2) c.rect(x * 16, y * 16, 16, 16, "d") },
  (c) => { "prnbqk".split("").forEach((n, i) => {
    c.stamp("figur_" + n, i * 16 + 1, 0); c.stamp("_s_" + n, i * 16 + 1, 16)
    c.stamp("figur_" + n, ((i + 3) % 6) * 16 + 1, 32); c.stamp("_s_" + n, ((i + 3) % 6) * 16 + 1, 48)
  }) })
