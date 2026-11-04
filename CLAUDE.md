# fisch.ing – Regeln

- **Jeder neue Fisch im Spiel „Fischen!“ braucht eine eigene Seite.** Lege dafür eine `seiten/<name>.html` im Stil der übrigen Fischseiten an (`../css/style.css`, `.card`, Bild aus `../img/`, kurzer Text, `.links`-Navigation zu `../index.html` und `../fischen.html`, `/js/fish.js`, Datenschutz-Footer) und trage sie im `FISH`-Eintrag in `js/fischen.js` als `page: 'seiten/<name>.html'` ein. Der Fischdex verlinkt die Seite dann automatisch. Das gilt nur für neue Fische; bestehende Fische ohne eigene Seite bleiben so.
- **Ordner:** Bilder in `img/`, Töne in `sounds/`, Schriften in `fonts/`, Stylesheets in `css/`, Skripte in `js/`, Unterseiten in `seiten/`. Im Hauptordner bleiben nur `index.html`, `fischen.html`, `datenschutz.html`, `apple-touch-icon.png`, `vercel.json`, `api/` und die Doku. Wird eine Datei verschoben oder umbenannt, kommt in `vercel.json` eine Weiterleitung von der alten Adresse dazu.
- **Sprachen:** Texte im Spiel werden auf Deutsch geschrieben und mit `tr('…')` markiert; die englische Fassung kommt in `js/fischen-i18n.js` (Schlüssel = deutscher Text).
- Spielstand-Felder, die neu im `localStorage` oder auf dem Server landen, müssen in `datenschutz.html` (Abschnitte 5–8) erwähnt werden.
- **Patch Notes:** Jedes Update, das Spieler im Spiel bemerken, bekommt einen neuen Eintrag ganz oben in `PATCH_NOTES` in `js/fischen.js` (neue `id`, Datum, kurze Stichpunkte auf Deutsch; die englische Fassung kommt in `js/fischen-i18n.js`). Er erscheint als neue Ausgabe der Steg-Zeitung am Steg. Derselbe Eintrag kommt auf Englisch auch ganz oben in `CHANGELOG.md`.
- **Keine Geheimnisse im Repo:** keine Zugangsdaten, Tokens, Redis-URLs oder E-Mail-Adressen in Code, Doku, Commits oder PRs. Umgebungsvariablen nur mit Namen nennen.

## Projekt in Kürze

