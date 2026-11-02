# Fisch!

Static site, no build step. Deploy on Vercel: import this repo, Framework Preset "Other", leave build/output settings empty. `index.html` is served at `/`.

## Fischen!

`fischen.html` is a small browser fishing game (canvas + `fischen.js`/`fischen.css`). Every catch is one of the site's GIFs/PNGs (incl. cut-outs from the Spezifischfischer page, whose catches speak their line from `spezifischfischer.mp3`). Catches give XP toward angler levels, which unlock gear; three rotating quests pay out Taler and XP; from level 12 you can rebirth for Schuppen (permanent talents) and a lasting +20 % Taler bonus, with new rods, bait and hat colours per rebirth. Catches can come out mutated (giant, tiny, albino, glowing, shadowy, golden, rainbow) for more Taler, and Fischdex milestones pay out Taler, Schuppen and permanent bonuses. Progress is saved only in the browser's `localStorage` (key `fischen-save-v1`), see `datenschutz.html` section 5.
