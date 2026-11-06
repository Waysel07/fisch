// Admin-Panel (seiten/admin.html). Spricht nur mit /api/admin (live auf api.fisch.ing).
// Die Sitzung liegt nur im Speicher dieser Seite (nicht im localStorage); neu laden heißt neu anmelden.
// Alles vom Server wird mit textContent eingesetzt, nie als HTML.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const API = location.hostname === 'www.fisch.ing' ? 'https://api.fisch.ing' : '';
  const IDLE_MS = 25 * 60 * 1000; // etwas vor dem Server abmelden
  let session = '', idleTimer = 0, sessEnd = 0, clock = 0;
  let boards = [], lbBoard = '', lbFrom = 0, lbTotal = 0;

  const BOARD_NAMES = {
    taler: 'Taler', woche: 'Fisch der Woche', reb: 'Wiedergeburten', dex: 'Fischdex', diamant: 'Diamant',
    rekord: 'Rekordfang', monster: 'Monster', boss: 'Odfisch-Siege', spent: 'Ausgegeben', prestige: 'Prestige', sport: 'Sport',
  };
  const WHAT = {
    login: 'Anmeldung', 'login-fail': 'Fehlversuch', logout: 'Abmeldung', delete_player: 'Spieler gelöscht',
    delete_idea: 'Idee gelöscht', gift: 'Spielzeit geschenkt', jackpot_add: 'Jackpot aufgestockt',
  };
  const fmt = (n) => Number(n || 0).toLocaleString('de-DE');
  const when = (t) => (t ? new Date(t).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '–');

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  }
  function say(text, ok) { const m = $('msg'); m.textContent = text || ''; m.className = 'msg ' + (ok ? 'ok' : 'err'); }

  async function call(action, data = {}, auth = session) {
    let r, j = {};
    try {
      r = await fetch(API + '/api/admin', {
        method: 'POST', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth },
        body: JSON.stringify({ action, ...data }),
      });
      j = await r.json().catch(() => ({}));
    } catch { throw new Error('Keine Verbindung zum Server.'); }
    if (r.status === 401 && action !== 'login') { logout(true); throw new Error(j.error || 'Bitte neu anmelden.'); }
    if (!r.ok) throw new Error(j.error || 'Fehler ' + r.status);
    if (action !== 'login') touch();
    return j;
  }

  // --- Sitzung ---
  function touch() {
    sessEnd = Date.now() + IDLE_MS;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => logout(true), IDLE_MS);
  }
  function tick() {
    const s = Math.max(0, Math.round((sessEnd - Date.now()) / 1000));
    $('sess').textContent = 'Sitzung ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function logout(expired) {
    if (session && !expired) call('logout').catch(() => {});
    session = '';
    clearTimeout(idleTimer); clearInterval(clock);
    $('app').hidden = true; $('login').hidden = false;
    for (const id of ['ov-tiles', 'ov-boards', 'ov-pres', 'ov-reb', 'ov-log', 'lb-rows', 'player', 'id-list', 'lg-list']) $(id).replaceChildren();
    $('login-msg').textContent = expired ? 'Sitzung abgelaufen – bitte neu anmelden.' : '';
    $('tok').focus();
  }

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tok = $('tok').value.trim(), btn = e.submitter || $('login-form').querySelector('button');
    btn.disabled = true; $('login-msg').textContent = '';
    try {
      const j = await call('login', {}, tok);
      session = j.session;
      $('tok').value = '';
      $('login').hidden = true; $('app').hidden = false;
      touch(); tick(); clock = setInterval(tick, 1000);
      show('ov');
    } catch (err) {
      $('login-msg').textContent = err.message;
    } finally { btn.disabled = false; }
  });
  $('logout').addEventListener('click', () => logout(false));
  // Seite zu: Sitzung auch auf dem Server beenden
  addEventListener('pagehide', () => { if (session) fetch(API + '/api/admin', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session }, body: '{"action":"logout"}' }).catch(() => {}); });

  // --- Tabs ---
  const LOAD = { ov: overview, lb: leaderboard, id: ideas, gi: jackpotNow, lg: fullLog };
  function show(tab) {
    for (const b of document.querySelectorAll('.tab')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    for (const p of document.querySelectorAll('.pane')) p.hidden = p.id !== 'tab-' + tab;
    say('');
    LOAD[tab]().catch((err) => say(err.message));
  }
  for (const b of document.querySelectorAll('.tab')) b.addEventListener('click', () => show(b.dataset.tab));

  function table(t, rows, head) {
    t.replaceChildren();
    if (head) { const tr = el('tr'); head.forEach((h, i) => tr.append(el('th', i ? 'n' : '', h))); t.append(tr); }
    for (const r of rows) { const tr = el('tr'); r.forEach((c, i) => tr.append(el('td', i ? 'n' : '', c))); t.append(tr); }
  }
  function logList(ul, rows) {
    ul.replaceChildren();
    if (!rows.length) ul.append(el('li', 'muted', 'Noch nichts.'));
    for (const r of rows) {
      const li = el('li');
      li.append(el('time', '', when(r.at)), el('span', 'w' + (r.what === 'login-fail' ? ' bad' : ''), WHAT[r.what] || r.what));
      if (r.detail) li.append(el('span', '', r.detail));
      li.append(el('span', 'pub', ' · IP ' + r.ip));
      ul.append(li);
    }
  }

  // --- Übersicht ---
  async function overview() {
    const j = await call('overview');
    boards = j.boards || [];
    const tiles = $('ov-tiles'); tiles.replaceChildren();
    for (const [n, label] of [[j.stats.players, 'Spieler in der Bestenliste'], [j.jackpot.pot, 'Taler im Jackpot'], [j.ideas, 'Ideen am Brett'], [j.week, 'Woche']]) {
      const d = el('div', 'box'); d.append(el('b', '', fmt(n)), el('span', '', label)); tiles.append(d);
    }
    table($('ov-boards'), Object.entries(j.stats.boards).map(([b, n]) => [BOARD_NAMES[b] || b, fmt(n)]));
    table($('ov-pres'), Object.entries(j.stats.prestige).map(([k, n]) => [k, fmt(n)]));
    table($('ov-reb'), Object.entries(j.stats.rebirths).map(([k, n]) => [k, fmt(n)]));
    logList($('ov-log'), j.log || []);
  }

  // --- Bestenliste ---
  async function leaderboard() {
    if (!boards.length) boards = (await call('overview')).boards || [];
    const sel = $('lb-board');
    if (!sel.options.length) for (const b of boards) { const o = el('option', '', BOARD_NAMES[b] || b); o.value = b; sel.append(o); }
    lbBoard = sel.value;
    await loadBoard();
  }
  async function loadBoard() {
    const j = await call('board', { board: lbBoard, from: lbFrom });
    lbTotal = j.total;
    $('lb-pos').textContent = j.total ? `${fmt(lbFrom + 1)}–${fmt(Math.min(lbFrom + 50, j.total))} von ${fmt(j.total)}` : 'leer';
    $('lb-prev').disabled = lbFrom <= 0; $('lb-next').disabled = lbFrom + 50 >= lbTotal;
    rows(j.rows, true);
  }
  function rows(list, withScore) {
    const t = $('lb-rows'); t.replaceChildren();
    const head = el('tr'); (withScore ? ['#', 'Name', 'Wert', 'Kürzel'] : ['Name', 'Kürzel']).forEach((h) => head.append(el('th', withScore && (h === '#' || h === 'Wert') ? 'n' : '', h))); t.append(head);
    if (!list.length) { const tr = el('tr'); const td = el('td', 'muted', 'Keine Treffer.'); td.colSpan = 4; tr.append(td); t.append(tr); }
    for (const r of list) {
      const tr = el('tr'), name = el('td', 'name', r.name);
      if (r.raw && r.raw !== r.name) name.append(el('span', 'raw', 'gespeichert: ' + r.raw));
      if (withScore) tr.append(el('td', 'n', r.rank));
      tr.append(name);
      if (withScore) tr.append(el('td', 'n', fmt(r.score)));
      tr.append(el('td', 'pub', r.pub));
      tr.tabIndex = 0;
      const open = () => player(r.pub).catch((err) => say(err.message));
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
      t.append(tr);
    }
  }
  $('lb-board').addEventListener('change', () => { lbBoard = $('lb-board').value; lbFrom = 0; loadBoard().catch((e) => say(e.message)); });
  $('lb-prev').addEventListener('click', () => { lbFrom = Math.max(0, lbFrom - 50); loadBoard().catch((e) => say(e.message)); });
  $('lb-next').addEventListener('click', () => { lbFrom += 50; loadBoard().catch((e) => say(e.message)); });
  $('find-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const j = await call('find', { q: $('find-q').value.trim() }); rows(j.rows, false); $('lb-pos').textContent = fmt(j.rows.length) + ' Treffer'; }
    catch (err) { say(err.message); }
  });

  async function player(pub) {
    const p = await call('player', { pub }), box = $('player');
    box.replaceChildren(); box.hidden = false;
    box.append(el('h2', '', p.name), el('p', 'pub', 'Kürzel ' + p.me + ' · dabei seit ' + when(p.since)));
    const pr = p.prof;
    if (pr) {
      const facts = [['Level', pr.lv], ['Wiedergeburten', pr.rk], ['Prestige', pr.pr], ['Spielzeit', fmt(pr.pt) + ' h'], ['Titel', pr.ti || '–'],
        ['Größter Fang', pr.best ? pr.best.f + ' · ' + fmt(pr.best.n) + ' cm' : '–'], ['Lieblingsfisch', pr.fav ? pr.fav.f + ' · ' + fmt(pr.fav.n) + '×' : '–']];
      const t = el('table', 'tbl'); table(t, facts.map(([a, b]) => [a, typeof b === 'number' ? fmt(b) : b])); box.append(t);
    }
    const t2 = el('table', 'tbl');
    table(t2, Object.entries(p.boards).map(([b, v]) => [BOARD_NAMES[b] || b, fmt(v.score), v.rank ? `Platz ${fmt(v.rank)} / ${fmt(v.of)}` : '–']), ['Liste', 'Wert', 'Platz']);
    box.append(el('h2', '', 'Listen'), t2);
    const del = el('button', 'btn red', 'Eintrag löschen'); del.type = 'button';
    del.addEventListener('click', async () => {
      if (!(await confirmBox(`„${p.name}“ (${p.me}) aus allen Listen löschen? Das lässt sich nicht rückgängig machen.`))) return;
      try { await call('delete_player', { pub: p.me, confirm: true }); box.hidden = true; say('Eintrag gelöscht.', true); if (lbBoard) loadBoard().catch(() => {}); }
      catch (err) { say(err.message); }
    });
    const row = el('div', 'row end'); row.append(del); box.append(row);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- Ideen ---
  async function ideas() {
    const j = await call('ideas'), ul = $('id-list');
    ul.replaceChildren();
    if (!j.ideas.length) ul.append(el('li', 'muted', 'Keine Ideen.'));
    for (const i of j.ideas) {
      const li = el('li'), del = el('button', 'btn red sm', 'Löschen'); del.type = 'button';
      li.append(el('p', '', i.text), el('span', 'meta', `${i.name || 'Anonym'} · ${when(i.at)} · ▲ ${fmt(i.up)} ▼ ${fmt(i.down)}`), del);
      del.addEventListener('click', async () => {
        if (!(await confirmBox(`Idee „${i.text.slice(0, 80)}“ löschen?`))) return;
        try { await call('delete_idea', { id: i.id, confirm: true }); li.remove(); say('Idee gelöscht.', true); }
        catch (err) { say(err.message); }
      });
      ul.append(li);
    }
  }

  // --- Geschenke & Jackpot ---
  function showPot(j) {
    $('jp-now').textContent = fmt(j.pot) + ' Taler';
    $('jp-last').textContent = j.last ? `Zuletzt geknackt: ${fmt(j.last.amount)} Taler von ${j.last.name || 'jemandem'} am ${when(j.last.at)}` : 'Noch nie geknackt.';
  }
  async function jackpotNow() { showPot((await call('overview')).jackpot); }
  $('gift-key').addEventListener('input', (e) => {
    const v = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 16);
    e.target.value = v.match(/.{1,4}/g)?.join('-') || '';
  });
  $('gift-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const j = await call('gift', { key: $('gift-key').value, hours: Number($('gift-h').value) });
      $('gift-key').value = '';
      say(`Geschenkt. Offen für diesen Spielstand: ${fmt(j.pendingHours)} h.`, true);
    } catch (err) { say(err.message); }
  });
  $('jp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = Math.floor(Number($('jp-add').value));
    if (!(await confirmBox(`Jackpot um ${fmt(n)} Taler aufstocken?`, 'Aufstocken'))) return;
    try { showPot(await call('jackpot_add', { amount: n })); say('Jackpot aufgestockt.', true); }
    catch (err) { say(err.message); }
  });

  // --- Protokoll ---
  async function fullLog() { logList($('lg-list'), (await call('log')).log || []); }

  // --- Bestätigen ---
  function confirmBox(text, yes = 'Löschen') {
    const d = $('confirm');
    $('confirm-text').textContent = text; $('confirm-yes').textContent = yes;
    return new Promise((done) => {
      const end = (v) => { d.close(); $('confirm-yes').onclick = $('confirm-no').onclick = null; d.oncancel = null; done(v); };
      $('confirm-yes').onclick = () => end(true);
      $('confirm-no').onclick = () => end(false);
      d.oncancel = () => end(false);
      d.showModal(); $('confirm-no').focus();
    });
  }
})();
