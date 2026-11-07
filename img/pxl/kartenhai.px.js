// Kartenhai: Tiki-Bar mit Blackjack auf der Sonneninsel. Quelle fuer das Werkzeug claude-pxl, nicht fuer img/pxl/render.js:
//   Die Raster (bj_*) stehen im Block ART in js/fischen.js.
pal({
  k: "#1b1f2e",                                    // outline
  t: "#e0b354", T: "#b98a35", U: "#8a6426",        // thatch
  b: "#d9a85c", B: "#a8743a", n: "#7a5128",        // bamboo
  s: "#8fa6b8", S: "#667f93", D: "#465a6b", l: "#b4c6d4", w: "#eef4f7", W: "#c6d3dc", // shark: side, back, deep shade, light, belly, belly shade
  m: "#5f1420", M: "#8f2230", g: "#f2a0a8",        // mouth: throat, inside, gum
  e: "#10121c", E: "#ffffff",                      // eye, teeth
  h: "#f97316", H: "#c2410c", y: "#fde047",        // shirt with flowers
  f: "#16a34a", F: "#0f7a37",                      // felt
  c: "#fffbeb", r: "#dc2626", d: "#1b1f2e",        // cards, suits
  a: "#0e7490", A: "#155e75", q: "#67e8f9",        // card back: the sea
})

sprite("bj_tisch", { w: 28, h: 38, outline: "k" },
  // bamboo posts
  rect(1, 8, 3, 30, "b"), rect(3, 8, 1, 30, "B"), rect(24, 8, 3, 30, "b"), rect(26, 8, 1, 30, "B"),
  hline(1, 16, 3, "n"), hline(1, 24, 3, "n"), hline(24, 16, 3, "n"), hline(24, 24, 3, "n"),
  // the shark behind the counter, in profile
  poly([18,12, 23,9, 22,14], "D"),
  poly([5,17, 7,14, 11,11, 18,11, 22,13, 23,20, 5,20], "s"),
  poly([7,14, 11,11, 18,11, 22,13, 22,14, 16,13, 11,13, 8,15], "S"),
  poly([5,17, 16,17, 19,20, 5,20], "w"),
  // hooded eye, nostril, gills
  rect(9, 13, 3, 3, "E"), rect(10, 14, 2, 2, "e"), hline(9, 13, 3, "D"), px(6, 16, "D"),
  vline(18, 15, 4, "D"), vline(20, 15, 4, "D"),
  // zigzag grin
  hline(5, 17, 11, "m"), hline(6, 19, 9, "m"), rect(6, 18, 9, 1, "M"),
  (c) => { for (let x = 6; x < 15; x += 2) { c.px(x, 18, "E"); c.px(x + 1, 19, "E") } },
  // holiday shirt with flowers and a bow tie
  rect(5, 20, 18, 5, "h"), rect(5, 24, 18, 1, "H"),
  px(17, 21, "y"), px(16, 22, "y"), px(18, 22, "y"), px(17, 23, "y"), px(21, 21, "y"), px(14, 23, "y"), px(6, 23, "y"),
  px(9, 21, "r"), px(11, 21, "r"), px(10, 21, "e"), px(9, 22, "r"), px(11, 22, "r"),
  // pectoral fin resting on the counter
  poly([19,21, 23,22, 23,25, 20,25], "S"),
  // counter: felt on top, bamboo front
  rect(0, 25, 28, 3, "f"), hline(0, 27, 28, "F"),
  rect(0, 28, 28, 10, "b"), (c) => { for (const x of [3, 7, 11, 15, 19, 23]) c.vline(x, 28, 10, "B") },
  hline(0, 28, 28, "n"), hline(0, 37, 28, "n"),
  // two cards on the felt
  rect(9, 24, 4, 3, "c"), px(10, 25, "r"), rect(14, 24, 4, 3, "c"), px(16, 25, "d"),
  // a sign that says what is played here
  rect(9, 30, 10, 6, "U"), text(10, 31, "21", "y"),
  // thatched roof, drawn last so it hangs over the posts
  poly([0,8, 14,0, 27,8, 27,10, 0,10], "t"), poly([0,8, 27,8, 27,10, 0,10], "T"),
  (c) => { for (let x = 1; x < 28; x += 3) { c.vline(x, 10, 2, "T"); c.line(14, 1, x, 7, "U") } })

