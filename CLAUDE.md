# fisch.ing – Regeln

- **Jeder neue Fisch im Spiel „Fischen!“ braucht eine eigene Seite.** Lege dafür eine `<name>.html` im Stil der übrigen Fischseiten an (`style.css`, `.card`, Bild, kurzer Text, `.links`-Navigation zu `index.html` und `fischen.html`, `/fish.js`, Datenschutz-Footer) und trage sie im `FISH`-Eintrag in `fischen.js` als `page: '<name>.html'` ein. Der Fischdex verlinkt die Seite dann automatisch. Das gilt nur für neue Fische; bestehende Fische ohne eigene Seite bleiben so.
- Spielstand-Felder, die neu im `localStorage` oder auf dem Server landen, müssen in `datenschutz.html` (Abschnitte 5–7) erwähnt werden.
