# How the translation works, and how to recreate it

This document explains the whole workflow: from a game file to an installed
translation. It is written so that another person — or another AI agent — can
repeat everything from scratch, including for a **different language**.

---

## 1. Where the game keeps its text

```
CUSA06534/
└── samplegame/data/kettle/loc/
    ├── eng_us.db          ← English text (our base)
    ├── eng_us-meta.xml    ← schema for that database
    ├── pol_pl.db          ← Polish slot; this is where the translation goes
    ├── pol_pl-meta.xml
    └── rus_ru.db, ger_de.db, … (other languages)
```

`*.db` is a **t3db** database. One table matters to us:

| field | meaning |
|---|---|
| `hashid` | int32 key, used by `updateRow` |
| `stringid` | textual id, e.g. `TXT_RED_CORNER` |
| `sourcetext` | the text itself |

Total: **17 539** strings.

The language is chosen by the `language=` line in
`%LOCALAPPDATA%\UFC3Native\sacredfire.ini` (`1` = English, `16` = the Polish
slot, where our translation lives).

> **Why not a new language slot?** The game has a fixed language list and a font
> per language. The Polish font carries every Lithuanian diacritic, so writing
> the translation as `pol_pl.db` is the simplest route that needs no game-code
> changes. For Lithuanian, slots `16` and `17` both work.

---

## 2. The four steps

The whole pipeline is four commands. Each does one thing.

### 2.1. `extract` — dump a dictionary

```bash
node tools/extract.mjs --db "<game>/CUSA06534/samplegame/data/kettle/loc/eng_us.db" --out translations/en.json
```

Reads the `LanguageStrings` table and writes `{ "TXT_ID": "English text" }`.
Two uses: seeing which `stringid`s exist at all, and having a reference list to
translate against. It is also how you find a string id when you only know what
the screen shows.

### 2.2. Translate — `translations/lt.json`

The only file a translator edits:

```json
{
  "TXT_RED_CORNER": "Raudonasis kampas",
  "TXT_KNOCKDOWN_OPPONENT_OBJ_DETAIL": "Nokdaunuok savo treniruočių partnerį\nPatarimas: …"
}
```

One rule: **key = `stringid`, value = translated text.** Anything not in the file
stays English, so the translation can be done in slices — 100, 500 or 5 000
strings at a time, always in a working state.

### 2.3. `validate` — check

```bash
node tools/validate.mjs --game "<game>/CUSA06534"
```

Checks every entry:

| what | why |
|---|---|
| the `stringid` exists | a typo would silently leave the line untranslated |
| **token order** — `^LT^`, `%1s`, `%2d`, `<font …>`, `\|` | the game substitutes `%1s` with its own value; a missing or reordered token breaks the text or the game |
| number of line breaks | a missing `\n` merges two lines and the text no longer fits |
| the text is not empty | an empty string leaves a blank space in the UI |

Exit code `0` = clean, `1` = problems found (one line each).

### 2.4. `build` — assemble and install

```bash
node tools/build.mjs --game "<game>/CUSA06534" --install
```

1. opens `eng_us.db` as an editable database,
2. for every `lt.json` key finds the row by `stringid` and replaces `sourcetext`,
3. serialises to `dist/CUSA06534/…/pol_pl.db` (plus its `-meta.xml`),
4. with `--install` copies it into the game (the original is kept once as `pol_pl.db.bak`).

Nothing in the game folder is edited in place, and nothing is edited without a
backup of the original.

### 2.5. `status` — how much is left

```bash
node tools/status.mjs --game "<game>/CUSA06534" --list 50
```

Reads the **installed** `pol_pl.db` and compares it with `eng_us.db`. This is the
only trustworthy progress figure, because it counts rows that really differ from
English. `--list N` additionally prints N strings that are still English — handy
when picking the next batch.

---

## 3. Translation rules

These rules come from working with this particular game; following them keeps
the UI intact.

### Keep the markup

| marker | meaning | example |
|---|---|---|
| `^LT^` `^RT^` `^A^` `^X^` `^RS^` `^LB^` | controller buttons | `^LT^+^A^` |
| `%1s` `%2d` `%4s` | values the game inserts (name, number) | `Land %1s punches` |
| `<font color='#eac808'>` `</font>` | colour, font | HTML-like tags |
| `\|` | separator between card halves | `text\|3 / 6` |
| `\n` | line break | the count **must** match |

**Order matters.** If the original has `%2s` before `%1s`, the translation must
do the same.

### Language and style

- **Terminology** — see the glossary below. It was fixed with the requester and is
  kept across the whole project; inconsistency shows immediately.
- **Gender** — neutral wording where the original is neutral. Feminine only where
  the original says `she`/`her` or the `stringid` contains `_FEMALE_`.
- **Subtitle fragments** — translated as fragments: lowercase at the start, a
  trailing space, so they join the surrounding sentence.
- **Capitals** — where the original is `CAPS`, so is the translation.
- **Never translated** — fighter names, move names (Kimura, Americana, Gogoplata),
  venue and sponsor names, `UFC`, `EA SPORTS`, `Ultimate Team`, open-source licence
  texts, developer test strings (`TEST PACK`, `Placeholder`, `Debug`).