// Portrait fuer das Blackjack-Fenster
sprite("bj_hai", { w: 66, h: 54, outline: "k" },
  // dorsal fin with a nick, rays of shade
  poly([29,14, 37,3, 45,0, 44,6, 41,7, 43,9, 44,17], "S"),
  poly([35,14, 40,5, 44,1, 43,6, 40,8, 41,16], "D"),
  // head and back
  poly([1,29, 5,22, 13,16, 25,12, 37,12, 47,16, 53,24, 56,38, 4,38], "s"),
  // shaded back, lit flank
  poly([5,22, 13,16, 25,12, 37,12, 47,16, 53,24, 54,28, 44,21, 32,18, 20,19, 10,24, 4,27], "S"),
  poly([13,16, 25,12, 37,12, 47,16, 44,16, 34,14, 24,15, 15,18], "D"),
  poly([12,26, 22,23, 34,23, 46,27, 34,26, 22,27], "l"),
  // belly below the mouth
  poly([1,29, 6,32, 28,29, 44,33, 56,38, 4,38], "w"),
  poly([26,36, 44,34, 56,38, 26,38], "W"),
  // open mouth: throat, tongue side, gum
  poly([2,30, 26,27, 30,30, 26,36, 8,37, 4,34], "M"),
  poly([10,31, 26,29, 28,31, 25,35, 12,35], "m"),
  hline(4, 30, 21, "g"), hline(8, 36, 17, "g"),
  // two rows of teeth, the upper ones pointing down
  (c) => {
    for (let i = 0; i < 7; i++) { const x = 4 + i * 3; c.rect(x, 31 - (i >> 2), 3, 1, "E"); c.rect(x + 1, 32 - (i >> 2), 1, 2, "E") }
    for (let i = 0; i < 6; i++) { const x = 8 + i * 3; c.rect(x, 35, 3, 1, "E"); c.rect(x + 1, 33, 1, 2, "E") }
  },
  // eye under a heavy brow, with a highlight
  rect(15, 21, 6, 6, "E"), rect(16, 22, 5, 5, "e"), px(17, 23, "E"), line(13, 21, 22, 20, "D"), line(13, 20, 22, 19, "D"),
  // nostril and an old scar over the snout
  rect(6, 25, 2, 1, "D"), line(9, 25, 12, 28, "w"), px(11, 25, "w"),
  // gills
  (c) => { for (const x of [33, 37, 41]) { c.line(x, 24, x + 1, 28, "D"); c.line(x + 1, 28, x, 33, "D") } },
  // holiday shirt
  rect(8, 38, 50, 16, "h"), rect(8, 52, 50, 2, "H"),
  poly([14,38, 26,38, 21,44], "w"), poly([28,38, 42,38, 34,44], "w"),
  // hibiscus flowers and palm leaves
  (c) => { for (const [x, y] of [[46,43],[37,48],[53,49],[15,49]]) { c.rect(x - 1, y - 2, 3, 5, "y"); c.rect(x - 2, y - 1, 5, 3, "y"); c.px(x, y, "H") } },
  (c) => { for (const [x, y] of [[28,47],[43,50]]) { c.line(x, y, x + 5, y - 3, "F"); c.line(x + 1, y, x + 5, y + 1, "F"); c.px(x + 2, y - 2, "f") } },
  // bow tie
  poly([21,41, 16,38, 16,45], "r"), poly([23,41, 28,38, 28,45], "r"), rect(21, 40, 3, 3, "m"),
  // fin holding a fan of cards
  rect(5, 37, 9, 13, "W"), rect(6, 38, 7, 11, "c"), rect(7, 39, 2, 2, "d"),
  rect(0, 40, 9, 13, "W"), rect(1, 41, 7, 11, "c"), rect(2, 42, 2, 2, "r"), rect(4, 45, 2, 3, "r"),
  poly([9,50, 18,45, 26,49, 24,53, 12,54], "s"), poly([9,50, 16,47, 13,51], "l"), line(12, 53, 24, 52, "D"))

// Farben der Karten: Herz und Karo rot, Pik und Kreuz schwarz
sprite("bj_herz", `
  .rr.rr.
  rrrrrrr
  rrrrrrr
  .rrrrr.
  ..rrr..
  ...r...`)
sprite("bj_karo", `
  ...r...
  ..rrr..
  .rrrrr.
  rrrrrrr
  .rrrrr.
  ..rrr..
  ...r...`)
sprite("bj_pik", `
  ...d...
  ..ddd..
  .ddddd.
  ddddddd
  dd.d.dd
  ...d...
  ..ddd..`)
sprite("bj_kreuz", `
  ..ddd..
  ..ddd..
  dd.d.dd
  ddddddd
  dd.d.dd
  ...d...
  ..ddd..`)
sprite("bj_ruecken", { w: 16, h: 24, outline: "k" },
  rect(0, 0, 16, 24, "c"), rect(1, 1, 14, 22, "a"),
  (c) => { for (let y = 3; y < 22; y += 4) for (let x = 2; x < 14; x += 4) { const o = (y >> 2) % 2 ? 2 : 0; c.hline(x + o - 1, y, 2, "q"); c.hline(x + o + 1, y + 1, 2, "A") } })
