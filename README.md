# UFC 3 — lietuviškas vertimas

Neoficialus **EA SPORTS UFC 3** (PS4) teksto vertimas į lietuvių kalbą.
Skirtas žaidimui, paleidžiamam per **UFC3Native / SacredFire** emuliatorių.

- **17 539** eilutės žaidimo teksto, **15 836** išverstos.
- Visas žaidėjui matomas tekstas lietuviškas: meniu, karjera, treniruotės, ėjimų
  aprašai, užduotys, subtitrai, „Ultimate Team“, kreditų pareigybės.
- Neversta sąmoningai: kovotojų vardai, ėjimų pavadinimai (Kimura, Americana),
  arenų ir rėmėjų vardai, mygtukų kodai, programinės įrangos licencijos.

## Įdiegimas (2 žingsniai)

**1. Nukopijuok failus.** Turinį iš `dist/` perkelk ant savo žaidimo aplanko taip,
kad `pol_pl.db` patektų į vietą:

```
dist/CUSA06534/samplegame/data/kettle/loc/pol_pl.db
        ↓  kopijuoti ant
<žaidimas>/CUSA06534/samplegame/data/kettle/loc/pol_pl.db
```

Paprasčiausia: nusikopijuok `dist/CUSA06534` aplanką ant `CUSA06534` aplanko
savo žaidimo kataloge ir patvirtink perrašymą. Originalus failas lieka kaip
`pol_pl.db.bak`, jei jį pasidarysi pats.

**2. Įjunk kalbą.** Faile

```
%LOCALAPPDATA%\UFC3Native\sacredfire.ini
```

nustatyk eilutę `language=16` (lenkų lizdas — jame telpa lietuviški diakritikai).

Viskas. Paleisk žaidimą — tekstas bus lietuviškas.

> **Kodėl lenkų lizdas?** Žaidime nėra lietuvių kalbos. Lenkų šriftas turi visus
> `ĄČĘĖĮŠŲŪŽ`, o vertimą įrašome kaip `pol_pl.db`, tai yra į 16-os kalbos vietą.
> Pasirinkęs žaidime anglų kalbą matysi originalą.

## Ką daryti, jei radai netikslumą

1. Surask eilutę pagal matomą tekstą:
   ```
   node tools/status.mjs --game "<žaidimas>/CUSA06534" --list 2000
   ```
   `status.mjs` rodo tik neišverstas eilutes. Jei nori ieškoti pagal anglišką
   tekstą, išsitrauk visą žodyną:
   ```
   node tools/extract.mjs --db "<žaidimas>/CUSA06534/samplegame/data/kettle/loc/eng_us.db" --out translations/en.json
   ```
   ir ieškok `translations/en.json` faile.
2. Pataisyk `translations/lt.json` — raktas yra `stringid`, reikšmė — lietuviškas
   tekstas.
3. Patikrink ir persistatyk:
   ```
   npm run validate -- --game "<žaidimas>/CUSA06534"
   npm run build    -- --game "<žaidimas>/CUSA06534" --install
   ```

## Repo struktūra

```
tools/extract.mjs    žaidimo tekstai  -> JSON (žodynas vertėjui)
tools/validate.mjs   patikrina žymas, naujas eilutes, nežinomus id
tools/build.mjs      lt.json + eng_us.db -> pol_pl.db (ir įdiegia)
tools/status.mjs     kiek liko angliškai (lygina su žaidimo baze)

translations/lt.json vienintelis vertimų failas (15 836 įrašai)

dist/CUSA06534/…     paruoštas pol_pl.db — tik kopijuoti
docs/WORKFLOW.md     kaip viskas veikia ir kaip atkurti nuo nulio
```

## Reikalavimai

- **Node.js 18+** (`node --version`)
- Turima legali žaidimo kopija (vertimas naudoja žaidimo `eng_us.db` kaip bazę)
- `npm install` — vienintelė priklausomybė `fifa-t3db` (t3db formato skaitymas)

## Kaip tai veikia

Žaidimo tekstai saugomi `samplegame/data/kettle/loc/*.db` — tai `t3db` formato
duomenų bazės, lentelė `LanguageStrings` su laukais `hashid`, `stringid`,
`sourcetext`. Vertimas nieko neperrašo žaidimo failuose: imama **angliška** bazė,
kiekvienam rastam `stringid` pakeičiamas `sourcetext`, ir rezultatas įrašomas kaip
`pol_pl.db`. Eilutės, kurių nėra `lt.json`, lieka angliškos.

Išsamus aprašymas, terminų žodynas ir atkūrimo žingsniai — [docs/WORKFLOW.md](docs/WORKFLOW.md).
English version — [docs/WORKFLOW.en.md](docs/WORKFLOW.en.md).

## Parama

Vertimas nemokamas ir toks liks. Jei jis pasirodė naudingas ir nori paremti
tolesnį darbą — ačiū!

**☕ [ko-fi.com/rokinas14](https://ko-fi.com/rokinas14)**

## Padėka ir teisės

Vertimas yra mėgėjiškas (fan translation). Žaidimo tekstai, prekių ženklai ir
vaizdai priklauso **Electronic Arts Inc.** ir **Zuffa, LLC**. Šis repo platina
tik vertimo eilutes ir įrankius; žaidimo failų neplatina. Naudok tik su savo
legaliu žaidimo egzemplioriumi.

Įrankiai platinami pagal MIT licenciją — žr. [LICENSE](LICENSE).
