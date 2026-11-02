// Fischen! – a cozy little fishing game for fisch.ing
// Pixel scene on a 384x216 canvas, UI in the DOM so the site's GIFs animate.
(() => {
  'use strict';

  // ------------------------------------------------------------------ data
  const RARITY = {
    common:    { label: 'Gewöhnlich', w: 60 },
    uncommon:  { label: 'Ungewöhnlich', w: 26 },
    rare:      { label: 'Selten', w: 10 },
    epic:      { label: 'Episch', w: 3.5 },
    legendary: { label: 'Legendär', w: 0.9 },
    junk:      { label: 'Kein Fisch', w: 9 },
  };
  const STRENGTH = { common: .45, uncommon: .65, rare: .85, epic: 1.05, legendary: 1.3, junk: .3 };

  // far: only bites beyond this cast distance (0..1); night: x weight at night
  const FISH = [
    { id: 'fisch',   name: 'Fisch',             img: 'fsh-spin.gif',         r: 'common',    min: 20, max: 45,  val: 5,  photo: true, desc: 'Der Klassiker. Dreht sich gern im Kreis.' },
    { id: 'pixel',   name: 'Pixelfisch',        img: 'fish-icon.png',        r: 'common',    min: 8,  max: 16,  val: 4,  desc: 'Besteht zu 100 % aus Pixeln. Sehr knusprig.', pixel: true },
    { id: 'poisson', name: 'Poisson',           img: 'frenchfish.gif',       r: 'common',    min: 25, max: 50,  val: 6,  photo: true, desc: 'Kommt aus Frankreich. Hat Schokolade dabei.' },
    { id: 'spezi3',  name: 'Kleiner Spezifisch', img: 'spezifisch3.png',     r: 'common', clip: [0, .93],    min: 10, max: 22,  val: 6,  desc: 'Ein ganz kleiner, aber sehr spezifischer Fisch.' },
    { id: 'fisch2',  name: 'Fisch 2',           img: 'fish2-spin.gif',       r: 'uncommon',  min: 45, max: 90,  val: 14, photo: true, desc: 'Die Fortsetzung. Länger als das Original.' },
    { id: 'spezi2',  name: 'Spezifische Spezifische', img: 'spezifisch2.png', r: 'uncommon', clip: [3.17, 4.9],  min: 22, max: 40,  val: 15, desc: 'Spezifische Spezifische. Gut gekühlt.' },
    { id: 'fisch3',  name: 'Fisch 3',           img: 'fish3.gif',            r: 'uncommon',  min: 15, max: 30,  val: 16, photo: true, desc: 'Hat dich gesehen. Ist sichtlich schockiert.' },
    { id: 'spezi1',  name: 'Spezifischer Spezifisch', img: 'spezifisch1.png', r: 'rare', clip: [.93, 3.17],      min: 40, max: 70,  val: 38, desc: 'Ein Prachtexemplar mit extra viel Spezi.' },
    { id: 'schuh',   name: 'Schuhfisch',        img: 'fih.gif',              r: 'rare',      min: 30, max: 55,  val: 42, desc: 'Trägt Schuhe. Warum auch nicht.' },
    { id: 'lo',      name: 'Lo',                img: 'lo.gif',               r: 'rare',      min: 80, max: 160, val: 55, desc: 'Ein kleiner Hai. Beißt nur weit draußen.', far: .55 },
    { id: 'lippe',   name: 'Lippenfisch',       img: 'lippenfisch-spin.gif', r: 'epic',      min: 30, max: 60,  val: 120, photo: true, desc: 'Er möchte reden. Er hat viel zu sagen.', night: 2.5 },
    { id: 'travis',  name: 'Travis',            img: 'twawis.jpg',           r: 'epic',      min: 35, max: 65,  val: 140, photo: true, desc: 'Jetzt kommt Travis.', far: .4, sound: 'jetzt-kommt-travis.mp3' },
    { id: 'spee',    name: 'Spee Zierfisch',    img: 'spee-zierfisch.png',   r: 'epic',      min: 6,  max: 9,   val: 110, clip: [12.63, 13.9], desc: 'Ein Zierfisch, frisch gewaschen. Duftet nach Spee.', night: 1.5 },
    { id: 'spees',   name: 'Spezifische Spee Zierfische', img: 'spee-zierfische.png', r: 'epic', min: 12, max: 18, val: 160, clip: [13.9, 16.43], desc: 'Zwei auf einmal. Spezifischer geht es kaum.', far: .5 },
    { id: 'fischer', name: 'Spezifischfischer', img: 'spezifischfischer-cut.png', r: 'legendary', min: 175, max: 190, val: 400, clip: [16.43, null], desc: 'Der spezifische Spezifischfischer fischt spezifische Spezifische. Jetzt hast du ihn gefischt.', far: .45, hint: 'Steht am Steg. Fischt man ihn auch?' },
    { id: 'odfisch', name: 'Absolute Odfisch',  img: 'odfish.jpg',           r: 'legendary', min: 170, max: 190, val: 500, photo: true, desc: 'Absolute Legende. Nur nachts, nur weit draußen.', far: .6, night: 4, dayOff: true },
    { id: 'ratte',   name: 'Ratte',             img: 'rat.gif',              r: 'junk',      min: 18, max: 28,  val: 1,  desc: 'Nass und beleidigt. Läuft trotzdem weiter.' },
    { id: 'tisch',   name: 'Tisch',             img: 'tisch.gif',            r: 'junk',      min: 90, max: 140, val: 3,  photo: true, desc: 'Ein Tisch. Kein Fisch. Aber fast.' },
    { id: 'flasche', name: 'Spezi-Flasche',     img: 'spezi-flasche.png',    r: 'junk',      min: 25, max: 33,  val: 4,  desc: 'Leer. Gehört bestimmt dem Spezifischfischer.' },
    { id: 'pinguine', name: 'Rotierende Pinguine', img: 'rotierendepinguine.gif', r: 'junk', min: 60, max: 75, val: 25, photo: true, desc: 'Vier Pinguine, rotierend. Selten. Wie kommen die hier rein?', rareJunk: true },
  ];

  const RODS = [
    { id: 'stock',  name: 'Stock mit Schnur', price: 0,    cast: .55, reel: 1.0,  tens: 1.0,  luck: 1,   desc: 'Hat schon Opa benutzt.' },
    { id: 'bambus', name: 'Bambusrute',       price: 60,   cast: .75, reel: 1.25, tens: .85,  luck: 1,   desc: 'Wirft weiter, kurbelt schneller.' },
    { id: 'carbon', name: 'Carbonrute',       price: 260,  cast: .92, reel: 1.5,  tens: .7,   luck: 1.15, desc: 'Leicht, stark, weit.' },
    { id: 'gold',   name: 'Goldene Rute',     price: 900,  cast: 1.0, reel: 1.85, tens: .55,  luck: 1.4, desc: 'Glänzt. Fische lieben Glanz.' },
  ];
  const BAITS = [
    { id: 'wurm',   name: 'Wurm',          price: 0,  pack: 0, luck: 1,   speed: 1,   desc: 'Unbegrenzt. Wurmig.' },
    { id: 'spezi',  name: 'Spezi-Köder',   price: 12, pack: 5, luck: 1.7, speed: 1.35, desc: '5 Stück. Seltene Fische beißen öfter.' },
    { id: 'glitzer', name: 'Glitzerköder', price: 35, pack: 5, luck: 2.8, speed: 1.6, desc: '5 Stück. Für die ganz großen Fänge.' },
  ];

  // ------------------------------------------------------------------ save
  const SAVE_KEY = 'fischen-save-v1';
  const save = Object.assign({
    coins: 0, rod: 'stock', rods: ['stock'], bait: 'wurm', baits: { wurm: Infinity },
    dex: {}, total: 0, sound: true, seen: false,
  }, load());
  save.baits.wurm = Infinity;
  function load() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
  }
  let saveOk = true;
  function persist() {
    try {
      save.saved = Date.now();
      const s = { ...save, baits: { ...save.baits } };
      delete s.baits.wurm;
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      if (!saveOk) { saveOk = true; }
      flashSaved();
    } catch {
      // storage blocked or full: keep playing, tell the player once
      if (saveOk) { saveOk = false; setTimeout(() => toast('Speichern nicht möglich – Fortschritt geht beim Schließen verloren.'), 0); }
    }
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
        voice = new Audio('spezifischfischer.mp3'); voice.preload = 'auto';
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
  icon.src = 'fish-icon.png';
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
    waitT = (2.5 + Math.random() * 6) / bait().speed;
    nibbles = Math.floor(Math.random() * 3); nibbleT = waitT - 1.2;
    approacher = null;
    hint('Warten …', 1.2);
  }
  function retract(msg) {
    state = 'idle'; hooked = null; approacher = null; $('reel').hidden = true;
    if (msg) hint(msg, 1.8);
  }

  function pickFish() {
    const d = castDistance(), night = isNight(), b = bait(), r = rod();
    const luck = b.luck * r.luck;
    const pool = FISH.filter(f => !(f.far && d < f.far) && !(f.dayOff && !night));
    const weights = pool.map(f => {
      let w = RARITY[f.r].w;
      const n = pool.filter(g => g.r === f.r).length; w /= n;
      if (f.r === 'common') w *= 1.3 - d * .6;
      if (f.r === 'rare') w *= (1 + d) * luck;
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
      if (save.baits[save.bait] <= 0) { delete save.baits[save.bait]; save.bait = 'wurm'; toast('Köder aufgebraucht – zurück zum Wurm.'); }
      persist(); updateGear();
    }
    const skew = Math.pow(Math.random(), 1.6);
    hooked = { f, size: Math.round(f.min + (f.max - f.min) * skew), str: STRENGTH[f.r] };
    Object.assign(reel, { tension: .15, progress: .22, thrash: 0, thrashT: 1 + Math.random(), slack: 0 });
    state = 'reel'; $('reel').hidden = false; hint('');
    sfx.bite(); splash(bob.x, SURFACE, 14, '#ffffff');
  }

  function land_catch() {
    const { f, size } = hooked;
    const val = Math.max(1, Math.round(f.val * (0.7 + .6 * (size - f.min) / (f.max - f.min || 1))));
    const first = !save.dex[f.id];
    const e = save.dex[f.id] || { n: 0, best: 0 };
    e.n++; e.best = Math.max(e.best, size); save.dex[f.id] = e;
    save.coins += val; save.total++;
    persist(); updateCoins();
    splash(bob.x, SURFACE, 22, '#ffffff');
    state = 'show'; $('reel').hidden = true; holding = false;
    showCatch(f, size, val, first);
    if (f.clip) playClip(f.clip); else if (f.sound) playFile(f.sound); else playFile('fish.mp3');
    sfx.coin();
  }

  // ------------------------------------------------------------------ input
  function down() {
    audio();
    if (anyModal()) return;
    holding = true;
    if (state === 'idle') startCharge();
    else if (state === 'wait') retract('Eingeholt. Nichts dran.');
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
    if (state === 'idle' && !anyModal() && wx > NPC.x - 3 && wx < NPC.x + NPC.w + 6 && wy > DOCK_Y - NPC.h - 4 && wy < DOCK_Y + 2) { audio(); talkNpc(); return; }
    down();
  });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  window.addEventListener('blur', () => { holding = false; for (const k in keys) keys[k] = false; if (state === 'charge') release(); });
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'escape') { closeModals(); return; }
    if (!$('title').hidden) { if (k === ' ' || k === 'enter') { e.preventDefault(); $('start').click(); } return; }
    if (!$('catch').hidden) { if (k === ' ' || k === 'enter') { e.preventDefault(); $('catch-ok').click(); } return; }
    if (k === 'f') { toggleModal('dex'); return; }
    if (k === 'l') { toggleModal('shop'); return; }
    if (k === 'c') { toggleModal('casino'); return; }
    if (!$('casino').hidden && (k === ' ' || k === 'enter')) { e.preventDefault(); $('spin').click(); return; }
    if (k === 'm') { $('btn-sound').click(); return; }
    if (anyModal()) return;
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
      player.x = Math.max(66, Math.min(DOCK_END - 14, player.x + player.dir * 42 * dt));
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
          hint('!  JETZT KLICKEN  !', .9);
        }
        break;
      }
      case 'bite':
        biteT -= dt;
        bob.dunk = 4 + Math.sin(t * 40);
        if (biteT <= 0) {
          if (approacher) { approacher.vx = (approacher.x < bob.x ? -1 : 1) * 30; }
          retract('Zu spät! Er ist weg.');
        }
        break;
      case 'reel': updateReel(dt); break;
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.y > SURFACE + 2 && p.vy > 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].r += 14 * dt; ripples[i].life -= dt; if (ripples[i].life <= 0) ripples.splice(i, 1); }
    if (state === 'wait' && Math.random() < dt * .7) ripple(bob.x, .6);

    if (npcTalk > 0) npcTalk -= dt;
    hintTick(dt);
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
      reel.tension += (0.38 + pull * .75) * r.tens * dt;
      const gain = reel.thrash ? .05 : .2;
      reel.progress += gain * r.reel / (.6 + h.str) * dt;
      if (Math.random() < dt * 14) sfx.tick();
    } else {
      reel.tension -= (.75 - pull * .18) * dt;
      reel.progress -= .05 * h.str * (reel.thrash ? 2.2 : 1) * dt;
    }
    reel.tension = Math.max(0, reel.tension);

    if (reel.thrash && Math.random() < dt * 10) splash(bob.x + (Math.random() - .5) * 6, SURFACE, 3, '#ffffff');
    // bobber drifts back toward the dock as you win
    const startX = bob.landX, endX = DOCK_END + 4;
    bob.x = startX + (endX - startX) * Math.max(0, Math.min(1, reel.progress));
    bob.dunk = 3 + (reel.thrash ? Math.sin(t * 50) * 2 : 0);

    $('tension').style.width = Math.min(100, reel.tension * 100) + '%';
    $('progress').style.width = Math.max(0, Math.min(100, reel.progress * 100)) + '%';
    $('reel').classList.toggle('thrash', !!reel.thrash);

    if (reel.tension >= 1) { sfx.snap(); retract('Schnur gerissen! 💥'); return; }
    if (reel.progress <= 0) { retract('Entkommen …'); return; }
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
  const playerFrames = [false, true].map(flip => PLAYER_LEGS.map(l => bake(PLAYER_BODY.concat(l), PLAYER_PAL, flip)));

  const npcImg = new Image(); npcImg.src = 'spezifischfischer-pixel.png';
  const NPC = { x: 18, w: 10, h: 22 };
  const NPC_LINES = [['Spezifischfischer!', [5.73, 7.17]], ['Spezifisch.', [0, .93]], ['Spee Zierfisch!', [12.63, 13.9]], ['Spezifische Spezifische.', [3.17, 4.9]]];
  let npcTalk = 0, npcLine = '', npcIdx = 0;
  function talkNpc() {
    const [line, clip] = NPC_LINES[npcIdx++ % NPC_LINES.length];
    npcLine = line; npcTalk = 2.2; playClip(clip);
  }
  const BOTTLE = bake(['.k.', '.k.', 'kbk', 'bob', 'byb', 'bob', 'kbk'], { k: '#1b1f2e', b: '#6b2d0f', o: '#f97316', y: '#a855f7' });

  let lastBg = '';
  const snap = v => Math.round(v * 2) / 2;
  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(snap(x), snap(y), w, h); }
  // filled pixel circle, row by row on the fine grid
  function disc(cx, cy, r, c) {
    ctx.fillStyle = c;
    for (let dy = -r; dy <= r; dy += .5) {
      const hw = snap(Math.sqrt(Math.max(0, r * r - dy * dy)));
      ctx.fillRect(snap(cx - hw), snap(cy + dy), hw * 2, .5);
    }
  }

  // Sky + sea + island are cached and only redrawn when the light changes.
  const bgC = document.createElement('canvas'); bgC.width = cv.width; bgC.height = cv.height;
  const bg = bgC.getContext('2d'); bg.imageSmoothingEnabled = false; bg.setTransform(2, 0, 0, 2, 0, 0);
  let bgKey = '';
  function bands(c, y0, y1, colors) {
    const n = colors.length, bh = (y1 - y0) / n;
    colors.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, snap(y0 + i * bh), W, Math.ceil(bh) + 1); });
    // checker dither on each seam
    for (let i = 1; i < n; i++) {
      const y = snap(y0 + i * bh);
      c.fillStyle = colors[i];
      for (let x = 0; x < W; x += 1) c.fillRect(x, y - .5, .5, .5);
      c.fillStyle = colors[i - 1];
      for (let x = .5; x < W; x += 1) c.fillRect(x, y, .5, .5);
    }
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

  function cloud(c, dark) {
    const body = dark > .5 ? '#3b4a66' : '#ffffff', shade = dark > .5 ? '#2a3650' : '#d6e6f5', hi = dark > .5 ? '#52648a' : '#ffffff';
    const parts = [[0, 0, 4], [c.w * .3, -3, 5.5], [c.w * .6, -1.5, 4.5], [c.w * .85, .5, 3.5]];
    for (const [ox, oy, r] of parts) disc(c.x + ox, c.y + oy + 1, r, shade);
    for (const [ox, oy, r] of parts) disc(c.x + ox, c.y + oy, r, body);
    px(c.x - 4, c.y + 2, c.w + 8, 2.5, shade);
    px(c.x + c.w * .3 - 2, c.y - 7.5, 3, .5, hi);
  }

  function draw() {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const [top, bot, dark] = skyColors();
    // letterbox continues the scene (sky above, deep water below)
    const deep = mix([8, 40, 80], [4, 10, 28], dark);
    if (deep !== lastBg) { lastBg = deep; $('stage').style.background = `linear-gradient(${top} 0 50%, ${deep} 50% 100%)`; }
    const key = top + bot;
    if (key !== bgKey) { bgKey = key; renderBg(top, bot, dark); }

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

    drawDock(dark);
    drawNpc();
    drawPlayer(dark);
    drawLine();

    // particles
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); px(p.x, p.y, 1, 1, p.c); px(p.x + .5, p.y - .5, .5, .5, '#ffffff'); }
    ctx.globalAlpha = 1;

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
    // bucket of catches
    const bx = 40;
    px(bx - .5, DOCK_Y - 8, 10, 8, k);
    px(bx, DOCK_Y - 7.5, 9, 7.5, '#7b8aa3'); px(bx, DOCK_Y - 7.5, 9, 1, '#b8c4d6'); px(bx + 7, DOCK_Y - 6.5, 1.5, 6.5, '#5b6880');
    px(bx + .5, DOCK_Y - 6.5, 8, 1, '#1e3a5f');
    px(bx + 1, DOCK_Y - 3.5, 7, .5, '#5b6880');
    ctx.strokeStyle = '#475569'; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(bx + 4.5, DOCK_Y - 7.5, 4, Math.PI, 0); ctx.stroke();
    if (save.total > 0) { px(bx + 3, DOCK_Y - 10, 1.5, 3, '#4ade80'); px(bx + 2, DOCK_Y - 11, 3.5, 1.5, '#22c55e'); px(bx + 2, DOCK_Y - 11, .5, .5, '#86efac'); }
    // tackle box
    const tx = 54;
    px(tx - .5, DOCK_Y - 5, 9, 5, k);
    px(tx, DOCK_Y - 4.5, 8, 4.5, '#b91c1c'); px(tx, DOCK_Y - 4.5, 8, 1, '#ef4444'); px(tx + 3, DOCK_Y - 3, 2, 1, '#fbbf24');
    px(tx + 2.5, DOCK_Y - 6, 3, 1, k);
  }

  // The Spezifischfischer himself, fishing at the start of the dock with a Spezi bottle on his line.
  function drawNpc() {
    if (!npcImg.complete || !npcImg.naturalWidth) return;
    const x = NPC.x, y = DOCK_Y;
    ctx.drawImage(npcImg, x, y - NPC.h, NPC.w, NPC.h);
    const hx = x + 9, hy = y - 13.5, tx = x + 24, ty = y - 26;
    ctx.strokeStyle = '#111827'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(x + 18, y - 23, tx, ty); ctx.stroke();
    const sw = Math.sin(t * 1.4) * 1.5, by = y - 11;
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + sw, by); ctx.stroke();
    ctx.drawImage(BOTTLE, snap(tx + sw - .75), by, 1.5, 3.5);
    if (npcTalk > 0) {
      ctx.font = '6px Poppins, sans-serif';
      const bw = Math.ceil(ctx.measureText(npcLine).width) + 4, bx = x - 2, byy = y - NPC.h - 12;
      ctx.globalAlpha = Math.min(1, npcTalk * 3);
      px(bx - .5, byy - .5, bw + 1, 9, '#0f172a'); px(bx, byy, bw, 8, '#fffbeb'); px(bx + 6, byy + 8, 2, 1.5, '#0f172a');
      ctx.fillStyle = '#0f172a'; ctx.font = '6px Poppins, sans-serif'; ctx.textBaseline = 'top';
      ctx.fillText(npcLine, bx + 2, byy + 1);
      ctx.globalAlpha = 1;
    }
  }

  // Our angler: a bearded fisher with a green bucket hat (original sprite).
  function drawPlayer(dark) {
    const x = snap(player.x), y = DOCK_Y, d = player.dir;
    const frame = player.walk ? [0, 1, 0, 2][Math.floor(player.walk / 1.6) % 4] : 0;
    const img = playerFrames[d > 0 ? 0 : 1][frame];
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
      $('hint').textContent = 'Halten zum Auswerfen';
      $('hint').style.opacity = .55;
    }
  }
  function toast(msg) {
    const d = document.createElement('div'); d.textContent = msg;
    $('toast').appendChild(d); setTimeout(() => d.remove(), 3300);
  }
  function updateCoins() { $('coins').textContent = save.coins; $('shop-coins').textContent = save.coins; $('casino-coins').textContent = save.coins; }
  function updateGear() {
    const b = bait(), n = save.baits[b.id];
    $('gear').textContent = `🎣 ${rod().name} · 🪱 ${b.name}${n === Infinity ? '' : ' ×' + n}`;
  }
  let lastClock = '';
  function updateClock() {
    const h = Math.floor(time * 24), m = Math.floor((time * 24 % 1) * 60 / 10) * 10;
    const s = `${isNight() ? '🌙' : '☀️'} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (s !== lastClock) { $('clock').textContent = s; lastClock = s; }
  }

  const anyModal = () => [...document.querySelectorAll('.modal')].some(m => !m.hidden);
  function closeModals() {
    for (const id of ['dex', 'shop', 'casino']) $(id).hidden = true;
  }
  function toggleModal(id) {
    if (!$('title').hidden || !$('catch').hidden) return;
    if (['charge', 'fly', 'bite', 'reel'].includes(state)) return;
    const open = $(id).hidden;
    closeModals();
    if (open) { ({ dex: renderDex, shop: renderShop, casino: renderCasino })[id](); $(id).hidden = false; }
  }
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('pointerdown', e => {
    if (e.target === m && m.id !== 'title' && m.id !== 'catch') closeModals();
  }));
  $('btn-dex').addEventListener('click', () => toggleModal('dex'));
  $('btn-shop').addEventListener('click', () => toggleModal('shop'));
  $('btn-casino').addEventListener('click', () => toggleModal('casino'));
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
    const iv = setInterval(() => { flip.textContent = n++ % 2 ? '🪙 Kopf …' : '🐟 Fisch …'; sfx.tick(); }, 110);
    setTimeout(() => {
      clearInterval(iv);
      const win = Math.random() < .5;
      save.coins += win ? lastCatchVal : -lastCatchVal;
      save.gamble = (save.gamble || 0) + (win ? lastCatchVal : -lastCatchVal);
      persist(); updateCoins();
      flip.className = 'flip ' + (win ? 'win' : 'lose');
      flip.textContent = win ? `🐟 Fisch! +${lastCatchVal} Taler extra` : `🪙 Kopf. Die ${lastCatchVal} Taler sind weg.`;
      $('catch-value').textContent = win ? `+${lastCatchVal * 2} Taler` : '+0 Taler';
      if (win) sfx.coin(); else tone(220, .4, 'sawtooth', .07, -120);
      btn.hidden = true; ok.disabled = false; ok.focus();
    }, 1300);
  });

  // Fischautomat: three reels of the site's fish.
  const SYMBOLS = [
    { id: 'pixel',   img: 'fish-icon.png',        w: 30, pay: 4, pixel: true },
    { id: 'spezi',   img: 'spezifisch3.png',      w: 24, pay: 6 },
    { id: 'schuh',   img: 'fih.gif',              w: 17, pay: 10 },
    { id: 'lo',      img: 'lo.gif',               w: 12, pay: 18 },
    { id: 'lippe',   img: 'lippenfisch-spin.gif', w: 8,  pay: 40 },
    { id: 'odfisch', img: 'odfish.jpg',           w: 3,  pay: 150 },
    { id: 'ratte',   img: 'rat.gif',              w: 6,  pay: 0 },
  ];
  const PAIR = 1.5, BETS = [5, 10, 25, 50];
  let bet = 5, spinning = false;
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
    $('bets').replaceChildren(...BETS.map(b => {
      const btn = document.createElement('button');
      btn.textContent = b; btn.className = b === bet ? 'on' : '';
      btn.disabled = spinning;
      btn.addEventListener('click', () => { bet = b; renderCasino(); });
      return btn;
    }));
    $('spin').disabled = spinning || save.coins < bet;
    $('spin').textContent = save.coins < bet && !spinning ? 'Zu wenig Taler – geh fischen!' : `Drehen (${bet} Taler)`;
    if (!$('paytable').childElementCount) {
      const rows = SYMBOLS.filter(s => s.pay).sort((a, b) => b.pay - a.pay).flatMap(s => {
        const icons = document.createElement('span');
        for (let i = 0; i < 3; i++) { const im = document.createElement('img'); im.src = s.img; im.alt = ''; icons.append(im); }
        const v = document.createElement('b'); v.textContent = `× ${s.pay}`;
        return [icons, v];
      });
      const pi = document.createElement('span'); pi.textContent = 'Zwei gleiche';
      const pv = document.createElement('b'); pv.textContent = `× ${PAIR}`;
      const ri = document.createElement('span'); ri.textContent = '🐀 Ratten';
      const rv = document.createElement('b'); rv.textContent = 'fressen alles';
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
    persist(); updateCoins();
    hits.forEach(i => slots[i].classList.add('hit'));
    const r = $('slot-result');
    if (mult >= 40) { r.className = 'result big'; r.textContent = `JACKPOT! +${win} Taler`; playFile(result[0].id === 'odfisch' ? 'fish.mp3' : 'jetzt-kommt-travis.mp3'); sfx.coin(); setTimeout(sfx.coin, 200); setTimeout(sfx.coin, 400); }
    else if (win > 0) { r.className = 'result win'; r.textContent = `Gewonnen! +${win} Taler`; sfx.coin(); }
    else { r.className = 'result lose'; r.textContent = rat ? 'Die Ratten haben deinen Einsatz gefressen.' : 'Nichts. Nochmal?'; tone(200, .3, 'triangle', .06, -80); }
    spinning = false;
    renderCasino();
  }

  let lastCatchVal = 0;
  function showCatch(f, size, val, first) {
    lastCatchVal = val;
    $('catch-double').hidden = false; $('catch-double').disabled = false;
    $('catch-double').textContent = `🎲 Doppelt oder nichts (${val})`;
    $('catch-flip').hidden = true; $('catch-ok').disabled = false;
    $('catch-rarity').textContent = RARITY[f.r].label;
    $('catch-rarity').className = 'rarity r-' + f.r;
    $('catch-img').src = f.img; $('catch-img').alt = f.name;
    $('catch-img').classList.toggle('pixel', !!f.pixel);
    $('catch-img').classList.toggle('photo', !!f.photo);
    $('catch-name').textContent = f.name;
    $('catch-desc').textContent = f.desc;
    $('catch-size').textContent = size + ' cm' + (save.dex[f.id].best === size && !first ? ' 🏆' : '');
    $('catch-value').textContent = '+' + val + ' Taler';
    $('catch-new').hidden = !first;
    $('catch').hidden = false;
    $('catch-ok').focus();
  }

  function renderDex() {
    const got = FISH.filter(f => save.dex[f.id]).length;
    const g = save.gamble || 0;
    $('dex-count').textContent = `${got} von ${FISH.length} entdeckt · ${save.total} Fänge insgesamt` + (save.gamble !== undefined ? ` · Glücksspiel ${g >= 0 ? '+' : ''}${g} Taler` : '');
    $('dex-grid').replaceChildren(...FISH.map(f => {
      const e = save.dex[f.id];
      const c = document.createElement('div');
      c.className = 'card ' + (e ? 'b-' + f.r : 'unknown');
      const img = document.createElement('img');
      const hide = !e && f.photo;
      img.src = hide ? 'fish-icon.png' : f.img; img.alt = e ? f.name : 'Unbekannt'; img.loading = 'lazy';
      img.className = [f.pixel || hide ? 'pixel' : '', e && f.photo ? 'photo' : ''].join(' ').trim();
      const name = document.createElement('b'); name.textContent = e ? f.name : '???';
      const r = document.createElement('small'); r.className = 'r-' + f.r; r.textContent = RARITY[f.r].label;
      const info = document.createElement('small');
      info.textContent = e ? `${e.n}× · Rekord ${e.best} cm` : hintFor(f);
      c.append(img, name, r, info);
      return c;
    }));
  }
  function hintFor(f) {
    if (f.hint) return f.hint;
    if (f.dayOff) return 'Nur nachts, weit draußen';
    if (f.far) return 'Weit draußen';
    if (f.night) return 'Lieber nachts';
    return 'Noch nicht gefangen';
  }

  function renderShop() {
    updateCoins();
    $('shop-rods').replaceChildren(...RODS.map(r => {
      const owned = save.rods.includes(r.id), active = save.rod === r.id;
      return shopItem(r.name, `${r.desc} Wurf ${Math.round(r.cast * 100)} · Kurbel ${r.reel}×`, active,
        active ? 'Ausgerüstet' : owned ? 'Ausrüsten' : `${r.price} Taler`,
        active || (!owned && save.coins < r.price),
        () => {
          if (!owned) { save.coins -= r.price; save.rods.push(r.id); sfx.coin(); toast(r.name + ' gekauft!'); }
          save.rod = r.id; persist(); updateGear(); renderShop();
        });
    }));
    $('shop-baits').replaceChildren(...BAITS.map(b => {
      const n = save.baits[b.id] || 0, active = save.bait === b.id;
      const items = [shopItem(b.name + (b.pack && n ? ` (×${n})` : ''), b.desc, active,
        active ? 'Aktiv' : 'Benutzen', active || !n,
        () => { save.bait = b.id; persist(); updateGear(); renderShop(); })];
      if (b.pack) {
        const buy = items[0].querySelector('.btn');
        const b2 = document.createElement('button'); b2.className = 'btn'; b2.textContent = `+${b.pack} für ${b.price}`;
        b2.disabled = save.coins < b.price;
        b2.addEventListener('click', () => {
          save.coins -= b.price; save.baits[b.id] = n + b.pack; sfx.coin();
          persist(); updateCoins(); updateGear(); renderShop();
        });
        const wrap = document.createElement('div'); wrap.style.display = 'flex'; wrap.style.gap = '.4rem';
        buy.replaceWith(wrap); wrap.append(buy, b2);
      }
      return items[0];
    }));
  }
  function shopItem(title, desc, active, label, disabled, onClick) {
    const d = document.createElement('div'); d.className = 'item' + (active ? ' active' : '');
    const txt = document.createElement('div');
    const b = document.createElement('b'); b.textContent = title;
    const s = document.createElement('small'); s.textContent = desc;
    txt.append(b, s);
    const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = label; btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    d.append(txt, btn);
    return d;
  }

  function flashSaved() {
    const el = document.getElementById('saved'); if (!el) return;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  // autosave: periodically and when the tab is hidden or closed
  setInterval(persist, 30000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('Spielstand wirklich löschen? Fischdex, Taler und Ausrüstung sind dann weg.')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    window.removeEventListener('pagehide', persist);
    location.reload();
  });

  // ------------------------------------------------------------------ boot
  $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  updateCoins(); updateGear();
  if (save.seen) $('start').textContent = 'Weiter fischen';

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); draw(); updateClock();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // tiny debug/test hook
  window.__fischen = { save, get state() { return state; }, setTime: v => { time = v; } };
})();
