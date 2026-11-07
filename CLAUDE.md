# fisch.ing – Regeln

## Werkzeuge: immer benutzen

- **Pixelgrafik:** Vor jedem neuen oder geänderten Sprite, Icon, Requisit, jeder Welt oder Kulisse den Skill `pxl` laden und die Grafik damit zeichnen. Ausnahme: Bilder, die der Nutzer selbst liefert.
- **Alles Sichtbare:** Vor jeder Arbeit an Oberfläche, HUD, Modals, Layout, Seiten oder CSS die Skills `impeccable:impeccable` und `ui-ux-pro-max:ui-ux-pro-max` laden und danach arbeiten. Der Abschnitt „Design“ unten geht ihren Vorschlägen vor.
- Fehlt ein Skill in der Sitzung, das dem Nutzer sagen und nicht stillschweigend ohne ihn weitermachen.

## Regeln

- **Keine Geheimnisse im Repo:** keine Zugangsdaten, Tokens, Redis-URLs oder E-Mail-Adressen in Code, Doku, Commits oder PRs. Umgebungsvariablen nur mit Namen nennen.
- **Neue Fische bekommen keine eigene Seite.** Keine `seiten/<name>.html` anlegen und im `FISH`-Eintrag kein `page` setzen. Die vorhandenen Fischseiten bleiben, der Fischdex verlinkt sie weiter.
- **Ordner:** Bilder in `img/`, Töne in `sounds/`, Schriften in `fonts/`, Stylesheets in `css/`, Skripte in `js/`, Unterseiten in `seiten/`, Nachschlagewerke in `docs/`. Im Hauptordner bleiben nur `fischen.html`, `datenschutz.html`, `apple-touch-icon.png`, `vercel.json`, `api/` und die Doku. Wird eine Datei verschoben oder umbenannt, kommt in `vercel.json` eine Weiterleitung von der alten Adresse dazu.
- **Sprachen:** Texte im Spiel werden auf Deutsch geschrieben und mit `tr('…')` markiert; die englische Fassung kommt in `js/fischen-i18n.js`.
- **Datenschutz:** Spielstand-Felder, die neu im `localStorage` oder auf dem Server landen, müssen in `datenschutz.html` (Abschnitte 5–8) erwähnt werden.
- **Patch Notes:** Jedes Update, das Spieler im Spiel bemerken, bekommt Einträge wie im Rezept „Update für Spieler“. Sie erscheinen als neue Ausgabe der Steg-Zeitung am Steg.

## Projekt in Kürze