### Glossary

| EN | LT |
|---|---|
| submission | skausmingas veiksmas |
| takedown | pargriovimas |
| knockdown | nokdaunas |
| knockout | nokautas |
| clinch | klinčas |
| Thai clinch | Muaj Tai klinčas |
| over-under clinch | kryžminis klinčas |
| single collar | viena apykaklė |
| double under | dvigubas apatinis |
| bodylock | kūno užrakas |
| guard / half guard | sarga / pusė sargos |
| rubber guard | guminė sarga |
| stacked guard | sukrauta sarga |
| mount / back mount | viršutinė pozicija / galinė viršutinė pozicija |
| side control | šoninė kontrolė |
| side saddle | šoninė žirklė |
| north south | šiaurės–pietų |
| crucifix | kryžius |
| sprawl | išsiskėtimas |
| break (in the clinch) | skirtis |
| ground and pound | smūgiavimas parteryje |
| stopping power | stabdymo galia |
| teep | stumiamasis spyris |
| round | raundas |
| decision | teisėjų sprendimas |
| Dominant / Submissive | dominuojantis / pakerėtas |
| bantamweight | puslengvis |
| featherweight | plunksnosvoris |
| flyweight | musios svoris |
| welterweight | pusvidutinio svorio |
| heavyweight | sunkiausias svoris |

When translating into another language, replace this table with your own —
**decide the glossary before translating more than a few hundred strings.**

---

## 4. Recreating from zero

To start a new translation (another language, or from scratch):

```bash
# 0. setup
git clone <repo> && cd ufc3-lt
npm install

# 1. dictionary
node tools/extract.mjs \
  --db "<game>/CUSA06534/samplegame/data/kettle/loc/eng_us.db" \
  --out translations/en.json

# 2. translate — fill translations/<lang>.json
#    (practical: 100–150 strings per batch, validate after each batch)

# 3. check
node tools/validate.mjs --game "<game>/CUSA06534" --translations translations/<lang>.json

# 4. build and install
node tools/build.mjs --game "<game>/CUSA06534" \
  --translations translations/<lang>.json --install

# 5. measure
node tools/status.mjs --game "<game>/CUSA06534" --list 100

# 6. in game: language=16 in %LOCALAPPDATA%\UFC3Native\sacredfire.ini
```

Every tool takes `--translations` (input) and `--out` (output), so a second
language can live beside the first without touching it. To fix a single line,
only steps 2 → 3 → 4 are needed.

---

## 5. How this translation was made (and what it taught us)

The work was done in batches of roughly 140 strings: take a list of untranslated
strings, translate, validate, build, measure. A batch containing an error never
reaches the game — `validate` stops it.

Things that cost time and are worth avoiding:

- **Progress figures can lie.** Earlier, strings whose "translation" was identical
  to the English text (`Kimura`, `^RSGUL^`) were counted as translated — the
  project looked 98.5 % done while it was really ~90 %. That is why `status.mjs`
  now compares against the game's base database and counts only rows that really
  differ, and why `lt.json` holds only entries that differ from the original.
- **A stale merged file.** If "what is left" is computed from a pre-merged file
  while translations have already changed, you get false candidates and translate
  what is already done. `status.mjs` always reads the installed `.db`.
- **The validator catches real bugs.** During the work it found: a missing `\n`
  in the UFC Points description, a swapped `%1s`/`%2s` order, an invented `_DUP`
  key, and an extra line break in a subtitle. In game these would have shown as
  broken text.
- **PowerShell and typographic quotes.** `„…“` is treated as a string delimiter by
  PowerShell, so generators are written to a `.ps1` file rather than passed on the
  command line — or simply use Node.
- **`Map` and `Object.keys`.** `Object.keys(map)` returns `[]`. When generating
  families (e.g. the 22 "Greatest of All Time" variants), use `map.keys()` or
  iterate the source array.

---

## 6. Common problems

| symptom | cause | fix |
|---|---|---|
| game still shows English | `language` is not 16 | `sacredfire.ini` → `language=16` |
| text without diacritics | translation written into another slot | build with `--install`; the file must be `pol_pl.db` |
| one text looks broken | lost markup | `validate.mjs` reports `TOKENS` or `LINEBREAKS` |
| changes do not appear | built without `--install` | `build.mjs --install` |
| `unknown ids` while building | typo in a `stringid` | `validate.mjs` reports `NO SUCH ID` |

---

## 7. Another language

The pipeline is identical — change only the output file name (`--out`) and the
`language=` value. Choose the language slot by its **font**: you need one that
contains every diacritic of your language. For Lithuanian the Polish (`16`) and
Portuguese (`17`) slots both work; Czech, Turkish or Vietnamese need a slot whose
font covers their characters, so check the rendered result on screen first.

Practical order for a new language:

1. `extract` the English dictionary.
2. Write the **glossary** first — 30–50 core terms.
3. Translate in batches, `validate` after each one.
4. Build early (after the first 100 strings) and look at the game: font coverage
   and text length problems are far cheaper to fix at that point.
5. Keep `status.mjs` as the source of truth, never a hand-kept counter.
