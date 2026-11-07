// Filet-O-Fisch (img/filet-o-fisch.png). Quelle fuer das Werkzeug claude-pxl, nicht fuer img/pxl/render.js:
//   pxl build filet-o-fisch.px.js   danach out/sprites/filet_o_fisch.png nach img/filet-o-fisch.png kopieren
pal({
  k: "#2b1a10",                                    // outline
  b: "#fbeccb", B: "#efd3a0", D: "#cfa36a",        // steamed bun: light, main, shade
  y: "#ffc72c", Y: "#e8960f",                      // melted cheese
  p: "#f4b552", P: "#dc8b2c", Q: "#a85d1b",        // breading
  w: "#fff8e6", g: "#93b84f",                      // tartar sauce with herbs
  e: "#17100a", W: "#ffffff",                      // eye
})

const PATTY = [4,18, 53,18, 55,20, 55,28, 53,30, 4,30, 2,28, 2,20]
const BUN_TOP = [6,17, 7,11, 11,6, 18,3, 28,2, 38,3, 45,6, 49,11, 50,17]
const BUN_LOW = [7,31, 49,31, 50,35, 46,38, 38,39, 18,39, 10,38, 6,35]
const TAIL = [53,21, 60,16, 67,8, 66,18, 63,24, 66,30, 67,40, 60,32, 53,27]

sprite("filet_o_fisch", { w: 68, h: 42, outline: "k" },
  // breaded tail sticking out of the bun
  poly(TAIL, "P"),
  clip(TAIL, poly([53,21, 60,16, 67,8, 64,16, 58,21, 53,23], "p"), poly([53,27, 60,32, 67,40, 63,31, 58,27], "Q")),
  (c) => { for (const [x, y] of [[65,12],[63,18],[62,24],[63,30],[65,36]]) c.line(55, 24, x, y, "Q") },

  // bottom bun
  poly(BUN_LOW, "B"),
  clip(BUN_LOW, rect(0, 36, 68, 6, "D"), rect(10, 32, 30, 1, "b")),

  // tartar sauce, squeezed out under the patty
  rect(6, 30, 44, 2, "w"), rect(11, 32, 4, 1, "w"), rect(27, 32, 6, 1, "w"), rect(42, 32, 3, 1, "w"), px(29, 33, "w"),
  px(10, 30, "g"), px(19, 31, "g"), px(26, 30, "g"), px(36, 31, "g"), px(45, 30, "g"),

  // square breaded patty, wider than the bun. Breading is the one surface that is really granular
  poly(PATTY, "P"),
  clip(PATTY,
    rect(0, 18, 68, 3, "p"), rect(0, 28, 68, 3, "Q"),
    noise(2, 21, 54, 7, "p", 0.09, 4), noise(2, 21, 54, 7, "Q", 0.06, 9)),

  // little fin on the flank
  poly([24,22, 30,22, 33,25, 30,28, 25,27], "Q"),
  poly([25,23, 30,23, 31,25, 29,26, 26,26], "p"),
  line(26, 24, 29, 24, "P"), px(27, 25, "P"),

  // half a slice of melted cheese, the corners run down
  poly([8,16, 48,16, 48,21, 43,21, 38,28, 33,21, 22,21, 18,26, 14,21, 8,21], "Q"),
  poly([8,15, 48,15, 48,20, 43,20, 38,27, 33,20, 22,20, 18,25, 14,20, 8,20], "y"),
  poly([8,15, 48,15, 48,17, 8,17], "Y"),
  px(36, 21, "w"), px(16, 21, "w"),

  // steamed bun on top: soft, no sesame
  poly(BUN_TOP, "B"),
  clip(BUN_TOP,
    poly([6,17, 50,17, 50,14, 40,15, 20,15, 6,13], "D"),
    poly([12,7, 19,4, 30,3, 26,5, 18,7, 13,10], "b")),

  // eye and mouth: it is still a fish
  rect(6, 21, 6, 6, "W"), rect(6, 21, 1, 1, "P"), rect(11, 21, 1, 1, "P"), rect(6, 26, 1, 1, "P"), rect(11, 26, 1, 1, "P"),
  rect(7, 23, 3, 3, "e"), px(7, 23, "W"),
  line(2, 28, 7, 29, "Q"))