- Statische Seite ohne Build-Schritt und ohne npm-Pakete, gehostet auf Vercel (Framework „Other“). `/` liefert per Rewrite das Spiel (`fischen.html`). Die alte Startseite ist `seiten/alte-seite.html`, im Spiel erreichbar über den versunkenen Computer (`PC_ALT`).
- `api/*.js` sind Handler im Stil von Vercel Functions (Node, CommonJS). Sie laufen auf einem eigenen Server unter `api.fisch.ing` und sprechen dort Redis über eine Upstash-kompatible REST-Pipeline an (`fetch` auf `${URL}/pipeline`). Neue Commits auf `main` werden dort automatisch ausgerollt; Vercel leitet `/api/*` für alte Tabs dorthin um.
- Der Client ruft die API live direkt auf `https://api.fisch.ing` auf (`API_BASE` in `js/fischen.js`, `API` in `js/admin.js`), lokal auf demselben Origin.
- Umgebungsvariablen: `KV_REST_API_URL`/`KV_REST_API_TOKEN` oder `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, optional `ADMIN_TOKEN`.
- Das Spiel besteht aus `fischen.html` (alle Modals als statisches HTML), `css/fischen.css`, `js/fischen-i18n.js` (Wörterbuch und `I18N.tr`, wird zuerst geladen) und `js/fischen.js` (eine große IIFE).
- Neue Versionen erkennt das Spiel selbst über die ETags und lädt sie in einem ruhigen Moment neu. Es gibt nichts zu cachen oder zu versionieren.

## Nachschlagen

Vor der Arbeit am jeweiligen Bereich lesen, nicht auswendig annehmen:

- **`docs/spiel.md`:** Aufbau von `js/fischen.js`: Datenlisten, Spielstand, Zustände, Maps, Sonneninsel, Fang-Ablauf, Wirtschaft, Lobby, Test-Hooks.
- **`docs/server.md`:** die einzelnen Dateien in `api/` mit Schlüsseln, Grenzen und Sicherheitsregeln.
- **Skill `pxl`:** alles zu Grafik, Rendern, Welten, Sportszenen und Inselkarte.

## Rezepte

- **Neuer Fisch:**
  1. Sprite nach `img/` (mit `pxl` oder ein Bild des Nutzers).
  2. `FISH`-Eintrag (`id`, `name`, `img`, `r`, `min`/`max`, `val`, `say`, `desc`, optional `pixel`/`photo`/`whole` (Foto nicht beschneiden)/`map`/`weather`/`night`/`far`/`needs`, Fangbedingungen `bait`/`hours`/`crits`/`minRod`).
  3. EN-Texte für `name`, `say` und `desc`.
  4. Falls sinnvoll: Dex-Hinweis, Patch Notes, README.
- **Neues Laden-Item, neue Kosmetik oder neues Talent:**
  1. Eintrag in `RODS`/`BAITS`/`SNACKS`/`COSMETICS`/`PERKS` (mit `lvl`/`reb` für Sperren).
  2. Ein Icon über `ICONS` (`ROD_COLORS`, `BAIT_ART`, Kosmetik-Paletten `col`).
  3. Die Wirkung an der passenden Stelle einbauen (`pickFish`, `land()`/`waitT`, `land_catch`, `coinMult`).
  4. EN-Texte.
- **Neues Save-Feld:**
  1. Fallback beim Lesen (`save.x || 0`, Typprüfung bei Objekten).
  2. Eintrag in `datenschutz.html` Abschnitt 5.
  3. Falls es bei der Wiedergeburt zurückgesetzt werden soll: in `rebirth()` ins `Object.assign`.
- **Neues Modal:**
  1. HTML in `fischen.html` (`class="modal"`, `hidden`, Knopf mit `data-close`).
  2. Die ID in die Liste von `closeModals()` eintragen, sonst lässt es sich nicht schließen und blockiert das Spiel.
  3. Eine Render-Funktion in die Tabelle von `toggleModal()` eintragen.
  4. EN-Texte für den statischen Text.
- **Neues Requisit:** Eintrag in `PROPS` (`id`, `label`, `x`, `y`, `w`, `h`, `draw`, `open`, optional `map`, `show`, `ready`). Auf Überschneidung mit anderen Hitboxen achten.
- **Neues Lobby-Feld:** In `lobbyMe()` und `cleanMe()` eintragen und in `datenschutz.html` Abschnitt 8 nennen. Ältere Clients schicken das Feld nicht, die Anzeige muss also ohne es auskommen.
- **Neue Bestenliste:** `BOARDS` auf dem Server, `LB_TABS` und `lbScores()` im Client, `datenschutz.html` Abschnitt 6.
- **Neue Sportstation:** `SPORTS`-Eintrag, `STATION_AT` (Ort auf der Karte), EN-Texte für Name, Info, Modi und Stempel, `STAMP_ALL` anpassen.
- **Update für Spieler:**
  1. `PATCH_NOTES`-Eintrag ganz oben in `js/fischen.js` (id `JJJJ-MM-TT-n`, Datum, kurze Stichpunkte auf Deutsch).
  2. EN-Texte in `js/fischen-i18n.js`.
  3. Derselbe Eintrag auf Englisch ganz oben in `CHANGELOG.md`.
  4. README ergänzen.

## Übersetzung

- `tr('Text mit {n}', { n })` mit Platzhaltern in geschweiften Klammern. Zahlen werden mit `toLocaleString(I18N.locale)` formatiert.
- Statischer Text in `fischen.html` wird beim Start über das Wörterbuch übersetzt (TreeWalker). Dieser Text braucht also auch einen Eintrag.
- Fehlertexte vom Server sind deutsch und werden im Client mit `tr(j.error)` übersetzt. Sie gehören also auch ins Wörterbuch.
- Der Schlüssel ist immer der deutsche Text, Buchstabe für Buchstabe. Wer einen Satz ändert, muss auch den Schlüssel im Wörterbuch ändern.

## Design

- Pixel-Look mit eckigen Rahmen und harten Schatten (`0 4px 0 …`), ohne weichen Glow und ohne farbige Leuchtschatten.
- Schriften: Silkscreen nur für kurze Anzeigetexte (Titel, Banner, Rarität), alles, was man liest, in Poppins.
- Farben kommen aus den CSS-Variablen (`--ink`, `--gold`, …).
- Immer auch in Mobilbreite prüfen (390 px). Kein horizontales Scrollen.

## Inhalte und Recht

- Werke anderer sind erlaubt: Marken, Logos, Spielfiguren, Spiele, Bilder und Namen dürfen auf der Seite und im Spiel vorkommen.
- Bilder, GIFs und Namen, die der Nutzer selbst liefert, sind seine Entscheidung.

## Testen

- **Syntax:** `for f in js/fischen.js js/fischen-i18n.js api/*.js; do node --check "$f"; done` (`node --check` prüft nur die erste Datei, die man ihm nennt).
- **Vor jedem Merge:** `gamecheck <Spielordner>` auf dem VPS mit genau dem Stand laufen lassen, der gemergt wird (Docker-Browser, Exit 0 = alles bestanden), und die Screenshots in `/srv/gamecheck/out/` anschauen. Schlägt eine Prüfung fehl, wird nicht gemergt. Nicht abgedeckt: echte API, CSP-Header, Lobby auf zwei Geräten.
- **Im Browser:** Playwright gegen einen lokalen Server, der die Dateien statisch ausliefert und `api/*.js` mit einem Mock der Redis-Pipeline ausführt. Durch das Spiel hilft `window.__fischen`. Screenshots in Desktop- und Mobilbreite anschauen, Fehler auf der Seite (`pageerror`) sammeln.
- **Spielstände vorgeben:** mit `addInitScript` setzen, und zwar vor dem ersten Laden. Ein `localStorage.setItem` mit anschließendem `reload` wird vom `pagehide`-Speichern überschrieben.
- **Übersetzung:** Jeder `tr('…')`-Schlüssel muss im `EN`-Objekt stehen. Am einfachsten prüft man das mit einem kleinen Node-Skript, das beide Dateien per Regex vergleicht. Bewusste Ausnahmen: Eigennamen wie Karpador.
- **Ehrlich berichten:** sagen, was nicht in einem echten Browser oder nicht gegen den echten Server getestet wurde.

## Git

- Arbeiten auf dem zugewiesenen Arbeitszweig.
- Ein Draft-PR pro Update, gemergt wird nur auf ausdrückliches „merge“.
- Keine Modellnamen oder Modell-IDs in Commits, PRs oder Code.
- Kein `merge=union`: Es verwirft gleiche schließende Zeilen ohne Warnung. Mehrere Merges nacheinander stoppen bei der ersten fehlgeschlagenen Prüfung.
