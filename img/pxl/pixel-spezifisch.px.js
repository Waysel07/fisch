// Pixel-Spezifisch (img/pixel-spezifisch.png). Quelle fuer das Werkzeug claude-pxl, nicht fuer img/pxl/render.js:
//   pxl build pixel-spezifisch.px.js   danach out/sprites/spezifisch.png nach img/pixel-spezifisch.png kopieren
pal({
  k: "#2a120e",                                    // outline, dark cola
  D: "#5a1f12", M: "#b5400f", G: "#ec7416", L: "#f9a825", W: "#ffdc62",   // body: cola back, orange flank, golden belly
  S: "#c2520f",                                    // scale edges
  F: "#f58a1e", f: "#d4501a", d: "#8f2c10",        // fins
  R: "#d92a1c",                                    // red at the fin roots and gill
  e: "#1a0c08", w: "#ffffff", I: "#fff0c2",        // eye
  n: "#170c3a", o: "#2c1a66", O: "#e8401e", y: "#ffc93c", c: "#fff6e0", // label: navy with a red and gold swirl
})
ramps("kDMGLW", "dfF")

const BODY = [5,21, 8,16, 14,12, 22,9, 32,7, 42,8, 50,11, 57,15, 62,19, 62,22, 56,26, 48,29, 38,32, 26,33, 15,31, 9,27, 6,24]

sprite("spezifisch", { w: 74, h: 40, outline: "k" },
  // tail with rays
  poly([60,19, 66,12, 73,3, 71,12, 69,20, 71,29, 73,38, 65,29, 60,23], "F"),
  (c) => { for (const [x, y] of [[72,5],[70,10],[69,15],[68,20],[69,25],[70,30],[72,36]]) c.line(61, 21, x, y, "f") },
  poly([60,19, 64,16, 64,26, 60,23], "R"),
  // dorsal fin
  poly([24,9, 28,3, 34,0, 40,1, 47,6, 51,12, 42,9, 32,8], "F"),
  (c) => { for (const [a, b] of [[27,5],[31,2],[35,1],[39,2],[43,4],[47,7]]) c.line(a - 1, 9, a + 2, b + 1, "f") },
  // belly fins behind the body
  poly([22,31, 19,37, 24,39, 30,38, 31,32], "F"),
  (c) => { for (const x of [21,24,27,29]) c.line(26, 32, x, 37, "f") },
  poly([42,30, 42,36, 47,38, 50,34, 49,28], "F"),
  (c) => { for (const x of [43,46,48]) c.line(46, 29, x, 36, "f") },
  // body with back and belly
  poly(BODY, "G"),
  clip(BODY,
    poly([0,0, 74,0, 74,14, 50,12, 30,12, 12,17, 0,20], "M"),
    poly([0,0, 74,0, 74,11, 48,9, 30,9, 14,13, 0,15], "D"),
    poly([0,26, 16,26, 30,27, 46,26, 74,20, 74,40, 0,40], "L"),
    poly([6,30, 18,29, 32,30, 44,29, 74,24, 74,40, 0,40], "W"),
    // one scale arc per scale, offset row by row
    (c) => {
      for (let row = 0; row < 8; row++) for (let i = 0; i < 16; i++) {
        const x = 18 + i * 4 + (row % 2 ? 2 : 0), y = 8 + row * 3
        c.px(x, y, "S"); c.px(x + 1, y + 1, "S"); c.px(x, y + 2, "S")
      }
    },
    // head is smooth: paint it over the scales
    poly([0,10, 17,10, 19,16, 19,24, 16,33, 0,33], "G"),
    poly([0,10, 17,10, 15,13, 9,15, 0,19], "M"),
    poly([0,26, 16,26, 16,33, 0,33], "L"),
    // gill cover
    (c) => { c.line(17, 12, 19, 17, "R"); c.line(19, 17, 19, 23, "R"); c.line(19, 23, 16, 29, "R"); c.line(18, 14, 20, 18, "D"); c.line(20, 18, 20, 23, "D") },
  ),
  // mouth
  line(5, 23, 9, 24, "D"), px(4, 22, "R"), px(5, 21, "R"),
  // eye
  circ(12, 18, 2.2, "I"), circ(12, 18, 1.3, "e"), px(11, 17, "w"),
  // pectoral fin
  poly([21,26, 19,32, 24,33, 27,29, 25,26], "f"),
  (c) => { c.line(22, 27, 21, 32, "d"); c.line(24, 27, 24, 32, "d") },
  // can-style label, wrapped on the flank
  rect(28, 12, 23, 14, "n"),
  rect(29, 13, 21, 12, "o"),
  poly([29,22, 34,20, 41,22, 49,20, 49,24, 29,24], "O"),
  poly([29,14, 34,13, 40,15, 49,13, 49,14, 40,16, 34,15, 29,15], "y"),
  text(30, 17, "SPEZI", "c"),
)
