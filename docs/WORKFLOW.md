# Kaip veikia vertimas ir kaip jį atkurti

Šis dokumentas paaiškina visą darbo eigą: nuo žaidimo failo iki įdiegto vertimo.
Parašytas taip, kad kitas žmogus (ar kitas AI agentas) galėtų viską pakartoti nuo
nulio.

---

## 1. Kur žaidimas laiko tekstą

```
CUSA06534/
└── samplegame/data/kettle/loc/
    ├── eng_us.db          ← anglų tekstai (mūsų bazė)
    ├── eng_us-meta.xml    ← tos bazės schema
    ├── pol_pl.db          ← lenkų lizdas, čia dedame vertimą
    ├── pol_pl-meta.xml
    └── rus_ru.db, ger_de.db, … (kitos kalbos)
```

`*.db` yra **t3db** formato duomenų bazė. Mus domina viena lentelė:

| laukas | reikšmė |
|---|---|
| `hashid` | int32 raktas, pagal jį vyksta `updateRow` |
| `stringid` | tekstinis identifikatorius, pvz. `TXT_RED_CORNER` |
| `sourcetext` | pats tekstas |

Eilučių skaičius: **17 539**.

Kalba pasirenkama `%LOCALAPPDATA%\UFC3Native\sacredfire.ini` eilute `language=`
(`1` = anglų, `16` = lenkų lizdas, kuriame gyvena mūsų vertimas).

> **Kodėl ne naujas kalbos lizdas?** Žaidimas turi fiksuotą kalbų sąrašą ir savo
> šriftus kiekvienai. Lenkų šriftas turi visus lietuviškus diakritikus, todėl
> paprasčiausia (ir vienintelė veikianti be žaidimo kodo keitimo) išeitis —
> įrašyti vertimą kaip `pol_pl.db`.

---

## 2. Keturi žingsniai

Visa darbo eiga telpa į keturias komandas. Kiekviena daro vieną dalyką.

### 2.1. `extract` — ištraukti žodyną

```bash
node tools/extract.mjs --db "<žaidimas>/CUSA06534/samplegame/data/kettle/loc/eng_us.db" --out translations/en.json
```

Suskaito `LanguageStrings` lentelę ir įrašo `{ "TXT_ID": "English text" }`.
Reikia dviejų dalykų: pamatyti, kokie `stringid` apskritai yra, ir turėti sąrašą,
pagal kurį verčiama. Šiame projekte žodynas buvo naudojamas kaip atskaitos taškas
visą laiką.

### 2.2. Vertimas — `translations/lt.json`

Vienintelis failas, kurį redaguoja vertėjas:

```json
{
  "TXT_RED_CORNER": "Raudonasis kampas",
  "TXT_KNOCKDOWN_OPPONENT_OBJ_DETAIL": "Nokdaunuok savo treniruočių partnerį\nPatarimas: …"
}
```

Taisyklė paprasta: **raktas = `stringid`, reikšmė = lietuviškas tekstas**.
Ko nėra faile, tas lieka angliška. Todėl vertimą galima daryti dalimis — po 100,
500 ar 5 000 eilučių, visada veikiančios būsenos.

### 2.3. `validate` — patikrinti

```bash
node tools/validate.mjs --game "<žaidimas>/CUSA06534"
```

Tikrina kiekvieną eilutę atskirai:

| ką tikrina | kodėl |
|---|---|
| ar `stringid` egzistuoja | rašybos klaida kelyje nieko nesugadins, bet eilutė liks neversta |
| **žymų tvarka** — `^LT^`, `%1s`, `%2d`, `<font …>`, `\|` | žaidimas keičia `%1s` savo reikšme; jei jų trūksta ar sukeista — lūžta tekstas arba žaidimas |
| naujų eilučių kiekis | trūkstama `\n` sujungia dvi eilutes į vieną ir tekstas nebetelpa |
| ar tekstas netuščias | tuščia eilutė palieka tuščią vietą sąsajoje |

Išeities kodas `0` = švaru, `1` = rasta problemų (spausdina kiekvieną).

### 2.4. `build` — sudėti ir įdiegti

```bash
node tools/build.mjs --game "<žaidimas>/CUSA06534" --install
```

1. atidaro `eng_us.db` kaip redaguojamą bazę,
2. kiekvienam `lt.json` raktui suranda eilutę pagal `stringid` ir pakeičia `sourcetext`,
3. serializuoja į `dist/CUSA06534/…/pol_pl.db`,
4. su `--install` nukopijuoja į žaidimą (originalą pirmą kartą išsaugo kaip `pol_pl.db.bak`).

### 2.5. `status` — kiek liko

```bash
node tools/status.mjs --game "<žaidimas>/CUSA06534" --list 50
```

Skaito **įdiegtą** `pol_pl.db` ir lygina su `eng_us.db`. Tai vienintelis patikimas
progreso matas, nes skaičiuoja, kiek eilučių realiai skiriasi nuo anglų kalbos.
`--list N` papildomai išspausdina N dar angliškų eilučių — patogu ieškant, ką
versti toliau.

---

## 3. Vertimo taisyklės

Šios taisyklės išvestos dirbant su šiuo žaidimu; jų laikantis vertimas neprilaužo
sąsajos.

### Saugomos žymos

| žyma | reikšmė | pavyzdys |
|---|---|---|
| `^LT^` `^RT^` `^A^` `^X^` `^RS^` `^LB^` | valdiklio mygtukai | `^LT^+^A^` |
| `%1s` `%2d` `%4s` | žaidimo įterpiamos reikšmės (vardas, skaičius) | `Pataikyk %1s smūgių` |
| `<font color='#eac808'>` `</font>` | spalva, šriftas | HTML tipo žymos |
| `\|` | skirtukas tarp kortelės pusių | `tekstas\|3 / 6` |
| `\n` | nauja eilutė | jų skaičius **privalo** sutapti |

