---
name: pxl
description: Pixelgrafik für „Fischen!“ mit der pxl-DSL in img/pxl/ zeichnen und rendern. Immer benutzen, bevor ein Sprite, Fisch, Icon, Requisit, eine Figur, Welt, Sportkulisse oder Karte entsteht oder geändert wird.
---

# pxl: Pixelgrafik für „Fischen!“

Eigene Grafik entsteht immer als Code in `img/pxl/` und wird ohne npm gerendert. Das Spiel lädt diese Quellen nicht. Bilder, die der Nutzer liefert, kommen unverändert nach `img/`.

Nach dem Rendern das Ergebnis immer ansehen: auf dem echten Hintergrund, bei Tag und bei Nacht.

## Rendern

| Befehl | Quelle | Ergebnis |
|---|---|---|
| `node img/pxl/render.js fisch <name …>` | `fisch.px.js` | `img/<name>.png` (Fische, Kreaturen, Figuren) |
| `node img/pxl/render.js code <name …>` | `code.px.js` | Raster im `ART`-Block von `js/fischen.js` |
| `node img/pxl/render.js welt [name …]` | `welt.px.js` | `img/welt-*.png`, 768×432 |
| `node img/pxl/render.js sport` | `sport.px.js` | `img/sport-<station>.png`, 768×432, und die Inselkarten |

Das Spiel rechnet in 384×216 (`W`, `H`), die Leinwand ist doppelt so fein. Ein Pixel im Raster ist also ein halbes Welt-Pixel.

## Sprites (`code.px.js`, `fisch.px.js`)

- `S(name, W, H, fn, outline = true, keys, lit)`: Koordinaten meinen immer das fertige Bild inklusive Umriss. `keys` legt die Buchstaben fest. `lit` gibt Licht wie bei den Inselfischen; gelichtete Raster brauchen viele Zeichen, das Skript nimmt dann auch Sonderzeichen.
- `G(name, zeilen, farben)`: Sprite direkt aus Zeichenzeilen.
- `lit: true` am `F(…)`: Glanz, Kernschatten und getönter Umriss (`light()`/`selout()` aus `render.js`), `dither: true` für große flache Flächen. Die Sonneninsel nutzt das.
- Helfer in `render.js`: `spec(c, x, y)` (Glanzpunkt) und `ramp(farbe)` (Farbtreppe hell → tief).

## Ins Spiel einbauen

- `bake()` erzeugt Sprites aus den Zeichen-Rastern, `drawArt(name, x, y, dark)` zeichnet einen `ART`-Eintrag samt Nachtton.
- `drawLit(bild, x, y, dark)` zeichnet Requisiten, die nachts dunkler werden sollen (z. B. Bealins Boot `ART.bealin_boat`, der Inselflieger `ART.plane`, die Strandbude `ART.beachhut`).
- `iconCanvas()` erzeugt 16×16-Icons für den Laden (`ICONS[id]`).
- Coach Pelle ist ein Sprite (`ART.pelle_0/1`, Flug `ART.pelle_fly_0/1`). `drawPelle(P, …)` zeichnet ihn am Steg mit `drawLit` und in den Sportszenen (`P === sq`) direkt auf `#sport-cv`.
- In den Sportszenen werden die Buchstaben h H l / c C y / s S der Raster `ART.sp_*` in den Look des Spielers umgefärbt (`lookPal()`).

## Welten (`welt.px.js`)

- Die Welten sind gemalte Bilder (`img/welt-*.png`). `art()` aus `maler.inc.js` rendert 1:1 in 768×432.
- Die fünf Buchten der Sonneninsel stehen dort in `BAYS` (Kulisse über Wasser, `f.mir` = Bereich der Spiegelung), Riff und Grund malt die Schleife darunter. Links bleibt Platz für den Steg, rechts an der Wasserlinie für den Inselflieger.
- `renderBg` tönt sie je nach Tageszeit, Bewegtes kommt aus `drawWorldFx`, die Schatten der Fische aus `drawShadows` (Masken in `img/welt-schatten.png`).
- `welt.px.js` und `sport.px.js` teilen sich das Malwerkzeug aus `img/pxl/maler.inc.js` (`FB`, `bands`, `ridge`, `rock`, `palm` …). `render.js` lädt es für Quellen mit der Zeile `'use maler'`.

## Sportszenen (`sport.px.js`)

- Im Spiel zeichnet `sceneBg(name, horizont)` bzw. `sportBg(name)` die Kulissen, darüber laufen Wolken und Glitzern aus `skyFx(horizont)`.
- Solange ein Bild lädt, malen `skySea(horizont)`, `sand(y)` und `palm(x, fuß, höhe, neigung)` den alten Ersatz.
- `litEll(key, rx, ry, rampen, pick)`/`sspr` zeichnen gelichtete Bälle, Pins, Bojen und Ballons (`BALLS`, `sballoon`, `drawTarget`).
- `sfan`/`crowd(g, x0, x1, fuß, punkte)` zeichnen jubelnde Zuschauer (`ART.sp_fan_0/1`, je Platz umgefärbt), `skyLife` Möwen und Segler, `shud` HUD-Zeilen auf dunklem Grund.

## Inselkarte und Rundflug (`sport.px.js`)

- Die Inselkarte (Pelles Minikarte, Ersatz im Rundflug) ist `img/insel-karte.png` (1152×648) bzw. `insel-karte-mini.png`.
- Der Rundflug fliegt über `img/insel-flug.png` (2304×1296, gleiche Insel in doppelter Auflösung: `paintMap(f, 2, true, new Up2(f))`, Gelände/Kronen/Palmen fein, Orte über `Up2`, Kleinkram aus `fineDetail`, Boote nur im Spiel).
- Bewegtes im Flug zeichnet `flWorld` (Brandung, Boote, Autos, Vögel, Delfine, Wale, Rauch, Wolkenschatten), das Flugzeug `planeSprite` (64 Richtungen), die Ecke `flMini`, nachts `flLights` (Fenster `#3d6ea8` aus dem Bild).
- Alles ist mit derselben Geometrie gemalt wie `isleR`/`isleAt`/`LANDMARKS`. Wer die im Spiel ändert, muss sie in `sport.px.js` mitändern.
- Zwischen den Aussichtspunkten liegen Orte aus `areas()` (Hafenstadt am Strandplatz, Ferienanlage, Flugplatz, Stadion, Felder, Lavarinne, Küste). Sie müssen frei von `MARKS` bleiben (`nearMark`), `miniAreas()` übernimmt sie verkleinert.
- Winkel um die Insel immer von −π bis π laufen lassen (`coastAt(a, k)`), sonst wird `isleR` negativ.
