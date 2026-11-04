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
    { id: 'fisch',   name: 'Fisch',             img: 'img/fsh-spin.gif',         r: 'common',    min: 20, max: 45,  val: 5,  photo: true, say: 'Ich dreh mich nur kurz um.', desc: 'Der Klassiker. Dreht sich gern im Kreis.', sea: true },
    { id: 'pixel',   name: 'Pixelfisch',        img: 'img/fish-icon.png',        r: 'common',    min: 8,  max: 16,  val: 4,  say: 'Knusper, knusper.', desc: 'Besteht zu 100 % aus Pixeln. Sehr knusprig.', pixel: true },
    { id: 'poisson', name: 'Poisson',           img: 'img/frenchfish.gif',       r: 'common',    min: 25, max: 50,  val: 6,  photo: true, say: 'Bonjour! Du hast mich, non?', desc: 'Kommt aus Frankreich. Hat Schokolade dabei.', sea: true },
    { id: 'spezi3',  name: 'Kleiner Spezifisch', img: 'img/spezifisch3.png',     r: 'common', clip: [0, .93],    min: 10, max: 22,  val: 6,  say: 'Klein, aber spezifisch.', desc: 'Ein ganz kleiner, aber sehr spezifischer Fisch.' },
    { id: 'platsch', name: 'Karpador',    img: 'img/fish.gif',   r: 'common',    min: 20, max: 50,  val: 3,  pixel: true, page: 'seiten/Karpador.html', say: 'Platsch. Platsch. Platsch.', desc: 'Kann eigentlich nichts außer zappeln. Macht das aber mit voller Hingabe.' },
    { id: 'stink',   name: 'Stinkfisch',        img: 'img/stinkfisch.png',       r: 'common',    min: 10, max: 25,  val: 5,  pixel: true, page: 'seiten/stinkfisch.html', say: 'Riech lieber nicht so genau hin.', desc: 'Grün, fleckig und riecht drei Stege weit.' },
    { id: 'schiff',  name: 'Schiff',            img: 'img/schiff.gif',           r: 'uncommon',  min: 40, max: 80,  val: 16, photo: true, page: 'seiten/schiff.html', map: 'see', say: 'Ahoi. Ich bin jetzt ein Schiff.', desc: 'Der Fisch, nur einmal um 180 Grad gedreht. Fährt seitdem auf Hoher See.' },
    { id: 'fisch2',  name: 'Fisch 2',           img: 'img/fish2-spin.gif',       r: 'uncommon',  min: 45, max: 90,  val: 14, photo: true, say: 'Diesmal mit mehr Budget.', desc: 'Die Fortsetzung. Länger als das Original.', sea: true },
    { id: 'spezi2',  name: 'Spezifische Spezifische', img: 'img/spezifisch2.png', r: 'uncommon', clip: [3.17, 4.9],  min: 22, max: 40,  val: 15, say: 'Spezifisch. Spezifisch.', desc: 'Spezifische Spezifische. Gut gekühlt.' },
    { id: 'fisch3',  name: 'Fisch 3',           img: 'img/fish3.gif',            r: 'uncommon',  min: 15, max: 30,  val: 16, photo: true, say: 'WAS?! Wer bist du denn?', desc: 'Hat dich gesehen. Ist sichtlich schockiert.' },
    { id: 'schlamm', name: 'Schlammfisch',      img: 'img/schlammfisch.png',     r: 'uncommon',  min: 20, max: 45,  val: 15, pixel: true, page: 'seiten/schlammfisch.html', say: 'Ich hab mich extra schmutzig gemacht.', desc: 'Wohnt im Schlamm unter dem Steg. Tropft überall hin.' },
    { id: 'gespraech', name: 'Gesprächsfisch', img: 'img/gutes-gespraech.gif', r: 'uncommon', min: 20, max: 40, val: 17, photo: true, page: 'seiten/gespraechsfisch.html', say: 'Gutes Gespräch.', desc: 'Schwimmt ganz nah ran, schaut dich an und beendet das Gespräch.' },
    { id: 'kritzel', name: 'Kritzelfisch',      img: 'img/doodlebob.gif',     r: 'uncommon',  min: 15, max: 35,  val: 16, pixel: true, page: 'seiten/kritzelfisch.html', say: 'Nicht anschauen, ich bin nur eine Skizze!', desc: 'Mit Bleistift hingekritzelt und nie ganz fertig geworden. Zittert leicht.' },
    { id: 'staebchen', name: 'Fischstäbchen',  img: 'img/fischstaebchen.png', r: 'uncommon', min: 7, max: 11, val: 15, pixel: true, page: 'seiten/fischstaebchen.html', say: 'Ich war mal ein Fisch. Jetzt bin ich knusprig.', desc: 'Paniert, goldbraun und noch warm. Niemand weiß, wie es ins Wasser gekommen ist.' },
    { id: 'beinfisch', name: 'Beinfisch',       img: 'img/beinfisch.gif',        r: 'uncommon',  min: 15, max: 30,  val: 18, photo: true, page: 'seiten/beinfisch.html', say: 'Ich wollte eigentlich nur kurz spazieren.', desc: 'Hat Beine. Läuft lieber am Ufer entlang als zu schwimmen.' },
    { id: 'spezi1',  name: 'Spezifischer Spezifisch', img: 'img/spezifisch1.png', r: 'rare', clip: [.93, 3.17],      min: 40, max: 70,  val: 38, say: 'Extra Spezi, extra spezifisch.', desc: 'Ein Prachtexemplar mit extra viel Spezi.' },
    { id: 'oel',     name: 'Ölfisch',           img: 'img/oelfisch.png',         r: 'rare',      min: 30, max: 60,  val: 45, pixel: true, page: 'seiten/oelfisch.html', say: 'Ich schillere. Das ist kein Kompliment.', desc: 'Schwarz und ölig, mit Regenbogenschimmer. Kommt nachts raus.', night: 1.8, sea: true },
    { id: 'kaugummi', name: 'Kaugummifisch',    img: 'img/fish-smile.gif',    r: 'rare',      min: 15, max: 30,  val: 48, photo: true, page: 'seiten/kaugummifisch.html', say: 'Blubb. Ich klebe jetzt an dir.', desc: 'Rund, grau und zäh wie alter Kaugummi. Lächelt trotzdem.' },
    { id: 'zacken',  name: 'Zackenbarsch',      img: 'img/zackenbarsch.gif',     r: 'rare',      min: 60, max: 120, val: 50, photo: true, page: 'seiten/zackenbarsch.html', say: 'AAAAAH.', desc: 'Reißt das Maul weit auf. Drin wohnt ein kleiner Putzerfisch zur Miete.', sea: true },
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
    { id: 'blob',    name: 'Blobfisch',         img: 'img/blobfisch.gif',        r: 'epic',      min: 25, max: 40,  val: 130, photo: true, page: 'seiten/blobfisch.html', say: 'Hier oben ist mir der Druck zu wenig.', desc: 'Lebt eigentlich tief unten. Nur weit draußen und am liebsten nachts.', far: .5, night: 2, sea: true },
    { id: 'muschel', name: 'Magische Miesmuschel', img: 'img/miesmuschel.png', r: 'epic', min: 12, max: 20, val: 150, pixel: true, page: 'seiten/miesmuschel.html', sea: true, say: 'Frag mich etwas.', desc: 'Liegt still im Sand und weiß alles. Zieh an der Schnur, dann antwortet sie. Meistens mit Nein.', hint: 'Wer sie fängt, kann ihr am Steg Fragen stellen' },
    { id: 'spee',    name: 'Spee Zierfisch',    img: 'img/spee-zierfisch.png',   r: 'epic',      min: 6,  max: 9,   val: 110, clip: [12.63, 13.9], say: 'Riech mal. Frühlingsfrisch!', desc: 'Ein Zierfisch, frisch gewaschen. Duftet nach Spee.', night: 1.5 },
    { id: 'spees',   name: 'Spezifische Spee Zierfische', img: 'img/spee-zierfische.png', r: 'epic', min: 12, max: 18, val: 160, clip: [13.9, 16.43], say: 'Wir bleiben zusammen!', desc: 'Zwei auf einmal. Spezifischer geht es kaum.', far: .5 },
    { id: 'fischer', name: 'Spezifischfischer', img: 'img/spezifischfischer-cut.png', r: 'legendary', min: 175, max: 190, val: 400, clip: [16.43, null], say: 'Moment … ich bin doch der Fischer!', desc: 'Der spezifische Spezifischfischer fischt spezifische Spezifische. Jetzt hast du ihn gefischt.', far: .45, hint: 'Steht am Steg. Fischt man ihn auch?' },
    { id: 'odfisch', name: 'Absolute Odfisch',  img: 'img/odfish.jpg',           r: 'legendary', min: 170, max: 190, val: 500, photo: true, say: 'Absolut.', desc: 'Absolute Legende. Nur nachts, nur weit draußen.', far: .6, night: 4, dayOff: true, sea: true },
    { id: 'katze',   name: 'Katzenfisch',       img: 'img/katzenfisch.png',  r: 'legendary', min: 40, max: 70,  val: 450, photo: true, page: 'seiten/katzenfisch.html', say: 'Miau. Ich meine: Blubb.', desc: 'Halb Katze, halb Fisch, ganz flauschig. Kommt lieber nachts.', far: .4, night: 2.5 },
    { id: 'uhrzeit', name: 'UhrZeitFisch',      img: 'img/uhrzeitfisch.gif', r: 'legendary', min: 160, max: 190, val: 480, photo: true, page: 'seiten/uhrzeitfisch.html', say: 'Ich bin pünktlich. Seit 66 Millionen Jahren.', desc: 'Ein Fisch aus der Urzeit, sehr cool. Beißt nur zur vollen Stunde.', fullHour: true, hint: 'Beißt nur zur vollen Stunde' },
    { id: 'drache',  name: 'Gyarados',    img: 'img/gyarados-water.gif', r: 'legendary', min: 150, max: 240, val: 520, pixel: true, page: 'seiten/drachenkarpfen.html', say: 'Ich bin den Wasserfall hochgesprungen. Jetzt bin ich sauer.', desc: 'Ein Karpfen, der es durchs Drachentor geschafft hat. Jade, Gold und schlechte Laune.', needs: { platsch: 14.5 }, bigSplash: true, hint: 'Erst wenn du 14,5 Karpador gefangen hast' },
    { id: 'hundsfisch', name: 'Hundsfisch', img: 'img/hundsfisch.png', r: 'common', min: 30, max: 60, val: 6, photo: true, whole: true, page: 'seiten/hundsfisch.html', say: 'Wuff. Blubb. Wuff.', desc: 'Apportiert nichts, freut sich aber trotzdem.' },
    { id: 'fuckingfisch', name: 'Fucking Fisch', img: 'img/fucking-fisch.png', r: 'uncommon', min: 25, max: 45, val: 15, photo: true, whole: true, page: 'seiten/fucking-fisch.html', say: 'FUCKING FISCH.', desc: 'Sein Name steht in Flammen über ihm. Mehr muss man nicht wissen.' },
    { id: 'propeller', name: 'Propellerfisch', img: 'img/propellerfisch.png', r: 'uncommon', min: 12, max: 28, val: 14, photo: true, whole: true, page: 'seiten/propellerfisch.html', say: 'Darf ich den Lolli behalten?', desc: 'Kugelfisch mit Propellermütze und Lolli. Heute hat er Wandertag.' },
    { id: 'nachricht', name: 'Sprecherfisch', img: 'img/nachrichtenfisch.png', r: 'uncommon', min: 20, max: 40, val: 16, photo: true, whole: true, page: 'seiten/nachrichtenfisch.html', say: 'Und nun das Wetter.', desc: 'Sendet live aus seinem Fernseher. Keiner weiß, wie er da reingekommen ist.' },
    { id: 'genosse', name: 'Genosse Wels', img: 'img/genosse-wels.png', r: 'rare', min: 60, max: 120, val: 50, photo: true, whole: true, page: 'seiten/genosse-wels.html', say: 'Auf den Fang, Genosse.', desc: 'Pelzmütze, Flasche, kein Lächeln zu viel. Friert nie.' },
    { id: 'affenfisch', name: 'Affenfisch', img: 'img/affenfisch.png', r: 'rare', min: 50, max: 100, val: 48, photo: true, whole: true, page: 'seiten/affenfisch.html', say: 'Uh uh. Blubb.', desc: 'Schaut dich an, als hättest du seine Banane.' },
    { id: 'grinsehai', name: 'Grinsehai', img: 'img/grinsehai.png', r: 'rare', min: 110, max: 220, val: 55, photo: true, whole: true, page: 'seiten/grinsehai.html', sea: true, say: 'Schöne Zähne, oder?', desc: 'Geht zweimal im Jahr zum Zahnarzt. Der Zahnarzt nur einmal.' },
    { id: 'gesichtshai', name: 'Gesichtshai', img: 'img/gesichtshai.png', r: 'epic', min: 120, max: 240, val: 150, photo: true, whole: true, page: 'seiten/gesichtshai.html', say: 'Was guckst du so?', desc: 'Hat ein Gesicht, das man nicht vergisst. Leider.' },
    { id: 'gigahai', name: 'Giga-Hai', img: 'img/giga-hai.png', r: 'epic', min: 200, max: 350, val: 170, photo: true, whole: true, page: 'seiten/giga-hai.html', sea: true, say: 'Kein Bein-Tag ausgelassen.', desc: 'Sein Kinn kommt zwei Sekunden vor ihm an.' },
    { id: 'keptwaiting', name: 'Kept You Waiting', img: 'img/kept-you-waiting.png', r: 'epic', min: 170, max: 190, val: 160, photo: true, whole: true, page: 'seiten/kept-you-waiting.html', say: 'Kept you waiting, huh?', desc: 'Du hast lange gewartet. Das ist nicht mal ein Fisch.' },
    { id: 'hummer', name: 'Blauer Hummer', img: 'img/blauer-hummer.png', r: 'legendary', min: 30, max: 60, val: 500, photo: true, whole: true, page: 'seiten/blauer-hummer.html', sea: true, sound: 'sounds/blauer-hummer.mp3', say: 'BLAUER HUMMER!', desc: 'Nur einer von zwei Millionen Hummern ist blau. Er hat dich zuerst gesehen.' },
    { id: 'laternerds', name: 'Later-Nerds-Schnecke', img: 'img/later-nerds.gif', r: 'junk', min: 5, max: 12, val: 3, photo: true, whole: true, page: 'seiten/later-nerds.html', say: 'Later, Nerds.', desc: 'Eine Schnecke auf einem Skateboard. Sie ist schon wieder weg.' },
    // weather fish: only bite while their weather is on (weather: id from WEATHER)
    { id: 'pfuetze',  name: 'Pfützenspringer',   img: 'img/pfuetzenspringer.png', r: 'uncommon', min: 12, max: 24, val: 20, pixel: true, page: 'seiten/pfuetzenspringer.html', weather: 'regen', say: 'Endlich Regen! Ich hüpf mal ein bisschen rum.', desc: 'Kommt nur raus, wenn es regnet. Springt von Tropfen zu Tropfen.' },
    { id: 'nebelgeist', name: 'Nebelgeist',      img: 'img/nebelgeist.png',       r: 'rare',     min: 30, max: 55, val: 55, pixel: true, page: 'seiten/nebelgeist.html', weather: 'nebel', say: 'Huuuh … ach, nur ein Angler.', desc: 'Halb durchsichtig. Taucht nur im Nebel auf.' },
    { id: 'blitzwels', name: 'Blitzwels',        img: 'img/blitzwels.png',        r: 'epic',     min: 70, max: 130, val: 150, pixel: true, page: 'seiten/blitzwels.html', weather: 'gewitter', say: 'Bzzzt. Lieber nicht anfassen.', desc: 'Lädt sich bei Gewitter auf. Die Barteln knistern.' },
    { id: 'bogenforelle', name: 'Regenbogenforelle', img: 'img/regenbogenforelle.png', r: 'epic', min: 35, max: 70, val: 170, pixel: true, page: 'seiten/regenbogenforelle.html', weather: 'bogen', say: 'Ich bin nur kurz da. Wie der Regenbogen.', desc: 'Schimmert in allen Farben – aber nur, solange der Regenbogen am Himmel steht.' },
    { id: 'kaufland', name: 'Kaufland-Fisch',    img: 'img/kaufland-fisch.png',   r: 'rare',     min: 25, max: 35, val: 49, pixel: true, page: 'seiten/kaufland-fisch.html', say: 'Heute im Angebot.', desc: 'Eingeschweißt, gekühlt, reduziert. Wie er ins Wasser kam, weiß keiner.' },
    { id: 'energy',   name: 'Monster-Energy-Fisch', img: 'img/energy-fisch.png',  r: 'rare',     min: 15, max: 17, val: 40, pixel: true, page: 'seiten/energy-fisch.html', map: 'see', energy: true, say: 'Null Zucker, volle Power!', desc: 'Eine Dose mit Flossen aus der Tiefsee. Wer sie fängt, hat eine Minute lang schnellere Bisse.' },
    { id: 'gangnam',  name: 'Gangnam-Fisch',     img: 'img/gangnam-fish.gif',     r: 'epic',     min: 30, max: 55, val: 175, photo: true, page: 'seiten/gangnam-fisch.html', map: 'see', night: 1.5, say: 'Ich tanze, also bin ich.', desc: 'Tanzt ganz unten in der Tiefsee. Niemand weiß, zu welcher Musik.' },
    // Hohe See (map: 'see'): only bite out on the open sea, unlocked with the 3rd rebirth
    { id: 'hering',   name: 'Hering',            img: 'img/hering.png',           r: 'common',   min: 20, max: 35, val: 9,  pixel: true, page: 'seiten/hering.html', map: 'see', say: 'Wir sind viele. Sehr viele.', desc: 'Silbrig und schnell. Kommt selten allein.' },
    { id: 'makrele',  name: 'Makrele',           img: 'img/makrele.png',          r: 'common',   min: 25, max: 45, val: 11, pixel: true, page: 'seiten/makrele.html', map: 'see', say: 'Streifen sind zeitlos.', desc: 'Gestreift wie ein Matrose.' },
    { id: 'thunfisch', name: 'Thunfisch',        img: 'img/thunfisch.png',        r: 'rare',     min: 100, max: 200, val: 70, pixel: true, page: 'seiten/thunfisch.html', map: 'see', say: 'Ich schwimme schon seit Portugal.', desc: 'Ein Kraftpaket. Zieht wie ein Motorboot.' },
    { id: 'schwertfisch', name: 'Schwertfisch',  img: 'img/schwertfisch.png',     r: 'epic',     min: 150, max: 250, val: 180, pixel: true, page: 'seiten/schwertfisch.html', map: 'see', say: 'En garde!', desc: 'Ficht mit seiner Nase. Gewinnt meistens.' },
    { id: 'seeteufel', name: 'Seeteufel',        img: 'img/seeteufel.png',        r: 'epic',     min: 40, max: 90, val: 190, pixel: true, page: 'seiten/seeteufel.html', map: 'see', night: 3, say: 'Siehst du das Licht? Komm näher …', desc: 'Lockt mit einer Laterne am Kopf. Nachts besonders aktiv.' },
    { id: 'kalmar',   name: 'Riesenkalmar',      img: 'img/riesenkalmar.png',     r: 'legendary', min: 250, max: 450, val: 600, pixel: true, page: 'seiten/riesenkalmar.html', map: 'see', night: 2, say: 'Acht Arme, zwei Tentakel, null Geduld.', desc: 'Kommt aus der Tiefe. Nur auf Hoher See, am liebsten nachts.' },
    { id: 'sturmhai', name: 'Sturmhai',          img: 'img/sturmhai.png',         r: 'legendary', min: 220, max: 320, val: 650, pixel: true, page: 'seiten/sturmhai.html', map: 'see', weather: 'gewitter', say: 'Ich reite den Blitz.', desc: 'Jagt nur bei Gewitter auf Hoher See.' },
    { id: 'flaschenpost', name: 'Flaschenpost',  img: 'img/flaschenpost.png',     r: 'junk',     min: 20, max: 30, val: 2,  pixel: true, page: 'seiten/flaschenpost.html', map: 'see', post: true, say: 'Hilfe, ich stecke in einer Flasche! … Nein, Spaß.', desc: 'Manchmal stecken ein paar Taler drin.' },
    // Glutgrotte (map: 'lava'): the lava cave under the dock, opens after the 1st prestige. Only its own fish bite there.
    { id: 'schlacke',  name: 'Schlackebrocken',  img: 'img/lava-schlacke.png',  r: 'junk',  min: 15, max: 30, val: 4, pixel: true, page: 'seiten/schlackebrocken.html', map: 'lava', post: 'slag', say: 'Ich glühe noch ein bisschen nach.', desc: 'Ein Klumpen erkalteter Lava. Manchmal stecken geschmolzene Taler drin.' },
    { id: 'glutgrundel', name: 'Glutgrundel',    img: 'img/lava-glutgrundel.png', r: 'common', min: 10, max: 20, val: 21, pixel: true, page: 'seiten/glutgrundel.html', map: 'lava', say: 'Heiß hier, oder? Ich find’s gemütlich.', desc: 'Klein, rund und glühend wie ein Stück Kohle.' },
    { id: 'aschebarsch', name: 'Aschebarsch',    img: 'img/lava-aschebarsch.png', r: 'common', min: 20, max: 40, val: 24, pixel: true, page: 'seiten/aschebarsch.html', map: 'lava', say: 'Nicht pusten, sonst staube ich.', desc: 'Aschgrau mit dunklen Streifen und Flossen wie Flammen.' },
    { id: 'bimsfisch', name: 'Bimssteinfisch',   img: 'img/lava-bimsfisch.png', r: 'uncommon', min: 25, max: 45, val: 45, pixel: true, page: 'seiten/bimssteinfisch.html', map: 'lava', say: 'Ich bin leichter, als ich aussehe.', desc: 'Voller kleiner Löcher und so leicht, dass er oben auf der Lava treibt.' },
    { id: 'funkenforelle', name: 'Funkenforelle', img: 'img/lava-funkenforelle.png', r: 'uncommon', min: 30, max: 55, val: 48, pixel: true, page: 'seiten/funkenforelle.html', map: 'lava', say: 'Pssst … knister.', desc: 'Sprüht beim Springen Funken. Nicht in der Nähe von Heu angeln.' },
    { id: 'obsidianhecht', name: 'Obsidianhecht', img: 'img/lava-obsidianhecht.png', r: 'rare', min: 60, max: 120, val: 140, pixel: true, page: 'seiten/obsidianhecht.html', map: 'lava', say: 'Scharf. In jeder Hinsicht.', desc: 'Lang, schwarz und glatt wie Vulkanglas. Schimmert lila.' },
    { id: 'schwefelkugel', name: 'Schwefel-Kugelfisch', img: 'img/lava-schwefelkugel.png', r: 'rare', min: 20, max: 40, val: 150, pixel: true, page: 'seiten/schwefel-kugelfisch.html', map: 'lava', say: 'Riechst du das? Das bin ich.', desc: 'Bläht sich auf, wenn er sich ärgert. Riecht nach faulen Eiern.' },
    { id: 'magmakarpfen', name: 'Magmakarpfen',  img: 'img/lava-magmakarpfen.png', r: 'epic', min: 70, max: 130, val: 360, pixel: true, page: 'seiten/magmakarpfen.html', map: 'lava', say: 'Unter meiner Kruste brodelt es.', desc: 'Ein schwerer Karpfen aus Basalt, durch dessen Risse das Magma leuchtet.' },
    { id: 'salamanderfisch', name: 'Salamanderfisch', img: 'img/lava-salamanderfisch.png', r: 'epic', min: 40, max: 70, val: 375, pixel: true, page: 'seiten/salamanderfisch.html', map: 'lava', night: 2, say: 'Ich hab Beine. Ich benutze sie nur nicht.', desc: 'Schwarz mit orangen Flecken und vier kleinen Beinen. Kommt lieber nachts.' },
    { id: 'kristallwels', name: 'Kristallwels',  img: 'img/lava-kristallwels.png', r: 'epic', min: 80, max: 160, val: 390, pixel: true, page: 'seiten/kristallwels.html', map: 'lava', far: .5, say: 'Mir wachsen Steine aus dem Rücken. Normal.', desc: 'Auf seinem Rücken wachsen leuchtende Kristalle. Lebt weit draußen im Glutsee.' },
    { id: 'lavadrache', name: 'Lavadrache',      img: 'img/lava-lavadrache.png', r: 'legendary', min: 300, max: 500, val: 1275, pixel: true, page: 'seiten/lavadrache.html', map: 'lava', bigSplash: true, say: 'Ich bin kein Fisch. Ich bin ein Vulkan mit Schwanz.', desc: 'Schlängelt sich durch die Glut. Seine Mähne brennt seit tausend Jahren.' },
    { id: 'phoenixfisch', name: 'Phönixfisch',   img: 'img/lava-phoenixfisch.png', r: 'legendary', min: 60, max: 110, val: 1500, pixel: true, page: 'seiten/phoenixfisch.html', map: 'lava', needs: { magmakarpfen: 10 }, bigSplash: true, hint: 'Zeigt sich erst, wenn du 10 Magmakarpfen gefangen hast', say: 'Ich war schon Asche. Zweimal.', desc: 'Steigt aus der Glut auf, wenn genug Magmakarpfen gefangen wurden. Brennt und wird nie kleiner.' },
    // catch conditions (pickFish): bait = only on that bait, hours = only between those clock hours, crits = after that many
    // defeated lava creatures, minRod = only on a lava rod of at least that depth
    { id: 'russaal', name: 'Rußaal',              img: 'img/lava-russaal.png', r: 'rare', min: 50, max: 110, val: 165, pixel: true, page: 'seiten/russaal.html', map: 'lava', bait: 'glutkoeder', hint: 'Beißt nur auf Glutköder', say: 'Hust. Entschuldigung. Hust.', desc: 'Ein langer, rußschwarzer Aal. Wo er schwimmt, steigen kleine Rauchwolken auf. Mag nur Glutköder.' },
    { id: 'mitternachtsfunke', name: 'Mitternachtsfunke', img: 'img/lava-mitternachtsfunke.png', r: 'epic', min: 25, max: 45, val: 420, pixel: true, page: 'seiten/mitternachtsfunke.html', map: 'lava', hours: [0, 3], hint: 'Beißt nur zwischen 0 und 3 Uhr', say: 'Pst. Alle anderen schlafen schon.', desc: 'Dunkelblau mit glühenden Funken wie Sterne. Kommt nur in den ersten Stunden nach Mitternacht nach oben.' },
    { id: 'kraterwaechter', name: 'Kraterwächter', img: 'img/lava-kraterwaechter.png', r: 'legendary', min: 250, max: 420, val: 1650, pixel: true, page: 'seiten/kraterwaechter.html', map: 'lava', crits: 25, minRod: 4, bigSplash: true, hint: 'Zeigt sich erst nach 25 besiegten Lava-Kreaturen – und nur an einer Drachenknochenrute oder besser', say: 'Wer hat meine Kreaturen verhauen? Ach, du.', desc: 'Ein gepanzerter Riese aus Basalt mit einer Krone aus Kraterzacken. Bewacht die Kreaturen der Glutgrotte.' },
    // the boss of the open sea: never bites normally, only lands after winning the boss fight
    { id: 'odboss',   name: 'Odfisch',           img: 'img/odfisch-boss.png',     r: 'legendary', min: 260, max: 320, val: 900, pixel: true, page: 'seiten/odfisch.html', map: 'see', boss: true, say: 'Fih.', desc: 'Halb Fisch, halb Katze, ganz Boss. Der Herrscher der Hohen See lässt sich nur im Bossfight bezwingen – am besten zusammen mit der Lobby.' },
    { id: 'schummel', name: 'Ditto',    img: 'img/ditto-dance.gif', r: 'junk', min: 6, max: 14, val: 1, pixel: true, page: 'seiten/schummelfisch.html', fake: true, say: 'Das ist kein Fisch.', desc: '+1 Coin' },
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
    { id: 'stern',  name: 'Sternenrute',      price: 15000, reb: 3, cast: 1.0, reel: 2.6,  tens: .4,   luck: 2.1, desc: 'Aus einer Sternschnuppe geschnitzt.' },
    { id: 'tiefsee', name: 'Tiefseerute',     price: 40000, reb: 4, cast: 1.0, reel: 3.0, tens: .34,  luck: 2.5, desc: 'Für die ganz tiefen Wasser. Hält fast alles aus.' },
    { id: 'krake',  name: 'Krakenrute',       price: 120000, reb: 6, cast: 1.0, reel: 3.4, tens: .3,   luck: 3.0, desc: 'Acht Arme Kraft in einer Rute. Nichts reißt.' },
    // Lavaruten: normal rods melt in the Glutgrotte, there only these work (and they only work there)
    { id: 'basalt',   name: 'Basaltrute',         price: 400,   pres: 1, lava: true, cast: .8,  reel: 1.5, tens: .7,  luck: 1.1, desc: 'Aus erkalteter Lava. Die erste Rute, die in der Glutgrotte nicht schmilzt.' },
    { id: 'obsidian', name: 'Obsidianrute',       price: 4000,  pres: 1, depth: 2, lava: true, kc: 2, glut: 80, cast: .95, reel: 2.2, tens: .5,  luck: 1.6, desc: 'Schwarzes Vulkanglas, hart wie Stahl. Nur für die Glutgrotte.' },
    { id: 'magma',    name: 'Magmarute',          price: 15000, pres: 1, depth: 3, lava: true, kc: 3, glut: 250, cast: 1.0, reel: 2.9, tens: .38, luck: 2.2, desc: 'In ihr fließt noch Magma. Wird nie kalt. Nur für die Glutgrotte.' },
    { id: 'drachenknochen', name: 'Drachenknochenrute', price: 50000, pres: 1, depth: 4, lava: true, kc: 4, glut: 700, cast: 1.0, reel: 3.6, tens: .28, luck: 3.0, desc: 'Aus dem Knochen eines Lavadrachen. Hält jede Glut aus. Nur für die Glutgrotte.' },
    { id: 'phoenixrute', name: 'Phönixfederrute', price: 250000, pres: 1, depth: 5, lava: true, kc: 5, glut: 1800, cast: 1.0, reel: 4.2, tens: .24, luck: 3.6, desc: 'Aus einer Feder des Phönixfischs. Brennt, ohne zu verbrennen. Nur für die Glutgrotte.' },
  ];
  const BAITS = [
    { id: 'wurm',   name: 'Wurm',          price: 0,  pack: 0, luck: 1,   speed: 1,   desc: 'Unbegrenzt. Wurmig.' },
    { id: 'spezi',  name: 'Spezi-Köder',   price: 12, pack: 5, luck: 1.7, speed: 1.35, desc: '5 Stück. Seltene Fische beißen öfter.' },
    { id: 'glitzer', name: 'Glitzerköder', price: 35, pack: 5, lvl: 4, luck: 2.8, speed: 1.6, desc: '5 Stück. Für die ganz großen Fänge.' },
    { id: 'wiik',   name: 'Wii-Köder',     price: 30, pack: 5, lvl: 3, luck: 1.5, speed: 1.4, wii: 2, img: 'img/wii-bait.png', desc: '5 Stück. Zeigt auf die Wii-Fische. Die beißen doppelt so oft.' },
    { id: 'mond',   name: 'Mondköder',     price: 90, pack: 5, reb: 2, luck: 4.2, speed: 2,  desc: '5 Stück. Leuchtet. Legenden können nicht widerstehen.' },
    { id: 'abyss',  name: 'Abgrundköder',  price: 200, pack: 5, reb: 5, luck: 6, speed: 2.4, desc: '5 Stück. Leuchtet aus der Tiefe. Selbst Legenden werden neugierig.' },
    { id: 'glutkoeder', name: 'Glutköder', price: 300, glut: 15, pack: 5, pres: 1, luck: 3, speed: 1.8, lava: true, kc: 3, desc: '5 Stück. Glüht wie Kohle. Wirkt nur in der Glutgrotte, dort aber richtig.' },
    { id: 'lockkoeder', name: 'Lockköder', price: 400, glut: 20, pack: 5, pres: 1, depth: 2, luck: 1.2, speed: 1.6, lava: true, kc: 10, desc: '5 Stück. Riecht nach Ärger. Lockt in der Glutgrotte viel öfter Lava-Kreaturen an.' },
    { id: 'odkoeder', name: 'Odköder',     price: 1500, pack: 1, reb: 3, luck: 1, speed: 1, boss: true, desc: '1 Stück. Nachts auf Hoher See ausgeworfen, ruft er den Odfisch.' },
  ];
  // Mysteryboxen: bought at the kiosk or found on the hook now and then. Opening one rolls a prize.
  const BOXES = [
    { id: 'boxwood',   name: 'Holzkiste',   price: 120,  tier: 0, desc: 'Knarzt und riecht nach Steg. Drin ist … irgendwas.', col: ['#a0662f', '#6b3a1f', '#fbbf24'] },
    { id: 'boxsilver', name: 'Silberkiste', price: 450,  tier: 1, lvl: 4, desc: 'Schwer und kühl. Klappert vielversprechend.', col: ['#cbd5e1', '#64748b', '#38bdf8'] },
    { id: 'boxgold',   name: 'Goldkiste',   price: 1500, tier: 2, lvl: 8, desc: 'Glänzt so sehr, dass die Fische neidisch werden.', col: ['#facc15', '#b45309', '#f472b6'] },
  ];
  trAll(BOXES, ['name', 'desc']);
  // Kiosk-Snacks: timed buffs bought with coins, saved as save.buffs = {id: endsAt}
  const SNACKS = [
    { id: 'kaffee',    name: 'Kaffee',         icon: '☕', price: 400,  desc: 'Bisse kommen 30 % schneller.' },
    { id: 'broetchen', name: 'Fischbrötchen',  icon: '🥪', price: 1200, desc: '+25 % Taler pro Fang.' },
    { id: 'keks',      name: 'Kleeblatt-Keks', icon: '🍀', price: 3000, desc: 'Seltene, epische und legendäre Fische beißen 30 % öfter.' },
    { id: 'limo',      name: 'Glitzerlimo',    icon: '✨', price: 8000, desc: 'Doppelte Shiny- und Mutationschance.' },
  ];
  trAll(SNACKS, ['name', 'desc']);
  const priceScale = p => p ? Math.round(p * Math.sqrt(Math.max(1, coinMult())) / 5) * 5 : 0;
  for (const it of [...BAITS, ...SNACKS, ...BOXES]) { const base = it.price; Object.defineProperty(it, 'price', { get: () => priceScale(base), enumerable: true }); }
  const SNACK_MS = 600000, SNACK_MAX = 1800000; // 10 minutes per snack, stacked up to 30
  function buffOn(id) { return !!(save.buffs && save.buffs[id] > Date.now()); }
  // every coin spent in the shop goes through here, so the "spent" leaderboard can count it
  function spend(n) { save.coins -= n; save.spent = (save.spent || 0) + n; }

  // Patch notes: newest first. Every update players notice gets a new entry on top (new id);
  // returning players see the entries they missed once after the update (📰 / N shows them again).
  const PATCH_NOTES = [
    { id: '2026-11-04-16', date: '04.11.2026', items: [
      '🦞 12 neue Fänge am Steg, darunter der Blaue Hummer (legendär, mit eigenem Sound), der Giga-Hai, der Genosse Wels und der Hundsfisch. Drei davon beißen auch auf Hoher See.',
    ] },
    { id: '2026-11-04-15', date: '04.11.2026', items: [
      '🎨 Neue Pixelkunst fast überall: Alle selbst gezeichneten Fische, Lava-Kreaturen und der Odfisch sind neu gemalt. Dazu kommen deine Spielfigur, Bealin, Glimm, Herr Zylinderwels, die Sachen am Steg (Automat, Kiosk, Brett, Pokal, Buch, Zeitung), Glutflosses Stand, die Boje, das Steuerrad, der David-Hasselhoff-Skin und die Laden-Icons. Snacks haben jetzt echte Pixel-Icons statt Emojis. Am Spiel selbst ändert sich nichts.',
    ] },
    { id: '2026-11-04-14', date: '04.11.2026', items: [
      '🐚 Neu am Steg: die Magische Miesmuschel (episch, auch auf Hoher See). Beim Fang verrät sie dir gleich eine Antwort. Danach liegt sie auf einem Stein neben dem Steg: Klick sie an, stell eine Frage und zieh an der Schnur. Mit Ton an antwortet sie mit tiefer Stimme.',
    ] },
    { id: '2026-11-04-13', date: '04.11.2026', items: [
      '🛥️ Neuer Boot-Skin für die Hohe See: „David Hasselhoff“ (30 000 Taler im Laden unter Kosmetik, ab 3× Wiedergeburt). Statt Bealins Boot schwimmt dann ein riesiger Pixel-Hoff mit Locken und roter Badehose auf dem Bauch durchs Meer, und du angelst von seinem Rücken aus. Im Kleiderschrank gibt es dafür den neuen Platz „Boot“.',
    ] },
    { id: '2026-11-04-12', date: '04.11.2026', items: [
      '⏱ Neu: deine Spielzeit. Oben in der Leiste steht, wie lange du schon fischst (Tippen oder Hovern zeigt auch die aktuelle Sitzung), und im Fortschritt steht sie bei deinen Werten. Gezählt wird nur, solange das Spiel offen und sichtbar ist. In den Einstellungen kannst du die Anzeige oben ausblenden.',
    ] },
    { id: '2026-11-04-11', date: '04.11.2026', items: [
      '👹 Neu in der Glutgrotte: Lava-Kreaturen! Manchmal beißt statt eines Fisches eine Kreatur an – Glutschnecke, Aschekrabbe, Schlackwurm, Flammenqualle, Basaltgolem und der seltene Glutkraken, je nach Tiefe. Halten macht Schaden, loslassen, wenn sie tobt, und schlag sie, bevor die Zeit abläuft. Beute: Glutsteine, Taler, EP und manchmal ein Glutherz.',
      '🎯 Neuer Wert Kreatur-Chance (Grundwert 5 %, höchstens 30 %): Lavaruten ab der Obsidianrute, der Glutköder, der neue Lockköder (Lava-Laden, ab Tiefe 2) und Glimms neues Werkstatt-Upgrade Lockruf erhöhen sie.',
      '🐟 Drei neue Lavafische mit Fangbedingungen: der Rußaal beißt nur auf Glutköder, der Mitternachtsfunke nur zwischen 0 und 3 Uhr, und der Kraterwächter zeigt sich erst nach 25 besiegten Kreaturen an einer Drachenknochenrute oder besser.',
      '📖 Der Fischdex zeigt in der Glutgrotte jetzt auch die Lava-Kreaturen, die du schon besiegt hast.',
    ] },
    { id: '2026-11-04-10', date: '04.11.2026', items: [
      '📖 Der Fischdex hat jetzt eine Seite pro Gebiet: Steg, Hohe See und Glutgrotte, jeweils mit eigenem Zähler am Tab. Er öffnet sich dort, wo du gerade angelst. Fische, die auch auf Hoher See beißen, stehen auf beiden Seiten.',
      '🔎 Suche und Filter im Fischdex: nach Namen suchen, nur fehlende, nur gefangene oder Fische ohne Gold-Medaille anzeigen und nach Seltenheit filtern. Gilt auch im Shinydex.',
      '🕘 Neu im Fortschritt: der Fang-Verlauf mit deinen letzten 20 Fängen – Fisch, Größe, Mutation, Shiny, Ort und wie viele Taler er gebracht hat.',
    ] },
    { id: '2026-11-04-9', date: '04.11.2026', items: [
      '👑 Der Odfisch sieht neu aus: Katzenkopf mit Krone, Narbe über dem Auge, Reißzähne, stachelige Rückenflosse und Kampfnarben – endlich wie ein echter Herrscher der Hohen See.',
      '🎬 Der Odfisch-Kampf hat jetzt Zwischensequenzen: Er taucht mit Kinobalken, Beben und Titelkarte auf, springt bei jedem Phasenwechsel aus dem Wasser (in der Wut-Phase mit glühenden Augen), und am Ende gibt es eine Sieges- oder Abtauch-Szene. Dazu blitzt er bei Treffern auf und zeigt den Schaden als Zahlen.',
    ] },
    { id: '2026-11-04-8', date: '04.11.2026', items: [
      '⛏️ Glutsteine und die Grotten-Tiefe werden bei Wiedergeburt und Prestige jetzt zurückgesetzt – du gräbst dich jedes Mal neu hinunter. Glimms Werkstatt, sein Vertrauen und seine Aufträge bleiben.',
    ] },
    { id: '2026-11-04-7', date: '04.11.2026', items: [
      '🍀 Glück neu ausbalanciert: Rute, Köder und Talente bringen weiter spürbar mehr seltene Fische, aber nicht mehr so viel, dass Legendäre alltäglich werden. Auf Hoher See sind jetzt etwa 15–20 % der Fänge episch und 4–5 % legendär statt bis zu 75 %.',
      '🌋 In der Glutgrotte zählt jeder Wurf als weit draußen, wie auf Hoher See. Dadurch beißen unten mehr seltene Fische, und die Grotte bringt ab Tiefe 3 mehr Taler als die See. Die See gibt dafür mehr EP.',
      '💰 Die späten Ruten kosten mehr, damit sie wieder ein Ziel sind: Sternenrute 15 000, Tiefseerute 40 000, Krakenrute 120 000 Taler.',
    ] },
    { id: '2026-11-04-6', date: '04.11.2026', items: [
      '📜 In der Steg-Zeitung gibt es unten den Knopf „Ältere Ausgaben“: Damit liest du alle früheren Patch Notes nach.',
      '🎣 Lavaruten werden bei Wiedergeburt und Prestige wieder zurückgesetzt, wie alle anderen Ruten.',
    ] },
    { id: '2026-11-04-5', date: '04.11.2026', items: [
      '🖱️ Taktdrill: Links- und Rechtsklick lassen sich jetzt wie in osu! abwechselnd drücken – auch wenn die andere Taste noch gehalten wird, zählt jeder Klick.',
    ] },
    { id: '2026-11-04-4', date: '04.11.2026', items: [
      '🎯 Taktdrill wie in osu!: Mit der Maus auf den Kreis zielen und mit Links- oder Rechtsklick (oder Z/X) irgendwo treffen – es zählt nur, wenn der Zeiger auf dem Kreis ist. Am Handy tippst du die Kreise wie bisher an, die Leertaste geht weiter ohne Zielen.',
    ] },
    { id: '2026-11-04-3', date: '04.11.2026', items: [
      '🏆 Bestenliste: „Wiedergeburten“ zeigt jetzt deine aktuellen Wiedergeburten und fällt beim Prestige wie im Spiel auf 0. Neue Wiedergeburten erscheinen sofort.',
      '✦ Prestige lohnt sich mehr: +100 % Taler pro Prestige statt +50 %, und 40 % deiner Wiedergeburten zählen als Erbe weiter. Talente werden beim Prestige weiter zurückgesetzt.',
      '🎖️ Rang, Seebären-Jacke und Fischgott-Krone zählen jetzt alle Wiedergeburten insgesamt – ein Prestige nimmt sie dir nicht mehr weg. Lavaruten bleiben bei Wiedergeburt und Prestige erhalten.',
      '⚖️ Wirtschaft: Taler-Boni addieren sich innerhalb ihrer Gruppe (Weg, Talente, Sammlung) statt alle miteinander zu multiplizieren. Köder, Snacks und Boxen werden mit deinem Taler-Bonus etwas teurer. Neu: Schmiede bis +15, Sonnenkrone (500 000 Taler) und Galaxiemantel (1 Mio. Taler).',
      '🌀 Wiedergeburt braucht pro Stufe nur noch 2 Level mehr statt 3. Alle 5 Level gibt es einen Meilenstein mit Schuppen, alle 10 Level eine Mysterybox.',
      '📅 Neue Wochenziele: drei größere Ziele pro Woche, für alle gleich, mit Schuppen, Perlen und Glutsteinen. Im Fortschritt siehst du jetzt immer, was als Nächstes kommt.',
    ] },
    { id: '2026-11-04-2', date: '04.11.2026', items: [
      '⚖️ Balance: Die Glutgrotte bringt weniger Taler. Grotten-Fische sind jetzt etwa halb so viel wert, der Hitzebonus liegt bei +20 %, jede Tiefe gibt +10 %, Glimms Vertrauen +3 % pro Stufe und das Glutnetz +5 % pro Stufe. Glimms Aufträge zahlen etwa die Hälfte. Glutsteine bleiben, wie sie sind.',
    ] },
    { id: '2026-11-04-1', date: '04.11.2026', items: [
      '🌋 Glutflosses Lava-Laden ist jetzt ein eigener Stand unten in der Glutgrotte – nicht mehr im Kiosk am Steg.',
      '🎣 Die Basaltrute kostet jetzt 400 Taler statt Glutsteinen. So kommst du an deine erste Lavarute, ohne schon Glutsteine zu haben.',
    ] },
    { id: '2026-11-03-16', date: '03.11.2026', items: [
      '⏩ Neue Einstellungen: Die Fangkarte kann sich nach 2,5 Sekunden von selbst schließen (nicht bei neuen Fischen, Legendären und Shinys), und leere Köder lassen sich automatisch nachkaufen.',
    ] },
    { id: '2026-11-03-15', date: '03.11.2026', items: [
      '⚙️ Neue Einstellungen (Zahnrad oben oder Taste E): Ton, Lautstärke, weniger Bildschirmwackeln und kurze Zahlen (1,2 Mio.).',
      '📜 „Alle abholen“: Fertige Aufträge – auch Glimms – holst du jetzt mit einem Klick ab.',
      '🛡️ Fairer Spielen: Von Hand veränderte Spielstände werden erkannt und können nicht mehr in die Bestenliste.',
      '🎟️ Codes: In den Einstellungen gibt es jetzt ein Feld zum Einlösen von Codes – der erste schaltet die Beta-Kosmetik frei (Beta-Kappe, Beta-Jacke, Beta-Pose).',
    ] },
    { id: '2026-11-03-14', date: '03.11.2026', items: [
      '🌋 Neuer Lava-Laden im Kiosk: Hier zahlst du nur mit Glutsteinen 🔥, nicht mit Talern. Lavaruten und Glutköder gibt es jetzt nur noch dort.',
      '🦈 Im Lava-Laden verkauft jetzt Glutflosse, ein tanzender Hai vor Flammen.',
      '🎩 Neue Lava-Kosmetik für Glutsteine: Glut-Pose, Aschejacke, Magmahelm und die funkelnde Obsidiankrone.',
    ] },
    { id: '2026-11-03-13', date: '03.11.2026', items: [
      '🔥 Neue Währung: Glutsteine! Jeder Fang in der Glutgrotte bringt welche – je seltener der Fisch, desto mehr (Legendäre 40, Kapital und Monster doppelt, Shinys dreifach).',
      '⛏️ Die Glutgrotte hat jetzt 5 Tiefen: Glutkammer, Aschehalle, Magmaschlund, Drachenhort und Phönixnest. Mit Glutsteinen gräbt Glimm tiefer – jede Tiefe bringt neue Fische, eine neue Lavarute und +20 % Taler. Ganz unten wartet die Phönixfederrute.',
      '🔧 Glimms Werkstatt: Für Glutsteine gibt es dauerhafte Grotten-Upgrades – Glutnetz (mehr Taler), Hitzeschild (weniger Spannung), Funkenlicht (mehr Glück) und Glutkristall (mehr Glutsteine).',
    ] },
    { id: '2026-11-03-12', date: '03.11.2026', items: [
      '💰 Die Glutgrotte bringt jetzt richtig Geld: Alle Grotten-Fische sind dreimal so viel wert, und unten gibt es dazu +50 % Hitzebonus auf jeden Fang.',
      '⛏️ Glimms Aufträge: Glimm hat in der Grotte immer drei eigene Aufträge mit großen Belohnungen. Für epische Fänge gibt es sogar eine Perle.',
      '🤝 Glimms Vertrauen: Alle drei erledigten Aufträge vertraut er dir mehr – jede Stufe bringt dauerhaft +5 % Taler in der Grotte, bis +50 %.',
    ] },
    { id: '2026-11-03-11', date: '03.11.2026', items: [
      '🐉 Gyarados beißt jetzt schon nach 14,5 Karpador statt nach 25.',
      '🌋 Neue Welt: die Glutgrotte! Nach dem 1. Prestige bringt dich Glimm, ein alter Maulwurf mit Grubenhelm auf dem glühenden Felsen vor dem Steg, hinab zu einem See aus Lava.',
      '🐟 Zwölf ganz neue Fische, die es nur dort gibt – von der Glutgrundel bis zum legendären Lavadrachen. Und wer zehn Magmakarpfen fängt, weckt den Phönixfisch.',
      '🎣 Normale Ruten schmelzen in der Lava: Herr Zylinderwels verkauft jetzt Lavaruten (Basalt-, Obsidian-, Magma- und Drachenknochenrute). Dazu der Glutköder, ein neues Fischdex-Ziel und der Lavamantel.',
    ] },
    { id: '2026-11-03-10', date: '03.11.2026', items: [
      '✦ Prestige gibt es jetzt schon ab der 7. Wiedergeburt. Jede Wiedergeburt darüber bringt weiterhin 2 Perlen mehr.',
    ] },
    { id: '2026-11-03-9', date: '03.11.2026', items: [
      '✦ Neu: Prestige ab der 10. Wiedergeburt. Es setzt alles zurück, auch Wiedergeburten, Rang, Schuppen und Talente – dafür gibt es pro Prestige dauerhaft +50 % Taler und +25 % EP.',
      '🦪 Perlen-Talente: Für Perlen aus dem Prestige gibt es Perlenhaken, Perlenglück, Schuppensegen, Frühreif und die Seekarte (Hohe See ohne Wiedergeburt). Sie bleiben für immer.',
      '👑 Neue Kosmetik fürs Prestige: Perlenkrone (1×), Perlen-Pose (2×) und Prestige-Mantel (3×). Dazu eine Bestenliste „Prestige“ und ✦ vor dem Rang.',
      '✏️ Namen für Bestenliste und Lobby dürfen jetzt schon ab einem Zeichen lang sein.',
    ] },
    { id: '2026-11-03-8', date: '03.11.2026', items: [
      '⛵ Alte Bekannte auf Hoher See: Fisch, Poisson, Fisch 2, Ölfisch, Zackenbarsch, Blobfisch und der Absolute Odfisch (nachts) beißen jetzt auch draußen auf dem Meer.',
      '🌦️ Mehr Wetter, öfter: Das Wetter wechselt jetzt jeden Spieltag (alle 5 Minuten) und die Sonne scheint seltener.',
      '🚢 Neuer Fisch auf Hoher See: das Schiff – der Fisch, einmal um 180 Grad gedreht.',
      '💨 Neues Wetter: Wind (Köder fliegt weiter raus), ❄️ Schnee (+25 % Taler, langsamere Bisse), 🔥 Hitzewelle (weniger Spannung) und 🌠 Sternschnuppen (mehr Legendäre und Shinys).',
    ] },
    { id: '2026-11-03-7', date: '03.11.2026', items: [
      '🏅 Fisch-Meisterschaft: Fang denselben Fisch oft genug für Bronze, Silber und Gold. Jede Medaille gibt EP und Schuppen, jeder Gold-Fisch dauerhaft +1 % Taler.',
      '⚒️ Rutenschmiede: Die Rute in der Hand lässt sich im Laden bis +10 schmieden.',
      '🐚 Talente gehen ab der 5. Wiedergeburt bis Stufe 10. Neu: Nachtangler und Bossjäger.',
      '🎖️ Ränge von Lehrling bis Fischgott – im Fortschritt, in der Lobby und in der Bestenliste.',
      '🔓 Neu hinter Wiedergeburten: Abgrundköder (5×), Krakenrute (6×), Seebären-Jacke (8×) und Fischgott-Krone (10×).',
    ] },
    { id: '2026-11-03-6', date: '03.11.2026', items: [
      '🎰 Fischautomat: Höherer Einsatz – bis 2 000 Taler, mit jeder Wiedergeburt mehr (bis 50 000). Neue Knöpfe ½ und ×2.',
      '💰 Jackpot-Topf: 2 % jedes Einsatzes landen im Topf. Drei Odfische gewinnen ihn obendrauf.',
      '🥪 Kiosk-Snacks im Laden: Kaffee, Fischbrötchen, Kleeblatt-Keks und Glitzerlimo wirken je 10 Minuten.',
      '💎 Luxus-Kosmetik: Kristallpose, Kapitänsjacke, Diamanthut und Kronen-Hut.',
      '💸 Neue Bestenliste: Wer hat am meisten Taler ausgegeben?',
    ] },
    { id: '2026-11-03-5', date: '03.11.2026', items: [
      '📏 Größenklassen: Jeder Fang ist Mini, Normal, Groß, Kapital oder Monster. Kapital und Monster wachsen übers Maximum hinaus und sind bis zu 4× so viel wert.',
      '🌦️ Wetter: Sonne, Regen, Nebel, Gewitter und manchmal ein Regenbogen – für alle gleich. Jedes Wetter hat seinen Bonus (oben an der Wetter-Pille).',
      '🐟 Neue Wetterfische: Pfützenspringer, Nebelgeist, Blitzwels und Regenbogenforelle. Dazu im Angebot: der Kaufland-Fisch.',
      '⛵ Neue Map – Hohe See: Ab der 3. Wiedergeburt fährt Bealin dich raus (Boje am Steg). Mit eigenen Fischen, vom Hering bis zum Riesenkalmar.',
      '⚔️ Bossfight: Nachts auf Hoher See ruft der Odköder den Odfisch. Drei Phasen, drei Minuten – in einer Lobby kämpft ihr zusammen gegen einen Lebensbalken.',
      '🕺 Neue Tiefseefische auf Hoher See: der Gangnam-Fisch und der Monster-Energy-Fisch (nach dem Fang eine Minute lang schnellere Bisse).',
      '🏆 Mehr Endgame: Tiefseerute, Talente Maßband und Wetterfrosch, neue Hutfarben bis zur 10. Wiedergeburt, neue Fischdex-Ziele, Kosmetik und Bestenlisten (Monster-Fänge, Odfisch-Siege).',
    ] },
    { id: '2026-11-03-4', date: '03.11.2026', items: [
      '🕒 Gemeinsame Uhrzeit: Tag und Nacht laufen jetzt für alle gleich – in einer Lobby angelt ihr also immer zur selben Tageszeit.',
      '🎩 Kosmetik: Hüte, Regenjacken und Posen – ein paar im Laden, die besonderen nur durch Erfolge. Andere in deiner Lobby sehen deinen Look.',
      '👕 Kleiderschrank: Klick auf dich selbst (oder K), um anzuziehen, was du hast – und zu sehen, wie du den Rest bekommst. Haut- und Haarfarbe kannst du dort frei wählen.',
      '💬 Lobby-Chat: In einer Lobby mit Enter oder T schreiben. Nachrichten erscheinen als Sprechblase über dem Angler.',
    ] },
    { id: '2026-11-03-3', date: '03.11.2026', items: [
      '👥 Multiplayer-Lobbys: Erstelle eine Lobby (👥 oder O) und schick Freunden den Code oder Link. Ihr seht euch am Steg, eure Fänge und wer seit dem Beitreten die meisten Taler geangelt hat – bis zu 8 Angler.',
    ] },
    { id: '2026-11-03-2', date: '03.11.2026', items: [
      '🎵 Taktdrill: Legendäre Fische tanzen manchmal an der Leine. Tippe die Kreise im Takt an (oder Leertaste, Z, X), wenn der Ring sie erreicht – mit genug Genauigkeit gehört der Fisch dir.',
      '📰 Die Steg-Zeitung: Nach jedem Update liegt hinten am Steg eine neue Ausgabe mit allem, was neu ist (auch mit 📰 oder N).',
      '📖 Erstfang-Animation: Ein neuer Fisch erscheint erst als Schatten, dann in Farbe – mit Stempel „Neu im Fischdex!“.',
    ] },
    { id: '2026-11-03-1', date: '03.11.2026', items: [
      '🔬 Neue Bestenliste: kleinster Fisch.',
      '😜 Neuer Fake-Fang: täuscht einen legendären Fang vor.',
      '🍤 Neuer Fisch: Fischstäbchen.',
      '📦 Mysteryboxen geben jetzt feste EP (15 / 40 / 100).',
      '🆕 Neue Versionen laden automatisch, sobald nichts an der Angel hängt.',
    ] },
  ];
  trAll(Object.values(RARITY), ['label']); trAll(FISH, ['name', 'say', 'desc', 'hint']);
  // Glutgrotte: how deep you must have dug for each cave fish (see CAVE_DEPTHS)
  const LAVA_DEPTH = { schlacke: 1, glutgrundel: 1, aschebarsch: 1, bimsfisch: 1, funkenforelle: 1, obsidianhecht: 2, schwefelkugel: 2, magmakarpfen: 3, salamanderfisch: 3, kristallwels: 3, lavadrache: 4, phoenixfisch: 5, russaal: 2, mitternachtsfunke: 3, kraterwaechter: 4 };
  for (const f of FISH) if (LAVA_DEPTH[f.id]) f.depth = LAVA_DEPTH[f.id]; trAll(RODS, ['name', 'desc']); trAll(BAITS, ['name', 'desc']);

  // ------------------------------------------------------------------ save
  const SAVE_KEY = 'fischen-save-v1';
  // Anti-cheat (no real protection is possible in the browser, this only makes it harder):
  // every save carries a checksum (sig). A save edited by hand no longer matches and is marked
  // as tampered: it keeps working, but can't join or update the leaderboard any more.
  const SIG_KEY = 'fischen-sig'; // remembers that this device already writes signed saves
  function cyrb53(str, seed = 0x5f15c) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const signSave = d => cyrb53('fisch.ing|' + JSON.stringify(d) + '|steg');
  let sigBroken = false; // set while loading when the checksum does not match
  // the test hooks (window.__fischen) only exist when the game runs locally; with ?debug elsewhere
  // they work too, but the save is then marked as tampered
  const DEV_HOST = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const DEBUG = DEV_HOST || new URLSearchParams(location.search).has('debug');
  const save = Object.assign({
    coins: 0, rod: 'stock', rods: ['stock'], bait: 'wurm', baits: { wurm: Infinity },
    dex: {}, total: 0, sound: true, seen: false,
    boxes: {}, dexClaimed: [], lvl: 1, xp: 0, daily: { d: '', n: 0 }, bestStreak: 0, rebirths: 0, scales: 0, perks: {}, prestige: 0, pearls: 0, pperks: {}, quests: [], questsDone: 0, lifeCoins: 0, totalEarned: 0,
  }, load());
  save.baits.wurm = Infinity;
  if (sigBroken || (DEBUG && !DEV_HOST)) save.tampered = true;
  if (sigBroken) setTimeout(() => toast(tr('⚠️ Dieser Spielstand wurde von Hand verändert. Du kannst weiterspielen, aber nicht mehr in die Bestenliste.')), 2500);
  save.prestige = save.prestige | 0; save.pearls = save.pearls | 0;
  // all rebirths ever (ranks and rebirth cosmetics count these, so a prestige doesn't take them away)
  if (typeof save.rebirthsTotal !== 'number') save.rebirthsTotal = (save.rebirths | 0) + save.prestige * 7;
  // "Erbe": 40 % of the rebirths before each prestige keep counting for the Taler bonus
  if (typeof save.rebHeir !== 'number') save.rebHeir = save.prestige * 7 * .4;
  if (!Array.isArray(save.glimmQ)) save.glimmQ = []; save.glimmDone = save.glimmDone | 0;
  if (!save.pperks || typeof save.pperks !== 'object') save.pperks = {};
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
      const sig = d.sig; delete d.sig;
      if (sig ? sig !== signSave(d) : (Object.keys(d).length && localStorage.getItem(SIG_KEY))) sigBroken = true;
      return d;
    } catch { return {}; }
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
      d.sig = signSave(d);
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      localStorage.setItem(SIG_KEY, '1');
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
    delete s.baits.wurm; delete s.sig;
    return s;
  }
  // Rutenschmiede: every forge level adds a little reel, luck, calm and cast to that rod
  const FORGE_MAX = 15; // +11 to +15 are the late-game Taler sink
  const forgeLvl = id => Math.max(0, Math.min(FORGE_MAX, (save.forge && save.forge[id]) | 0));
  const forgeCost = (r, k) => Math.round(Math.max(60, r.price) * .3 * Math.pow(k + 1, 1.6) / 10) * 10;
  const forgedCache = new Map();
  function forged(r, k = forgeLvl(r.id)) {
    if (!k) return r;
    if (!forgedCache.has(r.id + k)) forgedCache.set(r.id + k, { ...r, forge: k, name: r.name + ' +' + k,
      cast: Math.min(1, r.cast * (1 + .01 * k)), reel: r.reel * (1 + .03 * k), luck: r.luck * (1 + .03 * k), tens: r.tens * (1 - .02 * k) });
    return forgedCache.get(r.id + k);
  }
  // in the Glutgrotte you hold your Lavarute (save.lavaRod), everywhere else your normal rod
  const NO_LAVA_ROD = { ...RODS[0], id: 'nolava', name: tr('Keine Lavarute'), lava: true };
  const lavaRodOk = () => !!save.lavaRod && save.rods.includes(save.lavaRod);
  const rod = () => inLava()
    ? (lavaRodOk() ? forged(RODS.find(r => r.id === save.lavaRod)) : NO_LAVA_ROD)
    : forged(RODS.find(r => r.id === save.rod && !r.lava) || RODS[0]);
  const bait = () => BAITS.find(b => b.id === save.bait) || BAITS[0];

  // ------------------------------------------------------------------ dom
  const $ = id => document.getElementById(id);
  const cv = $('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = 384, H = 216; // world units; the canvas is 2x for finer pixel art
  const HORIZON = 92, SURFACE = 103, DOCK_Y = 98, DOCK_END = 116;

  // ------------------------------------------------------------------ audio
  let ac = null, master = null;
  const vol = () => Math.max(0, Math.min(1, save.vol === undefined ? 1 : +save.vol || 0));
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = vol(); master.connect(ac.destination); } catch { return null; } }
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
    o.connect(g).connect(master); o.start(); o.stop(a.currentTime + dur);
  }
  function noise(dur, vol = .25, freq = 900) {
    if (!save.sound) return;
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(master); s.start();
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
      voiceEnd = to; voice.volume = vol(); voice.currentTime = from; voice.play().catch(() => {});
    } catch { /* ignore */ }
  }
  function playFile(src) {
    if (!save.sound) return;
    try { const a = new Audio(src); a.volume = .8 * vol(); a.play().catch(() => {}); } catch { /* ignore */ }
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
  // The time of day comes from the real clock, so every player (and everyone in a lobby) has the
  // same in-game time: one in-game day every DAY_LENGTH seconds, counted from the Unix epoch.
  let timeShift = 0;      // only for tests (__fischen.setTime)
  const worldTime = () => ((Date.now() / 1000 / DAY_LENGTH + timeShift) % 1 + 1) % 1;
  let time = worldTime(); // 0..1, 0.25 = morning, 0.5 = noon, 0.75 = evening
  let t = 0;              // seconds running
  const isNight = () => time < .2 || time > .82;

  // Weather works like the clock: every WEATHER_LEN seconds a new weather, picked by a hash of the
  // slot number, so every player and every lobby has the same weather without asking a server.
  // A rainbow can only follow rain.
  const WEATHER_LEN = 300; // one in-game day per weather
  const WEATHER = [
    { id: 'sonne',    icon: '☀️', name: 'Sonnig',     w: 22, desc: 'Ganz normales Angelwetter.' },
    { id: 'regen',    icon: '🌧️', name: 'Regen',      w: 20, desc: 'Bisse kommen schneller.', bite: .8 },
    { id: 'nebel',    icon: '🌫️', name: 'Nebel',      w: 14, desc: 'Seltene und epische Fische trauen sich raus.', rare: 1.4 },
    { id: 'gewitter', icon: '⛈️', name: 'Gewitter',   w: 10, desc: 'Legendäre beißen öfter – aber die Schnur steht unter Spannung.', legend: 1.6, tens: 1.15 },
    { id: 'bogen',    icon: '🌈', name: 'Regenbogen', w: 0,  desc: 'Doppelte Chance auf Shinys und Mutationen.', shiny: 2 },
    { id: 'wind',     icon: '💨', name: 'Wind',       w: 12, desc: 'Der Wind trägt den Köder weiter raus – Fische von weit draußen beißen schon bei kurzen Würfen.', far: .2 },
    { id: 'schnee',   icon: '❄️', name: 'Schnee',     w: 8,  desc: 'Bisse kommen langsamer, aber die Fänge sind frisch gekühlt: +25 % Taler.', slow: 1.2, val: 1.25 },
    { id: 'hitze',    icon: '🔥', name: 'Hitzewelle', w: 8,  desc: 'Die Fische sind träge: weniger Spannung beim Drill, aber langsamere Bisse.', tens: .8, slow: 1.15 },
    { id: 'sterne',   icon: '🌠', name: 'Sternschnuppen', w: 6, desc: 'Sternschnuppen-Nacht: mehr Legendäre und mehr Shinys.', legend: 1.3, shiny: 1.5 },
  ];
  trAll(WEATHER, ['name', 'desc']);
  const WEATHER_HINT = { regen: 'Nur bei Regen', nebel: 'Nur bei Nebel', gewitter: 'Nur bei Gewitter', bogen: 'Nur beim Regenbogen' };
  let weatherShift = 0, weatherForce = null; // tests only (__fischen.setWeather)
  function slotHash(n, salt) {
    let h = Math.imul((n | 0) ^ salt, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function baseWeather(slot) {
    let r = slotHash(slot, 0x5eed) * 100;
    for (const w of WEATHER) { r -= w.w; if (r < 0) return w; }
    return WEATHER[0];
  }
  function weatherAt(slot) {
    const w = baseWeather(slot);
    if (w.id !== 'regen' && baseWeather(slot - 1).id === 'regen' && slotHash(slot, 0xb06e) < .45) return WEATHER.find(x => x.id === 'bogen');
    return w;
  }
  const weatherSlot = () => Math.floor(Date.now() / 1000 / WEATHER_LEN + weatherShift);
  // under the earth there is no weather: the cave has its own still "weather" without any bonus
  const CAVE_WX = { id: 'glut', icon: '🌋', get name() { return tr('Tiefe {n} · {t}', { n: caveDepth(), t: CAVE_DEPTHS[caveDepth() - 1].name }); }, get desc() { return tr('Unter der Erde gibt es kein Wetter, nur Hitze.') + ' ' + tr('Kreatur-Chance: {n} %', { n: critChance() }); } };
  function currentWeather() { if (inLava()) return CAVE_WX; return (weatherForce && WEATHER.find(w => w.id === weatherForce)) || weatherAt(weatherSlot()); }
  let wx = currentWeather();
  // the Wetterfrosch talent makes every weather bonus stronger
  const wBoost = x => (x ? 1 + (x - 1) * (1 + .1 * perk('wetter')) : 1);

  // Maps: the dock (Steg) and, from the 3rd rebirth, the open sea (Hohe See) on Bealin's boat
  const SEA_REB = 3;
  // the Seekarte prestige talent opens the sea without rebirths
  const seaOpen = () => save.rebirths >= SEA_REB || ((save.pperks || {}).pkarte | 0) > 0;
  // the Glutgrotte (lava cave) opens after the 1st prestige
  const LAVA_PRES = 1;
  const lavaOpen = () => (save.prestige | 0) >= LAVA_PRES;
  function inLava() { return save.map === 'lava'; }
  // Glutsteine 🔥: the currency of the cave. Every cave catch drops some; they dig deeper and buy Glimm's upgrades.
  const CAVE_DEPTHS = [
    { n: 1, name: 'Glutkammer', cost: 0 }, { n: 2, name: 'Aschehalle', cost: 60 }, { n: 3, name: 'Magmaschlund', cost: 250 },
    { n: 4, name: 'Drachenhort', cost: 800 }, { n: 5, name: 'Phönixnest', cost: 2000 },
  ];
  trAll(CAVE_DEPTHS, ['name']);
  function caveDepth() { return Math.max(1, Math.min(CAVE_DEPTHS.length, save.caveDepth | 0)); }
  const GLUT_DROP = { junk: .5, common: 1, uncommon: 2, rare: 5, wii: 5, epic: 12, legendary: 40 };
  const GLUT_UPS = [
    { id: 'netz',     icon: '🔥', name: 'Glutnetz',     max: 10, desc: l => tr('+{n} % Taler in der Glutgrotte', { n: l * 5 }) },
    { id: 'schild',   icon: '🛡️', name: 'Hitzeschild',  max: 5,  desc: l => tr('{n} % weniger Spannung in der Glutgrotte', { n: l * 5 }) },
    { id: 'licht',    icon: '✨', name: 'Funkenlicht',  max: 10, desc: l => tr('+{n} % Glück in der Glutgrotte', { n: l * 8 }) },
    { id: 'kristall', icon: '💎', name: 'Glutkristall', max: 10, desc: l => tr('+{n} % Glutsteine pro Fang', { n: l * 10 }) },
    { id: 'lockruf',  icon: '👹', name: 'Lockruf',      max: 5,  desc: l => tr('+{n} % Kreatur-Chance', { n: l }) },
  ];
  trAll(GLUT_UPS, ['name']);
  save.glut = save.glut | 0;
  // Spielzeit: seconds the game was open and visible (the frame loop pauses in hidden tabs), never reset
  save.playTime = Math.max(0, +save.playTime || 0);
  // One-time gifts, matched by the player's name (leaderboard or lobby, case-insensitive);
  // `gifts` remembers which ones already arrived. Checked at start and with every autosave.
  const NAME_GIFTS = [{ id: 'fae-20h', name: 'fae', playTime: 20 * 3600 }];
  if (!Array.isArray(save.gifts)) save.gifts = [];
  function nameGifts() {
    const names = [save.lb && save.lb.name, save.lobbyName, save.lobby && save.lobby.name]
      .filter(n => typeof n === 'string').map(n => n.trim().toLowerCase());
    for (const g of NAME_GIFTS) {
      if (save.gifts.includes(g.id) || !names.includes(g.name)) continue;
      save.gifts.push(g.id);
      save.playTime += g.playTime;
      setTimeout(() => toast(tr('🎁 Geschenk: +{n} Std Spielzeit!', { n: g.playTime / 3600 })), 2500);
    }
  }
  let sessionTime = 0;
  function fmtPlay(sec) {
    const m = Math.floor(sec / 60), h = Math.floor(m / 60);
    if (h < 1) return tr('{m} Min', { m });
    if (h < 100) return tr('{h} Std {m} Min', { h, m: m % 60 });
    return tr('{h} Std', { h: h.toLocaleString(I18N.locale) });
  }
  if (!save.glutUps || typeof save.glutUps !== 'object') save.glutUps = {};
  function glutUp(id) { return (save.glutUps[id] | 0); }
  const glutUpCost = l => (l + 1) * 20;
  // older saves that were already down there: Glutsteine for the cave fish caught so far, and the depth those fish live at (up to 3)
  if (save.caveDepth === undefined) {
    let g = 0, d = 1;
    for (const f of FISH) { const e = save.dex[f.id]; if (!f.depth || !e || !e.n) continue; g += e.n * GLUT_DROP[f.r]; d = Math.max(d, Math.min(3, f.depth)); }
    save.caveDepth = d; g = Math.min(300, Math.round(g)); save.glut += g;
    if (g) setTimeout(() => toast(tr('🔥 Neu: Glutsteine! Für deine Grotten-Fänge bisher gibt es {n} 🔥 – und du startest auf Tiefe {d}.', { n: g, d })), 3500);
  }
  if (!((save.map === 'see' && seaOpen()) || (save.map === 'lava' && lavaOpen()))) save.map = 'steg';
  const onSea = () => save.map === 'see';

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
    if (state === 'reel' || state === 'boss' || state === 'crit') return { x: px + d * 14, y: DOCK_Y - 22 + Math.sin(t * 30) * reel.tension * 1.5 };
    return { x: px + d * 15, y: DOCK_Y - 24 };
  }

  function castDistance() { return Math.max(0, Math.min(1, (bob.landX - DOCK_END) / (W - DOCK_END - 10))); }

  function startCharge() {
    if (inLava() && !lavaRodOk()) { hint(tr('🔥 Deine Rute würde in der Lava schmelzen! Im Laden gibt es Lavaruten.'), 2.5); return; }
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
    waitT = (2.5 + Math.random() * 6) / bait().speed * (1 - .08 * perk('biss')) * (wx.bite ? 1 / wBoost(1 / wx.bite) : 1) * (wx.slow || 1) * (Date.now() < energyUntil ? .6 : 1) * (buffOn('kaffee') ? .7 : 1);
    if (bait().boss && !bossReady()) hint(tr('Der Odköder wirkt nur nachts auf Hoher See.'), 2.4);
    else if (bait().boss) { waitT = 2.5; nibbles = 0; hint(tr('Das Wasser wird unruhig …'), 2.4); return; }
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
    // out on the open sea and on the lava lake every cast counts as far out
    const d = Math.min(1, ((onSea() || inLava()) ? Math.max(.7, castDistance()) : castDistance()) + (wx.far ? wx.far * (1 + .1 * perk('wetter')) : 0)), night = isNight(), b = bait(), r = rod(), map = save.map;
    const rawLuck = (b.lava && map !== 'lava' ? 1 : b.luck) * (map === 'lava' ? 1 + .08 * glutUp('licht') : 1) * r.luck * (1 + .08 * perk('glueck')) * (1 + .1 * pperk('pglueck')) * (dexPerk('luck10') ? 1.1 : 1);
    // diminishing returns: rod × bait × talents multiply up to 30+ late, which made legendaries an everyday catch;
    // the log keeps every upgrade noticeable while rare stays rare
    const luck = 1 + .45 * Math.log(Math.max(1, rawLuck));
    const fullHour = (time * 24) % 1 < 1 / 6; // the clock shows xx:00
    const hour = Math.floor(time * 24) % 24;
    const pool = FISH.filter(f => !(f.far && d < f.far) && !(f.bait && f.bait !== b.id) && !(f.hours && (hour < f.hours[0] || hour >= f.hours[1]))
      && !(f.crits && critsTotal() < f.crits) && !(f.minRod && (r.depth || 1) < f.minRod) && !(f.dayOff && !night) && !(f.fullHour && !fullHour)
      && !(f.needs && Object.entries(f.needs).some(([id, n]) => ((save.dex[id] || {}).n || 0) < n))
      && ((f.map || 'steg') === map || (f.sea && map === 'see')) && !(f.depth && f.depth > caveDepth()) && !f.boss && !(f.weather && f.weather !== wx.id));
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
      if (wx.rare && ['rare', 'wii', 'epic'].includes(f.r)) w *= wBoost(wx.rare);
      if (wx.legend && f.r === 'legendary') w *= wBoost(wx.legend);
      if (buffOn('keks') && ['rare', 'wii', 'epic', 'legendary'].includes(f.r)) w *= 1.3;
      if (f.weather) w *= 2; // the weather fish are the point of the weather: easier to find while it lasts
      return w;
    });
    let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { roll -= weights[i]; if (roll <= 0) return pool[i]; }
    return pool[0];
  }

  function hook() {
    const f = pickFish();
    // bait gets used up on a hook attempt
    if (save.bait !== 'wurm' && !bait().boss) {
      save.baits[save.bait] = (save.baits[save.bait] || 1) - 1;
      if (save.baits[save.bait] <= 0) {
        const b = bait(); delete save.baits[save.bait];
        // QoL: buy the same bait again (Taler, or Glutsteine for lava bait) when it runs out
        const cost = b.lava ? b.glut : b.price, have = b.lava ? save.glut : save.coins;
        if (save.autoBait && b.pack && cost && !lockText(b) && have >= cost) {
          if (b.lava) save.glut -= cost; else spend(cost);
          save.baits[b.id] = b.pack; updateCoins();
          toast(tr('🔁 {b} nachgekauft: +{n} für {c}', { b: b.name, n: b.pack, c: b.lava ? cost + ' 🔥' : tr('{n} Taler', { n: cost }) }));
        } else { save.bait = 'wurm'; toast(save.autoBait ? tr('Köder aufgebraucht und zu wenig zum Nachkaufen – zurück zum Wurm.') : tr('Köder aufgebraucht – zurück zum Wurm.')); }
      }
      persist(); updateGear();
    }
    if (inLava() && Math.random() * 100 < critChance()) return startCrit();
    hooked = { f, ...rollSize(f), str: STRENGTH[f.r] };
    Object.assign(reel, { tension: .15, progress: .22, thrash: 0, thrashT: 1 + Math.random(), slack: 0, maxT: 0 });
    if (f.r === 'legendary' && !f.fake && Math.random() < RHYTHM_CHANCE) { sfx.bite(); splash(bob.x, SURFACE, 14, '#ffffff'); startRhythm(); return; }
    state = 'reel'; $('reel').hidden = false; hint('');
    sfx.bite(); splash(bob.x, SURFACE, 14, '#ffffff');
  }

  // Size classes: every catch is Mini, Normal, Groß, Kapital or Monster. Kapital and Monster grow
  // beyond the usual maximum of the fish. The class multiplies the value; the Maßband talent helps.
  const SIZE_CLASSES = [
    { id: 'mini',    name: 'Mini',    icon: '🔹', c: '#7dd3fc', val: .7,  from: 0,    to: .15 },
    { id: 'normal',  name: 'Normal',  icon: '',   c: '#e2e8f0', val: 1,   from: .15,  to: .75 },
    { id: 'gross',   name: 'Groß',    icon: '🔸', c: '#fdba74', val: 1.4, from: .75,  to: 1 },
    { id: 'kapital', name: 'Kapital', icon: '🔶', c: '#fb923c', val: 2,   from: 1,    to: 1.15 },
    { id: 'monster', name: 'Monster', icon: '👑', c: '#f43f5e', val: 4,   from: 1.15, to: 1.35 },
  ];
  trAll(SIZE_CLASSES, ['name']);
  function sizeOdds() {
    const m = perk('mass');
    return [.12 * (1 - .12 * m), 0, .16 * (1 + .05 * m), .05 * (1 + .15 * m), .007 * (1 + .25 * m)];
  }
  function sizeIn(f, cls) {
    const c = SIZE_CLASSES[cls], u = (Math.random() + Math.random() + Math.random()) / 3; // a little bell curve
    const k = c.from + (c.to - c.from) * (cls === 1 ? u : Math.random());
    // up to the maximum the size runs from min to max, beyond it it grows from max on
    const size = k <= 1 ? f.min + (f.max - f.min) * k : f.max * k;
    return { size: Math.max(1, Math.round(size)), cls };
  }
  function rollSize(f) {
    const odds = sizeOdds();
    let r = Math.random(), cls = 1;
    for (const i of [4, 3, 2, 0]) { if (r < odds[i]) { cls = i; break; } r -= odds[i]; }
    return sizeIn(f, cls);
  }

  let energyUntil = 0; // set by the energy can fish
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
    const cls = hooked.cls === undefined ? 1 : hooked.cls, sc = SIZE_CLASSES[cls];
    const base = Math.max(0, Math.min(1, (hooked.size - f.min) / (f.max - f.min || 1)));
    const val = Math.max(1, Math.round(f.val * (.85 + .3 * base) * sc.val * coinMult() * caveMult() * nightMult() * (buffOn('broetchen') ? 1.25 : 1) * wBoost(wx.val) * (mut ? mut.val : 1) * (shiny ? SHINY_VAL : 1)));
    const first = !save.dex[f.id];
    const e = save.dex[f.id] || { n: 0, best: 0 };
    e.n++; e.best = Math.max(e.best, size); if (f.r !== 'junk') e.small = Math.min(e.small || Infinity, size); save.dex[f.id] = e;
    if (f.r !== 'junk') { e.cls = Math.max(e.cls || 0, cls); if (cls === 4) save.monsters = (save.monsters || 0) + 1; }
    checkMastery(f);
    let newMut = false;
    if (mut) { e.muts = e.muts || {}; newMut = !e.muts[mut.id]; e.muts[mut.id] = (e.muts[mut.id] || 0) + 1; }
    let newShiny = false;
    if (shiny) { e.shiny = (e.shiny || 0) + 1; newShiny = e.shiny === 1; }
    save.coins += val; save.total++; save.lifeCoins += val; save.totalEarned += val;
    // Fang-Verlauf: the last 20 catches for the progress board
    save.history.unshift({ id: f.id, s: size, v: val, c: cls, m: mut ? mut.id : '', sh: shiny ? 1 : 0, map: save.map || 'steg', t: Date.now() });
    if (save.history.length > HISTORY_MAX) save.history.length = HISTORY_MAX;
    const gain = progressCatch(f, size, val, first, mut, newMut, reel.maxT < .7, shiny, newShiny);
    if (inLava()) { // Glutsteine
      const g = Math.round((f.r === 'junk' ? (Math.random() < .5 ? 1 : 0) : GLUT_DROP[f.r] || 1) * (cls >= 3 ? 2 : 1) * (shiny ? 3 : 1) * (1 + .1 * glutUp('kristall')));
      if (g) { save.glut += g; gain.tags.push(`+${g} 🔥`); }
    }
    if (cls >= 3 && f.r !== 'junk') { gain.xp += gainXp(cls === 4 ? 120 : 30); }
    if (f.energy) { // the energy can: faster bites for a minute
      energyUntil = Date.now() + 60000;
      setTimeout(() => toast(tr('⚡ Energy! 60 Sekunden lang schnellere Bisse.')), 1800);
    }
    if (f.post && Math.random() < .35) { // a message in a bottle (or a lump of slag) sometimes holds a few Taler
      const extra = Math.round((f.post === 'slag' ? 180 + Math.random() * 720 : 40 + Math.random() * 260) * coinMult());
      save.coins += extra; save.lifeCoins += extra; save.totalEarned += extra;
      setTimeout(() => toast(f.post === 'slag' ? tr('🔥 Im Schlackebrocken waren {n} Taler eingeschmolzen!', { n: extra }) : tr('📜 In der Flasche steckten {n} Taler!', { n: extra })), 1800);
    }
    bealinEvent({ type: 'catch', f, size, mut, clean: reel.maxT < .7, night: darkness() > .5 });
    if (f.r !== 'junk') { // now and then a mystery box hangs on the line too
      const r = Math.random(), found = r < .002 ? BOXES[2] : r < .01 ? BOXES[1] : r < .035 ? BOXES[0] : null;
      if (found) { save.boxes[found.id] = (save.boxes[found.id] || 0) + 1; setTimeout(() => toast(tr('📦 Am Haken hing noch eine {b}! Öffnen im Laden.', { b: found.name })), 1600); }
    }
    setTimeout(() => lbSubmit(), 3000);
    lobbyCatch(f, size, val, shiny);
    if (f.r !== 'junk') { if (isNight()) cosmCount('night'); if (save.lobby) cosmCount('lobby'); if (wx.id === 'gewitter') cosmCount('sturm'); }
    checkCosm();
    if (dexClaimable().length) { updateDexBadge(); if (first || newMut || newShiny) toast(tr('📖 Fischdex-Belohnung bereit!')); }
    persist(); updateCoins();
    splash(bob.x, SURFACE, 22, '#ffffff');
    if (f.bigSplash) { splash(bob.x, SURFACE, 60, '#5eead4'); splash(bob.x, SURFACE, 40, '#ffffff'); }
    state = 'show'; $('reel').hidden = true; holding = false; hint('');
    const reveal = () => {
      showCatch(f, size, val, first, mut, newMut, gain, shiny, newShiny, cls);
      if (f.clip) playClip(f.clip); else if (f.sound) playFile(f.sound); else playFile('sounds/fish.mp3');
      sfx.coin();
      if (f.fake) { // the "legendary" catch was a fish in a joke disguise: sad trombone
        toast(tr('😜 REINGELEGT!'));
        [392, 370, 349, 294].forEach((n, i) => setTimeout(() => tone(n, i === 3 ? .7 : .28, 'sawtooth', .05), 150 + i * 300));
      }
    };
    const fx = (f.fake && FANFARE.legendary) || FANFARE[f.r]
      || (cls >= 3 && f.r !== 'junk' && { label: cls === 4 ? tr('MONSTER!') : tr('KAPITAL!'), c: sc.c, hi: '#ffffff', dur: cls === 4 ? 1.6 : 1.1, notes: cls === 4 ? [196, 262, 330, 392, 523] : [330, 440, 554] })
      || (mut && { label: `${mut.name.toUpperCase()}!`, c: mut.c, hi: '#ffffff', dur: 1.1, notes: [659, 880, 1175] })
      || (shiny && { label: tr('SHINY!'), c: '#fde047', hi: '#ffffff', dur: 1.2, notes: [1047, 1319, 1568, 2093] });
    if (shiny) {
      floaters.push({ x: bob.x, y: SURFACE - 34, text: newShiny ? tr('💫 Neuer Shiny!') : tr('💫 Shiny!'), c: '#fde047', life: 2.6 });
      for (let i = 0; i < 40; i++) glints.push({ x: bob.x + (Math.random() - .5) * 24, y: SURFACE - Math.random() * 10, vx: (Math.random() - .5) * 40, vy: -25 - Math.random() * 45, life: .8 + Math.random(), c: ['#fde047', '#ffffff', '#f9a8d4', '#a5f3fc'][i % 4] });
      [1568, 2093, 2637].forEach((n, i) => setTimeout(() => tone(n, .12, 'sine', .06), 600 + i * 90));
    }
    const clsTag = f.fake ? '👑 ' : sc.icon && f.r !== 'junk' ? sc.icon + ' ' : '';
    floaters.push({ x: bob.x, y: SURFACE - 14, text: `${mut ? mut.icon + ' ' : ''}${clsTag}${fx ? '' : f.name + ' · '}${f.fake ? 170 + Math.floor(Math.random() * 20) : size} cm`, c: mut ? mut.c : fx ? fx.c : '#ffffff', life: 2.4 });
    if (mut && FANFARE[f.r]) floaters.push({ x: bob.x, y: SURFACE - 24, text: `${mut.icon} ${mut.name}`, c: mut.c, life: 2.4 });
    floaters.push({ x: bob.x, y: SURFACE - 4, text: tr('+{n} EP', { n: gain.xp }) + (streak > 1 ? ` · 🔥${streak}` : ''), c: '#86efac', life: 2.4 });
    if (fx && !reduceMotion) {
      fanfare = { ...fx, r: f.fake ? 'legendary' : FANFARE[f.r] ? f.r : 'rare', x: bob.x, t: 0, done: reveal };
      fx.notes.forEach((n, i) => setTimeout(() => tone(n, .18, 'triangle', .09), i * 110));
      if (f.r === 'legendary') setTimeout(() => tone(1568, .6, 'sine', .07, 400), fx.notes.length * 110);
    } else reveal();
  }

  // ------------------------------------------------------------------ Taktdrill
  // Sometimes a legendary fish doesn't fight on the line but dances: circles pop up and have to be
  // hit in time when the shrinking ring reaches them (click/tap, or Space / Z / X). Enough
  // accuracy lands the fish, otherwise it gets away.
  const RHYTHM_CHANCE = .3, RHYTHM_N = 12, RHYTHM_GAP = 560, RHYTHM_APPROACH = 950, RHYTHM_PASS = .55;
  const rhythm = { notes: [], score: 0, combo: 0, judged: 0, end: 0, onDone: null };
  // opts (for the boss fight): n circles, own title, onDone(accuracy) instead of landing the fish
  function startRhythm(opts = {}) {
    state = 'rhythm'; hint(''); closeModals();
    const field = $('rhythm-field');
    field.querySelectorAll('.rnote, .rpop').forEach(n => n.remove());
    $('rhythm-title').textContent = opts.title || tr('🎵 Taktdrill! {f} tanzt an der Leine.', { f: hooked.f.name });
    Object.assign(rhythm, { notes: [], score: 0, combo: 0, judged: 0, end: 0, onDone: opts.onDone || null });
    const start = performance.now() + 900;
    let x = .5, y = .55;
    for (let i = 0; i < (opts.n || RHYTHM_N); i++) {
      // wander across the field so the circles form a little path
      x = Math.min(.86, Math.max(.14, x + (Math.random() - .5) * .55));
      y = Math.min(.84, Math.max(.24, y + (Math.random() - .5) * .45));
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'rnote'; el.hidden = true;
      el.style.left = x * 100 + '%'; el.style.top = y * 100 + '%';
      el.innerHTML = `<span class="ring"></span>${i + 1}`;
      const n = { el, x, y, at: start + RHYTHM_APPROACH + i * RHYTHM_GAP, done: false };
      field.append(el); rhythm.notes.push(n);
    }
    updateRhythmHud();
    $('rhythm').hidden = false;
    requestAnimationFrame(rhythmTick);
  }
  function updateRhythmHud() {
    $('rhythm-score').textContent = `${rhythm.score} · ${rhythm.combo}×`;
  }
  function judgeNote(n, now) {
    if (n.done || state !== 'rhythm') return;
    const d = Math.abs(now - n.at);
    if (now < n.at - 320) return; // far too early: ignore, like tapping before the beat
    const pts = d < 100 ? 300 : d < 200 ? 100 : d < 320 ? 50 : 0;
    n.done = true; n.el.remove(); rhythm.judged++;
    rhythm.score += pts; rhythm.combo = pts ? rhythm.combo + 1 : 0;
    const pop = document.createElement('div');
    pop.className = 'rpop ' + (pts ? 'p' + pts : 'miss'); pop.textContent = pts || '✗';
    pop.style.left = n.x * 100 + '%'; pop.style.top = n.y * 100 + '%';
    $('rhythm-field').append(pop); setTimeout(() => pop.remove(), 700);
    if (pts) tone([523, 587, 659, 698, 784, 880, 988, 1047][rhythm.judged % 8], .09, 'triangle', .07); else sfx.snap();
    updateRhythmHud();
    if (rhythm.judged === rhythm.notes.length) rhythm.end = now + 450;
  }
  function rhythmHit() { // Space: hits the next circle in line (no aiming, for keyboard-only play)
    const n = rhythm.notes.find(n => !n.done);
    if (n) judgeNote(n, performance.now());
  }
  // osu!-style: aim with the mouse (or finger) and hit with a mouse button or Z/X anywhere –
  // it only counts while the cursor is on the next circle in line
  const rcursor = { x: -1, y: -1 };
  function overNext() {
    const n = rhythm.notes.find(n => !n.done); if (!n || n.el.hidden) return null;
    const r = n.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return Math.hypot(rcursor.x - cx, rcursor.y - cy) <= r.width * .62 ? n : null;
  }
  function rhythmAimHit() {
    if (state !== 'rhythm') return;
    const n = overNext();
    if (n) judgeNote(n, performance.now());
    else { const c = $('rhythm-cursor'); c.classList.remove('nope'); void c.offsetWidth; c.classList.add('nope'); } // missed the circle: the cursor shakes, nothing is judged
  }
  {
    const field = $('rhythm-field'), cur = $('rhythm-cursor');
    const move = e => { rcursor.x = e.clientX; rcursor.y = e.clientY; const r = field.getBoundingClientRect(); cur.style.left = (e.clientX - r.left) + 'px'; cur.style.top = (e.clientY - r.top) + 'px'; cur.hidden = e.pointerType !== 'mouse'; cur.classList.toggle('on', !!overNext()); };
    field.addEventListener('pointermove', move);
    // mouse: mousedown fires for every button, also while another one is still held (left/right alternating like in osu!);
    // pointerdown would only report the first pressed button. Fingers and pens still go through pointerdown.
    field.addEventListener('mousedown', e => { e.preventDefault(); move(Object.assign({ pointerType: 'mouse' }, { clientX: e.clientX, clientY: e.clientY })); rhythmAimHit(); });
    field.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; e.preventDefault(); move(e); rhythmAimHit(); });
    field.addEventListener('contextmenu', e => e.preventDefault());
  }
  function rhythmTick(now) {
    if (state !== 'rhythm') return;
    for (const n of rhythm.notes) {
      if (n.done) continue;
      if (now >= n.at - RHYTHM_APPROACH) n.el.hidden = false;
      n.el.style.setProperty('--s', 1 + 2 * Math.max(0, (n.at - now) / RHYTHM_APPROACH));
      if (now > n.at + 320) judgeNote(n, now);
    }
    if (rhythm.end && now >= rhythm.end) return finishRhythm();
    requestAnimationFrame(rhythmTick);
  }
  function finishRhythm() {
    const acc = rhythm.score / (rhythm.notes.length * 300);
    $('rhythm').hidden = true;
    if (rhythm.onDone) { const cb = rhythm.onDone; rhythm.onDone = null; return cb(acc); }
    const f = hooked.f;
    if (acc >= RHYTHM_PASS) {
      reel.maxT = acc >= .9 ? 0 : .8; // nearly perfect counts as a clean catch
      toast(tr('🎵 Im Takt gefangen! Genauigkeit {n} %', { n: Math.round(acc * 100) }));
      cosmCount('takt');
      land_catch();
    } else {
      retract(tr('Aus dem Takt! {f} ist weg. ({n} %)', { f: f.name, n: Math.round(acc * 100) }) + lostXp(f));
      bealinEvent({ type: 'lost' });
    }
  }

  // ------------------------------------------------------------------ boss fight: the Odfisch
  // The Odköder, cast at night out on the open sea, calls the Odfisch. It has a big health bar:
  // reeling inside the safe tension does damage, phase 2 throws in Taktdrill salvos, phase 3 is a
  // rage with harsh tension spikes. A snapped line stuns for 3 s. After 3 minutes it dives away.
  // In a lobby everyone on the sea fights the same Odfisch (shared HP on the server, api/lobby.js).
  const BOSS_HP = 1000, BOSS_TIME = 180000, BOSS_RHYTHM_EVERY = 9, BOSS_SCALES = 10;
  const ODBOSS = FISH.find(f => f.id === 'odboss');
  const bossImg = new Image(); bossImg.src = ODBOSS.img;
  const boss = { on: false, id: '', max: 1, hp: 1, ends: 0, mine: 0, pend: 0, stun: 0, solo: true, n: 1, rhythmT: 0, shoutT: 0, won: false, x: W - 80, rise: 0, quake: 0, invite: null, synced: 0 };
  const HISTORY_MAX = 20;
  if (!Array.isArray(save.history)) save.history = [];
  save.history = save.history.filter(h => h && typeof h === 'object' && FISH.some(f => f.id === h.id)).slice(0, HISTORY_MAX);
  if (!Array.isArray(save.bossDone)) save.bossDone = [];
  // cutscenes for the Odfisch: intro, phase changes, victory and escape. While one runs the fight pauses
  // (solo: the clock is extended by its length), the canvas gets cinema bars and a title card.
  const cine = { on: false, kind: '', t: 0, dur: 0, title: '', sub: '', c: '#fbbf24', then: null };
  const bossFx = { flash: 0, jump: 0, hitT: 0, lastPh: 1, sink: 0 };
  function startCine(kind, dur, title, sub, c, then) {
    if (reduceMotion) dur = Math.min(dur, 1.6);
    Object.assign(cine, { on: true, kind, t: 0, dur, title, sub, c: c || '#fbbf24', then: then || null });
    holding = false;
    if (boss.on && boss.solo) boss.ends += dur * 1000;
  }
  function updateCine(dt) {
    if (!cine.on) return;
    cine.t += dt;
    if (cine.kind === 'intro' && cine.t > .4 && cine.t - dt <= .4) { splash(boss.x, SURFACE, 50, '#ffffff'); ripple(boss.x, 3); ripple(boss.x - 20, 3); ripple(boss.x + 20, 3); }
    if (cine.kind === 'intro' && cine.t > 1.3 && cine.t - dt <= 1.3) { boss.quake = 1.4; bossFx.flash = 1; [62, 58, 55].forEach((n, i) => setTimeout(() => tone(n, .7, 'sawtooth', .09), i * 160)); }
    if (cine.kind === 'win' && Math.random() < dt * 18) particles.push({ x: boss.x + (Math.random() - .5) * 60, y: SURFACE - 20 - Math.random() * 40, vx: (Math.random() - .5) * 50, vy: -30 - Math.random() * 40, life: 1, c: ['#fde047', '#f472b6', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 4)] });
    if (cine.t >= cine.dur) { cine.on = false; const f = cine.then; cine.then = null; if (f) f(); }
  }
  function drawCine() {
    if (!cine.on) return;
    const k = Math.min(1, cine.t / .35, (cine.dur - cine.t) / .35), bar = 22 * Math.max(0, k);
    px(0, 0, W, bar, '#000'); px(0, H - bar, W, bar, '#000');                   // cinema bars
    if (cine.kind === 'intro') { ctx.globalAlpha = .35 * Math.max(0, k); px(0, bar, W, H - 2 * bar, '#020617'); ctx.globalAlpha = 1; }
    const tk = Math.min(1, Math.max(0, (cine.t - .25) / .3)) * Math.max(0, Math.min(1, (cine.dur - cine.t) / .3));
    if (tk > 0 && cine.title) {
      ctx.globalAlpha = tk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sc = 1 + (1 - tk) * .4;
      setFont(`700 ${Math.round(18 * sc)}px Silkscreen, monospace`);
      ctx.fillStyle = '#000'; ctx.fillText(cine.title, W / 2 + 1.5, 52 + 1.5); ctx.fillStyle = cine.c; ctx.fillText(cine.title, W / 2, 52);
      if (cine.sub) { setFont('700 7px Poppins, sans-serif'); ctx.fillStyle = '#000'; ctx.fillText(cine.sub, W / 2 + .75, 68 + .75); ctx.fillStyle = '#f8fafc'; ctx.fillText(cine.sub, W / 2, 68); }
      ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    if (bossFx.flash > 0 && !reduceMotion) { ctx.globalAlpha = Math.min(.6, bossFx.flash * .6); px(0, 0, W, H, cine.kind === 'phase3' ? '#ef4444' : '#ffffff'); ctx.globalAlpha = 1; }
  }
  const bossReady = () => onSea() && isNight();
  const bossPhase = () => (boss.hp / boss.max > 2 / 3 ? 1 : boss.hp / boss.max > 1 / 3 ? 2 : 3);
  const BOSS_PHASES = ['', tr('Phase 1/3 · Kurbeln!'), tr('Phase 2/3 · Taktdrill!'), tr('Phase 3/3 · Wut!')];
  async function summonBoss() {
    state = 'summon'; hint(tr('Da kommt was Großes …'), 2.5);
    approacher = null; boss.rise = 0; boss.quake = 1;
    sfx.bite(); splash(bob.x, SURFACE, 30, '#ffffff'); ripple(bob.x, 2); ripple(bob.x - 8, 2);
    [98, 92, 87, 82].forEach((n, i) => setTimeout(() => tone(n, .5, 'sawtooth', .07), i * 260));
    let b = null, fresh = true;
    if (save.lobby) {
      try { const j = await lobbyFetch({ action: 'boss', code: save.lobby.code, id: save.lobby.id, me: lobbyMe() }); b = j.boss; fresh = !!j.fresh; }
      catch (e) { state = 'idle'; boss.rise = 0; hint(''); toast(e.message); return; }
      b.ends = Date.now() + (b.ends - b.now); // server clock → our clock
    } else b = { id: 'solo-' + hex(6), max: BOSS_HP, hp: BOSS_HP, ends: Date.now() + BOSS_TIME, mine: 0, n: 1 };
    if (state !== 'summon') return;
    if (b.hp <= 0 || b.ends < Date.now() + 3000) { state = 'idle'; boss.rise = 0; toast(tr('🌊 Der Odfisch erholt sich gerade noch. Versuch es gleich nochmal.')); return; }
    if (fresh) { // only whoever calls him uses up the bait; joining an ongoing fight is free
      save.baits.odkoeder = (save.baits.odkoeder || 1) - 1;
      if (save.baits.odkoeder <= 0) { delete save.baits.odkoeder; save.bait = 'wurm'; }
      persist(); updateGear();
    }
    enterBoss(b, !save.lobby);
  }
  function enterBoss(b, solo) {
    Object.assign(boss, { on: true, id: b.id, max: b.max, hp: b.hp, ends: b.ends, mine: b.mine || 0, pend: 0, stun: 0, solo, n: b.n || 1, rhythmT: 6, shoutT: 2, won: false, invite: null, quake: 1 });
    $('btn-boss').hidden = true;
    closeModals(); state = 'boss'; holding = false;
    hooked = { f: ODBOSS, size: ODBOSS.max, cls: 3, str: 1.6 };
    Object.assign(reel, { tension: .1, progress: 0, thrash: 0, thrashT: 2.5, slack: 0, maxT: 0 });
    bob.landX = boss.x - 26; bob.x = bob.landX;
    $('reel').hidden = true; $('reel').classList.add('boss'); $('boss-hud').hidden = true;
    hint(''); bossFx.lastPh = bossPhase(); bossFx.sink = 0;
    startCine('intro', 3.4, tr('DER ODFISCH'), tr('Herrscher der Hohen See · halb Fisch, halb Katze, ganz Boss'), '#e2e8f0', () => {
      if (!boss.on) return;
      $('reel').hidden = false; $('boss-hud').hidden = false;
      toast(solo ? tr('⚔️ Der Odfisch! Du hast 3 Minuten.') : tr('⚔️ Der Odfisch! Kämpft zusammen – ihr habt 3 Minuten.'));
      updateBossHud();
    });
  }
  function bossHit(d) {
    if (!boss.on || boss.won || d <= 0) return;
    d *= 1 + .1 * perk('boss'); // Bossjäger talent
    boss.mine += d; boss.hp = Math.max(0, boss.hp - d);
    if (!boss.solo) boss.pend += d;
    else if (boss.hp <= 0) bossWin();
  }
  function updateBoss(dt) {
    if (cine.on) return; // the fight waits for the cutscene
    const ph = bossPhase(), r = rod();
    if (ph > bossFx.lastPh) { // phase change: short cutscene, a leap out of the water, a roar
      bossFx.lastPh = ph; bossFx.jump = 1; bossFx.flash = 1; boss.quake = 1.3;
      splash(boss.x, SURFACE, 40, '#ffffff'); ripple(boss.x, 3);
      tone(ph === 3 ? 140 : 220, .6, 'sawtooth', .08, ph === 3 ? -60 : 120);
      setTimeout(() => tone(520, .35, 'triangle', .07, 260), 220); setTimeout(() => tone(700, .4, 'triangle', .06, -380), 420);
      $('reel').hidden = true; $('boss-hud').hidden = true;
      startCine(ph === 3 ? 'phase3' : 'phase2', 2.2, ph === 3 ? tr('PHASE 3 · WUT!') : tr('PHASE 2 · ER TANZT!'),
        ph === 3 ? tr('Die Augen glühen rot – jetzt zieht er richtig.') : tr('Triff den Takt, wenn er tanzt.'), ph === 3 ? '#f87171' : '#c084fc',
        () => { if (boss.on) { $('reel').hidden = false; $('boss-hud').hidden = false; bossHudKey = ''; updateBossHud(); } });
      return;
    }
    if (ph === 3) {
      boss.shoutT -= dt;
      if (boss.shoutT <= 0) {
        boss.shoutT = 2.5 + Math.random() * 3; boss.quake = .7;
        floaters.push({ x: boss.x, y: SURFACE - 46, text: tr('FIH!'), c: '#f8fafc', life: 1.6 });
        tone(520, .35, 'triangle', .07, 260); setTimeout(() => tone(700, .4, 'triangle', .06, -380), 180); // miau
      }
    }
    if (ph === 2 && boss.stun <= 0) {
      boss.rhythmT -= dt;
      if (boss.rhythmT <= 0) {
        boss.rhythmT = BOSS_RHYTHM_EVERY; holding = false;
        $('reel').hidden = true;
        startRhythm({ n: 6, title: tr('🎵 Der Odfisch tanzt! Triff den Takt für Extraschaden.'), onDone: acc => {
          if (!boss.on) return;
          const d = Math.round(acc * 160);
          bossHit(d); floaters.push({ x: boss.x, y: SURFACE - 36, text: tr('🎵 −{n} HP', { n: d }), c: '#c084fc', life: 2 });
          if (boss.on) { state = 'boss'; $('reel').hidden = false; }
        } });
        return;
      }
    }
    if (boss.stun > 0) {
      boss.stun -= dt; reel.tension = Math.max(0, reel.tension - dt); reel.thrash = 0;
      return showBossReel();
    }
    // calm phases and thrash bursts like a normal fish, only angrier in phase 3
    reel.thrashT -= dt;
    if (reel.thrashT <= 0) {
      if (reel.thrash) { reel.thrash = 0; reel.thrashT = (ph === 3 ? .7 : 1.3) + Math.random() * 1.4; }
      else { reel.thrash = 1; reel.thrashT = .5 + Math.random() * .8; sfx.bite(); splash(boss.x, SURFACE, 10, '#ffffff'); }
    }
    const pull = (ph === 3 ? 2.1 : 1.5) * (reel.thrash ? 1.6 : .4);
    if (holding) {
      reel.tension += (.3 + pull * .55) * r.tens * (1 - .06 * perk('schnur')) * (wx.tens || 1) * (inLava() ? 1 - .05 * glutUp('schild') : 1) * dt;
      bossHit((reel.thrash ? 3 : 12 + 8 * r.reel) * dt);
      if (Math.random() < dt * 14) sfx.tick();
      bossFx.hitT += dt;
      if (bossFx.hitT > .45) { // a damage number and a little flash every half second while reeling
        bossFx.hitT = 0; bossFx.flash = Math.max(bossFx.flash, .25);
        const d = Math.round((reel.thrash ? 3 : 12 + 8 * r.reel) * .45);
        floaters.push({ x: boss.x - 10 + Math.random() * 20, y: SURFACE - 40 - Math.random() * 8, text: '−' + d, c: reel.thrash ? '#94a3b8' : '#fde047', life: .9 });
        if (!reel.thrash) splash(boss.x - 18, SURFACE - 2, 3, '#fde68a');
      }
    } else reel.tension -= (.8 - pull * .15) * dt;
    reel.tension = Math.max(0, reel.tension);
    if (reel.thrash && Math.random() < dt * 12) splash(boss.x + (Math.random() - .5) * 30, SURFACE, 3, '#ffffff');
    if (reel.tension >= 1) {
      sfx.snap(); boss.stun = 3; reel.tension = 0; reel.thrash = 0;
      floaters.push({ x: player.x + 20, y: DOCK_Y - 34, text: tr('Schnur gerissen! Neu einfädeln …'), c: '#fca5a5', life: 2.4 });
    }
    showBossReel();
  }
  function showBossReel() {
    $('tension').style.width = Math.min(100, reel.tension * 100) + '%';
    $('reel').classList.toggle('thrash', !!reel.thrash);
    updateBossHud();
  }
  let bossHudKey = '';
  function updateBossHud() {
    const left = Math.max(0, Math.ceil((boss.ends - Date.now()) / 1000));
    const key = [Math.ceil(boss.hp), left, Math.round(boss.mine), boss.n, boss.stun > 0].join('|');
    if (key === bossHudKey) return; bossHudKey = key;
    $('boss-hp').style.width = Math.max(0, boss.hp / boss.max * 100) + '%';
    $('boss-hp-num').textContent = `${Math.ceil(boss.hp)} / ${boss.max}`;
    $('boss-phase').textContent = boss.stun > 0 ? tr('Betäubt …') : BOSS_PHASES[bossPhase()];
    $('boss-time').textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    $('boss-info').textContent = boss.solo ? tr('Dein Schaden: {n}', { n: Math.round(boss.mine) })
      : tr('Dein Schaden: {n} · {p} Angler kämpfen', { n: Math.round(boss.mine), p: boss.n });
  }
  // lobby sync: send our damage, take the shared HP
  function bossFromServer(b) {
    if (boss.on && !boss.solo) {
      if (!b || b.id !== boss.id) return bossEnd(tr('🌊 Der Odfisch ist abgetaucht …'));
      boss.hp = Math.max(0, b.hp - boss.pend); boss.n = b.n; boss.max = b.max;
      boss.ends = Date.now() + (b.ends - b.now);
      if (b.hp <= 0) bossWin();
      return;
    }
    if (boss.on) return;
    const live = b && b.hp > 0 && b.ends - b.now > 8000 && !save.bossDone.includes(b.id);
    boss.invite = live && onSea() ? { ...b, ends: Date.now() + (b.ends - b.now) } : null;
    $('btn-boss').hidden = !boss.invite;
    if (live && LOBBY.bossSeen !== b.id) {
      LOBBY.bossSeen = b.id;
      toast(onSea() ? tr('⚔️ Der Odfisch ist aufgetaucht! Klick auf „Mitmachen“.')
        : seaOpen() ? tr('⚔️ Deine Lobby kämpft gegen den Odfisch! Fahr raus auf die Hohe See (Boje am Steg).')
          : tr('⚔️ Deine Lobby kämpft gegen den Odfisch auf Hoher See (ab 3× Wiedergeburt).'));
    }
  }
  $('btn-boss').addEventListener('click', () => {
    if (!boss.invite) return;
    if (state !== 'idle') { toast(tr('Hol erst deine Angel ein.')); return; }
    enterBoss(boss.invite, false);
  });
  $('boss-quit').addEventListener('click', () => { if (crit.on) { if (confirm(tr('Den Kampf aufgeben?'))) critEnd(tr('🏳️ Du hast den Kampf aufgegeben.')); return; } if (boss.on && confirm(tr('Den Kampf aufgeben?'))) bossEnd(tr('🏳️ Du hast den Kampf aufgegeben.')); });
  function bossLeave() {
    boss.on = false; boss.invite = null; holding = false;
    $('boss-hud').hidden = true; $('rhythm').hidden = true; $('reel').hidden = true; $('reel').classList.remove('boss');
    rhythm.onDone = null;
  }
  function bossEnd(msg) {
    if (!boss.on) return;
    bossLeave(); state = 'idle'; hooked = null; bossFx.sink = .01;
    startCine('escape', 2.2, tr('ABGETAUCHT'), msg || tr('🌊 Der Odfisch ist abgetaucht … Nächstes Mal!'), '#7dd3fc');
    splash(boss.x, SURFACE, 30, '#ffffff'); ripple(boss.x, 3);
    tone(220, .5, 'triangle', .06, -120); setTimeout(() => tone(150, .7, 'triangle', .05, -60), 300);
  }
  function bossWin() {
    if (boss.won || !boss.on) return;
    boss.won = true;
    const id = boss.id, mine = boss.mine, share = boss.solo ? 1 : Math.min(1, mine / boss.max);
    bossLeave(); boss.quake = 1.2;
    if (mine <= 0 || save.bossDone.includes(id)) { state = 'idle'; toast(tr('⚔️ Der Odfisch wurde besiegt!')); return; }
    save.bossDone = [...save.bossDone.slice(-19), id];
    save.bossWins = (save.bossWins || 0) + 1;
    const bonus = Math.round((800 + 2200 * share) * coinMult());
    save.scales += BOSS_SCALES; save.coins += bonus; save.lifeCoins += bonus; save.totalEarned += bonus;
    setTimeout(() => toast(tr('⚔️ Odfisch besiegt! +{s} 🐚 · +{n} Taler Beute', { s: BOSS_SCALES, n: bonus })), 400);
    // victory cutscene: he rears up one last time, fireworks, then the Odfisch himself comes on board – at least Kapital size
    state = 'summon'; bossFx.jump = 1.4; bossFx.flash = 1; boss.rise = 1;
    splash(boss.x, SURFACE, 60, '#ffffff'); splash(boss.x, SURFACE, 40, '#fde047');
    [523, 659, 784, 1047, 1319].forEach((n, i) => setTimeout(() => tone(n, .3, 'square', .06), i * 140));
    startCine('win', 3, tr('BESIEGT!'), tr('Der Odfisch gibt auf – Fih …'), '#fde047', () => {
      hooked = { f: ODBOSS, ...sizeIn(ODBOSS, Math.random() < .25 ? 4 : 3), str: 1.6 };
      reel.maxT = 0; bob.x = boss.x - 20; state = 'reel';
      land_catch();
    });
  }

  // ------------------------------------------------------------------ lava creatures
  // In the Glutgrotte a bite is sometimes not a fish but a creature (critChance()). A short solo fight like the
  // Odfisch: hold to hurt it, let go while it thrashes, don't snap the line, and beat it before the time runs out.
  const CREATURES = [
    { id: 'glutschnecke', name: 'Glutschnecke', img: 'img/kreatur-glutschnecke.png', depth: 1, w: 10, hp: 60,  time: 25, str: .9,  glut: 4,   coins: 120,  say: 'Schleiiim … heiß!', desc: 'Kriecht langsam aus der Lava. Ihr Haus glüht wie eine Herdplatte.' },
    { id: 'aschekrabbe',  name: 'Aschekrabbe',  img: 'img/kreatur-aschekrabbe.png',  depth: 1, w: 7,  hp: 90,  time: 25, str: 1.05, glut: 7,  coins: 240,  say: 'Zwick! Zwick!', desc: 'Grau wie Asche, mit glühenden Scheren. Seitwärts schneller als du denkst.' },
    { id: 'schlackwurm',  name: 'Schlackwurm',  img: 'img/kreatur-schlackwurm.png',  depth: 2, w: 6,  hp: 150, time: 30, str: 1.2, glut: 12,  coins: 480,  say: 'Grrrmpf.', desc: 'Ein Wurm aus Schlacke, der sich aus der Glut reckt und nach allem schnappt.' },
    { id: 'flammenqualle', name: 'Flammenqualle', img: 'img/kreatur-flammenqualle.png', depth: 3, w: 4, hp: 230, time: 30, str: 1.35, glut: 20, coins: 950, say: 'Blubb … fauch!', desc: 'Schwebt über der Lava. Ihre Tentakel brennen wie Wunderkerzen.' },
    { id: 'basaltgolem',  name: 'Basaltgolem',  img: 'img/kreatur-basaltgolem.png',  depth: 4, w: 2.5, hp: 380, time: 35, str: 1.55, glut: 40, coins: 2000, say: 'WER. STÖRT.', desc: 'Ein Brocken aus Basalt mit glühenden Rissen. Langsam, aber zäh.' },
    { id: 'glutkraken',   name: 'Glutkraken',   img: 'img/kreatur-glutkraken.png',   depth: 5, w: 1,  hp: 650, time: 40, str: 1.75, glut: 100, coins: 5000, say: 'Acht Arme. Alle heiß.', desc: 'Der Schrecken des Phönixnests. Selten, riesig und mit acht glühenden Armen.' },
  ];
  trAll(CREATURES, ['name', 'say', 'desc']);
  if (!save.crit || typeof save.crit !== 'object' || Array.isArray(save.crit)) save.crit = {};
  const critsTotal = () => Object.values(save.crit).reduce((a, n) => a + (n | 0), 0);
  const CRIT_BASE = 5, CRIT_MAX = 30, CRIT_HEART = .08;
  // Kreatur-Chance in %: base + lava rod + lava bait + Glimm's Lockruf
  function critChance() {
    const b = bait();
    return Math.min(CRIT_MAX, CRIT_BASE + (rod().kc || 0) + (b.lava ? b.kc || 0 : 0) + glutUp('lockruf'));
  }
  const critImg = {};
  for (const c of CREATURES) { critImg[c.id] = new Image(); critImg[c.id].src = c.img; }
  const crit = { on: false, c: null, hp: 0, max: 0, ends: 0, x: 0, rise: 0, flash: 0, hitT: 0, out: 0, won: false, ly: SURFACE };
  const BOSS_NAME = $('boss-name').textContent;
  function startCrit() {
    const pool = CREATURES.filter(c => c.depth <= caveDepth());
    let roll = Math.random() * pool.reduce((a, c) => a + c.w, 0), c = pool[0];
    for (const x of pool) { roll -= x.w; if (roll <= 0) { c = x; break; } }
    if (approacher) { approacher.vx = 35 + Math.random() * 15; approacher = null; }
    Object.assign(crit, { on: true, c, hp: c.hp, max: c.hp, ends: Date.now() + c.time * 1000, rise: 0, flash: 0, hitT: 0, out: 0, won: false,
      x: Math.max(player.x + 70, Math.min(W - 40, bob.x + 10)) });
    state = 'crit'; holding = false; hooked = null;
    Object.assign(reel, { tension: .1, progress: 0, thrash: 0, thrashT: 1.6, slack: 0, maxT: 0 });
    $('reel').hidden = false; $('reel').classList.add('boss');
    $('boss-hud').classList.add('crit'); $('boss-hud').hidden = false; $('boss-name').textContent = '👹 ' + c.name.toLocaleUpperCase(I18N.locale);
    bossHudKey = '';
    sfx.bite(); splash(crit.x, SURFACE, 26, '#ffffff'); ripple(crit.x, 2);
    [180, 150, 120].forEach((n, i) => setTimeout(() => tone(n, .25, 'sawtooth', .06), i * 140));
    hint(tr('👹 Eine Lava-Kreatur! Halten = Schaden, loslassen, wenn sie tobt.'), 3);
    floaters.push({ x: crit.x, y: SURFACE - 34, text: c.say, c: '#fdba74', life: 2.2 });
    if (!save.crit[c.id]) toast(tr('👹 Neue Kreatur: {c}!', { c: c.name }));
    updateCritHud();
  }
  function critLeave() {
    holding = false;
    $('boss-hud').hidden = true; $('boss-hud').classList.remove('crit'); $('boss-name').textContent = BOSS_NAME;
    $('reel').hidden = true; $('reel').classList.remove('boss'); $('reel').classList.remove('thrash');
  }
  function critEnd(msg) {
    if (!crit.on || crit.out) return;
    critLeave(); crit.won = false; crit.out = 1.2;
    splash(crit.x, SURFACE, 20, '#ffffff'); ripple(crit.x, 2);
    hint(msg, 2.4); tone(220, .4, 'triangle', .06, -120);
  }
  function critWin() {
    const c = crit.c;
    critLeave(); crit.won = true; crit.out = 1.6;
    const n = save.crit[c.id] = (save.crit[c.id] | 0) + 1;
    const g = Math.round(c.glut * (1 + .1 * glutUp('kristall'))), heart = Math.random() < CRIT_HEART ? g * 3 : 0;
    const coins = Math.round(c.coins * coinMult() * caveMult());
    save.glut += g + heart; save.coins += coins; save.lifeCoins += coins; save.totalEarned += coins;
    gainXp(20 + 15 * c.depth);
    splash(crit.x, SURFACE, 40, '#fde047'); ripple(crit.x, 3);
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .2, 'square', .05), i * 110));
    floaters.push({ x: crit.x, y: SURFACE - 40, text: tr('Besiegt!'), c: '#fde047', life: 1.8 });
    floaters.push({ x: crit.x, y: SURFACE - 30, text: `+${g + heart} 🔥 · +${coins.toLocaleString(I18N.locale)}`, c: '#fdba74', life: 2.2 });
    toast(tr('👹 {c} besiegt! +{g} 🔥 · +{n} Taler', { c: c.name, g: g + heart, n: coins.toLocaleString(I18N.locale) }) + (n === 1 ? tr(' · neu im Fischdex') : ''));
    if (heart) setTimeout(() => toast(tr('💗 Seltener Fund: ein Glutherz! +{n} 🔥 extra', { n: heart })), 1600);
    if (critsTotal() === 25) setTimeout(() => toast(tr('🗿 25 Kreaturen besiegt … tief unten regt sich der Kraterwächter.')), 3200);
    persist(); updateCoins();
  }
  function updateCrit(dt) {
    const c = crit.c, r = rod();
    crit.rise = Math.min(1, crit.rise + dt * 1.6); crit.flash = Math.max(0, crit.flash - dt * 3);
    if (crit.out) { // sinking back (escaped or beaten), then the line is free again
      crit.out = Math.max(0, crit.out - dt);
      if (!crit.out) { crit.on = false; state = 'idle'; hooked = null; }
      return;
    }
    if (Date.now() >= crit.ends) return critEnd(tr('⏱ Zu langsam – {c} taucht ab.', { c: c.name }));
    reel.thrashT -= dt;
    if (reel.thrashT <= 0) {
      if (reel.thrash) { reel.thrash = 0; reel.thrashT = (1.5 + Math.random() * 1.6) / c.str; }
      else { reel.thrash = 1; reel.thrashT = .5 + Math.random() * .6 * c.str; sfx.bite(); splash(crit.x, SURFACE, 8, '#ffffff'); }
    }
    const pull = c.str * (reel.thrash ? 1.7 : .4);
    if (holding) {
      reel.tension += (.3 + pull * .55) * r.tens * (1 - .06 * perk('schnur')) * (1 - .05 * glutUp('schild')) * dt;
      const dps = reel.thrash ? 3 : 12 + 8 * r.reel;
      crit.hp = Math.max(0, crit.hp - dps * dt);
      if (Math.random() < dt * 14) sfx.tick();
      crit.hitT += dt;
      if (crit.hitT > .45) {
        crit.hitT = 0; crit.flash = Math.max(crit.flash, .4);
        floaters.push({ x: crit.x - 8 + Math.random() * 16, y: SURFACE - 28 - Math.random() * 8, text: '−' + Math.round(dps * .45), c: reel.thrash ? '#94a3b8' : '#fde047', life: .9 });
      }
    } else reel.tension -= (.8 - pull * .15) * dt;
    reel.tension = Math.max(0, reel.tension);
    if (reel.thrash && Math.random() < dt * 12) splash(crit.x + (Math.random() - .5) * 20, SURFACE, 3, '#ffffff');
    if (reel.tension >= 1) { sfx.snap(); return critEnd(tr('Schnur gerissen! {c} taucht ab.', { c: c.name })); }
    if (crit.hp <= 0) return critWin();
    $('tension').style.width = Math.min(100, reel.tension * 100) + '%';
    $('reel').classList.toggle('thrash', !!reel.thrash);
    updateCritHud();
  }
  function updateCritHud() {
    const left = Math.max(0, Math.ceil((crit.ends - Date.now()) / 1000));
    const key = ['c', Math.ceil(crit.hp), left, !!reel.thrash].join('|');
    if (key === bossHudKey) return; bossHudKey = key;
    $('boss-hp').style.width = Math.max(0, crit.hp / crit.max * 100) + '%';
    $('boss-hp-num').textContent = `${Math.ceil(crit.hp)} / ${crit.max}`;
    $('boss-phase').textContent = reel.thrash ? tr('Tobt – loslassen!') : tr('Tiefe {n} · Kurbeln!', { n: crit.c.depth });
    $('boss-time').textContent = `⏱ 0:${String(left).padStart(2, '0')}`;
    $('boss-info').textContent = tr('Kreatur-Chance {n} % · {k} besiegt', { n: critChance(), k: critsTotal() });
  }
  function drawCrit() {
    if (!crit.on) return;
    const img = critImg[crit.c.id];
    if (!img.complete || !img.naturalWidth) return;
    const w = img.naturalWidth / 2, h = img.naturalHeight / 2;
    const sink = crit.out ? 1 - crit.out / (crit.won ? 1.6 : 1.2) : 0;
    const x = crit.x + Math.sin(t * 1.3) * 4 + (reel.thrash && !crit.out ? Math.sin(t * 40) * 1.2 : 0);
    const top = SURFACE - h * .8 * crit.rise + (1 - crit.rise) * 6 + Math.sin(t * 2) * 1 + sink * h + (crit.won && sink < .3 ? -Math.sin(sink / .3 * Math.PI) * 8 : 0);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SURFACE + 1); ctx.clip();
    ctx.globalAlpha = .18 + .08 * Math.sin(t * 5); disc(x, SURFACE - 2, w * .45, '#f97316'); ctx.globalAlpha = 1;
    const tilt = reel.thrash && !crit.out ? Math.sin(t * 30) * .07 : 0;
    ctx.translate(x, top + h / 2); ctx.rotate(tilt); ctx.translate(-x, -(top + h / 2));
    ctx.drawImage(img, snap(x - w / 2), snap(top), w, h);
    if (crit.flash > 0) { ctx.globalAlpha = Math.min(.6, crit.flash); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(img, snap(x - w / 2), snap(top), w, h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.globalAlpha = .85;
    for (let i = 0; i < 6; i++) px(x - w * .4 + i * w * .16 + Math.sin(t * 4 + i), SURFACE - .5, 3, .5, i % 2 ? '#fde047' : '#fb923c');
    ctx.globalAlpha = 1;
    bob.x = x - w * .25; crit.ly = Math.min(SURFACE, top + h * .45);
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
  function shinyChance() { return Math.min(.05, SHINY_BASE * Math.sqrt(bait().luck * rod().luck) * (dexPerk('shiny2') ? 2 : 1) * (buffOn('limo') ? 2 : 1) * wBoost(wx.shiny)); }
  function rollShiny() {
    if (window.__fischen && window.__fischen.forceShiny) return true;
    return Math.random() < shinyChance();
  }
  function mutLuck() { return Math.sqrt(bait().luck * rod().luck) * (1 + .08 * perk('glueck')) * (dexPerk('mutchance') ? 1.25 : 1) * (buffOn('limo') ? 2 : 1) * wBoost(wx.shiny); }
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
  const motionPref = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let reduceMotion = motionPref || !!save.calm; // "Weniger Bewegung" in the settings
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
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (state === 'rhythm') { if (!e.repeat && k === ' ') { e.preventDefault(); rhythmHit(); } else if (!e.repeat && (k === 'z' || k === 'x')) { e.preventDefault(); rhythmAimHit(); } return; }
    if (!$('title').hidden) { if (k === ' ' || k === 'enter') { e.preventDefault(); $('start').click(); } return; }
    if (!$('catch').hidden) { if (k === ' ' || k === 'enter') { e.preventDefault(); $('catch-ok').click(); } return; }
    if (k === 'f') { toggleModal('dex'); return; }
    if (k === 'l') { toggleModal('shop'); return; }
    if (k === 'c') { toggleModal('casino'); return; }
    if (k === 'p') { toggleModal('prog'); return; }
    if (k === 'b') { toggleModal('lb'); return; }
    if (k === 'n') { toggleModal('patch'); return; }
    if (k === 'o') { toggleModal('lobby'); return; }
    if (k === 'k') { toggleModal('wardrobe'); return; }
    if (k === 'e') { toggleModal('settings'); return; }
    if ((k === 'enter' || k === 't') && save.lobby && !anyModal() && state !== 'rhythm') { e.preventDefault(); openChatbar(); return; }
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
    time = worldTime();
    const w = currentWeather();
    if (w !== wx) {
      if ($('title').hidden && w !== CAVE_WX && wx !== CAVE_WX) toast(tr('{i} Wetterumschwung: {n} – {d}', { i: w.icon, n: w.name, d: w.desc }));
      wx = w; updateWeatherPill();
    }
    updateWeather(dt);
    if (boss.on) {
      if (Date.now() > boss.ends && boss.hp > 0) bossEnd();
      else if (!boss.solo && Date.now() - boss.synced > 1500) { boss.synced = Date.now(); lobbySync(); }
    }
    boss.quake = Math.max(0, boss.quake - dt);
    updateCine(dt);
    bossFx.flash = Math.max(0, bossFx.flash - dt * 2.5); bossFx.jump = Math.max(0, bossFx.jump - dt * 1.4);
    if (!boss.on && bossFx.sink > 0) bossFx.sink = Math.min(1, bossFx.sink + dt * .5);
    boss.rise = state === 'summon' || boss.on ? Math.min(1, boss.rise + dt * .7) : Math.max(0, boss.rise - dt * .5);

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
    for (const c of clouds) { c.x += c.v * dt * (wx.id === 'wind' ? 5 : 1); if (c.x > W + 40) c.x = -c.w - 10; }

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
        if (waitT <= 0 && bait().boss && bossReady()) { summonBoss(); break; }
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
      case 'boss':
        updateBoss(dt);
        break;
      case 'crit':
        updateCrit(dt);
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
    if (glimmTalk > 0) glimmTalk -= dt;
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
      reel.tension += (0.38 + pull * .75) * r.tens * (1 - .06 * perk('schnur')) * (wx.tens || 1) * (inLava() ? 1 - .05 * glutUp('schild') : 1) * dt;
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
    const lava = inLava(); // lava splashes glow
    for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - .5) * 60, vy: -40 - Math.random() * 60, life: 1, c: lava ? (i % 2 ? '#fb923c' : '#fde047') : color });
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

  // Sprites as char rows, drawn in img/pxl/code.px.js. 1 char = 1 fine pixel = 0.5 world units.
  const ART = {
    bait_abyss: [[".....kkkkk......","....kaaaaak.....","...kaaaaaaak....","..kabacccaaak...",".kaaacccccaaak..",".kaaccbbbccaak..",".kaaccbdbccaak..",".kaaccbbbccaak..",".kaaacccccaaak..","..kaaacccaaak...","...kaaaaaaak....","....kaaeaak.....",".....kkekkfk....","......kekkfk....","......kfffk.....",".......kkk......"], {"k":"#1b1f2e","a":"#0e7490","b":"#ecfeff","c":"#22d3ee","d":"#0b0f19","e":"#94a3b8","f":"#cbd5e1"}],
    bait_glitzer: [["......kkk...k...","....kkaaakkkbk..","...kacccaaabdbk.","...kcccccaakbk..","..kcceccdcaak...","..kcceccccaak...","..kcceccccaak...","..kccecccfaak...","..kccccdccaak...","...kcccccaak....","...kacccaaak....","....kkaaakk.....","......kakkgk....","......kakkgk....","......kgggk.....",".......kkk......"], {"k":"#1b1f2e","a":"#94a3b8","b":"#fbbf24","c":"#e2e8f0","d":"#fde68a","e":"#ffffff","f":"#f9a8d4","g":"#cbd5e1"}],
    bait_glutkoeder: [[".....kkkkk.k....","...kkaaaaakbk...","..kcaaaaaaakk...","..kadacccaaack..",".kaaacccccaaak..",".kaaccdddccaak..",".kaaccdedccaak..",".kaaccdddccaak..",".kaaacccccaaak..","..kaaacccaaak...","...kaaaaaaak....","....kaafaak.....",".....kkfkkgk....","......kfkkgk....","......kgggk.....",".......kkk......"], {"k":"#1b1f2e","a":"#dc2626","b":"#fbbf24","c":"#f97316","d":"#fef9c3","e":"#b91c1c","f":"#94a3b8","g":"#cbd5e1"}],
    bait_lockkoeder: [[".....kkkkk......","....kaaaaak.....","...kaaaaaaak....","..kabacccaaak...",".kaaacccccaaak..",".kaaccbbbccaak..",".kaaccbdbccaak..",".kaaccbbbccaak..",".kaaacccccaaak..","..kaaacccaaak...","...kaaaaaaak....","....kaaeaak.....",".....kkekkfk....","......kekkfk....","......kfffk.....",".......kkk......"], {"k":"#1b1f2e","a":"#57534e","b":"#ef4444","c":"#a8a29e","d":"#450a0a","e":"#94a3b8","f":"#cbd5e1"}],
    bait_mond: [["................",".....kkkkk..k...","....kaaaaakkbk..","...kbaaakkkbcbk.","..kbbaak...kbk..",".kbbbak.....k...","kbbbdak.........","kbbbbak.........","kbbbbbk.........","kbbbbbk.........","kbbbbdak........",".kbbbbaakkkk....","..kbbbaaaaaak...","...kbbbaaaak....","....kbbaaak.....",".....kkkkk......"], {"k":"#1b1f2e","a":"#fbbf24","b":"#fde68a","c":"#ffffff","d":"#d97706"}],
    bait_odkoeder: [["................","...kkkkkk.......","..kaaaaabkk...k.",".kaaaaaacbbk.kbk","kaakkkaacabkkbbk","kaakdkaacabbbbek","kaakkkaaacbbbbek","kbaaaaaaacbbbbek","kcccaaaabcbkkbbk",".kbbbbbbbbbk.kbk","..kkbbbbbkk...k.","....kkbkkfk.....",".....kbkkfk.....",".....kfffk......","......kkk.......","................"], {"k":"#1b1f2e","a":"#f8fafc","b":"#94a3b8","c":"#475569","d":"#ef4444","e":"#64748b","f":"#cbd5e1"}],
    bait_spezi: [["......kkkk......",".....kaaaak.....","......kbbk......","......kbbk......","......kbbk......",".....kbbbk......","....kcbbbbkk....","...kbcbbbbddk...","...keeeeeeddk...","...keeffffddk...","...keefgffddk...","...keeffffddk...","...keeeeeeddk...","...kbbbbbbddk...","....kkkkkkddk...","..........kk...."], {"k":"#1b1f2e","a":"#facc15","b":"#6b2d0f","c":"#a16207","d":"#4a1f0a","e":"#f97316","f":"#a855f7","g":"#f3e8ff"}],
    bait_wurm: [["...........k....",".....kkkk.kak...","..kkkbbbbkkak...",".kkcbbdbbbbak...","..kbbbkkbdbbk...","...kkk..kkbbbk..",".........kbdbk..","......kkkkbbk...","....kkbbbbbbk...","...kbbdbbdbak...","..kbdbbkkkkek...","..kbbkk..kek....","..kbbkkkkkek....","...kkeeeeek.....",".....kkkkk......","................"], {"k":"#1b1f2e","a":"#94a3b8","b":"#f472b6","c":"#fbcfe8","d":"#be185d","e":"#cbd5e1"}],
    bealin: [[".....kkkkkk.....","....kaaaaabk....","....kaaaacak....","...kaddddddak...","..kddddddddddk..","..kkeeeeeeeek...","...kefeeeefgk...","...kgeehheegk...","..kiiieeeeiiik..","..kiiiijjiiiik..","..kliiiiiiiilk..",".kllhmiiiimhllk.",".kllhmhiihmhlnee",".klolhmhhmhlnnk.","kllolhhmmhhlnnnk","kllllhmhhmhlnnnk","knnnnkmhhmknnnnk","knnnnkkkkkknnnnk"], {"k":"#1b1f2e","a":"#4d7c0f","b":"#ef4444","c":"#facc15","d":"#365314","e":"#f2c9a0","f":"#0f172a","g":"#d9a47a","h":"#dc2626","i":"#e5e7eb","j":"#9ca3af","l":"#6b7a3a","m":"#7f1d1d","n":"#4a5526","o":"#a16207"}],
    board: [[".kkkkkkkkkkkkkkkkkk.","kaaaaaaaaaaaaaaaaaak","kbccccccccccccccccbk","kbcddedddcccccccccbk","kbcddddddfggghgggcbk","kbcdiiiidfgggggggfbk","kbcddddddfgiiiiigfbk","kbcdiiiidfgggggggfbk","kbcddddddfgggggggfbk","kbccffffffcfffffffbk","kbccccccccccccccccbk","kbcccjjjljjjjcccccbk","kbcccjjjjjjjjfccccbk","kbcccjiiiiiijfccccbk","kbcccjjjjjjjjfccccbk","kbcccjiiiiiijfccccbk","kbcccjjjjjjjjfccccbk","kbccccffffffffccccbk","kbccccccccccccccccbk","kmmmmmmmmmmmmmmmmmmk",".kkbmmkkkkkkkbmmkkk.","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","..kbmmk.....kbmmk...","...kkk.......kkk...."], {"k":"#1b1f2e","a":"#96663a","b":"#785028","c":"#b7834a","d":"#fef3c7","e":"#ef4444","f":"#9a6c3a","g":"#bfdbfe","h":"#22c55e","i":"#94a3b8","j":"#fecaca","l":"#3b82f6","m":"#603e24"}],
    bottle: [[".a.",".k.","kbk","bcb","bdb","beb","kbk"], {"a":"#a16207","k":"#1b1f2e","b":"#6b2d0f","c":"#f97316","d":"#fed7aa","e":"#a855f7"}],
    buoy: [["......kk......",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....",".....kabk.....","...kkkabkkk...","..kcccccccck..",".kccccccccddk.",".kceccccccddk.",".kceccccccddk.",".kceccccccddk.",".kccccccccddk.",".kffffffffggk.",".kfhffffffggk.",".kfhffffffggk.",".kffffffffggk.",".kccccccccddk.",".kceccccccddk.",".kceccccccddk.","..kddddddddk..","...kkkkkkkk..."], {"k":"#1b1f2e","a":"#94a3b8","b":"#475569","c":"#dc3232","d":"#a11d1d","e":"#f87171","f":"#f0f0f0","g":"#a8b0bf","h":"#ffffff"}],
    dex: [["...kkkk..kkkk...","..kaaaakkaaaak..",".kbbbbbbcdddddk.",".kbccccbceeeedk.",".kbbbbbbcdddddk.","kffffffffffffffk","kfffffffgffffffk","khhhhhhhhhhhhhhk","kiiiiiiiiiiiiiik","kjljjljjjjljjljk","kjjjjljjjjljjjjk","kjjjjljjjjljjjjk","kjjjjljjjjljjjjk","kjjjjljjjjljjjjk","kjljjljjjjljjljk","kllllllllllllllk",".kkkkkkkkkkkkkk."], {"k":"#1b1f2e","a":"#e2e8f0","b":"#f8fafc","c":"#94a3b8","d":"#f1f5f9","e":"#38bdf8","f":"#2563eb","g":"#facc15","h":"#1e3a8a","i":"#ba8652","j":"#96663a","l":"#684224"}],
    glimm: [[".......kkkkkkk....",".....kkaaaaaaakk..","..kkkabbbacaaaaak.",".kdddaaaaacaaaaaak",".kbbdaaaaacaaaaaak",".kbbdaaaaacaaaaaak",".kdddaaaaacaaaaak.","..keeeeeeeeeeeeeek","...kffffggfffggkk.",".kkhhkkgggkkggggk.","kijhhhhhhhhgggggk.","kjjhhhhhhhhhhgggk.",".khhhhhhhhhhhggk..",".khhhlhhhhhhhgmmk.","..kkhhhhhhhggggmmk","..kkgghhhhhhhggmmk",".knnnghhhhhhhnnnmk",".kjnnghhhhhhhnnjk.","..kkkjjjhhhjjjmk..",".....kkkkkkkkkk..."], {"k":"#1b1f2e","a":"#facc15","b":"#fef9c3","c":"#fde047","d":"#475569","e":"#b45309","f":"#e5e7eb","g":"#6b4f3a","h":"#a78b6d","i":"#fce7f3","j":"#f9a8d4","l":"#f8fafc","m":"#4a3424","n":"#fbcfe8"}],
    kiosk_back: [["aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaacaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaacaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaacccabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaacccabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaddddaaeeeabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaffffaaeeeabgggggaa","aaaabaaaaaaabaaaaaaabaaaaafhhfaacccabiiiiiaa","aaaabaaaaaaabaaaaaaabaaaaafhhfaacccabiiiiiaa","aaaabaaaaaaabaaaaaaabaaaaafhhfaacccabiiiiiaa","aaaabaaaaaaabaaaaaaabaaajjjjjjjjjjjjjjjjjjjj","aaaabaaaaaaabaaaaaaabaaajjjjjjjjjjjjjjjjjjjj","aaaabaaaaaaabaaaaaaabaaallllllllllllllllllll","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaammmaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaannnnnnaammmaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaannnnnnaammmaaoooaa","aaaabaaaaaaabaaaaaaabaaaaappppppaammmaaoooaa","aaaabaaaaaaabaaaaaaabaaaaannnnnnaammmaaoooaa","aaaabaaaaaaabaaaaaaabaaaaannnnnnaammmaaoooaa","aaaabaaaaaaabaaaaaaabaaajjjjjjjjjjjjjjjjjjjj","aaaabaaaaaaabaaaaaaabaaajjjjjjjjjjjjjjjjjjjj","aaaabaaaaaaabaaaaaaabaaallllllllllllllllllll","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa","aaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaabaaaaaaa"], {"a":"#5c3e28","b":"#684226","c":"#6b2d0f","d":"#475569","e":"#f97316","f":"#bae6fd","g":"#60a5fa","h":"#f472b6","i":"#2563eb","j":"#7c4a24","l":"#3f2a1b","m":"#94a3b8","n":"#b45309","o":"#facc15","p":"#7c2d12"}],
    kiosk_front: [[".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.","kaaaaaaaabbbbbbbbaaaaaaaaabbbbbbbbaaaaaaaabbbbbbbbbaaaaaaaak","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","kccccccccddddddddcccccccccddddddddccccccccdddddddddcccccccck","keeeeeeeeffffffffeeeeeeeeeffffffffeeeeeeeefffffffffeeeeeeeek",".kcccccckkddddddkkccccccckkddddddkkcccccckkdddddddkkcccccck.",".keeeeeekkffffffkkeeeeeeekkffffffkkeeeeeekkfffffffkkeeeeeek.","..kkkkgghkkkkkkk..kkkkkkk..kkkkkk..kkkkkk..kkkkkkk.khhikkk..",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghk.........................................khhik....",".....kgghkkkkk.....................................khhik....",".....kggjjjjjjk....................................khhik....",".....kggllllllk................................k...khhik....",".....kggmlllllk...............................knk..khhik....",".....kggmlolllk...............................knkk.khhik....",".....kggmpppplk..............................kqqqqkkhhik....",".....kggmpppplk..............................kqqqqkkhhik....",".....kggmpppplk..............................kqqqqkkhhik....",".....kggllllllkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkqqqrkkhhik....","....kggggggggggggggggggggggggggggggggggggggggggggggggggk....","....kiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiik....","....kiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiik....",".....kggggggggggggggggggggggggggggggggggggggggggggggggk.....",".....khhhhhhihhhhhhhhhihhhhhhhhhihhhhhhhhhihhhhhhhhhihk.....",".....khhhhhhihhsssssssssssssssssssssssssssssshhhhhhhihk.....",".....khhhhhhihhsttttttttttttttttttttttttttttshhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsuuuuuuuuuuuuuuuuuuuuuuuuuuuushhhhhhhihk.....",".....khhhhhhihhsvvvvvvvvvvvvvvvvvvvvvvvvvvvvshhhhhhhihk.....",".....khhhhhhihhsssssssssssssssssssssssssssssshhhhhhhihk.....",".....khhhhhhihhhhhhhhhihhhhhhhhhihhhhhhhhhihhhhhhhhhihk.....",".....khhhhhhihhhhhhhhhihhhhhhhhhihhhhhhhhhihhhhhhhhhihk.....",".....kiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiik.....","......kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......"], {"k":"#1b1f2e","a":"#ef4444","b":"#ffffff","c":"#dc2626","d":"#f8fafc","e":"#b91c1c","f":"#cbd5e1","g":"#ba804e","h":"#96623a","i":"#684226","j":"#475569","l":"#bae6fd","m":"#e0f2fe","n":"#64748b","o":"#ec4899","p":"#f472b6","q":"#fbbf24","r":"#b45309","s":"#7c4a24","t":"#fffbeb","u":"#fef3c7","v":"#d6c49a"}],
    ladder: [[".kk..............kk.","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk","kabk............kabk","kabk............kabk","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk","kabk............kabk","kabk............kabk","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk","kabk............kabk","kabk............kabk","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk","kabk............kabk","kabk............kabk","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk","kabk............kabk","kabk............kabk","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk","kabk............kabk","kabk............kabk","kabk............kabk","kabk............kabk","kabkkkkkkkkkkkkkkabk","kacaaaaaaaaaaaaaacbk","kabbbbbbbbbbbbbbbabk","kabkkkkkkkkkkkkkkabk",".kk..............kk."], {"k":"#1b1f2e","a":"#96623a","b":"#6e4628","c":"#d4b483"}],
    lava_back: [["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbcbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbcbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbdbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbcbbbbabbbbbbbaa","aabbbcbbbbbbabbbbbbbbbbabbbbbbcbbbabbbbbbbaa","aabbbbcbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbdbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbcbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbcbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbcbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbcbbbbabbbbbbbbbbabbbbbbbbbbabcbbbbbaa","aabbbbbcbbbbabbbbbbbbbbabbbbbbbbbbacbbbbbbaa","aabbbbbcbbbbabbbbbbbbbbabbbbbbbbbbacbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbdbbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbcbbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbcabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aabbbbbbbbbbabbbbbbbbbbabbbbbbbbbbabbbbbbbaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"], {"a":"#2a2220","b":"#3f3533","c":"#7c2d12","d":"#f97316"}],
    lava_fin: [[".........k......","........kak.....",".......kabak....","......kaabak....","...kkkaabaaak...","..kaaaaaaaaaak..","...kccccccccck..","..kccccccccccck.",".kccccccccccddck",".kcceecccceeddck",".kccekccccekddck",".kccccccccccddck",".kccccccccccddck",".kccccccccccddk.",".kccccccccccddk.",".kccccccccccddk.","..kkkkkkkkkkkk..","................"], {"k":"#1b1f2e","a":"#60a5fa","b":"#93c5fd","c":"#3b82f6","d":"#1d4ed8","e":"#f8fafc"}],
    lava_front: [[".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbaaaabbbbk","kcccccccccccccccccccccccccccccccccccccccccccccccccccccccck",".kkkkdeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkeefkkkk.","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeek........................................keefk....","....kdeekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkeefk....","...kddddddddddddddddddddddddddddddddddddddddddddddddddk...","...kddddddddddddddddddddddddddddddddddddddddddddddddddk...","....keeeefeeeeeeeeeeefeeeeeeeeeeefeeeeeeeeeeefeeeeeeek....","....keeeefeeeeggggggggggggggggggggggggggggggefeeeeeeek....","....keeeefeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgefeeeeeeek....","....keeeefeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgefeeeeeeek....","....kfffffffffghhhhhhhhhhhhhhhhhhhhhhhhhhhhgfffffffffk....","....keeeeeeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgeeeeeeefek....","....keeeeeeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgeeeeeeefek....","....keeeeeeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgeeeeeeefek....","....keeeeeeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgeeeeeeefek....","....kfffffffffghhhhhhhhhhhhhhhhhhhhhhhhhhhhgfffffffffk....","....keeeefeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgefeeeeeeek....","....keeeefeeeeghhhhhhhhhhhhhhhhhhhhhhhhhhhhgefeeeeeeek....","....keeeefeeeeggggggggggggggggggggggggggggggefeeeeeeek....","....keeeefeeeeeeeeeeefeeeeeeeeeeefeeeeeeeeeeefeeeeeeek....","....kffffffffffffffffffffffffffffffffffffffffffffffffk....","....kffffffffffffffffffffffffffffffffffffffffffffffffk....",".....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....."], {"k":"#1b1f2e","a":"#7f1d1d","b":"#b91c1c","c":"#450a0a","d":"#78716c","e":"#44403c","f":"#292524","g":"#57190a","h":"#1c0a05"}],
    muschelrock: [[".......kkkkkkkkkkkkk......","....kkkaabbbbbbbbaaak.....","...kbbbbbbbbbbbbaaaaakk...","..kaaaaaaaaaaaaaaaaaaaak..",".kaaaaaaaaaaaaaaaacccaaak.",".kaaaaaaaaaaaaaaaccccccck.","kaaaaaaaaaaaaaaaccccccccck",".kkkkkkkkkkkkkkkkkkkkkkkk."], {"k":"#1b1f2e","a":"#64748b","b":"#94a3b8","c":"#475569"}],
    news: [[".kkkkkkkkkkkkkk.","kaaaaaaabaaaaaak","kakkkkkabcccccak","kakkkkkabaaaaaak","kaaaaaaabcccccak","kadddddabaaaaaak","keeeeeeebeeeeeek","keeeeeeebeeeeeek","kdddddddbddddddk","kfffffffbffffffk",".kkkkkkkkkkkkkk."], {"k":"#1b1f2e","a":"#f1f5f9","b":"#b45309","c":"#475569","d":"#94a3b8","e":"#cbd5e1","f":"#e2e8f0"}],
    rift: [["......................................","................kk....................","...............kabkk..................",".............kkaabbbkkk...............","............kcccabbbbbbkk.............","............kaaaaabbbbbbbk............","...........kaaaaaabbbbbbbbk...........","..........kaacaaaabbbbbbbbdk..........",".........kaacaaaaabbbbbbbbdk..........","........kaacaaaaabbbbbbbbbddk.........",".......kaacaaaaabbbbbbbbbbddk.........","......kbbaaaaaabdddbbbbbbbdddk........","......kbbbaaaaddbbbbbbbbbbdddk........","......kbbbaaaabbbbbbbbbbbbddddk.......",".....kbbbbbaabbbbbbbbbbbbbddddk.......",".....kbbbbbbbbbbbbbbbbbbbbdddddk......",".....kbbbbbbbbbbbbbbbbbbbbdddddk......","....kbbbbbbbbbbbbbbbbbbbbddddddk......","....kbbbbbbbbbbbbbbbbbbbbdddddddk.....","....kbbbbbbdddbbbbbbbbbbbdddddddk.....","...kbbbddddbbbbbbbbbbbbbbddddddddk....","...kbddbbbbbbbbbbbbbbbbbbddddddddk....","...kbbbbbbbbbbbbbbbbbbbbbdddddddddk...","..kbbbbbbbbbbbbbbbbbbbbbbdddddddddk...","..kbbbbbbbbbbddddddddddbdddddddddddk..","..kddddddddddbbbbbbbbbbbdddddddddddk..",".keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeek.","..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.."], {"k":"#1b1f2e","a":"#807670","b":"#58504c","c":"#a8a29e","d":"#3c3634","e":"#2a2523"}],
    slot: [["...kkkkkkkkkkkkkkkk...kkk.","..kaaaaaaaaaaaaaaaak.kbbbk",".kkcccccccccccccccckkbdbbk","kacccccccccccccccceeebbbbk","kacffffffffffffffffeebbbbk","kacggggggggggggggggeekbbbk","kacggggggggggggggggeekhik.","kacggggggggggggggggeekhik.","kacggggggggggggggggeekhik.","kacffffffffffffffffeekhik.","kacccccccccccccccceeekhik.","kacccccccccccccccceeekhik.","kackkkkkkkkkkkkkkkkeekhik.","kackjjjjljjjjljjjjkeekhik.","kackjjjjljjjjljjjjkeekhik.","kackjjjjljjjjljjjjkeeihik.","kackjjjjljjjjljjjjkeeiik..","kackjjjjljjjjljjjjkeeiik..","kackjjjjljjjjljjjjkeeiik..","kackjjjjljjjjljjjjkeekk...","kackjjjjljjjjljjjjkeek....","kackllllllllllllllkeek....","kackkkkkkkkkkkkkkkkeek....","kacccccccccccccccceeek....","kacccccccccccccccceeek....","kacmcckkkkkkkkcnnceeek....","kacccccccccccccnnceeek....","kacocccccccccccccceeek....","kacccccccccccccccceeek....","kacccccccccccccccceeek....","kackkkkkkkkkkkkkkkkeek....","kackppppppppppppppkeek....","kackqqqqqrnnqqqqqqkeek....","kackqqqqqnnnqqqqqqkeek....","kackqqqqqqqqqqqqqqkeek....","kackkkkkkkkkkkkkkkkeek....","kacccccccccccccccceeek....","keeeeeeeeeeeeeeeeeeeek....","keeeeeeeeeeeeeeeeeeeek....",".kkkkkkkkkkkkkkkkkkkk....."], {"k":"#1b1f2e","a":"#ec6064","b":"#ef4444","c":"#c42634","d":"#fecaca","e":"#881622","f":"#b45309","g":"#f59e0b","h":"#94a3b8","i":"#64748b","j":"#f8fafc","l":"#cbd5e1","m":"#4ade80","n":"#fbbf24","o":"#f472b6","p":"#334155","q":"#475569","r":"#fde68a"}],
    snack_broetchen: [["................",".....kkkkkkk....","...kkaaaaaaakk..","..kbbbbbbcaaaak.",".kaaaacaaaaaaaak",".kaaaaaaaaacaaak",".kaaaaaaaaaaaaak",".kkdddddddddddk.","keeeeeeeeeeeeefk",".kgggggggggggffk",".khhkhhhhhhhhhfk","..kiiiiiiiiiikk.","..kjjjjjjjjjjk..","...kkkkkkkkkk...","................","................"], {"k":"#1b1f2e","a":"#e9b872","b":"#f5d79a","c":"#fff7cc","d":"#c98a45","e":"#22c55e","f":"#94a3b8","g":"#e2e8f0","h":"#cbd5e1","i":"#d9a05b","j":"#a86a3c"}],
    snack_kaffee: [[".....k..k.......","....kakkak......","...kak.kak......","...kak.kak......","...kakkak.......","..kkkkkkkkk.....",".kbcccccccakkk..",".kbbbbbbbaabbbk.",".kbbbbbbbabkkkbk",".kbbddddbabk.kbk",".kbbddddbabkkkbk",".kbbbbbbbaabbbk.",".kbbbbbbbaakkk..",".kaaaaaaaaak....","..kkkkkkkkk.....","................"], {"k":"#1b1f2e","a":"#cbd5e1","b":"#f8fafc","c":"#5b3416","d":"#ef4444"}],
    snack_keks: [["................",".....kkkkkk.....","....kaaaaabkk...","...kaaaaaaabbk..","..kaaaaaaaaabbk.",".kaacaaaaaacabk.",".kaaadeadeaaabbk",".kaaaeeaeeaaabbk",".kaaaaafaaaaabbk",".kaaaeeafeaaabbk",".kbaaeeaefacbbbk","..kbacaaafabbbk.","..kbbaaaaafbbbk.","...kbbbbbbbbbk..","....kkbbbbbkk...","......kkkkk....."], {"k":"#1b1f2e","a":"#d9a05b","b":"#b97a3d","c":"#7c4a24","d":"#86efac","e":"#22c55e","f":"#15803d"}],
    snack_limo: [["......kkkk......",".....kaaaak..k..","......kbbk..kck.","......kbbk.kcdck","..k...kbbk..kck.",".kck.kbbbk...k..","..k.kbbbbbk.....","...kbebbbbbk....","...kbebbfbgk....","...khehhhhghk...","...khehhhhghk...","...khehfhhghk...","...khehhhhghk...","...kheehhfghk...","...khhhhhhhhk...","....kkkkkkkk...."], {"k":"#1b1f2e","a":"#fbbf24","b":"#f0abfc","c":"#fde047","d":"#fff7cc","e":"#fae8ff","f":"#ffffff","g":"#a21caf","h":"#d946ef"}],
    trophy: [["....kkkkkkkkkkkk....","...kaaaaaaaaaaaak...","..kkkbbbbbbbccckkk..",".kbbbbbaabbbcccbbck.",".kbkkbbabbbbccckkck.",".kbkkbbabbbbccckkck.",".kbkkbbabbbbccckkck.",".kbkkbbabbbbccckkck.",".kcccbbbbbbbcccccck.","..kkkbbbbbbbckkkkk..",".....kbbbbbck.......","......kbbbbck.......",".......kkbck........","........kbck........",".......kkcckk.......",".....kkbbbbbbkk.....","....kddddddddddk....","....keeeaaaaeeek....","....keeeeeeeeeek....",".....kkkkkkkkkk....."], {"k":"#1b1f2e","a":"#fde68a","b":"#fbbf24","c":"#d97706","d":"#a0662f","e":"#7c4a24"}],
    wels_00: [["......aaaaaaaaaa......",".....abccbbbbbbba.....",".....abcbbbbbbbba.....",".....abcbbbbbbbba.....",".....abbbbbbbbbba.....",".....abbbbbbbbbba.....",".....adeeddddddda.....",".....adddddddddda.....","..aaaabbbbbbbbbbaaaa..",".abcccbbbbbbbbbbbbbba.","..aaaaaaaaaaaaaaaaaa..","...affgggfffffffffa...","..affgggfhffffhffffa..",".affffffffffffffffffa.",".afiijffffffffffiijfa.",".afijjffffffffffijjfa.","affffffffffffffffffffa","ahllllllllllllllllllha","almmmmmmmmmmmmmmmmmmla","alnnnnnnnnnnnnnnnnnnla","alllllllllllllllllllla",".aooopoooooooooopoooa.",".aooooooooooooooooooa.","..aooooooooooooooooa..","..appppppppppppppppa.."], {"a":"#111827","b":"#1f2937","c":"#4b5563","d":"#7f1d1d","e":"#b91c1c","f":"#6b7a5e","g":"#8a9a7b","h":"#4f5b45","i":"#f8fafc","j":"#0b0f19","l":"#c9a99a","m":"#e2c7b9","n":"#3b1d1d","o":"#d9d2c0","p":"#bfb6a1"}],
    wels_01: [["......aaaaaaaaaa......",".....abccbbbbbbba.....",".....abcbbbbbbbba.....",".....abcbbbbbbbba.....",".....abbbbbbbbbba.....",".....abbbbbbbbbba.....",".....adeeddddddda.....",".....adddddddddda.....","..aaaabbbbbbbbbbaaaa..",".abcccbbbbbbbbbbbbbba.","..aaaaaaaaaaaaaaaaaa..","...affgggfffffffffa...","..affgggfhffffhffffa..",".affffffffffffffffffa.",".afiijffffffffffiijfa.",".afijjffffffffffijjfa.","affffffffffffffffffffa","ahllllllllllllllllllha","almmmmmmmmmmmmmmmmmmla","almmmmnnnnnnnnnnmmmmla","alllllllllllllllllllla",".aooopoooooooooopoooa.",".aooooooooooooooooooa.","..aooooooooooooooooa..","..appppppppppppppppa.."], {"a":"#111827","b":"#1f2937","c":"#4b5563","d":"#7f1d1d","e":"#b91c1c","f":"#6b7a5e","g":"#8a9a7b","h":"#4f5b45","i":"#f8fafc","j":"#0b0f19","l":"#c9a99a","m":"#3b1d1d","n":"#d16b78","o":"#d9d2c0","p":"#bfb6a1"}],
    wels_10: [["......aaaaaaaaaa......",".....abccbbbbbbba.....",".....abcbbbbbbbba.....",".....abcbbbbbbbba.....",".....abbbbbbbbbba.....",".....abbbbbbbbbba.....",".....adeeddddddda.....",".....adddddddddda.....","..aaaabbbbbbbbbbaaaa..",".abcccbbbbbbbbbbbbbba.","..aaaaaaaaaaaaaaaaaa..","...affgggfffffffffa...","..affgggfhffffhffffa..",".affffffffffffffffffa.",".afhhhffffffffffhhhfa.",".affffffffffffffffffa.","affffffffffffffffffffa","ahiiiiiiiiiiiiiiiiiiha","aijjjjjjjjjjjjjjjjjjia","aillllllllllllllllllia","aiiiiiiiiiiiiiiiiiiiia",".ammmnmmmmmmmmmmnmmma.",".ammmmmmmmmmmmmmmmmma.","..ammmmmmmmmmmmmmmma..","..annnnnnnnnnnnnnnna.."], {"a":"#111827","b":"#1f2937","c":"#4b5563","d":"#7f1d1d","e":"#b91c1c","f":"#6b7a5e","g":"#8a9a7b","h":"#4f5b45","i":"#c9a99a","j":"#e2c7b9","l":"#3b1d1d","m":"#d9d2c0","n":"#bfb6a1"}],
    wels_11: [["......aaaaaaaaaa......",".....abccbbbbbbba.....",".....abcbbbbbbbba.....",".....abcbbbbbbbba.....",".....abbbbbbbbbba.....",".....abbbbbbbbbba.....",".....adeeddddddda.....",".....adddddddddda.....","..aaaabbbbbbbbbbaaaa..",".abcccbbbbbbbbbbbbbba.","..aaaaaaaaaaaaaaaaaa..","...affgggfffffffffa...","..affgggfhffffhffffa..",".affffffffffffffffffa.",".afhhhffffffffffhhhfa.",".affffffffffffffffffa.","affffffffffffffffffffa","ahiiiiiiiiiiiiiiiiiiha","aijjjjjjjjjjjjjjjjjjia","aijjjjlllllllllljjjjia","aiiiiiiiiiiiiiiiiiiiia",".ammmnmmmmmmmmmmnmmma.",".ammmmmmmmmmmmmmmmmma.","..ammmmmmmmmmmmmmmma..","..annnnnnnnnnnnnnnna.."], {"a":"#111827","b":"#1f2937","c":"#4b5563","d":"#7f1d1d","e":"#b91c1c","f":"#6b7a5e","g":"#8a9a7b","h":"#4f5b45","i":"#c9a99a","j":"#3b1d1d","l":"#d16b78","m":"#d9d2c0","n":"#bfb6a1"}],
    wheel_0: [["............................","............................",".........kkk.......kkk......",".........kak.......kak......",".........kkkkkkkkk.kkk......",".........kkbcccccckb........","........kccbkkkkk.bck.......","..kkk..kc.kb.....kb.ck......","..kak.kckk..b....b.kkck.....","..kkkbc.k...b....b..k.ckkkk.",".....kbb.....b..b....kckkak.","....kc.kbb...b..b....bbbkkk.","....kck...bbkkkkk..bb.kck...","....kck.....kdeekbb...kck...","....kck.....keeek.....kck...","....kck...bbkeeek.....kck...","....kck.bb..kkkkkbb...kck...","..kkkbbb....bacbk..bbk.ck...","..kakkck....bacbk....bbk....","..kkkkc.k..bkacbb...k.cbkkk.","......kckk.bkacbb..kkck.kak.",".......kc.bkkacbkbk.ck..kkk.","........kcb.kkkkkbcck.......",".........bkccccccbkk........",".......kkk.kkkkkkkkk........",".......kak..kacbkkak........",".......kkk..kacbkkkk........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk..........."], {"k":"#1b1f2e","a":"#ba804e","b":"#6e4628","c":"#96623a","d":"#fde68a","e":"#fbbf24"}],
    wheel_1: [["............................","...........kkk..............","...........kak..............","...........kkk......kkk.....","...........kbkkkkk..kak.....",".........kkccbcccckkkkk.....","...kkk..kcc.kbkkk.ccb.......","...kak.kc.kk.b...kkbck......","...kkkbckk...b....bkkck.....",".....kcbk....b...b..k.ck....",".....kckb....b...b...kck....","....kc.k.bb...b.b....k.ckkkk","....kck....bkkkkk.....kbbkak","....kck.....kdeekbbbbbbckkkk","....kck....bkeeek.....kck...",".kkkkbbbbbb.keeek.....kck...",".kakbck.....kkkkkb....kck...",".kkkkc.k....bacbk.b..k.ck...",".....kck...bkacbk..bbkck....",".....kc.k.b.kacbk...kbck....","......kckkb.kacbk..kkcbkkk..",".......kcbkkkacbkkk.ck.kak..","........bcc.kkkbk.cck..kkk..","......kkkkkcccccbckk........","......kak..kkkkkbk..........","......kkk...kackkk..........","............kackak..........","............kackkk..........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk..........."], {"k":"#1b1f2e","a":"#ba804e","b":"#6e4628","c":"#96623a","d":"#fde68a","e":"#fbbf24"}],
    wheel_2: [["............................",".............kkk............",".............kak............",".............kkk............","...........kkkbkkk..........",".....kkk.kkcccbccckk.kkk....",".....kakkcc.kkbkk.cckkak....",".....kkkc.kk..b..kk.ckkk....","......kcbk....b....kbck.....",".....kc.kb....b....bk.ck....",".....kck..b...b...b..kck....","....kc.k...b..b..b...k.ck...","....kck.....kkkkk.....kck...",".kkkkck.....kdeek.....kckkkk",".kakbbbbbbbbkeeekbbbbbbbbkak",".kkkkck.....keeek.....kckkkk","....kck.....kkkkk.....kck...","....kc.k...bkabbkb...k.ck...",".....kck..b.kabbk.b..kck....",".....kc.kb..kabbk..bk.ck....","......kcbk..kabbk..kbck.....",".....kkkc.kkkabbkkk.ckkk....",".....kakkcc.kkbkk.cckkak....",".....kkk.kkcccbccckk.kkk....","...........kkkbkkk..........","............kkkkk...........","............kkakk...........","............kkkkk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk..........."], {"k":"#1b1f2e","a":"#ba804e","b":"#6e4628","c":"#96623a","d":"#fde68a","e":"#fbbf24"}],
    wheel_3: [["............................","...............kkk..........","...............kak..........","......kkk......kkk..........","......kak..kkkkkbk..........","......kkkkkccccbcckk........","........bcc.kkkbk.cck..kkk..",".......kcbkk...b.kk.ck.kak..","......kckkb....b...kkcbkkk..",".....kc.k..b...b....kbck....",".....kck...b...b....bkck....",".kkkkc.k....b.b...bb.k.ck...",".kakbck.....kkkkkb....kck...",".kkkkbbbbbb.kdeek.....kck...","....kck....bkeeek.....kck...","....kck.....keeekbbbbbbckkkk","....kck....bkkkkk.....kbbkak","....kc.k..b.kbcbb....k.ckkkk",".....kckbb..kbcbkb...kck....",".....kcbk...kbcbk.b.k.ck....","...kkkbckk..kbcbk.bkkck.....","...kak.kc.kkkbcbkkkbck......","...kkk..kcc.kbkkk.ccb.......",".........kkcbccccckkkkk.....","...........kbkkkkk..kak.....","...........kkkcbk...kkk.....","...........kakcbk...........","...........kkkcbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk..........."], {"k":"#1b1f2e","a":"#ba804e","b":"#6e4628","c":"#96623a","d":"#fde68a","e":"#fbbf24"}],
    wheel_4: [["............................","............................",".......kkk.......kkk........",".......kak.......kak........",".......kkk.kkkkkkkkk........",".........bkccccccbkk........","........kcb.kkkkkbcck.......",".......kc.bk.....bk.ck..kkk.","......kckk.b....b..kkck.kak.","..kkkkc.k..b....b...k.cbkkk.","..kakkck....b..b.....bbk....","..kkkbbb....b..b...bbk.ck...","....kck.bb..kkkkkbb...kck...","....kck...bbkdeek.....kck...","....kck.....keeek.....kck...","....kck.....keeekbb...kck...","....kck...bbkkkkk..bb.kck...","....kc.kbb..kbcbb....bbbkkk.",".....kbb....kbcbb....kckkak.","..kkkbc.k...bacbkb..k.ckkkk.","..kak.kckk..bacbkb.kkck.....","..kkk..kc.kbkacbkkb.ck......","........kccbkkkkk.bck.......",".........kkbcccccckb........",".........kkkkkkkkk.kkk......",".........kakkacbk..kak......",".........kkkkacbk..kkk......","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk...........","............kacbk..........."], {"k":"#1b1f2e","a":"#ba804e","b":"#6e4628","c":"#96623a","d":"#fde68a","e":"#fbbf24"}],
  };
  // A baked sprite and its darker copy for the night, made on first use.
  const artCache = {};
  function artImg(name) {
    if (artCache[name]) return artCache[name];
    const img = bake(...ART[name]), night = document.createElement('canvas');
    night.width = img.width; night.height = img.height;
    const x = night.getContext('2d'); x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(10, 16, 40, .65)'; x.fillRect(0, 0, night.width, night.height);
    return (artCache[name] = { img, night });
  }
  function drawArt(name, x, y, dark = 0) {
    const { img, night } = artImg(name), w = img.width / 2, h = img.height / 2, sx = snap(x), sy = snap(y);
    ctx.drawImage(img, sx, sy, w, h);
    if (dark > .02) { ctx.globalAlpha = Math.min(1, dark); ctx.drawImage(night, sx, sy, w, h); ctx.globalAlpha = 1; }
  }
  const PLAYER_PAL = {"k": "#1b1f2e", "h": "#22c55e", "H": "#15803d", "l": "#86efac", "s": "#f2c9a0", "S": "#d9a47a", "e": "#0f172a", "B": "#7c4a24", "b": "#a0662f", "c": "#f59e0b", "C": "#c2410c", "y": "#fcd34d", "w": "#f8fafc", "p": "#3b4a66", "P": "#26324a", "o": "#5b3a24", "O": "#3a2416", "r": "#e8a87c", "g": "#94a3b8"};
  const PLAYER_BODY = ["........kkkkkk........","......kkhlllhhkk......",".....khhlllhhhhhk.....",".....khhllhhhhhHk.....",".....khhhhhhhhHHk.....",".....kHHHHHHHHHHk.....","...kkkHHHHHHHHHHkkk...","..kHHHHHHHHHHHHHHHHk..","...kkkkkkkkkkkkkkkk...",".....kBBSsssssssk.....",".....kBBSssssewsk.....",".....kBSSssssessrk....",".....kBSssssssssrk....",".....kBBSsssSSSSk.....","......kBBSssssssk.....",".......kkSSSSSSkk.....",".....kkkyyyyyykkk.....","....kCccccyyycccck....","...kCCccccyyccccck....","...kCCcccccycccccck...","...kCCkccccyccccck....","...kCCkccccyccccck....","...kCCkcCCCyccCCck....","...kSskccccyccccck....","....kkkCcccyccccCk....","......kCcccyccccCk....","......kCCCCyCCCCCk....","......kPPPPPPPPPPk....","......kppppppPpppk...."];
  const PLAYER_LEGS = [["......kpPpk.kppPk.....","......kpPpk.kppPk.....","......kPPpk.kPpPk.....","......koook.koook.....","......kOoook.kOoook...","......kOOOOk.kOOOOk...",".......kkkk...kkkk...."],[".....kpPpk...kppPk....","....kpPpk.....kppPk...","....kPPpk.....kPpPk...","...koook.......koook..","...kOoook......kOoook.","...kOOOOk......kOOOOk.","....kkkk........kkkk.."],[".......kpPpkppPk......",".......kpPpkppPk......",".......kPPpkPpPk......",".......koookoook......",".......kOoooooook.....",".......kOOOOOOOOOk....","........kkkkkkkkk....."]];

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
  const HATS = [['#22c55e', '#15803d', '#86efac'], ['#38bdf8', '#0369a1', '#bae6fd'], ['#c084fc', '#7e22ce', '#f3e8ff'], ['#fbbf24', '#b45309', '#fef3c7'],
    ['#ef4444', '#991b1b', '#fecaca'], ['#f472b6', '#9d174d', '#fce7f3'], ['#2dd4bf', '#0f766e', '#ccfbf1'], ['#f97316', '#9a3412', '#fed7aa'], ['#e2e8f0', '#64748b', '#ffffff'], ['#1e293b', '#020617', '#94a3b8']];
  // cosmetics (bought in the shop) recolour the hat, the jacket or the bobber; without a hat
  // cosmetic the hat keeps the rebirth colour
  const COSMETICS = [
    // in the shop
    { id: 'hut-rot',     slot: 'hat',    name: 'Roter Hut',          price: 400,  col: ['#ef4444', '#b91c1c', '#fca5a5'], desc: 'Leuchtet über den ganzen Steg.' },
    { id: 'hut-pink',    slot: 'hat',    name: 'Pinker Hut',         price: 600,  col: ['#f472b6', '#be185d', '#fbcfe8'], desc: 'Die Fische finden ihn mutig.' },
    { id: 'hut-weiss',   slot: 'hat',    name: 'Weißer Hut',         price: 900,  col: ['#f8fafc', '#cbd5e1', '#ffffff'], desc: 'Bleibt garantiert nicht lange sauber.' },
    { id: 'jacke-blau',  slot: 'jacket', name: 'Blaue Regenjacke',   price: 700,  col: ['#3b82f6', '#1d4ed8', '#bfdbfe'], desc: 'Klassisch nordisch.' },
    { id: 'jacke-rot',   slot: 'jacket', name: 'Rote Regenjacke',    price: 700,  col: ['#ef4444', '#991b1b', '#fecaca'], desc: 'Sieht man sogar im Nebel.' },
    { id: 'jacke-gruen', slot: 'jacket', name: 'Grüne Regenjacke',   price: 900,  col: ['#22c55e', '#15803d', '#bbf7d0'], desc: 'Tarnung für Fortgeschrittene.' },
    { id: 'pose-blau',   slot: 'bob',    name: 'Blaue Pose',         price: 150,  col: '#3b82f6', desc: 'Schwimmt genauso gut, nur blauer.' },
    { id: 'pose-gruen',  slot: 'bob',    name: 'Grüne Pose',         price: 150,  col: '#22c55e', desc: 'Für Angler mit Gartenliebe.' },
    { id: 'pose-pink',   slot: 'bob',    name: 'Pinke Pose',         price: 250,  col: '#f472b6', desc: 'Unübersehbar.' },
    // luxury: for anglers who have more coins than ideas
    { id: 'pose-kristall', slot: 'bob',  name: 'Kristallpose',       price: 10000, col: '#a5f3fc', desc: 'Klar wie Eis. Die Fische sehen sich darin.' },
    { id: 'jacke-kapitaen', slot: 'jacket', name: 'Kapitänsjacke',   price: 20000, col: ['#1e3a8a', '#172554', '#facc15'], desc: 'Dunkelblau mit Goldknöpfen. Für Leute mit eigenem Boot.' },
    { id: 'hut-diamant', slot: 'hat',    name: 'Diamanthut',         price: 40000, col: ['#a5f3fc', '#0891b2', '#ecfeff'], sparkle: true, desc: 'Funkelt. Ständig. Auch nachts.' },
    { id: 'hut-sonne',   slot: 'hat',    name: 'Sonnenkrone',        price: 500000, pres: 1, col: ['#fbbf24', '#c2410c', '#fff7ed'], sparkle: true, desc: 'Strahlt heller als die Sonne über dem Steg. Ab 1× Prestige.' },
    { id: 'jacke-galaxie', slot: 'jacket', name: 'Galaxiemantel',    price: 1000000, pres: 2, col: ['#312e81', '#0f0a2e', '#f0abfc'], desc: 'Voller Sterne. Ab 2× Prestige.' },
    // boat skins: replace Bealin's boat on the open sea (drawBoat)
    { id: 'boot-hoff',   slot: 'boat',   name: 'David Hasselhoff',   price: 30000, reb: 3, desc: 'Der Mann, die Locken, das Boot. Schwimmt auf dem Bauch durchs Meer und trägt dich auf dem Rücken über die Hohe See.' },
    { id: 'hut-krone',   slot: 'hat',    name: 'Kronen-Hut',         price: 100000, col: ['#fde047', '#a16207', '#ffffff'], sparkle: true, desc: 'Für Angler, die wirklich alles haben.' },
    // unlocked by achievements
    { id: 'hut-gold',    slot: 'hat',    name: 'Goldener Hut',       col: ['#facc15', '#b45309', '#fef08a'], desc: 'Für alle, die einen legendären Fisch gelandet haben.', ach: 'Fange einen legendären Fisch.', got: () => FISH.some(f => f.r === 'legendary' && save.dex[f.id]) },
    { id: 'hut-glitzer', slot: 'hat',    name: 'Glitzerhut',         col: ['#f0abfc', '#a21caf', '#fdf4ff'], desc: 'Funkelt fast so schön wie ein Shiny.', ach: 'Fange einen Shiny.', got: () => Object.values(save.dex).some(e => e.shiny) },
    { id: 'hut-schwarz', slot: 'hat',    name: 'Nachteulen-Hut',     col: ['#334155', '#0f172a', '#64748b'], desc: 'Für Angler, die lieber im Dunkeln fischen.', ach: 'Fange 25 Fische bei Nacht.', got: () => cosmStat('night') >= 25 },
    { id: 'hut-lobby',   slot: 'hat',    name: 'Freundschaftshut',   col: ['#2dd4bf', '#0f766e', '#ccfbf1'], desc: 'Zusammen angelt es sich besser.', ach: 'Fange 10 Fische in einer Multiplayer-Lobby.', got: () => cosmStat('lobby') >= 10 },
    { id: 'jacke-lila',  slot: 'jacket', name: 'Taktjacke',          col: ['#a855f7', '#6b21a8', '#e9d5ff'], desc: 'Hat den Rhythmus im Blut.', ach: 'Gewinne einen Taktdrill.', got: () => cosmStat('takt') >= 1 },
    { id: 'jacke-gold',  slot: 'jacket', name: 'Goldjacke',          col: ['#facc15', '#a16207', '#fef9c3'], desc: 'Nur für Wiedergeborene.', ach: 'Werde einmal wiedergeboren.', got: () => save.rebirths >= 1 },
    { id: 'hut-odfisch', slot: 'hat',    name: 'Odfisch-Hut',        col: ['#a9bccd', '#6f86a0', '#e2ecf5'], desc: 'Silbergrau wie der Odfisch. Fih.', ach: 'Besiege den Odfisch.', got: () => (save.bossWins || 0) >= 1 },
    { id: 'jacke-sturm', slot: 'jacket', name: 'Sturmjacke',         col: ['#475569', '#1e293b', '#facc15'], desc: 'Gewittergrau mit Blitzkante. Hält dicht.', ach: 'Fange 10 Fische bei Gewitter.', got: () => cosmStat('sturm') >= 10 },
    { id: 'jacke-seebaer', slot: 'jacket', name: 'Seebären-Jacke',   col: ['#0f766e', '#134e4a', '#fde68a'], desc: 'Hat schon jeden Sturm gesehen.', ach: 'Werde 8× wiedergeboren.', got: () => (save.rebirthsTotal | 0) >= 8 },
    { id: 'hut-fischgott', slot: 'hat',  name: 'Fischgott-Krone',    col: ['#f0abfc', '#7e22ce', '#fef9c3'], sparkle: true, desc: 'Die Fische verneigen sich. Fast.', ach: 'Werde 10× wiedergeboren.', got: () => (save.rebirthsTotal | 0) >= 10 },
    { id: 'hut-perle',   slot: 'hat',    name: 'Perlenkrone',        col: ['#f5f3ff', '#a78bfa', '#ffffff'], sparkle: true, desc: 'Für alle, die ganz von vorn angefangen haben.', ach: 'Mach einmal Prestige.', got: () => save.prestige >= 1 },
    { id: 'pose-perle',  slot: 'bob',    name: 'Perlen-Pose',        col: '#ede9fe', desc: 'Schimmert wie Perlmutt.', ach: 'Mach 2× Prestige.', got: () => save.prestige >= 2 },
    { id: 'jacke-prestige', slot: 'jacket', name: 'Prestige-Mantel', col: ['#1e1b4b', '#0f0a2e', '#fbbf24'], desc: 'Nachtblau mit Goldsaum. Schon dreimal alles verloren und trotzdem hier.', ach: 'Mach 3× Prestige.', got: () => save.prestige >= 3 },
    // codes (settings): FISCH-BETA-TEST-RWRD unlocks the beta set
    { id: 'hut-beta',    slot: 'hat',    name: 'Beta-Kappe',         col: ['#22d3ee', '#0e7490', '#f0abfc'], sparkle: true, desc: 'Für alle, die von Anfang an dabei waren.', ach: 'Löse den Beta-Code in den Einstellungen ein.', got: () => (save.codes || []).includes('beta') },
    { id: 'jacke-beta',  slot: 'jacket', name: 'Beta-Jacke',         col: ['#7c3aed', '#3b0764', '#22d3ee'], desc: 'Lila mit Türkis. Steht „BETA“ drauf, man sieht es nur nicht.', ach: 'Löse den Beta-Code in den Einstellungen ein.', got: () => (save.codes || []).includes('beta') },
    { id: 'pose-beta',   slot: 'bob',    name: 'Beta-Pose',          col: '#22d3ee', desc: 'Leuchtet türkis wie ein Testbildschirm.', ach: 'Löse den Beta-Code in den Einstellungen ein.', got: () => (save.codes || []).includes('beta') },
    // Lava-Laden: only for Glutsteine
    { id: 'hut-magma',   slot: 'hat',    name: 'Magmahelm',          glut: 200, col: ['#ea580c', '#7c2d12', '#fde047'], desc: 'Ein Grubenhelm wie der von Glimm, nur heißer.' },
    { id: 'jacke-asche', slot: 'jacket', name: 'Aschejacke',         glut: 150, col: ['#57534e', '#292524', '#f97316'], desc: 'Grau wie Asche, mit glühenden Nähten.' },
    { id: 'pose-glut',   slot: 'bob',    name: 'Glut-Pose',          glut: 80,  col: '#f97316', desc: 'Glüht auf der Lava wie ein Stück Kohle.' },
    { id: 'hut-obsidian', slot: 'hat',   name: 'Obsidiankrone',      glut: 1500, col: ['#1e1b4b', '#0f0a1e', '#a78bfa'], sparkle: true, desc: 'Aus schwarzem Vulkanglas geschliffen. Funkelt lila.' },
    { id: 'jacke-lava',  slot: 'jacket', name: 'Lavamantel',         col: ['#b91c1c', '#450a0a', '#fb923c'], desc: 'Hält warm. Viel zu warm.', ach: 'Grabe bis Tiefe 5 der Glutgrotte.', got: () => (save.caveDepth | 0) >= 5 },
    { id: 'pose-monster', slot: 'bob',   name: 'Monster-Pose',       col: '#f43f5e', desc: 'Für Angler, die Großes vorhaben.', ach: 'Fange einen Monster-Fisch.', got: () => (save.monsters || 0) >= 1 },
    { id: 'pose-gold',   slot: 'bob',    name: 'Goldene Pose',       col: '#facc15', desc: 'Glänzt, wenn ein Fisch anbeißt.', ach: 'Erreiche Level 10.', got: () => save.lvl >= 10 || save.rebirths > 0 },
    { id: 'pose-regen',  slot: 'bob',    name: 'Regenbogen-Pose',    col: null, desc: 'Wechselt ständig die Farbe.', ach: 'Entdecke 20 verschiedene Fische.', got: () => FISH.filter(f => save.dex[f.id]).length >= 20 },
  ];
  trAll(COSMETICS, ['name', 'desc', 'ach']);
  const COSM = Object.fromEntries(COSMETICS.map(c => [c.id, c]));
  const SLOT_NAMES = { hat: tr('Hut'), jacket: tr('Jacke'), bob: tr('Pose'), boat: tr('Boot') };
  if (!save.cosm || typeof save.cosm !== 'object') save.cosm = { owned: [] };
  if (!Array.isArray(save.cosm.owned)) save.cosm.owned = [];
  if (!save.cosm.st || typeof save.cosm.st !== 'object') save.cosm.st = {};
  const cosmStat = k => save.cosm.st[k] || 0;
  function cosmCount(k) { save.cosm.st[k] = cosmStat(k) + 1; }
  // achievements: unlock cosmetics as soon as their condition holds (checked after catches etc.)
  function checkCosm(quiet) {
    const got = [];
    for (const c of COSMETICS) {
      if (!c.got || save.cosm.owned.includes(c.id)) continue;
      let ok = false; try { ok = c.got(); } catch { /* data not there yet */ }
      if (ok) { save.cosm.owned.push(c.id); got.push(c); }
    }
    if (!got.length || quiet) return got;
    setTimeout(() => toast(got.length === 1
      ? tr('🎁 Freigeschaltet: {c}! Anziehen im Kleiderschrank (K oder auf dich klicken).', { c: got[0].name })
      : tr('🎁 {n} neue Kosmetik-Teile freigeschaltet! Schau in den Kleiderschrank (K).', { n: got.length })), 2200);
    persist();
    return got;
  }
  // free choices in the wardrobe: skin tone and hair/beard colour [main, shade(, nose)]
  const SKINS = { hell: ['#f2c9a0', '#d9a47a', '#e8a87c'], rosa: ['#f5d0c5', '#e0a99a', '#e79b8f'], oliv: ['#d6a77a', '#b98559', '#c98e63'], braun: ['#a8714a', '#865534', '#94603d'], dunkel: ['#6e4429', '#52301b', '#5d3820'] };
  const HAIRS = { braun: ['#7c4a24', '#a0662f'], blond: ['#d4a72c', '#f0cc5a'], schwarz: ['#1f1a17', '#3a302a'], rot: ['#b4441c', '#d9682f'], grau: ['#8b8f97', '#b3b7bf'], weiss: ['#e5e7eb', '#f8fafc'] };
  const SKIN_NAMES = { hell: tr('Hell'), rosa: tr('Rosig'), oliv: tr('Oliv'), braun: tr('Braun'), dunkel: tr('Dunkel') };
  const HAIR_NAMES = { braun: tr('Braun'), blond: tr('Blond'), schwarz: tr('Schwarz'), rot: tr('Rot'), grau: tr('Grau'), weiss: tr('Weiß') };
  const myLook = () => ({ tier: Math.min(HATS.length - 1, save.rebirths), hat: save.cosm.hat, jacket: save.cosm.jacket, bob: save.cosm.bob, skin: save.cosm.skin, hair: save.cosm.hair });
  function bobColor(id) {
    const c = COSM[id];
    if (!c || c.slot !== 'bob') return '#ef4444';
    return c.col || ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'][Math.floor(t * 4) % 6];
  }
  const lookFrames = new Map();
  function playerFrames(look = myLook()) {
    const tier = Math.max(0, Math.min(HATS.length - 1, look.tier | 0));
    const hat = COSM[look.hat] && COSM[look.hat].slot === 'hat' ? COSM[look.hat] : null;
    const jacket = COSM[look.jacket] && COSM[look.jacket].slot === 'jacket' ? COSM[look.jacket] : null;
    const skin = SKINS[look.skin] ? look.skin : 'hell', hair = HAIRS[look.hair] ? look.hair : 'braun';
    const key = `${hat ? hat.id : tier}|${jacket ? jacket.id : ''}|${skin}|${hair}`;
    if (!lookFrames.has(key)) {
      const [h, H, l] = hat ? hat.col : HATS[tier], pal = { ...PLAYER_PAL, h, H, l };
      if (jacket) { const [c, C, y] = jacket.col; Object.assign(pal, { c, C, y }); }
      const [s, S, r] = SKINS[skin], [B, b] = HAIRS[hair];
      Object.assign(pal, { s, S, r, B, b });
      lookFrames.set(key, [false, true].map(flip => PLAYER_LEGS.map(g => bake(PLAYER_BODY.concat(g), pal, flip))));
    }
    return lookFrames.get(key);
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
  const BEALIN_BODY = bake(...ART.bealin);
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
    if (onSea() || inLava()) return; // out at sea we are on his boat, and he never goes underground
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
  const BOTTLE = bake(...ART.bottle);

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
    if (inLava()) { renderCave(dark); return; }
    const skyTop = top.match(/\d+/g).map(Number), skyBot = bot.match(/\d+/g).map(Number);
    bands(bg, 0, HORIZON, Array.from({ length: 9 }, (_, i) => mix(skyTop, skyBot, i / 8)));
    const w0 = [[70, 165, 210], [16, 44, 86]], w1 = [[8, 40, 80], [4, 10, 28]];
    const wa = w0.map((c, i) => c.map((v, j) => lerp(v, w0[1][j], dark)))[0];
    const wb = w1.map((c, i) => c.map((v, j) => lerp(v, w1[1][j], dark)))[0];
    bands(bg, HORIZON, H, Array.from({ length: 10 }, (_, i) => mix(wa, wb, Math.pow(i / 9, .8))));
    if (onSea()) { // open sea: no land in sight, just long swells and a ship far away
      const sw = mix([40, 120, 170], [10, 30, 60], dark), swL = mix([150, 210, 235], [40, 70, 110], dark);
      for (let i = 0; i < 14; i++) {
        const y = HORIZON + 3 + i * i * .55, x0 = (i * 53) % 90 - 20;
        for (let x = x0; x < W; x += 70 + (i % 3) * 20) { bg.fillStyle = sw; bg.fillRect(x, snap(y), 22 + i * 2, .5); bg.fillStyle = swL; bg.fillRect(x + 4, snap(y) - .5, 10 + i, .5); }
      }
      const ship = mix([60, 72, 92], [20, 26, 40], dark);
      bg.fillStyle = ship; bg.fillRect(250, HORIZON - 2, 16, 2); bg.fillRect(254, HORIZON - 4, 7, 2); bg.fillRect(258, HORIZON - 6.5, 1.5, 2.5);
      return;
    }
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
    const grey = wx.id === 'regen' || wx.id === 'gewitter' || wx.id === 'schnee';
    const body = night ? (grey ? '#3b4660' : '#4b5d80') : grey ? '#a3adbd' : '#ffffff', under = night ? '#34425e' : grey ? '#7b879a' : '#bfdcf2', halo = night ? '#64748b' : grey ? '#94a3b8' : '#e0f2fe';
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

  // ------------------------------------------------------------------ weather on screen
  const drops = Array.from({ length: 130 }, () => ({ x: Math.random() * (W + 40), y: Math.random() * H, v: 170 + Math.random() * 90 }));
  const fogBanks = Array.from({ length: 8 }, (_, i) => ({ x: Math.random() * W, y: HORIZON - 14 + i * 11, w: 70 + Math.random() * 90, v: 2 + Math.random() * 4 }));
  const flakes = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 10 + Math.random() * 14, s: Math.random() * 7 }));
  const meteors = []; let nextMeteor = 1;
  let flash = 0, bolt = null, nextBolt = 3;
  function updateWeather(dt) {
    if (wx.id === 'wind') for (const d of drops) { d.x += d.v * 1.6 * dt; if (d.x > W + 20) { d.x = -20 - Math.random() * 40; d.y = Math.random() * H; } }
    if (wx.id === 'schnee') for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(t * 1.3 + f.s) * 6 * dt - 3 * dt; if (f.y > H + 2) { f.y = -2; f.x = Math.random() * W; } if (f.x < -2) f.x = W + 2; }
    for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; if (m.life <= 0) meteors.splice(i, 1); }
    if (wx.id === 'sterne' && isNight() && !document.hidden) {
      nextMeteor -= dt;
      if (nextMeteor <= 0) { nextMeteor = .8 + Math.random() * 2.4; meteors.push({ x: 20 + Math.random() * (W - 40), y: 4 + Math.random() * 30, vx: -90 - Math.random() * 60, vy: 35 + Math.random() * 25, life: .55 }); }
    }
    const rainy = wx.id === 'regen' || wx.id === 'gewitter';
    if (rainy) {
      for (const d of drops) {
        d.y += d.v * dt; d.x -= d.v * .22 * dt;
        if (d.y > H + 6) { d.y = -6 - Math.random() * 30; d.x = Math.random() * (W + 40); }
      }
      if (Math.random() < dt * (wx.id === 'gewitter' ? 9 : 5)) ripples.push({ x: DOCK_END + Math.random() * (W - DOCK_END), r: .5, life: .5, max: .5 });
    }
    for (const f of fogBanks) { f.x += f.v * dt; if (f.x > W + 20) f.x = -f.w - 20; }
    flash = Math.max(0, flash - dt * 2.2);
    if (wx.id === 'gewitter' && !document.hidden) {
      nextBolt -= dt;
      if (nextBolt <= 0) {
        nextBolt = 5 + Math.random() * 9; flash = 1;
        let x = 30 + Math.random() * (W - 60), y = 0; bolt = [[x, y]];
        while (y < HORIZON - 3) { y = Math.min(HORIZON - 2, y + 4 + Math.random() * 7); x += (Math.random() - .5) * 12; bolt.push([x, y]); }
        setTimeout(() => { noise(1.6, .3, 160); tone(52, 1.3, 'sine', .12, -16); }, 250 + Math.random() * 900);
      }
    }
  }
  function drawWeatherSky(dark) {
    const cover = { regen: .35, gewitter: .55, nebel: .2, schnee: .25 }[wx.id] || 0;
    if (cover) { ctx.globalAlpha = cover; px(0, 0, W, HORIZON + 1, dark > .5 ? '#0b1020' : '#64748b'); ctx.globalAlpha = 1; }
    if (wx.id === 'hitze') { ctx.globalAlpha = .32 * (1 - dark); px(0, 0, W, HORIZON + 1, '#f97316'); ctx.globalAlpha = 1; }
    for (const m of meteors) { // shooting stars: a bright head with a fading tail
      for (let i = 0; i < 7; i++) { ctx.globalAlpha = Math.min(1, m.life * 3) * (1 - i / 7); px(m.x - m.vx * i * .012, m.y - m.vy * i * .012, 1, 1, i ? '#c7d2fe' : '#ffffff'); }
      ctx.globalAlpha = 1;
    }
    if (wx.id === 'bogen' && dark < .85) { // rainbow over the water
      ctx.lineWidth = 2;
      ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'].forEach((c, i) => {
        ctx.globalAlpha = .38 * (1 - dark); ctx.strokeStyle = c;
        ctx.beginPath(); ctx.arc(W * .62, HORIZON + 26, 92 - i * 2, Math.PI, 2 * Math.PI); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    if (bolt && flash > .35) {
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1; ctx.globalAlpha = Math.min(1, flash * 1.4);
      ctx.beginPath(); bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  function drawWeatherFront(dark) {
    if (wx.id === 'regen' || wx.id === 'gewitter') {
      ctx.strokeStyle = dark > .5 ? 'rgba(148,163,184,.45)' : 'rgba(226,240,255,.6)'; ctx.lineWidth = .5;
      ctx.beginPath();
      const n = wx.id === 'gewitter' ? drops.length : 75;
      for (let i = 0; i < n; i++) { const d = drops[i]; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 1.6, d.y - 6); }
      ctx.stroke();
    }
    if (wx.id === 'wind') {
      ctx.strokeStyle = dark > .5 ? 'rgba(148,163,184,.45)' : 'rgba(255,255,255,.7)'; ctx.lineWidth = .5;
      ctx.beginPath();
      for (let i = 0; i < 40; i++) { const d = drops[i]; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 14, d.y + Math.sin(t * 3 + i) * .8); }
      ctx.stroke();
    }
    if (wx.id === 'schnee') for (const f of flakes) px(f.x, f.y, 1.5, 1.5, dark > .5 ? '#cbd5e1' : '#ffffff');
    if (wx.id === 'hitze' && dark < .7) { ctx.globalAlpha = .1; px(0, 0, W, H, '#fb923c'); ctx.globalAlpha = 1; }
    if (wx.id === 'nebel') {
      const c = dark > .5 ? '#64748b' : '#e2e8f0';
      ctx.globalAlpha = .2; px(0, 0, W, H, c);
      ctx.fillStyle = c;
      for (const f of fogBanks) { ctx.globalAlpha = .2; ctx.beginPath(); ctx.ellipse(f.x + f.w / 2, f.y, f.w / 2, 5, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (flash > 0) { ctx.globalAlpha = flash * .4; px(0, 0, W, H, '#f8fafc'); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ the open sea: Bealin's boat
  // boat skin „David Hasselhoff“: a giant pixel man swimming on his belly, you stand on his back
  const hoffImg = new Image(); hoffImg.src = 'img/boot-hoff.png';
  let hoffNight = null, hoffWet = null;
  function drawHoffBoat(dark) {
    if (!hoffImg.complete || !hoffImg.naturalWidth) return false;
    const w = hoffImg.naturalWidth / 2, h = hoffImg.naturalHeight / 2;
    if (!hoffNight) { // a darker copy for the night, blended in with the darkness
      hoffNight = document.createElement('canvas'); hoffNight.width = hoffImg.naturalWidth; hoffNight.height = hoffImg.naturalHeight;
      const x = hoffNight.getContext('2d'); x.drawImage(hoffImg, 0, 0);
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(10, 16, 40, .65)'; x.fillRect(0, 0, hoffNight.width, hoffNight.height);
      hoffWet = document.createElement('canvas'); hoffWet.width = hoffNight.width; hoffWet.height = hoffNight.height;
      const y = hoffWet.getContext('2d'); y.drawImage(hoffImg, 0, 0);
      y.globalCompositeOperation = 'source-atop'; y.fillStyle = '#1e3a5f'; y.fillRect(0, 0, hoffWet.width, hoffWet.height);
    }
    ctx.drawImage(hoffImg, -2, 62, w, h);
    if (dark > .02) { ctx.globalAlpha = Math.min(1, dark); ctx.drawImage(hoffNight, -2, 62, w, h); ctx.globalAlpha = 1; }
    // the part under the waterline looks wet, with foam along the body
    ctx.save(); ctx.beginPath(); ctx.rect(-2, SURFACE + .5, w, h); ctx.clip();
    ctx.globalAlpha = .45; ctx.drawImage(hoffWet, -2, 62, w, h); ctx.restore(); ctx.globalAlpha = .7;
    for (let i = 0; i < 18; i++) px(2 + i * 8 + Math.sin(t * 3 + i) * 1.5, SURFACE - .5 + (i % 2) * .5, 2.5, .5, '#f8fafc');
    ctx.globalAlpha = 1;
    // his feet kick up a little spray now and then
    if (Math.random() < .08) particles.push({ x: 2 + Math.random() * 10, y: SURFACE - 1, vx: (Math.random() - .5) * 20, vy: -20 - Math.random() * 25, life: .6, c: '#f8fafc' });
    return true;
  }
  function drawBoat(dark) {
    if (save.cosm.boat === 'boot-hoff' && drawHoffBoat(dark)) return;
    const k = '#1b1f2e', bowX = DOCK_END + 14, bottom = SURFACE + 7;
    const hull = mix([38, 72, 124], [16, 26, 46], dark), hullL = mix([84, 124, 176], [28, 42, 66], dark), hullD = mix([24, 46, 84], [10, 16, 30], dark);
    const red = mix([190, 40, 40], [72, 22, 28], dark), white = mix([226, 232, 240], [84, 92, 112], dark);
    const wood = mix([168, 112, 64], [74, 54, 42], dark), woodL = mix([196, 140, 86], [92, 68, 52], dark), woodD = mix([118, 74, 42], [52, 38, 30], dark);
    // mast with a furled sail and a pennant
    const mx = 72;
    px(mx - .5, DOCK_Y - 72, 2.5, 72, k); px(mx, DOCK_Y - 71.5, 1.5, 71.5, woodD); px(mx, DOCK_Y - 71.5, .5, 71.5, woodL);
    px(mx - 20, DOCK_Y - 50, 42, 1.5, k); px(mx - 19.5, DOCK_Y - 49.5, 41, .5, woodL);
    px(mx - 19, DOCK_Y - 53, 40, 3, k); px(mx - 18.5, DOCK_Y - 52.5, 39, 2, white);
    for (let i = 0; i < 7; i++) px(mx + 2 + i, DOCK_Y - 72 + i * .15 + Math.sin(t * 6 - i * .8) * .6, 1, 2 - i * .2, '#ef4444');
    // cabin
    px(38.5, DOCK_Y - 16.5, 27, 16.5, k); px(39, DOCK_Y - 16, 26, 16, white); px(39, DOCK_Y - 16, 26, .5, '#ffffff');
    px(37, DOCK_Y - 19, 30, 3, k); px(37.5, DOCK_Y - 18.5, 29, 2, red);
    for (const wxp of [42, 55]) { px(wxp - .5, DOCK_Y - 12.5, 6, 5, k); px(wxp, DOCK_Y - 12, 5, 4, dark > .3 ? '#fde68a' : '#93c5fd'); px(wxp, DOCK_Y - 12, 2, 1, 'rgba(255,255,255,.6)'); }
    // hull: the bow slants back toward the waterline
    for (let y = DOCK_Y + 2; y < bottom; y += .5) {
      const right = bowX - (y - DOCK_Y) / (bottom - DOCK_Y) * 16;
      px(-1, y, right + 1, .5, y < SURFACE - 2 ? hull : hullD);
      px(right - .5, y, 1, .5, k);
    }
    px(-1, DOCK_Y + 2, bowX, .5, hullL);
    px(-1, SURFACE - 2, bowX - 9, 1.5, red);
    for (let x = 12; x < DOCK_END - 2; x += 22) { px(x - .5, DOCK_Y + 3, 3.5, 3, k); px(x, DOCK_Y + 3.5, 2.5, 2, dark > .3 ? '#fde68a' : '#bae6fd'); }
    // deck and railing
    px(-1, DOCK_Y - .5, bowX + .5, 3, k); px(-1, DOCK_Y, bowX, 2, wood); px(-1, DOCK_Y, bowX, .5, woodL);
    for (let x = 3; x < bowX; x += 8) px(x, DOCK_Y, .5, 2, woodD);
    for (let x = 2; x < bowX - 3; x += 12) px(x, DOCK_Y - 6, .75, 6, woodD);
    px(0, DOCK_Y - 6.5, bowX - 2, .75, woodL);
    // foam where the bow meets the water
    ctx.globalAlpha = .7;
    for (let i = 0; i < 6; i++) px(bowX - 13 + i * 2 + Math.sin(t * 3 + i) * 1.5, SURFACE - .5 + (i % 2) * .5, 2, .5, '#f8fafc');
    ctx.globalAlpha = 1;
    // bow lantern
    const lx = bowX - 6;
    px(lx - .5, DOCK_Y - 12, 2, 12, k); px(lx, DOCK_Y - 11.5, 1, 11.5, woodD);
    px(lx - 2, DOCK_Y - 17, 5, 5.5, k); px(lx - 1.5, DOCK_Y - 16.5, 4, 4.5, dark > .3 ? '#fde68a' : '#9fb4c8');
    if (dark > .3) {
      const glow = ctx.createRadialGradient(lx + .5, DOCK_Y - 14, 1, lx + .5, DOCK_Y - 14, 36);
      glow.addColorStop(0, `rgba(253, 230, 138, ${.32 * dark})`); glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
      ctx.fillStyle = glow; ctx.fillRect(lx - 36, DOCK_Y - 50, 72, 72);
    }
  }
  function drawWheel(dark) { // the steering wheel on deck: back to the dock
    drawArt('wheel_' + Math.round((Math.sin(t * .8) + 1) * 2), 5.5, DOCK_Y - 22, dark); // five baked turns of the wheel
  }
  function drawRift(dark) { // a rock in the water with a glowing crack: the way down into the Glutgrotte
    const x0 = 196, by = SURFACE + 1, open = lavaOpen();
    drawArt('rift', x0 - .5, by - 13.5, dark);
    const glow = open ? (Math.sin(t * 3) > 0 ? '#fdba74' : '#f97316') : '#57534e';
    for (const [x, y] of [[8, 11], [8.5, 10], [9, 9], [8.5, 8], [9, 7], [9.5, 6], [9, 5], [9.5, 4], [10, 3], [9.5, 2]]) px(x0 + x, by - y, 1, 1, glow);
    if (open) { px(x0 + 9, by - 7, .5, .5, '#fef08a'); if (Math.sin(t * 2.3) > .6) px(x0 + 9 + Math.sin(t * 5), by - 13 - (t * 6) % 6, .5, .5, '#fdba74'); }
    drawGlimm(x0 + 3.5, by - 12, dark);
  }
  // Glimm: an old mole with a miner's helmet who lives on the glowing rock and knows the way down
  const GLIMM = bake(...ART.glimm);
  let glimmTalk = 0, glimmLine = '', glimmGo = 0;
  const GLIMM_SAY = {
    locked: ['Da unten ist es heißer als im Kiosk-Kaffee. Komm nach deinem ersten Prestige wieder.', 'Ohne Prestige lass ich keinen runter. Die Lava ist nichts für Anfänger.', 'Ich bin Glimm. Ich grabe. Und ich warte, bis du Prestige hast.'],
    down: ['Unten verkauft Glutflosse Lavaruten – die erste gibt’s für Taler.', 'Halt dich fest – ab in die Glutgrotte!', 'Kopf einziehen, da unten hängen Tropfsteine!', 'Runter geht’s. Nimm eine Lavarute mit, sonst schmilzt dir alles.'],
    up: ['Ich hab Arbeit für dich!', 'Schau mal, was ich für dich habe.', 'Hilf mir, dann zahl ich gut.'],
  };
  function talkGlimm() {
    if (glimmGo) return;
    const where = inLava() ? 'up' : lavaOpen() ? 'down' : 'locked';
    glimmLine = tr(pick(GLIMM_SAY[where])); glimmTalk = 3;
    tone(160, .08, 'square', .07, 40); setTimeout(() => tone(240, .1, 'square', .07, -30), 90);
    if (where === 'up') { setTimeout(() => { if (state === 'idle' && $('prog').hidden) { toggleModal('prog'); const h = $('glimm-sec'); if (h) h.scrollIntoView({ block: 'start' }); } }, 500); return; }
    if (where !== 'locked' && state === 'idle') glimmGo = setTimeout(() => { glimmGo = 0; glimmTalk = 0; travel('lava'); }, 1300);
  }
  function drawGlimm(x, footY, dark) {
    const bob = glimmTalk > 0 ? Math.abs(Math.sin(t * 9)) * .5 : 0;
    ctx.drawImage(GLIMM, snap(x), snap(footY - 10 - bob), 9, 10);
    if (Math.sin(t * 2.2) > .3) { ctx.globalAlpha = .35; px(x - 2, footY - 8.5 - bob, 2, 1, '#fef9c3'); ctx.globalAlpha = 1; } // helmet lamp beam
    if (glimmTalk > 0) {
      setFont('6px Poppins, sans-serif');
      const bw = Math.ceil(ctx.measureText(glimmLine).width) + 4, bx = snap(Math.max(1, Math.min(W - bw - 1, x + 4 - bw / 2))), byy = snap(footY - 21);
      ctx.globalAlpha = Math.min(1, glimmTalk * 3);
      px(bx - .5, byy - .5, bw + 1, 9, '#0f172a'); px(bx, byy, bw, 8, '#fffbeb'); px(snap(x + 4), byy + 8, 2, 1.5, '#0f172a');
      ctx.fillStyle = '#0f172a'; ctx.textBaseline = 'top'; ctx.fillText(glimmLine, bx + 2, byy + 1);
      ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    }
  }
  function drawLadder(dark) { // the ladder up out of the cave, back to the dock
    drawArt('ladder', 4.5, DOCK_Y - 28, dark * .4);
  }
  // the Glutgrotte: a rock ceiling with stalactites instead of sky, basalt columns and a lake of lava
  function renderCave(dark) {
    const d = dark * .35, k = (caveDepth() - 1) / (CAVE_DEPTHS.length - 1); // deeper = redder and hotter
    bands(bg, 0, HORIZON, Array.from({ length: 9 }, (_, i) => mix([22 - k * 8, 16 - k * 8, 20 - k * 8], [86 + k * 70, 40 - k * 10, 26 - k * 10], Math.pow(i / 8, 1.6) * (1 - d))));
    const st = mix([40, 30, 30], [24, 18, 20], d), stL = mix([74, 54, 46], [40, 30, 30], d);
    for (let i = 0; i < 26; i++) {
      const x = (i * 61) % W + (i % 3) * 2, len = 8 + (i * 37) % 26, w = 3 + (i * 13) % 5;
      for (let y = 0; y < len; y += .5) { const hw = snap(w * (1 - y / len)); bg.fillStyle = st; bg.fillRect(snap(x - hw), y, hw * 2 + .5, .5); bg.fillStyle = stL; bg.fillRect(snap(x - hw), y, .5, .5); }
    }
    const col = mix([46, 30, 30], [28, 20, 22], d), colL = mix([96, 52, 38], [54, 32, 28], d);
    for (let x = 120; x < W; x += 9) {
      const h = 6 + ((x * 7) % 17);
      bg.fillStyle = col; bg.fillRect(x, HORIZON - h, 8, h + 1); bg.fillStyle = colL; bg.fillRect(x, HORIZON - h, 8, .5); bg.fillRect(x + 7, HORIZON - h, .5, h);
    }
    if (k >= .5) for (let i = 0; i < 18; i++) { // glowing crystals in the ceiling from depth 3
      const x = (i * 47 + 13) % W, y = 4 + (i * 23) % 30, c = i % 2 ? '#a5f3fc' : '#f0abfc';
      bg.fillStyle = c; bg.fillRect(x, y, 1, 1.5); bg.fillStyle = '#ffffff'; bg.fillRect(x, y, .5, .5);
    }
    bands(bg, HORIZON, H, Array.from({ length: 10 }, (_, i) => mix([253, 186 + k * 50, 74 + k * 90], [124 + k * 60, 22 + k * 10, 12], Math.pow(i / 9, .7))));
    const crust = mix([70, 30, 22], [50, 22, 18], d);
    for (let i = 0; i < 22; i++) {
      const y = HORIZON + 4 + (i * i * .7) % (H - HORIZON - 6), x = (i * 89) % W;
      bg.fillStyle = crust; bg.fillRect(x, snap(y), 10 + (i % 4) * 5, 1 + (i % 2) * .5);
    }
  }
  function drawLedge(dark) { // a basalt ledge to stand on, instead of the dock
    const k = '#1b1f2e', rock = '#3f3533', rockL = '#6b5b53', rockD = '#2a2220', glow = '#f97316';
    px(0, DOCK_Y - .5, DOCK_END + .5, H - DOCK_Y + .5, k);
    px(0, DOCK_Y, DOCK_END, H - DOCK_Y, rock);
    px(0, DOCK_Y, DOCK_END, 1, rockL);
    for (let x = 4; x < DOCK_END - 4; x += 11) { px(x, DOCK_Y + 3 + (x % 3), 6, .5, rockD); px(x + 3, DOCK_Y + 7, 5, .5, rockD); }
    for (let x = 0; x < DOCK_END; x += 7) px(x + 2, SURFACE + 3, 4, H - SURFACE, rockD);
    ctx.globalAlpha = .55 + .25 * Math.sin(t * 2); px(DOCK_END - .5, SURFACE - 1, 1, H - SURFACE + 1, glow); px(0, H - 3, DOCK_END, 3, '#c2410c'); ctx.globalAlpha = 1;
  }
  function drawBuoy(dark) { // red-white buoy near Bealin: the way out to the open sea
    const bx = 290, by = SURFACE - 6 + Math.sin(t * 2) * .8;
    drawArt('buoy', bx - 3.5, by - 9, dark);
    const locked = !seaOpen();
    for (let i = 0; i < 5; i++) px(bx + .5 + i, by - 9 + i * .1 + Math.sin(t * 5 - i) * .4, 1, 3.5 - i * .5, locked ? '#64748b' : '#facc15');
    if (dark > .3 && !locked && Math.sin(t * 3) > 0) px(bx - 1, by - 11, 2, 2, '#fde68a');
  }
  function travel(to) {
    if (state !== 'idle') return;
    if (to === 'see' && !seaOpen()) { toast(tr('🔒 Die Hohe See gibt es ab der 3. Wiedergeburt. Bealin wartet so lange.')); return; }
    if (to === 'lava' && !lavaOpen()) { toast(tr('🔒 Die Glutgrotte öffnet sich erst nach dem 1. Prestige. Der Spalt ist noch zu heiß.')); return; }
    save.map = to; save.seaSeen = save.seaSeen || to === 'see'; save.lavaSeen = save.lavaSeen || to === 'lava'; persist();
    wx = currentWeather();
    bgKey = ''; player.x = 90; player.dir = 1; boss.invite = null; $('btn-boss').hidden = true;
    const st = $('stage'); st.classList.remove('travel'); void st.offsetWidth; st.classList.add('travel');
    sfx.whoosh(); setTimeout(() => sfx.splash(), 300);
    toast(to === 'see' ? tr('⛵ Leinen los! Willkommen auf Hoher See – hier beißen andere Fische.')
      : to === 'lava' ? tr('🌋 Willkommen in der Glutgrotte! Hier beißen ganz neue Fische – und die Lava ist heiß.') : tr('⚓ Zurück am Steg.'));
    updateMapUi();
    if (save.lobby) lobbySync();
  }

  // the Odfisch rises out of the water during the boss fight
  function drawBoss(dark) {
    if (boss.rise <= 0 || !bossImg.complete || !bossImg.naturalWidth) return;
    const w = bossImg.naturalWidth / 2, h = bossImg.naturalHeight / 2, ph = boss.on ? bossPhase() : 1;
    boss.x = W - 78 + Math.sin(t * .6) * 8 + (reel.thrash && boss.on ? Math.sin(t * 40) * 1.5 : 0) + (boss.stun > 0 ? 14 : 0);
    const leap = Math.sin(Math.min(1, bossFx.jump) * Math.PI) * 14, sinkY = bossFx.sink * h * .9;
    const top = SURFACE - h * .8 * boss.rise + (1 - boss.rise) * 10 + Math.sin(t * 1.4) * 1.5 - leap + sinkY;
    if (ph === 3) { ctx.globalAlpha = .14 + .08 * Math.sin(t * 6); disc(boss.x, top + h * .5, w * .4, '#ef4444'); ctx.globalAlpha = 1; }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SURFACE + 1); ctx.clip();
    const tilt = (reel.thrash && boss.on ? Math.sin(t * 30) * .06 : 0) + (cine.on && cine.kind === 'win' ? Math.sin(cine.t * 8) * .08 : 0);
    ctx.translate(boss.x, top + h / 2); ctx.rotate(tilt); ctx.translate(-boss.x, -(top + h / 2));
    ctx.drawImage(bossImg, snap(boss.x - w / 2), snap(top), w, h);
    if (bossFx.flash > 0 && boss.on) { ctx.globalAlpha = Math.min(.55, bossFx.flash); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(bossImg, snap(boss.x - w / 2), snap(top), w, h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    if (ph === 3 && boss.on && Math.sin(t * 5) > -.3) { for (const ex of [-.38, -.25]) { px(boss.x + w * ex - 1.5, top + h * .43 - 1.5, 3, 3.5, '#ef4444'); px(boss.x + w * ex - .5, top + h * .43 - 1, 1, 2.5, '#fef08a'); } } // glowing eyes
    ctx.restore();
    if (leap > 4 && Math.random() < .5) splash(boss.x + (Math.random() - .5) * w * .6, SURFACE, 2, '#e0f7ff');
    ctx.save(); ctx.beginPath(); ctx.rect(0, SURFACE + 1, W, H); ctx.clip(); ctx.globalAlpha = .3;
    ctx.drawImage(bossImg, snap(boss.x - w / 2), snap(top), w, h); ctx.restore();
    // foam ring where he breaks the surface
    ctx.globalAlpha = .8;
    for (let i = 0; i < 9; i++) px(boss.x - w * .45 + i * w * .11 + Math.sin(t * 4 + i) * 1.2, SURFACE - .5, 3, .5, '#f8fafc');
    ctx.globalAlpha = 1;
    if (boss.on) bob.x = boss.x - w * .32; // the line hangs at the cat's mouth
  }

  function draw() {
    // legendary catches shake the screen for a moment
    const quake = Math.max(fanfare && fanfare.r === 'legendary' && fanfare.t < .7 ? (1 - fanfare.t / .7) * 3 : 0, reduceMotion ? 0 : boss.quake * 2.5);
    ctx.setTransform(2, 0, 0, 2, Math.round((Math.random() - .5) * quake) * 2, Math.round((Math.random() - .5) * quake) * 2);
    const [top, bot, dark] = skyColors();
    // letterbox continues the scene (sky above, deep water below)
    const deep = mix([8, 40, 80], [4, 10, 28], dark);
    const cave = inLava(), bgTop = cave ? '#161014' : top, bgDeep = cave ? '#7c1d0c' : deep;
    if (bgTop + bgDeep !== lastBg) { lastBg = bgTop + bgDeep; $('stage').style.background = `linear-gradient(${bgTop} 0 50%, ${bgDeep} 50% 100%)`; }
    const key = top + bot + save.map + (inLava() ? caveDepth() : '');
    // at dawn and dusk the colours change every frame; repainting sky and sea 4x a second is plenty
    if (key !== bgKey && (t - bgAt > .25 || t < bgAt || !bgKey)) { bgKey = key; bgAt = t; renderBg(top, bot, dark); }

    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bgC, 0, 0); ctx.restore();
    // sky things stay above the horizon
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, HORIZON + .5); ctx.clip();

    // stars (some bigger ones sparkle as little crosses)
    if (dark > .2 && !cave) stars.forEach(([x, y, s], i) => {
      const tw = .4 + .6 * Math.abs(Math.sin(t * (1 + s) + s * 9));
      ctx.globalAlpha = dark * tw;
      px(x, y, .5, .5, '#fff');
      if (i % 7 === 0 && tw > .8) { px(x - .5, y, 1.5, .5, '#c7d2fe'); px(x, y - .5, .5, 1.5, '#c7d2fe'); }
    });
    ctx.globalAlpha = 1;

    // sun & moon on an arc
    const sunA = (time - .25) * Math.PI * 2;
    const sx = W / 2 - Math.cos(sunA) * 170, sy = HORIZON - Math.sin(sunA) * 80;
    if (sy < HORIZON + 10 && !cave) {
      ctx.globalAlpha = .25; disc(sx, sy, 13, '#fef3c7'); ctx.globalAlpha = 1;
      disc(sx, sy, 9, '#fbbf24'); disc(sx - .5, sy - .5, 8, '#fde68a'); disc(sx - 3, sy - 3, 2.5, '#fffbeb');
    }
    const mx = W / 2 + Math.cos(sunA) * 170, my = HORIZON + Math.sin(sunA) * 80;
    if (my < HORIZON + 10 && !cave) {
      ctx.globalAlpha = .15; disc(mx, my, 11, '#e0e7ff'); ctx.globalAlpha = 1;
      disc(mx, my, 7, '#cbd5e1'); disc(mx - .5, my - .5, 6.5, '#e2e8f0');
      disc(mx + 2, my - 2, 1.5, '#cbd5e1'); disc(mx - 2.5, my + 1.5, 1, '#cbd5e1'); disc(mx + 1, my + 3, .8, '#cbd5e1');
    }

    if (!cave) drawWeatherSky(dark);
    // clouds
    ctx.globalAlpha = .9 - dark * .5;
    if (!cave) for (const c of clouds) cloud(c, dark);
    ctx.globalAlpha = 1;

    // birds by day
    if (dark < .5 && !cave) for (let i = 0; i < 3; i++) {
      const bx = ((t * (8 + i * 2) + i * 140) % (W + 60)) - 30, by = 30 + i * 9 + Math.sin(t + i) * 3;
      const f = Math.sin(t * 8 + i) > 0;
      ctx.fillStyle = '#334155';
      ctx.fillRect(snap(bx), snap(by), .5, .5);
      ctx.fillRect(snap(bx - 1), snap(by - (f ? .5 : 0)), .5, .5); ctx.fillRect(snap(bx - 1.5), snap(by - (f ? 1 : 0)), .5, .5);
      ctx.fillRect(snap(bx + 1), snap(by - (f ? .5 : 0)), .5, .5); ctx.fillRect(snap(bx + 1.5), snap(by - (f ? 1 : 0)), .5, .5);
    }

    ctx.restore();
    // lighthouse beam
    if (dark > .3 && !onSea() && !cave) {
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
      px(x, y, 4 + (i % 4) * 3, .5, cave ? '#fde68a' : dark > .5 ? '#3b5b8a' : '#d4f1ff');
      px(x + 2, y + .5, 2 + (i % 3) * 2, .5, cave ? '#fb923c' : dark > .5 ? '#22385e' : '#7cc4ea');
    }
    ctx.globalAlpha = 1;
    if (cave) for (let i = 0; i < 12; i++) { // lava bubbles pop now and then
      const ph = (t * .7 + i * .37) % 1, bx = (i * 113) % W, by = HORIZON + 4 + (i * 41) % 60;
      if (ph < .2) { px(bx - .5, by - ph * 6, 1.5 + ph * 4, 1 + ph * 3, '#fef08a'); px(bx, by - ph * 6 - .5, .5, .5, '#ffffff'); }
    }
    if (dark < .6 && !cave) for (let i = 0; i < 18; i++) {
      if (Math.sin(t * 3 + i * 7.3) < .85) continue;
      px((i * 97) % W, HORIZON + 3 + (i * 29) % 40, .5, .5, '#ffffff');
    }
    // sun/moon reflection
    const rx = sy < HORIZON ? sx : mx;
    if ((sy < HORIZON || my < HORIZON) && !cave) {
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
    ctx.strokeStyle = cave ? '#fef08a' : '#e0f7ff'; ctx.lineWidth = .5;
    for (const r of ripples) {
      ctx.globalAlpha = (r.life / r.max) * .7;
      ctx.beginPath(); ctx.ellipse(r.x, SURFACE + 1, r.r, r.r * .3, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawBealin(dark);
    drawBoss(dark);
    drawCrit();
    if (onSea()) drawBoat(dark);
    else if (cave) { drawLedge(dark); if (Math.random() < .25) particles.push({ x: Math.random() * W, y: SURFACE + Math.random() * 30, vx: (Math.random() - .5) * 6, vy: -12 - Math.random() * 14, life: .9, c: Math.random() < .5 ? '#fb923c' : '#fde047' }); }
    else { drawDock(dark); drawNpc(); drawKiosk(dark); }
    drawProps(dark);
    drawLobbyAnglers();
    drawPlayer(dark);
    drawLine();

    // particles
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); px(p.x, p.y, 1, 1, p.c); px(p.x + .5, p.y - .5, .5, .5, '#ffffff'); }
    ctx.globalAlpha = 1;
    drawWeatherFront(dark);
    drawFx();
    drawCine();
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
  const welsFrames = [0, 1].map(blink => [0, 1].map(talk => bake(...ART['wels_' + blink + talk])));
  const KIOSK = { x: 40, w: 24 };
  let welsTalk = 0, welsLine = '';
  function welsSay(line, secs = 2.6) { welsLine = line; welsTalk = secs; }

  // ------------------------------------------------------------------ menus as things on the dock
  // No menu buttons: the slot machine, the book on the crate, the trophy on the kiosk roof
  // and the notice board open their menus. Hover shows a label, "!" shows something to collect.
  function drawSlotMachine(dark) {
    const x0 = 3, y = DOCK_Y;
    drawArt('slot', x0 - .5, y - 20, dark);
    for (let i = 0; i < 4; i++) px(x0 + 1.5 + i * 2, y - 17.5, 1, 1, (Math.floor(t * 4) + i) % 2 ? '#fff7cc' : '#b45309');
    const sym = ['#38bdf8', '#fbbf24', '#f472b6', '#4ade80'];
    for (let i = 0; i < 3; i++) { const c = sym[(Math.floor(t * .7) + i * 2) % 4]; px(x0 + 2 + i * 2.3, y - 12, 1.5, 1.5, c); px(x0 + 1.5 + i * 2.3, y - 11.5, .5, .5, c); }
  }
  function drawDexBook(dark) {
    drawArt('dex', 28.5, DOCK_Y - 8.5, dark);
  }
  // the "Steg-Zeitung": a bundle of newspapers on the dock that holds the patch notes
  function drawNewspaper(dark) {
    drawArt('news', 103.5, DOCK_Y - 5.5, dark);
  }
  function drawTrophy(dark) {
    const cx = KIOSK.x + KIOSK.w / 2, yb = DOCK_Y - 37.5;
    drawArt('trophy', cx - 5, yb - 10, dark);
    if (Math.sin(t * 2.2) > .93) { px(cx + 1, yb - 11.5, .5, 2.5, '#fffbeb'); px(cx, yb - 10.5, 2.5, .5, '#fffbeb'); }
  }
  function drawBoard(dark) {
    drawArt('board', 64.5, DOCK_Y - 20, dark);
  }
  const PROPS = [
    { id: 'casino', label: tr('Fischautomat'),  x: 2.5, y: DOCK_Y - 20, w: 12.5, h: 20, draw: drawSlotMachine, open: () => toggleModal('casino') },
    { id: 'patch',  label: tr('Steg-Zeitung (Patch Notes)'), x: 103.5, y: DOCK_Y - 5.5, w: 8, h: 5.5, draw: drawNewspaper, open: () => toggleModal('patch'), ready: () => save.patchSeen !== PATCH_NOTES[0].id && save.total > 0 },
    { id: 'dex',    map: 'all', label: tr('Fischdex & Shinydex'), x: 28.5, y: DOCK_Y - 8.5, w: 8, h: 8.5, draw: drawDexBook, open: () => toggleModal('dex'), ready: () => $('btn-dex').classList.contains('ready') },
    { id: 'lb',     label: tr('Bestenliste'),   x: KIOSK.x + KIOSK.w / 2 - 5, y: DOCK_Y - 48, w: 10, h: 10.5, draw: drawTrophy, open: () => toggleModal('lb') },
    { id: 'prog',   label: tr('Aufträge & Fortschritt'), x: 64.5, y: DOCK_Y - 20, w: 10, h: 20, draw: drawBoard, open: () => toggleModal('prog'), ready: () => $('btn-prog').classList.contains('ready') },
    { id: 'shop',   label: tr('Laden'),         x: KIOSK.x - 3, y: DOCK_Y - 37.5, w: KIOSK.w + 6, h: 37.5, open: () => toggleModal('shop') },
    { id: 'bealin',  label: tr("Käpt'n Bealin"), x: BEALIN.x - 1, y: SURFACE - 16, w: BEALIN.w + 2, h: 18, open: () => talkBealin() },
    { id: 'me',     map: 'all', label: tr('Kleiderschrank'), get x() { return player.x - 5; }, y: DOCK_Y - 26, w: 10, h: 18, open: () => toggleModal('wardrobe') },
    { id: 'buoy',   get label() { return seaOpen() ? tr('⛵ Auf die Hohe See') : tr('⛵ Hohe See (🔒 3× Wiedergeburt)'); }, x: 285, y: SURFACE - 16, w: 12, h: 18, draw: drawBuoy, open: () => travel('see'), ready: () => seaOpen() && !save.seaSeen },
    { id: 'rift',   get label() { return lavaOpen() ? tr('⛏️ Glimm · In die Glutgrotte') : tr('⛏️ Glimm · Glutgrotte (🔒 1× Prestige)'); }, x: 196, y: SURFACE - 24, w: 18, h: 25, draw: drawRift, open: () => talkGlimm(), ready: () => lavaOpen() && !save.lavaSeen },
    { id: 'glimm',  map: 'lava', label: tr('⛏️ Glimm · Aufträge'), x: 19, y: DOCK_Y - 11, w: 10, h: 11, draw: () => drawGlimm(20, DOCK_Y, 1), open: () => talkGlimm(), ready: () => save.glimmQ.some(q => q.p >= q.n) || canDig() },
    { id: 'lavashop', map: 'lava', label: tr('🌋 Glutflosses Lava-Laden'), x: KIOSK.x - 3, y: DOCK_Y - 30, w: KIOSK.w + 6, h: 30, draw: drawLavaStall, open: () => toggleModal('shop') },
    { id: 'ladder', map: 'lava', label: tr('🪜 Zurück zum Steg'), x: 4, y: DOCK_Y - 28, w: 12, h: 28, draw: drawLadder, open: () => travel('steg') },
    { id: 'wheel',  map: 'see', label: tr('⚓ Zurück zum Steg'), x: 5, y: DOCK_Y - 22, w: 15, h: 22, draw: drawWheel, open: () => travel('steg') },
    { id: 'muschel', label: tr('🐚 Magische Miesmuschel'), x: 121, y: SURFACE - 13, w: 13, h: 14, draw: drawMuschelRock, open: () => toggleModal('muschel'), show: () => !!(save.dex.muschel && save.dex.muschel.n) },
    { id: 'npc',    label: 'Spezifischfischer', x: NPC.x - 1, y: DOCK_Y - NPC.h - 2, w: NPC.w + 2, h: NPC.h + 2, open: () => talkNpc() },
  ];
  let hoverProp = null;
  const propOn = p => ((p.map || 'steg') === 'all' || (p.map || 'steg') === save.map) && (!p.show || p.show());
  function propAt(wx, wy) { return PROPS.find(p => propOn(p) && wx > p.x - 1.5 && wx < p.x + p.w + 1.5 && wy > p.y - 1.5 && wy < p.y + p.h + 1.5) || null; }
  function drawProps(dark) {
    for (const p of PROPS) if (p.draw && propOn(p)) p.draw(dark);
    const k = '#1b1f2e';
    for (const p of PROPS) if (propOn(p) && p.ready && p.ready()) {
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

  // The Magische Miesmuschel on a little rock in the water next to the dock (after the first catch)
  const muschelImg = new Image(); muschelImg.src = 'img/miesmuschel.png';
  let muschelNight = null;
  function drawMuschelRock(dark) {
    const x0 = 120, y = SURFACE;
    drawArt('muschelrock', x0 + 1, y - 3.5, dark);
    ctx.globalAlpha = .7; px(x0 + .5 + Math.sin(t * 2) * .5, y + .5, 14, .5, '#e0f2fe'); ctx.globalAlpha = 1;
    if (!muschelImg.complete || !muschelImg.naturalWidth) return;
    const lift = muschelPull > 0 ? Math.sin(muschelPull * Math.PI) * 1.5 : 0;
    muschelPull = Math.max(0, muschelPull - .04);
    ctx.drawImage(muschelImg, x0 + 1.5, y - 13.5 + lift, 12, 10);
    if (dark > .02) {
      if (!muschelNight) {
        muschelNight = document.createElement('canvas'); muschelNight.width = muschelImg.naturalWidth; muschelNight.height = muschelImg.naturalHeight;
        const c = muschelNight.getContext('2d'); c.drawImage(muschelImg, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(10,16,40,.65)'; c.fillRect(0, 0, muschelNight.width, muschelNight.height);
      }
      ctx.globalAlpha = Math.min(1, dark); ctx.drawImage(muschelNight, x0 + 1.5, y - 13.5 + lift, 12, 10); ctx.globalAlpha = 1;
    }
  }
  const MUSCHEL_ANSWERS = ['Nein.', 'Nein.', 'Ja.', 'Vielleicht eines Tages.', 'Ich glaube nicht.', 'Frag später noch einmal.', 'Auf keinen Fall.', 'Gar nichts.',
    'Versuch es noch einmal.', 'Ganz bestimmt.', 'Nur wenn du einen Odfisch fängst.', 'Frag Käpt’n Bealin.', 'Wirf noch einmal aus.'].map(a => tr(a));
  let muschelLast = -1, muschelPull = 0, muschelTimer = 0;
  function muschelAnswer() {
    let i;
    do { i = Math.floor(Math.random() * MUSCHEL_ANSWERS.length); } while (i === muschelLast);
    muschelLast = i;
    return MUSCHEL_ANSWERS[i];
  }
  // Deep voice from the browser's speech synthesis; only on-device voices, so nothing leaves the browser
  function muschelSpeak(text) {
    const synth = window.speechSynthesis;
    if (!save.sound || !synth || !window.SpeechSynthesisUtterance) return;
    const lang = I18N.lang === 'en' ? 'en' : 'de';
    const voices = synth.getVoices().filter(v => v.localService && v.lang.toLowerCase().startsWith(lang));
    if (!voices.length) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voices[0]; u.lang = voices[0].lang; u.pitch = .1; u.rate = .75; u.volume = vol();
    synth.speak(u);
  }
  function renderMuschel() {
    $('muschel-answer').textContent = tr('Stell eine Frage und zieh an der Schnur.');
    $('muschel-answer').classList.remove('said');
    $('muschel-q').value = '';
  }
  function pullMuschel() {
    const q = $('muschel-q').value.trim();
    const a = q ? muschelAnswer() : tr('Du musst mir schon eine Frage stellen.');
    clearTimeout(muschelTimer);
    const img = $('muschel-img'), out = $('muschel-answer');
    img.classList.remove('pull'); void img.offsetWidth; img.classList.add('pull');
    out.textContent = '…'; out.classList.remove('said');
    muschelPull = 1; sfx.plip();
    muschelTimer = setTimeout(() => { out.textContent = a; out.classList.add('said'); muschelSpeak(a); }, 600);
  }
  $('muschel-form').addEventListener('submit', e => { e.preventDefault(); pullMuschel(); });
  $('muschel-img').addEventListener('click', pullMuschel);

  // Glutflosse's stall in the Glutgrotte: basalt counter, glowing roof, a fin peeking out and a LAVA sign
  function drawLavaStall() {
    const x0 = KIOSK.x, w = KIOSK.w, y = DOCK_Y, glow = Math.sin(t * 3) > 0 ? '#fb923c' : '#f97316';
    drawArt('lava_back', x0 + 1, y - 26);
    drawArt('lava_fin', x0 + 8, y - 17 + Math.sin(t * 4) * .8);                  // the shark's fin peeks over the counter
    drawArt('lava_front', x0 - 2.5, y - 30.5);
    for (let i = 0; i < w + 4; i += 4) px(x0 - 2 + i, y - 30, 2, 3.5, glow);     // glowing roof stripes
    px(x0 + 5, y - 7.5, 14, .5, glow);
    ctx.fillStyle = glow; setFont('700 4px Poppins, sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('LAVA', x0 + 12, y - 5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (Math.sin(t * 2.7) > .5) px(x0 + 2 + (t * 7) % (w - 4), y - 31 - (t * 5) % 4, .5, .5, '#fde047'); // sparks over the roof
  }
  function drawKiosk(dark) {
    const x0 = KIOSK.x, x1 = KIOSK.x + KIOSK.w, y = DOCK_Y;
    drawArt('kiosk_back', x0 + 1, y - 30, dark);
    // the catfish (bobs a little, blinks, opens its mouth while talking)
    const blink = (t % 4) < .12 ? 1 : 0, talk = welsTalk > 0 && Math.sin(t * 18) > 0 ? 1 : 0;
    const img = welsFrames[blink][talk], wy = y - 22.5 + Math.round(Math.sin(t * 2.2)) * .5;
    ctx.drawImage(img, x0 + 1, wy, img.width / 2, img.height / 2);
    // barbels (whiskers) from the mouth corners
    ctx.strokeStyle = '#2b3326'; ctx.lineWidth = .5;
    const my = wy + 17, sw = Math.sin(t * 2.6) * 1.2;
    ctx.beginPath(); ctx.moveTo(x0 + 1.5, my); ctx.quadraticCurveTo(x0 - 3, my + 1, x0 - 4 + sw, my + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + 11.5, my); ctx.quadraticCurveTo(x0 + 16, my + 1, x0 + 17 - sw, my + 5); ctx.stroke();
    // counter, goods, posts and awning in front of him; the word on the sign stays translatable
    drawArt('kiosk_front', x0 - 3, y - 37.5, dark);
    ctx.fillStyle = '#7f1d1d'; setFont('700 4px Poppins, sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tr('LADEN'), x0 + 12, y - 5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    px(x1 - 3.5, y - 12, 1, 1, (Math.sin(t * 6) + 1) / 2 > .5 ? '#fff7cc' : '#f59e0b'); // the lure on the counter twinkles
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
    const hatC = COSM[save.cosm.hat];
    if (hatC && hatC.sparkle) { // luxury hats glint now and then
      const ph = (t * 1.3) % 1, sx = x - 3 + ((Math.floor(t * 1.3) * 7) % 7), sy = y - img.height / 2 + 1;
      if (ph < .35) { const a = 1 - Math.abs(ph - .175) / .175; ctx.globalAlpha = a; px(sx, sy - 1, .5, 2.5, '#ffffff'); px(sx - 1, sy, 2.5, .5, '#ffffff'); ctx.globalAlpha = 1; }
    }
    // arm + hand holding the rod
    const tip = rodTip();
    const hx = x + d * 3.5, hy = y - 8.5;
    px(x + (d > 0 ? 1.5 : -3.5), y - 9.5, 2, 1.5, '#c2410c');
    px(hx - .5, hy - .5, 1.5, 1.5, '#f2c9a0');
    const r = rod();
    const col = { stock: '#7c4a1e', bambus: '#a3a34a', carbon: '#1f2937', gold: '#f59e0b', tiefsee: '#0e3a4a', krake: '#7e1d4f' }[r.id] || '#7c4a1e';
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx + .25, hy + .25); ctx.lineTo((hx + tip.x) / 2, (hy + tip.y) / 2); ctx.stroke();
    ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo((hx + tip.x) / 2, (hy + tip.y) / 2); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    // reel
    px(hx + d * 1 - .5, hy + .5, 1.5, 1.5, '#64748b'); px(hx + d * 1 - .5, hy + .5, .5, .5, '#cbd5e1');
    if (r.id === 'bambus') for (let k = .2; k < 1; k += .2) px(hx + (tip.x - hx) * k, hy + (tip.y - hy) * k, .5, .5, '#65652a');
    if (r.id === 'gold') px(tip.x - .25, tip.y - .25, 1, 1, '#fde68a');
  }

  // other anglers in the same multiplayer lobby: drawn a bit see-through, with their name above
  function drawLobbyAnglers() {
    if (!LOBBY.code) return;
    setFont('5px Poppins, sans-serif'); ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
    for (const p of LOBBY.players) {
      if (p.k === LOBBY.me || (p.m || 'steg') !== save.map) continue;
      p.dx = p.dx === undefined ? p.x : p.dx + (p.x - p.dx) * .1;
      const x = snap(p.dx), y = DOCK_Y, d = p.d > 0 ? 1 : -1;
      const img = playerFrames({ tier: p.hat, hat: p.ch, jacket: p.cj, skin: p.sk, hair: p.hr })[d > 0 ? 0 : 1][0];
      ctx.globalAlpha = .8;
      ctx.drawImage(img, x - 5.5, y - img.height / 2, img.width / 2, img.height / 2);
      const hx = x + d * 3.5, hy = y - 8.5, tx = x + d * 15, ty = y - 21;
      ctx.strokeStyle = '#7c4a1e'; ctx.lineWidth = .75;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      if (p.s === 'w' || p.s === 'r') { // line in the water + bobber
        const bx = x + d * (44 + (p.k.charCodeAt(0) % 5) * 6), by = SURFACE + (p.s === 'r' ? Math.sin(t * 30) : Math.sin(t * 2));
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = .3;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + bx) / 2, by - 4, bx, by); ctx.stroke();
        px(bx - .75, by - 1.5, 1.5, 1.5, bobColor(p.cb)); px(bx - .75, by - .25, 1.5, 1, '#f8fafc');
      }
      ctx.globalAlpha = 1;
      const label = p.rk !== undefined ? `${p.name} · ${presMark(p.pr | 0)}${rankOf(p.rk).name}` : p.name;
      const w = Math.ceil(ctx.measureText(label).width) + 4;
      px(x - w / 2, y - 31, w, 7, 'rgba(15,23,42,.75)');
      ctx.fillStyle = '#e2e8f0'; ctx.fillText(label, x, y - 24.5);
      ctx.textAlign = 'left'; drawChatBubble(p.k, x); ctx.textAlign = 'center'; setFont('5px Poppins, sans-serif'); ctx.textBaseline = 'bottom';
    }
    ctx.textAlign = 'left';
    if (LOBBY.me) drawChatBubble(LOBBY.me, player.x);
  }

  function drawLine() {
    if (!['fly', 'wait', 'bite', 'reel', 'boss', 'summon', 'crit'].includes(state) || (state === 'boss' && boss.stun > 0) || (state === 'crit' && crit.out)) return;
    const tip = rodTip();
    const by = state === 'fly' ? bob.y : state === 'boss' ? SURFACE - 8 : state === 'crit' ? crit.ly : SURFACE + bob.dunk * .4;
    const tight = state === 'reel' || state === 'boss' || state === 'crit' ? reel.tension : 0;
    const sag = state === 'fly' ? 0 : (1 - tight) * 18;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + bob.x) / 2, Math.max(tip.y, by) + sag, bob.x, by);
    ctx.stroke();
    // bobber: red cap, white belly, antenna, outline
    const bx = snap(bob.x) - 2, byy = snap(by) - 3;
    const cap = bobColor(save.cosm.bob);
    if (state === 'boss' || state === 'crit') return;
    if (state === 'reel' || state === 'bite') { px(bx + .5, byy + 1.5, 3, 2, '#1b1f2e'); px(bx + 1, byy + 2, 2, 1.5, cap); return; }
    px(bx - .5, byy - .5, 5, 5, '#1b1f2e');
    px(bx, byy, 4, 2, cap); px(bx, byy, 1, 1, 'rgba(255,255,255,.45)');
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
  // "Kurze Zahlen": 1234567 -> 1,2 Mio. in the top bar
  function shortN(n) {
    const a = Math.abs(n), f = (v, u) => v.toLocaleString(I18N.locale, { maximumFractionDigits: v < 10 ? 1 : 0 }) + u;
    return a >= 1e9 ? f(n / 1e9, tr(' Mrd.')) : a >= 1e6 ? f(n / 1e6, tr(' Mio.')) : a >= 1e4 ? f(n / 1e3, tr(' Tsd.')) : String(n);
  }
  // codes: only checksums live here, so the codes can't simply be read in the source
  const CODES = { mq6pzev5x0: { id: 'beta', what: () => tr('Beta-Kappe, Beta-Jacke und Beta-Pose') } };
  function redeemCode() {
    const raw = $('set-code').value, norm = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const c = norm && CODES[cyrb53('code|' + norm)], msg = $('set-code-msg');
    if (!Array.isArray(save.codes)) save.codes = [];
    if (!c) { msg.textContent = tr('Diesen Code gibt es nicht.'); return; }
    if (save.codes.includes(c.id)) { msg.textContent = tr('Diesen Code hast du schon eingelöst.'); return; }
    save.codes.push(c.id); $('set-code').value = '';
    msg.textContent = tr('🎁 Eingelöst: {w}! Anziehen im Kleiderschrank (K).', { w: c.what() });
    [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => tone(n, .14, 'triangle', .08), i * 90));
    checkCosm(true); persist();
  }
  function renderSettings() {
    $('set-code-msg').textContent = '';
    $('set-sound').checked = !!save.sound; $('set-vol').value = Math.round(vol() * 100); $('set-vol').disabled = !save.sound;
    $('set-vol-val').textContent = Math.round(vol() * 100) + ' %';
    $('set-calm').checked = reduceMotion; $('set-calm').disabled = motionPref; $('set-short').checked = !!save.short;
    $('set-tamper').hidden = !save.tampered;
    $('set-autoclose').checked = !!save.autoClose; $('set-autobait').checked = !!save.autoBait; $('set-play').checked = save.showPlay !== false;
  }
  function updateCoins() {
    $('coins').textContent = save.short ? shortN(save.coins) : save.coins; $('shop-coins').textContent = save.coins; $('casino-coins').textContent = save.coins;
    $('glut-pill').hidden = !lavaOpen(); $('glut').textContent = save.glut | 0; $('shop-glut').textContent = save.glut | 0; $('glut-pill').title = tr('Glutsteine: aus Fängen in der Glutgrotte, zum Graben und für Glimms Werkstatt');
  }
  // bait hotbar: every bait you own as a slot; click or press 1-9 to switch (only while idle)
  const ownedBaits = () => BAITS.filter(b => !b.pack || (save.baits[b.id] || 0) > 0);
  function selectBait(id) {
    if (save.bait === id) return;
    if (state !== 'idle') { hint(tr('Erst einholen, dann Köder wechseln'), 1.4); return; }
    save.bait = id; persist(); updateGear(); sfx.tick();
    hint(`🪝 ${bait().name}`, 1.2);
  }
  function updateGear() {
    $('gear').textContent = `${onSea() ? '⛵' : inLava() ? '🌋' : '🎣'} ${rod().name}`;
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
  let lastPlay = '';
  function updatePlayPill() {
    const show = save.showPlay !== false, s = show ? '⏱ ' + fmtPlay(save.playTime) : '';
    $('playtime').hidden = !show;
    const key = s + '|' + Math.floor(sessionTime / 60);
    if (key === lastPlay) return; lastPlay = key;
    $('playtime').textContent = s;
    $('playtime').title = tr('Spielzeit insgesamt: {a} · diese Sitzung: {b}', { a: fmtPlay(save.playTime), b: fmtPlay(sessionTime) });
  }
  function updateClock() {
    const h = Math.floor(time * 24), m = Math.floor((time * 24 % 1) * 60 / 10) * 10;
    const s = `${isNight() ? '🌙' : '☀️'} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (s !== lastClock) { $('clock').textContent = s; lastClock = s; updateWeatherPill(); }
  }
  function weatherText() {
    if (wx === CAVE_WX) return tr('{i} {n}: {d}', { i: wx.icon, n: wx.name, d: wx.desc });
    const left = Math.max(0, Math.ceil((1 - (Date.now() / 1000 / WEATHER_LEN + weatherShift) % 1) * WEATHER_LEN));
    const next = weatherAt(weatherSlot() + 1);
    return tr('{i} {n}: {d}', { i: wx.icon, n: wx.name, d: wx.desc }) + ' · '
      + (next.id === wx.id ? tr('bleibt noch mindestens {m}:{s}', { m: Math.floor(left / 60), s: String(left % 60).padStart(2, '0') })
        : tr('in {m}:{s} kommt {i} {n}', { m: Math.floor(left / 60), s: String(left % 60).padStart(2, '0'), i: next.icon, n: next.name }));
  }
  function updateWeatherPill() {
    const el = $('weather');
    el.firstChild.textContent = wx.icon + ' ';
    $('weather-name').textContent = wx.name;
    el.title = weatherText();
  }
  $('weather').addEventListener('click', () => toast(weatherText()));
  function updateMapUi() { updateGear(); updateWeatherPill(); }

  const anyModal = () => [...document.querySelectorAll('.modal')].some(m => !m.hidden);
  function closeModals() {
    for (const id of ['dex', 'shop', 'casino', 'prog', 'lb', 'cloud', 'box', 'patch', 'lobby', 'wardrobe', 'settings', 'muschel']) $(id).hidden = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function unreadPatches() { // how many entries are new since the last read (at least the newest 3 when nothing is new)
    const i = PATCH_NOTES.findIndex(p => p.id === save.patchSeen);
    return i === 0 ? 3 : i < 0 ? 2 : Math.min(i, 4);
  }
  let patchShown = 0;
  function renderPatch(n) {
    patchShown = Math.max(1, n);
    $('patch-list').replaceChildren(...PATCH_NOTES.slice(0, patchShown).map(p => {
      const box = document.createElement('section'); box.className = 'patch-entry';
      const h = document.createElement('h3'); h.textContent = tr('Update vom {d}', { d: p.date });
      const ul = document.createElement('ul');
      ul.append(...p.items.map(t => Object.assign(document.createElement('li'), { textContent: tr(t) })));
      box.append(h, ul); return box;
    }));
    // older issues of the Steg-Zeitung: five more per click until all are shown
    const left = PATCH_NOTES.length - patchShown;
    $('patch-more').hidden = left <= 0;
    $('patch-more').textContent = tr('📜 Ältere Ausgaben ({n})', { n: left });
  }
  $('patch-more').addEventListener('click', () => { const y = $('patch-list').parentElement.scrollTop; renderPatch(patchShown + 5); $('patch-list').parentElement.scrollTop = y; });
  function toggleModal(id) {
    if (!$('title').hidden || !$('catch').hidden) return;
    if (['charge', 'fly', 'bite', 'reel', 'rhythm', 'boss', 'summon', 'crit'].includes(state)) return;
    const open = $(id).hidden;
    closeModals();
    if (open) { ({ dex: () => { if (dexTab !== 'shiny') dexTab = DEX_AREAS[save.map] ? save.map : 'steg'; document.querySelector('#dex .dexrew').open = dexClaimable().length > 0; renderDex(); }, shop: renderShop, casino: renderCasino, prog: renderProg, lb: openLb, cloud: renderCloud, patch: () => { renderPatch(unreadPatches()); save.patchSeen = PATCH_NOTES[0].id; persist(); }, lobby: renderLobby, wardrobe: renderWardrobe, settings: renderSettings, muschel: renderMuschel })[id](); $(id).hidden = false; }
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
  $('btn-patch').addEventListener('click', () => toggleModal('patch'));
  $('btn-lobby').addEventListener('click', () => toggleModal('lobby'));
  $('lvl').addEventListener('click', () => toggleModal('prog'));
  $('btn-sound').addEventListener('click', () => {
    save.sound = !save.sound; persist();
    $('btn-sound').textContent = save.sound ? '🔊' : '🔇';
    if (!$('settings').hidden) renderSettings();
  });
  $('btn-settings').addEventListener('click', () => toggleModal('settings'));
  $('set-sound').addEventListener('change', () => { if ($('set-sound').checked !== !!save.sound) $('btn-sound').click(); });
  $('set-vol').addEventListener('input', () => {
    save.vol = Math.max(0, Math.min(100, +$('set-vol').value)) / 100; if (master) master.gain.value = vol();
    $('set-vol-val').textContent = Math.round(vol() * 100) + ' %';
  });
  $('set-vol').addEventListener('change', () => { persist(); tone(660, .12, 'triangle', .1); });
  $('set-calm').addEventListener('change', () => { save.calm = $('set-calm').checked; reduceMotion = motionPref || save.calm; persist(); });
  $('set-code-btn').addEventListener('click', redeemCode);
  $('set-autoclose').addEventListener('change', () => { save.autoClose = $('set-autoclose').checked; persist(); });
  $('set-autobait').addEventListener('change', () => { save.autoBait = $('set-autobait').checked; persist(); });
  $('set-play').addEventListener('change', () => { save.showPlay = $('set-play').checked; lastPlay = '-'; updatePlayPill(); persist(); });
  $('set-code').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); redeemCode(); } });
  $('set-short').addEventListener('change', () => { save.short = $('set-short').checked; persist(); updateCoins(); });
  $('start').addEventListener('click', () => {
    audio(); $('title').hidden = true;
    // after an update: returning players get pointed at the new issue of the Steg-Zeitung
    if (save.patchSeen !== PATCH_NOTES[0].id) {
      if (save.seen && save.total > 0) setTimeout(() => toast(tr('📰 Neue Steg-Zeitung! Was sich geändert hat, liegt hinten am Steg (oder N).')), 900);
      else save.patchSeen = PATCH_NOTES[0].id; // new players start with nothing to catch up on
    }
    save.seen = true; persist();
    if (LOBBY.invite) { LOBBY.invite = false; toggleModal('lobby'); }
  });
  let lastFirst = null;
  $('catch-ok').addEventListener('click', () => {
    if ($('catch-ok').disabled) return;
    $('catch').hidden = true; state = 'idle'; hint('');
    if (lastFirst) { // the new fish "flies" into the Fischdex book on the dock
      const bx = 32.5, by = DOCK_Y - 8;
      for (let i = 0; i < 24; i++) glints.push({ x: bx + (Math.random() - .5) * 8, y: by - Math.random() * 4, vx: (Math.random() - .5) * 30, vy: -20 - Math.random() * 30, life: .7 + Math.random() * .6, c: ['#fde047', '#ffffff', '#38bdf8'][i % 3] });
      floaters.push({ x: bx, y: by - 6, text: tr('📖 +1'), c: '#fde047', life: 2 });
      lastFirst = null;
    }
  });

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
  // the highest stake grows with the rebirths; 2 % of every stake goes into the jackpot pot,
  // three Odfische win it on top of the ×150
  const PAIR = 1.5, MIN_BET = 50, BET_CAPS = [2000, 5000, 10000, 25000, 50000], POT_CUT = .02, POT_SEED = 1000;
  const capIdx = () => save.prestige ? BET_CAPS.length - 1 : Math.min(BET_CAPS.length - 1, save.rebirths | 0); // after a prestige the cap stays at the top
  const betCap = () => BET_CAPS[capIdx()];
  const betStep = v => v < 1000 ? 50 : v < 10000 ? 500 : 2500;
  const fmtN = n => Math.round(n).toLocaleString(I18N.locale);
  const pot = () => Math.max(POT_SEED, Math.round(save.jackpot || 0));
  let bet = 100, spinning = false;
  const maxBet = () => Math.min(betCap(), Math.max(MIN_BET, Math.floor(save.coins / 50) * 50));
  function setBet(v) {
    v = Math.round(+v);
    bet = Number.isFinite(v) ? Math.min(betCap(), Math.max(MIN_BET, v)) : MIN_BET;
    renderCasino();
  }
  $('bet-down').addEventListener('click', () => { const st = betStep(bet - 1); setBet(Math.ceil(bet / st) * st - st); });
  $('bet-up').addEventListener('click', () => { const st = betStep(bet); setBet(Math.floor(bet / st) * st + st); });
  $('bet-input').addEventListener('input', e => { const v = Math.round(+e.target.value); if (v >= MIN_BET && v <= betCap()) { bet = v; renderCasino(); } });
  $('bet-input').addEventListener('change', e => setBet(e.target.value));
  $('bet-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); setBet(e.target.value); e.target.blur(); } });
  const quickBet = k => k === 'max' ? maxBet() : k === 'half' ? Math.max(MIN_BET, Math.round(bet / 100) * 50) : k === 'double' ? Math.min(betCap(), bet * 2) : +k;
  $('bets').querySelectorAll('[data-bet]').forEach(btn => btn.addEventListener('click', () => setBet(quickBet(btn.dataset.bet))));
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
    if (bet > betCap()) bet = betCap();
    $('casino-coins').textContent = save.coins;
    $('jackpot-val').textContent = fmtN(pot());
    $('bet-input').disabled = spinning;
    $('bet-input').max = betCap();
    if (document.activeElement !== $('bet-input')) $('bet-input').value = bet;
    $('bet-down').disabled = spinning || bet <= MIN_BET;
    $('bet-up').disabled = spinning || bet >= betCap();
    $('bets').querySelectorAll('[data-bet]').forEach(btn => {
      const k = btn.dataset.bet, v = quickBet(k);
      btn.hidden = /^\d+$/.test(k) && v > betCap();
      btn.disabled = spinning || (k === 'max' && save.coins < MIN_BET) || (k === 'half' && bet <= MIN_BET) || (k === 'double' && bet >= betCap());
      btn.classList.toggle('on', /^\d+$/.test(k) || k === 'max' ? v === bet : false);
    });
    const nextCap = BET_CAPS[capIdx() + 1];
    $('bet-cap').textContent = nextCap ? tr('Höchsteinsatz {a} · ab der {n}. Wiedergeburt {b}', { a: fmtN(betCap()), n: (save.rebirths | 0) + 1, b: fmtN(nextCap) }) : tr('Höchsteinsatz {a}', { a: fmtN(betCap()) });
    $('spin').disabled = spinning || save.coins < bet;
    $('spin').textContent = save.coins < bet && !spinning ? tr('Zu wenig Taler – geh fischen!') : tr('Drehen ({n} Taler)', { n: fmtN(bet) });
    if (!$('paytable').childElementCount) {
      const rows = SYMBOLS.filter(s => s.pay).sort((a, b) => b.pay - a.pay).flatMap(s => {
        const icons = document.createElement('span');
        for (let i = 0; i < 3; i++) { const im = document.createElement('img'); im.src = s.img; im.alt = ''; icons.append(im); }
        const v = document.createElement('b'); v.textContent = `× ${s.pay}`;
        return [icons, v];
      });
      const ji = document.createElement('span'); ji.textContent = tr('3× Odfisch');
      const jv = document.createElement('b'); jv.textContent = tr('+ Jackpot-Topf');
      rows.push(ji, jv);
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
    save.coins -= stake; save.jackpot = pot() + stake * POT_CUT; persist(); updateCoins();
    const forced = window.__fischen && window.__fischen.forceSlot;
    const result = forced ? forced.map(id => SYMBOLS.find(sy => sy.id === id)) : [rollSymbol(), rollSymbol(), rollSymbol()];
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
    const jack = mult && result[0].id === 'odfisch' && hits.length === 3 ? Math.round(pot()) : 0;
    const win = Math.round(stake * mult) + jack;
    if (jack) save.jackpot = POT_SEED;
    save.coins += win;
    save.gamble = (save.gamble || 0) + win - stake;
    bealinEvent({ type: 'slot', won: win > stake });
    persist(); updateCoins();
    hits.forEach(i => slots[i].classList.add('hit'));
    const r = $('slot-result');
    if (jack) { r.className = 'result big'; r.textContent = tr('ODFISCH-JACKPOT! +{n} Taler (Topf: {p})', { n: fmtN(win), p: fmtN(jack) }); playFile('sounds/fish.mp3'); [0, 150, 300, 450, 600, 750].forEach(d => setTimeout(sfx.coin, d)); }
    else if (mult >= 40) { r.className = 'result big'; r.textContent = tr('JACKPOT! +{n} Taler', { n: fmtN(win) }); playFile(result[0].id === 'odfisch' ? 'sounds/fish.mp3' : 'sounds/jetzt-kommt-travis.mp3'); sfx.coin(); setTimeout(sfx.coin, 200); setTimeout(sfx.coin, 400); }
    else if (win > 0) { r.className = 'result win'; r.textContent = tr('Gewonnen! +{n} Taler', { n: fmtN(win) }); sfx.coin(); }
    else { r.className = 'result lose'; r.textContent = rat ? tr('Die Ratten haben deinen Einsatz gefressen.') : tr('Nichts. Nochmal?'); tone(200, .3, 'triangle', .06, -80); }
    spinning = false;
    renderCasino();
  }

  let lastCatchVal = 0;
  function showCatch(f, size, val, first, mut, newMut, gain, shiny, newShiny, cls = 1) {
    lastCatchVal = val;
    $('catch-double').hidden = false; $('catch-double').disabled = false;
    $('catch-double').textContent = tr('🎲 Doppelt oder nichts ({n})', { n: val });
    $('catch-flip').hidden = true; $('catch-ok').disabled = false;
    $('catch-rarity').textContent = RARITY[f.r].label;
    $('catch-rarity').className = 'rarity r-' + f.r;
    $('catch-img').src = f.img; $('catch-img').alt = f.name;
    $('catch-img').classList.toggle('pixel', !!f.pixel);
    $('catch-img').classList.toggle('photo', !!f.photo);
    $('catch-img').classList.toggle('whole', !!f.whole);
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
    const say = f.id === 'muschel' ? muschelAnswer() : f.say;
    $('catch-say').textContent = I18N.lang === 'en' ? `“${say}”` : `„${say}“`;
    if (f.id === 'muschel') setTimeout(() => muschelSpeak(say), 700);
    const sheet = $('catch').querySelector('.sheet');
    sheet.classList.remove('fx-rare', 'fx-wii', 'fx-epic', 'fx-legendary');
    void sheet.offsetWidth; // restart the CSS animations
    if (FANFARE[f.r]) sheet.classList.add('fx-' + f.r);
    sheet.classList.toggle('is-shiny', !!shiny);
    // first catch of this fish: silhouette → flash → colour, a burst ring and a "new in the Fischdex" stamp
    sheet.classList.toggle('is-first', !!first);
    $('catch-first').hidden = !first;
    lastFirst = first ? f : null;
    if (first) [523, 659, 784, 1047, 1319].forEach((n, i) => setTimeout(() => tone(n, .14, 'square', .045), 650 + i * 70));
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
    const sc = SIZE_CLASSES[cls];
    $('catch-size').textContent = size + ' cm' + (sc.icon && f.r !== 'junk' ? ` · ${sc.icon} ${sc.name}` : '') + (save.dex[f.id].best === size && !first ? ' 🏆' : '');
    $('catch-size').style.color = cls >= 3 && f.r !== 'junk' ? sc.c : '';
    $('catch-value').textContent = tr('+{n} Taler', { n: val });
    $('catch-new').hidden = !first;
    $('catch').hidden = false;
    $('catch-ok').focus();
    // QoL: the card closes by itself after a moment, except for new fish, legendaries, shinies and new mutations
    clearTimeout(autoCloseT);
    if (save.autoClose && !first && f.r !== 'legendary' && !shiny && !newMut && !newShiny) autoCloseT = setTimeout(() => {
      if (!$('catch').hidden && !$('catch-ok').disabled) $('catch-ok').click();
    }, 2500);
  }
  let autoCloseT = 0;
  $('catch').addEventListener('pointerdown', () => clearTimeout(autoCloseT)); // touching the card keeps it open

  // Fischdex: one page per area (Steg, Hohe See, Glutgrotte) plus the Shinydex; dock fish that also bite at sea show up on both
  const DEX_AREAS = {
    steg: { icon: '🏝️', name: tr('Steg'), has: f => !f.map },
    see: { icon: '⛵', name: tr('Hohe See'), has: f => f.map === 'see' || !!f.sea },
    lava: { icon: '🌋', name: tr('Glutgrotte'), has: f => f.map === 'lava' },
  };
  let dexTab = 'steg';
  const dexF = { q: '', show: 'all', r: '' };
  function dexFilter(list, got) { // search only matches fish you already know, so it never gives away a name
    const q = dexF.q.trim().toLocaleLowerCase(I18N.locale);
    return list.filter(f => {
      const e = save.dex[f.id];
      if (dexF.r && f.r !== dexF.r) return false;
      if (q && !(e && f.name.toLocaleLowerCase(I18N.locale).includes(q))) return false;
      if (dexF.show === 'missing') return !got(f);
      if (dexF.show === 'have') return !!got(f);
      if (dexF.show === 'nogold') return !!e && (e.m || 0) < 3;
      return true;
    });
  }
  function dexEmpty() {
    const p = document.createElement('p'); p.className = 'sub dex-empty';
    p.textContent = tr('Keine Fische passen zu deiner Suche.');
    return p;
  }
  function syncDexFilters() {
    $('dex-filters').hidden = false;
    const nogold = $('dex-show').querySelector('[value="nogold"]'); nogold.hidden = dexTab === 'shiny';
    if (dexTab === 'shiny' && dexF.show === 'nogold') dexF.show = 'all';
    $('dex-show').value = dexF.show; $('dex-rar').value = dexF.r;
    if ($('dex-search').value !== dexF.q) $('dex-search').value = dexF.q;
  }
  const SHINY_REWARDS = ['s1', 's5', 'sall'];
  function shinysFound() { return FISH.filter(f => save.dex[f.id] && save.dex[f.id].shiny).length; }
  function renderShinydex() {
    $('dex-count').textContent = tr('{a} von {b} Shinys gefunden · Chance pro Fang gerade {c} %', { a: shinysFound(), b: FISH.length, c: (shinyChance() * 100).toLocaleString(I18N.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
    renderDexRewards();
    const list = dexFilter(FISH, f => save.dex[f.id] && save.dex[f.id].shiny);
    if (!list.length) return $('dex-grid').replaceChildren(dexEmpty());
    $('dex-grid').replaceChildren(...list.map(f => {
      const e = save.dex[f.id], sh = e && e.shiny;
      const c = document.createElement('div');
      c.className = 'card ' + (sh ? 'b-' + f.r + ' shiny-card' : 'unknown');
      const img = document.createElement('img'); img.loading = 'lazy';
      if (sh) { img.style.setProperty('--shiny-hue', shinyHue(f.id) + 'deg'); img.src = f.img; img.alt = f.name + ' (Shiny)'; img.className = ['shiny', f.pixel ? 'pixel' : '', f.photo ? 'photo' : '', f.whole ? 'whole' : ''].join(' ').trim(); }
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
    if (!DEX_AREAS[dexTab] && dexTab !== 'shiny') dexTab = 'steg';
    for (const [id, a] of Object.entries(DEX_AREAS)) { // per-area progress right on the tab
      const all = FISH.filter(a.has);
      $('dex-n-' + id).textContent = `${all.filter(f => save.dex[f.id]).length}/${all.length}`;
    }
    syncDexFilters();
    $('dex-title').textContent = dexTab === 'shiny' ? tr('Shinydex') : tr('Fischdex');
    if (dexTab === 'shiny') return renderShinydex();
    const area = DEX_AREAS[dexTab], inArea = FISH.filter(area.has);
    const got = FISH.filter(f => save.dex[f.id]).length, gotA = inArea.filter(f => save.dex[f.id]).length;
    const g = save.gamble || 0;
    $('dex-count').textContent = tr('{i} {n}: {a} von {b} entdeckt', { i: area.icon, n: area.name, a: gotA, b: inArea.length })
      + tr(' · Gesamt {a} von {b} · {c} von {d} Mutationen · {e} Fänge insgesamt', { a: got, b: FISH.length, c: mutsFound().length, d: MUTATIONS.length, e: save.total })
      + tr(' · Meisterschaft: {g} 🥇 (+{p} % Taler)', { g: masteryCount(3), p: goldBonus() }) + (save.gamble !== undefined ? tr(' · Glücksspiel {n} Taler', { n: (g >= 0 ? '+' : '') + g }) : '');
    renderDexRewards(); renderCrits();
    const list = dexFilter(inArea, f => save.dex[f.id]);
    if (!list.length) return $('dex-grid').replaceChildren(dexEmpty());
    $('dex-grid').replaceChildren(...list.map(f => {
      const e = save.dex[f.id];
      const c = document.createElement('div');
      c.className = 'card ' + (e ? 'b-' + f.r : 'unknown');
      const img = document.createElement('img');
      const hide = !e && f.photo;
      img.src = hide ? 'img/fish-icon.png' : f.img; img.alt = e ? f.name : tr('Unbekannt'); img.loading = 'lazy';
      img.className = [f.pixel || hide ? 'pixel' : '', e && f.photo ? 'photo' : '', e && f.whole ? 'whole' : ''].join(' ').trim();
      const name = document.createElement('b'); name.textContent = e ? f.name : '???';
      const r = document.createElement('small'); r.className = 'r-' + f.r; r.textContent = RARITY[f.r].label;
      const info = document.createElement('small');
      info.textContent = e ? tr('{n}× · Rekord {b} cm', { n: e.n, b: e.best }) + (e.cls >= 2 ? ' ' + SIZE_CLASSES[e.cls].icon : '') : hintFor(f);
      if (e && e.cls >= 2) info.title = tr('Beste Größenklasse: {c}', { c: SIZE_CLASSES[e.cls].name });
      if (e && f.sea && dexTab === 'steg') { info.textContent += ' ⛵'; info.title = (info.title ? info.title + ' · ' : '') + tr('Beißt auch auf Hoher See'); }
      c.append(img, name, r, info);
      if (e) { // mastery: medal and the way to the next one
        const m = e.m || 0, need = masteryNeed(f), ms = document.createElement('small'); ms.className = 'mastery m' + m;
        ms.textContent = (m ? MEDALS[m] + ' ' : '') + (m < 3 ? tr('{a}/{b} bis {m}', { a: e.n, b: need[m], m: MEDALS[m + 1] }) : tr('Gold-Meister'));
        ms.title = tr('Meisterschaft: Bronze, Silber und Gold für viele Fänge dieses Fischs. Jeder Gold-Fisch gibt dauerhaft +1 % Taler.');
        c.append(ms);
      }
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
    { id: 'mon1', name: 'Erstes Monster',      need: () => [FISH.some(f => (save.dex[f.id] || {}).cls === 4) ? 1 : 0, 1], coins: 1000, scales: 3 },
    { id: 'wall', name: 'Alle Wetterfische',   need: () => [FISH.filter(f => f.weather && f.map !== 'see' && save.dex[f.id]).length, FISH.filter(f => f.weather && f.map !== 'see').length], coins: 2000, scales: 4 },
    { id: 'lavaall', name: 'Alle Fische der Glutgrotte', need: () => [FISH.filter(f => f.map === 'lava' && save.dex[f.id]).length, FISH.filter(f => f.map === 'lava').length], coins: 15000, scales: 15 },
    { id: 'seeall', name: 'Alle Fische der Hohen See', need: () => [FISH.filter(f => f.map === 'see' && !f.boss && save.dex[f.id]).length, FISH.filter(f => f.map === 'see' && !f.boss).length], coins: 5000, scales: 8 },
    { id: 'odboss', name: 'Odfisch besiegt',   need: () => [save.bossWins || 0, 1], coins: 3000, scales: 5 },
    { id: 'ma10', name: '10× Bronze-Meister',  need: () => [masteryCount(1), 10], coins: 1500, scales: 3 },
    { id: 'mg10', name: '10× Gold-Meister',    need: () => [masteryCount(3), 10], coins: 8000, scales: 10 },
    { id: 'mgall', name: 'Alles in Gold',      need: () => [masteryCount(3), FISH.length], coins: 50000, scales: 40 },
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
  $('dex-search').addEventListener('input', () => { dexF.q = $('dex-search').value; renderDex(); });
  $('dex-show').addEventListener('change', () => { dexF.show = $('dex-show').value; renderDex(); });
  $('dex-rar').addEventListener('change', () => { dexF.r = $('dex-rar').value; renderDex(); });
  for (const r of ['common', 'uncommon', 'rare', 'wii', 'epic', 'legendary', 'junk']) {
    const o = document.createElement('option'); o.value = r; o.textContent = RARITY[r].label; $('dex-rar').append(o);
  }
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

  // the lava creatures you have beaten, below the cave fish in the Glutgrotte tab
  function renderCrits() {
    const box = $('dex-crits'); box.hidden = dexTab !== 'lava';
    if (box.hidden) return;
    const h = document.createElement('h3');
    h.textContent = tr('👹 Lava-Kreaturen · {a} von {b} besiegt · Kreatur-Chance {n} %', { a: CREATURES.filter(c => save.crit[c.id]).length, b: CREATURES.length, n: inLava() ? critChance() : Math.min(CRIT_MAX, CRIT_BASE + glutUp('lockruf')) });
    const grid = document.createElement('div'); grid.className = 'grid';
    grid.append(...CREATURES.map(c => {
      const n = save.crit[c.id] | 0, d = document.createElement('div');
      d.className = 'card ' + (n ? 'b-epic' : 'unknown');
      const img = document.createElement('img'); img.className = 'pixel'; img.src = c.img; img.alt = n ? c.name : tr('Unbekannt'); img.loading = 'lazy';
      if (!n) img.style.filter = 'brightness(0)';
      const b = document.createElement('b'); b.textContent = n ? c.name : '???';
      const r = document.createElement('small'); r.textContent = tr('Tiefe {n} · {h} HP', { n: c.depth, h: c.hp });
      const i = document.createElement('small'); i.textContent = n ? tr('{n}× besiegt', { n }) : c.depth > caveDepth() ? tr('Glutgrotte, ab Tiefe {n}', { n: c.depth }) : tr('Noch nicht besiegt');
      d.append(img, b, r, i);
      if (n) { const q = document.createElement('q'); q.textContent = c.say; d.append(q); d.title = c.desc; }
      return d;
    }));
    box.replaceChildren(h, grid);
  }
  function hintFor(f) {
    if (f.depth && f.depth > caveDepth()) return tr('Glutgrotte, ab Tiefe {n}', { n: f.depth });
    if (f.hint) return f.hint;
    if (f.boss) return tr('Besiege ihn nachts auf Hoher See (Odköder)');
    if (f.map === 'see' && f.weather) return tr('Hohe See, nur bei Gewitter');
    if (f.weather) return tr(WEATHER_HINT[f.weather]);
    if (f.map === 'see') return f.night ? tr('Hohe See, lieber nachts') : tr('Nur auf Hoher See');
    if (f.depth && f.depth > caveDepth()) return tr('Glutgrotte, ab Tiefe {n}', { n: f.depth });
    if (f.map === 'lava') return f.night ? tr('Glutgrotte, lieber nachts') : f.far ? tr('Glutgrotte, weit draußen') : tr('Nur in der Glutgrotte');
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
    tiefsee: i => i % 5 === 0 ? '#5eead4' : '#0e3a4a',
    krake: i => i % 3 === 0 ? '#f472b6' : '#7e1d4f',
    basalt: i => i % 4 === 0 ? '#f97316' : '#44403c',
    obsidian: i => i % 5 === 0 ? '#a78bfa' : '#1e1b4b',
    magma: i => i % 2 === 0 ? '#fb923c' : '#7f1d1d',
    drachenknochen: i => i % 4 === 0 ? '#ef4444' : '#f5f0e1',
    phoenixrute: i => ['#fde047', '#f97316', '#dc2626'][i % 3],
  };
  const ICONS = {};
  for (const r of RODS) ICONS[r.id] = iconCanvas(p => {
    const col = ROD_COLORS[r.id] || ROD_COLORS.stock;
    for (let i = 0; i < 13; i++) { p(2 + i, 13 - i, col(i)); if (i < 4) p(2 + i, 14 - i, col(i)); }   // rod, thicker grip
    p(2, 14, '#1b1f2e'); p(3, 14, '#1b1f2e');                                                       // butt cap
    p(10, 7, '#cbd5e1'); p(13, 4, '#cbd5e1');                                                       // line guides
    for (const [a, b] of [[5, 12], [6, 12], [5, 13], [6, 13]]) p(a, b, '#64748b'); p(5, 12, '#cbd5e1'); // reel
    p(7, 13, '#94a3b8'); p(7, 14, '#f8fafc');                                                       // reel handle
    for (let y = 1; y < 9; y++) p(15, y, 'rgba(255,255,255,.7)');                                    // line
    p(14, 9, '#ef4444'); p(15, 9, '#ef4444'); p(14, 10, '#f8fafc'); p(15, 10, '#f8fafc');           // bobber
    if (r.id === 'stern') { p(13, 2, '#fde68a'); p(12, 3, '#fde68a'); p(14, 3, '#fde68a'); p(13, 4, '#fde68a'); p(13, 3, '#fff'); }
  });
  const BAIT_ART = { wurm: ART.bait_wurm, spezi: ART.bait_spezi, glitzer: ART.bait_glitzer, mond: ART.bait_mond, abyss: ART.bait_abyss, glutkoeder: ART.bait_glutkoeder, lockkoeder: ART.bait_lockkoeder, odkoeder: ART.bait_odkoeder };
  const artIcon = ([rows, pal]) => iconCanvas(p => rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') p(x, y, pal[ch]); })));
  for (const b of BAITS) ICONS[b.id] = artIcon(BAIT_ART[b.id] || BAIT_ART.wurm);
  for (const b of BAITS) if (b.img) ICONS[b.id] = b.img;
  for (const b of BOXES) ICONS[b.id] = iconCanvas(p => {
    const [m, d, g] = b.col, k = '#1b1f2e';
    for (let x = 2; x < 14; x++) { p(x, 2, k); p(x, 14, k); }
    for (let y = 3; y < 14; y++) { p(1, y, k); p(14, y, k); }
    for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) p(x, y, y === 3 ? g : y === 7 ? k : y === 13 ? d : m); // lid, edge and floor
    for (let y = 3; y < 14; y++) if (y !== 7) { p(4, y, d); p(11, y, d); }                                       // bands
    p(4, 5, g); p(11, 5, g); p(4, 10, g); p(11, 10, g);                                                          // rivets
    p(7, 6, k); p(8, 6, k); p(7, 7, g); p(8, 7, g); p(7, 8, g); p(8, 8, g); p(7, 9, k); p(8, 9, k);              // lock
    p(13, 1, '#fff'); p(12, 1, '#fde68a'); p(14, 1, '#fde68a'); p(13, 0, '#fde68a');                             // sparkle
  });

  function statBar(label, v, max) {
    const d = document.createElement('div'); d.className = 'stat';
    const l = document.createElement('span'); l.textContent = label;
    const bar = document.createElement('i'); const f = document.createElement('b');
    f.style.width = Math.min(100, v / max * 100) + '%'; bar.append(f);
    d.append(l, bar); return d;
  }
  for (const sn of SNACKS) ICONS[sn.id] = artIcon(ART['snack_' + sn.id]);
  function hatIcon(p, h, H, l) {
    const k = '#1b1f2e';
    for (let x = 5; x <= 10; x++) p(x, 3, k);
    for (let y = 4; y <= 8; y++) { p(4, y, k); p(11, y, k); for (let x = 5; x <= 10; x++) p(x, y, y === 4 ? l : y >= 7 || x === 10 ? H : h); }
    p(6, 5, l);
    for (let x = 1; x <= 14; x++) { p(x, 9, k); p(x, 10, x > 10 ? H : h); p(x, 11, k); }
    p(0, 10, k); p(15, 10, k);
  }
  function jacketIcon(p, cc, C, y) {
    const k = '#1b1f2e';
    for (let x = 5; x <= 10; x++) p(x, 2, k);
    for (let yy = 3; yy <= 13; yy++) for (let x = 3; x <= 12; x++) p(x, yy, x === 3 || x === 12 || yy === 13 ? k : x === 7 || x === 8 && yy < 5 ? y : x > 9 ? C : cc);
    for (let x = 6; x <= 9; x++) if (x !== 7 && x !== 8) p(x, 3, '#f2c9a0');
    p(5, 10, C); p(6, 10, C); p(9, 10, C); p(10, 10, C);                 // pockets
    for (let yy = 5; yy <= 11; yy++) { p(1, yy, k); p(2, yy, yy === 11 ? y : cc); p(13, yy, yy === 11 ? y : C); p(14, yy, k); } // sleeves with cuffs
  }
  function bobberIcon(p, top) {
    const k = '#1b1f2e';
    p(7, 1, k); p(8, 1, k); p(7, 2, k); p(8, 2, k);
    for (let y = 3; y <= 13; y++) for (let x = 2; x <= 13; x++) {
      const r = (x - 7.5) ** 2 + (y - 8) ** 2;
      if (r <= 27) p(x, y, r > 18 || y === 8 ? k : y < 8 ? top(x, y) : '#f8fafc');
    }
    p(5, 5, '#fff');
  }
  for (const c of COSMETICS) ICONS[c.id] = iconCanvas(p => {
    const k = '#1b1f2e';
    if (c.slot === 'hat') {
      hatIcon(p, ...c.col);
    } else if (c.slot === 'jacket') {
      jacketIcon(p, ...c.col);
    } else if (c.slot === 'boat') { // a tiny Hoff: curly hair, blue eyes, a smirk
      const H = '#4a2a12', S = '#c98552';
      for (let y = 2; y <= 13; y++) for (let x = 2; x <= 13; x++) {
        const r = (x - 7.5) ** 2 + (y - 8) ** 2;
        if (r <= 34) p(x, y, r > 26 ? k : y < 6 || ((x < 4 || x > 11) && y < 10) ? H : S);
      }
      for (const x of [4, 5, 10, 11]) p(x, 6, H); p(5, 8, '#f8fafc'); p(4, 8, '#3b6fa0'); p(10, 8, '#f8fafc'); p(11, 8, '#3b6fa0'); p(7, 9, '#9c5f31'); p(7, 10, '#9c5f31');
      for (let x = 5; x <= 10; x++) p(x, 11, '#7a4524'); p(11, 10, '#7a4524');
      p(4, 1, H); p(7, 1, H); p(10, 1, H);
    } else {
      const rb = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
      bobberIcon(p, (x, y) => c.col || rb[y - 3]);
    }
  });
  function cosmWare(c) {
    const owned = save.cosm.owned.includes(c.id), worn = save.cosm[c.slot] === c.id, lock = !owned && lockText(c);
    return ware({
      id: c.id, name: c.name, desc: c.desc, stats: [],
      state: worn ? 'active' : owned ? 'owned' : lock ? 'locked' : '',
      owned: SLOT_NAMES[c.slot],
      btnText: worn ? tr('Ablegen') : owned ? tr('Anziehen') : lock || tr('{n} Taler', { n: c.price.toLocaleString(I18N.locale) }),
      disabled: !owned && (save.coins < c.price || !!lock),
      onClick: () => {
        if (lock) return keeper(KEEPER.locked(lock));
        if (worn) { save.cosm[c.slot] = null; keeper(tr('Wieder ganz klassisch. Steht dir auch.')); }
        else if (owned) { save.cosm[c.slot] = c.id; keeper(tr('Schick, schick!')); }
        else {
          if (save.coins < c.price) return keeper(KEEPER.poor(c.price - save.coins));
          spend(c.price); save.cosm.owned.push(c.id); save.cosm[c.slot] = c.id; sfx.coin();
          keeper(tr('Ausgezeichnete Wahl. Die Fische werden staunen.'));
        }
        persist(); updateCoins(); renderShop(false);
      },
    });
  }
  function renderWardrobe() {
    const cv = $('wardrobe-preview'), x = cv.getContext('2d'), img = playerFrames()[0][0];
    x.clearRect(0, 0, cv.width, cv.height); x.imageSmoothingEnabled = false;
    const sc = Math.floor(Math.min(cv.width / img.width, (cv.height - 30) / img.height) * 2) / 2;
    x.drawImage(img, (cv.width - img.width * sc) / 2, 4, img.width * sc, img.height * sc);
    // the bobber in front of the angler
    const bc = bobColor(save.cosm.bob), by = cv.height - 22, bx = cv.width - 30;
    x.fillStyle = '#1b1f2e'; x.fillRect(bx - 2, by - 2, 20, 20); x.fillRect(bx + 7, by - 10, 2, 8);
    x.fillStyle = bc; x.fillRect(bx, by, 16, 8); x.fillStyle = '#f8fafc'; x.fillRect(bx, by + 8, 16, 8);
    const swatches = (title, opts, names, key, def) => {
      const sec = document.createElement('section'); sec.className = 'wd-slot';
      const h = document.createElement('h3'); h.textContent = title;
      const row = document.createElement('div'); row.className = 'wd-swatches'; row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', title);
      for (const [id, col] of Object.entries(opts)) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'wd-swatch' + ((save.cosm[key] || def) === id ? ' on' : '');
        b.style.setProperty('--sw', col[0]); b.title = names[id]; b.setAttribute('aria-label', names[id]); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', (save.cosm[key] || def) === id);
        b.addEventListener('click', () => { save.cosm[key] = id === def ? null : id; persist(); renderWardrobe(); sfx.tick(); });
        row.append(b);
      }
      sec.append(h, row); return sec;
    };
    $('wardrobe-list').replaceChildren(swatches(tr('Hautfarbe'), SKINS, SKIN_NAMES, 'skin', 'hell'), swatches(tr('Haar- & Bartfarbe'), HAIRS, HAIR_NAMES, 'hair', 'braun'), ...Object.entries(SLOT_NAMES).map(([slot, label]) => {
      const sec = document.createElement('section'); sec.className = 'wd-slot';
      const h = document.createElement('h3'); h.textContent = label;
      const grid = document.createElement('div'); grid.className = 'wd-grid';
      const tile = (icon, name, sub, cls, onClick, title) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'wd-item ' + cls;
        if (title) b.title = title;
        const im = document.createElement('img'); im.src = icon; im.alt = '';
        const n = document.createElement('span'); n.textContent = name;
        const s = document.createElement('small'); s.textContent = sub;
        b.append(im, n, s); b.addEventListener('click', onClick); return b;
      };
      const worn = save.cosm[slot];
      grid.append(tile(slot === 'bob' ? ICONS['pose-std'] : slot === 'hat' ? ICONS['hut-std'] : slot === 'boat' ? ICONS['boot-std'] : ICONS['jacke-std'], tr('Standard'), slot === 'hat' ? tr('Hutfarbe nach Wiedergeburten') : slot === 'boat' ? tr('Käpt’n Bealins Boot') : tr('Klassisch'),
        worn ? '' : 'on', () => { save.cosm[slot] = null; persist(); renderWardrobe(); }));
      for (const c of COSMETICS.filter(c => c.slot === slot)) {
        const owned = save.cosm.owned.includes(c.id);
        if (owned) grid.append(tile(ICONS[c.id], c.name, worn === c.id ? tr('Angezogen') : tr('Anziehen'), worn === c.id ? 'on' : '',
          () => { save.cosm[slot] = worn === c.id ? null : c.id; persist(); renderWardrobe(); sfx.tick(); }));
        else if (c.price) grid.append(tile(ICONS[c.id], c.name, tr('🛒 Laden · {n} Taler', { n: c.price }), 'locked', () => { closeModals(); shopTab = 'cosm'; toggleModal('shop'); }));
        else if (c.glut) grid.append(tile(ICONS[c.id], c.name, tr('🌋 Lava-Laden in der Glutgrotte · {n} 🔥', { n: c.glut }), 'locked', () => {
          if (!inLava()) return toast(tr('🌋 Den Lava-Laden gibt es nur unten in der Glutgrotte.'));
          closeModals(); toggleModal('shop');
        }));
        else grid.append(tile(ICONS[c.id], c.name, '🔒 ' + c.ach, 'locked', () => toast('🔒 ' + c.ach), c.ach));
      }
      sec.append(h, grid); return sec;
    }));
  }
  ICONS['hut-std'] = iconCanvas(p => hatIcon(p, ...HATS[Math.min(HATS.length - 1, save.rebirths)]));
  ICONS['jacke-std'] = iconCanvas(p => jacketIcon(p, '#f59e0b', '#c2410c', '#fcd34d'));
  ICONS['boot-std'] = iconCanvas(p => {
    const k = '#1b1f2e';
    for (let y = 9; y <= 12; y++) { const a = y - 8, b = 23 - y; for (let x = a; x <= b; x++) p(x, y, x === a || x === b || y === 9 || y === 12 ? k : y === 11 ? '#be2828' : '#26487c'); }
    for (let y = 1; y <= 8; y++) p(8, y, '#a87040');
    for (let y = 2; y <= 7; y++) for (let x = 8 - (y - 1); x <= 7; x++) p(x, y, x === 8 - (y - 1) || y === 7 ? '#94a3b8' : '#e2e8f0');
  });
  ICONS['pose-std'] = iconCanvas(p => bobberIcon(p, () => '#ef4444'));
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
  // Rutenschmiede: a second button on the rod in hand
  function forgeButton(r) {
    const k = forgeLvl(r.id), cost = forgeCost(r, k), btn = document.createElement('button');
    btn.className = 'btn forge';
    btn.textContent = k >= FORGE_MAX ? tr('⚒️ Voll geschmiedet') : tr('⚒️ Schmieden +{n} · {c} Taler', { n: k + 1, c: cost.toLocaleString(I18N.locale) });
    btn.title = tr('Jede Stufe: +3 % Kurbel, +3 % Glück, 2 % weniger Spannung, etwas mehr Wurf. Bei der Wiedergeburt weg.');
    btn.setAttribute('aria-disabled', k >= FORGE_MAX || save.coins < cost ? 'true' : 'false');
    btn.addEventListener('click', () => {
      if (k >= FORGE_MAX) return keeper(tr('Besser wird die nicht mehr. Ehrlich.'));
      if (save.coins < cost) return keeper(KEEPER.poor(cost - save.coins));
      spend(cost); if (!save.forge || typeof save.forge !== 'object') save.forge = {};
      save.forge[r.id] = k + 1; sfx.coin(); [330, 330, 523].forEach((n, i) => setTimeout(() => tone(n, .07, 'square', .06), i * 120));
      keeper(tr('Klong, klong! {r} ist jetzt +{n}.', { r: r.name, n: k + 1 }));
      persist(); updateCoins(); updateGear(); renderShop(false);
    });
    return btn;
  }
  function snackWare(sn) {
    const left = save.buffs && save.buffs[sn.id] > Date.now() ? save.buffs[sn.id] - Date.now() : 0, full = left > SNACK_MAX - SNACK_MS;
    return ware({
      id: sn.id, name: sn.name, desc: sn.desc + ' ' + tr('Wirkt 10 Minuten.'), stats: [],
      state: left ? 'active' : '',
      owned: left ? tr('noch {n} min', { n: Math.ceil(left / 60000) }) : '',
      btnText: full ? tr('Satt') : tr('{n} Taler', { n: sn.price.toLocaleString(I18N.locale) }),
      disabled: full || save.coins < sn.price,
      onClick: () => {
        if (full) return keeper(tr('Noch mehr? Erst mal verdauen.'));
        if (save.coins < sn.price) return keeper(KEEPER.poor(sn.price - save.coins));
        spend(sn.price); sfx.coin();
        if (!save.buffs || typeof save.buffs !== 'object') save.buffs = {};
        save.buffs[sn.id] = Math.max(Date.now(), save.buffs[sn.id] || 0) + SNACK_MS;
        keeper(tr('Frisch vom Kiosk. Guten Appetit!'));
        persist(); updateCoins(); updateBuffPill(); renderShop(false);
      },
    });
  }
  // active snacks as a pill in the HUD, with the minutes left
  function updateBuffPill() {
    const el = $('buffs'), now = Date.now(), on = SNACKS.filter(sn => buffOn(sn.id));
    if (save.buffs) for (const k of Object.keys(save.buffs)) if (!(save.buffs[k] > now)) delete save.buffs[k];
    el.hidden = !on.length;
    if (!on.length) return;
    const txt = on.map(sn => sn.icon + ' ' + Math.ceil((save.buffs[sn.id] - now) / 60000) + "'").join(' ');
    if (el.textContent !== txt) el.textContent = txt;
  }
  $('buffs').addEventListener('click', () => toast(SNACKS.filter(sn => buffOn(sn.id)).map(sn =>
    tr('{i} {n}: noch {m} min', { i: sn.icon, n: sn.name, m: Math.ceil((save.buffs[sn.id] - Date.now()) / 60000) })).join(' · ') || tr('Keine Snacks aktiv.')));
  setInterval(updateBuffPill, 1000);
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
          spend(b.price); sfx.coin(); keeper(tr('Was drin ist, weiß nicht mal ich.'));
        } else save.boxes[b.id] = n - 1;
        openBox(b);
      },
    });
  }
  // roll and pay out the prize right away (so a reload mid-animation loses nothing), then reveal it
  function rollBox(b) {
    const T = b.tier, P = b.price;
    const baits = BAITS.filter(x => x.pack && !lockText(x));
    // Balance: bought boxes return ~75-80 % of their price on average (coins alone ~70 %, the
    // rest as bait and a little XP; no Schuppen, those only come from rebirths). Prizes don't use the Taler bonus, otherwise boxes would
    // turn into a money machine for players with many rebirths.
    const table = [
      { w: 55, f: () => { const c = Math.round(P * (.6 + Math.random() * .8)); save.coins += c; save.totalEarned += c; return tr('🪙 {n} Taler', { n: c }); } },
      { w: 14, f: () => { const x = pick(baits), c = [5, 10, 20][T]; save.baits[x.id] = (save.baits[x.id] || 0) + c; updateGear(); return tr('{n}× {b}', { n: c, b: x.name }); } },
      { w: 14, f: () => tr('⭐ {n} EP', { n: gainXp([15, 40, 100][T]) }) },
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
        $('box-again').onclick = () => { if (save.boxes[b.id]) save.boxes[b.id]--; else if (save.coins >= b.price) spend(b.price); else return; openBox(b); };
      }
    }, 1100);
  }
  $('box-ok').addEventListener('click', () => { if (!$('box-ok').disabled) $('box').hidden = true; });
  // Lava-Laden: everything here costs Glutsteine 🔥, never Taler (and Glutsteine never turn into Taler)
  function lavaWares() {
    const poor = n => keeper(tr('Dafür fehlen dir noch {n} 🔥. Fang mehr in der Glutgrotte!', { n: n - save.glut }));
    const rods = RODS.filter(r => r.lava).map(r0 => {
      const owned = save.rods.includes(r0.id), active = save.lavaRod === r0.id, lock = !owned && lockText(r0), r = owned ? forged(r0) : r0;
      const w = ware({
        id: r.id, name: '🌋 ' + r.name, desc: r.desc,
        stats: [statBar(tr('Wurf'), r.cast, 1), statBar(tr('Kurbel'), r.reel, 4.2), statBar(tr('Glück'), r.luck, 3.6), statBar(tr('Ruhe'), 1.1 - r.tens, .8), statBar(tr('Kreaturen'), r.kc || 0, 10)],
        state: active ? 'active' : lock ? 'locked' : owned ? 'owned' : '',
        // the first lava rod (no glut price) is paid in Taler, so you can get started without Glutsteine
        btnText: active ? tr('In der Hand') : owned ? tr('Nehmen') : lock || (r0.glut ? `${r0.glut} 🔥` : tr('{n} Taler', { n: r0.price })),
        disabled: active || (!owned && (!!lock || (r0.glut ? save.glut < r0.glut : save.coins < r0.price))),
        onClick: () => {
          if (active) return keeper(pick(KEEPER.equip));
          if (lock) return keeper(KEEPER.locked(lock));
          if (!owned && r0.glut && save.glut < r0.glut) return poor(r0.glut);
          if (!owned && !r0.glut && save.coins < r0.price) return keeper(KEEPER.poor(r0.price - save.coins));
          if (!owned) { if (r0.glut) save.glut -= r0.glut; else spend(r0.price); save.rods.push(r0.id); sfx.coin(); keeper(tr('Hält jede Glut aus. Viel Erfolg da unten!')); }
          else keeper(pick(KEEPER.equip));
          save.lavaRod = r0.id; persist(); updateCoins(); updateGear(); renderShop(false);
        },
      });
      if (active) w.append(forgeButton(r0));
      return w;
    });
    const baits = BAITS.filter(b => b.lava).map(b => {
      const n = save.baits[b.id] || 0, active = save.bait === b.id, lock = lockText(b);
      return ware({
        id: b.id, name: b.name, desc: b.desc,
        stats: [statBar(tr('Glück'), b.luck, 4.2), statBar(tr('Tempo'), b.speed, 2), statBar(tr('Kreaturen'), b.kc || 0, 10)],
        state: active ? 'active' : lock ? 'locked' : '',
        owned: n ? tr('{n} im Beutel', { n }) : '',
        btnText: lock || tr('+{a} für {b} 🔥', { a: b.pack, b: b.glut }),
        disabled: !!lock || save.glut < b.glut,
        onClick: () => {
          if (lock) return keeper(KEEPER.locked(lock));
          if (save.glut < b.glut) return poor(b.glut);
          save.glut -= b.glut; save.baits[b.id] = n + b.pack; save.bait = b.id; sfx.coin();
          keeper(pick(KEEPER.bait)); persist(); updateCoins(); updateGear(); renderShop(false);
        },
      });
    });
    const cosm = COSMETICS.filter(c => c.glut).map(c => {
      const owned = save.cosm.owned.includes(c.id), worn = save.cosm[c.slot] === c.id;
      return ware({
        id: c.id, name: c.name, desc: c.desc, stats: [],
        state: worn ? 'active' : owned ? 'owned' : '',
        owned: SLOT_NAMES[c.slot],
        btnText: worn ? tr('Ablegen') : owned ? tr('Anziehen') : `${c.glut} 🔥`,
        disabled: !owned && save.glut < c.glut,
        onClick: () => {
          if (worn) save.cosm[c.slot] = null;
          else if (owned) save.cosm[c.slot] = c.id;
          else {
            if (save.glut < c.glut) return poor(c.glut);
            save.glut -= c.glut; save.cosm.owned.push(c.id); save.cosm[c.slot] = c.id; sfx.coin();
            keeper(tr('Steht dir. Und schmilzt nicht.'));
          }
          persist(); updateCoins(); renderShop(false);
        },
      });
    });
    return [...rods, ...baits, ...cosm];
  }
  function renderShop(greet) {
    updateCoins();
    // the Lava-Laden is its own shop, only down in the Glutgrotte; the kiosk at the dock never shows it
    if (inLava()) shopTab = 'lava'; else if (shopTab === 'lava') shopTab = 'rods';
    $('shop-tabs').hidden = inLava();
    $('shop-glut-p').hidden = shopTab !== 'lava'; $('shop-coins-p').hidden = false;
    { // the Lava-Laden has its own dealer: Glutflosse, a shark dancing in the flames
      const lava = shopTab === 'lava', ph = $('keeper-photo');
      ph.src = lava ? 'img/lava-haendler.jpg' : 'img/tophat-fish-fish.gif';
      ph.alt = lava ? tr('Glutflosse, ein tanzender Hai vor Flammen') : tr('Herr Zylinderwels, ein Wels mit Zylinder');
      $('shop-title').textContent = lava ? tr('Glutflosses Lava-Laden') : tr('Zylinderwels & Söhne');
      $('keeper-name').textContent = lava ? tr('Glutflosse, Lava-Händler') : tr('Herr Zylinderwels, Inhaber');
    }
    if (greet !== false) keeper(shopTab === 'lava' ? tr('Hey! Die Basaltrute gibt’s für Taler, alles andere nur für Glutsteine.') : pick(KEEPER.hello));
    document.querySelectorAll('[data-shop-tab]').forEach(t => {
      const on = t.dataset.shopTab === shopTab; t.classList.toggle('on', on); t.setAttribute('aria-selected', on);
    });
    const wares = shopTab === 'snacks' ? SNACKS.map(snackWare) : shopTab === 'boxes' ? BOXES.map(boxWare) : shopTab === 'cosm' ? COSMETICS.filter(c => c.price).map(cosmWare) : shopTab === 'lava' ? lavaWares() : shopTab === 'rods' ? RODS.filter(r => !r.lava).map(r0 => {
      const owned = save.rods.includes(r0.id), active = r0.lava ? save.lavaRod === r0.id : save.rod === r0.id, lock = !owned && lockText(r0), r = owned ? forged(r0) : r0;
      const w = ware({
        id: r.id, name: (r.lava ? '🌋 ' : '') + r.name, desc: r.desc,
        stats: [statBar(tr('Wurf'), r.cast, 1), statBar(tr('Kurbel'), r.reel, 3.6), statBar(tr('Glück'), r.luck, 3), statBar(tr('Ruhe'), 1.1 - r.tens, .8)],
        state: active ? 'active' : lock ? 'locked' : owned ? 'owned' : '',
        btnText: active ? tr('In der Hand') : owned ? tr('Nehmen') : lock || tr('{n} Taler', { n: r.price }),
        disabled: active || (!owned && (!!lock || save.coins < r.price)),
        onClick: () => {
          if (active) return keeper(pick(KEEPER.equip));
          if (lock) return keeper(KEEPER.locked(lock));
          if (!owned && save.coins < r.price) return keeper(KEEPER.poor(r.price - save.coins));
          if (!owned) { spend(r.price); save.rods.push(r.id); sfx.coin(); keeper(pick(KEEPER.buy)); }
          else keeper(pick(KEEPER.equip));
          if (r0.lava) save.lavaRod = r0.id; else save.rod = r0.id;
          persist(); updateGear(); renderShop(false);
        },
      });
      if (active) w.append(forgeButton(r0));
      return w;
    }) : BAITS.filter(b => !b.lava).map(b => {
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
          spend(b.price); save.baits[b.id] = n + b.pack; save.bait = b.id; sfx.coin();
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
  nameGifts();
  setInterval(() => { nameGifts(); persist(); }, 5000);
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
  // new update on the server: every open game reloads to the new version. Checks the ETags of the
  // game files (cheap HEAD requests) every 2 minutes and whenever the tab comes back. A visible
  // game waits for a calm moment (nothing on the line, no slot spin, no box opening) first.
  const VERSION_FILES = ['fischen.html', 'js/fischen.js', 'js/fischen-i18n.js', 'css/fischen.css'];
  let builtVersion = null, newVersion = false;
  async function serverVersion() {
    try {
      const tags = await Promise.all(VERSION_FILES.map(async u => {
        const r = await fetch(u, { method: 'HEAD', cache: 'no-store' });
        return r.ok ? (r.headers.get('etag') || r.headers.get('last-modified') || '') : '';
      }));
      return tags.every(Boolean) ? tags.join('|') : null;
    } catch { return null; } // offline: try again later
  }
  function calm() { return document.hidden || (state === 'idle' && !spinning && $('box').hidden); }
  function updateNow() {
    if (leaving) return;
    persist(); leaving = true;
    if (document.hidden) location.reload();
    else { toast(tr('🆕 Neue Version! Lade neu …')); setTimeout(() => location.reload(), 1500); }
  }
  async function checkVersion() {
    if (leaving) return;
    if (newVersion) { if (calm()) updateNow(); return; }
    const v = await serverVersion();
    if (!v) return;
    if (builtVersion === null) builtVersion = v;
    else if (v !== builtVersion) { newVersion = true; if (calm()) updateNow(); }
  }
  checkVersion();
  setInterval(checkVersion, 120000);
  setInterval(() => { if (newVersion && calm()) updateNow(); }, 2000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVersion(); });
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
  const rebirthLvl = () => 12 + save.rebirths * 2 - pperk('preif');
  const RARITY_ORDER = ['junk', 'common', 'uncommon', 'rare', 'wii', 'epic', 'legendary'];
  const PERKS = [
    { id: 'taler',  icon: '🪝', name: 'Goldener Haken', desc: l => tr('+{n} % Taler pro Fang', { n: l * 8 }) },
    { id: 'glueck', icon: '🍀', name: 'Glückspilz',     desc: l => tr('+{n} % Glück für seltene Fische', { n: l * 8 }) },
    { id: 'biss',   icon: '⏱️', name: 'Lockruf',        desc: l => tr('Bisse kommen {n} % schneller', { n: l * 8 }) },
    { id: 'schnur', icon: '🧵', name: 'Starke Schnur',  desc: l => tr('{n} % weniger Spannung', { n: l * 6 }) },
    { id: 'wissen', icon: '📚', name: 'Anglerwissen',   desc: l => tr('+{n} % Erfahrung', { n: l * 15 }) },
    { id: 'erbe',   icon: '💰', name: 'Erbstück',       desc: l => tr('Start mit {n} Talern nach der Wiedergeburt', { n: l * 150 }) },
    { id: 'mass',   icon: '📏', name: 'Maßband',        desc: l => tr('+{n} % Chance auf Kapital- und Monster-Fänge', { n: l * 15 }) },
    { id: 'wetter', icon: '🌦️', name: 'Wetterfrosch',   desc: l => tr('Wetterboni +{n} % stärker', { n: l * 10 }) },
    { id: 'nacht',  icon: '🌙', name: 'Nachtangler',    reb: 5, desc: l => tr('Nachts +{n} % Taler und EP', { n: l * 10 }) },
    { id: 'boss',   icon: '🦈', name: 'Bossjäger',      reb: 5, desc: l => tr('+{n} % Schaden gegen den Odfisch', { n: l * 10 }) },
  ];
  trAll(PERKS, ['name']);
  const perkMax = () => save.rebirths >= 5 ? 10 : 5; // from the 5th rebirth talents go up to level 10
  // Prestige: from the 7th rebirth start over completely. Rebirths, rank, Schuppen, talents and
  // the forge go too; in return Perlen for prestige talents and a bonus that never resets.
  const PRESTIGE_REB = 7;
  const PPERKS = [
    { id: 'ptaler',    icon: '🦪', name: 'Perlenhaken',   max: 10, desc: l => tr('+{n} % Taler', { n: l * 10 }) },
    { id: 'pglueck',   icon: '🌟', name: 'Perlenglück',   max: 10, desc: l => tr('+{n} % Glück für seltene Fische', { n: l * 10 }) },
    { id: 'pschuppen', icon: '🐚', name: 'Schuppensegen', max: 10, desc: l => tr('+{n} % Schuppen bei jeder Wiedergeburt', { n: l * 20 }) },
    { id: 'preif',     icon: '⏩', name: 'Frühreif',      max: 5,  desc: l => tr('Wiedergeburt {n} Level früher', { n: l }) },
    { id: 'pkarte',    icon: '🗺️', name: 'Seekarte',      max: 1,  desc: () => tr('Hohe See und Odköder schon ohne Wiedergeburt') },
  ];
  trAll(PPERKS, ['name']);
  function pperk(id) { return (save.pperks && save.pperks[id]) | 0; }
  const pperkCost = l => 1 + l;
  const pearlsFor = () => 3 + Math.max(0, save.rebirths - PRESTIGE_REB) * 2;
  const presMark = n => n ? '✦' + n + ' ' : ''; // shown in front of the rank
  const nightMult = () => isNight() ? 1 + .1 * perk('nacht') : 1;
  // Fisch-Meisterschaft: bronze, silver and gold for catching the same fish again and again
  const MASTERY = { common: [10, 50, 200], junk: [10, 50, 200], uncommon: [8, 40, 150], rare: [5, 25, 100], wii: [5, 25, 100], epic: [3, 15, 60], legendary: [2, 8, 30] };
  const MASTERY_XP = { common: 1, junk: 1, uncommon: 1.3, rare: 1.8, wii: 2, epic: 2.5, legendary: 4 };
  const MEDALS = ['', '🥉', '🥈', '🥇'], MEDAL_NAMES = ['', tr('Bronze'), tr('Silber'), tr('Gold')];
  const masteryNeed = f => f.boss ? [1, 3, 10] : MASTERY[f.r] || MASTERY.common;
  const masteryCount = m => FISH.filter(f => ((save.dex[f.id] || {}).m || 0) >= m).length;
  const goldBonus = () => Math.min(40, masteryCount(3)); // +1 % Taler per gold fish, at most +40 %
  function masteryTier(f) { const e = save.dex[f.id], need = masteryNeed(f); let m = 0; while (e && m < 3 && e.n >= need[m]) m++; return m; }
  function checkMastery(f) {
    const e = save.dex[f.id]; if (!e) return;
    const to = masteryTier(f);
    for (let m = (e.m || 0) + 1; m <= to; m++) {
      const xp = Math.round([0, 50, 200, 600][m] * (MASTERY_XP[f.r] || 1)), sc = [0, 0, 1, 3][m];
      e.m = m; save.scales += sc; gainXp(xp);
      setTimeout(() => {
        toast(tr('{i} {m}-Meister: {f}! +{x} EP', { i: MEDALS[m], m: MEDAL_NAMES[m], f: f.name, x: xp }) + (sc ? ` · +${sc} 🐚` : '') + (m === 3 ? tr(' · dauerhaft +1 % Taler') : ''));
        (m === 3 ? [523, 659, 784, 1047] : [523, 659, 784]).forEach((n, i) => setTimeout(() => tone(n, .12, 'triangle', .06), i * 90));
      }, 2600 + m * 300);
    }
  }
  // older saves: medals for catches made before mastery existed, quietly (only the Schuppen)
  { let medals = 0, sc = 0;
    for (const f of FISH) { const e = save.dex[f.id]; if (!e || e.m !== undefined) continue; const m = masteryTier(f); e.m = m; medals += m; for (let i = 1; i <= m; i++) sc += [0, 0, 1, 3][i]; }
    if (medals) { save.scales += sc; setTimeout(() => toast(tr('🏅 Fisch-Meisterschaft nachgetragen: {n} Medaillen, +{s} 🐚. Schau in den Fischdex!', { n: medals, s: sc })), 3000); } }
  // ranks by rebirths, and what each rebirth unlocks
  const RANKS = [[0, 'Lehrling'], [1, 'Angler'], [2, 'Fischer'], [3, 'Seemann'], [4, 'Kapitän'], [5, 'Seebär'], [6, 'Tiefseetaucher'], [8, 'Meeresmeister'], [10, 'Fischgott']].map(([r, n]) => ({ r, name: tr(n) }));
  const rankOf = n => RANKS.filter(k => (n | 0) >= k.r).pop();
  const MILESTONES = [
    { r: 1, t: 'Regenbogenrute' }, { r: 2, t: 'Mondköder' }, { r: 3, t: 'Sternenrute, Hohe See und Odköder' }, { r: 4, t: 'Tiefseerute' },
    { r: 5, t: 'Abgrundköder, Talente bis Stufe 10 und zwei neue Talente' }, { r: 6, t: 'Krakenrute' }, { r: 8, t: 'Seebären-Jacke' }, { r: 10, t: 'Fischgott-Krone' },
  ];
  trAll(MILESTONES, ['t']);
  const perkCost = l => 2 + l * 2;
  function perk(id) { return save.perks[id] || 0; }
  // Taler bonus in three groups: inside a group the boni add up, only the groups multiply
  //   path (rebirths, Erbe, prestige) × talents (Goldener Haken, Perlenhaken) × collection (Fischdex, gold medals)
  const pathMult = (reb = save.rebirths, heir = save.rebHeir || 0, pres = save.prestige) => 1 + .2 * (reb + heir) + pres;
  const talentMult = () => 1 + .08 * perk('taler') + .1 * pperk('ptaler');
  const collectMult = () => 1 + (dexPerk('taler10') ? .1 : 0) + goldBonus() / 100;
  function coinMult() { return pathMult() * talentMult() * collectMult(); }
  // what the bonus would be right after the next prestige (talents reset, Erbe grows)
  function coinMultAfterPrestige() { return pathMult(0, (save.rebHeir || 0) + save.rebirths * .4, save.prestige + 1) * (1 + .1 * pperk('ptaler')) * collectMult(); }
  function lockText(item) {
    if (item.pres && save.prestige < item.pres) return tr('🔒 {n}× Prestige', { n: item.pres });
    if (item.depth && caveDepth() < item.depth) return tr('🔒 Tiefe {n}', { n: item.depth });
    if (item.reb && save.rebirths < item.reb && !(item.boss && pperk('pkarte'))) return tr('🔒 {n}× Wiedergeburt', { n: item.reb });
    if (item.lvl && save.lvl < item.lvl) return tr('🔒 Level {n}', { n: item.lvl });
    return '';
  }
  // Schuppen: half the level plus a share for the Taler earned, capped so huge late-game incomes don't flood the talents
  function scalesFor() { return Math.floor((Math.floor(save.lvl / 2) + Math.min(20 + 4 * save.rebirths, Math.floor(Math.sqrt(save.lifeCoins / 40)))) * (1 + .2 * pperk('pschuppen'))); }

  function gainXp(n, quiet) {
    const add = Math.round(n * (1 + .15 * perk('wissen')) * (1 + .25 * save.prestige));
    save.xp += add;
    const from = save.lvl;
    let reward = 0;
    const ms = [];
    while (save.xp >= xpNeed(save.lvl)) {
      save.xp -= xpNeed(save.lvl); save.lvl++; reward += 20 * save.lvl;
      if (save.lvl % 5 === 0) { // every 5 levels: a milestone with Schuppen, and every 10 a mystery box
        const sc = 1 + Math.floor(save.lvl / 10); save.scales += sc;
        let box = '';
        if (save.lvl % 10 === 0) { const b = BOXES[Math.min(2, Math.floor(save.lvl / 20))]; save.boxes[b.id] = (save.boxes[b.id] || 0) + 1; box = b.name; }
        ms.push(tr('🎁 Level-{l}-Meilenstein: +{s} 🐚', { l: save.lvl, s: sc }) + (box ? tr(' · eine {b} (im Laden öffnen)', { b: box }) : ''));
      }
    }
    if (!quiet) ms.forEach((m, i) => setTimeout(() => toast(m), 1200 + i * 600));
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
    $('lvl').title = tr('Level {l} · {x}/{n} EP', { l: save.lvl, x: save.xp, n: xpNeed(save.lvl) }) + (save.rebirths ? tr(' · {n}× wiedergeboren', { n: save.rebirths }) : '') + (save.prestige ? tr(' · {n}× Prestige', { n: save.prestige }) : '') + ' · ' + presMark(save.prestige) + rankOf(save.rebirthsTotal).name;
    $('lvl-reb').textContent = (save.prestige ? '✦' + save.prestige : '') + (save.rebirths ? '🌀' + save.rebirths : '');
    $('btn-prog').classList.toggle('ready', save.lvl >= rebirthLvl() || save.rebirths >= PRESTIGE_REB || save.quests.some(q => q.p >= q.n) || (lavaOpen() && (save.glimmQ.some(q => q.p >= q.n) || canDig())));
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
  // Wochenziele: three bigger goals per week, the same for everyone (picked from the week number like the weather)
  const WEEK_POOL = [
    { k: 'count', n: 150, t: 'Fange {n} Fische' }, { k: 'rare', n: 30, t: 'Fange {n}× selten oder besser' },
    { k: 'epic', n: 6, t: 'Fange {n}× episch oder besser' }, { k: 'legend', n: 2, t: 'Fange {n} legendäre Fische' },
    { k: 'night', n: 40, t: 'Fange {n} Fische bei Nacht' }, { k: 'shiny', n: 1, t: 'Fange einen Shiny' },
    { k: 'sea', n: 50, t: 'Fange {n} Fische auf Hoher See', need: () => seaOpen() }, { k: 'lava', n: 60, t: 'Fange {n} Fische in der Glutgrotte', need: () => lavaOpen() },
  ];
  const weekId = () => Math.floor((Date.now() / 864e5 + 3) / 7); // weeks start on Monday
  function weekGoals() {
    const id = weekId(), pool = WEEK_POOL.filter(g => !g.need || g.need()), out = [];
    for (let i = 0; out.length < 3 && i < 50; i++) { const g = pool[Math.floor(slotHash(id * 7 + i, 0x7eec) * pool.length)]; if (!out.includes(g)) out.push(g); }
    return out;
  }
  function weekState() {
    if (!save.week || save.week.id !== weekId()) save.week = { id: weekId(), p: {}, done: {} };
    return save.week;
  }
  function weekProgress(f, shiny) {
    const w = weekState();
    for (const g of weekGoals()) {
      if (w.done[g.k]) continue;
      const hit = { count: f.r !== 'junk', rare: ['rare', 'wii', 'epic', 'legendary'].includes(f.r), epic: ['epic', 'legendary'].includes(f.r), legend: f.r === 'legendary',
        night: isNight() && f.r !== 'junk', shiny: !!shiny, sea: onSea() && f.r !== 'junk', lava: inLava() && f.r !== 'junk' }[g.k];
      if (!hit) continue;
      w.p[g.k] = (w.p[g.k] || 0) + 1;
      if (w.p[g.k] >= g.n) {
        w.done[g.k] = true;
        const sc = 6, pearl = save.prestige ? 1 : 0, glut = lavaOpen() ? 40 : 0;
        save.scales += sc; save.pearls += pearl; save.glut = (save.glut | 0) + glut;
        setTimeout(() => toast(tr('📅 Wochenziel geschafft: {t}! +{s} 🐚', { t: tr(g.t, { n: g.n }), s: sc }) + (pearl ? ' · +1 🦪' : '') + (glut ? ` · +${glut} 🔥` : '')), 2200);
        [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => tone(n, .14, 'triangle', .07), 2200 + i * 90));
      }
    }
  }
  function fillQuests() { while (save.quests.length < 3) save.quests.push(makeQuest()); if (lavaOpen()) while (save.glimmQ.length < 3) save.glimmQ.push(makeGlimmQuest()); }
  // Glimms Aufträge: quests that only count in the Glutgrotte, with big rewards; every 3 done raise
  // Glimm's trust (+5 % Taler in the cave per level, up to 10). They survive rebirth and prestige.
  const GLIMM_TRUST_MAX = 10;
  function glimmTrust() { return Math.min(GLIMM_TRUST_MAX, Math.floor((save.glimmDone | 0) / 3)); }
  // Taler bonus in the cave: +20 % heat bonus, +10 % per depth, +3 % per trust level and +5 % per Glutnetz level (at most about ×3.3)
  function caveBonus() { return 1.2 * (1 + .1 * (caveDepth() - 1)) * (1 + .03 * glimmTrust()) * (1 + .05 * glutUp('netz')); }
  function caveMult() { return inLava() ? caveBonus() : 1; }
  function canDig() { const nx = CAVE_DEPTHS[caveDepth()]; return !!nx && save.glut >= nx.cost; }
  function digDeeper() {
    const nx = CAVE_DEPTHS[caveDepth()];
    if (!nx || save.glut < nx.cost) return;
    save.glut -= nx.cost; save.caveDepth = nx.n; bgKey = '';
    const fish = FISH.filter(f => f.depth === nx.n).map(f => f.name), rods = RODS.filter(r => r.depth === nx.n).map(r => r.name);
    const st = $('stage'); st.classList.remove('reborn'); void st.offsetWidth; st.classList.add('reborn');
    [196, 247, 294, 392, 494, 587, 784].forEach((n, i) => setTimeout(() => tone(n, .22, 'square', .06), i * 100));
    toast(tr('⛏️ Tiefe {n} erreicht: {t}! Neu: {f}', { n: nx.n, t: nx.name, f: [...fish, ...rods].join(', ') }));
    glimmLine = tr('Tiefer, immer tiefer! Hier unten wird es richtig heiß.'); glimmTalk = 3;
    checkCosm(); fillQuests(); persist(); updateCoins(); updateWeatherPill(); renderProg();
  }
  function buyGlutUp(id) {
    const u = GLUT_UPS.find(x => x.id === id), l = glutUp(id), c = glutUpCost(l);
    if (!u || l >= u.max || save.glut < c) return;
    save.glut -= c; save.glutUps[id] = l + 1; sfx.coin(); persist(); updateCoins(); renderProg();
  }
  function makeGlimmQuest() {
    const used = save.glimmQ.map(q => q.kind);
    const kinds = ['lcount', 'lfish', 'lrar', 'lcoins'].filter(k => !used.includes(k));
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const q = { kind, p: 0 };
    if (kind === 'lcount') q.n = 8 + Math.floor(Math.random() * 8);
    if (kind === 'lfish') { const pool = FISH.filter(f => f.map === 'lava' && ['common', 'uncommon', 'rare'].includes(f.r) && !f.needs && !f.far && f.depth <= caveDepth()); const f = pool[Math.floor(Math.random() * pool.length)]; q.id = f.id; q.n = f.r === 'rare' ? 2 : f.r === 'uncommon' ? 3 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 2); }
    if (kind === 'lrar') { q.r = caveDepth() >= 3 ? 'epic' : 'rare'; q.n = q.r === 'epic' ? 1 + (Math.random() < .4 ? 1 : 0) : 2 + Math.floor(Math.random() * 2); }
    if (kind === 'lcoins') q.n = Math.round(6000 * coinMult() / 100) * 100;
    const tier = { lcount: 1, lfish: 1.3, lrar: q.r === 'epic' ? 2 * q.n : .8 * q.n, lcoins: 1.2 }[kind], deep = 1 + .25 * (caveDepth() - 1);
    q.coins = Math.round(1200 * tier * deep * coinMult() / 50) * 50;
    q.xp = Math.round(300 * tier);
    q.glut = Math.round(15 * tier * (1 + .25 * (caveDepth() - 1)));
    if (kind === 'lrar' && q.r === 'epic') q.pearls = 1;
    return q;
  }
  function glimmQuestText(q) {
    switch (q.kind) {
      case 'lcount': return tr('Fange {n} Fische in der Glutgrotte', { n: q.n });
      case 'lfish': return tr('Fange {n}× {f}', { n: q.n, f: FISH.find(f => f.id === q.id).name });
      case 'lrar': return tr('Fange {n}× {r} oder besser in der Glutgrotte', { n: q.n, r: RARITY[q.r || 'epic'].label });
      case 'lcoins': return tr('Verdiene {n} Taler in der Glutgrotte', { n: q.n.toLocaleString(I18N.locale) });
    }
  }
  function claimGlimm(i) {
    const q = save.glimmQ[i]; if (!q || q.p < q.n) return;
    const before = glimmTrust();
    save.glimmQ.splice(i, 1); save.glimmDone = (save.glimmDone | 0) + 1;
    save.coins += q.coins; save.lifeCoins += q.coins; save.totalEarned += q.coins;
    if (q.pearls) save.pearls += q.pearls;
    if (q.glut) save.glut += q.glut;
    sfx.coin(); toast(tr('⛏️ Glimm zahlt: +{c} Taler · +{x} EP', { c: q.coins.toLocaleString(I18N.locale), x: q.xp }) + (q.glut ? ` · +${q.glut} 🔥` : '') + (q.pearls ? tr(' · +{n} 🦪', { n: q.pearls }) : ''));
    gainXp(q.xp);
    if (glimmTrust() > before) {
      setTimeout(() => toast(tr('🤝 Glimm vertraut dir mehr: Stufe {n}/{m} · +{p} % Taler in der Glutgrotte', { n: glimmTrust(), m: GLIMM_TRUST_MAX, p: glimmTrust() * 3 })), 1400);
      [392, 523, 659, 784].forEach((n, k) => setTimeout(() => tone(n, .14, 'triangle', .07), 1400 + k * 90));
    }
    fillQuests(); persist(); updateCoins(); renderProg();
  }
  function rerollGlimm(i) {
    const cost = 500;
    if (save.coins < cost) return;
    spend(cost); save.glimmQ.splice(i, 1, makeGlimmQuest()); persist(); updateCoins(); renderProg();
  }
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
    weekProgress(f, shiny);
    const c = catchXp(f, size, first, mut, newMut, clean, shiny, newShiny);
    const gain = { xp: gainXp(Math.round(c.n * nightMult())), tags: c.tags };
    for (const q of save.quests) {
      if (q.p >= q.n) continue;
      if (q.kind === 'count' && f.r !== 'junk') q.p++;
      if (q.kind === 'rar' && f.r !== 'junk' && RARITY_ORDER.indexOf(f.r) >= RARITY_ORDER.indexOf(q.r)) q.p++;
      if (q.kind === 'size' && size >= q.cm) q.p++;
      if (q.kind === 'coins') q.p = Math.min(q.n, q.p + val);
      if (q.kind === 'fish' && f.id === q.id) q.p++;
      if (q.p >= q.n) toast(tr('📜 Auftrag erledigt: {q} – im Fortschritt abholen', { q: questText(q) }));
    }
    if (inLava()) for (const q of save.glimmQ) {
      if (q.p >= q.n) continue;
      if (q.kind === 'lcount' && f.r !== 'junk') q.p++;
      if (q.kind === 'lfish' && f.id === q.id) q.p++;
      if (q.kind === 'lrar' && RARITY_ORDER.indexOf(f.r) >= RARITY_ORDER.indexOf(q.r || 'epic')) q.p++;
      if (q.kind === 'lcoins') q.p = Math.min(q.n, q.p + val);
      if (q.p >= q.n) toast(tr('⛏️ Glimm: Auftrag erledigt – {q}. Bei Glimm abholen!', { q: glimmQuestText(q) }));
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
  // QoL: claim every finished quest (normal and Glimm's) with one click
  function claimAll() {
    let n = 0, guard = 20;
    while (guard-- > 0) {
      const i = save.quests.findIndex(q => q.p >= q.n);
      if (i >= 0) { claimQuest(i); n++; continue; }
      const j = lavaOpen() ? save.glimmQ.findIndex(q => q.p >= q.n) : -1;
      if (j >= 0) { claimGlimm(j); n++; continue; }
      break;
    }
    if (n > 1) setTimeout(() => toast(tr('📜 {n} Aufträge auf einmal abgeholt!', { n })), 300);
  }
  function rerollQuest(i) {
    const cost = 10 + save.lvl * 2;
    if (save.coins < cost) return;
    spend(cost); save.quests.splice(i, 1); save.quests.splice(i, 0, makeQuest()); persist(); updateCoins(); renderProg();
  }

  // ---- rebirth
  function rebirth() {
    if (save.lvl < rebirthLvl()) return;
    const gain = scalesFor();
    if (!confirm(tr('Wiedergeburt?\n\nDu bekommst {n} Schuppen und dauerhaft +20 % Taler.\nTaler, Ruten, Köder, Level, Aufträge, Glutsteine und die Grotten-Tiefe werden zurückgesetzt.\nFischdex, Rekorde und Talente bleiben.', { n: gain }))) return;
    const oldRank = rankOf(save.rebirthsTotal);
    save.rebirths++; save.rebirthsTotal++; save.scales += gain;
    Object.assign(save, { lvl: 1, xp: 0, coins: perk('erbe') * 150, rod: 'stock', rods: ['stock'], lavaRod: '', glut: 0, caveDepth: 1, bait: 'wurm', baits: { wurm: Infinity }, lifeCoins: 0, quests: [], forge: {} });
    const newRank = rankOf(save.rebirthsTotal), ms = MILESTONES.find(m => m.r === save.rebirths);
    if (newRank !== oldRank) setTimeout(() => toast(tr('🎖️ Neuer Rang: {r}!', { r: newRank.name })), 2400);
    if (ms) setTimeout(() => toast(tr('🔓 Neu freigeschaltet: {t}', { t: ms.t })), 4400);
    checkCosm();
    // the cave starts again at depth 1: open Glimm jobs may ask for deeper fish, so only finished ones stay
    save.glimmQ = (save.glimmQ || []).filter(q => q.p >= q.n); bgKey = ''; wx = currentWeather(); updateWeatherPill();
    fillQuests(); persist(); updateCoins(); updateGear(); updateLevel(); renderProg();
    const st = $('stage'); st.classList.remove('reborn'); void st.offsetWidth; st.classList.add('reborn');
    [262, 330, 392, 523, 659, 784, 1047].forEach((n, i) => setTimeout(() => tone(n, .25, 'triangle', .08), i * 120));
    toast(tr('🌀 Wiedergeboren! +{n} Schuppen · Taler-Bonus jetzt +{p} %', { n: gain, p: Math.round((coinMult() - 1) * 100) }));
    checkCosm();
    if (save.lb) { save.lbT = 0; lbSubmit(true); } // the leaderboard shows the new rebirth at once
  }
  function buyPerk(id) {
    const l = perk(id), c = perkCost(l);
    if (l >= perkMax() || save.scales < c) return;
    save.scales -= c; save.perks[id] = l + 1; sfx.coin(); persist(); renderProg();
  }

  // ---- prestige
  function prestige() {
    if (save.rebirths < PRESTIGE_REB) return;
    const gain = pearlsFor();
    if (!confirm(tr('Prestige?\n\nDu bekommst {n} Perlen, dauerhaft +100 % Taler und +25 % EP. 40 % deiner Wiedergeburten zählen als Erbe weiter für den Taler-Bonus.\nZurückgesetzt werden Level, Taler, Ruten (auch Lavaruten), Köder, Wiedergeburten, Schuppen, Talente, Glutsteine, die Grotten-Tiefe und die Schmiede.\nFischdex, Medaillen, Rekorde, Kosmetik, Rang und Perlen-Talente bleiben.', { n: gain }))) return;
    checkCosm(true); // keep the rebirth cosmetics earned so far
    save.rebHeir = (save.rebHeir || 0) + save.rebirths * .4; // the Erbe keeps 40 % of these rebirths in the Taler bonus
    save.prestige++; save.pearls += gain;
    Object.assign(save, { rebirths: 0, scales: 0, perks: {}, lvl: 1, xp: 0, coins: 0, rod: 'stock', rods: ['stock'], lavaRod: '', glut: 0, caveDepth: 1, bait: 'wurm', baits: { wurm: Infinity }, lifeCoins: 0, quests: [], forge: {} });
    if (save.map === 'see' && !seaOpen()) { save.map = 'steg'; bgKey = ''; boss.invite = null; $('btn-boss').hidden = true; updateMapUi(); }
    // the cave starts again at depth 1: open Glimm jobs may ask for deeper fish, so only finished ones stay
    save.glimmQ = (save.glimmQ || []).filter(q => q.p >= q.n); bgKey = ''; wx = currentWeather(); updateWeatherPill();
    fillQuests(); persist(); updateCoins(); updateGear(); updateLevel(); renderProg();
    const st = $('stage'); st.classList.remove('reborn'); void st.offsetWidth; st.classList.add('reborn');
    [196, 262, 330, 392, 523, 659, 784, 1047, 1319].forEach((n, i) => setTimeout(() => tone(n, .3, 'triangle', .08), i * 110));
    toast(tr('✦ Prestige {p}! +{n} Perlen · Taler-Bonus jetzt +{b} %', { p: save.prestige, n: gain, b: Math.round((coinMult() - 1) * 100) }));
    checkCosm();
    if (save.lb) { save.lbT = 0; lbSubmit(true); } // rebirths drop to 0 on the leaderboard too
  }
  function buyPPerk(id) {
    const p = PPERKS.find(x => x.id === id), l = pperk(id), c = pperkCost(l);
    if (!p || l >= p.max || save.pearls < c) return;
    save.pearls -= c; save.pperks[id] = l + 1; sfx.coin(); persist(); renderProg(); updateMapUi();
  }

  function agoText(t) {
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return tr('gerade eben');
    if (m < 60) return tr('vor {n} Min.', { n: m });
    if (m < 1440) return tr('vor {n} Std.', { n: Math.floor(m / 60) });
    return tr('vor {n} Tagen', { n: Math.floor(m / 1440) });
  }
  function renderHistory() {
    const box = $('prog-history');
    $('hist-n').textContent = save.history.length;
    if (!save.history.length) {
      const p = document.createElement('p'); p.className = 'sub'; p.textContent = tr('Noch keine Fänge. Wirf die Angel aus!');
      return box.replaceChildren(p);
    }
    const MAPI = { steg: '🏝️', see: '⛵', lava: '🌋' };
    box.replaceChildren(...save.history.map(h => {
      const f = FISH.find(x => x.id === h.id), mu = h.m && MUTATIONS.find(x => x.id === h.m), sc = SIZE_CLASSES[h.c] || SIZE_CLASSES[1];
      const d = document.createElement('div'); d.className = 'hist b-' + f.r;
      const img = document.createElement('img'); img.src = f.img; img.alt = ''; img.loading = 'lazy';
      img.className = [f.pixel ? 'pixel' : '', f.photo ? 'photo' : '', h.sh ? 'shiny' : ''].join(' ').trim();
      if (h.sh) img.style.setProperty('--shiny-hue', shinyHue(f.id) + 'deg');
      const txt = document.createElement('div');
      const b = document.createElement('b'); b.textContent = (h.sh ? '💫 ' : '') + (mu ? mu.icon + ' ' : '') + f.name;
      const s = document.createElement('small');
      s.textContent = [`${(MAPI[h.map] || '')} ${h.s.toLocaleString(I18N.locale)} cm`.trim(), h.c >= 2 && f.r !== 'junk' ? sc.icon + ' ' + sc.name : '', mu ? mu.name : '', agoText(h.t)].filter(Boolean).join(' · ');
      txt.append(b, s);
      const v = document.createElement('span'); v.className = 'hist-val'; v.textContent = '+' + h.v.toLocaleString(I18N.locale);
      v.title = tr('{n} Taler', { n: h.v.toLocaleString(I18N.locale) });
      d.append(img, txt, v);
      return d;
    }));
  }
  function renderProg() {
    renderHistory();
    updateLevel();
    const need = xpNeed(save.lvl);
    $('prog-level').textContent = save.lvl;
    $('prog-xp').textContent = tr('{x} / {n} EP', { x: save.xp, n: need });
    $('prog-xpbar').style.width = Math.min(100, save.xp / need * 100) + '%';
    const rk = rankOf(save.rebirthsTotal), nrk = RANKS.find(k => k.r > save.rebirthsTotal);
    $('prog-rank').textContent = tr('🎖️ Rang: {r}', { r: presMark(save.prestige) + rk.name }) + (nrk ? tr(' · nächster Rang: {r} bei {n}× Wiedergeburt', { r: nrk.name, n: nrk.r }) : tr(' · höchster Rang erreicht'));
    $('prog-stats').textContent = tr('{a} Fänge · {b} Aufträge · {c}× wiedergeboren · Taler-Bonus +{p} %', { a: save.total, b: save.questsDone, c: save.rebirths, p: Math.round((coinMult() - 1) * 100) }) + tr(' · ⏱ Spielzeit {t}', { t: fmtPlay(save.playTime) }) + (save.prestige ? tr(' · {n}× Prestige (+{t} % EP)', { n: save.prestige, t: save.prestige * 25 }) : '');
    const left = dailyLeft();
    $('prog-bonus').textContent = (left ? tr('☀️ Tagesbonus: noch {n} Fänge mit doppelten EP', { n: left }) : tr('☀️ Tagesbonus für heute aufgebraucht – morgen wieder')) +
      tr(' · 🔥 Serie {n} (Rekord {r})', { n: streak, r: save.bestStreak || 0 });
    const questRow = (q, text, cost, claim, reroll) => {
      const done = q.p >= q.n, d = document.createElement('div');
      d.className = 'quest' + (done ? ' done' : '');
      const txt = document.createElement('div');
      const b = document.createElement('b'); b.textContent = text;
      const bar = document.createElement('div'); bar.className = 'qbar';
      const fill = document.createElement('i'); fill.style.width = Math.min(100, q.p / q.n * 100) + '%'; bar.append(fill);
      const s = document.createElement('small'); s.textContent = tr('{a} / {b} · Belohnung {c} Taler, {x} EP', { a: Math.min(q.p, q.n).toLocaleString(I18N.locale), b: q.n.toLocaleString(I18N.locale), c: q.coins.toLocaleString(I18N.locale), x: q.xp }) + (q.glut ? `, ${q.glut} 🔥` : '') + (q.pearls ? tr(', {n} Perle', { n: q.pearls }) : '');
      txt.append(b, bar, s);
      const btn = document.createElement('button'); btn.className = 'btn' + (done ? '' : ' ghost');
      btn.textContent = done ? tr('Abholen') : `🔄 ${cost}`;
      btn.title = done ? tr('Belohnung abholen') : tr('Neuer Auftrag für {n} Taler', { n: cost });
      btn.disabled = !done && save.coins < cost;
      btn.addEventListener('click', () => done ? claim() : reroll());
      d.append(txt, btn);
      return d;
    };
    const doneN = save.quests.filter(q => q.p >= q.n).length + (lavaOpen() ? save.glimmQ.filter(q => q.p >= q.n).length : 0);
    $('claim-all').hidden = doneN < 2;
    $('claim-all').textContent = tr('📜 Alle abholen ({n})', { n: doneN });
    { // Wochenziele
      const w = weekState(), left = Math.ceil((weekId() + 1) * 7 - 3 - Date.now() / 864e5);
      $('week-left').textContent = tr('noch {n} Tage', { n: Math.max(1, left) });
      $('week-goals').replaceChildren(...weekGoals().map(g => {
        const p = Math.min(g.n, w.p[g.k] || 0), done = !!w.done[g.k], d = document.createElement('div');
        d.className = 'quest' + (done ? ' done' : '');
        const txt = document.createElement('div');
        const b = document.createElement('b'); b.textContent = (done ? '✅ ' : '') + tr(g.t, { n: g.n });
        const bar = document.createElement('div'); bar.className = 'qbar';
        const fill = document.createElement('i'); fill.style.width = p / g.n * 100 + '%'; bar.append(fill);
        const sm = document.createElement('small'); sm.textContent = tr('{a} / {b} · Belohnung 6 🐚', { a: p, b: g.n }) + (save.prestige ? tr(', 1 Perle') : '') + (lavaOpen() ? ', 40 🔥' : '');
        txt.append(b, bar, sm); d.append(txt); return d;
      }));
    }
    { // the next goals at a glance
      const parts = [], rl = rebirthLvl(), cd = caveDepth(), nx = CAVE_DEPTHS[cd];
      parts.push(save.lvl >= rl ? tr('🌀 Wiedergeburt bereit') : tr('🌀 Wiedergeburt in {n} Level', { n: rl - save.lvl }));
      parts.push(save.rebirths >= PRESTIGE_REB ? tr('✦ Prestige bereit') : tr('✦ Prestige in {n} Wiedergeburten', { n: PRESTIGE_REB - save.rebirths }));
      if (lavaOpen() && nx) parts.push(save.glut >= nx.cost ? tr('⛏️ Tiefe {n} bereit', { n: nx.n }) : tr('⛏️ Tiefe {n} in {c} 🔥', { n: nx.n, c: nx.cost - save.glut }));
      const lvlNext = Math.ceil((save.lvl + 1) / 5) * 5; parts.push(tr('🎁 Meilenstein bei Level {n}', { n: lvlNext }));
      $('prog-next').textContent = parts.join(' · ');
    }
    $('prog-quests').replaceChildren(...save.quests.map((q, i) => questRow(q, questText(q), 10 + save.lvl * 2, () => claimQuest(i), () => rerollQuest(i))));
    $('glimm-sec').hidden = !lavaOpen();
    if (lavaOpen()) {
      fillQuests();
      const tl = glimmTrust();
      $('glimm-trust').textContent = tr('🤝 Vertrauen {n}/{m} · +{p} % Taler in der Glutgrotte (dazu immer +20 % Hitzebonus)', { n: tl, m: GLIMM_TRUST_MAX, p: tl * 3 })
        + (tl < GLIMM_TRUST_MAX ? tr(' · nächste Stufe in {n} Aufträgen', { n: 3 - (save.glimmDone % 3) }) : '');
      const cd = caveDepth(), cur = CAVE_DEPTHS[cd - 1], nx = CAVE_DEPTHS[cd];
      $('dig-info').textContent = tr('Tiefe {n}/{m}: {t} · +{p} % Taler in der Grotte · {g} 🔥', { n: cd, m: CAVE_DEPTHS.length, t: cur.name, p: Math.round((caveBonus() - 1) * 100), g: save.glut });
      $('dig-next').textContent = nx ? tr('Nächste Tiefe: {t} für {c} 🔥. Dort warten: {f}.', { t: nx.name, c: nx.cost, f: [...FISH.filter(f => f.depth === nx.n).map(f => f.name), ...RODS.filter(r => r.depth === nx.n).map(r => r.name)].join(', ') })
        : tr('Du bist ganz unten angekommen. Tiefer geht es nicht.');
      $('btn-dig').textContent = nx ? tr('Tiefer graben · {c} 🔥', { c: nx.cost }) : tr('Ganz unten');
      $('btn-dig').disabled = !nx || save.glut < nx.cost;
      $('glut-have').textContent = save.glut;
      $('glut-ups').replaceChildren(...GLUT_UPS.map(u => {
        const l = glutUp(u.id), max = l >= u.max, c = glutUpCost(l);
        const d = document.createElement('div'); d.className = 'item perk';
        const txt = document.createElement('div');
        const b = document.createElement('b'); b.textContent = `${u.icon} ${u.name}`;
        const pips = document.createElement('span'); pips.className = 'pips'; pips.textContent = '●'.repeat(l) + '○'.repeat(u.max - l); b.append(' ', pips);
        const sm = document.createElement('small'); sm.textContent = l ? u.desc(l) + (max ? '' : ` → ${u.desc(l + 1)}`) : u.desc(1);
        txt.append(b, sm);
        const btn = document.createElement('button'); btn.className = 'btn';
        btn.textContent = max ? 'Max' : `${c} 🔥`; btn.disabled = max || save.glut < c;
        btn.addEventListener('click', () => buyGlutUp(u.id));
        d.append(txt, btn); return d;
      }));
      $('glimm-quests').replaceChildren(...save.glimmQ.map((q, i) => questRow(q, glimmQuestText(q), 500, () => claimGlimm(i), () => rerollGlimm(i))));
    }
    const req = rebirthLvl(), can = save.lvl >= req;
    $('reb-info').textContent = can
      ? tr('Bereit! Du bekommst {n} Schuppen und dauerhaft +20 % Taler. Taler, Ruten, Köder, Level, Glutsteine und die Grotten-Tiefe werden zurückgesetzt. Fischdex, Rekorde und Talente bleiben.', { n: scalesFor() })
      : tr('Ab Level {r} möglich (noch {d}). Je höher dein Level und je mehr Taler du verdienst, desto mehr Schuppen gibt es (aktuell {n}).', { r: req, d: req - save.lvl, n: scalesFor() });
    $('btn-rebirth').disabled = !can;
    const ms = MILESTONES.find(m => m.r > save.rebirths);
    $('reb-next').textContent = ms ? tr('Nächste Freischaltung bei {n}×: {t}. Dazu jedes Mal eine neue Hutfarbe und +20 % Taler.', { n: ms.r, t: ms.t }) : tr('Alles freigeschaltet. Jede weitere Wiedergeburt: +20 % Taler.');
    $('prog-scales').textContent = save.scales;
    $('prog-perk-lock').hidden = save.rebirths >= 5;
    $('prog-perks').replaceChildren(...PERKS.filter(p => !p.reb || save.rebirths >= p.reb).map(p => {
      const l = perk(p.id), max = l >= perkMax(), c = perkCost(l);
      const d = document.createElement('div'); d.className = 'item perk';
      const txt = document.createElement('div');
      const b = document.createElement('b'); b.textContent = `${p.icon} ${p.name}`;
      const pips = document.createElement('span'); pips.className = 'pips';
      pips.textContent = '●'.repeat(l) + '○'.repeat(Math.max(0, perkMax() - l)); b.append(' ', pips);
      const s = document.createElement('small'); s.textContent = l ? p.desc(l) + (max ? '' : ` → ${p.desc(l + 1)}`) : p.desc(1);
      txt.append(b, s);
      const btn = document.createElement('button'); btn.className = 'btn';
      btn.textContent = max ? 'Max' : `${c} 🐚`; btn.disabled = max || save.scales < c;
      btn.addEventListener('click', () => buyPerk(p.id));
      d.append(txt, btn);
      return d;
    }));
    const pcan = save.rebirths >= PRESTIGE_REB;
    $('pres-info').textContent = pcan
      ? tr('Bereit! Du bekommst {n} Perlen, dauerhaft +100 % Taler und +25 % EP – und {e} deiner {w} Wiedergeburten zählen als Erbe weiter. Taler-Bonus danach: +{a} % statt jetzt +{b} %.', { n: pearlsFor(), e: (save.rebirths * .4).toLocaleString(I18N.locale, { maximumFractionDigits: 1 }), w: save.rebirths, a: Math.round((coinMultAfterPrestige() - 1) * 100), b: Math.round((coinMult() - 1) * 100) })
      : tr('Ab {r}× Wiedergeburt möglich (noch {d}). Fängt fast alles von vorn an, auch die Talente – dafür gibt es Perlen, dauerhaft +100 % Taler und +25 % EP pro Prestige, und 40 % deiner Wiedergeburten zählen als Erbe weiter.', { r: PRESTIGE_REB, d: PRESTIGE_REB - save.rebirths });
    $('btn-prestige').disabled = !pcan;
    $('prog-pearls').textContent = save.pearls;
    $('prog-pperks').replaceChildren(...PPERKS.map(p => {
      const l = pperk(p.id), max = l >= p.max, c = pperkCost(l);
      const d = document.createElement('div'); d.className = 'item perk';
      const txt = document.createElement('div');
      const b = document.createElement('b'); b.textContent = `${p.icon} ${p.name}`;
      const pips = document.createElement('span'); pips.className = 'pips';
      pips.textContent = '●'.repeat(l) + '○'.repeat(Math.max(0, p.max - l)); b.append(' ', pips);
      const s = document.createElement('small'); s.textContent = l ? p.desc(l) + (max ? '' : ` → ${p.desc(l + 1)}`) : p.desc(1);
      txt.append(b, s);
      const btn = document.createElement('button'); btn.className = 'btn';
      btn.textContent = max ? 'Max' : `${c} 🦪`; btn.disabled = max || save.pearls < c;
      btn.addEventListener('click', () => buyPPerk(p.id));
      d.append(txt, btn);
      return d;
    }));
  }
  $('btn-rebirth').addEventListener('click', rebirth);
  $('btn-prestige').addEventListener('click', prestige);
  $('claim-all').addEventListener('click', claimAll);
  $('btn-dig').addEventListener('click', digDeeper);

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
    wieder: { label: tr('🌀 Wiedergeburten'), fmt: s => s + '×' }, // current rebirths, they drop to 0 on prestige
    dex:    { label: tr('📖 Fischdex'),       fmt: s => tr('{a} Fische · {b} Mut.', { a: Math.floor(s / 100), b: s % 100 }) },
    rekord: { label: tr('📏 Rekordfang'),     fmt: s => s + ' cm' },
    klein:  { label: tr('🔬 Kleinster Fisch'), fmt: s => s ? s + ' cm' : '–' },
    monster: { label: tr('👑 Monster-Fänge'), fmt: s => s + '×' },
    boss:   { label: tr('🐟 Odfisch-Siege'),  fmt: s => s + '×' },
    prestige: { label: tr('✦ Prestige'),      fmt: s => s + '×' },
    spent:  { label: tr('💸 Ausgegeben'),     fmt: s => tr('{n} Taler', { n: s.toLocaleString(I18N.locale) }) },
  };
  const LB = { boards: null, tab: 'taler', ranks: null, err: '', busy: false };
  if (!save.totalEarned) save.totalEarned = Math.max(save.lifeCoins || 0, save.coins || 0);
  function lbScores() {
    return {
      taler: Math.floor(save.totalEarned),
      wieder: save.rebirths,
      dex: discovered() * 100 + mutsFound().length,
      rekord: Math.max(0, ...Object.values(save.dex).map(e => e.best || 0)),
      klein: Math.min(...Object.values(save.dex).map(e => e.small || Infinity), Infinity) | 0, // 0 = noch keiner
      monster: save.monsters || 0,
      boss: save.bossWins || 0,
      spent: Math.floor(save.spent || 0),
      prestige: save.prestige | 0,
    };
  }
  const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
  async function lbFetch(method, body) {
    const r = await fetch(LB_API, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch { /* not json */ }
    if (!r.ok) throw Object.assign(new Error(j.error || tr('Bestenliste gerade nicht erreichbar.')), { status: r.status });
    return j;
  }
  const TAMPER_MSG = () => tr('Dieser Spielstand wurde von Hand verändert und kann nicht in die Bestenliste.');
  async function lbSubmit(force) {
    if (!save.lb || LB.busy) return;
    if (save.tampered) { LB.err = TAMPER_MSG(); return; }
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
    if (!/^[\p{L}\p{N} ._\-!?]{1,16}$/u.test(name)) { err.textContent = tr('Name: 1–16 Zeichen (Buchstaben, Zahlen, Leerzeichen, . _ - ! ?).'); return; }
    if (!$('lb-consent').checked) { err.textContent = tr('Bitte bestätige die Einwilligung.'); return; }
    if (save.tampered) { err.textContent = TAMPER_MSG(); return; }
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


  // ------------------------------------------------------------------ multiplayer lobby
  // Up to 8 anglers share a lobby (4-letter code): everyone sees the others on the dock, their
  // catches and who has fished the most Taler since joining. No sockets: the game syncs with
  // api/lobby.js every 3 seconds while the tab is visible.
  const LOBBY_API = '/api/lobby', LOBBY_EVERY = 3000;
  const LOBBY = { code: null, me: null, players: [], feed: [], chat: [], outbox: [], seenChat: 0, err: '', busy: false, pending: [], seenFeed: 0, timer: 0 };
  async function lobbyFetch(body) {
    const r = await fetch(LOBBY_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch { /* not json */ }
    if (!r.ok) throw Object.assign(new Error(j.error ? tr(j.error) : tr('Lobby-Server gerade nicht erreichbar.')), { status: r.status });
    return j;
  }
  function lobbyMe() {
    return { x: player.x, d: player.dir, m: save.map, s: ['wait', 'bite', 'summon'].includes(state) ? 'w' : ['reel', 'rhythm', 'boss', 'crit'].includes(state) ? 'r' : 'i', hat: Math.min(HATS.length - 1, save.rebirths), ch: save.cosm.hat || '', cj: save.cosm.jacket || '', cb: save.cosm.bob || '', sk: save.cosm.skin || '', hr: save.cosm.hair || '', sc: save.lobby ? save.lobby.sc : 0, n: save.lobby ? save.lobby.n : 0, rk: Math.min(99, save.rebirthsTotal | 0), pr: save.prestige };
  }
  async function lobbySync() {
    if (!save.lobby || LOBBY.busy || document.hidden) return;
    LOBBY.busy = true;
    const ev = LOBBY.pending.shift(), msg = LOBBY.outbox.shift();
    const bossId = boss.on && !boss.solo ? boss.id : '', dmg = bossId ? Math.min(400, Math.round(boss.pend)) : 0; // the server takes at most 400 per sync
    if (dmg) boss.pend -= dmg;
    try {
      const j = await lobbyFetch({ action: 'sync', code: save.lobby.code, id: save.lobby.id, me: lobbyMe(), ev, msg, dmg, boss: bossId });
      bossFromServer(j.boss || null);
      receiveChat(j.chat || [], j.me);
      LOBBY.code = save.lobby.code; LOBBY.me = j.me; LOBBY.err = '';
      const old = new Map(LOBBY.players.map(p => [p.k, p]));
      LOBBY.players = j.players.map(p => Object.assign(p, { dx: old.has(p.k) ? old.get(p.k).dx : undefined }));
      // announce good catches of the others
      for (const e of j.feed.slice().reverse()) {
        if (e.t <= LOBBY.seenFeed) continue;
        if (LOBBY.seenFeed && e.k !== j.me && ['rare', 'wii', 'epic', 'legendary'].includes(e.r)) toast(tr('🎣 {n} hat {f} gefangen ({cm} cm)!', { n: e.n, f: e.f, cm: e.cm }));
      }
      if (j.feed.length) LOBBY.seenFeed = Math.max(LOBBY.seenFeed || 1, j.feed[0].t);
      LOBBY.feed = j.feed;
    } catch (e) {
      if (dmg && boss.on && boss.id === bossId) boss.pend += dmg;
      if (ev && e.status !== 404 && e.status !== 410) LOBBY.pending.unshift(ev);
      if (msg && e.status !== 404 && e.status !== 410) LOBBY.outbox.unshift(msg);
      if (e.status === 404 || e.status === 410) { toast(tr('👥 Lobby beendet: {e}', { e: e.message })); lobbyReset(); }
      else LOBBY.err = e.status === 429 ? '' : e.message;
    }
    LOBBY.busy = false;
    if (!$('lobby').hidden) renderLobby();
    updateLobbyPill();
  }
  function lobbyStart() {
    clearInterval(LOBBY.timer);
    LOBBY.code = save.lobby.code; LOBBY.seenFeed = 0; LOBBY.chatReady = false;
    LOBBY.timer = setInterval(lobbySync, LOBBY_EVERY);
    lobbySync();
  }
  function lobbyReset() {
    clearInterval(LOBBY.timer);
    if (boss.on && !boss.solo) bossEnd(tr('👥 Lobby verlassen – der Kampf ist für dich vorbei.'));
    boss.invite = null; $('btn-boss').hidden = true;
    delete save.lobby; persist();
    Object.assign(LOBBY, { code: null, me: null, players: [], feed: [], chat: [], outbox: [], seenChat: 0, chatReady: false, pending: [], seenFeed: 0 });
    $('chatlog').replaceChildren(); $('chatbar').hidden = true;
    updateLobbyPill();
    if (!$('lobby').hidden) renderLobby();
  }
  function lobbyCatch(f, size, val, shiny) {
    if (!save.lobby) return;
    save.lobby.sc += val; save.lobby.n++;
    LOBBY.pending.push({ f: f.name, cm: size, r: f.r, sh: !!shiny });
    if (LOBBY.pending.length > 5) LOBBY.pending.shift();
  }
  // ---- chat: messages ride along with the next sync; new ones show as bubbles over the angler,
  // in a fading log bottom left and in the lobby window
  const bubbles = new Map(); // player key -> { m, until }
  function receiveChat(list, me) {
    const fresh = list.filter(c => c.t > LOBBY.seenChat).reverse();
    const first = !LOBBY.chatReady; LOBBY.chatReady = true;
    if (list.length) LOBBY.seenChat = Math.max(LOBBY.seenChat, list[0].t);
    LOBBY.chat = list;
    if (first) return; // don't replay the backlog after joining or reloading
    for (const c of fresh) {
      bubbles.set(c.k, { m: c.m, until: performance.now() + 6000 });
      if (c.k === me) continue;
      const p = document.createElement('p');
      const b = document.createElement('b'); b.textContent = c.n + ': ';
      p.append(b, document.createTextNode(c.m));
      $('chatlog').append(p);
      while ($('chatlog').children.length > 5) $('chatlog').firstChild.remove();
      setTimeout(() => p.classList.add('old'), 9000); setTimeout(() => p.remove(), 9700);
      tone(880, .05, 'sine', .04);
    }
  }
  function sendChat(text) {
    text = text.replace(/\s+/g, ' ').trim().slice(0, 100);
    if (!text || !save.lobby) return;
    LOBBY.outbox.push(text);
    if (LOBBY.outbox.length > 3) LOBBY.outbox.shift();
    bubbles.set(LOBBY.me, { m: text, until: performance.now() + 6000 });
    setTimeout(lobbySync, 50);
  }
  function openChatbar() { $('chatbar').hidden = false; $('chatbar-msg').focus(); }
  $('chatbar').addEventListener('submit', e => { e.preventDefault(); sendChat($('chatbar-msg').value); $('chatbar-msg').value = ''; $('chatbar').hidden = true; $('chatbar-msg').blur(); });
  $('chatbar-msg').addEventListener('keydown', e => { if (e.key === 'Escape') { $('chatbar').hidden = true; e.target.blur(); } e.stopPropagation(); });
  $('chatbar-msg').addEventListener('blur', () => setTimeout(() => { if (!$('chatbar-msg').value) $('chatbar').hidden = true; }, 150));
  $('lobby-say').addEventListener('submit', e => { e.preventDefault(); sendChat($('lobby-msg').value); $('lobby-msg').value = ''; });
  $('btn-chat').addEventListener('click', openChatbar);
  function drawChatBubble(key, x) {
    const b = bubbles.get(key);
    if (!b) return;
    if (performance.now() > b.until) { bubbles.delete(key); return; }
    setFont('5px Poppins, sans-serif'); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const text = b.m.length > 34 ? b.m.slice(0, 33) + '…' : b.m;
    const w = Math.ceil(ctx.measureText(text).width) + 4, bx = snap(Math.max(1, Math.min(W - w - 1, x - w / 2))), by = DOCK_Y - 42;
    px(bx - .5, by - .5, w + 1, 8, '#0f172a'); px(bx, by, w, 7, '#fffbeb'); px(snap(x) - 1, by + 7, 2, 1.5, '#0f172a');
    ctx.fillStyle = '#0f172a'; ctx.fillText(text, bx + 2, by + .8);
  }
  function updateLobbyPill() {
    const n = LOBBY.players.length;
    $('lobby-pill').textContent = save.lobby ? `${save.lobby.code} · ${n || 1}` : tr('Lobby');
    $('btn-lobby').classList.toggle('on', !!save.lobby);
    $('btn-chat').hidden = !save.lobby;
  }
  function lobbyName() {
    const n = $('lobby-name').value.replace(/\s+/g, ' ').trim();
    if (!/^[\p{L}\p{N} ._\-!?]{1,16}$/u.test(n)) { $('lobby-err').textContent = tr('Name: 1–16 Zeichen (Buchstaben, Zahlen, Leerzeichen, . _ - ! ?).'); return null; }
    return n;
  }
  async function lobbyEnter(action, code) {
    const name = lobbyName(); if (!name) return;
    $('lobby-err').textContent = '';
    const id = hex(20);
    $('lobby-create').disabled = $('lobby-join').disabled = true;
    try {
      const j = await lobbyFetch({ action, code, id, name, me: lobbyMe() });
      save.lobby = { code: j.code || code, id, name, sc: 0, n: 0 }; save.lobbyName = name; persist();
      lobbyStart(); renderLobby();
    } catch (e) { $('lobby-err').textContent = e.message; }
    $('lobby-create').disabled = $('lobby-join').disabled = false;
  }
  function renderLobby() {
    const inside = !!save.lobby;
    $('lobby-out').hidden = inside; $('lobby-in').hidden = !inside;
    if (!inside) {
      if (!$('lobby-name').value) $('lobby-name').value = save.lobbyName || (save.lb && save.lb.name) || '';
      $('lobby-err').textContent = LOBBY.err;
      return;
    }
    $('lobby-code-show').textContent = save.lobby.code;
    const ps = LOBBY.players.length ? LOBBY.players.slice() : [{ k: LOBBY.me, name: save.lobby.name, sc: save.lobby.sc }];
    ps.sort((a, b) => b.sc - a.sc);
    $('lobby-players').replaceChildren(...ps.map((p, i) => {
      const li = document.createElement('li'); if (p.k === LOBBY.me) li.className = 'me';
      const pos = document.createElement('span'); pos.textContent = ['🥇', '🥈', '🥉'][i] || i + 1;
      const n = document.createElement('b'); n.textContent = (p.m === 'see' ? '⛵ ' : p.m === 'lava' ? '🌋 ' : '') + p.name;
      if (p.m === 'see') n.title = tr('Auf Hoher See');
      if (p.m === 'lava') n.title = tr('In der Glutgrotte');
      if (p.rk !== undefined) { const rk = document.createElement('small'); rk.className = 'rank'; rk.textContent = ' ' + presMark(p.pr | 0) + rankOf(p.rk).name; n.append(rk); }
      const sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = tr('{n} Taler', { n: (p.sc || 0).toLocaleString(I18N.locale) });
      li.append(pos, n, sc);
      if (p.big) { const b = document.createElement('span'); b.className = 'big'; b.textContent = tr('Größter: {f} ({cm} cm)', { f: p.big.f, cm: p.big.cm }); li.append(b); }
      return li;
    }));
    $('lobby-feed').replaceChildren(...(LOBBY.feed.length ? LOBBY.feed.map(e => {
      const li = document.createElement('li'); li.className = 'r-' + e.r;
      li.textContent = `${e.sh ? '💫 ' : ''}${e.n}: ${e.f} · ${e.cm} cm`;
      return li;
    }) : [Object.assign(document.createElement('li'), { textContent: tr('Noch nichts gefangen. Los geht’s!') })]));
    $('lobby-chat').replaceChildren(...(LOBBY.chat.length ? LOBBY.chat.slice().reverse().map(c => {
      const li = document.createElement('li'); if (c.k === LOBBY.me) li.className = 'me';
      const b = document.createElement('b'); b.textContent = c.n + ': ';
      li.append(b, document.createTextNode(c.m)); return li;
    }) : [Object.assign(document.createElement('li'), { textContent: tr('Noch keine Nachrichten. Sag hallo!') })]));
    const cl = $('lobby-chat'); cl.scrollTop = cl.scrollHeight;
    $('lobby-err').textContent = LOBBY.err;
  }
  $('lobby-create').addEventListener('click', () => lobbyEnter('create'));
  $('lobby-join').addEventListener('click', () => {
    const code = $('lobby-code').value.trim().toUpperCase();
    if (!/^[A-Z2-9]{4}$/.test(code)) { $('lobby-err').textContent = tr('Der Code hat 4 Zeichen.'); return; }
    lobbyEnter('join', code);
  });
  $('lobby-code').addEventListener('keydown', e => { if (e.key === 'Enter') $('lobby-join').click(); });
  $('lobby-leave').addEventListener('click', async () => {
    const l = save.lobby; lobbyReset();
    try { await lobbyFetch({ action: 'leave', code: l.code, id: l.id }); } catch { /* the server forgets us after 90 s anyway */ }
    toast(tr('👥 Lobby verlassen.'));
  });
  $('lobby-copy').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?lobby=${save.lobby.code}`;
    try { await navigator.clipboard.writeText(url); toast(tr('🔗 Link kopiert!')); } catch { prompt(tr('Link zum Beitreten:'), url); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && save.lobby) lobbySync(); });
  // back in the lobby after a reload; a ?lobby=CODE link pre-fills the code
  if (save.lobby) lobbyStart();
  try {
    const q = new URLSearchParams(location.search).get('lobby');
    if (q && /^[A-Za-z2-9]{4}$/.test(q) && !save.lobby) { $('lobby-code').value = q.toUpperCase(); LOBBY.invite = true; }
  } catch { /* old browser */ }
  updateLobbyPill();

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
    try {
      // claim: a gift from the admin (play time) comes back with the answer; not on pagehide, where nobody reads it
      const j = await cloudCall({ action: 'put', key: save.cloudKey, data, claim: !keepalive }, keepalive);
      save.cloudT = Date.now(); save.cloudSum = sum; cloudErr = '';
      const g = j.gift && Math.min(3600000, Math.max(0, j.gift.playTime | 0));
      if (g) {
        save.playTime = (save.playTime || 0) + g;
        toast(tr('🎁 Geschenk: +{n} Std Spielzeit!', { n: +(g / 3600).toFixed(1) }));
        updatePlayPill();
      }
      persist();
    }
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
      d.cloudKey = key; d.cloudT = j.t; d.cloudSum = ''; delete d.sig;
      d.sig = signSave(d);
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
    if ($('title').hidden) { save.playTime += dt; sessionTime += dt; updatePlayPill(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // tiny debug/test hook
  if (DEBUG) window.__fischen = { save, crit: () => startCrit(), get critState() { return { ...crit, c: crit.c && crit.c.id }; }, critChance: () => critChance(), gainXp, rebirth, prestige, dig: () => digDeeper(), buyGlutUp: id => buyGlutUp(id), claimGlimm: i => claimGlimm(i), caveMult: () => caveMult(), glimm: () => talkGlimm(), MUTATIONS, forceMut: null, forceShiny: false, get state() { return state; }, talk: () => talkBealin(), openBox: id => openBox(BOXES.find(b => b.id === id)), line: () => bealinLine, setTime: v => { timeShift = 0; timeShift = v - worldTime(); time = worldTime(); },
    land: id => { const f = FISH.find(x => x.id === id); hooked = { f, size: f.max, str: STRENGTH[f.r] }; bob.x = 260; land_catch(); },
    rhythm: id => { const f = FISH.find(x => x.id === id); hooked = { f, size: f.max, str: STRENGTH[f.r] }; bob.x = 260; reel.maxT = 0; startRhythm(); },
    get notes() { return rhythm.notes; },
    // tests: weather, maps, size classes, boss fight
    setWeather: id => { weatherForce = id || null; wx = currentWeather(); updateWeatherPill(); },
    weatherAt, travel, boss, rollSize, SIZE_CLASSES,
    landCls: (id, cls) => { const f = FISH.find(x => x.id === id); hooked = { f, ...sizeIn(f, cls), str: STRENGTH[f.r] }; bob.x = 260; land_catch(); },
    bossSolo: () => { save.lobby ? summonBoss() : enterBoss({ id: 'solo-test', max: BOSS_HP, hp: BOSS_HP, ends: Date.now() + BOSS_TIME, n: 1 }, true); },
    bossHit, pick: () => pickFish(), get wx() { return wx.id; } };
})();