**Tvarka svarbi.** Jei originale `%2s` eina prieš `%1s`, vertime turi būti taip pat.

### Kalba ir stilius

- **Terminija** — žr. žodyną žemiau. Ji buvo nustatyta su užsakovu ir laikoma
  visame projekte; nenuoseklumas matosi iš karto.
- **Lytis** — neutrali forma, kur originalas neutralus. Moteriška tik ten, kur
  originalas sako `she`/`her` arba `stringid` turi `_FEMALE_`.
- **Subtitrų fragmentai** — verčiami kaip fragmentai: mažoji raidė pradžioje,
  tarpas gale, kad susijungtų su aplinkiniu sakiniu.
- **Didžiosios raidės** — kai originalas `CAPS`, vertimas taip pat `CAPS`.
- **Neverčiama** — kovotojų vardai, ėjimų pavadinimai (Kimura, Americana, Gogoplata),
  arenų ir rėmėjų vardai, `UFC`, `EA SPORTS`, `Ultimate Team`, programinės įrangos
  licencijos, kūrėjų testiniai tekstai (`TEST PACK`, `Placeholder`, `Debug`).

### Terminų žodynas

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
| break (clinche) | skirtis |
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

---

## 4. Atkūrimas nuo nulio

Jei nori pradėti naują vertimą (kitai kalbai ar iš naujo):

```bash
# 0. pasiruošimas
git clone <repo> && cd ufc3-lt
npm install

# 1. žodynas
node tools/extract.mjs \
  --db "<žaidimas>/CUSA06534/samplegame/data/kettle/loc/eng_us.db" \
  --out translations/en.json

# 2. versti — pildyti translations/lt.json
#    (patogu: imti po 100–150 eilučių, kiekvieną paketą iškart tikrinti)

# 3. tikrinti
node tools/validate.mjs --game "<žaidimas>/CUSA06534"

# 4. statyti ir įdiegti
node tools/build.mjs --game "<žaidimas>/CUSA06534" --install

# 5. matuoti
node tools/status.mjs --game "<žaidimas>/CUSA06534" --list 100

# 6. žaidime: language=16 faile %LOCALAPPDATA%\UFC3Native\sacredfire.ini
```

Norint pakeisti tik vieną eilutę, nereikia nieko iš naujo — pakanka 2 → 3 → 4.

---

## 5. Kaip šis vertimas buvo daromas (ir ko išmokome)

Vertimas darytas paketais po ~140 eilučių: imamas neišverstų eilučių sąrašas,
verčiama, tikrinama, statoma, matuojama. Paketas, kuriame yra klaida, niekada
nepatenka į žaidimą — `validate` jį sustabdo.

Dalykai, kurie kainavo laiko ir kurių verta išvengti:

- **Progreso skaičius gali meluoti.** Anksčiau eilutės, kurių „vertimas“ buvo
  identiškas angliškam tekstui (`Kimura`, `^RSGUL^`), buvo skaičiuojamos kaip
  išverstos — rezultatas atrodė 98,5 %, o realiai buvo ~90 %. Todėl dabar
  `status.mjs` lygina su žaidimo baze ir skaičiuoja tik realiai pasikeitusias
  eilutes, o `lt.json` laiko tik tuos įrašus, kurie skiriasi nuo originalo.
- **Pasenęs sujungtas failas.** Jei „kas liko“ skaičiuojama iš iš anksto
  sujungto failo, o vertimai jau pasikeitę — gaunami klaidingi kandidatai ir
  verčiama tai, kas jau išversta. `status.mjs` visada skaito įdiegtą `.db`.
- **Validatorius gaudo tikras klaidas.** Per darbą jis pagavo: trūkstamą `\n`
  UFC taškų apraše, sukeistą `%1s`/`%2s` tvarką, išgalvotą `_DUP` raktą ir
  papildomą naują eilutę subtitre. Visos šios klaidos žaidime būtų mačiusios
  kaip sulūžęs tekstas.
- **PowerShell ir lietuviškos kabutės.** `„…“` PowerShell interpretuoja kaip
  eilutės skirtuką, todėl generatoriai rašomi į `.ps1` failą, o ne į komandinę
  eilutę — arba tiesiog naudojamas Node.
- **`Map` ir `Object.keys`.** `Object.keys(map)` grąžina `[]`. Skaičiuojant
  šeimomis (pvz. 22 „Greatest of All Time“ variantai), reikia `map.keys()` arba
  iteruoti šaltinio masyvą.

---

## 6. Dažnos problemos

| požymis | priežastis | sprendimas |
|---|---|---|
| žaidime vis dar angliškai | `language` ne 16 | `sacredfire.ini` → `language=16` |
| tekstas be diakritikų | vertimas įrašytas į kitą lizdą | statyti su `--install`, failas turi būti `pol_pl.db` |
| sulūžęs vienas tekstas | pamestos žymos | `validate.mjs` parodys `TOKENS` arba `LINEBREAKS` |
| vertimas nesikeičia | statyta be `--install` | `build.mjs --install` |
| `unknown ids` statant | `stringid` rašybos klaida | `validate.mjs` parodys `NO SUCH ID` |

---

## 7. Kita kalba

Visa eiga ta pati — pakeisk tik išvesties failo vardą (`build.mjs --out`) ir
`language=` reikšmę. Kalbos lizdą rinkis pagal šriftą: reikia tokio, kuriame yra
visi tavo kalbos diakritikai. Lietuvių kalbai tinka lenkų (`16`), portugalų (`17`)
ir kiti lotyniški lizdai.