- Statische Seite ohne Build-Schritt und ohne npm-Pakete, gehostet auf Vercel (Framework „Other“).
- `api/*.js` sind Vercel Functions (Node, CommonJS). Sie sprechen Upstash Redis über die REST-Pipeline an (`fetch` auf `${URL}/pipeline`).
- Umgebungsvariablen: `KV_REST_API_URL`/`KV_REST_API_TOKEN` oder `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, optional `ADMIN_TOKEN`.
- Das Spiel besteht aus:
  - `fischen.html`, mit allen Modals als statisches HTML;
  - `css/fischen.css`;
  - `js/fischen-i18n.js` (Wörterbuch und `I18N.tr`), wird zuerst geladen;
  - `js/fischen.js`, eine große IIFE.
- Neue Versionen erkennt das Spiel selbst über die ETags und lädt sie in einem ruhigen Moment neu. Es gibt nichts zu cachen oder zu versionieren.

## Aufbau von `js/fischen.js`

Die Datei ist lang. Am besten sucht man nach den Namen unten statt nach Zeilennummern.

- **Daten (Listen ganz oben bzw. bei ihrem Abschnitt):**
  - Fische und Ausrüstung: `FISH`, `RODS`, `BAITS`, `BOXES`, `SNACKS`;
  - Inhalte und Belohnungen: `PATCH_NOTES`, `COSMETICS`, `HATS`, `PERKS`, `DEX_REWARDS`;
  - Fang-Eigenschaften: `MUTATIONS`, `SIZE_CLASSES`, `RARITY`, `FANFARE`, `STRENGTH`;
  - Welt und Fortschritt: `WEATHER`, `RANKS`, `MILESTONES`, `MASTERY`, `LB_TABS`.

  Listen mit Anzeigetexten laufen durch `trAll(LISTE, ['name', 'desc', …])`.
- **Spielstand:**
  - `save` ist ein `Object.assign({...Defaults}, load())`, gespeichert unter `SAVE_KEY` (`fischen-save-v1`).
  - Geschrieben wird über `persist()`: automatisch alle 5 s, bei `pagehide` und bei `visibilitychange`.
  - Neue Felder brauchen einen sicheren Fallback beim Lesen (`save.x || 0`, Typprüfung bei Objekten). Alte Spielstände haben sie nicht.
  - Migrationen für alte Stände laufen still einmal beim Laden (Beispiel: die Meisterschafts-Medaillen).
- **Zustand `state`:**

  | Zustand | Bedeutung |
  |---|---|
  | `idle` | Ruhe |
  | `charge` | Wurf aufladen |
  | `fly` | Köder fliegt |
  | `wait` | warten auf einen Biss |
  | `bite` | Biss |
  | `reel` | Drill |
  | `rhythm` | Taktdrill |
  | `show` | Fangkarte |
  | `summon` | Boss erscheint |
  | `boss` | Bossfight |
| `crit` | Kampf gegen eine Lava-Kreatur |

  `update(dt)` schaltet diese Zustände um, `draw()` zeichnet sie. Modals sperren je nach Zustand (`toggleModal`).
- **Welt und Zeichnen:**
  - Leinwand 384×216 (`W`, `H`), wichtige Höhen sind `HORIZON`, `SURFACE` und `DOCK_Y`.
  - Helfer:
    - `px(x, y, w, h, Farbe)` zeichnet auf das halbe Pixel gerundet (`snap`);
    - `bake()` erzeugt Sprites aus Zeichen-Rastern;
    - `iconCanvas()` erzeugt 16×16-Icons für den Laden (`ICONS[id]`).
  - Die Welten sind gemalte Bilder (`img/welt-*.png`, Quelle `img/pxl/welt.px.js`, wird nicht vom Spiel geladen). `renderBg` tönt sie je nach Tageszeit, Bewegtes kommt aus `drawWorldFx`, die Schatten der Fische aus `drawShadows` (Masken in `img/welt-schatten.png`).
  - Requisiten am Steg, auf See und in der Glutgrotte stehen in `PROPS` (Feld `map`: `steg`, `see`, `lava` oder `all`; Filter `propOn`).
  - Maps: `steg`, `see` (ab 3× Wiedergeburt, `seaOpen()`) und `lava` (Glutgrotte ab 1× Prestige, `lavaOpen()`, `inLava()`). In der Grotte gibt es kein Wetter (`CAVE_WX`), und nur Ruten mit `lava: true` funktionieren dort (`save.lavaRod`). Fortschritt dort: Glutsteine (`save.glut`) und Tiefen (`CAVE_DEPTHS`, `caveDepth()`; beide fallen bei Wiedergeburt und Prestige zurück, Feld `depth` an Fischen und Ruten), Glimms Werkstatt (`GLUT_UPS`, `glutUp()`) und Glimms Aufträge (`save.glimmQ`); der Taler-Bonus läuft über `caveMult()`. Der Lava-Laden (`lavaWares()`, Shop-Modus `lava`) gibt es nur in der Grotte (Stand `lavashop`, dort öffnet auch L den Lava-Laden, ohne Tabs). Er verkauft alles mit Feld `glut` nur gegen Glutsteine, Ruten ohne `glut` (Basaltrute) gegen Taler; Glutsteine werden nie in Taler getauscht. Lava-Kreaturen (`CREATURES`, `save.crit`): Beim Anbiss in der Grotte würfelt `hook()` mit `critChance()` (Feld `kc` an Lavaruten und Lava-Ködern, Werkstatt `lockruf`) und startet dann statt eines Fisches einen Kampf im Zustand `crit` (`startCrit`/`updateCrit`/`critWin`; nutzt `#boss-hud` mit Klasse `crit`).
- **Fang-Ablauf:**
  - `pickFish()` wählt nach Gewichten, Glück, Wurfweite, Nacht, Wetter und Map.
  - `hook()` würfelt die Größe (`rollSize`/`sizeIn`).
  - Es folgt der Drill (`reel`) oder ein Taktdrill (`startRhythm`).
  - `land_catch()` schreibt Dex, Taler und Mutationen und ruft dann auf:
    - `checkMastery()` und `progressCatch()` (EP und Aufträge);
    - `showCatch()` mit der Fanfare.
