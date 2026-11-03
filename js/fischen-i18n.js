// Fischen! – language switch (Deutsch / English)
// The game is written in German. This file picks the language, swaps in English
// texts by their German original, and adds the DE/EN switch. Changing the language
// saves the choice in localStorage ("fischen-lang") and reloads the page.
(() => {
  'use strict';
  const KEY = 'fischen-lang';
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  const browserDe = /^de\b/i.test(navigator.language || '');
  const lang = saved === 'de' || saved === 'en' ? saved : (browserDe ? 'de' : 'en');

  // German original -> English. {x} are placeholders filled in by tr().
  const EN = {
    // ---- game messages
    'Speichern nicht möglich – Fortschritt geht beim Schließen verloren.': 'Can’t save – progress will be lost when you close the page.',
    'Spiel in einem anderen Tab gespeichert – lade den neuen Spielstand …': 'Game saved in another tab – loading the newer save …',
    '🆕 Neue Version! Lade neu …': '🆕 New version! Reloading …',
    'Warten …': 'Waiting …',
    'Köder aufgebraucht – zurück zum Wurm.': 'Out of bait – back to the worm.',
    '📖 Fischdex-Belohnung bereit!': '📖 Fishdex reward ready!',
    'SHINY!': 'SHINY!',
    '💫 Neuer Shiny!': '💫 New shiny!',
    '💫 Shiny!': '💫 Shiny!',
    '+{n} EP': '+{n} XP',
    'SELTEN!': 'RARE!',
    'WII!': 'WII!',
    'EPISCH!': 'EPIC!',
    'LEGENDÄR!': 'LEGENDARY!',
    'Eingeholt. Nichts dran.': 'Reeled in. Nothing on it.',
    '!  JETZT KLICKEN  !': '!  CLICK NOW  !',
    'Zu spät! Er ist weg.': 'Too late! It got away.',
    'Schnur gerissen! 💥': 'Line snapped! 💥',
    'Entkommen …': 'It escaped …',
    'Fischautomat': 'Fish slot machine',
    'Fischdex & Shinydex': 'Fishdex & Shinydex',
    'Bestenliste': 'Leaderboard',
    'Aufträge & Fortschritt': 'Quests & progress',
    'Laden': 'Shop',
    'LADEN': 'SHOP',
    'Halten zum Auswerfen': 'Hold to cast',
    'Erst einholen, dann Köder wechseln': 'Reel in first, then switch bait',
    'Taste {k}': 'Key {k}',
    '{n} Stück': '{n} pcs',
    '🪙 Kopf …': '🪙 Heads …',
    '🐟 Fisch …': '🐟 Fish …',
    '🐟 Fisch! +{n} Taler extra': '🐟 Fish! +{n} extra coins',
    '🪙 Kopf. Die {n} Taler sind weg.': '🪙 Heads. The {n} coins are gone.',
    '+{n} Taler': '+{n} coins',
    'Zu wenig Taler – geh fischen!': 'Not enough coins – go fishing!',
    'Drehen ({n} Taler)': 'Spin ({n} coins)',
    'Zwei gleiche': 'Two of a kind',
    '🐀 Ratten': '🐀 Rats',
    'fressen alles': 'eat everything',
    'JACKPOT! +{n} Taler': 'JACKPOT! +{n} coins',
    'Gewonnen! +{n} Taler': 'You win! +{n} coins',
    'Die Ratten haben deinen Einsatz gefressen.': 'The rats ate your stake.',
    'Nichts. Nochmal?': 'Nothing. Again?',
    '🎲 Doppelt oder nichts ({n})': '🎲 Double or nothing ({n})',
    '💫 Shiny · ×{n} Wert': '💫 Shiny · ×{n} value',
    ' · neu im Shinydex!': ' · new in the Shinydex!',
    '×{n} Wert': '×{n} value',
    ' · neue Mutation!': ' · new mutation!',
    '{a} von {b} Shinys gefunden · Chance pro Fang gerade {c} %': '{a} of {b} shinies found · chance per catch right now {c} %',
    'Noch kein Shiny': 'No shiny yet',
    'Unbekannt': 'Unknown',
    '{n}× shiny gefangen': 'caught shiny {n}×',
    'Erst normal fangen': 'Catch a normal one first',
    'Shinydex': 'Shinydex',
    'Fischdex': 'Fishdex',
    '{a} von {b} entdeckt · {c} von {d} Mutationen · {e} Fänge insgesamt': '{a} of {b} discovered · {c} of {d} mutations · {e} catches in total',
    ' · Glücksspiel {n} Taler': ' · gambling {n} coins',
    '{n}× · Rekord {b} cm': '{n}× · record {b} cm',
    'Seite ansehen ↗': 'View page ↗',
    '+{c} Taler · +{e} EP': '+{c} coins · +{e} XP',
    '{n} Taler': '{n} coins',
    'Abholen': 'Claim',
    'Nur nachts, weit draußen': 'Only at night, far out',
    'Weit draußen': 'Far out',
    'Lieber nachts': 'Prefers the night',
    'Noch nicht gefangen': 'Not caught yet',
    'Da fehlen noch {n} Taler, mein Bester.': 'You are {n} coins short, my good fellow.',
    'Dafür ist es noch zu früh. {l}, dann reden wir.': 'Too early for that. {l}, then we talk.',
    'Wurf': 'Cast',
    'Kurbel': 'Reel',
    'Glück': 'Luck',
    'Ruhe': 'Calm',
    'In der Hand': 'Equipped',
    'Nehmen': 'Equip',
    'Tempo': 'Speed',
    '{n} im Beutel': '{n} in the bag',
    'Am Haken': 'On the hook',
    'Anködern': 'Use',
    '+{a} für {b}': '+{a} for {b}',
    'Der gute alte Wurm. Klassisch.': 'The good old worm. A classic.',
    'Spielstand wirklich löschen? Fischdex, Taler und Ausrüstung sind dann weg.': 'Really delete your save? Fishdex, coins and gear will be gone.',
    ' Dein Bestenlisten-Eintrag wird ebenfalls gelöscht.': ' Your leaderboard entry will be deleted too.',
    '+{n} % Taler pro Fang': '+{n} % coins per catch',
    '+{n} % Glück für seltene Fische': '+{n} % luck for rare fish',
    'Bisse kommen {n} % schneller': 'bites come {n} % faster',
    '{n} % weniger Spannung': '{n} % less line tension',
    '+{n} % Erfahrung': '+{n} % XP',
    'Start mit {n} Talern nach der Wiedergeburt': 'start with {n} coins after a rebirth',
    '🔒 {n}× Wiedergeburt': '🔒 {n}× rebirth',
    '🔒 Level {n}': '🔒 Level {n}',
    '⭐ Level {l}! +{n} Taler': '⭐ Level {l}! +{n} coins',
    '🔓 Freigeschaltet: {l}': '🔓 Unlocked: {l}',
    '🌀 Wiedergeburt möglich – schau in den Fortschritt!': '🌀 Rebirth available – check your progress!',
    'Level {l} · {x}/{n} EP': 'Level {l} · {x}/{n} XP',
    ' · {n}× wiedergeboren': ' · reborn {n}×',
    'Fange {n} Fische': 'Catch {n} fish',
    'Fange {n}× {r} oder besser': 'Catch {n}× {r} or better',
    'Fange einen Fang ab {n} cm': 'Land a catch of {n} cm or more',
    'Verdiene {n} Taler mit Fängen': 'Earn {n} coins from catches',
    'Fange {n}× {f}': 'Catch {n}× {f}',
    '🔥 Serie ×{n}': '🔥 Streak ×{n}',
    '✨ Sauber': '✨ Clean',
    '💫 Shiny': '💫 Shiny',
    '🌙 Nacht': '🌙 Night',
    '☀️ Tagesbonus {a}/{b}': '☀️ Daily bonus {a}/{b}',
    '📖 Neu': '📖 New',
    ' (+{n} EP)': ' (+{n} XP)',
    '📜 Auftrag erledigt: {q} – im Fortschritt abholen': '📜 Quest done: {q} – claim it in your progress',
    '📜 +{c} Taler · +{x} EP': '📜 +{c} coins · +{x} XP',
    'Wiedergeburt?\n\nDu bekommst {n} Schuppen und dauerhaft +20 % Taler.\nTaler, Ruten, Köder, Level und Aufträge werden zurückgesetzt.\nFischdex, Rekorde und Talente bleiben.':
      'Rebirth?\n\nYou get {n} scales and a permanent +20 % coins.\nCoins, rods, bait, level and quests are reset.\nFishdex, records and talents stay.',
    '🌀 Wiedergeboren! +{n} Schuppen · Taler-Bonus jetzt +{p} %': '🌀 Reborn! +{n} scales · coin bonus now +{p} %',
    '{x} / {n} EP': '{x} / {n} XP',
    '{a} Fänge · {b} Aufträge · {c}× wiedergeboren · Taler-Bonus +{p} %': '{a} catches · {b} quests · reborn {c}× · coin bonus +{p} %',
    '☀️ Tagesbonus: noch {n} Fänge mit doppelten EP': '☀️ Daily bonus: {n} more catches with double XP',
    '☀️ Tagesbonus für heute aufgebraucht – morgen wieder': '☀️ Daily bonus used up for today – back tomorrow',
    ' · 🔥 Serie {n} (Rekord {r})': ' · 🔥 streak {n} (record {r})',
    '{a} / {b} · Belohnung {c} Taler, {x} EP': '{a} / {b} · reward {c} coins, {x} XP',
    'Belohnung abholen': 'Claim reward',
    'Neuer Auftrag für {n} Taler': 'New quest for {n} coins',
    'Bereit! Du bekommst {n} Schuppen und dauerhaft +20 % Taler. Taler, Ruten, Köder und Level werden zurückgesetzt. Fischdex, Rekorde und Talente bleiben.':
      'Ready! You get {n} scales and a permanent +20 % coins. Coins, rods, bait and level are reset. Fishdex, records and talents stay.',
    'Ab Level {r} möglich (noch {d}). Je höher dein Level und je mehr Taler du verdienst, desto mehr Schuppen gibt es (aktuell {n}).':
      'Available from level {r} ({d} to go). The higher your level and the more coins you earn, the more scales you get (currently {n}).',
    'Freischaltung: Regenbogenrute (1×), Mondköder (2×), Sternenrute (3×), neue Hutfarben.': 'Unlocks: rainbow rod (1×), moon bait (2×), star rod (3×), new hat colours.',
    'Nächste Freischaltung bei {x}.': 'Next unlock at {x}.',
    '2× – Mondköder': '2× – moon bait',
    '3× – Sternenrute': '3× – star rod',
    'Alles freigeschaltet. Jede weitere Wiedergeburt: +20 % Taler.': 'Everything unlocked. Every further rebirth: +20 % coins.',
    '🪙 Taler': '🪙 Coins',
    '🌀 Wiedergeburten': '🌀 Rebirths',
    '📖 Fischdex': '📖 Fishdex',
    '{a} Fische · {b} Mut.': '{a} fish · {b} mut.',
    '📏 Rekordfang': '📏 Record catch',
    '🔬 Kleinster Fisch': '🔬 Smallest fish',
    'Bestenliste gerade nicht erreichbar.': 'Leaderboard not reachable right now.',
    'Lädt …': 'Loading …',
    'Noch niemand eingetragen. Sei der Erste!': 'Nobody here yet. Be the first!',
    'Dein Platz: {a} von {b} · {c}': 'Your place: {a} of {b} · {c}',
    'Dein Wert: {c}': 'Your score: {c}',
    'Name: 2–16 Zeichen (Buchstaben, Zahlen, Leerzeichen, . _ - ! ?).': 'Name: 2–16 characters (letters, numbers, spaces, . _ - ! ?).',
    'Bitte bestätige die Einwilligung.': 'Please confirm your consent.',
    'Eintrag aus der Bestenliste löschen? Dein Spielstand bleibt erhalten.': 'Delete your leaderboard entry? Your save stays.',
    'Aus der Bestenliste ausgetragen.': 'Removed from the leaderboard.',
    'Cloud-Speicher gerade nicht erreichbar.': 'Cloud save not reachable right now.',
    'Zuletzt gesichert: {d}': 'Last backed up: {d}',
    'Noch nicht gesichert.': 'Not backed up yet.',
    '☁️ Schlüssel erstellt – schreib ihn dir auf!': '☁️ Key created – write it down!',
    'Schlüssel kopiert.': 'Key copied.',
    'Kopieren nicht möglich – bitte abschreiben.': 'Can’t copy – please write it down.',
    'Cloud-Kopie löschen? Dein Spielstand auf diesem Gerät bleibt erhalten, der Schlüssel funktioniert danach nicht mehr.': 'Delete the cloud copy? Your save on this device stays, but the key will stop working.',
    'Cloud-Kopie gelöscht.': 'Cloud copy deleted.',
    'Der Schlüssel hat 16 Zeichen, z. B. ABCD-EF23-GH45-JK67.': 'The key has 16 characters, e.g. ABCD-EF23-GH45-JK67.',
    'Spielstand vom {d} laden ({n} Fänge, Level {l})?\nDer aktuelle Spielstand auf diesem Gerät wird ersetzt.': 'Load the save from {d} ({n} catches, level {l})?\nThe current save on this device will be replaced.',
    'Weiter fischen': 'Keep fishing',

    // ---- rarities
    'Gewöhnlich': 'Common', 'Ungewöhnlich': 'Uncommon', 'Selten': 'Rare', 'Episch': 'Epic', 'Legendär': 'Legendary', 'Kein Fisch': 'Not a fish',

    // ---- fish (names that are jokes or proper names stay as they are)
    'Fisch': 'Fish', 'Ich dreh mich nur kurz um.': 'Just turning around for a sec.', 'Der Klassiker. Dreht sich gern im Kreis.': 'The classic. Likes to spin in circles.',
    'Pixelfisch': 'Pixel fish', 'Knusper, knusper.': 'Crunch, crunch.', 'Besteht zu 100 % aus Pixeln. Sehr knusprig.': 'Made of 100 % pixels. Very crunchy.',
    'Bonjour! Du hast mich, non?': 'Bonjour! You got me, non?', 'Kommt aus Frankreich. Hat Schokolade dabei.': 'From France. Brought chocolate.',
    'Klein, aber spezifisch.': 'Small, but specific.', 'Ein ganz kleiner, aber sehr spezifischer Fisch.': 'A very small but very specific fish.',
    'Stinkfisch': 'Stinkfish', 'Riech lieber nicht so genau hin.': 'Better not sniff too closely.', 'Grün, fleckig und riecht drei Stege weit.': 'Green, blotchy, and you can smell it three docks away.',
    'Fisch 2': 'Fish 2', 'Diesmal mit mehr Budget.': 'This time with a bigger budget.', 'Die Fortsetzung. Länger als das Original.': 'The sequel. Longer than the original.',
    'Spezifisch. Spezifisch.': 'Specific. Specific.', 'Spezifische Spezifische. Gut gekühlt.': 'Spezifische Spezifische. Nicely chilled.',
    'Fisch 3': 'Fish 3', 'WAS?! Wer bist du denn?': 'WHAT?! Who are you?', 'Hat dich gesehen. Ist sichtlich schockiert.': 'Saw you. Visibly shocked.',
    'Schlammfisch': 'Mudfish', 'Ich hab mich extra schmutzig gemacht.': 'I got extra dirty for you.', 'Wohnt im Schlamm unter dem Steg. Tropft überall hin.': 'Lives in the mud under the dock. Drips everywhere.',
    'Gesprächsfisch': 'Talk Fish', 'Gutes Gespräch.': 'Good talk.', 'Schwimmt ganz nah ran, schaut dich an und beendet das Gespräch.': 'Swims right up, looks at you and ends the conversation.',
    'Beinfisch': 'Leg Fish', 'Ich wollte eigentlich nur kurz spazieren.': 'I was only going for a quick walk.', 'Hat Beine. Läuft lieber am Ufer entlang als zu schwimmen.': 'Has legs. Would rather walk along the shore than swim.',
    'Extra Spezi, extra spezifisch.': 'Extra Spezi, extra specific.', 'Ein Prachtexemplar mit extra viel Spezi.': 'A fine specimen with extra Spezi.',
    'Ölfisch': 'Oil Fish', 'Ich schillere. Das ist kein Kompliment.': 'I shimmer. That is not a compliment.', 'Schwarz und ölig, mit Regenbogenschimmer. Kommt nachts raus.': 'Black and oily with a rainbow sheen. Comes out at night.',
    'Kaugummifisch': 'Bubblegum Fish', 'Blubb. Ich klebe jetzt an dir.': 'Blub. I’m stuck to you now.', 'Rund, grau und zäh wie alter Kaugummi. Lächelt trotzdem.': 'Round, grey and chewy like old gum. Smiles anyway.',
    'Zackenbarsch': 'Grouper', 'AAAAAH.': 'AAAAAH.', 'Reißt das Maul weit auf. Drin wohnt ein kleiner Putzerfisch zur Miete.': 'Opens its mouth wide. A little cleaner fish rents a room inside.',
    'Schuhfisch': 'Shoe Fish', 'Schöne Schuhe hast du auch.': 'Nice shoes you have too.', 'Trägt Schuhe. Warum auch nicht.': 'Wears shoes. Why not.',
    'Ich bin nicht klein, ich bin kompakt.': 'I’m not small, I’m compact.', 'Ein kleiner Hai. Beißt nur weit draußen.': 'A small shark. Only bites far out.',
    'Wii-Hecht': 'Wii Pike', 'Schuppen in Lila. Steht mir.': 'Purple scales. Suits me.', 'Blauer Kopf, lila Schuppen, gelbe Barteln. Sehr stolz darauf.': 'Blue head, purple scales, yellow barbels. Very proud of it.',
    'Meine Nase ist nicht lang. Der Rest ist kurz.': 'My nose isn’t long. The rest is short.', 'Getigert in Orange und Grün, mit einer Nase wie ein Stock.': 'Striped orange and green, with a nose like a stick.',
    'Wii-Blaufisch': 'Wii Bluefish', 'Blau-gelb ist eine Lebenseinstellung.': 'Blue and yellow is a way of life.', 'Klein, rund, gelb oben und blau gestreift.': 'Small, round, yellow on top and striped blue.',
    'Wii-Tupfenfisch': 'Wii Spotted Fish', 'Die Punkte sind echt. Nicht anfassen.': 'The spots are real. Don’t touch.', 'Braun gepunktet mit weißem Bauch. Schaut immer etwas überrascht.': 'Brown spots and a white belly. Always looks a bit surprised.',
    'Wii-Grünling': 'Wii Greenling', 'Halb grün, halb weiß, ganz glücklich.': 'Half green, half white, wholly happy.', 'Vorne weiß, hinten grün getupft. Grinst gern.': 'White at the front, green spots at the back. Likes to grin.',
    'Wii-Rotling': 'Wii Redling', 'Ich bin nicht rot, ich bin aufgeregt.': 'I’m not red, I’m excited.', 'Leuchtend rot mit dunklen Flecken. Immer ein bisschen aufgeregt.': 'Bright red with dark spots. Always a little excited.',
    'Lippenfisch': 'Lip Fish', 'Also … wo fange ich an?': 'So … where do I start?', 'Er möchte reden. Er hat viel zu sagen.': 'He wants to talk. He has a lot to say.',
    'Jetzt bin ich da.': 'Now I’m here.', 'Jetzt kommt Travis.': 'Here comes Travis.',
    'Blobfisch': 'Blobfish', 'Hier oben ist mir der Druck zu wenig.': 'Not enough pressure up here for me.', 'Lebt eigentlich tief unten. Nur weit draußen und am liebsten nachts.': 'Actually lives deep down. Only far out, best at night.',
    'Riech mal. Frühlingsfrisch!': 'Have a sniff. Spring fresh!', 'Ein Zierfisch, frisch gewaschen. Duftet nach Spee.': 'An ornamental fish, freshly washed. Smells of Spee.',
    'Wir bleiben zusammen!': 'We stick together!', 'Zwei auf einmal. Spezifischer geht es kaum.': 'Two at once. It hardly gets more specific.',
    'Moment … ich bin doch der Fischer!': 'Wait … I’m the fisherman!', 'Der spezifische Spezifischfischer fischt spezifische Spezifische. Jetzt hast du ihn gefischt.': 'The specific Spezifischfischer fishes specific Specifics. Now you fished him.',
    'Steht am Steg. Fischt man ihn auch?': 'Stands on the dock. Can you fish him too?',
    'Absolut.': 'Absolutely.',
    'Katzenfisch': 'Cat Fish',
    'Kritzelfisch': 'Scribble Fish',
    'Platschkarpfen': 'Splash Carp', 'Platsch. Platsch. Platsch.': 'Splash. Splash. Splash.',
    'Kann eigentlich nichts außer zappeln. Macht das aber mit voller Hingabe.': 'Can’t really do anything except flop about. But does it with full dedication.',
    'Nicht anschauen, ich bin nur eine Skizze!': 'Don’t look, I’m just a sketch!',
    'Mit Bleistift hingekritzelt und nie ganz fertig geworden. Zittert leicht.': 'Scribbled in pencil and never quite finished. Wobbles a little.', 'Miau. Ich meine: Blubb.': 'Meow. I mean: blub.', 'Halb Katze, halb Fisch, ganz flauschig. Kommt lieber nachts.': 'Half cat, half fish, all fluff. Prefers the night.',
    'UhrZeitFisch': 'UhrZeitFisch', 'Ich bin pünktlich. Seit 66 Millionen Jahren.': 'I’m punctual. Have been for 66 million years.',
    'Ein Fisch aus der Urzeit, sehr cool. Beißt nur zur vollen Stunde.': 'A fish from prehistoric times, very cool. Only bites on the hour.', 'Beißt nur zur vollen Stunde': 'Only bites on the hour', 'Absolute Legende. Nur nachts, nur weit draußen.': 'Absolute legend. Only at night, only far out.',
    '🎵 Taktdrill! {f} tanzt an der Leine.': '🎵 Rhythm reel! {f} is dancing on the line.',
    '🎵 Im Takt gefangen! Genauigkeit {n} %': '🎵 Caught on the beat! Accuracy {n} %',
    'Aus dem Takt! {f} ist weg. ({n} %)': 'Off the beat! {f} got away. ({n} %)',
    'Taktdrill: Kreise im Takt antippen (oder Leertaste, Z, X)': 'Rhythm reel: tap the circles on the beat (or Space, Z, X)',
    '📰 Neu im Spiel': '📰 What’s new', 'Los geht’s!': 'Let’s go!', 'Patch Notes (N)': 'Patch notes (N)', 'Update vom {d}': 'Update from {d}',
    '🎵 Taktdrill: Legendäre Fische tanzen manchmal an der Leine. Tippe die Kreise im Takt an (oder Leertaste, Z, X), wenn der Ring sie erreicht – mit genug Genauigkeit gehört der Fisch dir.': '🎵 Rhythm reel: legendary fish sometimes dance on the line. Tap the circles on the beat (or Space, Z, X) when the ring reaches them – with enough accuracy the fish is yours.',
    '📰 Patch Notes: Nach jedem Update siehst du hier, was neu ist. Mit 📰 oder N jederzeit wieder.': '📰 Patch notes: after every update you’ll see what’s new here. Open them again any time with 📰 or N.',
    '🔬 Neue Bestenliste: kleinster Fisch.': '🔬 New leaderboard: smallest fish.',
    '😜 Schummelfisch: täuscht einen legendären Fang vor.': '😜 Trickster Fish: fakes a legendary catch.',
    '🍤 Neuer Fisch: Fischstäbchen.': '🍤 New fish: Fish Stick.',
    '📦 Mysteryboxen geben jetzt feste EP (15 / 40 / 100).': '📦 Mystery boxes now give fixed XP (15 / 40 / 100).',
    '🆕 Neue Versionen laden automatisch, sobald nichts an der Angel hängt.': '🆕 New versions load automatically as soon as nothing is on the line.',
    'Fischstäbchen': 'Fish Stick', 'Ich war mal ein Fisch. Jetzt bin ich knusprig.': 'I used to be a fish. Now I’m crispy.', 'Paniert, goldbraun und noch warm. Niemand weiß, wie es ins Wasser gekommen ist.': 'Breaded, golden brown and still warm. Nobody knows how it got into the water.',
    'Schummelfisch': 'Trickster Fish', 'Ätsch! Reingelegt. Die Fanfare war geliehen.': 'Ha! Got you. The fanfare was borrowed.', 'Trägt eine Scherzbrille mit Bart und tut so, als wäre er ein legendärer Fang. Ist er nicht.': 'Wears joke glasses with a moustache and pretends to be a legendary catch. He isn’t.', '😜 REINGELEGT!': '😜 GOT YOU!',
    'Drachenkarpfen': 'Dragon Carp', 'Ich bin den Wasserfall hochgesprungen. Jetzt bin ich sauer.': 'I jumped all the way up the waterfall. Now I’m angry.', 'Ein Karpfen, der es durchs Drachentor geschafft hat. Jade, Gold und schlechte Laune.': 'A carp that made it through the Dragon Gate. Jade, gold and a bad mood.', 'Erst wenn du 25 Karpador gefangen hast': 'Only after you’ve caught 25 Karpador',
    'Ratte': 'Rat', 'Lass mich, ich hab Termine.': 'Let go, I have appointments.', 'Nass und beleidigt. Läuft trotzdem weiter.': 'Wet and offended. Keeps walking anyway.',
    'Tisch': 'Table', 'Ich bin ein Tisch.': 'I am a table.', 'Ein Tisch. Kein Fisch. Aber fast.': 'A table. Not a fish. But close.',
    'Spezi-Flasche': 'Spezi bottle', 'Pfand gibt’s keins.': 'No deposit on this one.', 'Leer. Gehört bestimmt dem Spezifischfischer.': 'Empty. Surely belongs to the Spezifischfischer.',
    'Rotierende Pinguine': 'Rotating Penguins', 'Wir drehen uns, also sind wir.': 'We spin, therefore we are.', 'Vier Pinguine, rotierend. Selten. Wie kommen die hier rein?': 'Four penguins, rotating. Rare. How did they get in here?',

    // ---- rods and bait
    'Stock mit Schnur': 'Stick with string', 'Hat schon Opa benutzt.': 'Grandpa already used it.',
    'Bambusrute': 'Bamboo rod', 'Wirft weiter, kurbelt schneller.': 'Casts further, reels faster.',
    'Carbonrute': 'Carbon rod', 'Leicht, stark, weit.': 'Light, strong, far.',
    'Goldene Rute': 'Golden rod', 'Glänzt. Fische lieben Glanz.': 'It shines. Fish love shine.',
    'Regenbogenrute': 'Rainbow rod', 'Nur für Wiedergeborene. Schillert in allen Farben.': 'Only for the reborn. Shimmers in every colour.',
    'Sternenrute': 'Star rod', 'Aus einer Sternschnuppe geschnitzt.': 'Carved from a shooting star.',
    'Wurm': 'Worm', 'Unbegrenzt. Wurmig.': 'Unlimited. Wormy.',
    'Spezi-Köder': 'Spezi bait', '5 Stück. Seltene Fische beißen öfter.': '5 pieces. Rare fish bite more often.',
    'Glitzerköder': 'Glitter bait', '5 Stück. Für die ganz großen Fänge.': '5 pieces. For the really big catches.',
    'Wii-Köder': 'Wii bait', '5 Stück. Zeigt auf die Wii-Fische. Die beißen doppelt so oft.': '5 pieces. Points at the Wii fish. They bite twice as often.',
    'Mondköder': 'Moon bait', '5 Stück. Leuchtet. Legenden können nicht widerstehen.': '5 pieces. It glows. Legends can’t resist.',

    // ---- mutations
    'Riesig': 'Giant', 'Viel zu groß geraten.': 'Grew far too big.',
    'Winzig': 'Tiny', 'Passt in eine Streichholzschachtel.': 'Fits in a matchbox.',
    'Ganz ohne Farbe.': 'No colour at all.',
    'Leuchtend': 'Glowing', 'Leuchtet nachts besonders oft.': 'Glows. Especially often at night.',
    'Schattenhaft': 'Shadowy', 'Nur nachts. Kaum zu sehen.': 'Only at night. Barely visible.',
    'Pures Fischgold.': 'Pure fish gold.',
    'Regenbogen': 'Rainbow', 'Schimmert in allen Farben. Extrem selten.': 'Shimmers in every colour. Extremely rare.',

    // ---- Fishdex rewards
    '5 Fische entdeckt': '5 fish discovered', '10 Fische entdeckt': '10 fish discovered', '15 Fische entdeckt': '15 fish discovered',
    'Fischdex komplett': 'Fishdex complete', 'dauerhaft +10 % Taler': 'permanent +10 % coins',
    'Alle Gewöhnlichen': 'All common', 'Alle Ungewöhnlichen': 'All uncommon', 'Alle Seltenen': 'All rare', 'Alle Wii-Fische': 'All Wii fish',
    'Alle Epischen': 'All epic', 'Alle Legendären': 'All legendary', 'Aller Müll': 'All junk', 'dauerhaft +10 % Glück': 'permanent +10 % luck',
    'Erste Mutation': 'First mutation', '4 Mutationen': '4 mutations', 'Erster Shiny': 'First shiny', '5 Shinys': '5 shinies',
    'Shinydex komplett': 'Shinydex complete', 'dauerhaft doppelte Shiny-Chance': 'permanently double shiny chance',
    'Alle Mutationen': 'All mutations', 'dauerhaft +25 % Mutationschance': 'permanent +25 % mutation chance',

    // ---- talents
    'Goldener Haken': 'Golden hook', 'Glückspilz': 'Lucky duck', 'Lockruf': 'Lure call', 'Starke Schnur': 'Strong line', 'Anglerwissen': 'Angler’s wisdom', 'Erbstück': 'Heirloom',

    // ---- Herr Zylinderwels
    'Ah, Kundschaft! Treten Sie näher.': 'Ah, a customer! Step closer.',
    'Feinste Ruten, frisch aus dem Teich.': 'Finest rods, fresh from the pond.',
    'Was darf es sein, werter Angler?': 'What may it be, dear angler?',
    'Zylinder ab vor so viel Taler!': 'Hats off to so many coins!',
    'Blubb. Verzeihung. Willkommen!': 'Blub. Pardon me. Welcome!',
    'Exzellente Wahl!': 'Excellent choice!',
    'Ein Kauf mit Stil.': 'A purchase with style.',
    'Möge sie Ihnen viele Fische bringen.': 'May it bring you many fish.',
    'Sehr wohl, sehr wohl.': 'Very well, very well.',
    'Frisch eingetroffen!': 'Freshly arrived!',
    'Die Fische werden Sie lieben.': 'The fish will love you.',
    'Mit Vergnügen.': 'With pleasure.',
    'Steht Ihnen ausgezeichnet.': 'Suits you splendidly.',
    'Eine gute Hand für gutes Gerät.': 'A good hand for good gear.',

    // ---- page (fischen.html): text pieces and attributes
    'Fischen! Spielfeld': 'Fischen! playing field',
    'Zurück': 'Back',
    'Fischtaler': 'Fish coins',
    'Tageszeit': 'Time of day',
    'Spielstand wird in deinem Browser gespeichert': 'Your save is stored in your browser',
    'Gespeichert': 'Saved',
    'Fischdex (F)': 'Fishdex (F)',
    'Laden (L)': 'Shop (L)',
    'Fortschritt (P)': 'Progress (P)',
    'Fortschritt': 'Progress',
    'Bestenliste (B)': 'Leaderboard (B)',
    'Fischautomat (C)': 'Fish slot machine (C)',
    'Automat': 'Slots',
    'Ton an/aus (M)': 'Sound on/off (M)',
    'Köder wählen (Tasten 1–9)': 'Choose bait (keys 1–9)',
    '📱↻ Quer halten für mehr Meer': '📱↻ Turn sideways for more sea',
    'Spannung': 'Tension',
    'Einholen': 'Reel in',
    'Halten = kurbeln · Loslassen, wenn er zappelt!': 'Hold = reel · let go when it thrashes!',
    'NEU!': 'NEW!',
    '🎲 Doppelt oder nichts': '🎲 Double or nothing',
    'Schließen': 'Close',
    'Fischdex oder Shinydex': 'Fishdex or Shinydex',
    '🎁 Belohnungen': '🎁 Rewards',
    'Herr Zylinderwels, ein Wels mit Zylinder': 'Herr Zylinderwels, a catfish in a top hat',
    'Zylinderwels & Söhne': 'Zylinderwels & Sons',
    'Herr Zylinderwels, Inhaber': 'Herr Zylinderwels, owner',
    '🎣 Ruten': '🎣 Rods',
    '🪱 Köder': '🪱 Bait',
    'Du hast': 'You have',
    'Fischtaler.': 'fish coins.',
    'Dreh am Fisch!': 'Spin the fish!',
    '50 Taler weniger': '50 coins less',
    'Einsatz in Talern': 'Stake in coins',
    '50 Taler mehr': '50 coins more',
    'Drehen': 'Spin',
    'Gewinntabelle': 'Payouts',
    'Nur Fischtaler, kein echtes Geld. Die Ratte frisst Paare.': 'Fish coins only, no real money. The rat eats pairs.',
    '📜 Aufträge': '📜 Quests',
    '🌀 Wiedergeburt': '🌀 Rebirth',
    'Wiedergeburt': 'Rebirth',
    '🐚 Talente': '🐚 Talents',
    'Schuppen': 'scales',
    'Schuppen gibt es bei jeder Wiedergeburt. Talente bleiben für immer.': 'You get scales with every rebirth. Talents stay forever.',
    '☁️ Spielstand übertragen': '☁️ Transfer your save',
    'Mit einem geheimen Schlüssel kannst du deinen Spielstand auf einem anderen Gerät laden.': 'With a secret key you can load your save on another device.',
    'Öffnen': 'Open',
    'Mitmachen': 'Join',
    'Freiwillig: Mit einem Spitznamen erscheinen deine Punktestände öffentlich in der Bestenliste. Gesendet werden nur Spitzname, Punktestände und eine zufällige ID – nichts davon ist mit dir als Person verknüpft.':
      'Optional: with a nickname your scores appear publicly on the leaderboard. Only the nickname, your scores and a random ID are sent – none of it is linked to you as a person.',
    'Datenschutz': 'Privacy (German)',
    'Spitzname': 'Nickname',
    'Eintragen': 'Join',
    'Ich willige ein, dass mein Spitzname und meine Punktestände gespeichert und öffentlich angezeigt werden. Ich kann mich jederzeit austragen.':
      'I agree that my nickname and scores are stored and shown publicly. I can leave at any time.',
    'Eingetragen als': 'Joined as',
    '. Dein Stand wird beim Spielen automatisch aktualisiert.': '. Your scores update automatically while you play.',
    'Austragen und Eintrag löschen': 'Leave and delete my entry',
    'Spielstand übertragen': 'Transfer your save',
    'Erstelle einen geheimen Schlüssel. Dein Spielstand wird dann zusätzlich auf dem Server gesichert und automatisch aktualisiert. Mit dem Schlüssel lädst du ihn auf jedem anderen Gerät.':
      'Create a secret key. Your save is then also backed up on the server and updated automatically. With the key you can load it on any other device.',
    '🔑 Schlüssel erstellen': '🔑 Create key',
    'Dein geheimer Schlüssel – gut aufheben und niemandem zeigen. Wer ihn hat, kann deinen Spielstand laden.': 'Your secret key – keep it safe and show it to no one. Whoever has it can load your save.',
    'Kopieren': 'Copy',
    'Jetzt sichern': 'Back up now',
    'Cloud-Kopie löschen': 'Delete cloud copy',
    'Spielstand laden': 'Load a save',
    'Schlüssel von einem anderen Gerät eingeben. Der Spielstand auf diesem Gerät wird dabei ersetzt.': 'Enter the key from another device. The save on this device will be replaced.',
    'Geheimer Schlüssel': 'Secret key',
    'Wirf die Angel aus, warte auf den Biss und hol den Fang ein.': 'Cast your line, wait for the bite and reel in the catch.',
    'Fang sie alle für den Fischdex.': 'Catch them all for the Fishdex.',
    'Halten & Loslassen': 'Hold & release',
    '– auswerfen': '– cast',
    'Klick bei „!“': 'Click at “!”',
    '– anschlagen': '– strike',
    'Halten': 'Hold',
    '– kurbeln,': '– reel,',
    'loslassen': 'let go',
    'wenn die Schnur glüht': 'when the line glows',
    'oder': 'or',
    '– auf dem Steg laufen': '– walk along the dock',
    'Klick auf die Köderleiste': 'click the bait bar',
    '– Köder wechseln': '– switch bait',
    'Klick auf den Kiosk': 'Click the kiosk',
    '– Herr Zylinderwels verkauft Ruten und Köder': '– Herr Zylinderwels sells rods and bait',
    'Klick auf das Buch auf der Kiste': 'Click the book on the crate',
    '– Fischdex und Shinydex, Belohnungen abholen': '– Fishdex and Shinydex, claim rewards',
    'Klick auf das Brett': 'Click the notice board',
    '– Level, Aufträge, Wiedergeburt und Talente': '– level, quests, rebirth and talents',
    'Klick auf den Pokal auf dem Kiosk': 'Click the trophy on the kiosk',
    '– freiwillig in die Bestenliste eintragen': '– join the leaderboard if you like',
    'Klick auf den Fischautomaten': 'Click the fish slot machine',
    '– Fischtaler verzocken': '– gamble your fish coins',
    '💫 Shinys': '💫 Shinies',
    '– ganz selten glitzert ein Fang in anderen Farben und ist dreimal so viel wert': '– very rarely a catch sparkles in other colours and is worth three times as much',
    'Klick auf den Spezifischfischer': 'Click the Spezifischfischer',
    '– er hat was zu sagen': '– he has something to say',
    'Los geht\'s!': 'Let’s go!',
    'Dein Spielstand wird nur lokal in deinem Browser gespeichert (': 'Your save is only stored locally in your browser (',
    'Spielstand löschen': 'Delete save',
    '☁️ Spielstand mit geheimem Schlüssel übertragen': '☁️ Transfer your save with a secret key',
    'Sprache': 'Language',
    'A / D': 'A / D', 'Level': 'Level', 'Fischen!': 'Fischen!', 'Max': 'Max', '☀️ Tag': '☀️ Day', '💫 Shinydex': '💫 Shinydex',
    // names that stay the same in English
    'Wii': 'Wii', 'Poisson': 'Poisson', 'Kleiner Spezifisch': 'Kleiner Spezifisch', 'Spezifische Spezifische': 'Spezifische Spezifische',
    'Spezifischer Spezifisch': 'Spezifischer Spezifisch', 'Lo': 'Lo', 'Wii-Arowana': 'Wii Arowana', 'Travis': 'Travis', 'Spee Zierfisch': 'Spee Zierfisch',
    'Spezifische Spee Zierfische': 'Spezifische Spee Zierfische', 'Spezifischfischer': 'Spezifischfischer', 'Absolute Odfisch': 'Absolute Odfisch',
    // Käpt'n Bealin in the rowboat
    "Käpt'n Bealin": 'Cap’n Bealin',
    'Moin! Na, beißen se heute?': 'Hey there! So, are they biting today?',
    'DAS! Genau das wollte ich!': 'THAT! That’s exactly what I wanted!',
    "🎣 Käpt'n Bealin ist glücklich: +{c} Taler · +{e} EP": '🎣 Cap’n Bealin is happy: +{c} coins · +{e} XP',
    'Ich träume von etwas Großem.': 'I dream of something big.',
    'Größer als mein Boot wär übertrieben … aber fast.': 'Bigger than my boat would be too much … but almost.',
    'Manchmal ist weniger mehr. Viel weniger.': 'Sometimes less is more. Much less.',
    'Was Winziges würde mir das Herz wärmen.': 'Something really tiny would make my day.',
    'Normal kann jeder.': 'Anyone can do normal.',
    'Irgendwas an dem Fisch sollte … anders sein.': 'Something about that fish should be … different.',
    'Der Mond weiß, was ich will.': 'The moon knows what I want.',
    'Wenn alle schlafen, beißen die Richtigen.': 'When everyone’s asleep, the right ones bite.',
    'Nicht alles im Wasser ist ein Fisch.': 'Not everything in the water is a fish.',
    'Ich sammle Dinge, die keiner will.': 'I collect things nobody wants.',
    'Manchmal muss man loslassen.': 'Sometimes you have to let go.',
    'Nicht jeder Fang muss gelingen.': 'Not every catch has to work out.',
    'Ich hab so ein klimperndes Gefühl.': 'I’ve got a jingly feeling.',
    'Das Glück wohnt nicht immer im Wasser.': 'Luck doesn’t always live in the water.',
    'Ganz sanft. Ohne Zerren.': 'Gently. No yanking.',
    'Die Schnur soll sich nicht anstrengen.': 'The line shouldn’t have to strain.',
    'Ich will was, das nicht jeder hat.': 'I want something not everyone has.',
    'Gewöhnlich hatte ich schon genug.': 'I’ve had enough of ordinary.',
    'Ich denk die ganze Zeit an ein „{l}“.': 'I keep thinking about a “{l}”.',
    'Da schwimmt was mit „{l}“ …': 'Something with “{l}” is swimming about …',
    'Tagsüber bin ich so schüchtern.': 'I’m so shy in the daytime.',
    'Besuch mich mal, wenn man die Sterne sieht.': 'Visit me sometime when the stars are out.',
    'Ich mag Gesellschaft. Viel Gesellschaft.': 'I like company. Lots of company.',
    'Redest du eigentlich gern? Ich schon. Sehr oft.': 'Do you like talking? I do. Very often.',
    // mystery boxes
    'Holzkiste': 'Wooden box', 'Silberkiste': 'Silver box', 'Goldkiste': 'Golden box',
    'Knarzt und riecht nach Steg. Drin ist … irgendwas.': 'Creaks and smells of the dock. There’s … something inside.',
    'Schwer und kühl. Klappert vielversprechend.': 'Heavy and cool. Rattles promisingly.',
    'Glänzt so sehr, dass die Fische neidisch werden.': 'Shines so much the fish get jealous.',
    '📦 Mysteryboxen': '📦 Mystery boxes',
    'Weiter': 'Continue',
    'Was drin ist, weiß nicht mal ich.': 'What’s inside? Not even I know.',
    '🪙 {n} Taler': '🪙 {n} coins',
    '{n}× {b}': '{n}× {b}',
    '⭐ {n} EP': '⭐ {n} XP',
    '🧦 Eine alte Socke. Und 5 Taler.': '🧦 An old sock. And 5 coins.',
    '💰 JACKPOT! {n} Taler': '💰 JACKPOT! {n} coins',
    'Nächste öffnen ({n})': 'Open the next one ({n})',
    'Noch eine ({n} Taler)': 'Another one ({n} coins)',
    '📦 Am Haken hing noch eine {b}! Öffnen im Laden.': '📦 A {b} was hanging on the hook too! Open it in the shop.',
    'Albino': 'Albino', 'Golden': 'Golden', 'ABCD-EF23-GH45-JK67': 'ABCD-EF23-GH45-JK67',
  };

  const missing = new Set();
  function fill(t, v) { return v ? t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)) : t; }
  function tr(de, vars) {
    if (lang === 'de') return fill(de, vars);
    const en = EN[de];
    if (en === undefined) { missing.add(de); return fill(de, vars); }
    return fill(en, vars);
  }

  // static page text: translate text nodes and a few attributes by their German original
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  function translatePage(root) {
    if (lang === 'de') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      if (n.parentElement && n.parentElement.closest('script, style, code')) continue;
      const raw = n.nodeValue, key = raw.trim().replace(/\s+/g, ' ');
      if (!key || !/[A-Za-zÄÖÜäöüß]/.test(key)) continue;
      const en = EN[key];
      if (en === undefined) { missing.add(key); continue; }
      n.nodeValue = raw.replace(raw.trim(), en);
    }
    for (const el of root.querySelectorAll(ATTRS.map(a => `[${a}]`).join(','))) {
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v || !/[A-Za-zÄÖÜäöüß]/.test(v)) continue;
        const en = EN[v];
        if (en === undefined) { missing.add(v); continue; }
        el.setAttribute(a, en);
      }
    }
  }

  function setLang(l) {
    if (l === lang) return;
    try { localStorage.setItem(KEY, l); } catch { /* the choice just won't stick */ }
    location.reload();
  }

  // the DE / EN switch (title screen and top bar)
  function makeSwitch(cls) {
    const box = document.createElement('div');
    box.className = 'lang-switch ' + cls;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', lang === 'de' ? 'Sprache' : 'Language');
    for (const [code, label, name] of [['de', 'DE', 'Deutsch'], ['en', 'EN', 'English']]) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.lang = code; b.title = name;
      b.setAttribute('aria-pressed', String(code === lang));
      if (code === lang) b.className = 'on';
      b.addEventListener('click', () => setLang(code));
      box.append(b);
    }
    return box;
  }

  document.documentElement.lang = lang;
  translatePage(document.body);
  const hudRight = document.querySelector('#hud .hud-right');
  if (hudRight) hudRight.prepend(makeSwitch('pill'));
  const titleSheet = document.querySelector('#title .sheet');
  if (titleSheet) titleSheet.prepend(makeSwitch('title-lang'));

  window.I18N = { lang, tr, setLang, locale: lang === 'de' ? 'de-DE' : 'en-GB', missing };
})();
