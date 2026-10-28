# UFC 3 — Lithuanian translation

Unofficial **EA SPORTS UFC 3** (PS4) text translation into Lithuanian, for the game
running under the **UFC3Native / SacredFire** emulator.

- **17 539** strings in the game, **15 836** translated.
- Every player-facing string is Lithuanian: menus, career mode, training, move
  descriptions, objectives, subtitles, Ultimate Team, credit job titles.
- Deliberately left in English: fighter names, move names (Kimura, Americana),
  venue and sponsor names, controller tokens, open-source licences.

## Install (2 steps)

**1. Copy the files.** Copy the contents of `dist/` over your game folder so that
`pol_pl.db` lands here:

```
dist/CUSA06534/samplegame/data/kettle/loc/pol_pl.db
        ↓  copy over
<game>/CUSA06534/samplegame/data/kettle/loc/pol_pl.db
```

Simplest: copy the `dist/CUSA06534` folder over the `CUSA06534` folder of your
game and confirm the overwrite. Keep a backup of the original `pol_pl.db`.

**2. Enable the language.** In

```
%LOCALAPPDATA%\UFC3Native\sacredfire.ini
```

set the line `language=16` (the Polish slot — its font carries Lithuanian
diacritics).

That's it. Launch the game.

> **Why the Polish slot?** The game has no Lithuanian language. The Polish font
> contains all of `ĄČĘĖĮŠŲŪŽ`, so the translation is written as `pol_pl.db`,
> which is language id 16. Pick English in the game and you get the original.

## Fixing a wrong line

1. Find the string by the English text you see:
   ```
   node tools/extract.mjs --db "<game>/CUSA06534/samplegame/data/kettle/loc/eng_us.db" --out translations/en.json
   ```
   then search `translations/en.json`.
2. Edit `translations/lt.json` — key is the `stringid`, value is the Lithuanian text.
3. Validate and rebuild:
   ```
   npm run validate -- --game "<game>/CUSA06534"
   npm run build    -- --game "<game>/CUSA06534" --install
   ```

## Repository layout

```
tools/extract.mjs    game text  -> JSON (a dictionary for the translator)
tools/validate.mjs   checks tokens, line breaks and unknown ids
tools/build.mjs      lt.json + eng_us.db -> pol_pl.db (optionally installs)
tools/status.mjs     how much is still English (compares against the game base)

translations/lt.json the single translation file (15 836 entries)

dist/CUSA06534/…     ready-made pol_pl.db — copy only
docs/WORKFLOW.md     how it works and how to rebuild from scratch
```

## Requirements

- **Node.js 18+**
- A legitimate copy of the game (the build uses its `eng_us.db` as the base)
- `npm install` — single dependency `fifa-t3db` (reads the t3db format)

## How it works

Strings live in `samplegame/data/kettle/loc/*.db`, `t3db` databases with a
`LanguageStrings` table (`hashid`, `stringid`, `sourcetext`). The build takes the
**English** database, replaces `sourcetext` for every `stringid` present in
`lt.json`, and writes the result as `pol_pl.db`. Strings missing from `lt.json`
stay English. Nothing in the game folder is edited in place.

Full write-up, glossary and step-by-step recreation: [docs/WORKFLOW.en.md](docs/WORKFLOW.en.md).
Lithuanian version — [docs/WORKFLOW.md](docs/WORKFLOW.md).

### Translating into your own language

Nothing is Lithuanian-specific in the code. Point the tools at your own file:

```bash
node tools/validate.mjs --game "<game>/CUSA06534" --translations translations/de.json
node tools/build.mjs    --game "<game>/CUSA06534" --translations translations/de.json --out dist/…/ger_de.db
```

Pick a language slot whose **font** covers your diacritics, then read
[section 7 of the workflow](docs/WORKFLOW.en.md#7-another-language).

## Support

The translation is free and will stay free. If it was useful to you and you feel
like supporting further work — thank you!

**☕ [ko-fi.com/rokinas14](https://ko-fi.com/rokinas14)**

## Credits and rights

Fan translation. Game text, trademarks and artwork belong to **Electronic Arts
Inc.** and **Zuffa, LLC**. This repository distributes only translation strings
and tooling, never game assets. Use it with your own legitimate copy.

Tooling is MIT licensed — see [LICENSE](LICENSE).