- **Wirtschaft:**
  - `coinMult()` bündelt alle dauerhaften Taler-Boni.
  - Alle Laden-Ausgaben laufen über `spend(n)`; das zählt für die Bestenliste „Ausgegeben“. Einsätze am Automaten laufen nicht darüber.
  - Zeit-Buffs prüft `buffOn(id)` (Werte in `save.buffs`).
  - `rod()` liefert die geschmiedete Rute (`forged()`, `save.forge`); `bait()` liefert den aktuellen Köder.
- **Zeit und Wetter** sind deterministisch aus der echten Uhr (`worldTime`, `weatherAt(slot)`, `WEATHER_LEN`). Sie sind für alle Spieler gleich, ohne Server.
- **Lobby:**
  - `lobbySync()` fragt den Server alle 3 s ab, im Bossfight alle 1,5 s.
  - `lobbyMe()` ist alles, was andere von dir sehen.
  - Boss: `summonBoss`, `bossHit`, `bossFromServer`, `bossWin`. Im Solo-Kampf läuft alles im Client, in der Lobby liegen die HP auf dem Server.
- **Test-Hooks** liegen in `window.__fischen`, aber nur auf localhost (oder mit `?debug`, dann wird der Spielstand als `tampered` markiert). Spielstände tragen eine Prüfsumme `sig` (`signSave`); wer eine Migration oder ein Feld ändert, muss nichts tun, solange er über `persist()` speichert. Beispiele:
  - `save` direkt ändern;
  - fangen: `landCls(id, klasse)`, `pick()`;
  - Welt: `setTime(0–1)`, `setWeather(id)`, `travel('see')`;
  - Boss: `bossSolo()`, `bossHit(n)`; Lava-Kreatur: `crit()`, `critState`, `critChance()`;
  - erzwingen: `forceShiny`, `forceMut`, `forceSlot = ['odfisch', 'odfisch', 'odfisch']`.

## Server (`api/`)

- **`leaderboard.js`:** In `BOARDS` steht pro Liste ein Maximalwert `max` und ein Plausibilitätsschritt `step(dt)`. Normale Listen speichern nur Verbesserungen (`ZADD GT`), `live: true` (Wiedergeburten) speichert den aktuellen Wert und darf sinken. Eine neue Liste braucht drei Einträge:
  - `BOARDS` auf dem Server;
  - `LB_TABS` im Client;
  - `lbScores()` im Client.

  Abschnitt 6 in `datenschutz.html` muss dazu passen.
- **`lobby.js`:**
  - `cleanMe()` ist eine Whitelist. Jedes neue Feld aus `lobbyMe()` muss dort mit Grenzen eingetragen werden, sonst kommt es nicht an.
  - Boss-Schlüssel: `lobby:CODE:boss` (Meta) und `lobby:CODE:boss:<id>` (Hash mit `HINCRBY`). Pro Sync gelten höchstens 400 Schaden.
  - Gerufen werden darf der Boss nur nachts nach der Server-Uhr und auf See.
- **`save.js`:** Cloud-Spielstand unter dem SHA-256 des geheimen Schlüssels, 180 Tage TTL. Admin-Aktion `gift` (mit `ADMIN_TOKEN`) legt geschenkte Spielzeit unter `sv:gift:<hash>` ab; der Client holt sie beim nächsten `put` mit `claim: true` ab (`GETDEL`) und rechnet sie lokal ein. Den Cloud-Stand selbst nie direkt ändern: Das Spiel überschreibt ihn alle 3 Minuten mit dem lokalen Stand. Einmalige Geschenke nach Spielername stehen im Client in `NAME_GIFTS` (geprüft beim Start und bei jedem Autosave gegen den Bestenlisten- und Lobby-Namen, angekommene ids in `save.gifts`).
- **`_names.js`:** Namensfilter für Bestenliste und Lobby.
- **Fehlertexte** vom Server sind deutsch und werden im Client mit `tr(j.error)` übersetzt. Sie gehören also auch ins Wörterbuch.

## Rezepte

