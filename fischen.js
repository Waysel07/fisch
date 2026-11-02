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
    { id: 'spezi3',  name: 'Kleiner Spezifisch', img: 'spezifisch3.png',     r: 'common',    min: 10, max: 22,  val: 6,  desc: 'Ein ganz kleiner, aber sehr spezifischer Fisch.' },
    { id: 'fisch2',  name: 'Fisch 2',           img: 'fish2-spin.gif',       r: 'uncommon',  min: 45, max: 90,  val: 14, photo: true, desc: 'Die Fortsetzung. Länger als das Original.' },
    { id: 'spezi2',  name: 'Spezifisch',        img: 'spezifisch2.png',      r: 'uncommon',  min: 22, max: 40,  val: 15, desc: 'Spezifische Spezifische. Gut gekühlt.' },
    { id: 'fisch3',  name: 'Fisch 3',           img: 'fish3.gif',            r: 'uncommon',  min: 15, max: 30,  val: 16, photo: true, desc: 'Hat dich gesehen. Ist sichtlich schockiert.' },
    { id: 'spezi1',  name: 'Großer Spezifisch', img: 'spezifisch1.png',      r: 'rare',      min: 40, max: 70,  val: 38, desc: 'Ein Prachtexemplar mit extra viel Spezi.' },
    { id: 'schuh',   name: 'Schuhfisch',        img: 'fih.gif',              r: 'rare',      min: 30, max: 55,  val: 42, desc: 'Trägt Schuhe. Warum auch nicht.' },
    { id: 'lo',      name: 'Lo',                img: 'lo.gif',               r: 'rare',      min: 80, max: 160, val: 55, desc: 'Ein kleiner Hai. Beißt nur weit draußen.', far: .55 },
    { id: 'lippe',   name: 'Lippenfisch',       img: 'lippenfisch-spin.gif', r: 'epic',      min: 30, max: 60,  val: 120, photo: true, desc: 'Er möchte reden. Er hat viel zu sagen.', night: 2.5 },
    { id: 'travis',  name: 'Travis',            img: 'twawis.jpg',           r: 'epic',      min: 35, max: 65,  val: 140, photo: true, desc: 'Jetzt kommt Travis.', far: .4, sound: 'jetzt-kommt-travis.mp3' },
    { id: 'odfisch', name: 'Absolute Odfisch',  img: 'odfish.jpg',           r: 'legendary', min: 170, max: 190, val: 500, photo: true, desc: 'Absolute Legende. Nur nachts, nur weit draußen.', far: .6, night: 4, dayOff: true },
    { id: 'ratte',   name: 'Ratte',             img: 'rat.gif',              r: 'junk',      min: 18, max: 28,  val: 1,  desc: 'Nass und beleidigt. Läuft trotzdem weiter.' },
    { id: 'tisch',   name: 'Tisch',             img: 'tisch.gif',            r: 'junk',      min: 90, max: 140, val: 3,  photo: true, desc: 'Ein Tisch. Kein Fisch. Aber fast.' },
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
  function persist() {
    try {
      const s = { ...save, baits: { ...save.baits } };
      delete s.baits.wurm;
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch { /* storage blocked: play without saving */ }
  }
  const rod = () => RODS.find(r => r.id === save.rod) || RODS[0];
  const bait = () => BAITS.find(b => b.id === save.bait) || BAITS[0];

  // ------------------------------------------------------------------ dom
  const $ = id => document.getElementById(id);
  const cv = $('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = cv.width, H = cv.height;
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
      const c = document.createElement('canvas'); c.width = c.height = 24;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.translate(12, 12); if (flip) x.scale(-1, 1); x.rotate(-Math.PI / 4);
      x.drawImage(icon, -11, -11, 22, 22);
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#04263a'; x.fillRect(0, 0, 24, 24);
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
    if (player.x < 40) { hint('Geh weiter nach vorne an den Steg!', 1.5); return; }
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
    if (f.sound) playFile(f.sound); else playFile('fish.mp3');
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
    e.preventDefault(); down();
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
      player.x = Math.max(10, Math.min(DOCK_END - 14, player.x + player.dir * 42 * dt));
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

  let lastBg = '';
  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  function draw() {
    const [top, bot, dark] = skyColors();
    // letterbox continues the scene (sky above, deep water below)
    const deep = mix([8, 40, 80], [4, 10, 28], dark);
    if (deep !== lastBg) { lastBg = deep; $('stage').style.background = `linear-gradient(${top} 0 50%, ${deep} 50% 100%)`; }
    let g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZON + 1);

    // stars
    if (dark > .2) for (const [x, y, s] of stars) {
      ctx.globalAlpha = dark * (.4 + .6 * Math.abs(Math.sin(t * (1 + s) + s * 9)));
      px(x, y, 1, 1, '#fff');
    }
    ctx.globalAlpha = 1;

    // sun & moon on an arc
    const sunA = (time - .25) * Math.PI * 2;
    const sx = W / 2 - Math.cos(sunA) * 170, sy = HORIZON - Math.sin(sunA) * 80;
    if (sy < HORIZON + 8) { ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, 7); ctx.fill(); px(sx - 4, sy - 4, 3, 3, '#fff7cc'); }
    const mx = W / 2 + Math.cos(sunA) * 170, my = HORIZON + Math.sin(sunA) * 80;
    if (my < HORIZON + 8) { ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.fill(); px(mx + 1, my - 3, 2, 2, '#cbd5e1'); px(mx - 3, my + 1, 2, 2, '#cbd5e1'); }

    // clouds
    ctx.globalAlpha = .75 - dark * .45;
    for (const c of clouds) {
      px(c.x, c.y, c.w, 5, dark > .5 ? '#334155' : '#ffffff');
      px(c.x + 5, c.y - 3, c.w * .55, 4, dark > .5 ? '#334155' : '#ffffff');
    }
    ctx.globalAlpha = 1;

    // far island with a tiny lighthouse
    ctx.fillStyle = mix([60, 100, 90], [14, 24, 40], dark);
    ctx.beginPath(); ctx.moveTo(250, HORIZON + 1); ctx.quadraticCurveTo(300, HORIZON - 14, 350, HORIZON + 1); ctx.fill();
    px(318, HORIZON - 22, 4, 12, mix([240, 240, 240], [120, 120, 140], dark));
    px(318, HORIZON - 18, 4, 2, '#ef4444');
    if (dark > .3 && Math.sin(t * 2) > 0) { ctx.globalAlpha = dark; px(316, HORIZON - 25, 8, 3, '#fde68a'); ctx.globalAlpha = 1; }

    // water
    g = ctx.createLinearGradient(0, HORIZON, 0, H);
    g.addColorStop(0, mix([56, 150, 200], [16, 40, 80], dark));
    g.addColorStop(.12, mix([30, 110, 170], [12, 30, 64], dark));
    g.addColorStop(1, mix([8, 40, 80], [4, 10, 28], dark));
    ctx.fillStyle = g; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    // shimmer
    ctx.globalAlpha = .35;
    for (let i = 0; i < 26; i++) {
      const y = HORIZON + 3 + ((i * 37) % (H - HORIZON - 4));
      const x = ((i * 71 + t * (6 + (i % 4) * 3)) % (W + 30)) - 15;
      px(x, y, 6 + (i % 3) * 4, 1, dark > .5 ? '#3b5b8a' : '#bfe9ff');
    }
    ctx.globalAlpha = 1;
    // sun/moon reflection
    const rx = sy < HORIZON ? sx : mx;
    if ((sy < HORIZON || my < HORIZON)) {
      ctx.globalAlpha = .25;
      for (let i = 0; i < 6; i++) px(rx - 6 + Math.sin(t * 2 + i) * 3, HORIZON + 3 + i * 4, 12 - i, 1, '#fff7cc');
      ctx.globalAlpha = 1;
    }

    // swimming fish silhouettes
    if (silL) for (const f of fishes) {
      const img = f.vx < 0 ? silL : silR;
      const wob = Math.sin(t * 6 + f.phase) * .6;
      ctx.globalAlpha = f.a + (f === approacher ? .2 : 0);
      ctx.drawImage(img, Math.round(f.x - 12 * f.s), Math.round(f.y - 12 * f.s + wob), Math.round(24 * f.s), Math.round(24 * f.s));
    }
    ctx.globalAlpha = 1;

    // ripples
    ctx.strokeStyle = '#e0f7ff';
    for (const r of ripples) {
      ctx.globalAlpha = (r.life / r.max) * .7;
      ctx.beginPath(); ctx.ellipse(r.x, SURFACE + 1, r.r, r.r * .3, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawDock(dark);
    drawPlayer(dark);
    drawLine();

    // particles
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); px(p.x, p.y, 1, 1, p.c); }
    ctx.globalAlpha = 1;

    // power meter
    if (state === 'charge') {
      const bx = Math.round(player.x) - 13, by = DOCK_Y - 38;
      px(bx - 1, by - 1, 28, 6, '#0f172a');
      px(bx, by, 26, 4, '#1e293b');
      px(bx, by, Math.round(26 * power), 4, power > .85 ? '#fbbf24' : '#22c55e');
    }
    // bite "!"
    if (state === 'bite') {
      const ex = Math.round(bob.x) - 1, ey = SURFACE - 22 + Math.sin(t * 30);
      px(ex - 1, ey - 1, 5, 14, '#0f172a'); px(ex, ey, 3, 8, '#fbbf24'); px(ex, ey + 10, 3, 3, '#fbbf24');
    }

    // night tint for warmth
    if (dark > 0) { ctx.globalAlpha = dark * .18; px(0, 0, W, H, '#1e1b4b'); ctx.globalAlpha = 1; }
  }

  function drawDock(dark) {
    const wood = mix([150, 98, 56], [70, 50, 40], dark), woodD = mix([110, 70, 40], [50, 36, 30], dark), post = mix([90, 58, 34], [40, 28, 24], dark);
    for (let x = 6; x < DOCK_END; x += 26) px(x, DOCK_Y, 5, H - DOCK_Y, post);
    px(0, DOCK_Y, DOCK_END, 5, wood);
    for (let x = 0; x < DOCK_END; x += 9) px(x, DOCK_Y, 1, 5, woodD);
    px(0, DOCK_Y + 5, DOCK_END, 1, woodD);
    // lantern at the end
    const lx = DOCK_END - 4;
    px(lx, DOCK_Y - 20, 2, 20, post);
    px(lx - 2, DOCK_Y - 25, 6, 6, '#334155');
    px(lx - 1, DOCK_Y - 24, 4, 4, dark > .3 ? '#fde68a' : '#94a3b8');
    if (dark > .3) {
      const glow = ctx.createRadialGradient(lx + 1, DOCK_Y - 22, 1, lx + 1, DOCK_Y - 22, 40);
      glow.addColorStop(0, `rgba(253, 230, 138, ${.35 * dark})`); glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
      ctx.fillStyle = glow; ctx.fillRect(lx - 40, DOCK_Y - 62, 80, 80);
    }
    // bucket of catches
    px(12, DOCK_Y - 7, 9, 7, '#64748b'); px(12, DOCK_Y - 7, 9, 1, '#94a3b8'); px(13, DOCK_Y - 6, 7, 1, '#1e3a5f');
    if (save.total > 0) px(15, DOCK_Y - 10, 3, 3, '#4ade80');
  }

  // Our angler: a little round fisher with a green bucket hat (original sprite).
  function drawPlayer(dark) {
    const x = Math.round(player.x), y = DOCK_Y, d = player.dir;
    const step = player.walk ? Math.round(Math.sin(player.walk)) : 0;
    const skin = '#f2c9a0', coat = '#f59e0b', coatD = '#b45309', hat = '#22c55e', hatD = '#15803d', boot = '#1e293b';
    // legs
    px(x - 3, y - 4 + Math.max(0, step), 2, 4 - Math.max(0, step), boot);
    px(x + 1, y - 4 + Math.max(0, -step), 2, 4 - Math.max(0, -step), boot);
    // body (raincoat)
    px(x - 4, y - 12, 8, 8, coat); px(x - 4, y - 5, 8, 1, coatD);
    px(x + (d > 0 ? 3 : -4), y - 12, 1, 7, coatD);
    // head
    px(x - 3, y - 18, 6, 6, skin);
    px(x + (d > 0 ? 1 : -2), y - 16, 1, 1, '#0f172a');
    px(x + (d > 0 ? 2 : -3), y - 14, 1, 1, '#e8a87c');
    // hat
    px(x - 5, y - 19, 10, 2, hatD); px(x - 3, y - 22, 6, 3, hat); px(x - 2, y - 23, 4, 1, hat);
    // arm toward rod
    const tip = rodTip();
    const hx = x + d * 4, hy = y - 9;
    px(hx - 1, hy - 1, 2, 2, skin);
    // rod
    {
      ctx.strokeStyle = '#7c4a1e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx + .5, hy + .5); ctx.lineTo(tip.x + .5, tip.y + .5); ctx.stroke();
      const r = rod();
      if (r.id === 'gold') px(tip.x, tip.y, 1, 1, '#fbbf24');
      if (r.id === 'carbon') { ctx.strokeStyle = '#1f2937'; ctx.beginPath(); ctx.moveTo(hx + .5, hy + .5); ctx.lineTo((hx + tip.x) / 2, (hy + tip.y) / 2); ctx.stroke(); }
    }
  }

  function drawLine() {
    if (!['fly', 'wait', 'bite', 'reel'].includes(state)) return;
    const tip = rodTip();
    const by = state === 'fly' ? bob.y : SURFACE + bob.dunk * .4;
    const tight = state === 'reel' ? reel.tension : 0;
    const sag = state === 'fly' ? 0 : (1 - tight) * 18;
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tip.x + .5, tip.y + .5);
    ctx.quadraticCurveTo((tip.x + bob.x) / 2, Math.max(tip.y, by) + sag, bob.x, by);
    ctx.stroke();
    // bobber
    const bx = Math.round(bob.x) - 2, byy = Math.round(by) - 3;
    if (state === 'reel' || state === 'bite') { px(bx + 1, byy + 2, 2, 2, '#ef4444'); return; }
    px(bx, byy, 4, 2, '#ef4444'); px(bx, byy + 2, 4, 2, '#f8fafc'); px(bx + 1, byy - 1, 2, 1, '#0f172a');
  }

  // ------------------------------------------------------------------ ui
  let hintTimer = 0;
  function hint(text, secs = 0) { $('hint').textContent = text; $('hint').style.opacity = text ? 1 : 0; hintTimer = secs; }
  function hintTick(dt) {
    if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) hint(''); }
    if (state === 'idle' && hintTimer <= 0 && !anyModal() && $('hint').textContent === '') {
      $('hint').textContent = player.x < 40 ? 'A / D zum Laufen' : 'Halten zum Auswerfen';
      $('hint').style.opacity = .55;
    }
  }
  function toast(msg) {
    const d = document.createElement('div'); d.textContent = msg;
    $('toast').appendChild(d); setTimeout(() => d.remove(), 3300);
  }
  function updateCoins() { $('coins').textContent = save.coins; $('shop-coins').textContent = save.coins; }
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
    for (const id of ['dex', 'shop']) $(id).hidden = true;
  }
  function toggleModal(id) {
    if (!$('title').hidden || !$('catch').hidden) return;
    if (['charge', 'fly', 'bite', 'reel'].includes(state)) return;
    const open = $(id).hidden;
    closeModals();
    if (open) { id === 'dex' ? renderDex() : renderShop(); $(id).hidden = false; }
  }
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('pointerdown', e => {
    if (e.target === m && m.id !== 'title' && m.id !== 'catch') closeModals();
  }));
  $('btn-dex').addEventListener('click', () => toggleModal('dex'));
  $('btn-shop').addEventListener('click', () => toggleModal('shop'));
  $('btn-sound').addEventListener('click', () => {
    save.sound = !save.sound; persist();
    $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
  });
  $('start').addEventListener('click', () => { audio(); $('title').hidden = true; save.seen = true; persist(); });
  $('catch-ok').addEventListener('click', () => { $('catch').hidden = true; state = 'idle'; hint(''); });

  function showCatch(f, size, val, first) {
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
    $('dex-count').textContent = `${got} von ${FISH.length} entdeckt · ${save.total} Fänge insgesamt`;
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
