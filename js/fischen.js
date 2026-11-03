// Fischen! – a cozy little fishing game for fisch.ing
// Pixel scene on a 384x216 canvas, UI in the DOM so the site's GIFs animate.
(() => {
  'use strict';
  // texts are written in German; js/fischen-i18n.js swaps in English when that language is picked
  const I18N = window.I18N || { tr: (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (v && k in v ? v[k] : m)), locale: 'de-DE', lang: 'de' };
  const tr = I18N.tr;
  const trAll = (list, keys) => { for (const o of list) for (const k of keys) if (typeof o[k] === 'string') o[k] = tr(o[k]); };

  // ------------------------------------------------------------------ data
  const RARITY = {
    common:    { label: 'Gewöhnlich', w: 60 },
    uncommon:  { label: 'Ungewöhnlich', w: 26 },
    rare:      { label: 'Selten', w: 10 },
    wii:       { label: 'Wii', w: 3 },
    epic:      { label: 'Episch', w: 3.5 },
    legendary: { label: 'Legendär', w: 0.9 },
    junk:      { label: 'Kein Fisch', w: 9 },
  };
  const STRENGTH = { common: .45, uncommon: .65, rare: .85, wii: .95, epic: 1.05, legendary: 1.3, junk: .3 };

  // far: only bites beyond this cast distance (0..1); night: x weight at night
  const FISH = [
    { id: 'fisch',   name: 'Fisch',             img: 'img/fsh-spin.gif',         r: 'common',    min: 20, max: 45,  val: 5,  photo: true, say: 'Ich dreh mich nur kurz um.', desc: 'Der Klassiker. Dreht sich gern im Kreis.' },
    { id: 'pixel',   name: 'Pixelfisch',        img: 'img/fish-icon.png',        r: 'common',    min: 8,  max: 16,  val: 4,  say: 'Knusper, knusper.', desc: 'Besteht zu 100 % aus Pixeln. Sehr knusprig.', pixel: true },
    { id: 'poisson', name: 'Poisson',           img: 'img/frenchfish.gif',       r: 'common',    min: 25, max: 50,  val: 6,  photo: true, say: 'Bonjour! Du hast mich, non?', desc: 'Kommt aus Frankreich. Hat Schokolade dabei.' },
    { id: 'spezi3',  name: 'Kleiner Spezifisch', img: 'img/spezifisch3.png',     r: 'common', clip: [0, .93],    min: 10, max: 22,  val: 6,  say: 'Klein, aber spezifisch.', desc: 'Ein ganz kleiner, aber sehr spezifischer Fisch.' },
    { id: 'platsch', name: 'Platschkarpfen',    img: 'img/platschkarpfen.png',   r: 'common',    min: 20, max: 50,  val: 3,  pixel: true, page: 'seiten/platschkarpfen.html', say: 'Platsch. Platsch. Platsch.', desc: 'Kann eigentlich nichts außer zappeln. Macht das aber mit voller Hingabe.' },
    { id: 'stink',   name: 'Stinkfisch',        img: 'img/stinkfisch.png',       r: 'common',    min: 10, max: 25,  val: 5,  pixel: true, page: 'seiten/stinkfisch.html', say: 'Riech lieber nicht so genau hin.', desc: 'Grün, fleckig und riecht drei Stege weit.' },
    { id: 'fisch2',  name: 'Fisch 2',           img: 'img/fish2-spin.gif',       r: 'uncommon',  min: 45, max: 90,  val: 14, photo: true, say: 'Diesmal mit mehr Budget.', desc: 'Die Fortsetzung. Länger als das Original.' },
    { id: 'spezi2',  name: 'Spezifische Spezifische', img: 'img/spezifisch2.png', r: 'uncommon', clip: [3.17, 4.9],  min: 22, max: 40,  val: 15, say: 'Spezifisch. Spezifisch.', desc: 'Spezifische Spezifische. Gut gekühlt.' },
    { id: 'fisch3',  name: 'Fisch 3',           img: 'img/fish3.gif',            r: 'uncommon',  min: 15, max: 30,  val: 16, photo: true, say: 'WAS?! Wer bist du denn?', desc: 'Hat dich gesehen. Ist sichtlich schockiert.' },
    { id: 'schlamm', name: 'Schlammfisch',      img: 'img/schlammfisch.png',     r: 'uncommon',  min: 20, max: 45,  val: 15, pixel: true, page: 'seiten/schlammfisch.html', say: 'Ich hab mich extra schmutzig gemacht.', desc: 'Wohnt im Schlamm unter dem Steg. Tropft überall hin.' },
    { id: 'gespraech', name: 'Gesprächsfisch', img: 'img/gutes-gespraech.gif', r: 'uncommon', min: 20, max: 40, val: 17, photo: true, page: 'seiten/gespraechsfisch.html', say: 'Gutes Gespräch.', desc: 'Schwimmt ganz nah ran, schaut dich an und beendet das Gespräch.' },
    { id: 'kritzel', name: 'Kritzelfisch',      img: 'img/doodlebob.gif',     r: 'uncommon',  min: 15, max: 35,  val: 16, pixel: true, page: 'seiten/kritzelfisch.html', say: 'Nicht anschauen, ich bin nur eine Skizze!', desc: 'Mit Bleistift hingekritzelt und nie ganz fertig geworden. Zittert leicht.' },
    { id: 'beinfisch', name: 'Beinfisch',       img: 'img/beinfisch.gif',        r: 'uncommon',  min: 15, max: 30,  val: 18, photo: true, page: 'seiten/beinfisch.html', say: 'Ich wollte eigentlich nur kurz spazieren.', desc: 'Hat Beine. Läuft lieber am Ufer entlang als zu schwimmen.' },
    { id: 'spezi1',  name: 'Spezifischer Spezifisch', img: 'img/spezifisch1.png', r: 'rare', clip: [.93, 3.17],      min: 40, max: 70,  val: 38, say: 'Extra Spezi, extra spezifisch.', desc: 'Ein Prachtexemplar mit extra viel Spezi.' },
    { id: 'oel',     name: 'Ölfisch',           img: 'img/oelfisch.png',         r: 'rare',      min: 30, max: 60,  val: 45, pixel: true, page: 'seiten/oelfisch.html', say: 'Ich schillere. Das ist kein Kompliment.', desc: 'Schwarz und ölig, mit Regenbogenschimmer. Kommt nachts raus.', night: 1.8 },
    { id: 'kaugummi', name: 'Kaugummifisch',    img: 'img/fish-smile.gif',    r: 'rare',      min: 15, max: 30,  val: 48, photo: true, page: 'seiten/kaugummifisch.html', say: 'Blubb. Ich klebe jetzt an dir.', desc: 'Rund, grau und zäh wie alter Kaugummi. Lächelt trotzdem.' },
    { id: 'zacken',  name: 'Zackenbarsch',      img: 'img/zackenbarsch.gif',     r: 'rare',      min: 60, max: 120, val: 50, photo: true, page: 'seiten/zackenbarsch.html', say: 'AAAAAH.', desc: 'Reißt das Maul weit auf. Drin wohnt ein kleiner Putzerfisch zur Miete.' },
    { id: 'schuh',   name: 'Schuhfisch',        img: 'img/fih.gif',              r: 'rare',      min: 30, max: 55,  val: 42, say: 'Schöne Schuhe hast du auch.', desc: 'Trägt Schuhe. Warum auch nicht.' },
    { id: 'lo',      name: 'Lo',                img: 'img/lo.gif',               r: 'rare',      min: 80, max: 160, val: 55, say: 'Ich bin nicht klein, ich bin kompakt.', desc: 'Ein kleiner Hai. Beißt nur weit draußen.', far: .55 },
    { id: 'wiiaro',  name: 'Wii-Arowana',       img: 'img/wii-arowana.png',      r: 'wii',       min: 60, max: 110, val: 75, page: 'seiten/wii-arowana.html', say: 'Schuppen in Lila. Steht mir.', desc: 'Blauer Kopf, lila Schuppen, gelbe Barteln. Sehr stolz darauf.', far: .35 },
    { id: 'wiihecht', name: 'Wii-Hecht',        img: 'img/wii-hecht.png',        r: 'wii',       min: 50, max: 95,  val: 70, page: 'seiten/wii-hecht.html', say: 'Meine Nase ist nicht lang. Der Rest ist kurz.', desc: 'Getigert in Orange und Grün, mit einer Nase wie ein Stock.', far: .3 },
    { id: 'wiiblau', name: 'Wii-Blaufisch',     img: 'img/wii-blau.png',         r: 'wii',       min: 8,  max: 15,  val: 40, page: 'seiten/wii-blaufisch.html', say: 'Blau-gelb ist eine Lebenseinstellung.', desc: 'Klein, rund, gelb oben und blau gestreift.' },
    { id: 'wiitupf', name: 'Wii-Tupfenfisch',   img: 'img/wii-tupfen.png',       r: 'wii',       min: 8,  max: 15,  val: 40, page: 'seiten/wii-tupfenfisch.html', say: 'Die Punkte sind echt. Nicht anfassen.', desc: 'Braun gepunktet mit weißem Bauch. Schaut immer etwas überrascht.' },
    { id: 'wiigruen', name: 'Wii-Grünling',     img: 'img/wii-gruen.png',        r: 'wii',       min: 8,  max: 15,  val: 40, page: 'seiten/wii-gruenling.html', say: 'Halb grün, halb weiß, ganz glücklich.', desc: 'Vorne weiß, hinten grün getupft. Grinst gern.' },
    { id: 'wiirot',  name: 'Wii-Rotling',       img: 'img/wii-rot.png',          r: 'wii',       min: 8,  max: 15,  val: 40, page: 'seiten/wii-rotling.html', say: 'Ich bin nicht rot, ich bin aufgeregt.', desc: 'Leuchtend rot mit dunklen Flecken. Immer ein bisschen aufgeregt.' },
    { id: 'lippe',   name: 'Lippenfisch',       img: 'img/lippenfisch-spin.gif', r: 'epic',      min: 30, max: 60,  val: 120, photo: true, say: 'Also … wo fange ich an?', desc: 'Er möchte reden. Er hat viel zu sagen.', night: 2.5 },
    { id: 'travis',  name: 'Travis',            img: 'img/twawis.jpg',           r: 'epic',      min: 35, max: 65,  val: 140, photo: true, say: 'Jetzt bin ich da.', desc: 'Jetzt kommt Travis.', far: .4, sound: 'sounds/jetzt-kommt-travis.mp3' },
    { id: 'blob',    name: 'Blobfisch',         img: 'img/blobfisch.gif',        r: 'epic',      min: 25, max: 40,  val: 130, photo: true, page: 'seiten/blobfisch.html', say: 'Hier oben ist mir der Druck zu wenig.', desc: 'Lebt eigentlich tief unten. Nur weit draußen und am liebsten nachts.', far: .5, night: 2 },
    { id: 'spee',    name: 'Spee Zierfisch',    img: 'img/spee-zierfisch.png',   r: 'epic',      min: 6,  max: 9,   val: 110, clip: [12.63, 13.9], say: 'Riech mal. Frühlingsfrisch!', desc: 'Ein Zierfisch, frisch gewaschen. Duftet nach Spee.', night: 1.5 },
    { id: 'spees',   name: 'Spezifische Spee Zierfische', img: 'img/spee-zierfische.png', r: 'epic', min: 12, max: 18, val: 160, clip: [13.9, 16.43], say: 'Wir bleiben zusammen!', desc: 'Zwei auf einmal. Spezifischer geht es kaum.', far: .5 },
    { id: 'fischer', name: 'Spezifischfischer', img: 'img/spezifischfischer-cut.png', r: 'legendary', min: 175, max: 190, val: 400, clip: [16.43, null], say: 'Moment … ich bin doch der Fischer!', desc: 'Der spezifische Spezifischfischer fischt spezifische Spezifische. Jetzt hast du ihn gefischt.', far: .45, hint: 'Steht am Steg. Fischt man ihn auch?' },
    { id: 'odfisch', name: 'Absolute Odfisch',  img: 'img/odfish.jpg',           r: 'legendary', min: 170, max: 190, val: 500, photo: true, say: 'Absolut.', desc: 'Absolute Legende. Nur nachts, nur weit draußen.', far: .6, night: 4, dayOff: true },
    { id: 'katze',   name: 'Katzenfisch',       img: 'img/katzenfisch.png',  r: 'legendary', min: 40, max: 70,  val: 450, photo: true, page: 'seiten/katzenfisch.html', say: 'Miau. Ich meine: Blubb.', desc: 'Halb Katze, halb Fisch, ganz flauschig. Kommt lieber nachts.', far: .4, night: 2.5 },
    { id: 'uhrzeit', name: 'UhrZeitFisch',      img: 'img/uhrzeitfisch.gif', r: 'legendary', min: 160, max: 190, val: 480, photo: true, page: 'seiten/uhrzeitfisch.html', say: 'Ich bin pünktlich. Seit 66 Millionen Jahren.', desc: 'Ein Fisch aus der Urzeit, sehr cool. Beißt nur zur vollen Stunde.', fullHour: true, hint: 'Beißt nur zur vollen Stunde' },
    { id: 'ratte',   name: 'Ratte',             img: 'img/rat.gif',              r: 'junk',      min: 18, max: 28,  val: 1,  say: 'Lass mich, ich hab Termine.', desc: 'Nass und beleidigt. Läuft trotzdem weiter.' },
    { id: 'tisch',   name: 'Tisch',             img: 'img/tisch.gif',            r: 'junk',      min: 90, max: 140, val: 3,  photo: true, say: 'Ich bin ein Tisch.', desc: 'Ein Tisch. Kein Fisch. Aber fast.' },
    { id: 'flasche', name: 'Spezi-Flasche',     img: 'img/spezi-flasche.png',    r: 'junk',      min: 25, max: 33,  val: 4,  say: 'Pfand gibt’s keins.', desc: 'Leer. Gehört bestimmt dem Spezifischfischer.' },
    { id: 'pinguine', name: 'Rotierende Pinguine', img: 'img/rotierendepinguine.gif', r: 'junk', min: 60, max: 75, val: 25, photo: true, page: 'seiten/pinguine.html', say: 'Wir drehen uns, also sind wir.', desc: 'Vier Pinguine, rotierend. Selten. Wie kommen die hier rein?', rareJunk: true },
  ];

  const RODS = [
    { id: 'stock',  name: 'Stock mit Schnur', price: 0,    cast: .55, reel: 1.0,  tens: 1.0,  luck: 1,   desc: 'Hat schon Opa benutzt.' },
    { id: 'bambus', name: 'Bambusrute',       price: 60,   lvl: 2,  cast: .75, reel: 1.25, tens: .85,  luck: 1,   desc: 'Wirft weiter, kurbelt schneller.' },
    { id: 'carbon', name: 'Carbonrute',       price: 260,  lvl: 5,  cast: .92, reel: 1.5,  tens: .7,   luck: 1.15, desc: 'Leicht, stark, weit.' },
    { id: 'gold',   name: 'Goldene Rute',     price: 900,  lvl: 9,  cast: 1.0, reel: 1.85, tens: .55,  luck: 1.4, desc: 'Glänzt. Fische lieben Glanz.' },
    { id: 'regen',  name: 'Regenbogenrute',   price: 2500, reb: 1, cast: 1.0, reel: 2.2,  tens: .48,  luck: 1.7, desc: 'Nur für Wiedergeborene. Schillert in allen Farben.' },
    { id: 'stern',  name: 'Sternenrute',      price: 6000, reb: 3, cast: 1.0, reel: 2.6,  tens: .4,   luck: 2.1, desc: 'Aus einer Sternschnuppe geschnitzt.' },
  ];
  const BAITS = [
    { id: 'wurm',   name: 'Wurm',          price: 0,  pack: 0, luck: 1,   speed: 1,   desc: 'Unbegrenzt. Wurmig.' },
    { id: 'spezi',  name: 'Spezi-Köder',   price: 12, pack: 5, luck: 1.7, speed: 1.35, desc: '5 Stück. Seltene Fische beißen öfter.' },
    { id: 'glitzer', name: 'Glitzerköder', price: 35, pack: 5, lvl: 4, luck: 2.8, speed: 1.6, desc: '5 Stück. Für die ganz großen Fänge.' },
    { id: 'wiik',   name: 'Wii-Köder',     price: 30, pack: 5, lvl: 3, luck: 1.5, speed: 1.4, wii: 2, img: 'img/wii-bait.png', desc: '5 Stück. Zeigt auf die Wii-Fische. Die beißen doppelt so oft.' },
    { id: 'mond',   name: 'Mondköder',     price: 90, pack: 5, reb: 2, luck: 4.2, speed: 2,  desc: '5 Stück. Leuchtet. Legenden können nicht widerstehen.' },
  ];
  // Mysteryboxen: bought at the kiosk or found on the hook now and then. Opening one rolls a prize.
  const BOXES = [
    { id: 'boxwood',   name: 'Holzkiste',   price: 120,  tier: 0, desc: 'Knarzt und riecht nach Steg. Drin ist … irgendwas.', col: ['#a0662f', '#6b3a1f', '#fbbf24'] },
    { id: 'boxsilver', name: 'Silberkiste', price: 450,  tier: 1, lvl: 4, desc: 'Schwer und kühl. Klappert vielversprechend.', col: ['#cbd5e1', '#64748b', '#38bdf8'] },
    { id: 'boxgold',   name: 'Goldkiste',   price: 1500, tier: 2, lvl: 8, desc: 'Glänzt so sehr, dass die Fische neidisch werden.', col: ['#facc15', '#b45309', '#f472b6'] },
  ];
  trAll(BOXES, ['name', 'desc']);
  trAll(Object.values(RARITY), ['label']); trAll(FISH, ['name', 'say', 'desc', 'hint']); trAll(RODS, ['name', 'desc']); trAll(BAITS, ['name', 'desc']);

  // ------------------------------------------------------------------ save
  const SAVE_KEY = 'fischen-save-v1';
  const save = Object.assign({
    coins: 0, rod: 'stock', rods: ['stock'], bait: 'wurm', baits: { wurm: Infinity },
    dex: {}, total: 0, sound: true, seen: false,
    boxes: {}, dexClaimed: [], lvl: 1, xp: 0, daily: { d: '', n: 0 }, bestStreak: 0, rebirths: 0, scales: 0, perks: {}, quests: [], questsDone: 0, lifeCoins: 0, totalEarned: 0,
  }, load());
  save.baits.wurm = Infinity;
  function load() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
  }
  let saveOk = true;
  let leaving = false; // set when the save is replaced or wiped, so nothing writes it back on unload
  let lastJson = ''; // what was last written, without the time stamp, so unchanged saves are skipped
  function persist() {
    if (leaving) return;
    try {
      const d = saveData(); delete d.saved;
      const json = JSON.stringify(d);
      if (json === lastJson && saveOk) return;
      save.saved = Date.now(); d.saved = save.saved;
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      lastJson = json;
      if (!saveOk) { saveOk = true; }
      flashSaved();
    } catch {
      // storage blocked or full: keep playing, tell the player once
      if (saveOk) { saveOk = false; setTimeout(() => toast(tr('Speichern nicht möglich – Fortschritt geht beim Schließen verloren.')), 0); }
    }
  }
  function saveData() {
    const s = { ...save, baits: { ...save.baits } };
    delete s.baits.wurm;
    return s;
  }
  const rod = () => RODS.find(r => r.id === save.rod) || RODS[0];
  const bait = () => BAITS.find(b => b.id === save.bait) || BAITS[0];

  // ------------------------------------------------------------------ dom
  const $ = id => document.getElementById(id);
  const cv = $('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = 384, H = 216; // world units; the canvas is 2x for finer pixel art
  const HORIZON = 92, SURFACE = 103, DOCK_Y = 98, DOCK_END = 116;

  // ------------------------------------------------------------------ audio
  let ac = null;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type = 'sine', vol = .15, slide = 0) {
    if (!save.sound) return;
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  }
  function noise(dur, vol = .25, freq = 900) {
    if (!save.sound) return;
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  const sfx = {
    splash: () => noise(.35, .3, 1100),
    plip: () => tone(900, .08, 'sine', .12, -400),
    bite: () => { noise(.2, .35, 1600); tone(520, .15, 'square', .06, 300); },
    tick: () => tone(1400 + Math.random() * 200, .03, 'square', .03),
    snap: () => { tone(1800, .25, 'sawtooth', .08, -1500); noise(.15, .2, 3000); },
    coin: () => { tone(988, .08, 'square', .06); setTimeout(() => tone(1319, .18, 'square', .06), 80); },
    whoosh: () => noise(.25, .12, 2400),
  };
  // One shared voice track; each Spezifisch catch says its own words.
  let voice = null, voiceEnd = null;
  function playClip([from, to]) {
    if (!save.sound) return;
    try {
      if (!voice) {
        voice = new Audio('sounds/spezifischfischer.mp3'); voice.preload = 'auto';
        voice.addEventListener('timeupdate', () => { if (voiceEnd !== null && voice.currentTime >= voiceEnd) voice.pause(); });
      }
      voiceEnd = to; voice.currentTime = from; voice.play().catch(() => {});
    } catch { /* ignore */ }
  }
  function playFile(src) {
    if (!save.sound) return;
    try { const a = new Audio(src); a.volume = .8; a.play().catch(() => {}); } catch { /* ignore */ }
  }

  // ------------------------------------------------------------------ sprites
  // Swimming silhouettes come from the site's pixel fish icon.
  const icon = new Image();
  icon.src = 'img/fish-icon.png';
  let silL = null, silR = null;
  icon.onload = () => {
    const make = flip => {
      const c = document.createElement('canvas'); c.width = c.height = 48;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.translate(24, 24); if (flip) x.scale(-1, 1); x.rotate(-Math.PI / 4);
      x.drawImage(icon, -22, -22, 44, 44);
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#04263a'; x.fillRect(0, 0, 48, 48);
      return c;
    };
    silL = make(false); silR = make(true);
  };
  // Preload catch images so the reveal is instant
  FISH.forEach(f => { const i = new Image(); i.src = f.img; });

  // ------------------------------------------------------------------ world
  const DAY_LENGTH = 300; // seconds for a full day
  let time = 0.3;         // 0..1, 0.25 = morning, 0.5 = noon, 0.75 = evening
  let t = 0;              // seconds running
  const isNight = () => time < .2 || time > .82;

  const player = { x: 90, dir: 1, walk: 0 };
  const keys = {};
  const fishes = [];
  for (let i = 0; i < 9; i++) fishes.push(newSwimmer());
  function newSwimmer() {
    return {
      x: 120 + Math.random() * (W - 120), y: SURFACE + 14 + Math.random() * (H - SURFACE - 24),
      vx: (Math.random() < .5 ? -1 : 1) * (6 + Math.random() * 10), s: .55 + Math.random() * .6,
      phase: Math.random() * 6, a: .25 + Math.random() * .25,
    };
  }
  const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * (HORIZON - 10), Math.random()]);
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 90 + Math.random() * 40, y: 12 + Math.random() * 40, w: 24 + Math.random() * 30, v: 2 + Math.random() * 3 }));
  const particles = [];
  const ripples = [];

  // ------------------------------------------------------------------ fishing state
  // idle | charge | fly | wait | bite | reel | show
  let state = 'idle';
  let power = 0, powerDir = 1;
  const bob = { x: 0, y: 0, vx: 0, vy: 0, dunk: 0, landX: 0 };
  let waitT = 0, nibbles = 0, nibbleT = 0, biteT = 0;
  let approacher = null;
  let hooked = null;
  const reel = { tension: 0, progress: 0, thrash: 0, thrashT: 0, slack: 0 };
  let holding = false;

  function rodTip() {
    const px = Math.round(player.x), d = player.dir;
    if (state === 'charge') return { x: px - d * 10, y: DOCK_Y - 26 };
    if (state === 'reel') return { x: px + d * 14, y: DOCK_Y - 22 + Math.sin(t * 30) * reel.tension * 1.5 };
    return { x: px + d * 15, y: DOCK_Y - 24 };
  }

  function castDistance() { return Math.max(0, Math.min(1, (bob.landX - DOCK_END) / (W - DOCK_END - 10))); }

  function startCharge() {
    player.dir = 1;
    state = 'charge'; power = 0; powerDir = 1; hint('');
  }
  function release() {
    const tip = rodTip();
    const reach = rod().cast * (W - DOCK_END - 20);
    bob.landX = Math.min(W - 10, Math.max(DOCK_END + 8, player.x + 26 + power * reach));
    bob.x = tip.x; bob.y = tip.y;
    const flight = .55 + power * .5;
    bob.vx = (bob.landX - bob.x) / flight;
    bob.vy = -70 - power * 60;
    bob.g = 2 * (SURFACE - bob.y - bob.vy * flight) / (flight * flight);
    state = 'fly'; sfx.whoosh();
  }
  function land() {
    state = 'wait'; bob.y = SURFACE; bob.dunk = 0;
    splash(bob.x, SURFACE, 10, '#bfe9ff'); ripple(bob.x); sfx.splash();
    waitT = (2.5 + Math.random() * 6) / bait().speed * (1 - .08 * perk('biss'));
    nibbles = Math.floor(Math.random() * 3); nibbleT = waitT - 1.2;
    approacher = null;
    hint(tr('Warten …'), 1.2);
  }
  function retract(msg) {
    // a fish that was on the line darts away
    if (approacher && (state === 'bite' || state === 'reel')) approacher.vx = 35 + Math.random() * 15;
    state = 'idle'; hooked = null; approacher = null; $('reel').hidden = true;
    if (msg) hint(msg, 1.8);
  }

  function pickFish() {
    const d = castDistance(), night = isNight(), b = bait(), r = rod();
    const luck = b.luck * r.luck * (1 + .08 * perk('glueck')) * (dexPerk('luck10') ? 1.1 : 1);
    const fullHour = (time * 24) % 1 < 1 / 6; // the clock shows xx:00
    const pool = FISH.filter(f => !(f.far && d < f.far) && !(f.dayOff && !night) && !(f.fullHour && !fullHour));
    const weights = pool.map(f => {
      let w = RARITY[f.r].w;
      const n = pool.filter(g => g.r === f.r).length; w /= n;
      if (f.r === 'common') w *= 1.3 - d * .6;
      if (f.r === 'rare') w *= (1 + d) * luck;
      if (f.r === 'wii') w *= (1 + d) * luck * (b.wii || 1);
      if (f.r === 'epic') w *= (1 + 2 * d) * luck * luck;
      if (f.r === 'legendary') w *= (1 + 3 * d) * luck * luck;
      if (f.r === 'junk') w *= f.rareJunk ? .12 * luck : 1 / luck;
      if (f.night) w *= night ? f.night : .5;
      return w;
    });
    let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { roll -= weights[i]; if (roll <= 0) return pool[i]; }
    return pool[0];
  }

  function hook() {
    const f = pickFish();
    // bait gets used up on a hook attempt
    if (save.bait !== 'wurm') {
      save.baits[save.bait] = (save.baits[save.bait] || 1) - 1;
      if (save.baits[save.bait] <= 0) { delete save.baits[save.bait]; save.bait = 'wurm'; toast(tr('Köder aufgebraucht – zurück zum Wurm.')); }
      persist(); updateGear();
    }
    const skew = Math.pow(Math.random(), 1.6);
    hooked = { f, size: Math.round(f.min + (f.max - f.min) * skew), str: STRENGTH[f.r] };
    Object.assign(reel, { tension: .15, progress: .22, thrash: 0, thrashT: 1 + Math.random(), slack: 0, maxT: 0 });
    state = 'reel'; $('reel').hidden = false; hint('');
    sfx.bite(); splash(bob.x, SURFACE, 14, '#ffffff');
  }

  function land_catch() {
    const { f } = hooked;
    const mut = rollMutation(f);
    const shiny = rollShiny();
    const size = mut ? Math.max(1, Math.round(hooked.size * mut.size)) : hooked.size;
    if (approacher) {
      const i = fishes.indexOf(approacher), n = newSwimmer();
      n.x = W + 5; n.vx = -Math.abs(n.vx);
      fishes[i] = n; approacher = null;
    }
    const base = Math.max(0, Math.min(1, (hooked.size - f.min) / (f.max - f.min || 1)));
    const val = Math.max(1, Math.round(f.val * (0.7 + .6 * base) * coinMult() * (mut ? mut.val : 1) * (shiny ? SHINY_VAL : 1)));
    const first = !save.dex[f.id];
    const e = save.dex[f.id] || { n: 0, best: 0 };
    e.n++; e.best = Math.max(e.best, size); save.dex[f.id] = e;
    let newMut = false;
    if (mut) { e.muts = e.muts || {}; newMut = !e.muts[mut.id]; e.muts[mut.id] = (e.muts[mut.id] || 0) + 1; }
    let newShiny = false;
    if (shiny) { e.shiny = (e.shiny || 0) + 1; newShiny = e.shiny === 1; }
    save.coins += val; save.total++; save.lifeCoins += val; save.totalEarned += val;
    const gain = progressCatch(f, size, val, first, mut, newMut, reel.maxT < .7, shiny, newShiny);
    bealinEvent({ type: 'catch', f, size, mut, clean: reel.maxT < .7, night: darkness() > .5 });
    if (f.r !== 'junk') { // now and then a mystery box hangs on the line too
      const r = Math.random(), found = r < .002 ? BOXES[2] : r < .01 ? BOXES[1] : r < .035 ? BOXES[0] : null;
      if (found) { save.boxes[found.id] = (save.boxes[found.id] || 0) + 1; setTimeout(() => toast(tr('📦 Am Haken hing noch eine {b}! Öffnen im Laden.', { b: found.name })), 1600); }
    }
    setTimeout(() => lbSubmit(), 3000);
    if (dexClaimable().length) { updateDexBadge(); if (first || newMut || newShiny) toast(tr('📖 Fischdex-Belohnung bereit!')); }
    persist(); updateCoins();
    splash(bob.x, SURFACE, 22, '#ffffff');
    state = 'show'; $('reel').hidden = true; holding = false; hint('');
    const reveal = () => {
      showCatch(f, size, val, first, mut, newMut, gain, shiny, newShiny);
      if (f.clip) playClip(f.clip); else if (f.sound) playFile(f.sound); else playFile('sounds/fish.mp3');
      sfx.coin();
    };
    const fx = FANFARE[f.r] || (mut && { label: `${mut.name.toUpperCase()}!`, c: mut.c, hi: '#ffffff', dur: 1.1, notes: [659, 880, 1175] })
      || (shiny && { label: tr('SHINY!'), c: '#fde047', hi: '#ffffff', dur: 1.2, notes: [1047, 1319, 1568, 2093] });
    if (shiny) {
      floaters.push({ x: bob.x, y: SURFACE - 34, text: newShiny ? tr('💫 Neuer Shiny!') : tr('💫 Shiny!'), c: '#fde047', life: 2.6 });
      for (let i = 0; i < 40; i++) glints.push({ x: bob.x + (Math.random() - .5) * 24, y: SURFACE - Math.random() * 10, vx: (Math.random() - .5) * 40, vy: -25 - Math.random() * 45, life: .8 + Math.random(), c: ['#fde047', '#ffffff', '#f9a8d4', '#a5f3fc'][i % 4] });
      [1568, 2093, 2637].forEach((n, i) => setTimeout(() => tone(n, .12, 'sine', .06), 600 + i * 90));
    }
    floaters.push({ x: bob.x, y: SURFACE - 14, text: `${mut ? mut.icon + ' ' : ''}${fx ? '' : f.name + ' · '}${size} cm`, c: mut ? mut.c : fx ? fx.c : '#ffffff', life: 2.4 });
    if (mut && FANFARE[f.r]) floaters.push({ x: bob.x, y: SURFACE - 24, text: `${mut.icon} ${mut.name}`, c: mut.c, life: 2.4 });
    floaters.push({ x: bob.x, y: SURFACE - 4, text: tr('+{n} EP', { n: gain.xp }) + (streak > 1 ? ` · 🔥${streak}` : ''), c: '#86efac', life: 2.4 });
    if (fx && !reduceMotion) {
      fanfare = { ...fx, r: FANFARE[f.r] ? f.r : 'rare', x: bob.x, t: 0, done: reveal };
      fx.notes.forEach((n, i) => setTimeout(() => tone(n, .18, 'triangle', .09), i * 110));
      if (f.r === 'legendary') setTimeout(() => tone(1568, .6, 'sine', .07, 400), fx.notes.length * 110);
    } else reveal();
  }

  // ------------------------------------------------------------------ mutations
  // A catch can come out mutated: changes its look, size and value. Luck helps.
  const MUTATIONS = [
    { id: 'riesig',  name: 'Riesig',      icon: '🦣', c: '#fb923c', w: 6,   size: 1.7, val: 2,   desc: 'Viel zu groß geraten.' },
    { id: 'winzig',  name: 'Winzig',      icon: '🔬', c: '#a3e635', w: 5,   size: .45, val: 1.6, desc: 'Passt in eine Streichholzschachtel.' },
    { id: 'albino',  name: 'Albino',      icon: '🤍', c: '#f1f5f9', w: 3,   size: 1,   val: 3,   desc: 'Ganz ohne Farbe.' },
    { id: 'leucht',  name: 'Leuchtend',   icon: '💡', c: '#67e8f9', w: 2.5, size: 1,   val: 3.5, desc: 'Leuchtet nachts besonders oft.', night: 2.5 },
    { id: 'schatten', name: 'Schattenhaft', icon: '🌑', c: '#818cf8', w: 1.5, size: 1.1, val: 4, desc: 'Nur nachts. Kaum zu sehen.', nightOnly: true },
    { id: 'golden',  name: 'Golden',      icon: '🪙', c: '#fbbf24', w: 1.5, size: 1,   val: 6,   desc: 'Pures Fischgold.' },
    { id: 'regen',   name: 'Regenbogen',  icon: '🌈', c: '#f472b6', w: .5,  size: 1.2, val: 12,  desc: 'Schimmert in allen Farben. Extrem selten.' },
  ];
  trAll(MUTATIONS, ['name', 'desc']);
  // Shinys: any catch can rarely come out shiny (other colours, sparkles, triple value).
  // They are collected in the Shinydex. Luck from rod and bait helps a little.
  const SHINY_BASE = 1 / 100, SHINY_VAL = 3;
  // each fish gets its own shiny colour (green, teal, cyan, blue, purple or pink), never gold
  const SHINY_HUES = [90, 140, 180, 220, 260, 300];
  function shinyHue(id) { return SHINY_HUES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % SHINY_HUES.length]; }
  function shinyChance() { return Math.min(.05, SHINY_BASE * Math.sqrt(bait().luck * rod().luck) * (dexPerk('shiny2') ? 2 : 1)); }
  function rollShiny() {
    if (window.__fischen && window.__fischen.forceShiny) return true;
    return Math.random() < shinyChance();
  }
  function mutLuck() { return Math.sqrt(bait().luck * rod().luck) * (1 + .08 * perk('glueck')) * (dexPerk('mutchance') ? 1.25 : 1); }
  function rollMutation(f) {
    if (f.r === 'junk') return null;
    const forced = window.__fischen && window.__fischen.forceMut;
    if (forced) return MUTATIONS.find(m => m.id === forced);
    const night = isNight();
    const pool = MUTATIONS.filter(m => !(m.nightOnly && !night));
    const ws = pool.map(m => m.w * (m.night && night ? m.night : 1) / 150 * mutLuck());
    let roll = Math.random();
    for (let i = 0; i < pool.length; i++) { roll -= ws[i]; if (roll < 0) return pool[i]; }
    return null;
  }

  // ------------------------------------------------------------------ rare catch fanfare
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FANFARE = {
    rare:      { label: tr('SELTEN!'),   c: '#38bdf8', hi: '#e0f2fe', dur: 1.0, notes: [523, 659, 784] },
    wii:       { label: tr('WII!'),      c: '#5ccdf6', hi: '#ffffff', dur: 1.2, notes: [659, 784, 988, 1319] },
    epic:      { label: tr('EPISCH!'),   c: '#c084fc', hi: '#f3e8ff', dur: 1.4, notes: [523, 659, 784, 1047] },
    legendary: { label: tr('LEGENDÄR!'), c: '#fbbf24', hi: '#fffbeb', dur: 2.0, notes: [392, 523, 659, 784, 1047, 1319] },
  };
  let fanfare = null;
  const floaters = [], glints = [];
  function updateFx(dt) {
    for (let i = floaters.length - 1; i >= 0; i--) { const fl = floaters[i]; fl.y -= 9 * dt; fl.life -= dt; if (fl.life <= 0) floaters.splice(i, 1); }
    for (let i = glints.length - 1; i >= 0; i--) { const g = glints[i]; g.x += g.vx * dt; g.y += g.vy * dt; g.life -= dt; if (g.life <= 0) glints.splice(i, 1); }
    if (!fanfare) return;
    const F = fanfare; F.t += dt;
    const rate = { rare: 25, wii: 35, epic: 45, legendary: 80 }[F.r];
    for (let n = 0; n < rate * dt + Math.random(); n++) {
      glints.push({ x: F.x + (Math.random() - .5) * (F.r === 'legendary' ? 60 : 30), y: SURFACE - Math.random() * 6, vx: (Math.random() - .5) * 14, vy: -20 - Math.random() * 40, life: .8 + Math.random() * .8, c: Math.random() < .3 ? F.hi : F.c });
    }
    if (F.t >= F.dur) { fanfare = null; F.done(); }
  }
  function star(x, y, s, c) { // little 4-point twinkle
    px(x - s, y, s * 2 + .5, .5, c); px(x, y - s, .5, s * 2 + .5, c);
  }
  function drawFx() {
    const F = fanfare;
    if (F) {
      const k = Math.min(1, F.t / .3), out = Math.max(0, (F.t - F.dur + .3) / .3);
      const a = k * (1 - out);
      const x = snap(F.x);
      // rotating rays (epic + legendary)
      if (F.r !== 'rare') {
        ctx.save(); ctx.translate(x, SURFACE); ctx.rotate(t * (F.r === 'legendary' ? .9 : .5));
        ctx.globalAlpha = a * .22; ctx.fillStyle = F.c;
        const rays = F.r === 'legendary' ? 12 : 8, len = 140 * k;
        for (let i = 0; i < rays; i++) {
          const a0 = i / rays * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a0 - .09) * len, Math.sin(a0 - .09) * len);
          ctx.lineTo(Math.cos(a0 + .09) * len, Math.sin(a0 + .09) * len); ctx.fill();
        }
        ctx.restore();
      }
      // light pillar out of the water
      const pw = snap((F.r === 'legendary' ? 14 : F.r === 'epic' ? 10 : 7) * k + Math.sin(t * 20) * .5);
      ctx.globalAlpha = a * .35; px(x - pw / 2, 0, pw, SURFACE, F.c);
      ctx.globalAlpha = a * .6; px(x - pw / 4, 0, snap(pw / 2), SURFACE, F.hi);
      // expanding rings on the surface
      ctx.strokeStyle = F.c; ctx.lineWidth = .5;
      for (let i = 0; i < 3; i++) {
        const p = (F.t * 1.2 + i / 3) % 1;
        ctx.globalAlpha = a * (1 - p);
        ctx.beginPath(); ctx.ellipse(x, SURFACE + 1, 4 + p * 40, (4 + p * 40) * .25, 0, 0, 7); ctx.stroke();
      }
      // banner
      const pop = F.t < .35 ? 1 + Math.sin(F.t / .35 * Math.PI) * .35 : 1;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 46); ctx.scale(pop, pop);
      setFont('800 16px Poppins, sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = '#0f172a'; ctx.strokeText(F.label, 0, 0);
      ctx.fillStyle = F.c; ctx.fillText(F.label, 0, 0);
      ctx.fillStyle = F.hi; ctx.globalAlpha = a * (.5 + .5 * Math.sin(t * 12)); ctx.fillText(F.label, 0, -.5);
      ctx.restore(); curFont = ''; // restore() put the old font back
      // legendary: white flash at the start
      if (F.r === 'legendary' && F.t < .25) { ctx.globalAlpha = (1 - F.t / .25) * .7; px(0, 0, W, H, '#fffbeb'); }
      ctx.globalAlpha = 1;
    }
    for (const g of glints) {
      ctx.globalAlpha = Math.min(1, g.life * 2) * (.6 + .4 * Math.sin(t * 25 + g.x));
      star(snap(g.x), snap(g.y), g.life > .6 ? 1.5 : 1, g.c);
    }
    ctx.globalAlpha = 1;
    // floating catch text
    setFont('700 7px Poppins, sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const fl of floaters) {
      ctx.globalAlpha = Math.min(1, fl.life * 1.5);
      ctx.lineWidth = 2; ctx.strokeStyle = '#0f172a'; ctx.strokeText(fl.text, snap(fl.x), snap(fl.y));
      ctx.fillStyle = fl.c; ctx.fillText(fl.text, snap(fl.x), snap(fl.y));
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // ------------------------------------------------------------------ input
  function down() {
    audio();
    if (anyModal()) return;
    holding = true;
    if (state === 'idle') startCharge();
    else if (state === 'wait') retract(tr('Eingeholt. Nichts dran.'));
    else if (state === 'bite') hook();
  }
  function up() {
    holding = false;
    if (state === 'charge') release();
  }
  $('stage').addEventListener('pointerdown', e => {
    if (e.target.closest('button, a, .modal, #hud')) return;
    e.preventDefault();
    const rc = cv.getBoundingClientRect();
    const wx = (e.clientX - rc.left) / rc.width * W, wy = (e.clientY - rc.top) / rc.height * H;
    if (state === 'idle' && !anyModal()) { const p = propAt(wx, wy); if (p) { audio(); hoverProp = null; cv.style.cursor = ''; p.open(); return; } }
    down();
  });
  $('stage').addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || holding) return;
    const rc = cv.getBoundingClientRect();
    const over = !e.target.closest('button, a, .modal, #hud') && (e.target === cv || e.target.id === 'stage');
    hoverProp = over ? propAt((e.clientX - rc.left) / rc.width * W, (e.clientY - rc.top) / rc.height * H) : null;
    cv.style.cursor = hoverProp && state === 'idle' ? 'pointer' : '';
  });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  window.addEventListener('blur', () => { holding = false; for (const k in keys) keys[k] = false; if (state === 'charge') release(); });
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'escape') { closeModals(); return; }
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (!$('title').hidden) { if (k === ' ' || k === 'enter') { e.preventDefault(); $('start').click(); } return; }
    if (!$('catch').hidden) { if (k === ' ' || k === 'enter') { e.preventDefault(); $('catch-ok').click(); } return; }
    if (k === 'f') { toggleModal('dex'); return; }
    if (k === 'l') { toggleModal('shop'); return; }
    if (k === 'c') { toggleModal('casino'); return; }
    if (k === 'p') { toggleModal('prog'); return; }
    if (k === 'b') { toggleModal('lb'); return; }
    if (!$('casino').hidden && (k === ' ' || k === 'enter')) { e.preventDefault(); $('spin').click(); return; }
    if (k === 'm') { $('btn-sound').click(); return; }
    if (anyModal()) return;
    if (/^[1-9]$/.test(k)) { const b = ownedBaits()[+k - 1]; if (b) selectBait(b.id); return; }
    if (k === ' ') { e.preventDefault(); if (!e.repeat) down(); return; }
    keys[k] = true;
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); up(); return; }
    keys[k] = false;
  });

  // ------------------------------------------------------------------ update
  function update(dt) {
    t += dt;
    time = (time + dt / DAY_LENGTH) % 1;

    // walking (only when not busy with the line)
    const left = keys['a'] || keys['arrowleft'], right = keys['d'] || keys['arrowright'];
    if (state === 'idle' && (left || right) && !anyModal()) {
      player.dir = right ? 1 : -1;
      player.x = Math.max(80, Math.min(DOCK_END - 14, player.x + player.dir * 42 * dt));
      player.walk += dt * 10;
    } else player.walk = 0;

    // swimmers
    for (const f of fishes) {
      if (f === approacher) continue;
      f.x += f.vx * dt; f.y += Math.sin(t * .8 + f.phase) * 3 * dt;
      if (f.x < 30 || f.x > W + 10) f.vx *= -1;
      if (Math.random() < dt * .08) f.vx *= -1;
    }
    for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 40) c.x = -c.w - 10; }

    switch (state) {
      case 'charge':
        power += powerDir * dt * 1.1;
        if (power >= 1) { power = 1; powerDir = -1; }
        if (power <= 0) { power = 0; powerDir = 1; }
        break;
      case 'fly':
        bob.x += bob.vx * dt; bob.vy += bob.g * dt; bob.y += bob.vy * dt;
        if (bob.y >= SURFACE && bob.vy > 0) { bob.x = bob.landX; land(); }
        break;
      case 'wait': {
        waitT -= dt;
        bob.dunk *= .9;
        if (!approacher && waitT < 2.2) {
          approacher = fishes.reduce((a, b) => Math.abs(b.x - bob.x) < Math.abs(a.x - bob.x) ? b : a);
        }
        if (approacher) {
          const tx = bob.x + (approacher.x < bob.x ? -8 : 8), ty = SURFACE + 9;
          approacher.x += (tx - approacher.x) * Math.min(1, dt * 2);
          approacher.y += (ty - approacher.y) * Math.min(1, dt * 2);
          approacher.vx = (bob.x - approacher.x) || 1;
        }
        if (nibbles > 0 && waitT < nibbleT) {
          nibbles--; nibbleT = waitT - .5 - Math.random() * .4;
          bob.dunk = 2; ripple(bob.x); sfx.plip();
        }
        if (waitT <= 0) {
          state = 'bite'; biteT = .85;
          bob.dunk = 5; splash(bob.x, SURFACE, 8, '#e0f7ff'); ripple(bob.x); sfx.bite();
          hint(tr('!  JETZT KLICKEN  !'), .9);
        }
        break;
      }
      case 'bite':
        if (approacher) followLine(approacher, dt, 6);
        biteT -= dt;
        bob.dunk = 4 + Math.sin(t * 40);
        if (biteT <= 0) {
          endStreak(); retract(tr('Zu spät! Er ist weg.'));
        }
        break;
      case 'reel':
        if (!approacher) approacher = fishes.reduce((a, b) => Math.abs(b.x - bob.x) < Math.abs(a.x - bob.x) ? b : a);
        followLine(approacher, dt, 12);
        updateReel(dt);
        break;
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.y > SURFACE + 2 && p.vy > 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].r += 14 * dt; ripples[i].life -= dt; if (ripples[i].life <= 0) ripples.splice(i, 1); }
    if (state === 'wait' && Math.random() < dt * .7) ripple(bob.x, .6);

    if (npcTalk > 0) npcTalk -= dt;
    if (bealinTalk > 0) bealinTalk -= dt;
    if (welsTalk > 0) welsTalk -= dt;
    updateFx(dt);
    hintTick(dt);
  }

  // the hooked fish's shadow hangs on the line: it follows the bobber,
  // faces away from the dock while it pulls and whips around when it thrashes
  function followLine(f, dt, k) {
    const th = state === 'reel' && reel.thrash;
    const tx = bob.x + 5 + (th ? Math.sin(t * 22) * 4 : Math.sin(t * 3) * 1.5);
    const ty = SURFACE + 7 + (th ? Math.cos(t * 17) * 2 : 0);
    f.x += (tx - f.x) * Math.min(1, dt * k);
    f.y += (ty - f.y) * Math.min(1, dt * k);
    f.vx = th ? (Math.sin(t * 22) > 0 ? 1 : -1) : 1;
  }

  function updateReel(dt) {
    const r = rod(), h = hooked;
    // fish behaviour: calm phases and thrash bursts
    reel.thrashT -= dt;
    if (reel.thrashT <= 0) {
      if (reel.thrash) { reel.thrash = 0; reel.thrashT = (1.3 + Math.random() * 1.6) / h.str; }
      else if (h.f.r !== 'junk' || Math.random() < .3) { reel.thrash = 1; reel.thrashT = .5 + Math.random() * .7 * h.str; sfx.bite(); }
      else reel.thrashT = 1;
    }
    const pull = h.str * (reel.thrash ? 2.6 : .55);
    if (holding) {
      reel.tension += (0.38 + pull * .75) * r.tens * (1 - .06 * perk('schnur')) * dt;
      const gain = reel.thrash ? .05 : .2;
      reel.progress += gain * r.reel / (.6 + h.str) * dt;
      if (Math.random() < dt * 14) sfx.tick();
    } else {
      reel.tension -= (.75 - pull * .18) * dt;
      reel.progress -= .05 * h.str * (reel.thrash ? 2.2 : 1) * dt;
    }
    reel.tension = Math.max(0, reel.tension);
    reel.maxT = Math.max(reel.maxT || 0, reel.tension);

    if (reel.thrash && Math.random() < dt * 10) splash(bob.x + (Math.random() - .5) * 6, SURFACE, 3, '#ffffff');
    // bobber drifts back toward the dock as you win
    const startX = bob.landX, endX = DOCK_END + 4;
    bob.x = startX + (endX - startX) * Math.max(0, Math.min(1, reel.progress));
    bob.dunk = 3 + (reel.thrash ? Math.sin(t * 50) * 2 : 0);

    $('tension').style.width = Math.min(100, reel.tension * 100) + '%';
    $('progress').style.width = Math.max(0, Math.min(100, reel.progress * 100)) + '%';
    $('reel').classList.toggle('thrash', !!reel.thrash);

    if (reel.tension >= 1) { sfx.snap(); retract(tr('Schnur gerissen! 💥') + lostXp(h.f)); bealinEvent({ type: 'lost' }); return; }
    if (reel.progress <= 0) { retract(tr('Entkommen …') + lostXp(h.f)); bealinEvent({ type: 'lost' }); return; }
    if (reel.progress >= 1) land_catch();
  }

  // ------------------------------------------------------------------ effects
  function splash(x, y, n, color) {
    for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - .5) * 60, vy: -40 - Math.random() * 60, life: 1, c: color });
  }
  function ripple(x, life = 1.2) { ripples.push({ x, r: 2, life, max: life }); }

  // ------------------------------------------------------------------ draw
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix = (c1, c2, k) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], k))).join(',')})`;
  const SKY = {
    nightTop: [8, 12, 34], nightBot: [30, 41, 82],
    dawnTop: [92, 110, 190], dawnBot: [250, 170, 130],
    dayTop: [76, 160, 230], dayBot: [178, 226, 250],
    duskTop: [70, 55, 130], duskBot: [250, 130, 90],
  };
  function skyColors() {
    // keyframes across the day
    const k = [
      [0, 'night'], [.18, 'night'], [.25, 'dawn'], [.33, 'day'], [.7, 'day'], [.78, 'dusk'], [.85, 'night'], [1, 'night'],
    ];
    let i = 0; while (time > k[i + 1][0]) i++;
    const [t0, a] = k[i], [t1, b] = k[i + 1];
    const f = (time - t0) / (t1 - t0 || 1);
    return [mix(SKY[a + 'Top'], SKY[b + 'Top'], f), mix(SKY[a + 'Bot'], SKY[b + 'Bot'], f), darkness()];
  }
  function darkness() { // 0 day .. 1 night
    if (time < .18 || time > .85) return 1;
    if (time < .3) return 1 - (time - .18) / .12;
    if (time > .73) return (time - .73) / .12;
    return 0;
  }

  const PLAYER_PAL = {"k": "#1b1f2e", "h": "#22c55e", "H": "#15803d", "l": "#86efac", "s": "#f2c9a0", "S": "#d9a47a", "e": "#0f172a", "B": "#7c4a24", "b": "#a0662f", "c": "#f59e0b", "C": "#c2410c", "y": "#fcd34d", "w": "#f8fafc", "p": "#3b4a66", "P": "#26324a", "o": "#5b3a24", "O": "#3a2416", "r": "#e8a87c", "g": "#94a3b8"};
  const PLAYER_BODY = ["........kkkkkk........", ".......khlllhhk.......", "......khhllhhhhk......", "......khhhhhhhhk......", "......khhhhhhhHk......", "...kkkkHHHHHHHHkkkk...", "..kHHHHHHHHHHHHHHHHk..", "...kkkkkkkkkkkkkkkk...", "......kssssssssk......", "......kssssssesk......", "......kSsssssesk......", "......kSssssssrsk.....", "......kSsssssssk......", "......kBBsssBBBk......", "......kBBBBBBBBk......", ".......kBBBBBBk.......", "......kkkcyyckkk......", ".....kcccyccccCCk.....", "....kccccyccccCCCk....", "....kcyccccwcccCCk....", "....kcyccccccccCCk....", "....kcycccccwccCCk....", "....kcyccccccccCCk....", "....kcycccccwccCCk....", "....kcyccccccccCCk....", "....kCCCCCCCCCCCCk....", "....kkpppppppppkkk....", ".....kppppPpppppk.....", ".....kppppkPppppk....."];
  const PLAYER_LEGS = [[".....kpppk.kpppk......", ".....kpppk.kpppk......", ".....kPppk.kPppk......", ".....kPppk.kPppk......", ".....kooook.kooook....", ".....kOOOOk.kOOOOk....", "......kkkk...kkkk....."], [".....kpppk..kpppk.....", "....kpppk....kpppk....", "....kPppk....kPppk....", "...kPppk......kPppk...", "..kooook......kooook..", "..kOOOOk......kOOOOk..", "...kkkk........kkkk..."], ["......kpppk.kpppk.....", "......kpppk.kpppk.....", ".......kPppkkPppk.....", ".......kPppkkPppk.....", "......kooookooook.....", "......kOOOOkOOOOk.....", ".......kkkk.kkkk......"]];

  // Bake a pixel map into a canvas (1 char = 1 fine pixel = 0.5 world units).
  function bake(rows, pal, flip) {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
    const x = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, i) => {
      if (ch === '.') return;
      x.fillStyle = pal[ch]; x.fillRect(flip ? r.length - 1 - i : i, y, 1, 1);
    }));
    return c;
  }
  // hat colour shows how often you have been reborn
  const HATS = [['#22c55e', '#15803d', '#86efac'], ['#38bdf8', '#0369a1', '#bae6fd'], ['#c084fc', '#7e22ce', '#f3e8ff'], ['#fbbf24', '#b45309', '#fef3c7']];
  const hatFrames = [];
  function playerFrames() {
    const tier = Math.min(HATS.length - 1, save.rebirths);
    if (!hatFrames[tier]) {
      const [h, H, l] = HATS[tier], pal = { ...PLAYER_PAL, h, H, l };
      hatFrames[tier] = [false, true].map(flip => PLAYER_LEGS.map(g => bake(PLAYER_BODY.concat(g), pal, flip)));
    }
    return hatFrames[tier];
  }

  const npcImg = new Image(); npcImg.src = 'img/spezifischfischer-pixel.png';
  const NPC = { x: 18, w: 10, h: 22 };
  const NPC_LINES = [['Spezifischfischer!', [5.73, 7.17]], ['Spezifisch.', [0, .93]], ['Spee Zierfisch!', [12.63, 13.9]], ['Spezifische Spezifische.', [3.17, 4.9]]];
  let npcTalk = 0, npcLine = '', npcIdx = 0;
  function talkNpc() {
    const [line, clip] = NPC_LINES[npcIdx++ % NPC_LINES.length];
    npcLine = line; npcTalk = 2.2; playClip(clip);
  }
  // Käpt'n Bealin: an original old angler with a bushy grey beard, a green fishing hat with a
  // lure stuck in it, a red checked shirt and a patched olive vest. He rows his little boat out
  // on the water and is always far too excited about the fishing weather. Click him to chat.
  const BEALIN_PAL = { k: '#1b1f2e', g: '#4d7c0f', G: '#365314', l: '#ef4444', o: '#facc15', s: '#f2c9a0', S: '#d9a47a', e: '#0f172a', b: '#e5e7eb', B: '#9ca3af', r: '#dc2626', R: '#7f1d1d', v: '#6b7a3a', V: '#4a5528', p: '#c8a26a' };
  const BEALIN_BODY = bake([
    '.....kkkkkk.....',
    '....kggggggk....',
    '....kgggglgk....',
    '...kgggggogk....',
    '..kGGGGGGGGGGk..',
    '...kssssssssk...',
    '...ksesssseSk...',
    '...kbsssssbSk...',
    '..kbbbsSSbbbbk..',
    '..kbbbbbbbbbbk..',
    '..kvbbbBbbbbvk..',
    '.kvvrbbbbbbrvvk.',
    '.kvvrRrbbrRrvVss',
    '.kvpvrRrrRrvVVk.',
    'kvvpvrrRRrrvVVVk',
    'kvvvvrRrrRrvVVVk',
    'kVVVVkRrrRkVVVVk',
    'kVVVVkkkkkkVVVVk',
  ], BEALIN_PAL);
  const BEALIN = { x: 322, w: 30, h: 22 };
  // He always says the same thing. Every second chat he lets slip a vague hint about what he
  // secretly wants; doing it (whenever, wherever) pays out and he thinks of something new.
  const BEALIN_SAY = 'Moin! Na, beißen se heute?';
  const BEALIN_WISHES = [
    { id: 'big',   hints: ['Ich träume von etwas Großem.', 'Größer als mein Boot wär übertrieben … aber fast.'], test: e => e.type === 'catch' && e.size >= 80 },
    { id: 'tiny',  hints: ['Manchmal ist weniger mehr. Viel weniger.', 'Was Winziges würde mir das Herz wärmen.'], test: e => e.type === 'catch' && e.f.r !== 'junk' && e.size <= 12 },
    { id: 'mut',   hints: ['Normal kann jeder.', 'Irgendwas an dem Fisch sollte … anders sein.'], test: e => e.type === 'catch' && !!e.mut },
    { id: 'night', hints: ['Der Mond weiß, was ich will.', 'Wenn alle schlafen, beißen die Richtigen.'], test: e => e.type === 'catch' && e.f.r !== 'junk' && e.night },
    { id: 'junk',  hints: ['Nicht alles im Wasser ist ein Fisch.', 'Ich sammle Dinge, die keiner will.'], test: e => e.type === 'catch' && e.f.r === 'junk' },
    { id: 'lost',  hints: ['Manchmal muss man loslassen.', 'Nicht jeder Fang muss gelingen.'], test: e => e.type === 'lost' },
    { id: 'slot',  hints: ['Ich hab so ein klimperndes Gefühl.', 'Das Glück wohnt nicht immer im Wasser.'], test: e => e.type === 'slot' && e.won },
    { id: 'clean', hints: ['Ganz sanft. Ohne Zerren.', 'Die Schnur soll sich nicht anstrengen.'], test: e => e.type === 'catch' && e.clean && e.f.r !== 'junk' },
    { id: 'rare',  hints: ['Ich will was, das nicht jeder hat.', 'Gewöhnlich hatte ich schon genug.'], test: e => e.type === 'catch' && RARITY_ORDER.indexOf(e.f.r) >= RARITY_ORDER.indexOf('epic') },
    { id: 'letter', hints: ['Ich denk die ganze Zeit an ein „{l}“.', 'Da schwimmt was mit „{l}“ …'], test: (e, w) => e.type === 'catch' && e.f.id === w.f },
    { id: 'visit', hints: ['Tagsüber bin ich so schüchtern.', 'Besuch mich mal, wenn man die Sterne sieht.'], test: e => e.type === 'talk' && darkness() > .5 },
    { id: 'chat',  hints: ['Ich mag Gesellschaft. Viel Gesellschaft.', 'Redest du eigentlich gern? Ich schon. Sehr oft.'], test: (e, w) => e.type === 'talk' && (w.p = (w.p || 0) + 1) >= 12 },
  ];
  trAll(BEALIN_WISHES.map(w => w.hints), [0, 1]);
  function newBealinWish() {
    const last = save.bealin && save.bealin.w;
    const pool = BEALIN_WISHES.filter(w => w.id !== last);
    const w = { w: pick(pool).id, n: (save.bealin && save.bealin.n) || 0 };
    if (w.w === 'letter') w.f = pick(FISH.filter(f => ['common', 'uncommon', 'rare'].includes(f.r) && !f.fullHour)).id;
    save.bealin = w;
  }
  function bealinWish() {
    if (!save.bealin || !BEALIN_WISHES.some(w => w.id === save.bealin.w)) newBealinWish();
    return BEALIN_WISHES.find(w => w.id === save.bealin.w);
  }
  function bealinHint() {
    const w = bealinWish(), f = FISH.find(x => x.id === save.bealin.f);
    return pick(w.hints).replace('{l}', f ? f.name[0].toUpperCase() : '?');
  }
  // called from the game whenever something happens; returns true if it fulfilled his wish
  function bealinEvent(e) {
    const w = bealinWish();
    if (!w.test(e, save.bealin)) return false;
    const coins = Math.round((60 + 25 * save.lvl) * coinMult());
    save.coins += coins; save.totalEarned += coins; save.lifeCoins += coins;
    const ep = gainXp(30 + 5 * save.lvl);
    const n = save.bealin.n + 1;
    newBealinWish(); save.bealin.n = n;
    bealinLine = tr('DAS! Genau das wollte ich!'); bealinTalk = 3; bealinAlt = false;
    setTimeout(() => toast(tr('🎣 Käpt\'n Bealin ist glücklich: +{c} Taler · +{e} EP', { c: coins, e: ep })), 400);
    [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => tone(n, .12, 'square', .05), i * 80));
    persist(); updateCoins();
    return true;
  }
  let bealinTalk = 0, bealinLine = '', bealinAlt = false;
  function talkBealin() {
    if (bealinEvent({ type: 'talk' })) return;
    bealinLine = bealinAlt ? bealinHint() : tr(BEALIN_SAY);
    bealinAlt = !bealinAlt;
    bealinTalk = 3;
    persist();
    tone(220, .08, 'square', .08, 60); setTimeout(() => tone(330, .1, 'square', .08, -40), 90);
  }
  function bealinBob() { return Math.sin(t * 1.6) * 1; }
  function drawBealin(dark) {
    const k = '#1b1f2e', x = BEALIN.x, y = SURFACE - 1 + bealinBob();
    const hull = mix([150, 62, 40], [70, 35, 30], dark), hullD = mix([110, 42, 28], [50, 25, 22], dark), rim = mix([222, 200, 160], [100, 92, 80], dark);
    // the old man sits in the middle of the boat
    ctx.drawImage(BEALIN_BODY, snap(x + 10), snap(y - 13), 8, 9);
    // while he talks he waves with his free hand
    if (bealinTalk > 0) { const wv = Math.sin(t * 10) > 0 ? .5 : 0; px(x + 9.5 - wv, y - 10.5, 1.5, 2, k); px(x + 10 - wv, y - 10, .5, 1, '#f2c9a0'); px(x + 9.5 - wv, y - 11.5, 1.5, 1.5, k); px(x + 10 - wv, y - 11, .5, .5, '#f2c9a0'); }
    // his rod points out over the water toward the island, line and red float bobbing
    const rx = x + 17, ry = y - 7, tx = x + 30, ty = y - 18;
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = .75;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(tx, ty); ctx.stroke();
    const fx = tx + 2 + Math.sin(t * .9) * .8, fy = SURFACE + .5 + Math.sin(t * 2.3) * .4;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(fx, fy); ctx.stroke();
    px(fx - .75, fy - 1, 1.5, 1, '#ef4444'); px(fx - .75, fy, 1.5, .5, '#f8fafc');
    // rowboat
    px(x - .5, y - 4.5, 29, 1.5, k); px(x, y - 4, 28, 1, rim);
    px(x + .5, y - 3, 27, 3.5, k); px(x + 1, y - 3, 26, 3, hull); px(x + 1, y - 1, 26, 1, hullD);
    px(x + 2.5, y + .5, 23, 1, k); px(x + 3, y + .5, 22, .5, hullD);
    px(x - 1, y - 6, 2, 3, k); px(x - .5, y - 5.5, 1, 2, rim);
    // oar resting on the side
    px(x + 4, y - 6, 1, 4, '#a0662f'); px(x + 3.5, y - 2, 2, 3, '#a0662f');
    // lantern at the bow lights up at night
    px(x + 26, y - 7.5, 2, 2.5, k); px(x + 26.5, y - 7, 1, 1.5, dark > .3 ? '#fde68a' : '#94a3b8');
    if (dark > .3) { ctx.globalAlpha = (dark - .3) * .35; disc(x + 27, y - 6.5, 6, '#fde68a'); ctx.globalAlpha = 1; }
    // wake ripples around the hull
    ctx.globalAlpha = .45; px(x - 2 + Math.sin(t * 1.6) * .5, y + 1, 3, .5, '#e0f7ff'); px(x + 27 - Math.sin(t * 1.6) * .5, y + 1, 3, .5, '#e0f7ff'); ctx.globalAlpha = 1;
    if (bealinTalk > 0) {
      setFont('6px Poppins, sans-serif');
      const bw = Math.ceil(ctx.measureText(bealinLine).width) + 4, bx = snap(Math.max(1, Math.min(W - bw - 1, x + 14 - bw / 2))), byy = snap(y - 26);
      ctx.globalAlpha = Math.min(1, bealinTalk * 3);
      px(bx - .5, byy - .5, bw + 1, 9, '#0f172a'); px(bx, byy, bw, 8, '#fffbeb'); px(snap(x + 14), byy + 8, 2, 1.5, '#0f172a');
      ctx.fillStyle = '#0f172a'; ctx.textBaseline = 'top';
      ctx.fillText(bealinLine, bx + 2, byy + 1);
      ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    }
  }
  const BOTTLE = bake(['.k.', '.k.', 'kbk', 'bob', 'byb', 'bob', 'kbk'], { k: '#1b1f2e', b: '#6b2d0f', o: '#f97316', y: '#a855f7' });

  let lastBg = '';
  const snap = v => Math.round(v * 2) / 2;
  // setting ctx.font makes some browsers re-parse CSS every time, so only set it when it changes
  let curFont = '';
  function setFont(f) { if (f !== curFont) { ctx.font = f; curFont = f; } }
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { curFont = ''; });
  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(snap(x), snap(y), w, h); }
  // filled pixel circle, row by row on the fine grid. Each size/colour is drawn once
  // into a small sprite and then copied with one drawImage (the row-by-row fillRects
  // were most of the per-frame work). The result is pixel for pixel the same.
  const discCache = new Map();
  function discSprite(r, c) {
    const key = r + '|' + c;
    let sp = discCache.get(key);
    if (sp) return sp;
    const R = snap(r) + .5, rows = [];
    for (let dy = -r; dy <= r; dy += .5) rows.push(snap(Math.sqrt(Math.max(0, r * r - dy * dy))));
    const cv2 = document.createElement('canvas');
    cv2.width = R * 4; cv2.height = Math.max(1, rows.length);
    const g = cv2.getContext('2d'); g.fillStyle = c;
    rows.forEach((hw, k) => g.fillRect((R - hw) * 2, k, hw * 4, 1));
    sp = { cv: cv2, R };
    discCache.set(key, sp);
    return sp;
  }
  function disc(cx, cy, r, c) {
    const { cv: im, R } = discSprite(r, c);
    ctx.drawImage(im, snap(cx) - R, snap(cy - r), im.width / 2, im.height / 2);
  }

  // Sky + sea + island are cached and only redrawn when the light changes.
  const bgC = document.createElement('canvas'); bgC.width = cv.width; bgC.height = cv.height;
  const bg = bgC.getContext('2d'); bg.imageSmoothingEnabled = false; bg.setTransform(2, 0, 0, 2, 0, 0);
  let bgKey = '', bgAt = -1;
  function bands(c, y0, y1, colors) {
    const n = colors.length, bh = (y1 - y0) / n;
    colors.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, snap(y0 + i * bh), W, Math.ceil(bh) + 1); });
    // checker dither on each seam: every other device pixel, drawn as one patterned row each
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i < n; i++) {
      const y = snap(y0 + i * bh) * 2;
      c.fillStyle = ditherPattern(colors[i], 0); c.fillRect(0, y - 1, W * 2, 1);
      c.fillStyle = ditherPattern(colors[i - 1], 1); c.fillRect(0, y, W * 2, 1);
    }
    c.restore();
  }
  // a 2x1 pattern with one coloured pixel (left or right) and one transparent
  const ditherTile = document.createElement('canvas'); ditherTile.width = 2; ditherTile.height = 1;
  const ditherCtx = ditherTile.getContext('2d');
  function ditherPattern(col, off) {
    ditherCtx.clearRect(0, 0, 2, 1); ditherCtx.fillStyle = col; ditherCtx.fillRect(off, 0, 1, 1);
    return bg.createPattern(ditherTile, 'repeat');
  }
  function renderBg(top, bot, dark) {
    const skyTop = top.match(/\d+/g).map(Number), skyBot = bot.match(/\d+/g).map(Number);
    bands(bg, 0, HORIZON, Array.from({ length: 9 }, (_, i) => mix(skyTop, skyBot, i / 8)));
    const w0 = [[70, 165, 210], [16, 44, 86]], w1 = [[8, 40, 80], [4, 10, 28]];
    const wa = w0.map((c, i) => c.map((v, j) => lerp(v, w0[1][j], dark)))[0];
    const wb = w1.map((c, i) => c.map((v, j) => lerp(v, w1[1][j], dark)))[0];
    bands(bg, HORIZON, H, Array.from({ length: 10 }, (_, i) => mix(wa, wb, Math.pow(i / 9, .8))));
    // island: rolling hill, pines, rocks, lighthouse
    const hill = mix([74, 122, 84], [16, 28, 40], dark), hillD = mix([52, 92, 66], [12, 20, 32], dark), hillL = mix([120, 170, 96], [22, 36, 48], dark);
    for (let x = 246; x <= 356; x += .5) {
      const k = (x - 246) / 110, h = 15 * Math.pow(Math.sin(Math.PI * k), .7) + Math.sin(x * .6) * .6;
      bg.fillStyle = hill; bg.fillRect(x, snap(HORIZON + 1 - h), .5, snap(h));
      bg.fillStyle = hillL; bg.fillRect(x, snap(HORIZON + 1 - h), .5, .5);
      bg.fillStyle = hillD; bg.fillRect(x, HORIZON - 1.5, .5, 2.5);
    }
    const pine = mix([34, 84, 60], [8, 16, 26], dark), pineL = mix([60, 120, 76], [14, 24, 36], dark);
    for (const [tx, s] of [[262, 1], [270, 1.3], [279, .9], [292, 1.2], [300, .8], [337, 1]]) {
      const base = HORIZON + 1 - 15 * Math.pow(Math.sin(Math.PI * (tx - 246) / 110), .7);
      for (let r = 0; r < 9 * s; r += .5) {
        const hw = snap((r / (9 * s)) * 3 * s);
        bg.fillStyle = pine; bg.fillRect(snap(tx - hw), snap(base - 9 * s + r), hw * 2 + .5, .5);
        bg.fillStyle = pineL; bg.fillRect(snap(tx - hw), snap(base - 9 * s + r), .5, .5);
      }
      bg.fillStyle = hillD; bg.fillRect(tx, base, .5, 1.5);
    }
    // lighthouse (5 wide, striped)
    const lx = 318, lb = HORIZON + 1 - 15 * Math.pow(Math.sin(Math.PI * (lx - 246) / 110), .7);
    const wht = mix([240, 240, 240], [110, 116, 140], dark), red = mix([220, 50, 50], [90, 30, 40], dark), sh = mix([190, 190, 200], [80, 84, 104], dark);
    for (let y = 0; y < 18; y += .5) {
      const w = 5 - y * .08;
      bg.fillStyle = Math.floor(y / 3) % 2 ? red : wht; bg.fillRect(snap(lx - w / 2), snap(lb - y), snap(w), .5);
      bg.fillStyle = sh; bg.fillRect(snap(lx + w / 2 - 1), snap(lb - y), 1, .5);
    }
    bg.fillStyle = '#1e293b'; bg.fillRect(lx - 3, lb - 19, 6, 1); bg.fillRect(lx - 2, lb - 22.5, 4, .5);
    bg.fillStyle = dark > .3 ? '#fde68a' : '#cbd5e1'; bg.fillRect(lx - 1.5, lb - 22, 3, 3);
    bg.fillStyle = red; bg.fillRect(lx - 2, lb - 24, 4, 1.5); bg.fillRect(lx - .5, lb - 25, 1, 1);
  }

  // Fish-shaped clouds: soft white puffs in the shape of a fish that swims right
  // (tail at the back, dorsal fin on top, belly fin, eye at the head). Halo and blue underside as before.
  const CLOUD_FISH = [
    [.14, -2.5, 3.2], [.14, 2.5, 3.2], [.22, 0, 3.5],            // forked tail
    [.42, -6, 3.6],                                              // dorsal fin
    [.36, 0, 5.5], [.6, -1.5, 6.5], [.82, 0, 5.5], [.52, 2.5, 4.5], // body
    [.46, 4.5, 2.8],                                             // belly fin
  ];
  function cloud(c, dark) {
    const night = dark > .5;
    const body = night ? '#4b5d80' : '#ffffff', under = night ? '#34425e' : '#bfdcf2', halo = night ? '#64748b' : '#e0f2fe';
    const eye = night ? '#e2e8f0' : '#1e293b';
    const P = CLOUD_FISH.map(([fx, oy, r]) => [c.x + c.w * fx, c.y + oy, r * (c.w / 40) + .5]);
    const a = ctx.globalAlpha; ctx.globalAlpha = a * .35;
    for (const [x, y, r] of P) disc(x, y, r + 2, halo);
    ctx.globalAlpha = a;
    for (const [x, y, r] of P) disc(x, y + 2, r, under);
    for (const [x, y, r] of P) disc(x, y, r, body);
    // eye near the head, and a little gloss on the body
    const [hx, hy, hr] = P[6];
    disc(hx + hr * .35, hy - hr * .2, Math.max(.9, hr * .18), eye);
    if (!night) px(P[4][0] - P[4][2] * .6, P[4][1] - P[4][2] * .55, P[4][2] * .55, .5, '#ffffff');
  }

  function draw() {
    // legendary catches shake the screen for a moment
    const quake = fanfare && fanfare.r === 'legendary' && fanfare.t < .7 ? (1 - fanfare.t / .7) * 3 : 0;
    ctx.setTransform(2, 0, 0, 2, Math.round((Math.random() - .5) * quake) * 2, Math.round((Math.random() - .5) * quake) * 2);
    const [top, bot, dark] = skyColors();
    // letterbox continues the scene (sky above, deep water below)
    const deep = mix([8, 40, 80], [4, 10, 28], dark);
    if (deep !== lastBg) { lastBg = deep; $('stage').style.background = `linear-gradient(${top} 0 50%, ${deep} 50% 100%)`; }
    const key = top + bot;
    // at dawn and dusk the colours change every frame; repainting sky and sea 4x a second is plenty
    if (key !== bgKey && (t - bgAt > .25 || t < bgAt || !bgKey)) { bgKey = key; bgAt = t; renderBg(top, bot, dark); }

    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bgC, 0, 0); ctx.restore();
    // sky things stay above the horizon
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, HORIZON + .5); ctx.clip();

    // stars (some bigger ones sparkle as little crosses)
    if (dark > .2) stars.forEach(([x, y, s], i) => {
      const tw = .4 + .6 * Math.abs(Math.sin(t * (1 + s) + s * 9));
      ctx.globalAlpha = dark * tw;
      px(x, y, .5, .5, '#fff');
      if (i % 7 === 0 && tw > .8) { px(x - .5, y, 1.5, .5, '#c7d2fe'); px(x, y - .5, .5, 1.5, '#c7d2fe'); }
    });
    ctx.globalAlpha = 1;

    // sun & moon on an arc
    const sunA = (time - .25) * Math.PI * 2;
    const sx = W / 2 - Math.cos(sunA) * 170, sy = HORIZON - Math.sin(sunA) * 80;
    if (sy < HORIZON + 10) {
      ctx.globalAlpha = .25; disc(sx, sy, 13, '#fef3c7'); ctx.globalAlpha = 1;
      disc(sx, sy, 9, '#fbbf24'); disc(sx - .5, sy - .5, 8, '#fde68a'); disc(sx - 3, sy - 3, 2.5, '#fffbeb');
    }
    const mx = W / 2 + Math.cos(sunA) * 170, my = HORIZON + Math.sin(sunA) * 80;
    if (my < HORIZON + 10) {
      ctx.globalAlpha = .15; disc(mx, my, 11, '#e0e7ff'); ctx.globalAlpha = 1;
      disc(mx, my, 7, '#cbd5e1'); disc(mx - .5, my - .5, 6.5, '#e2e8f0');
      disc(mx + 2, my - 2, 1.5, '#cbd5e1'); disc(mx - 2.5, my + 1.5, 1, '#cbd5e1'); disc(mx + 1, my + 3, .8, '#cbd5e1');
    }

    // clouds
    ctx.globalAlpha = .9 - dark * .5;
    for (const c of clouds) cloud(c, dark);
    ctx.globalAlpha = 1;

    // birds by day
    if (dark < .5) for (let i = 0; i < 3; i++) {
      const bx = ((t * (8 + i * 2) + i * 140) % (W + 60)) - 30, by = 30 + i * 9 + Math.sin(t + i) * 3;
      const f = Math.sin(t * 8 + i) > 0;
      ctx.fillStyle = '#334155';
      ctx.fillRect(snap(bx), snap(by), .5, .5);
      ctx.fillRect(snap(bx - 1), snap(by - (f ? .5 : 0)), .5, .5); ctx.fillRect(snap(bx - 1.5), snap(by - (f ? 1 : 0)), .5, .5);
      ctx.fillRect(snap(bx + 1), snap(by - (f ? .5 : 0)), .5, .5); ctx.fillRect(snap(bx + 1.5), snap(by - (f ? 1 : 0)), .5, .5);
    }

    ctx.restore();
    // lighthouse beam
    if (dark > .3) {
      const sw = Math.sin(t * 1.2);
      ctx.globalAlpha = dark * .18; ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.moveTo(318, HORIZON - 22); ctx.lineTo(318 + sw * 60, HORIZON - 28); ctx.lineTo(318 + sw * 60, HORIZON - 16); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // shimmer and sparkles
    for (let i = 0; i < 40; i++) {
      const y = HORIZON + 2 + ((i * 37) % (H - HORIZON - 4));
      const x = ((i * 71 + t * (6 + (i % 4) * 3)) % (W + 30)) - 15;
      ctx.globalAlpha = .18 + (y - HORIZON) / (H - HORIZON) * -.1 + .12;
      px(x, y, 4 + (i % 4) * 3, .5, dark > .5 ? '#3b5b8a' : '#d4f1ff');
      px(x + 2, y + .5, 2 + (i % 3) * 2, .5, dark > .5 ? '#22385e' : '#7cc4ea');
    }
    ctx.globalAlpha = 1;
    if (dark < .6) for (let i = 0; i < 18; i++) {
      if (Math.sin(t * 3 + i * 7.3) < .85) continue;
      px((i * 97) % W, HORIZON + 3 + (i * 29) % 40, .5, .5, '#ffffff');
    }
    // sun/moon reflection
    const rx = sy < HORIZON ? sx : mx;
    if (sy < HORIZON || my < HORIZON) {
      ctx.globalAlpha = .3;
      for (let i = 0; i < 10; i++) px(rx - 6 + i * .3 + Math.sin(t * 2 + i) * 2, HORIZON + 2 + i * 2.5, 12 - i * .9, .5, '#fff7cc');
      ctx.globalAlpha = 1;
    }

    // swimming fish silhouettes
    if (silL) for (const f of fishes) {
      const img = f.vx < 0 ? silL : silR;
      const wob = Math.sin(t * 6 + f.phase) * .6;
      ctx.globalAlpha = f.a + (f === approacher ? .2 : 0);
      ctx.drawImage(img, snap(f.x - 12 * f.s), snap(f.y - 12 * f.s + wob), snap(24 * f.s), snap(24 * f.s));
    }
    ctx.globalAlpha = 1;

    // ripples
    ctx.strokeStyle = '#e0f7ff'; ctx.lineWidth = .5;
    for (const r of ripples) {
      ctx.globalAlpha = (r.life / r.max) * .7;
      ctx.beginPath(); ctx.ellipse(r.x, SURFACE + 1, r.r, r.r * .3, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawBealin(dark);
    drawDock(dark);
    drawNpc();
    drawKiosk(dark);
    drawProps(dark);
    drawPlayer(dark);
    drawLine();

    // particles
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); px(p.x, p.y, 1, 1, p.c); px(p.x + .5, p.y - .5, .5, .5, '#ffffff'); }
    ctx.globalAlpha = 1;
    drawFx();
    drawPropLabel();

    // power meter
    if (state === 'charge') {
      const bx = snap(player.x) - 13, by = DOCK_Y - 30;
      px(bx - 1, by - 1, 28, 5, '#0f172a');
      px(bx - .5, by - .5, 27, 4, '#334155');
      px(bx, by, 26, 3, '#1e293b');
      px(bx, by, snap(26 * power), 3, power > .85 ? '#fbbf24' : '#22c55e');
      px(bx, by, snap(26 * power), .5, power > .85 ? '#fde68a' : '#86efac');
    }
    // bite: a little speech bubble with "!"
    if (state === 'bite') {
      const ex = snap(bob.x), ey = snap(SURFACE - 22 + Math.sin(t * 30));
      px(ex - 3.5, ey - 1, 7, 12, '#0f172a'); px(ex - 3, ey - .5, 6, 11, '#fffbeb');
      px(ex - .5, ey + 11, 1.5, 1.5, '#0f172a');
      px(ex - 1, ey + 1, 2, 5.5, '#ef4444'); px(ex - 1, ey + 7.5, 2, 2, '#ef4444');
    }

    // night tint for warmth
    if (dark > 0) { ctx.globalAlpha = dark * .18; px(0, 0, W, H, '#1e1b4b'); ctx.globalAlpha = 1; }
  }

  function drawDock(dark) {
    const k = '#1b1f2e';
    const wood = mix([168, 112, 64], [74, 54, 42], dark), woodL = mix([196, 140, 86], [92, 68, 52], dark), woodD = mix([118, 74, 42], [52, 38, 30], dark);
    const post = mix([96, 62, 36], [42, 30, 26], dark), postL = mix([128, 86, 52], [58, 42, 34], dark), postD = mix([64, 40, 24], [28, 20, 18], dark);
    const algae = mix([62, 98, 40], [24, 38, 24], dark), water = mix([30, 100, 150], [10, 24, 50], dark);
    // posts with shading, algae line and a submerged part
    for (let x = 6; x < DOCK_END; x += 26) {
      px(x, DOCK_Y, 5, H - DOCK_Y, post);
      px(x, DOCK_Y, 1, H - DOCK_Y, postL);
      px(x + 4, DOCK_Y, 1, H - DOCK_Y, postD);
      for (let y = DOCK_Y + 9; y < H; y += 7) px(x + 1.5, y, 2, .5, postD);
      px(x - .5, SURFACE - .5, 6, 1.5, algae);
      ctx.globalAlpha = .45; px(x - .5, SURFACE + 1, 6, H - SURFACE, water); ctx.globalAlpha = 1;
      // wobbly reflection
      ctx.globalAlpha = .25;
      for (let y = SURFACE + 1; y < SURFACE + 14; y += 1) px(x + Math.sin(t * 3 + y) * .8, y, 5, .5, postD);
      ctx.globalAlpha = 1;
    }
    // cross brace
    ctx.strokeStyle = postD; ctx.lineWidth = 1;
    for (let x = 6; x + 26 < DOCK_END; x += 26) { ctx.beginPath(); ctx.moveTo(x + 5, DOCK_Y + 6); ctx.lineTo(x + 26, SURFACE - 1); ctx.stroke(); }
    // deck: top boards, seams, nails, front beam
    px(0, DOCK_Y - .5, DOCK_END + .5, 6.5, k);
    px(0, DOCK_Y, DOCK_END, 3, wood);
    px(0, DOCK_Y, DOCK_END, .5, woodL);
    for (let x = 0; x < DOCK_END; x += 9) {
      px(x, DOCK_Y, .5, 3, woodD);
      px(x + 1.5, DOCK_Y + 1, .5, .5, '#4b5563'); px(x + 7, DOCK_Y + 1, .5, .5, '#4b5563');
      px(x + 3 + (x % 4), DOCK_Y + 2, 2.5, .5, woodD);
    }
    px(0, DOCK_Y + 3, DOCK_END, 2.5, woodD);
    for (let x = 2; x < DOCK_END; x += 6.5) px(x, DOCK_Y + 4, 3, .5, post);
    // lantern post with rope
    const lx = DOCK_END - 4;
    px(lx - .5, DOCK_Y - 21, 3, 21, k);
    px(lx, DOCK_Y - 20.5, 2, 20.5, post); px(lx, DOCK_Y - 20.5, .5, 20.5, postL);
    for (let y = DOCK_Y - 8; y < DOCK_Y - 4; y += 1) { px(lx - .5, y, 3, .5, '#d6b98c'); px(lx - .5, y + .5, 3, .5, '#a68a5b'); }
    px(lx - 2.5, DOCK_Y - 26.5, 7, 7, k);
    px(lx - 2, DOCK_Y - 26, 6, 1.5, '#334155');
    px(lx - 1.5, DOCK_Y - 24.5, 5, 4, dark > .3 ? '#fde68a' : '#9fb4c8');
    px(lx - 1.5, DOCK_Y - 24.5, 1, 4, dark > .3 ? '#fff7cc' : '#cbd5e1');
    px(lx + .5, DOCK_Y - 24.5, .5, 4, '#334155');
    px(lx - .5, DOCK_Y - 28, 3, 1.5, '#334155'); px(lx + .5, DOCK_Y - 29, 1, 1, '#334155');
    if (dark > .3) {
      const glow = ctx.createRadialGradient(lx + 1, DOCK_Y - 22, 1, lx + 1, DOCK_Y - 22, 40);
      glow.addColorStop(0, `rgba(253, 230, 138, ${.35 * dark})`); glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
      ctx.fillStyle = glow; ctx.fillRect(lx - 40, DOCK_Y - 62, 80, 80);
    }
  }


  // ------------------------------------------------------------------ shop kiosk with Herr Zylinderwels
  // An original pixel catfish in a top hat runs the shop from a little striped kiosk on the dock.
  const WELS_PAL = {
    k: '#111827', H: '#1f2937', h: '#4b5563', R: '#7f1d1d', r: '#b91c1c',
    G: '#6b7a5e', g: '#8a9a7b', D: '#4f5b45', e: '#0b0f19', w: '#f8fafc',
    L: '#c9a99a', l: '#e2c7b9', m: '#3b1d1d', p: '#d16b78', B: '#d9d2c0', b: '#bfb6a1',
  };
  const WELS_TOP = [
    '......kkkkkkkkkk......',
    '.....kHhhHHHHHHHk.....',
    '.....kHhHHHHHHHHk.....',
    '.....kHhHHHHHHHHk.....',
    '.....kHHHHHHHHHHk.....',
    '.....kHHHHHHHHHHk.....',
    '.....kRrRRRRRRRRk.....',
    '.....kRRRRRRRRRRk.....',
    '..kkkkHHHHHHHHHHkkkk..',
    '.kHhhhHHHHHHHHHHHHHHk.',
    '..kkkkkkkkkkkkkkkkkk..',
    '...kGGGgggGGGGGGGGk...',
    '..kGGgggGGGGGGGGGGGk..',
    '.kGGGGGGGGGGGGGGGGGGk.',
  ];
  const WELS_EYES = [
    ['.kGewGGGGGGGGGGGGweGk.', '.kGeeGGGGGGGGGGGGeeGk.'],
    ['.kGDDGGGGGGGGGGGGDDGk.', '.kGGGGGGGGGGGGGGGGGGk.'], // blink
  ];
  const WELS_MOUTH = [
    ['kGGGGGGGGGGGGGGGGGGGGk', 'kGLLLLLLLLLLLLLLLLLLGk', 'kLlllllllllllllllllLLk', 'kLLmmmmmmmmmmmmmmmmLLk', 'kLLLLLLLLLLLLLLLLLLLLk'],
    ['kGGGGGGGGGGGGGGGGGGGGk', 'kGLLLLLLLLLLLLLLLLLLGk', 'kLmmmmmmmmmmmmmmmmmmLk', 'kLmmmmppppppppppmmmmLk', 'kLLLLLLLLLLLLLLLLLLLLk'], // talking
  ];
  const WELS_BELLY = ['.kBBBbBBBBBBBBBBbBBBk.', '.kBBBBBBBBBBBBBBBBBBk.', '..kBBBBBBBBBBBBBBBBk..', '..kbbbbbbbbbbbbbbbbk..'];
  const welsFrames = [0, 1].map(blink => [0, 1].map(talk =>
    bake([...WELS_TOP, ...WELS_EYES[blink], ...WELS_MOUTH[talk], ...WELS_BELLY], WELS_PAL)));
  const KIOSK = { x: 40, w: 24 };
  let welsTalk = 0, welsLine = '';
  function welsSay(line, secs = 2.6) { welsLine = line; welsTalk = secs; }

  // ------------------------------------------------------------------ menus as things on the dock
  // No menu buttons: the slot machine, the book on the crate, the trophy on the kiosk roof
  // and the notice board open their menus. Hover shows a label, "!" shows something to collect.
  function drawSlotMachine(dark) {
    const k = '#1b1f2e', x0 = 3, y = DOCK_Y;
    const red = mix([196, 38, 52], [86, 28, 40], dark), redL = mix([236, 96, 100], [118, 50, 60], dark), redD = mix([136, 22, 34], [56, 18, 26], dark);
    px(x0 - .5, y - 20, 11, 20, k);
    px(x0, y - 19.5, 10, 19.5, red); px(x0, y - 19.5, 10, .5, redL); px(x0 + 9, y - 19.5, 1, 19.5, redD);
    px(x0 + 1, y - 18.5, 8, 3, '#f59e0b');
    for (let i = 0; i < 4; i++) px(x0 + 1.5 + i * 2, y - 17.5, 1, 1, (Math.floor(t * 4) + i) % 2 ? '#fff7cc' : '#b45309');
    px(x0 + 1, y - 14, 8, 5.5, k); px(x0 + 1.5, y - 13.5, 7, 4.5, '#f8fafc');
    const sym = ['#38bdf8', '#fbbf24', '#f472b6', '#4ade80'];
    for (let i = 0; i < 3; i++) { const c = sym[(Math.floor(t * .7) + i * 2) % 4]; px(x0 + 2 + i * 2.3, y - 12, 1.5, 1.5, c); px(x0 + 1.5 + i * 2.3, y - 11.5, .5, .5, c); }
    px(x0 + 3, y - 7, 4, .5, k);
    px(x0 + 1, y - 4.5, 8, 3, k); px(x0 + 1.5, y - 4, 7, 2, '#475569'); px(x0 + 4, y - 3.5, 1.5, 1, '#fbbf24');
    px(x0 + 10, y - 12.5, 1, 1.5, k); px(x0 + 10.5, y - 17.5, .5, 5, '#94a3b8');
    disc(x0 + 10.75, y - 18, 1.2, '#ef4444'); px(x0 + 10.25, y - 18.75, .5, .5, '#fecaca');
  }
  function drawDexBook(dark) {
    const k = '#1b1f2e', x0 = 29, y = DOCK_Y;
    const wood = mix([150, 102, 58], [70, 52, 40], dark), woodL = mix([186, 134, 82], [90, 66, 50], dark), woodD = mix([104, 66, 36], [48, 36, 28], dark);
    px(x0 - .5, y - 5, 8, 5, k); px(x0, y - 4.5, 7, 4.5, wood); px(x0, y - 4.5, 7, .5, woodL);
    px(x0 + 2.25, y - 4, .5, 4, woodD); px(x0 + 4.75, y - 4, .5, 4, woodD);
    px(x0 - .5, y - 7, 8, 2, k); px(x0, y - 6.5, 7, 1.5, mix([37, 99, 235], [30, 58, 120], dark));
    px(x0, y - 8.5, 3.25, 2.5, k); px(x0 + 3.75, y - 8.5, 3.25, 2.5, k);
    const page = mix([248, 250, 252], [150, 160, 180], dark);
    px(x0 + .5, y - 8, 2.5, 1.75, page); px(x0 + 4, y - 8, 2.5, 1.75, page);
    px(x0 + 1, y - 7.5, 1.5, .5, '#94a3b8'); px(x0 + 4.5, y - 7.5, 1.5, .5, '#38bdf8');
  }
  function drawTrophy(dark) {
    const k = '#1b1f2e', cx = KIOSK.x + KIOSK.w / 2, yb = DOCK_Y - 37.5;
    const gold = mix([251, 191, 36], [160, 120, 40], dark), goldL = mix([253, 230, 138], [190, 160, 90], dark), goldD = mix([217, 119, 6], [120, 80, 20], dark);
    px(cx - 3, yb - 2, 6, 2, k); px(cx - 2.5, yb - 1.5, 5, 1, '#7c4a24');
    px(cx - 1, yb - 4, 2, 2, k); px(cx - .5, yb - 4, 1, 2, gold);
    px(cx - 4.5, yb - 9, 1.5, 3, k); px(cx + 3, yb - 9, 1.5, 3, k);
    px(cx - 4, yb - 8.5, .5, 2, gold); px(cx + 3.5, yb - 8.5, .5, 2, gold);
    px(cx - 3.5, yb - 10, 7, 6, k); px(cx - 3, yb - 9.5, 6, 5, gold); px(cx - 3, yb - 9.5, 6, .5, goldL); px(cx + 2, yb - 9, 1, 4.5, goldD);
    px(cx - 1.5, yb - 8, .5, 2, goldL);
    if (Math.sin(t * 2.2) > .93) { px(cx + 1, yb - 11.5, .5, 2.5, '#fffbeb'); px(cx, yb - 10.5, 2.5, .5, '#fffbeb'); }
  }
  function drawBoard(dark) {
    const k = '#1b1f2e', x0 = 65, y = DOCK_Y;
    const post = mix([96, 62, 36], [42, 30, 26], dark), cork = mix([183, 131, 74], [82, 62, 44], dark), frame = mix([120, 78, 42], [56, 40, 30], dark);
    px(x0 + .5, y - 10.5, 1.5, 10.5, k); px(x0 + 7, y - 10.5, 1.5, 10.5, k);
    px(x0 + 1, y - 10.5, .75, 10.5, post); px(x0 + 7.5, y - 10.5, .75, 10.5, post);
    px(x0 - .5, y - 20, 10, 10.5, k); px(x0, y - 19.5, 9, 9.5, frame); px(x0 + .5, y - 19, 8, 8.5, cork);
    const paper = (x, yy, w, h, c) => { px(x, yy, w, h, c); px(x + .5, yy + 1, w - 1, .5, '#94a3b8'); if (h > 2) px(x + .5, yy + 2, w - 1.5, .5, '#94a3b8'); };
    paper(x0 + 1, y - 18.5, 3, 3, mix([254, 243, 199], [120, 115, 100], dark));
    paper(x0 + 4.5, y - 18, 3.5, 2.5, mix([191, 219, 254], [90, 105, 125], dark));
    paper(x0 + 2, y - 14.5, 4, 3, mix([254, 202, 202], [120, 95, 95], dark));
    px(x0 + 2.25, y - 18.75, .5, .5, '#ef4444'); px(x0 + 6, y - 18.25, .5, .5, '#22c55e'); px(x0 + 3.75, y - 14.75, .5, .5, '#3b82f6');
  }
  const PROPS = [
    { id: 'casino', label: tr('Fischautomat'),  x: 2.5, y: DOCK_Y - 20, w: 12.5, h: 20, draw: drawSlotMachine, open: () => toggleModal('casino') },
    { id: 'dex',    label: tr('Fischdex & Shinydex'), x: 28.5, y: DOCK_Y - 8.5, w: 8, h: 8.5, draw: drawDexBook, open: () => toggleModal('dex'), ready: () => $('btn-dex').classList.contains('ready') },
    { id: 'lb',     label: tr('Bestenliste'),   x: KIOSK.x + KIOSK.w / 2 - 5, y: DOCK_Y - 48, w: 10, h: 10.5, draw: drawTrophy, open: () => toggleModal('lb') },
    { id: 'prog',   label: tr('Aufträge & Fortschritt'), x: 64.5, y: DOCK_Y - 20, w: 10, h: 20, draw: drawBoard, open: () => toggleModal('prog'), ready: () => $('btn-prog').classList.contains('ready') },
    { id: 'shop',   label: tr('Laden'),         x: KIOSK.x - 3, y: DOCK_Y - 37.5, w: KIOSK.w + 6, h: 37.5, open: () => toggleModal('shop') },
    { id: 'bealin',  label: tr("Käpt'n Bealin"), x: BEALIN.x - 1, y: SURFACE - 16, w: BEALIN.w + 2, h: 18, open: () => talkBealin() },
    { id: 'npc',    label: 'Spezifischfischer', x: NPC.x - 1, y: DOCK_Y - NPC.h - 2, w: NPC.w + 2, h: NPC.h + 2, open: () => talkNpc() },
  ];
  let hoverProp = null;
  function propAt(wx, wy) { return PROPS.find(p => wx > p.x - 1.5 && wx < p.x + p.w + 1.5 && wy > p.y - 1.5 && wy < p.y + p.h + 1.5) || null; }
  function drawProps(dark) {
    for (const p of PROPS) if (p.draw) p.draw(dark);
    const k = '#1b1f2e';
    for (const p of PROPS) if (p.ready && p.ready()) {
      const bx = snap(p.x + p.w / 2), by = snap(p.y - 10 + Math.sin(t * 5));
      px(bx - 2.5, by - .5, 5, 8.5, k); px(bx - 2, by, 4, 7.5, '#fbbf24'); px(bx - .5, by + 1, 1, 3.5, k); px(bx - .5, by + 5.5, 1, 1, k);
    }
  }
  function drawPropLabel() {
    const p = hoverProp;
    if (!p || state !== 'idle' || anyModal()) return;
    setFont('6px Poppins, sans-serif');
    const w = Math.ceil(ctx.measureText(p.label).width) + 4;
    const lx = snap(Math.max(1, Math.min(W - w - 1, p.x + p.w / 2 - w / 2))), ly = snap(Math.max(1, p.y - (p.ready && p.ready() ? 21 : 11)));
    px(lx - .5, ly - .5, w + 1, 9, '#fde68a'); px(lx, ly, w, 8, '#0f172a');
    ctx.fillStyle = '#fffbeb'; ctx.textBaseline = 'top'; ctx.fillText(p.label, lx + 2, ly + 1); ctx.textBaseline = 'alphabetic';
  }

  function drawKiosk(dark) {
    const k = '#1b1f2e', x0 = KIOSK.x, x1 = KIOSK.x + KIOSK.w, y = DOCK_Y;
    const wood = mix([150, 98, 56], [66, 48, 38], dark), woodL = mix([186, 128, 78], [86, 62, 48], dark), woodD = mix([104, 66, 38], [46, 34, 28], dark);
    // back wall
    px(x0 + 1, y - 30, KIOSK.w - 2, 21, mix([92, 62, 40], [40, 30, 26], dark));
    for (let xx = x0 + 3; xx < x1 - 2; xx += 4) px(xx, y - 30, .5, 21, woodD);
    // the catfish (bobs a little, blinks, opens its mouth while talking)
    const blink = (t % 4) < .12 ? 1 : 0, talk = welsTalk > 0 && Math.sin(t * 18) > 0 ? 1 : 0;
    const img = welsFrames[blink][talk], wy = y - 22.5 + Math.round(Math.sin(t * 2.2)) * .5;
    ctx.drawImage(img, x0 + 1, wy, img.width / 2, img.height / 2);
    // barbels (whiskers) from the mouth corners
    ctx.strokeStyle = '#2b3326'; ctx.lineWidth = .5;
    const my = wy + 17, sw = Math.sin(t * 2.6) * 1.2;
    ctx.beginPath(); ctx.moveTo(x0 + 1.5, my); ctx.quadraticCurveTo(x0 - 3, my + 1, x0 - 4 + sw, my + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + 11.5, my); ctx.quadraticCurveTo(x0 + 16, my + 1, x0 + 17 - sw, my + 5); ctx.stroke();
    // counter
    px(x0 - .5, y - 9.5, KIOSK.w + 1, 9.5, k);
    px(x0, y - 9, KIOSK.w, 9, wood);
    px(x0, y - 9, KIOSK.w, 1, woodL);
    for (let xx = x0 + 4; xx < x1; xx += 5) px(xx, y - 8, .5, 8, woodD);
    px(x0 - 1, y - 10.5, KIOSK.w + 2, 1.5, woodD); px(x0 - 1, y - 10.5, KIOSK.w + 2, .5, woodL);
    // sign on the counter
    px(x0 + 5, y - 7.5, 14, 5, '#fef3c7'); px(x0 + 5, y - 7.5, 14, .5, '#fffbeb'); px(x0 + 5, y - 3, 14, .5, '#d6c49a');
    ctx.fillStyle = '#7f1d1d'; setFont('700 4px Poppins, sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tr('LADEN'), x0 + 12, y - 5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // goods on the counter: a jar of worms and a sparkly lure
    px(x0 + 1, y - 13.5, 3, 3, '#bae6fd'); px(x0 + 1.5, y - 12.5, 2, 1.5, '#f472b6'); px(x0 + 1, y - 14, 3, .5, '#475569');
    const tw = (Math.sin(t * 6) + 1) / 2;
    px(x1 - 4, y - 12.5, 2, 2, '#fbbf24'); px(x1 - 3.5, y - 12, 1, 1, tw > .5 ? '#fff7cc' : '#f59e0b');
    // posts
    px(x0 - .5, y - 33, 2, 23, k); px(x0, y - 32.5, 1, 22.5, woodL);
    px(x1 - 1.5, y - 33, 2, 23, k); px(x1 - 1, y - 32.5, 1, 22.5, wood);
    // striped awning with scalloped edge
    px(x0 - 3, y - 37.5, KIOSK.w + 6, 5.5, k);
    for (let i = 0; i < 7; i++) {
      const sx = x0 - 2.5 + i * 4.25;
      px(sx, y - 37, 4.25, 5, i % 2 ? '#f8fafc' : '#dc2626');
      px(sx + .5, y - 32, 3.25, 1, i % 2 ? '#e2e8f0' : '#b91c1c');
    }
    px(x0 - 2.5, y - 37, KIOSK.w + 5, .5, 'rgba(255,255,255,.5)');
    // speech bubble
    if (welsTalk > 0) {
      setFont('6px Poppins, sans-serif');
      const bw = Math.ceil(ctx.measureText(welsLine).width) + 4, bx = Math.min(W - bw - 2, x0 + 14), byy = y - 46;
      ctx.globalAlpha = Math.min(1, welsTalk * 3);
      px(bx - .5, byy - .5, bw + 1, 9, '#0f172a'); px(bx, byy, bw, 8, '#fffbeb'); px(bx + 2, byy + 8, 2, 1.5, '#0f172a');
      ctx.fillStyle = '#0f172a'; ctx.textBaseline = 'top'; ctx.fillText(welsLine, bx + 2, byy + 1); ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
    }
  }

  // The Spezifischfischer himself, fishing at the start of the dock with a Spezi bottle on his line.
  function drawNpc() {
    if (!npcImg.complete || !npcImg.naturalWidth) return;
    const x = NPC.x, y = DOCK_Y;
    ctx.drawImage(npcImg, x, y - NPC.h, NPC.w, NPC.h);
    const hx = x + 9, hy = y - 13.5, tx = x + 19, ty = y - 25;
    ctx.strokeStyle = '#111827'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(x + 15, y - 23, tx, ty); ctx.stroke();
    const sw = Math.sin(t * 1.4) * 1.5, by = y - 11;
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + sw, by); ctx.stroke();
    ctx.drawImage(BOTTLE, snap(tx + sw - .75), by, 1.5, 3.5);
    if (npcTalk > 0) {
      setFont('6px Poppins, sans-serif');
      const bw = Math.ceil(ctx.measureText(npcLine).width) + 4, bx = x - 2, byy = y - NPC.h - 12;
      ctx.globalAlpha = Math.min(1, npcTalk * 3);
      px(bx - .5, byy - .5, bw + 1, 9, '#0f172a'); px(bx, byy, bw, 8, '#fffbeb'); px(bx + 6, byy + 8, 2, 1.5, '#0f172a');
      ctx.fillStyle = '#0f172a'; setFont('6px Poppins, sans-serif'); ctx.textBaseline = 'top';
      ctx.fillText(npcLine, bx + 2, byy + 1);
      ctx.globalAlpha = 1;
    }
  }

  // Our angler: a bearded fisher with a green bucket hat (original sprite).
  function drawPlayer(dark) {
    const x = snap(player.x), y = DOCK_Y, d = player.dir;
    const frame = player.walk ? [0, 1, 0, 2][Math.floor(player.walk / 1.6) % 4] : 0;
    const img = playerFrames()[d > 0 ? 0 : 1][frame];
    ctx.drawImage(img, x - 5.5, y - img.height / 2, img.width / 2, img.height / 2);
    // arm + hand holding the rod
    const tip = rodTip();
    const hx = x + d * 3.5, hy = y - 8.5;
    px(x + (d > 0 ? 1.5 : -3.5), y - 9.5, 2, 1.5, '#c2410c');
    px(hx - .5, hy - .5, 1.5, 1.5, '#f2c9a0');
    const r = rod();
    const col = { stock: '#7c4a1e', bambus: '#a3a34a', carbon: '#1f2937', gold: '#f59e0b' }[r.id] || '#7c4a1e';
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx + .25, hy + .25); ctx.lineTo((hx + tip.x) / 2, (hy + tip.y) / 2); ctx.stroke();
    ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo((hx + tip.x) / 2, (hy + tip.y) / 2); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    // reel
    px(hx + d * 1 - .5, hy + .5, 1.5, 1.5, '#64748b'); px(hx + d * 1 - .5, hy + .5, .5, .5, '#cbd5e1');
    if (r.id === 'bambus') for (let k = .2; k < 1; k += .2) px(hx + (tip.x - hx) * k, hy + (tip.y - hy) * k, .5, .5, '#65652a');
    if (r.id === 'gold') px(tip.x - .25, tip.y - .25, 1, 1, '#fde68a');
  }

  function drawLine() {
    if (!['fly', 'wait', 'bite', 'reel'].includes(state)) return;
    const tip = rodTip();
    const by = state === 'fly' ? bob.y : SURFACE + bob.dunk * .4;
    const tight = state === 'reel' ? reel.tension : 0;
    const sag = state === 'fly' ? 0 : (1 - tight) * 18;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + bob.x) / 2, Math.max(tip.y, by) + sag, bob.x, by);
    ctx.stroke();
    // bobber: red cap, white belly, antenna, outline
    const bx = snap(bob.x) - 2, byy = snap(by) - 3;
    if (state === 'reel' || state === 'bite') { px(bx + .5, byy + 1.5, 3, 2, '#1b1f2e'); px(bx + 1, byy + 2, 2, 1.5, '#ef4444'); return; }
    px(bx - .5, byy - .5, 5, 5, '#1b1f2e');
    px(bx, byy, 4, 2, '#ef4444'); px(bx, byy, 1, 1, '#fca5a5');
    px(bx, byy + 2, 4, 2, '#f8fafc'); px(bx + 3, byy + 2, 1, 2, '#cbd5e1');
    px(bx + 1.5, byy - 2, .5, 2, '#1b1f2e');
  }

  // ------------------------------------------------------------------ ui
  let hintTimer = 0;
  function hint(text, secs = 0) { $('hint').textContent = text; $('hint').style.opacity = text ? 1 : 0; hintTimer = secs; }
  function hintTick(dt) {
    if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) hint(''); }
    if (state === 'idle' && hintTimer <= 0 && !anyModal() && $('hint').textContent === '') {
      $('hint').textContent = tr('Halten zum Auswerfen');
      $('hint').style.opacity = .55;
    }
  }
  function toast(msg) {
    const d = document.createElement('div'); d.textContent = msg;
    $('toast').appendChild(d); setTimeout(() => d.remove(), 3300);
  }
  function updateCoins() { $('coins').textContent = save.coins; $('shop-coins').textContent = save.coins; $('casino-coins').textContent = save.coins; }
  // bait hotbar: every bait you own as a slot; click or press 1-9 to switch (only while idle)
  const ownedBaits = () => BAITS.filter(b => !b.pack || (save.baits[b.id] || 0) > 0);
  function selectBait(id) {
    if (save.bait === id) return;
    if (state !== 'idle') { hint(tr('Erst einholen, dann Köder wechseln'), 1.4); return; }
    save.bait = id; persist(); updateGear(); sfx.tick();
    hint(`🪝 ${bait().name}`, 1.2);
  }
  function updateGear() {
    $('gear').textContent = `🎣 ${rod().name}`;
    $('baitbar').replaceChildren(...ownedBaits().map((b, i) => {
      const n = save.baits[b.id], on = b.id === save.bait;
      const btn = document.createElement('button');
      btn.className = 'bslot' + (on ? ' on' : '');
      btn.title = `${b.name}${b.pack ? ' ×' + n : ''} – ` + tr('Taste {k}', { k: i + 1 });
      btn.setAttribute('aria-pressed', on);
      btn.setAttribute('aria-label', `${b.name}${b.pack ? ', ' + tr('{n} Stück', { n }) : ''}`);
      const im = document.createElement('img'); im.src = ICONS[b.id]; im.alt = '';
      if (!ICONS[b.id].startsWith('data:')) im.className = 'photo';
      const key = document.createElement('small'); key.className = 'key'; key.textContent = i + 1;
      const cnt = document.createElement('small'); cnt.className = 'cnt'; cnt.textContent = b.pack ? n : '∞';
      btn.append(im, key, cnt);
      btn.addEventListener('click', () => selectBait(b.id));
      return btn;
    }));
  }
  let lastClock = '';
  function updateClock() {
    const h = Math.floor(time * 24), m = Math.floor((time * 24 % 1) * 60 / 10) * 10;
    const s = `${isNight() ? '🌙' : '☀️'} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (s !== lastClock) { $('clock').textContent = s; lastClock = s; }
  }

  const anyModal = () => [...document.querySelectorAll('.modal')].some(m => !m.hidden);
  function closeModals() {
    for (const id of ['dex', 'shop', 'casino', 'prog', 'lb', 'cloud', 'box']) $(id).hidden = true;
  }
  function toggleModal(id) {
    if (!$('title').hidden || !$('catch').hidden) return;
    if (['charge', 'fly', 'bite', 'reel'].includes(state)) return;
    const open = $(id).hidden;
    closeModals();
    if (open) { ({ dex: renderDex, shop: renderShop, casino: renderCasino, prog: renderProg, lb: openLb, cloud: renderCloud })[id](); $(id).hidden = false; }
  }
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('pointerdown', e => {
    if (e.target === m && m.id !== 'title' && m.id !== 'catch') closeModals();
  }));
  $('btn-dex').addEventListener('click', () => toggleModal('dex'));
  $('btn-shop').addEventListener('click', () => toggleModal('shop'));
  $('btn-casino').addEventListener('click', () => toggleModal('casino'));
  $('btn-prog').addEventListener('click', () => toggleModal('prog'));
  $('btn-lb').addEventListener('click', () => toggleModal('lb'));
  $('lvl').addEventListener('click', () => toggleModal('prog'));
  $('btn-sound').addEventListener('click', () => {
    save.sound = !save.sound; persist();
    $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  });
  $('start').addEventListener('click', () => { audio(); $('title').hidden = true; save.seen = true; persist(); });
  $('catch-ok').addEventListener('click', () => { if ($('catch-ok').disabled) return; $('catch').hidden = true; state = 'idle'; hint(''); });

  // ------------------------------------------------------------------ gambling
  // Double or nothing on a fresh catch: a coin flip, once per catch.
  $('catch-double').addEventListener('click', () => {
    const flip = $('catch-flip'), btn = $('catch-double'), ok = $('catch-ok');
    btn.disabled = true; ok.disabled = true;
    flip.hidden = false; flip.className = 'flip rolling'; flip.textContent = '🪙 …';
    let n = 0;
    const iv = setInterval(() => { flip.textContent = n++ % 2 ? tr('🪙 Kopf …') : tr('🐟 Fisch …'); sfx.tick(); }, 110);
    setTimeout(() => {
      clearInterval(iv);
      const win = Math.random() < .5;
      save.coins += win ? lastCatchVal : -lastCatchVal;
      save.gamble = (save.gamble || 0) + (win ? lastCatchVal : -lastCatchVal);
      persist(); updateCoins();
      flip.className = 'flip ' + (win ? 'win' : 'lose');
      flip.textContent = win ? tr('🐟 Fisch! +{n} Taler extra', { n: lastCatchVal }) : tr('🪙 Kopf. Die {n} Taler sind weg.', { n: lastCatchVal });
      $('catch-value').textContent = tr('+{n} Taler', { n: win ? lastCatchVal * 2 : 0 });
      if (win) sfx.coin(); else tone(220, .4, 'sawtooth', .07, -120);
      btn.hidden = true; ok.disabled = false; ok.focus();
    }, 1300);
  });

  // Fischautomat: three reels of the site's fish.
  const SYMBOLS = [
    { id: 'pixel',   img: 'img/fish-icon.png',        w: 30, pay: 4, pixel: true },
    { id: 'spezi',   img: 'img/spezifisch3.png',      w: 24, pay: 6 },
    { id: 'schuh',   img: 'img/fih.gif',              w: 17, pay: 10 },
    { id: 'lo',      img: 'img/lo.gif',               w: 12, pay: 18 },
    { id: 'lippe',   img: 'img/lippenfisch-spin.gif', w: 8,  pay: 40 },
    { id: 'odfisch', img: 'img/odfish.jpg',           w: 3,  pay: 150 },
    { id: 'ratte',   img: 'img/rat.gif',              w: 6,  pay: 0 },
  ];
  const PAIR = 1.5, MIN_BET = 50, MAX_BET = 1000, STEP = 50;
  let bet = 100, spinning = false;
  const maxBet = () => Math.min(MAX_BET, Math.max(MIN_BET, Math.floor(save.coins / STEP) * STEP));
  function setBet(v) {
    v = Math.round(+v);
    bet = Number.isFinite(v) ? Math.min(MAX_BET, Math.max(MIN_BET, v)) : MIN_BET;
    renderCasino();
  }
  $('bet-down').addEventListener('click', () => setBet(Math.ceil(bet / STEP) * STEP - STEP));
  $('bet-up').addEventListener('click', () => setBet(Math.floor(bet / STEP) * STEP + STEP));
  $('bet-input').addEventListener('input', e => { const v = Math.round(+e.target.value); if (v >= MIN_BET && v <= MAX_BET) { bet = v; renderCasino(); } });
  $('bet-input').addEventListener('change', e => setBet(e.target.value));
  $('bet-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); setBet(e.target.value); e.target.blur(); } });
  $('bets').querySelectorAll('[data-bet]').forEach(btn => btn.addEventListener('click', () =>
    setBet(btn.dataset.bet === 'max' ? maxBet() : btn.dataset.bet)));
  const symW = SYMBOLS.reduce((a, s) => a + s.w, 0);
  function rollSymbol() {
    let r = Math.random() * symW;
    for (const s of SYMBOLS) { r -= s.w; if (r <= 0) return s; }
    return SYMBOLS[0];
  }
  function setSlot(el, sym) {
    const img = el.querySelector('img');
    if (img.getAttribute('src') !== sym.img) img.src = sym.img;
    img.className = sym.pixel ? 'pixel' : '';
  }
  function slotPayout(r) {
    const ids = r.map(s => s.id);
    if (ids[0] === ids[1] && ids[1] === ids[2]) return { mult: r[0].pay, hits: [0, 1, 2] };
    if (ids.filter(i => i === 'ratte').length >= 2) return { mult: 0, hits: [], rat: true };
    for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++)
      if (ids[a] === ids[b] && ids[a] !== 'ratte') return { mult: PAIR, hits: [a, b] };
    return { mult: 0, hits: [] };
  }
  function renderCasino() {
    $('casino-coins').textContent = save.coins;
    $('bet-input').disabled = spinning;
    if (document.activeElement !== $('bet-input')) $('bet-input').value = bet;
    $('bet-down').disabled = spinning || bet <= MIN_BET;
    $('bet-up').disabled = spinning || bet >= MAX_BET;
    $('bets').querySelectorAll('[data-bet]').forEach(btn => {
      const v = btn.dataset.bet === 'max' ? maxBet() : +btn.dataset.bet;
      btn.disabled = spinning || (btn.dataset.bet === 'max' && save.coins < MIN_BET);
      btn.classList.toggle('on', v === bet);
    });
    $('spin').disabled = spinning || save.coins < bet;
    $('spin').textContent = save.coins < bet && !spinning ? tr('Zu wenig Taler – geh fischen!') : tr('Drehen ({n} Taler)', { n: bet });
    if (!$('paytable').childElementCount) {
      const rows = SYMBOLS.filter(s => s.pay).sort((a, b) => b.pay - a.pay).flatMap(s => {
        const icons = document.createElement('span');
        for (let i = 0; i < 3; i++) { const im = document.createElement('img'); im.src = s.img; im.alt = ''; icons.append(im); }
        const v = document.createElement('b'); v.textContent = `× ${s.pay}`;
        return [icons, v];
      });
      const pi = document.createElement('span'); pi.textContent = tr('Zwei gleiche');
      const pv = document.createElement('b'); pv.textContent = `× ${PAIR}`;
      const ri = document.createElement('span'); ri.textContent = tr('🐀 Ratten');
      const rv = document.createElement('b'); rv.textContent = tr('fressen alles');
      $('paytable').append(...rows, pi, pv, ri, rv);
    }
  }
  $('reels').querySelectorAll('.slot').forEach((el, i) => setSlot(el, SYMBOLS[[5, 4, 3][i]]));
  $('spin').addEventListener('click', () => {
    if (spinning || save.coins < bet) return;
    spinning = true;
    const stake = bet;
    save.coins -= stake; persist(); updateCoins();
    const result = [rollSymbol(), rollSymbol(), rollSymbol()];
    const slots = [...$('reels').querySelectorAll('.slot')];
    slots.forEach(s => s.classList.remove('hit'));
    $('slot-result').className = 'result'; $('slot-result').textContent = '…';
    renderCasino();
    sfx.whoosh();
    slots.forEach((el, i) => {
      el.classList.add('spinning');
      const iv = setInterval(() => setSlot(el, SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]), 70);
      setTimeout(() => {
        clearInterval(iv); el.classList.remove('spinning'); setSlot(el, result[i]);
        tone(300 + i * 120, .08, 'square', .06);
        if (i === 2) finishSpin(result, stake, slots);
      }, 700 + i * 450);
    });
  });
  function finishSpin(result, stake, slots) {
    const { mult, hits, rat } = slotPayout(result);
    const win = Math.round(stake * mult);
    save.coins += win;
    save.gamble = (save.gamble || 0) + win - stake;
    bealinEvent({ type: 'slot', won: win > stake });
    persist(); updateCoins();
    hits.forEach(i => slots[i].classList.add('hit'));
    const r = $('slot-result');
    if (mult >= 40) { r.className = 'result big'; r.textContent = tr('JACKPOT! +{n} Taler', { n: win }); playFile(result[0].id === 'odfisch' ? 'sounds/fish.mp3' : 'sounds/jetzt-kommt-travis.mp3'); sfx.coin(); setTimeout(sfx.coin, 200); setTimeout(sfx.coin, 400); }
    else if (win > 0) { r.className = 'result win'; r.textContent = tr('Gewonnen! +{n} Taler', { n: win }); sfx.coin(); }
    else { r.className = 'result lose'; r.textContent = rat ? tr('Die Ratten haben deinen Einsatz gefressen.') : tr('Nichts. Nochmal?'); tone(200, .3, 'triangle', .06, -80); }
    spinning = false;
    renderCasino();
  }

  let lastCatchVal = 0;
  function showCatch(f, size, val, first, mut, newMut, gain, shiny, newShiny) {
    lastCatchVal = val;
    $('catch-double').hidden = false; $('catch-double').disabled = false;
    $('catch-double').textContent = tr('🎲 Doppelt oder nichts ({n})', { n: val });
    $('catch-flip').hidden = true; $('catch-ok').disabled = false;
    $('catch-rarity').textContent = RARITY[f.r].label;
    $('catch-rarity').className = 'rarity r-' + f.r;
    $('catch-img').src = f.img; $('catch-img').alt = f.name;
    $('catch-img').classList.toggle('pixel', !!f.pixel);
    $('catch-img').classList.toggle('photo', !!f.photo);
    $('catch-name').textContent = f.name;
    $('catch-img').className = $('catch-img').className.replace(/\bmut-\S+/g, '').trim();
    if (mut) $('catch-img').classList.add('mut-' + mut.id);
    $('catch-img').classList.toggle('shiny', !!shiny);
    $('catch-img').style.setProperty('--shiny-hue', shiny ? shinyHue(f.id) + 'deg' : '');
    $('catch-shiny').hidden = !shiny;
    if (shiny) $('catch-shiny').textContent = tr('💫 Shiny · ×{n} Wert', { n: SHINY_VAL }) + (newShiny ? tr(' · neu im Shinydex!') : '');
    const mb = $('catch-mut');
    mb.hidden = !mut;
    if (mut) { mb.textContent = `${mut.icon} ${mut.name} · ` + tr('×{n} Wert', { n: mut.val }) + (newMut ? tr(' · neue Mutation!') : ''); mb.style.setProperty('--mc', mut.c); }
    $('catch-desc').textContent = f.desc;
    $('catch-xp').textContent = gain ? [tr('+{n} EP', { n: gain.xp }), ...gain.tags].join(' · ') : '';
    $('catch-say').textContent = I18N.lang === 'en' ? `“${f.say}”` : `„${f.say}“`;
    const sheet = $('catch').querySelector('.sheet');
    sheet.classList.remove('fx-rare', 'fx-wii', 'fx-epic', 'fx-legendary');
    void sheet.offsetWidth; // restart the CSS animations
    if (FANFARE[f.r]) sheet.classList.add('fx-' + f.r);
    sheet.classList.toggle('is-shiny', !!shiny);
    const conf = $('catch-confetti');
    conf.replaceChildren();
    const nConf = { rare: 0, wii: 14, epic: 18, legendary: 36 }[f.r] || 0;
    for (let i = 0; i < nConf; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = (Math.random() * 1.2).toFixed(2) + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.4).toFixed(2) + 's';
      p.style.setProperty('--spin', (Math.random() < .5 ? -1 : 1) * (360 + Math.random() * 360) + 'deg');
      p.style.background = ['#fbbf24', '#fde68a', '#c084fc', '#38bdf8', '#4ade80', '#f472b6'][i % 6];
      conf.append(p);
    }
    $('catch-size').textContent = size + ' cm' + (save.dex[f.id].best === size && !first ? ' 🏆' : '');
    $('catch-value').textContent = tr('+{n} Taler', { n: val });
    $('catch-new').hidden = !first;
    $('catch').hidden = false;
    $('catch-ok').focus();
  }

  let dexTab = 'fish';
  const SHINY_REWARDS = ['s1', 's5', 'sall'];
  function shinysFound() { return FISH.filter(f => save.dex[f.id] && save.dex[f.id].shiny).length; }
  function renderShinydex() {
    $('dex-count').textContent = tr('{a} von {b} Shinys gefunden · Chance pro Fang gerade {c} %', { a: shinysFound(), b: FISH.length, c: (shinyChance() * 100).toLocaleString(I18N.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
    renderDexRewards();
    $('dex-grid').replaceChildren(...FISH.map(f => {
      const e = save.dex[f.id], sh = e && e.shiny;
      const c = document.createElement('div');
      c.className = 'card ' + (sh ? 'b-' + f.r + ' shiny-card' : 'unknown');
      const img = document.createElement('img'); img.loading = 'lazy';
      if (sh) { img.style.setProperty('--shiny-hue', shinyHue(f.id) + 'deg'); img.src = f.img; img.alt = f.name + ' (Shiny)'; img.className = ['shiny', f.pixel ? 'pixel' : '', f.photo ? 'photo' : ''].join(' ').trim(); }
      else if (e && !f.photo) { img.src = f.img; img.alt = tr('Noch kein Shiny'); img.className = 'shadow' + (f.pixel ? ' pixel' : ''); }
      else { img.src = 'img/fish-icon.png'; img.alt = tr('Unbekannt'); img.className = 'pixel shadow'; }
      const name = document.createElement('b'); name.textContent = sh ? '💫 ' + f.name : e ? f.name : '???';
      const r = document.createElement('small'); r.className = 'r-' + f.r; r.textContent = RARITY[f.r].label;
      const info = document.createElement('small');
      info.textContent = sh ? tr('{n}× shiny gefangen', { n: e.shiny }) : e ? tr('Noch kein Shiny') : tr('Erst normal fangen');
      c.append(img, name, r, info);
      return c;
    }));
  }
  function renderDex() {
    document.querySelectorAll('[data-dex-tab]').forEach(t => {
      const on = t.dataset.dexTab === dexTab; t.classList.toggle('on', on); t.setAttribute('aria-selected', on);
    });
    $('dex-title').textContent = dexTab === 'shiny' ? tr('Shinydex') : tr('Fischdex');
    if (dexTab === 'shiny') return renderShinydex();
    const got = FISH.filter(f => save.dex[f.id]).length;
    const g = save.gamble || 0;
    $('dex-count').textContent = tr('{a} von {b} entdeckt · {c} von {d} Mutationen · {e} Fänge insgesamt', { a: got, b: FISH.length, c: mutsFound().length, d: MUTATIONS.length, e: save.total }) + (save.gamble !== undefined ? tr(' · Glücksspiel {n} Taler', { n: (g >= 0 ? '+' : '') + g }) : '');
    renderDexRewards();
    $('dex-grid').replaceChildren(...FISH.map(f => {
      const e = save.dex[f.id];
      const c = document.createElement('div');
      c.className = 'card ' + (e ? 'b-' + f.r : 'unknown');
      const img = document.createElement('img');
      const hide = !e && f.photo;
      img.src = hide ? 'img/fish-icon.png' : f.img; img.alt = e ? f.name : tr('Unbekannt'); img.loading = 'lazy';
      img.className = [f.pixel || hide ? 'pixel' : '', e && f.photo ? 'photo' : ''].join(' ').trim();
      const name = document.createElement('b'); name.textContent = e ? f.name : '???';
      const r = document.createElement('small'); r.className = 'r-' + f.r; r.textContent = RARITY[f.r].label;
      const info = document.createElement('small');
      info.textContent = e ? tr('{n}× · Rekord {b} cm', { n: e.n, b: e.best }) : hintFor(f);
      c.append(img, name, r, info);
      if (e && f.page) {
        const a = document.createElement('a'); a.className = 'page'; a.href = f.page; a.textContent = tr('Seite ansehen ↗');
        c.append(a);
      }
      if (e && e.muts) {
        const m = document.createElement('div'); m.className = 'muts';
        for (const mu of MUTATIONS) if (e.muts[mu.id]) {
          const sp = document.createElement('span'); sp.textContent = mu.icon; sp.title = `${mu.name} ×${e.muts[mu.id]}`; m.append(sp);
        }
        c.append(m);
      }
      if (e) {
        const q = document.createElement('q'); q.textContent = f.say;
        c.append(q); c.title = f.desc;
      }
      return c;
    }));
  }
  // ---- Fischdex rewards: milestones for discovering fish and mutations
  const DEX_REWARDS = [
    { id: 'f5',   name: '5 Fische entdeckt',   need: () => [discovered(), 5],   coins: 150 },
    { id: 'f10',  name: '10 Fische entdeckt',  need: () => [discovered(), 10],  coins: 400,  scales: 2 },
    { id: 'f15',  name: '15 Fische entdeckt',  need: () => [discovered(), 15],  coins: 1000, scales: 4 },
    { id: 'fall', name: 'Fischdex komplett',   need: () => [discovered(), FISH.length], coins: 2500, scales: 8, perk: 'taler10', perkText: 'dauerhaft +10 % Taler' },
    ...['common', 'uncommon', 'rare', 'wii', 'epic', 'legendary', 'junk'].map(r => ({
      id: 'r-' + r, name: { common: 'Alle Gewöhnlichen', uncommon: 'Alle Ungewöhnlichen', rare: 'Alle Seltenen', wii: 'Alle Wii-Fische', epic: 'Alle Epischen', legendary: 'Alle Legendären', junk: 'Aller Müll' }[r],
      need: () => [FISH.filter(f => f.r === r && save.dex[f.id]).length, FISH.filter(f => f.r === r).length],
      coins: { common: 100, uncommon: 250, rare: 500, wii: 900, epic: 1200, legendary: 2000, junk: 150 }[r],
      scales: { common: 0, uncommon: 1, rare: 2, wii: 3, epic: 3, legendary: 5, junk: 1 }[r],
      perk: r === 'legendary' ? 'luck10' : undefined, perkText: r === 'legendary' ? 'dauerhaft +10 % Glück' : undefined,
    })),
    { id: 'm1',   name: 'Erste Mutation',      need: () => [mutsFound().length, 1], coins: 100 },
    { id: 'm4',   name: '4 Mutationen',        need: () => [mutsFound().length, 4], coins: 600, scales: 2 },
    { id: 's1',   name: 'Erster Shiny',        need: () => [shinysFound(), 1],  coins: 300,  scales: 1 },
    { id: 's5',   name: '5 Shinys',            need: () => [shinysFound(), 5],  coins: 1500, scales: 3 },
    { id: 'sall', name: 'Shinydex komplett',   need: () => [shinysFound(), FISH.length], coins: 10000, scales: 15, perk: 'shiny2', perkText: 'dauerhaft doppelte Shiny-Chance' },
    { id: 'mall', name: 'Alle Mutationen',     need: () => [mutsFound().length, MUTATIONS.length], coins: 2000, scales: 6, perk: 'mutchance', perkText: 'dauerhaft +25 % Mutationschance' },
  ];
  trAll(DEX_REWARDS, ['name', 'perkText']);
  function discovered() { return FISH.filter(f => save.dex[f.id]).length; }
  function mutsFound() { return MUTATIONS.filter(m => FISH.some(f => save.dex[f.id] && save.dex[f.id].muts && save.dex[f.id].muts[m.id])); }
  function dexPerk(p) { return (save.dexClaimed || []).some(id => (DEX_REWARDS.find(r => r.id === id) || {}).perk === p); }
  function dexClaimable() { return DEX_REWARDS.filter(r => { const [h, n] = r.need(); return h >= n && !(save.dexClaimed || []).includes(r.id); }); }
  function claimDex(r) {
    save.dexClaimed = save.dexClaimed || [];
    if (save.dexClaimed.includes(r.id)) return;
    save.dexClaimed.push(r.id);
    save.coins += r.coins; save.scales += r.scales || 0; save.totalEarned += r.coins;
    sfx.coin(); setTimeout(sfx.coin, 150);
    const ep = gainXp(r.coins / 5);
    toast(`📖 ${r.name}: ` + tr('+{c} Taler · +{e} EP', { c: r.coins, e: ep }) + `${r.scales ? ` · +${r.scales} 🐚` : ''}${r.perkText ? ' · ' + r.perkText : ''}`);
    persist(); updateCoins(); updateDexBadge(); renderDex();
  }
  function updateDexBadge() { $('btn-dex').classList.toggle('ready', dexClaimable().length > 0); }
  document.querySelectorAll('[data-dex-tab]').forEach(t => t.addEventListener('click', () => { dexTab = t.dataset.dexTab; renderDex(); }));
  function renderDexRewards() {
    const claimed = save.dexClaimed || [];
    // the Shinydex tab shows only shiny rewards, the Fischdex tab the rest
    $('dex-rewards').replaceChildren(...DEX_REWARDS.filter(r => (dexTab === 'shiny') === SHINY_REWARDS.includes(r.id)).map(r => {
      const [h, n] = r.need(), done = h >= n, got = claimed.includes(r.id);
      const d = document.createElement('div'); d.className = 'reward' + (got ? ' got' : done ? ' ready' : '');
      const b = document.createElement('b'); b.textContent = r.name;
      const s = document.createElement('small');
      s.textContent = `${Math.min(h, n)}/${n} · ` + tr('{n} Taler', { n: r.coins }) + `${r.scales ? ` · ${r.scales} 🐚` : ''}${r.perkText ? ' · ' + r.perkText : ''}`;
      const bar = document.createElement('div'); bar.className = 'qbar';
      const fi = document.createElement('i'); fi.style.width = Math.min(100, h / n * 100) + '%'; bar.append(fi);
      d.append(b, bar, s);
      if (got) { const ok = document.createElement('span'); ok.className = 'tick'; ok.textContent = '✓'; d.append(ok); }
      else if (done) { const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = tr('Abholen'); btn.addEventListener('click', () => claimDex(r)); d.append(btn); }
      return d;
    }));
  }

  function hintFor(f) {
    if (f.hint) return f.hint;
    if (f.dayOff) return tr('Nur nachts, weit draußen');
    if (f.far) return tr('Weit draußen');
    if (f.night) return tr('Lieber nachts');
    return tr('Noch nicht gefangen');
  }

  // ---- shop: Herr Zylinderwels sells rods and bait; every item has its own pixel icon
  const KEEPER = {
    hello: ['Ah, Kundschaft! Treten Sie näher.', 'Feinste Ruten, frisch aus dem Teich.', 'Was darf es sein, werter Angler?', 'Zylinder ab vor so viel Taler!', 'Blubb. Verzeihung. Willkommen!'],
    buy: ['Exzellente Wahl!', 'Ein Kauf mit Stil.', 'Möge sie Ihnen viele Fische bringen.', 'Sehr wohl, sehr wohl.'],
    bait: ['Frisch eingetroffen!', 'Die Fische werden Sie lieben.', 'Mit Vergnügen.'],
    equip: ['Steht Ihnen ausgezeichnet.', 'Eine gute Hand für gutes Gerät.'],
    poor: n => tr('Da fehlen noch {n} Taler, mein Bester.', { n }),
    locked: l => tr('Dafür ist es noch zu früh. {l}, dann reden wir.', { l: l.replace('🔒 ', '') }),
  };
  for (const k of ['hello', 'buy', 'bait', 'equip']) KEEPER[k] = KEEPER[k].map(l => tr(l));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let shopTab = 'rods';
  function keeper(line) {
    $('keeper-say').textContent = line;
    welsSay(line.length > 34 ? line.slice(0, 32) + '…' : line);
    tone(180 + Math.random() * 60, .12, 'sine', .06, 120); // blubb
  }

  // 16x16 pixel icons, drawn once
  function iconCanvas(draw) {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const x = c.getContext('2d'); draw((px, py, col) => { x.fillStyle = col; x.fillRect(px, py, 1, 1); });
    return c.toDataURL();
  }
  const ROD_COLORS = {
    stock: i => i % 5 === 0 ? '#5b3416' : '#8b5a2b',
    bambus: i => i % 4 === 0 ? '#5f6b1f' : '#b5b84a',
    carbon: i => i % 6 === 0 ? '#38bdf8' : '#1f2937',
    gold: i => i % 3 === 0 ? '#fde68a' : '#f59e0b',
    regen: i => ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'][i % 6],
    stern: i => i % 4 === 0 ? '#e0e7ff' : '#312e81',
  };
  const ICONS = {};
  for (const r of RODS) ICONS[r.id] = iconCanvas(p => {
    const col = ROD_COLORS[r.id] || ROD_COLORS.stock;
    for (let i = 0; i < 13; i++) { p(2 + i, 13 - i, col(i)); if (i < 4) p(2 + i, 14 - i, col(i)); }   // rod, thicker grip
    p(3, 14, '#1b1f2e'); p(2, 14, '#1b1f2e');                                                       // butt cap
    for (const [a, b] of [[5, 12], [6, 12], [5, 13], [6, 13]]) p(a, b, '#64748b'); p(5, 12, '#cbd5e1'); // reel
    for (let y = 1; y < 9; y++) p(15, y, 'rgba(255,255,255,.7)');                                    // line
    p(15, 9, '#ef4444'); p(15, 10, '#f8fafc');                                                       // bobber
    if (r.id === 'stern') { p(13, 2, '#fde68a'); p(12, 3, '#fde68a'); p(14, 3, '#fde68a'); p(13, 4, '#fde68a'); p(13, 3, '#fff'); }
  });
  const BAIT_ART = {
    wurm:  [['....pppp........', '...pPPPPp.......', '...pP..Pp.......', '....p..Pp.......', '.......pP.ppp...', '.......pPpPPPp..', '........pP..Pp..', '.............Pp.', '.............Pp.', '............pPe.', '.............p..'], { p: '#f472b6', P: '#ec4899', e: '#1b1f2e' }],
    spezi: [['......kk........', '......kk........', '.....kbbk.......', '....kbooBk......', '....kboyBk......', '....kbooBk......', '....kbyyBk......', '....kbooBk......', '....kbooBk......', '....kbbbBk......', '.....kkkk.......'], { k: '#1b1f2e', b: '#6b2d0f', B: '#4a1f0a', o: '#f97316', y: '#a855f7' }],
    glitzer: [['.......k........', '.......k........', '......kSk.......', '.....kSsSk......', '....kSsWsSk.....', '....kSsssSk.....', '....kSsWsSk.....', '.....kSsSk......', '......kSk.......', '.......k........', '......kkk.......'], { k: '#1b1f2e', S: '#cbd5e1', s: '#e2e8f0', W: '#fde68a' }],
    mond: [['.....kkkk.......', '...kkMMMMk......', '..kMMMmmkk......', '..kMMmk.........', '.kMMmk..........', '.kMMmk..........', '.kMMmk..........', '..kMMmk.........', '..kMMMmmkk......', '...kkMMMMk......', '.....kkkk.......'], { k: '#1b1f2e', M: '#fde68a', m: '#fbbf24' }],
  };
  for (const b of BAITS) ICONS[b.id] = iconCanvas(p => {
    const [rows, pal] = BAIT_ART[b.id] || BAIT_ART.wurm;
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) p(x + 1, y + 3, pal[ch]); }));
  });
  for (const b of BAITS) if (b.img) ICONS[b.id] = b.img;
  for (const b of BOXES) ICONS[b.id] = iconCanvas(p => {
    const [m, d, g] = b.col, k = '#1b1f2e';
    for (let x = 2; x < 14; x++) { p(x, 3, k); p(x, 14, k); }
    for (let y = 3; y < 15; y++) { p(1, y, k); p(14, y, k); }
    for (let y = 4; y < 14; y++) for (let x = 2; x < 14; x++) p(x, y, y < 7 ? (y === 4 ? g : m) : (x + y) % 5 ? m : d);
    for (let x = 2; x < 14; x++) p(x, 7, k);                       // lid edge
    for (let y = 4; y < 14; y++) { p(4, y, d); p(11, y, d); }       // bands
    p(7, 7, g); p(8, 7, g); p(7, 8, g); p(8, 8, g); p(7, 9, k); p(8, 9, k); // lock
    p(6, 1, '#fde68a'); p(9, 0, '#fde68a'); p(12, 1, '#fff');       // sparkle
    p(7, 5, '#fff'); p(8, 5, '#fff');                               // question mark hint
  });

  function statBar(label, v, max) {
    const d = document.createElement('div'); d.className = 'stat';
    const l = document.createElement('span'); l.textContent = label;
    const bar = document.createElement('i'); const f = document.createElement('b');
    f.style.width = Math.min(100, v / max * 100) + '%'; bar.append(f);
    d.append(l, bar); return d;
  }
  function ware({ id, name, desc, stats, state, btnText, disabled, onClick, owned }) {
    const c = document.createElement('div'); c.className = 'ware' + (state ? ' ' + state : '');
    const ic = document.createElement('img'); ic.className = 'ware-icon' + (ICONS[id].startsWith('data:') ? '' : ' photo'); ic.src = ICONS[id]; ic.alt = '';
    const b = document.createElement('b'); b.textContent = name;
    const s = document.createElement('small'); s.textContent = desc;
    const st = document.createElement('div'); st.className = 'stats'; st.append(...stats);
    const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = btnText;
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    btn.addEventListener('click', onClick);
    c.append(ic, b, s, st);
    if (owned) { const o = document.createElement('span'); o.className = 'owned'; o.textContent = owned; c.append(o); }
    c.append(btn);
    return c;
  }
  function boxWare(b) {
    const n = save.boxes[b.id] || 0, lock = lockText(b);
    return ware({
      id: b.id, name: b.name, desc: b.desc, stats: [],
      state: lock ? 'locked' : '',
      owned: n ? tr('{n} im Beutel', { n }) : '',
      btnText: n ? tr('Öffnen') : lock || tr('{n} Taler', { n: b.price }),
      disabled: !n && (!!lock || save.coins < b.price),
      onClick: () => {
        if (!n) {
          if (lock) return keeper(KEEPER.locked(lock));
          if (save.coins < b.price) return keeper(KEEPER.poor(b.price - save.coins));
          save.coins -= b.price; sfx.coin(); keeper(tr('Was drin ist, weiß nicht mal ich.'));
        } else save.boxes[b.id] = n - 1;
        openBox(b);
      },
    });
  }
  // roll and pay out the prize right away (so a reload mid-animation loses nothing), then reveal it
  function rollBox(b) {
    const T = b.tier, P = b.price;
    const baits = BAITS.filter(x => x.pack && !lockText(x));
    // Balance: bought boxes return ~85-90 % of their price on average (coins alone ~70 %, the
    // rest as bait, XP and Schuppen). Prizes don't use the Taler bonus, otherwise boxes would
    // turn into a money machine for players with many rebirths.
    const table = [
      { w: 55, f: () => { const c = Math.round(P * (.6 + Math.random() * .8)); save.coins += c; save.totalEarned += c; return tr('🪙 {n} Taler', { n: c }); } },
      { w: 14, f: () => { const x = pick(baits), c = [5, 10, 20][T]; save.baits[x.id] = (save.baits[x.id] || 0) + c; updateGear(); return tr('{n}× {b}', { n: c, b: x.name }); } },
      { w: 14, f: () => tr('⭐ {n} EP', { n: gainXp(xpNeed(save.lvl) * [.2, .4, .8][T]) }) },
      { w: [2, 5, 7][T], f: () => { const c = [1, 2, 4][T]; save.scales += c; return tr('🐚 Schuppen: {n}', { n: c }); } },
      { w: 6, f: () => { save.coins += 5; return tr('🧦 Eine alte Socke. Und 5 Taler.'); } },
      { w: 2, f: () => { const c = P * 5; save.coins += c; save.totalEarned += c; return tr('💰 JACKPOT! {n} Taler', { n: c }); }, big: true },
    ];
    let r = Math.random() * table.reduce((a, t) => a + t.w, 0), hit = table[0];
    for (const t of table) { r -= t.w; if (r <= 0) { hit = t; break; } }
    const text = hit.f();
    persist(); updateCoins();
    return { text, big: !!hit.big };
  }
  let boxTimer = 0;
  function openBox(b) {
    const prize = rollBox(b);
    if (!$('shop').hidden) renderShop(false);
    $('box-title').textContent = b.name;
    $('box-img').src = ICONS[b.id];
    $('box-prize').textContent = '…';
    const art = $('box-art'); art.classList.remove('open', 'big'); void art.offsetWidth; art.classList.add('shake');
    $('box-ok').disabled = true; $('box-again').hidden = true;
    $('box').hidden = false;
    [0, 1, 2, 3].forEach(i => setTimeout(() => tone(260 + i * 40, .06, 'square', .05), i * 250));
    clearTimeout(boxTimer);
    boxTimer = setTimeout(() => {
      art.classList.remove('shake'); art.classList.add('open'); if (prize.big) art.classList.add('big');
      $('box-prize').textContent = prize.text;
      [523, 659, 784, prize.big ? 1319 : 1047].forEach((n, i) => setTimeout(() => tone(n, .12, 'square', .06), i * 80));
      if (prize.big) setTimeout(sfx.coin, 300);
      $('box-ok').disabled = false; $('box-ok').focus();
      const n = save.boxes[b.id] || 0;
      if (n || (!lockText(b) && save.coins >= b.price)) {
        $('box-again').hidden = false;
        $('box-again').textContent = n ? tr('Nächste öffnen ({n})', { n }) : tr('Noch eine ({n} Taler)', { n: b.price });
        $('box-again').onclick = () => { if (save.boxes[b.id]) save.boxes[b.id]--; else if (save.coins >= b.price) save.coins -= b.price; else return; openBox(b); };
      }
    }, 1100);
  }
  $('box-ok').addEventListener('click', () => { if (!$('box-ok').disabled) $('box').hidden = true; });
  function renderShop(greet) {
    updateCoins();
    if (greet !== false) keeper(pick(KEEPER.hello));
    document.querySelectorAll('[data-shop-tab]').forEach(t => {
      const on = t.dataset.shopTab === shopTab; t.classList.toggle('on', on); t.setAttribute('aria-selected', on);
    });
    const wares = shopTab === 'boxes' ? BOXES.map(boxWare) : shopTab === 'rods' ? RODS.map(r => {
      const owned = save.rods.includes(r.id), active = save.rod === r.id, lock = !owned && lockText(r);
      return ware({
        id: r.id, name: r.name, desc: r.desc,
        stats: [statBar(tr('Wurf'), r.cast, 1), statBar(tr('Kurbel'), r.reel, 2.6), statBar(tr('Glück'), r.luck, 2.1), statBar(tr('Ruhe'), 1.1 - r.tens, .7)],
        state: active ? 'active' : lock ? 'locked' : owned ? 'owned' : '',
        btnText: active ? tr('In der Hand') : owned ? tr('Nehmen') : lock || tr('{n} Taler', { n: r.price }),
        disabled: active || (!owned && (!!lock || save.coins < r.price)),
        onClick: () => {
          if (active) return keeper(pick(KEEPER.equip));
          if (lock) return keeper(KEEPER.locked(lock));
          if (!owned && save.coins < r.price) return keeper(KEEPER.poor(r.price - save.coins));
          if (!owned) { save.coins -= r.price; save.rods.push(r.id); sfx.coin(); keeper(pick(KEEPER.buy)); }
          else keeper(pick(KEEPER.equip));
          save.rod = r.id; persist(); updateGear(); renderShop(false);
        },
      });
    }) : BAITS.map(b => {
      const n = save.baits[b.id] || 0, active = save.bait === b.id, lock = b.pack && lockText(b);
      return ware({
        id: b.id, name: b.name, desc: b.desc,
        stats: [statBar(tr('Glück'), b.luck, 4.2), statBar(tr('Tempo'), b.speed, 2)],
        state: active ? 'active' : lock ? 'locked' : '',
        owned: b.pack ? (n ? tr('{n} im Beutel', { n }) : '') : '∞',
        btnText: !b.pack ? (active ? tr('Am Haken') : tr('Anködern')) : lock || tr('+{a} für {b}', { a: b.pack, b: b.price }),
        disabled: !b.pack ? active : (!!lock || save.coins < b.price),
        onClick: () => {
          if (!b.pack) { save.bait = 'wurm'; keeper(tr('Der gute alte Wurm. Klassisch.')); persist(); updateGear(); return renderShop(false); }
          if (lock) return keeper(KEEPER.locked(lock));
          if (save.coins < b.price) return keeper(KEEPER.poor(b.price - save.coins));
          save.coins -= b.price; save.baits[b.id] = n + b.pack; save.bait = b.id; sfx.coin();
          keeper(pick(KEEPER.bait)); persist(); updateCoins(); updateGear(); renderShop(false);
        },
      });
    });
    $('shop-wares').replaceChildren(...wares);
  }
  document.querySelectorAll('[data-shop-tab]').forEach(t => t.addEventListener('click', () => { shopTab = t.dataset.shopTab; renderShop(false); }));


  function flashSaved() {
    const el = document.getElementById('saved'); if (!el) return;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  // autosave: every few seconds if something changed, and when the tab is hidden or closed
  { const d = saveData(); delete d.saved; lastJson = JSON.stringify(d); }
  setInterval(persist, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); else if (stale) location.reload(); });
  window.addEventListener('pagehide', persist);
  // ask the browser not to clear the save on its own (e.g. Safari after a week without visits)
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch { /* ignore */ }
  // game open in a second tab: when that tab saves, this copy is out of date. Stop writing
  // (it would overwrite the newer progress) and reload to pick up the newer save.
  let stale = false;
  window.addEventListener('storage', e => {
    if (e.key !== SAVE_KEY || leaving) return;
    leaving = true;
    if (document.hidden) stale = true;
    else { toast(tr('Spiel in einem anderen Tab gespeichert – lade den neuen Spielstand …')); setTimeout(() => location.reload(), 1500); }
  });
  $('btn-reset').addEventListener('click', async () => {
    if (!confirm(tr('Spielstand wirklich löschen? Fischdex, Taler und Ausrüstung sind dann weg.') + (save.lb ? tr(' Dein Bestenlisten-Eintrag wird ebenfalls gelöscht.') : ''))) return;
    if (save.lb) { try { await fetch('/api/leaderboard', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: save.lb.id, token: save.lb.token }) }); } catch { /* offline: entry stays, can be removed on request */ } }
    leaving = true;
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    location.reload();
  });


  // ------------------------------------------------------------------ progression
  // Angler level (XP from catches), quests, and rebirth: reset coins, gear and level
  // for Schuppen, spent on permanent talents. Rebirths also raise the Taler bonus,
  // unlock new gear and recolour the hat.
  const XP = { common: 8, uncommon: 15, rare: 35, wii: 50, epic: 80, legendary: 200, junk: 4 };
  const xpNeed = l => Math.round(30 * Math.pow(l, 1.35));
  const DAILY_N = 10; // the first catches of each day give double XP
  let streak = 0;     // catches in a row without losing a fish (not saved)
  const rebirthLvl = () => 12 + save.rebirths * 3;
  const RARITY_ORDER = ['junk', 'common', 'uncommon', 'rare', 'wii', 'epic', 'legendary'];
  const PERKS = [
    { id: 'taler',  icon: '🪝', name: 'Goldener Haken', desc: l => tr('+{n} % Taler pro Fang', { n: l * 10 }) },
    { id: 'glueck', icon: '🍀', name: 'Glückspilz',     desc: l => tr('+{n} % Glück für seltene Fische', { n: l * 8 }) },
    { id: 'biss',   icon: '⏱️', name: 'Lockruf',        desc: l => tr('Bisse kommen {n} % schneller', { n: l * 8 }) },
    { id: 'schnur', icon: '🧵', name: 'Starke Schnur',  desc: l => tr('{n} % weniger Spannung', { n: l * 6 }) },
    { id: 'wissen', icon: '📚', name: 'Anglerwissen',   desc: l => tr('+{n} % Erfahrung', { n: l * 15 }) },
    { id: 'erbe',   icon: '💰', name: 'Erbstück',       desc: l => tr('Start mit {n} Talern nach der Wiedergeburt', { n: l * 150 }) },
  ];
  trAll(PERKS, ['name']);
  const PERK_MAX = 5;
  const perkCost = l => 2 + l * 2;
  function perk(id) { return save.perks[id] || 0; }
  function coinMult() { return (1 + .2 * save.rebirths) * (1 + .1 * perk('taler')) * (dexPerk('taler10') ? 1.1 : 1); }
  function lockText(item) {
    if (item.reb && save.rebirths < item.reb) return tr('🔒 {n}× Wiedergeburt', { n: item.reb });
    if (item.lvl && save.lvl < item.lvl) return tr('🔒 Level {n}', { n: item.lvl });
    return '';
  }
  function scalesFor() { return Math.floor(save.lvl / 2) + Math.floor(Math.sqrt(save.lifeCoins / 40)); }

  function gainXp(n, quiet) {
    const add = Math.round(n * (1 + .15 * perk('wissen')));
    save.xp += add;
    const from = save.lvl;
    let reward = 0;
    while (save.xp >= xpNeed(save.lvl)) { save.xp -= xpNeed(save.lvl); save.lvl++; reward += 20 * save.lvl; }
    if (save.lvl > from && !quiet) {
      save.coins += reward; updateCoins();
      toast(tr('⭐ Level {l}! +{n} Taler', { l: save.lvl, n: reward }));
      const unlocked = [...RODS, ...BAITS].filter(it => it.lvl > from && it.lvl <= save.lvl && !lockText(it)).map(it => it.name);
      if (unlocked.length) toast(tr('🔓 Freigeschaltet: {l}', { l: unlocked.join(', ') }));
      if (from < rebirthLvl() && save.lvl >= rebirthLvl()) toast(tr('🌀 Wiedergeburt möglich – schau in den Fortschritt!'));
      [523, 784, 1047].forEach((n, i) => setTimeout(() => tone(n, .14, 'square', .05), i * 90));
    }
    updateLevel();
    return add;
  }
  function updateLevel() {
    $('lvl-num').textContent = save.lvl;
    $('lvl-bar').style.width = Math.min(100, save.xp / xpNeed(save.lvl) * 100) + '%';
    $('lvl').title = tr('Level {l} · {x}/{n} EP', { l: save.lvl, x: save.xp, n: xpNeed(save.lvl) }) + (save.rebirths ? tr(' · {n}× wiedergeboren', { n: save.rebirths }) : '');
    $('lvl-reb').textContent = save.rebirths ? '🌀' + save.rebirths : '';
    $('btn-prog').classList.toggle('ready', save.lvl >= rebirthLvl() || save.quests.some(q => q.p >= q.n));
  }

  // ---- quests
  function makeQuest() {
    const L = save.lvl, used = save.quests.map(q => q.kind);
    const kinds = ['count', 'rar', 'size', 'coins', 'fish'].filter(k => !used.includes(k));
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const q = { kind, p: 0 };
    if (kind === 'count') { q.n = 4 + Math.floor(Math.random() * 3) + Math.floor(L / 3); }
    if (kind === 'rar') {
      q.r = L >= 8 && Math.random() < .4 ? 'epic' : L >= 3 && Math.random() < .6 ? 'rare' : 'uncommon';
      q.n = { uncommon: 3, rare: 2, epic: 1 }[q.r];
    }
    if (kind === 'size') { q.n = 1; q.cm = [40, 60, 80, 120, 160][Math.min(4, Math.floor(L / 3))]; }
    if (kind === 'coins') { q.n = Math.round((60 + L * 45) * coinMult() / 10) * 10; }
    if (kind === 'fish') {
      const pool = FISH.filter(f => ['common', 'uncommon', 'rare'].includes(f.r) && (L >= 5 || f.r !== 'rare') && !f.far);
      q.id = pool[Math.floor(Math.random() * pool.length)].id; q.n = 1 + (Math.random() < .5 ? 1 : 0);
    }
    const tier = { count: 1, rar: q.r === 'epic' ? 4 : q.r === 'rare' ? 2.5 : 1.5, size: 2, coins: 1.5, fish: 1.5 }[kind];
    q.xp = Math.round((20 + L * 6) * tier);
    q.coins = Math.round((30 + L * 12) * tier / 5) * 5;
    return q;
  }
  function questText(q) {
    switch (q.kind) {
      case 'count': return tr('Fange {n} Fische', { n: q.n });
      case 'rar': return tr('Fange {n}× {r} oder besser', { n: q.n, r: RARITY[q.r].label });
      case 'size': return tr('Fange einen Fang ab {n} cm', { n: q.cm });
      case 'coins': return tr('Verdiene {n} Taler mit Fängen', { n: q.n });
      case 'fish': return tr('Fange {n}× {f}', { n: q.n, f: FISH.find(f => f.id === q.id).name });
    }
  }
  function fillQuests() { while (save.quests.length < 3) save.quests.push(makeQuest()); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function dailyLeft() {
    if (!save.daily || save.daily.d !== today()) save.daily = { d: today(), n: 0 };
    return Math.max(0, DAILY_N - save.daily.n);
  }
  // XP for one catch: base by rarity and size, plus additive bonuses so nothing stacks out of control
  function catchXp(f, size, first, mut, newMut, clean, shiny, newShiny) {
    const base = XP[f.r] * (first ? 3 : 1) * (1 + Math.min(2, size / f.max) / 4);
    let m = 1; const tags = [];
    if (f.r !== 'junk') {
      streak++; save.bestStreak = Math.max(save.bestStreak || 0, streak);
      if (streak > 1) { m += Math.min(.5, .1 * (streak - 1)); tags.push(tr('🔥 Serie ×{n}', { n: streak })); }
      if (clean) { m += .25; tags.push(tr('✨ Sauber')); }
    }
    if (mut) { m += mut.val / 4; tags.push(`${mut.icon} ${mut.name}`); }
    if (shiny) { m += 1; tags.push(tr('💫 Shiny')); }
    if (isNight()) { m += .2; tags.push(tr('🌙 Nacht')); }
    if (dailyLeft() > 0) { save.daily.n++; m += 1; tags.push(tr('☀️ Tagesbonus {a}/{b}', { a: save.daily.n, b: DAILY_N })); }
    if (first) tags.push(tr('📖 Neu'));
    return { n: base * m + (newMut ? 40 : 0) + (newShiny ? 60 : 0), tags };
  }
  function endStreak() { streak = 0; }
  function lostXp(f) { // a lost fish still teaches something, and ends the streak
    endStreak();
    const n = gainXp(Math.max(1, XP[f.r] / 4));
    persist();
    return tr(' (+{n} EP)', { n });
  }
  function progressCatch(f, size, val, first, mut, newMut, clean, shiny, newShiny) {
    const c = catchXp(f, size, first, mut, newMut, clean, shiny, newShiny);
    const gain = { xp: gainXp(c.n), tags: c.tags };
    for (const q of save.quests) {
      if (q.p >= q.n) continue;
      if (q.kind === 'count' && f.r !== 'junk') q.p++;
      if (q.kind === 'rar' && f.r !== 'junk' && RARITY_ORDER.indexOf(f.r) >= RARITY_ORDER.indexOf(q.r)) q.p++;
      if (q.kind === 'size' && size >= q.cm) q.p++;
      if (q.kind === 'coins') q.p = Math.min(q.n, q.p + val);
      if (q.kind === 'fish' && f.id === q.id) q.p++;
      if (q.p >= q.n) toast(tr('📜 Auftrag erledigt: {q} – im Fortschritt abholen', { q: questText(q) }));
    }
    updateLevel();
    return gain;
  }
  function claimQuest(i) {
    const q = save.quests[i]; if (!q || q.p < q.n) return;
    save.quests.splice(i, 1); save.questsDone++;
    save.coins += q.coins; save.lifeCoins += q.coins; save.totalEarned += q.coins;
    sfx.coin(); toast(tr('📜 +{c} Taler · +{x} EP', { c: q.coins, x: q.xp }));
    gainXp(q.xp); fillQuests(); persist(); updateCoins(); renderProg();
  }
  function rerollQuest(i) {
    const cost = 10 + save.lvl * 2;
    if (save.coins < cost) return;
    save.coins -= cost; save.quests.splice(i, 1); save.quests.splice(i, 0, makeQuest()); persist(); updateCoins(); renderProg();
  }

  // ---- rebirth
  function rebirth() {
    if (save.lvl < rebirthLvl()) return;
    const gain = scalesFor();
    if (!confirm(tr('Wiedergeburt?\n\nDu bekommst {n} Schuppen und dauerhaft +20 % Taler.\nTaler, Ruten, Köder, Level und Aufträge werden zurückgesetzt.\nFischdex, Rekorde und Talente bleiben.', { n: gain }))) return;
    save.rebirths++; save.scales += gain;
    Object.assign(save, { lvl: 1, xp: 0, coins: perk('erbe') * 150, rod: 'stock', rods: ['stock'], bait: 'wurm', baits: { wurm: Infinity }, lifeCoins: 0, quests: [] });
    fillQuests(); persist(); updateCoins(); updateGear(); updateLevel(); renderProg();
    const st = $('stage'); st.classList.remove('reborn'); void st.offsetWidth; st.classList.add('reborn');
    [262, 330, 392, 523, 659, 784, 1047].forEach((n, i) => setTimeout(() => tone(n, .25, 'triangle', .08), i * 120));
    toast(tr('🌀 Wiedergeboren! +{n} Schuppen · Taler-Bonus jetzt +{p} %', { n: gain, p: Math.round((coinMult() - 1) * 100) }));
  }
  function buyPerk(id) {
    const l = perk(id), c = perkCost(l);
    if (l >= PERK_MAX || save.scales < c) return;
    save.scales -= c; save.perks[id] = l + 1; sfx.coin(); persist(); renderProg();
  }

  function renderProg() {
    updateLevel();
    const need = xpNeed(save.lvl);
    $('prog-level').textContent = save.lvl;
    $('prog-xp').textContent = tr('{x} / {n} EP', { x: save.xp, n: need });
    $('prog-xpbar').style.width = Math.min(100, save.xp / need * 100) + '%';
    $('prog-stats').textContent = tr('{a} Fänge · {b} Aufträge · {c}× wiedergeboren · Taler-Bonus +{p} %', { a: save.total, b: save.questsDone, c: save.rebirths, p: Math.round((coinMult() - 1) * 100) });
    const left = dailyLeft();
    $('prog-bonus').textContent = (left ? tr('☀️ Tagesbonus: noch {n} Fänge mit doppelten EP', { n: left }) : tr('☀️ Tagesbonus für heute aufgebraucht – morgen wieder')) +
      tr(' · 🔥 Serie {n} (Rekord {r})', { n: streak, r: save.bestStreak || 0 });
    $('prog-quests').replaceChildren(...save.quests.map((q, i) => {
      const done = q.p >= q.n, d = document.createElement('div');
      d.className = 'quest' + (done ? ' done' : '');
      const txt = document.createElement('div');
      const b = document.createElement('b'); b.textContent = questText(q);
      const bar = document.createElement('div'); bar.className = 'qbar';
      const fill = document.createElement('i'); fill.style.width = Math.min(100, q.p / q.n * 100) + '%'; bar.append(fill);
      const s = document.createElement('small'); s.textContent = tr('{a} / {b} · Belohnung {c} Taler, {x} EP', { a: Math.min(q.p, q.n), b: q.n, c: q.coins, x: q.xp });
      txt.append(b, bar, s);
      const btn = document.createElement('button'); btn.className = 'btn' + (done ? '' : ' ghost');
      const cost = 10 + save.lvl * 2;
      btn.textContent = done ? tr('Abholen') : `🔄 ${cost}`;
      btn.title = done ? tr('Belohnung abholen') : tr('Neuer Auftrag für {n} Taler', { n: cost });
      btn.disabled = !done && save.coins < cost;
      btn.addEventListener('click', () => done ? claimQuest(i) : rerollQuest(i));
      d.append(txt, btn);
      return d;
    }));
    const req = rebirthLvl(), can = save.lvl >= req;
    $('reb-info').textContent = can
      ? tr('Bereit! Du bekommst {n} Schuppen und dauerhaft +20 % Taler. Taler, Ruten, Köder und Level werden zurückgesetzt. Fischdex, Rekorde und Talente bleiben.', { n: scalesFor() })
      : tr('Ab Level {r} möglich (noch {d}). Je höher dein Level und je mehr Taler du verdienst, desto mehr Schuppen gibt es (aktuell {n}).', { r: req, d: req - save.lvl, n: scalesFor() });
    $('btn-rebirth').disabled = !can;
    $('reb-next').textContent = save.rebirths < 1 ? tr('Freischaltung: Regenbogenrute (1×), Mondköder (2×), Sternenrute (3×), neue Hutfarben.')
      : save.rebirths < 3 ? tr('Nächste Freischaltung bei {x}.', { x: save.rebirths < 2 ? tr('2× – Mondköder') : tr('3× – Sternenrute') }) : tr('Alles freigeschaltet. Jede weitere Wiedergeburt: +20 % Taler.');
    $('prog-scales').textContent = save.scales;
    $('prog-perks').replaceChildren(...PERKS.map(p => {
      const l = perk(p.id), max = l >= PERK_MAX, c = perkCost(l);
      const d = document.createElement('div'); d.className = 'item perk';
      const txt = document.createElement('div');
      const b = document.createElement('b'); b.textContent = `${p.icon} ${p.name}`;
      const pips = document.createElement('span'); pips.className = 'pips';
      pips.textContent = '●'.repeat(l) + '○'.repeat(PERK_MAX - l); b.append(' ', pips);
      const s = document.createElement('small'); s.textContent = l ? p.desc(l) + (max ? '' : ` → ${p.desc(l + 1)}`) : p.desc(1);
      txt.append(b, s);
      const btn = document.createElement('button'); btn.className = 'btn';
      btn.textContent = max ? 'Max' : `${c} 🐚`; btn.disabled = max || save.scales < c;
      btn.addEventListener('click', () => buyPerk(p.id));
      d.append(txt, btn);
      return d;
    }));
  }
  $('btn-rebirth').addEventListener('click', rebirth);

  // older saves: turn past catches into a starting level, quietly
  if (!load().lvl) {
    let xp = 0;
    for (const f of FISH) if (save.dex[f.id]) xp += XP[f.r] * (save.dex[f.id].n + 2);
    gainXp(xp, true);
  }
  fillQuests();


  // ------------------------------------------------------------------ leaderboard (opt-in)
  // Only after the player chooses a nickname and agrees, scores are sent to /api/leaderboard
  // (Vercel Function + Upstash Redis). At most every 2 minutes and only when something improved.
  const LB_API = '/api/leaderboard';
  const LB_TABS = {
    taler:  { label: tr('🪙 Taler'),          fmt: s => tr('{n} Taler', { n: s.toLocaleString(I18N.locale) }) },
    wieder: { label: tr('🌀 Wiedergeburten'), fmt: s => s + '×' },
    dex:    { label: tr('📖 Fischdex'),       fmt: s => tr('{a} Fische · {b} Mut.', { a: Math.floor(s / 100), b: s % 100 }) },
    rekord: { label: tr('📏 Rekordfang'),     fmt: s => s + ' cm' },
  };
  const LB = { boards: null, tab: 'taler', ranks: null, err: '', busy: false };
  if (!save.totalEarned) save.totalEarned = Math.max(save.lifeCoins || 0, save.coins || 0);
  function lbScores() {
    return {
      taler: Math.floor(save.totalEarned),
      wieder: save.rebirths,
      dex: discovered() * 100 + mutsFound().length,
      rekord: Math.max(0, ...Object.values(save.dex).map(e => e.best || 0)),
    };
  }
  const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
  async function lbFetch(method, body) {
    const r = await fetch(LB_API, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch { /* not json */ }
    if (!r.ok) throw Object.assign(new Error(j.error || tr('Bestenliste gerade nicht erreichbar.')), { status: r.status });
    return j;
  }
  async function lbSubmit(force) {
    if (!save.lb || LB.busy) return;
    const sc = lbScores(), key = JSON.stringify(sc), since = Date.now() - (save.lbT || 0);
    if (key === save.lbKey || since < 55000 || (!force && since < 120000)) return;
    LB.busy = true; save.lbT = Date.now();
    try {
      const j = await lbFetch('POST', { id: save.lb.id, token: save.lb.token, name: save.lb.name, scores: sc });
      save.lbKey = key; save.lb.me = j.me; LB.ranks = j.ranks; LB.err = ''; persist();
    } catch (e) { LB.err = e.message; }
    LB.busy = false;
    if (!$('lb').hidden) renderLb();
  }
  setInterval(() => lbSubmit(), 130000);

  async function openLb() {
    renderLb();
    await lbSubmit(true);
    try { LB.boards = (await lbFetch('GET')).boards; LB.err = save.lb ? LB.err : ''; }
    catch (e) { LB.err = e.message; }
    renderLb();
  }
  function renderLb() {
    $('lb-tabs').replaceChildren(...Object.entries(LB_TABS).map(([id, t]) => {
      const b = document.createElement('button'); b.className = 'tab' + (LB.tab === id ? ' on' : '');
      b.textContent = t.label; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', LB.tab === id);
      b.addEventListener('click', () => { LB.tab = id; renderLb(); });
      return b;
    }));
    const rows = LB.boards && LB.boards[LB.tab];
    const list = $('lb-list');
    if (!rows) list.replaceChildren(Object.assign(document.createElement('li'), { className: 'empty', textContent: LB.err || tr('Lädt …') }));
    else if (!rows.length) list.replaceChildren(Object.assign(document.createElement('li'), { className: 'empty', textContent: tr('Noch niemand eingetragen. Sei der Erste!') }));
    else list.replaceChildren(...rows.map((r, i) => {
      const li = document.createElement('li'); if (save.lb && r.me === save.lb.me) li.className = 'mine';
      const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = ['🥇', '🥈', '🥉'][i] || i + 1;
      const n = document.createElement('b'); n.textContent = r.name;
      const sc = document.createElement('span'); sc.className = 'score'; sc.textContent = LB_TABS[LB.tab].fmt(r.score);
      li.append(pos, n, sc); return li;
    }));
    const my = LB.ranks && LB.ranks[LB.tab];
    $('lb-me').textContent = save.lb
      ? (my && my.rank ? tr('Dein Platz: {a} von {b} · {c}', { a: my.rank, b: my.of, c: LB_TABS[LB.tab].fmt(lbScores()[LB.tab]) }) : tr('Dein Wert: {c}', { c: LB_TABS[LB.tab].fmt(lbScores()[LB.tab]) })) + (LB.err && LB.boards ? ` · ${LB.err}` : '')
      : '';
    $('lb-join').hidden = !!save.lb; $('lb-joined').hidden = !save.lb;
    if (save.lb) $('lb-myname').textContent = save.lb.name;
  }
  $('lb-join-btn').addEventListener('click', async () => {
    const name = $('lb-name').value.replace(/\s+/g, ' ').trim();
    const err = $('lb-err');
    if (!/^[\p{L}\p{N} ._\-!?]{2,16}$/u.test(name)) { err.textContent = tr('Name: 2–16 Zeichen (Buchstaben, Zahlen, Leerzeichen, . _ - ! ?).'); return; }
    if (!$('lb-consent').checked) { err.textContent = tr('Bitte bestätige die Einwilligung.'); return; }
    err.textContent = ''; $('lb-join-btn').disabled = true;
    save.lb = { id: hex(20), token: hex(32), name }; save.lbKey = ''; save.lbT = 0;
    await lbSubmit(true);
    if (LB.err) { err.textContent = LB.err; delete save.lb; }
    persist(); $('lb-join-btn').disabled = false;
    openLb();
  });
  $('lb-leave').addEventListener('click', async () => {
    if (!save.lb || !confirm(tr('Eintrag aus der Bestenliste löschen? Dein Spielstand bleibt erhalten.'))) return;
    try { await lbFetch('DELETE', { id: save.lb.id, token: save.lb.token }); }
    catch (e) { if (e.status !== 403) { LB.err = e.message; renderLb(); return; } }
    delete save.lb; delete save.lbKey; delete save.lbT; LB.ranks = null; persist();
    toast(tr('Aus der Bestenliste ausgetragen.')); openLb();
  });


  // ------------------------------------------------------------------ cloud save (secret key)
  // Optional: a secret key stores a copy of the save on the server (/api/save) so it can be
  // loaded on another device. Synced every few minutes while a key exists.
  const CLOUD_API = '/api/save';
  const KEY_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  function newKey() {
    const r = crypto.getRandomValues(new Uint8Array(16));
    return [...r].map(b => KEY_CHARS[b % KEY_CHARS.length]).join('').match(/.{4}/g).join('-');
  }
  function cloudPayload() { const d = saveData(); delete d.cloudKey; delete d.cloudT; delete d.cloudSum; return d; }
  async function cloudCall(body, keepalive) {
    const r = await fetch(CLOUD_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
    let j = {}; try { j = await r.json(); } catch { /* not json */ }
    if (!r.ok) throw Object.assign(new Error(j.error || tr('Cloud-Speicher gerade nicht erreichbar.')), { status: r.status });
    return j;
  }
  let cloudBusy = false, cloudErr = '';
  async function cloudPush(force, keepalive) {
    if (!save.cloudKey || cloudBusy) return;
    const data = cloudPayload(), sum = JSON.stringify(data).length + ':' + save.total + ':' + save.coins;
    if (!force && sum === save.cloudSum) return;
    cloudBusy = true;
    try { await cloudCall({ action: 'put', key: save.cloudKey, data }, keepalive); save.cloudT = Date.now(); save.cloudSum = sum; cloudErr = ''; persist(); }
    catch (e) { cloudErr = e.message; }
    cloudBusy = false;
    if (!$('cloud').hidden) renderCloud();
  }
  setInterval(() => cloudPush(), 180000);
  window.addEventListener('pagehide', () => { if (!leaving) cloudPush(false, true); });

  function renderCloud() {
    const has = !!save.cloudKey;
    $('cloud-new').hidden = has; $('cloud-have').hidden = !has;
    if (has) {
      $('cloud-key').textContent = save.cloudKey;
      $('cloud-when').textContent = save.cloudT ? tr('Zuletzt gesichert: {d}', { d: new Date(save.cloudT).toLocaleString(I18N.locale) }) : tr('Noch nicht gesichert.');
    }
    $('cloud-err').textContent = cloudErr;
  }
  $('cloud-create').addEventListener('click', async () => {
    save.cloudKey = newKey(); save.cloudSum = '';
    await cloudPush(true);
    if (cloudErr) { delete save.cloudKey; } else toast(tr('☁️ Schlüssel erstellt – schreib ihn dir auf!'));
    persist(); renderCloud();
  });
  $('cloud-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(save.cloudKey); toast(tr('Schlüssel kopiert.')); } catch { toast(tr('Kopieren nicht möglich – bitte abschreiben.')); }
  });
  $('cloud-sync').addEventListener('click', () => cloudPush(true));
  $('cloud-del').addEventListener('click', async () => {
    if (!confirm(tr('Cloud-Kopie löschen? Dein Spielstand auf diesem Gerät bleibt erhalten, der Schlüssel funktioniert danach nicht mehr.'))) return;
    try { await cloudCall({ action: 'del', key: save.cloudKey }); }
    catch (e) { cloudErr = e.message; renderCloud(); return; }
    delete save.cloudKey; delete save.cloudT; delete save.cloudSum; cloudErr = ''; persist(); renderCloud();
    toast(tr('Cloud-Kopie gelöscht.'));
  });
  $('cloud-load').addEventListener('click', async () => {
    const key = $('cloud-input').value.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/(.{4})(?=.)/g, '$1-');
    if (!/^[2-9A-Z]{4}(-[2-9A-Z]{4}){3}$/.test(key)) { cloudErr = tr('Der Schlüssel hat 16 Zeichen, z. B. ABCD-EF23-GH45-JK67.'); renderCloud(); return; }
    try {
      const j = await cloudCall({ action: 'get', key });
      const d = j.data;
      if (!confirm(tr('Spielstand vom {d} laden ({n} Fänge, Level {l})?\nDer aktuelle Spielstand auf diesem Gerät wird ersetzt.', { d: new Date(j.t).toLocaleString(I18N.locale), n: d.total || 0, l: d.lvl || 1 }))) return;
      d.cloudKey = key; d.cloudT = j.t; d.cloudSum = '';
      leaving = true;
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      location.reload();
    } catch (e) { cloudErr = e.message; renderCloud(); }
  });
  $('btn-cloud-title').addEventListener('click', () => { $('title').hidden = true; toggleModal('cloud'); });
  $('btn-cloud-prog').addEventListener('click', () => toggleModal('cloud'));

  // ------------------------------------------------------------------ boot
  $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  updateCoins(); updateGear(); updateLevel(); updateDexBadge();
  if (save.seen) $('start').textContent = tr('Weiter fischen');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); draw(); updateClock();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // tiny debug/test hook
  window.__fischen = { save, gainXp, rebirth, MUTATIONS, forceMut: null, forceShiny: false, get state() { return state; }, talk: () => talkBealin(), openBox: id => openBox(BOXES.find(b => b.id === id)), line: () => bealinLine, setTime: v => { time = v; },
    land: id => { const f = FISH.find(x => x.id === id); hooked = { f, size: f.max, str: STRENGTH[f.r] }; bob.x = 260; land_catch(); } };
})();
