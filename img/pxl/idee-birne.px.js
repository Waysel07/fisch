// Quelle fuer das Werkzeug claude-pxl. Das Raster `idee_birne` steht im Block ART in js/fischen.js.
// Ideenhut: Gluehbirne, die im Spiel auf dem Hut sitzt. Nur `idee_birne` geht ins Spiel.
pal({
  k: "#1b1f2e",                                   // same outline as the player sprite
  y: "#fde047", Y: "#f59e0b", w: "#fffbe6",       // glass: gold, shade, highlight
  g: "#cbd5e1", G: "#64748b",                     // screw base
  h: "#4338ca", H: "#312e81", l: "#a5b4fc",       // the indigo hat
  s: "#f2c9a0", S: "#d9a47a", B: "#7c4a24", e: "#0f172a",
})

// left half, mirrored; the outline grows it to 8×11
sprite("idee_birne", { mx: true, outline: "k" }, `
  .wy
  wwy
  wyy
  yyy
  Yyy
  .Yy
  .Gg
  .gg
  .Gg`)

// hat rows copied from the player sprite, to judge fit
sprite("_kopf", `
........kkkkkk........
......kkhlllhhkk......
.....khhlllhhhhhk.....
.....khhllhhhhhHk.....
.....khhhhhhhhHHk.....
.....kHHHHHHHHHHk.....
...kkkHHHHHHHHHHkkk...
..kHHHHHHHHHHHHHHHHk..
...kkkkkkkkkkkkkkkk...
.....kBBSsssssssk.....
.....kBBSssssewsk.....
.....kBSSssssessrk....
.....kBSssssssssrk....`.replace(/r/g, "S"))

scene("vorschau", { w: 34, h: 28, bg: "#1e293b" },
  stamp("_kopf", 6, 14),
  stamp("idee_birne", 13, 4))