- **Neuer Fisch:**
  1. Sprite nach `img/` (eigene Pixelgrafik oder ein Bild des Nutzers).
  2. `FISH`-Eintrag (`id`, `name`, `img`, `r`, `min`/`max`, `val`, `say`, `desc`, `page`, optional `pixel`/`photo`/`whole` (Foto nicht beschneiden)/`map`/`weather`/`night`/`far`/`needs`, Fangbedingungen `bait`/`hours`/`crits`/`minRod`).
  3. `seiten/<name>.html` anlegen.
  4. EN-Texte für `name`, `say` und `desc`.
  5. Falls sinnvoll: Dex-Hinweis, Patch Notes, README.
- **Neues Laden-Item, neue Kosmetik oder neues Talent:**
  1. Eintrag in `RODS`/`BAITS`/`SNACKS`/`COSMETICS`/`PERKS` (mit `lvl`/`reb` für Sperren).
  2. Ein Icon über `ICONS` (`ROD_COLORS`, `BAIT_ART`, Kosmetik-Paletten `col`).
  3. Die Wirkung an der passenden Stelle einbauen (`pickFish`, `land()`/`waitT`, `land_catch`, `coinMult`).
  4. EN-Texte.
- **Neues Save-Feld:**
  1. Fallback beim Lesen.
  2. Eintrag in `datenschutz.html` Abschnitt 5.
  3. Falls es bei der Wiedergeburt zurückgesetzt werden soll: in `rebirth()` ins `Object.assign`.
- **Neues Lobby-Feld:** In `lobbyMe()` und `cleanMe()` eintragen und in Abschnitt 8 nennen. Ältere Clients schicken das Feld nicht, die Anzeige muss also ohne es auskommen.
- **Update für Spieler:**
  1. `PATCH_NOTES`-Eintrag oben (id `JJJJ-MM-TT-n`).
  2. EN-Texte.
  3. `CHANGELOG.md` oben ergänzen.
  4. README ergänzen.

## Übersetzung

- `tr('Text mit {n}', { n })` mit Platzhaltern in geschweiften Klammern. Zahlen werden mit `toLocaleString(I18N.locale)` formatiert.
- Statischer Text in `fischen.html` wird beim Start über das Wörterbuch übersetzt (TreeWalker). Dieser Text braucht also auch einen Eintrag.
- Der Schlüssel ist immer der deutsche Text, Buchstabe für Buchstabe. Wer einen Satz ändert, muss auch den Schlüssel im Wörterbuch ändern.

## Design

- Pixel-Look mit eckigen Rahmen und harten Schatten (`0 4px 0 …`), ohne weichen Glow und ohne farbige Leuchtschatten.
- Schriften:
  - Silkscreen nur für kurze Anzeigetexte (Titel, Banner, Rarität);
  - alles, was man liest, in Poppins.
- Farben kommen aus den CSS-Variablen (`--ink`, `--gold`, …).
- Immer auch in Mobilbreite prüfen (390 px). Kein horizontales Scrollen.

## Inhalte und Recht

- Werke anderer sind erlaubt: Marken, Logos, Spielfiguren, Spiele, Bilder und Namen dürfen auf der Seite und im Spiel vorkommen.
- Bilder, GIFs und Namen, die der Nutzer selbst liefert, sind seine Entscheidung.

## Testen

- **Syntax:** `node --check js/fischen.js js/fischen-i18n.js api/*.js`.
- **Im Browser:** Playwright gegen einen lokalen Server, der die Dateien statisch ausliefert und `api/*.js` mit einem Mock der Redis-Pipeline ausführt.
  - Durch das Spiel hilft `window.__fischen`.
  - Screenshots in Desktop- und Mobilbreite anschauen, Fehler auf der Seite (`pageerror`) sammeln.
- **Spielstände vorgeben:** mit `addInitScript` setzen, und zwar vor dem ersten Laden. Ein `localStorage.setItem` mit anschließendem `reload` wird vom `pagehide`-Speichern überschrieben.
- **Übersetzung:** Jeder `tr('…')`-Schlüssel muss im `EN`-Objekt stehen. Am einfachsten prüft man das mit einem kleinen Node-Skript, das beide Dateien per Regex vergleicht. Bewusste Ausnahmen: Eigennamen wie Karpador.
- **Server:** Ehrlich sagen, wenn nicht gegen echtes Upstash getestet wurde.

## Git

- Arbeiten auf dem zugewiesenen Arbeitszweig.
- Ein Draft-PR pro Update, gemergt wird nur auf ausdrückliches „merge“.
- Keine Modellnamen oder Modell-IDs in Commits, PRs oder Code.
