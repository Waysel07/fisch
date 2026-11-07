# Aufbau von `js/fischen.js`

Die Datei ist lang. Am besten sucht man nach den Namen unten statt nach Zeilennummern. Grafik steht im Skill `pxl` (`.claude/skills/pxl/SKILL.md`).

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
  | `sdrill` | Fang-Drill (Sport-Minispiel im Modal `#sport`) |

  Die Sportstationen der Sonneninsel sind kein eigener `state`: Sie laufen im Modal `#sport` (`sportPlaying()`, `sportTick(dt)` aus `frame()`), das Angeln steht so lange still. Das Modal nutzt denselben Slot-Look wie die übrigen Karten (`.sport-card`, `.sport-mode`, `.sport-stamps li` auf `var(--slot)`); Stationen lassen sich auch auf der Minikarte antippen (`sportMiniMap`). Der Knopf `#sport-stop` („Beenden & werten“) setzt `g.over`, die Runde wird dann mit den bisherigen Punkten gewertet; `score(g)` muss deshalb jederzeit einen gültigen Zwischenstand liefern.

  `update(dt)` schaltet diese Zustände um, `draw()` zeichnet sie. Modals sperren je nach Zustand (`toggleModal`).
- **Welt und Zeichnen:**
  - Leinwand 384×216 (`W`, `H`), wichtige Höhen sind `HORIZON`, `SURFACE` und `DOCK_Y`.
  - Helfer:
    - `px(x, y, w, h, Farbe)` zeichnet auf das halbe Pixel gerundet (`snap`);
    - `bake()` erzeugt Sprites aus Zeichen-Rastern;
    - `iconCanvas()` erzeugt 16×16-Icons für den Laden (`ICONS[id]`).
  - Requisiten am Steg, auf See und in der Glutgrotte stehen in `PROPS` (Feld `map`: `steg`, `see`, `lava` oder `all`; Filter `propOn`).
  - Maps: `steg`, `see` (ab 3× Wiedergeburt, `seaOpen()`), `lava` (Glutgrotte ab 1× Prestige, `lavaOpen()`, `inLava()`) und `insel` (Sonneninsel ab 3× Prestige, siehe unten). In der Grotte gibt es kein Wetter (`CAVE_WX`), und nur Ruten mit `lava: true` funktionieren dort (`save.lavaRod`). Fortschritt dort: Glutsteine (`save.glut`) und Tiefen (`CAVE_DEPTHS`, `caveDepth()`; beide fallen bei Wiedergeburt und Prestige zurück, Feld `depth` an Fischen und Ruten), Glimms Werkstatt (`GLUT_UPS`, `glutUp()`) und Glimms Aufträge (`save.glimmQ`); der Taler-Bonus läuft über `caveMult()`. Der Lava-Laden (`lavaWares()`, Shop-Modus `lava`) gibt es nur in der Grotte (Stand `lavashop`, dort öffnet auch L den Lava-Laden, ohne Tabs). Er verkauft alles mit Feld `glut` nur gegen Glutsteine, Ruten ohne `glut` (Basaltrute) gegen Taler; Glutsteine werden nie in Taler getauscht. Lava-Kreaturen (`CREATURES`, `save.crit`): Beim Anbiss in der Grotte würfelt `hook()` mit `critChance()` (Feld `kc` an Lavaruten und Lava-Ködern, Werkstatt `lockruf`) und startet dann statt eines Fisches einen Kampf im Zustand `crit` (`startCrit`/`updateCrit`/`critWin`; nutzt `#boss-hud` mit Klasse `crit`).
- **Sonneninsel** (Map `insel`, ab 3× Prestige, `inselOpen()`, `onInsel()`; nichts davon wird je zurückgesetzt außer `save.turnier`):
  - Blackjack beim Kartenhai (Requisit `kartenhai`, Modal `#bj`, Zustand `bj`, Regeln in `bjPayout`): läuft nur im Client und speichert keine laufende Hand. `calm()` lädt währenddessen nicht neu. Test-Hook: `bjState`, feste Karten über `bjState.force`.
  - Buchten `INSEL_BAYS` öffnen mit Stempeln (`inselBay()`), Fische mit `map: 'insel', bay: n`; Taler-Bonus beim Fang über `inselMult()`.
  - Sportstationen in `SPORTS`: `{ id, icon, name, st, modes, info, exp: [fn, fn], med: [[b, s, g], [b, s, g]], champ, stamps: [[id, text, ok]], start(g), update(g, dt, I), draw(g), score(g) }`, optional `fishing` (Angelturnier) und `mode2` (Nachtflug). Gezeichnet wird auf `#sport-cv` mit `sq`/`sdisc`/`stext`; Figuren mit `sme(x, fußY, frame)` (die eigene Spielfigur im eigenen Look) und `sart(name, x, y)` (Raster `ART.sp_*` aus `img/pxl/code.px.js`, Buchstaben h H l / c C y / s S werden in den Look umgefärbt, `lookPal()`).
  - Können `save.sport[id].lv` (0–2500, Klassen 0/500/1000/1500/2500, Stufen ab `SP_MIN`; pro Runde ±(Ergebnis/`exp` − 1)·60 plus `SP_MEDAL_LV`·Medaille, mal `SP_DM`), Stempel `save.stamps` (`STAMP_ALL` = 45, Duell ab `CHAMP_ST`), Aussichtspunkte `save.ipoints` (`IPOINTS` aus `LANDMARKS`/`NIGHT_MARKS`), Pokale `save.trophies`, Tageslimit `save.sportDay`. Dauerhafte Boni über `sportBonus()` in `collectMult`.
  - Spielgefühl: Alle Stationen teilen eine Effekt-Schicht `SJ` (`burst(x, y, farben)`, `spop(text, x, y)`, `shake(n)`, `sflash(farbe)`), die `sportTick` über die Szene zeichnet; Treffer sollten sie nutzen. Das Feld `ctl` (kurze Steuerzeile, läuft durch `trAll`) erscheint im Countdown.
  - Eine neue Station braucht: `SPORTS`-Eintrag, `STATION_AT` (Ort auf der Karte), EN-Texte für Name, Info, Modi und Stempel, und `STAMP_ALL` anpassen.
