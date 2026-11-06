# Fisch!

The source of [fisch.ing](https://www.fisch.ing): a small, silly fish website and **Fischen!**, the pixel-art fishing game that grew out of it. It runs in the browser, with no accounts and no install.

**[Play Fischen!](https://www.fisch.ing/fischen.html)** · [Changelog](CHANGELOG.md) · [Project rules (German)](CLAUDE.md)

**Contents**

- [The website](#the-website)
- [The game](#the-game)
- [Progression](#progression)
- [Fishing systems](#fishing-systems)
- [Areas](#areas)
- [Multiplayer and online features](#multiplayer-and-online-features)
- [Interface](#interface)
- [Development](#development)

## The website

A static site with no build step. `index.html` is the home page, and `seiten/` holds one page per fish plus a few extras:

- **`seiten/fish5.html`** has Text to Fisch: the Lippenfisch reads out what you type with the browser's speech synthesis. It uses only an on-device German voice, so the text never leaves the browser. „Fischisch“ is the older fish language made of slices of `sounds/fish.mp3`, and also the fallback on devices without a German voice. The same page has the magische Miesmuschel: ask a question, pull the string, get one of a few fixed answers.
- **`seiten/snake.html`** is a Snake game.

## The game

`fischen.html` is a canvas game. You cast, wait for a bite, keep the line tension in the safe range while you reel, and sell what you land for Taler. The catches are the site's own GIFs and PNGs, plus original pixel sprites and user-supplied images.

Menus are objects on the dock. The old buttons stay hidden for keyboard and screen-reader users.

| On the dock | Opens | Key |
|---|---|---|
| Kiosk, run by Herr Zylinderwels | Shop | L |
| Book on the crate | Fischdex and Shinydex | F |
| Slot machine | Fischautomat | C |
| Notice board | Progress | P |
| Cork board with a light bulb | Ideenbrett (idea board) | I |
| Trophy on the kiosk roof | Leaderboard | B |
| Newspaper bundle | Steg-Zeitung (patch notes) | N |
| Your angler | Wardrobe | K |
| Buoy (Hohe See), Glimm (Glutgrotte) and the seaplane (Sonneninsel) | Travel to another area | |

Other keys: **I** Ideenbrett, **O** lobby, **E** settings, **M** sound, **1–9** bait hotbar, **Enter** or **T** lobby chat.

## Progression

### Currencies

| Currency | Earned from | Spent on | Reset by |
|---|---|---|---|
| Taler | Catches, quests, the slot machine | Gear, snacks, boxes, cosmetics, the forge, Schätze | Rebirth, prestige |
| Schuppen 🐚 | Rebirths, medals, weekly goals, Fischdex rewards, the Odfisch | Talents | Prestige |
| Perlen 🦪 | Prestige (3, plus 2 for every extra rebirth, plus 1 with the Perlenmuschel), weekly goals, one of Glimm's jobs, the Odfisch from stage 3 | Prestige talents | Never |
| Glutsteine 🔥 | Cave catches and creatures, Glimm's jobs, weekly goals | Cave depths, Glimm's workshop, the Lava-Laden, the Glutschmiede | Rebirth, prestige |

Glutsteine can't be turned into Taler.

### Levels, rebirth and prestige

Catches, lost fish, quests and Fischdex rewards give XP toward angler levels, which unlock gear. Catch bonuses add up rather than multiply: catch streaks, clean catches (tension under 70 %), mutations, shinies, night fishing and the first catches of each day. Every 5 levels a milestone gives Schuppen, and every 10 levels a mystery box.

- **Rebirth** is available from level 12, and each one needs 2 more levels, plus 2 more per prestige (`rebirthLvl()`), so the prestige XP bonus doesn't make every run shorter. It gives Schuppen and a permanent +20 % Taler, and resets level, Taler, rods, bait, quests, the forge, Glutsteine and the cave depth. The Fischdex, records and talents stay.
- **Prestige** needs 7 rebirths the first time, then 6, then 5 for prestiges 3–5, and from the 6th one more every three prestiges, at most 10 (`presReb()`). It also resets rebirths, Schuppen and talents. It gives Perlen, a permanent +100 % Taler and +25 % XP. 40 % of the rebirths before it stay in the Taler bonus as an Erbe (`rebHeir`). Ranks count `rebirthsTotal`, so ranks and rebirth cosmetics stay.

| Rebirth | Unlocks |
|---|---|
| 1 | Regenbogenrute |
| 2 | Mondköder |
| 3 | Sternenrute, Hohe See, Odköder |
| 4 | Tiefseerute |
| 5 | Abgrundköder, talents up to level 10, Nachtangler and Bossjäger |
| 6 | Krakenrute |
| 8 | Seebären-Jacke |
| 10 | Fischgott-Krone |

**Ranks** follow total rebirths, from Lehrling to Fischgott and on to Wellenkaiser (13), Ozeanlegende (16), Poseidons Erbe (20) and Ewiger Angler (25). They show in progress, on lobby name tags and on the rebirth leaderboard. Wellenkaiser also unlocks the Wellenkaiser-Krone.

### Talents

| Bought with | Talents |
|---|---|
| Schuppen | Goldener Haken (Taler), Glückspilz (luck), Lockruf (bite speed), Starke Schnur (tension), Anglerwissen (XP), Erbstück (starting Taler), Maßband (size classes), Wetterfrosch (weather bonuses), Nachtangler, Bossjäger |
| Perlen | Perlenhaken (+10 % Taler per level), Perlenglück (+10 % luck per level), Schuppensegen (+20 % Schuppen per level), Frühreif (rebirth one level earlier, up to 5), Seekarte (Hohe See and Odköder without rebirths), Perlenschliff (+2 % Taler per level, no cap, costs 4 + level) |

### Taler bonus

`coinMult()` multiplies three groups, and the boni inside each group are added:

| Group | Contains |
|---|---|
| Path | Rebirths and Erbe × 20 %, +100 % per prestige |
| Talents | Goldener Haken 8 % per level, Perlenhaken 10 % per level, Perlenschliff 2 % per level |
| Collection | Fischdex 10 %, gold medals up to 40 %, diamond medals up to 40 %, Goldener Pokal 5 %, Sonneninsel up to 50 % |

Bait, snacks and mystery boxes cost their base price × √(Taler bonus), so prices keep up with income.

### Goals

- **Quests:** three rotating quests pay Taler and XP.
  - Taler are (30 + 12 × level) × tier × `coinMult()`, and XP is the larger of 20 + 6 × level or a tenth of the level's XP, × tier.
  - Fish and size quests only use `questPool()`: fish in an open area without special conditions (far, weather, bait, hours, needs …). The size target is capped at 80 % of the 5th-biggest fish in that pool.
  - A reroll costs (10 + 2 × level) × √(Taler bonus).
- **Wochenziele:** three bigger goals per week, picked the same for everyone (`week`). How many you need comes from `weekStage()`: start, from 3 rebirths, or from prestige.
  - Each goal gives `weekReward()`: 6 + 3 × stage Schuppen plus 1 per 2 rebirths (up to +12), (800 + 120 × level) × `coinMult()` Taler, a pearl after a prestige, and 40 + 20 × depth Glutsteine once the cave is open.
  - All three in one week add a Goldkiste.
  - Goals: fish, rare, epic, legendary, night, shiny, fish with a mutation, finished quests, Hohe See, Glutgrotte, island catches, new stamps and sport gold medals (the area goals only once the area is open).
- **Fisch-Meisterschaft:** bronze, silver, gold and diamond medals per fish for repeat catches, with thresholds by rarity (`dex[id].m`, `MASTERY`). Medals give XP and Schuppen. Each gold fish adds a permanent +1 % Taler, up to +40 %, and each diamond fish another +1 %, up to +40 %. Ten diamonds unlock the Diamant-Zylinder.
- **Fischdex rewards:** milestones pay Taler, Schuppen and permanent bonuses.
- **Sammlungen:** themed sets in the Fischdex rewards (Alles Spezi, Haifischbecken, Nachtschicht, Alle Wetter, Schrottplatz, Feuerfest, 10 Monster, 50 Odfisch wins, Alles in Diamant). Each gives a title for the name tag, picked in the wardrobe (`save.title`) and shown in the lobby.
- **Shinydex:** shows all mutations, caught normally and as shiny (`dex[id].smuts`), with rewards for the first mutated shiny and for all of them.
- **Käpt'n Bealin:** every second chat drops a vague hint about a secret wish, which pays Taler and XP when you happen to fulfil it (`bealin`).

### Spending Taler

- **Rods** (`RODS`):

  | Rod | Taler | Needs |
  |---|---|---|
  | Stock mit Schnur | Free | |
  | Bambusrute | 60 | Level 2 |
  | Carbonrute | 260 | Level 5 |
  | Goldene Rute | 900 | Level 9 |
  | Regenbogenrute | 2 500 | Rebirth 1 |
  | Sternenrute | 15 000 | Rebirth 3 |
  | Tiefseerute | 40 000 | Rebirth 4 |
  | Krakenrute | 120 000 | Rebirth 6 |

- **Rutenschmiede:** forges the rod in hand up to +15 for growing costs (`forge`). Each level adds +3 % reel and luck and −2 % tension. From 1× prestige the **Glutschmiede** goes on to +25 and also costs Glutsteine (25 per step, rising).
- **Bait** (`BAITS`): Spezi-Köder, Glitzerköder, Wii-Köder (Wii fish bite twice as often), Mondköder, Abgrundköder, Odköder. Worms are free and unlimited. Baits come with extra bite speed, and the setting `autoBait` rebuys them when they run out.
- **Snacks** (`SNACKS`): 10 minutes each, stackable to 30, saved as `buffs`.

  | Snack | Effect |
  |---|---|
  | Kaffee | Bites come 30 % faster |
  | Fischbrötchen | +25 % Taler |
  | Kleeblatt-Keks | Rare, epic and legendary fish bite 30 % more often |
  | Glitzerlimo | Double shiny and mutation chance |

- **Schätze** (`TREASURES`, `save.treasures`): one-time buys from 500 000 to 5 million Taler that stay forever, even through prestige: Goldener Pokal (+5 % Taler), Glückskompass (+5 % luck), Ebbe-Sanduhr (5 % faster bites), Goldnetz (+10 % XP) and Perlenmuschel (1 more pearl per prestige, from 2× prestige).
- **Mystery boxes** (`BOXES`): wooden 120, silver 450 (level 4), golden 1 500 (level 8). They are also found on the hook now and then (`boxes`). A box holds Taler, bait, XP, an old sock or a 5× jackpot.
- **Fischautomat:** stakes run from 50 to 2 000, and the cap rises with each rebirth to 5 000, 10 000, 25 000 and 50 000. Half of every stake from every player feeds one shared jackpot pot on the server (`api/jackpot.js`, starts at 1 000; one-time boosts like the 2 000 000 of 06.11.2026 sit in `BOOSTS`). The server decides whether a spin cracks it, at the odds of three Odfische (3/100 per reel); the reels then show three Odfische and pay the whole pot on top of ×150. Online, three Odfische only come from the server; offline, the machine spins locally and pays ×150 without the pot. The machine shows the last winner (leaderboard name only).
- **Cosmetics** (`COSMETICS`, saved as `cosm`): hats, jackets, bobbers and boat skins. Some are sold, some come from achievements, and luxury items are late-game Taler sinks, up to the Sonnenkrone (500 000, prestige 1) and the Galaxiemantel (1 000 000, prestige 2). The wardrobe previews them and offers free skin and hair colours. The boat skin „David Hasselhoff“ (`boot-hoff`, 30 000 Taler, rebirth 3) replaces the boat on the open sea with a giant swimming pixel man. More colours (orange, purple, camo hats; yellow, black, pink raincoats; yellow, purple, white bobbers), the Diamantjacke (75 000) and Diamantpose (60 000) in the shop, and catch rewards for the new content: Vamp-Jacke/Vamp-Hut (Carti fish, 1× and 5×), Schrotthelm (anchor), Schatzpose (chest) and Muschelhut (Magic Conch). The slot machine gives the Jackpot-Jacke for any JACKPOT (×40 or the pot) and the sparkling Jackpot-Hut for the Odfisch pot (counters `cosm.st.jackpot` and `cosm.st.pot`).
- **Codes:** the settings redeem codes (`CODES`, keyed by a checksum, redeemed ones saved as `codes`).

## Fishing systems

### What bites

`pickFish()` chooses by weight, luck, cast distance, time, weather and area. Luck from rod × bait × talents has diminishing returns (`1 + 0.45 · ln(luck)`).

Rarities are junk, common, uncommon, rare, Wii, epic and legendary. Wii sits between rare and epic and holds six fish cut from a user-supplied image.

Fish can have conditions (`FISH`): `night`, `far`, `weather`, `needs` (earlier catches), `bait`, `hours`, `crits` (creatures beaten) and `minRod` (lava rod depth). For example, the UhrZeitFisch only bites on the full in-game hour, and Gyarados only after 14.5 Karpador, so in practice 15.

A few catches do something extra:

- **Ditto** fakes a legendary catch with the full fanfare and a made-up giant size, then the card reveals it.
- **Monster-Energy-Fisch** gives faster bites for 60 s.
- **Magische Miesmuschel** shows a random answer on its catch card. Once caught, it sits on a rock next to the dock, where you can ask it questions. Answers are spoken with on-device voices only.
- **Playboi-Carti-Fisch** (epic, dock and sea, best at night) is an original animated pixel GIF (`img/carti-fisch.gif`, 8 frames: headbang, swinging dreads, wagging tail, sparkling chains; vamp look in black and red: studded leather jacket, red-tipped dreads, big shades, fangs, silver chains).
- **Magnet-Angel** (`magnet: true`, 20 000 Taler in the kiosk from the 1st prestige) catches only non-fish: while it is held, `pickFish` keeps only junk and `item: true` entries, and junk is worth ×3. Three finds hang only on it (`magnet: true`, pool weight `mw`): Rostiger Anker (uncommon), Altes Fahrrad (rare) and Schatztruhe (legendary). Its bobber is a red horseshoe magnet.
- **Spezifischfischer cut-outs** speak their line from `sounds/spezifischfischer.mp3`.

### Size classes and modifiers

| Class | Chance | Value |
|---|---|---|
| Mini | ~12 % | ×0.7 |
| Normal | The rest | ×1 |
| Groß | ~16 % | ×1.4 |
| Kapital (up to 1.15× max size) | ~5 % | ×2 |
| Monster (1.15–1.35× max size) | ~0.7 % | ×4 |

The best class per fish is saved in `dex[id].cls`, and Monster catches are counted in `monsters`.

| Mutation | Value |
|---|---|
| Winzig | ×1.6 |
| Riesig | ×2 |
| Albino | ×3 |
| Leuchtend | ×3.5 |
| Schattenhaft (night only) | ×4 |
| Golden | ×6 |
| Regenbogen | ×12 |

About 1 % of catches are **shiny**: recoloured, sparkling and worth triple. They fill the Shinydex.

### Taktdrill

A legendary bite has a 30 % chance to become a rhythm minigame instead of normal reeling. 12 numbered circles appear with shrinking rings:

- **With a mouse:** aim at the next circle, then hit with any mouse button or Z/X.
- **On a touch screen:** tap the circle.
- **Without aiming:** press Space.

55 % accuracy lands the fish, and 90 % counts as a clean catch.

### Time and weather

Both come from the real clock, so every player sees the same world without a server (`worldTime`, `weatherAt`). An in-game day and a weather slot each last 300 s. The pill in the top bar shows the current weather and the forecast.

| Weather | Effect |
|---|---|
| Sonnig | None |
| Regen | Faster bites |
| Nebel | More rare and epic fish |
| Gewitter | More legendaries, more tension |
| Regenbogen (only after rain) | Double shiny and mutation chance |
| Wind | Short casts count as further out |
| Schnee | +25 % Taler, slower bites |
| Hitzewelle | Less tension, slower bites |
| Sternschnuppen | More legendaries and shinies |

Four weather fish only bite in their weather: Pfützenspringer, Nebelgeist, Blitzwels and Regenbogenforelle.

### Fischdex

The Fischdex has one page per area and opens on the area you're in. Dock fish with `sea: true` appear on both Steg and Hohe See. On Shinydex cards, the icons show which mutations that fish came out with as a shiny (`smuts`), with a count. Search (only matches fish you've caught) and filters (all, missing, caught, without gold medal, by rarity) work on every page, including the Shinydex.

The first catch of each fish gets its own reveal, then flies into the book on the dock. The progress board keeps a Fang-Verlauf of the last 20 catches (`history`).

## Areas

The current area is saved as `map`.

| Area | `map` | Fish | Opens |
|---|---|---|---|
| Steg | `steg` | 51 (the Fischelner Samtfisch since `2026-11-06-3`, the Ideenfisch since `2026-11-06-6`) | From the start |
| Hohe See | `see` | 44, of which 13 are shared with the Steg | 3rd rebirth, or Seekarte |
| Glutgrotte | `lava` | 31 | 1st prestige |
| Sonneninsel | `insel` | 22 | 3rd prestige |

Fish that moved to a harder area are worth more Taler there, in line with the other fish of that area and rarity. Caught fish stay in the Fischdex because it's keyed by fish id.

### Hohe See

The buoy next to Bealin takes you onto the boat, and the steering wheel takes you back. Every cast out here counts as far out.

Elfbar (junk, since `2026-11-05-7`): an empty disposable vape at the dock and on the High Seas.

Talerfisch (since `2026-11-05-7`): rare, at the dock and on the High Seas, worth 90 Taler, a golden fish in a tracksuit with a gold chain, a crossbody bag and a vape.

Deep-sea catches (since `2026-11-05-3`): Beilfisch, Alter Taucherhelm (junk), Riesenassel, Leuchtqualle (night), Fangzahnfisch (far), Pelikanaal (night) and the legendary Megalodon (very far).

**The Odfisch** is the boss. The Odköder (rebirth 3, 1 500 Taler), cast at night on the open sea, summons it for a 3-minute fight with a health bar:

- Reeling inside the safe tension deals damage, and a snapped line stuns for 3 s.
- Phase 2 adds Taktdrill salvos, and phase 3 is a rage with harder pulls.
- Cutscenes (`startCine`, `drawCine`) cover the intro, the phase changes and the ending. The fight pauses meanwhile and the solo clock is extended.
- Winning lands the Odfisch (at least Kapital size), 10 Schuppen, Taler by damage share and the Odfisch hat.
- **Stages** (`bossStage()`): after 10, 25 and 50 wins he comes back as stage 2, 3 and 4, each with +50 % HP, +50 % Taler and +5 Schuppen. From stage 3 he also gives pearls after a prestige (1 at stage 3, 2 at stage 4). In a lobby the caller's stage counts (`bs`).

In a lobby, everyone on the open sea fights the same Odfisch. `api/lobby.js` keeps a shared record with 1 000 HP per angler (more at higher stages), adds each player's capped damage per sync (`HINCRBY`), and checks the summon against the server's clock.

### Glutgrotte

Glimm, a pixel mole in a miner's helmet, stands on a glowing rock in front of the dock and takes you down. The cave has its own neutral weather (`glut`), and every catch there gets a heat bonus: `caveBonus()` = 1.2 × (1 + 0.1 per depth above 1) × (1 + 0.03 per trust level) × (1 + 0.05 per Glutnetz level).

**Lava rods.** Normal rods melt here. Only rods with `lava: true` work, held in their own slot (`lavaRod`), and they work nowhere else. Apart from the Basaltrute, they cost Glutsteine and need a depth:

| Rod | Price | Depth |
|---|---|---|
| Basaltrute | 400 Taler | 1 |
| Obsidianrute | 80 🔥 | 2 |
| Magmarute | 250 🔥 | 3 |
| Drachenknochenrute | 700 🔥 | 4 |
| Phönixfederrute | 1 800 🔥 | 5 |

**Depths** (`CAVE_DEPTHS`, `caveDepth`) cost Glutsteine. Each one unlocks cave fish and lava rods, and adds +10 % Taler in the cave:

| Depth | Name | Cost |
|---|---|---|
| 1 | Glutkammer | Start |
| 2 | Aschehalle | 60 🔥 |
| 3 | Magmaschlund | 250 🔥 |
| 4 | Drachenhort | 800 🔥 |
| 5 | Phönixnest | 2 000 🔥 |

Depth 5 also earns the Lavamantel.

Deep cave catches (since `2026-11-05-3`): Schmelzente (junk) and Lavalampenfisch at depth 2, Feuerkoi at depth 3, Hortbarsch at depth 4, and Phönixküken and the legendary Glutwal (far) at depth 5.

**Glutsteine** (`glut`) drop per cave catch by rarity: junk 0–1, common 1, uncommon 2, rare and Wii 5, epic 12, legendary 40. Kapital and Monster catches drop double and shinies triple.

**Glimm's jobs** (`glimmQ`) ask you to catch N fish in the cave, N of one cave fish or an epic or better, or to earn N Taler there. They pay 1 200 × tier × (1 + 0.25 per depth) × `coinMult()`, and the epic job also pays a pearl. Every three finished jobs (`glimmDone`) raise Glimm's trust by one level, up to 10, for +3 % Taler in the cave each. Trust and the workshop survive rebirth and prestige, and of the open jobs only finished ones do.

**Glimm's workshop** (`GLUT_UPS`, `glutUps`) sells permanent cave upgrades:

| Upgrade | Per level | Max level |
|---|---|---|
| Glutnetz | +5 % Taler | 10 |
| Hitzeschild | −5 % tension | 5 |
| Funkenlicht | +8 % luck | 10 |
| Glutkristall | +10 % Glutsteine | 10 |
| Lockruf | +1 % creature chance | 5 |

**The Lava-Laden** is Glutflosse's stall on the basalt ledge, and the kiosk on the dock never shows it. It sells the lava rods, the Glutköder (5 for 15 🔥, works only in the cave), the Lockköder (5 for 20 🔥, depth 2) and lava cosmetics: Glut-Pose 80, Aschejacke 150, Magmahelm 200 and Obsidiankrone 1 500 🔥.

**Lava creatures** (`CREATURES`, `crit`) sometimes bite instead of a fish: Glutschnecke, Aschekrabbe, Schlackwurm, Flammenqualle, Basaltgolem and Glutkraken, by depth. Each is a short solo fight in state `crit`: hold to deal damage, let go while it thrashes, and win within 25–40 s. A win gives Glutsteine, Taler, XP and an 8 % chance of a Glutherz.

`critChance()` starts at 5 % and rises to at most 30 % with the lava rods (`kc`, Obsidian +2 to Phönixfeder +5), the Glutköder (+3), the Lockköder (+10) and Lockruf.

### Sonneninsel

From the 3rd prestige the seaplane at the end of the dock (`flieger`) flies you to a volcano island (since `2026-11-05-8`). The first arrival plays a short intro (`inselSeen`): you jump out with a parachute and Coach Pelle, a pelican with a whistle, greets you. **Nothing on the island ever resets**, apart from a running Angelturnier.

**Bays** (`INSEL_BAYS`, `inselBay()`) open with stamps. Each has its own painted world (`img/welt-insel-1..5.png`) and fish, and every catch on the island is worth `inselMult()` = 1.3 × (1 + 0.1 × (bay − 1)) more.

| Stamps | Bay | Fish |
|---|---|---|
| 0 | Palmenstrand | Kokosnussfisch, Papageifisch, Badelatsche (junk), Sonnencreme-Flasche (junk), Strandball-Kugelfisch, Flamingofisch, Ananasbarsch |
| 4 | Korallenriff | Schnorchelfisch, Tischtennis-Kugelfisch, Frisbee-Rochen, Meeresschildkröte |
| 10 | Sportbucht | Bowlingkugelfisch, Wasserski-Makrele, Bogenschützenfisch (far), Fechter-Schwertfisch |
| 18 | Wasserfall-Lagune | Golfballfisch, Basketball-Barsch, Kanu-Hecht, Hula-Fisch (night) |
| 26 | Pokalbucht | Sternenfisch (night), Goldener Pokalfisch, Riesen-Mantarochen (far) |

**Sport stations** (`SPORTS`, modal `#sport`, opened by Coach Pelle) run on their own 384×216 canvas (`#sport-cv`) with pointer, touch and keys. Each has two modes, the second from skill 300, and medals per mode (`med`).

| Station | Opens at (stamps) | Modes |
|---|---|---|
| 🥏 Frisbee | 0 | Zielring, Weitwurf |
| 🎣 Angelturnier | 0 | Fünf Fänge, Größter Fang (the next 5 island catches count, `turnier`) |
| ✈️ Rundflug | 0 | Erkunden, Nachtflug (after all 30 viewpoints) |
| 🚤 Jetski | 4 | Slalom, Ringjagd |
| 🏄 Surfen | 6 | Wellenritt, Trickjagd |
| 🏹 Bogenschießen | 10 | Scheiben, Ballons |
| 🏐 Beachvolleyball | 14 | Match, Aufschlag-Serie |
| 🏓 Tischtennis | 18 | Match, Ballwechsel |
| 🎳 Strand-Bowling | 22 | 10 Frames, Pyramide |

**Fang-Drills** (since `2026-11-05-10`): once the island is open (`inselOpen()`), `hook()` turns 15 % of rare, epic and legendary bites on every map into a short round of a station the player has already opened (`SPORT_DRILLS`, `startDrill`, state `sdrill`). Legendaries can also get the osu-Taktdrill. Reaching `pass` points lands the fish, and `clean` counts as a clean catch. Missing the target or closing the modal loses it. Drills never change skill, stamps, medals, coins or the daily limit.

**Game feel** (since `2026-11-06-1`): every station shares one effects layer (`SJ`: `burst` particles, `spop` rising popups, `shake`, `sflash`), drawn by `sportTick` over the scene, and the countdown shows the station's short control line (`ctl`). Frisbee throws like a slingshot at three floating targets (`frisTarget`, `frisV`, `frisG`) and skips over the water in Weitwurf; bowling is a swipe up; volleyball returns on its own (tap = smash); table tennis smashes on a fast swing; the surf lip moves (`surfLip`) and pays most in the pocket right under it; the Rundflug is shorter, +4 s per balloon, with a compass arrow.

The expected score of every mode grows by about half its base per 1000 skill (`exp`). Medals sit at about 1.15, 1.45 and 1.8 times the base, the champion duel at about 2× (the volleyball and table-tennis matches: bronze 5 points, silver a win, gold a win by 4, the duel a win against Kraul).

- **Skill** (`sport[id].lv`, 0–2500): after each round it moves by round((clamp((score / expected − 1) × 60, −30, 60) + 6 × medal) × level factor) (medal 0–3, `SP_MEDAL_LV`), and it never drops below the floor of the current class (Anfänger 0, Fortgeschritten 500, Profi 1000, Champion-Anwärter 1500, Legende 2500). Levels 2 and 3 open at 500 and 1000 and pay more.
- **Profi** at 1000 gives +2 % Taler everywhere per station.
- **Champion duel** against Kapitän Kraul, a walrus in a tracksuit, opens at skill 1500 and 26 stamps. A win gives a trophy (`trophies`, shown on a shelf at the dock), a pearl and +3 % Taler everywhere.
- **Stamps** (`stamps`): 5 per station, 45 in total. Each pays Taler, XP and Schuppen. All 45 give the title Inselchampion and +5 % Taler everywhere.
- **Rundflug** (`ipoints`): 30 named viewpoints over the island plus 10 at night. Found ones stay found.
- **Daily cap** (`sportDay`): after 10 rounds per station per day, Taler and XP are halved. Skill and stamps are not capped.
- `sportBonus()` (Profi, trophies, all stamps) goes into the collection group of `coinMult()`, up to +50 %.

**Zylinderwels' Strandbude** sells the Mango-Köder (luck only on the island), the Hawaiihemd, the Strohhut and the Kokos-Pose. The Sport-Stirnband (10 stamps), the Fliegerkappe (20 viewpoints), the Trainingsjacke (a Kraul win) and the Pokal-Hut (45 stamps) are rewards.

## Multiplayer and online features

All of these are opt-in. Without them, progress stays in the browser's `localStorage` (`fischen-save-v1`, see `datenschutz.html`, section 5).

- **Leaderboard** (🏆): sends a nickname and scores to `api/leaderboard.js`. The boards are Taler, Fisch der Woche (biggest non-junk catch this week, its own key per week; last week's top 3 get the Wochensieger-Kappe), total rebirths, Fischdex, diamond medals, biggest catch, Monster catches, Odfisch wins, prestige, Sportler (sum of sport skill) and Taler spent. Names that fail the filter in `_names.js` are shown as ???.
- **Ideenbrett** (💡): catching the rare Ideenfisch gives one idea slip (`ideaTix`). A slip pins an idea (8–160 characters) to a public board in `api/ideas.js`, under the leaderboard name or „Anonym“. Everyone votes ▲ or ▼, once per idea (random voter ID `ideaId`, the server stores only a hash prefix); the board sorts by „Beliebt“ (up − down) or „Neu“. Ideas with swear words are refused, at most 6 per player per 8 hours, 200 are kept, each expires after 180 days.
- **Cloud save** (☁️): a secret key stores a copy of the save, so it can be loaded on another device. It's stored under the key's SHA-256 with a 180-day TTL.
- **Lobbies** (👥): up to 8 anglers share a 4-letter code or a `?lobby=CODE` link. Everyone sees the others on the dock, a feed of catches and a scoreboard of Taler fished since joining. Chat messages ride along with each sync and appear as speech bubbles. The server keeps the last 30 per lobby and stars out words from the name blocklist.

Lobbies use polling, not sockets. Clients sync every 3 s while the tab is visible, or every 1.5 s in a boss fight. Players disappear after 20 s without a sync and are removed after 90 s, and lobbies expire 2 h after the last activity. The current lobby is saved as `lobby`, so a reload rejoins it.

## Interface

- **Languages:** German and English. A DE/EN switch stores the choice in `localStorage` (`fischen-lang`), and without one the browser language decides.
- **Fonts:** self-hosted. Silkscreen (SIL OFL, licence in `fonts/silkscreen-OFL.txt`) is only for short display text, and everything people read uses Poppins.
- **Settings** (⚙️ or E): sound, volume (`vol`), less motion (`calm`), short numbers (`short`), a catch card that closes itself (`autoClose`), automatic bait rebuying (`autoBait`) and the play-time display (`showPlay`).
- **Play time** (`playTime`): seconds the game was open and visible, shown as a ⏱ pill. It never resets.
- **HUD:** three framed bars (`.hud-group`): wallet (coins, Glut, level), world (time, play time, weather, snacks, tournament) and menu. The „Saved“ stamp sits in the bottom right. On portrait phones the canvas is pinned under the HUD and the page background splits at its horizon (`--bg-split`).
- **Minigame window:** while a round runs, `#sport` carries the class `playing`: slim header, canvas sized to the screen. Results are a card (`.sr-card`, coloured per medal) with the medal marks of the mode and level. In-scene gauges use `smeter(x, y, w, h, value, label, colours)`.
- **Patch notes:** every update adds an issue of the Steg-Zeitung, marked with „!“ while unread (`PATCH_NOTES`, `patchSeen`).
- **Automatic updates:** open games compare the ETags of `fischen.html`, `js/fischen.js`, `js/fischen-i18n.js` and `css/fischen.css` every two minutes, then save and reload at the next calm moment.

## Development

### Project layout

| Path | Contents |
|---|---|
| `index.html`, `fischen.html`, `datenschutz.html` | Top-level pages |
| `seiten/` | All other pages, one per fish |
| `js/fischen.js` | The game, one large IIFE |
| `js/fischen-i18n.js` | English texts, keyed by the German original |
| `css/`, `fonts/`, `sounds/` | Stylesheets, fonts, sounds |
| `img/` | Images |
| `img/pxl/` | Pixel-art sources, not loaded by the game |
| `api/` | Vercel Functions |
| `vercel.json` | Redirects from old top-level addresses, e.g. `/stinkfisch.html` → `/seiten/stinkfisch.html` |
| `CLAUDE.md` | Project rules, code map and recipes (German) |

### Running locally

There is no build step and there are no npm packages. Serve the folder with any static server:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000/fischen.html>. The test hooks in `window.__fischen` only exist on localhost. Elsewhere, `?debug` enables them but marks the save as tampered.

A static server doesn't run `api/`, so the leaderboard, cloud save and lobbies need the Vercel runtime and the environment variables below, or a mock of the Redis pipeline as described in `CLAUDE.md`.

Syntax check:

```sh
node --check js/fischen.js js/fischen-i18n.js api/*.js
```

### Deployment

Import the repo on Vercel with Framework Preset "Other" and leave the build and output settings empty. `index.html` is served at `/`.

| Environment variable | Purpose |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis connection |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | The same connection under the alternative names |
| `ADMIN_TOKEN` | Optional, enables the admin actions below |

### API

All functions use Upstash Redis through its REST pipeline.

| Endpoint | Purpose |
|---|---|
| `api/leaderboard.js` | Scores with plausibility limits per board. `DELETE {id, admin}` removes an entry. `POST {action: 'stats', admin}` returns totals only: entries per board and how prestige and rebirths are spread. |
| `api/save.js` | Cloud saves. `POST {action: 'gift', key, hours, admin}` gifts up to 1 000 h of play time, stored under `sv:gift:<hash>`. The game claims it on its next sync (`put` with `claim: true`). |
| `api/lobby.js` | Lobbies, chat, catch feed and the shared boss fight |
| `api/jackpot.js` | The slot machine's shared jackpot pot. `GET` returns `{pot, last}`; `POST {action: 'spin', stake, name?}` adds half of the stake, rolls the jackpot and empties the pot atomically (`GETSET`) when it is cracked. 60 spins per minute per hashed IP. |
| `api/ideas.js` | The Ideenbrett. `GET` lists the newest 100 ideas; `POST {action: 'list'|'post'|'vote', voter, …}`; `DELETE {id, admin}` removes an idea. |
| `api/_names.js` | Name and text filter for the leaderboard, lobbies, chat and ideas: a short substring list plus the word list in `_badwords.js`, matched as whole words, with exceptions in `ALLOW` |
| `api/_badwords.js` | Word list in 28 languages from [List of Dirty, Naughty, Obscene, and Otherwise Bad Words](https://github.com/Hesham-Elbadawi/list-of-banned-words) by Shutterstock and contributors, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); lower-cased and de-duplicated |

One-time gifts by player name are listed in `NAME_GIFTS` in `js/fischen.js` and matched against the leaderboard and lobby name. Arrived ones are saved in `gifts`.

### Anti-cheat

It only makes cheating harder. Every save carries a checksum (`sig`, with `fischen-sig` remembering that this device writes signed saves). A save edited by hand is marked `tampered` and can't join or update the leaderboard.

### Art

- **Sport scenes and island map:** `img/pxl/sport.px.js` paints the station backdrops (`img/sport-*.png`) and the island map (`img/insel-karte.png`, `insel-karte-mini.png`) with the shared painter `img/pxl/maler.inc.js`: `node img/pxl/render.js sport`. The game draws moving things on top and falls back to drawn shapes while an image loads. The map has towns and places between the 30 viewpoints (`areas()`: harbour town at the Strandplatz, resort, airstrip, stadium, fields, orchards, lava channel, coast with umbrellas, boats and islets); `miniAreas()` copies them into the small map. Moving props in the scenes are lit sprites painted once at runtime (`litEll`, `BALLS`, `drawTarget`), spectators are `ART.sp_fan_0/1` recoloured per seat (`sfan`, `crowd`), and `skyLife()` adds gulls and a far sail.
- **Sprites:** the original pixel sprites are drawn as code in `img/pxl/` (pxl DSL). `node img/pxl/render.js fisch <name …>` renders them to `img/<name>.png` without any npm packages; sprites with `lit: true` (the Sun Island fish) get the shared top light, belly shade and tinted outline from `light()`/`selout()`.
  - `fisch.px.js` renders the PNGs in `img/`.
  - `code.px.js` renders the player, NPCs, dock props, baits and snacks, which are inlined as character rows in `js/fischen.js` (`ART`, `PLAYER_BODY`, `PLAYER_LEGS`).
  - `welt.px.js` renders the worlds.
- **User-supplied images:** twelve catches, such as `img/hundsfisch.png` and `img/blauer-hummer.png`, are unchanged originals, marked `photo: true, whole: true` in `FISH` so they're shown uncropped. The Blauer Hummer plays `sounds/blauer-hummer.mp3` when caught.
- **Worlds:** painted images on their own canvas layer above the sky: `img/welt-steg.png`, `img/welt-see.png` and `img/welt-lava-1.png` to `-5.png` (one per cave depth), plus `img/welt-lava-fels.png` and `img/welt-qualle.png`. `renderBg` tints them for the time of day, and `drawWorldFx` draws the moving parts on top: waves, light shafts, kelp, bubbles, jellyfish, the whale and lavafalls.
- **Shadows:** swimming shadows come from colour masks in `img/welt-schatten.png` (14 shapes with 4 frames each, plus the whale) and are recoloured per world in `shadowSheet()`.

### Contributing

`CLAUDE.md` is the source of truth. The rules that matter most:

- Every new fish needs its own page in `seiten/`.
- Game text is written in German, wrapped in `tr('…')`, and gets an English entry in `js/fischen-i18n.js`.
- Every update players can notice gets a `PATCH_NOTES` entry and a `CHANGELOG.md` entry.
- New save or server fields must be mentioned in `datenschutz.html`.
- No secrets in the repo.