- **Fang-Ablauf:**
  - `pickFish()` wählt nach Gewichten, Glück, Wurfweite, Nacht, Wetter und Map.
  - `hook()` würfelt die Größe (`rollSize`/`sizeIn`).
  - Es folgt der Drill (`reel`), ein Taktdrill (`startRhythm`) oder ab der Sonneninsel bei seltenen und besseren Bissen ein Fang-Drill (`SPORT_DRILLS`, `startDrill`, Zustand `sdrill`): eine kurze Runde einer offenen Sportstation im Modal `#sport`. Er ändert weder Können noch Stempel; `sportFinish()` ruft für ihn `drillEnd()` auf.
  - `land_catch()` schreibt Dex, Taler und Mutationen und ruft dann auf:
    - `checkMastery()` und `progressCatch()` (EP und Aufträge);
    - `showCatch()` mit der Fanfare.
- **Wirtschaft:**
  - `coinMult()` bündelt alle dauerhaften Taler-Boni.
  - Alle Laden-Ausgaben laufen über `spend(n)`; das zählt für die Bestenliste „Ausgegeben“. Einsätze am Automaten laufen nicht darüber.
  - Zeit-Buffs prüft `buffOn(id)` (Werte in `save.buffs`).
  - `rod()` liefert die geschmiedete Rute (`forged()`, `save.forge`); `bait()` liefert den aktuellen Köder.
  - Spätes Spiel: Prestige-Leiter `presReb()` (7, 6, 5, 5, 5, dann alle drei Prestige eine mehr bis 10; `rebirthLvl()` +2 Level pro Prestige); Schätze `TREASURES` (einmal kaufen, bleiben für immer, Abfrage `hasT(id)`); die Glutschmiede (ab `FORGE_TALER` = +15 kostet jede Stufe zusätzlich `forgeGlut(k)` Glutsteine, bis `FORGE_MAX`); Odfisch-Stufen `bossStage()` nach Siegen (`BOSS_STAGES`, Lobby-Feld `bs`).
  - Titel: Einträge in `DEX_REWARDS` mit Feld `title`. Getragen wird `save.title` (ID der Belohnung, `myTitle()`), in der Lobby als Feld `ti`.
- **Zeit und Wetter** sind deterministisch aus der echten Uhr (`worldTime`, `weatherAt(slot)`, `WEATHER_LEN`). Sie sind für alle Spieler gleich, ohne Server. `currentWeather()` passt sie je Map an: kein Wetter in der Grotte (`CAVE_WX`), auf der Sonneninsel wird Schnee zur Hitzewelle.
- **Lobby:**
  - `lobbyTick()` läuft jede Sekunde und ruft `lobbySync()` auf, wenn sich `lobbyMe()` geändert hat oder etwas zu senden ist, sonst alle 3 s. Im Bossfight synct die Spielschleife alle 1,5 s.
  - `lobbyStream()` hält den Live-Stream offen, `lobbyPush()` wendet dessen Nachrichten an. Der Server (`publish` in `api/lobby.js`) hält die Streams im Speicher, die API darf also nur als ein Prozess laufen. Ohne Stream funktioniert die Lobby weiter, nur langsamer.
  - `lobbyMe()` ist alles, was andere von dir sehen.
  - Boss: `summonBoss`, `bossHit`, `bossFromServer`, `bossWin`. Im Solo-Kampf läuft alles im Client, in der Lobby liegen die HP auf dem Server.
- **Test-Hooks** liegen in `window.__fischen`, aber nur auf localhost (oder mit `?debug`, dann wird der Spielstand als `tampered` markiert). Spielstände tragen eine Prüfsumme `sig` (`signSave`); wer eine Migration oder ein Feld ändert, muss nichts tun, solange er über `persist()` speichert. Beispiele:
  - `save` direkt ändern;
  - fangen: `landCls(id, klasse)`, `pick()`;
  - Welt: `setTime(0–1)`, `setWeather(id)`, `travel('see')`;
  - Boss: `bossSolo()`, `bossHit(n)`; Lava-Kreatur: `crit()`, `critState`, `critChance()`;
  - Sport: `sport(id, modus, stufe)`, `sportOver()`, `sportG`;
  - erzwingen: `forceShiny`, `forceMut`, `forceSlot = ['odfisch', 'odfisch', 'odfisch']`.
