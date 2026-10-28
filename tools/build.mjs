#!/usr/bin/env node
// Step 4 of 4 — BUILD (and optionally install).
// Takes the game's English database, overwrites every string found in
// translations/lt.json and writes a Polish-slot database (id 16 = pol_pl),
// because the Polish font is the one that carries Lithuanian diacritics.
//
// usage:
//   node tools/build.mjs --game "E:\...\CUSA06534"
//   node tools/build.mjs --game "E:\...\CUSA06534" --install
//   node tools/build.mjs --db "<...>/eng_us.db" --out my.db        (no game folder needed)
//
// --game    path to the CUSA06534 folder of the game
// --install also copy the result into <game>/samplegame/data/kettle/loc/pol_pl.db
//           (the original pol_pl.db is backed up once as pol_pl.db.bak)

import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { openEditableFifaDatabase } from "fifa-t3db";

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(name);

const game = opt("--game");
const locDir = game ? join(game, "samplegame", "data", "kettle", "loc") : null;
const dbPath = opt("--db", locDir ? join(locDir, "eng_us.db") : null);
const outPath = opt("--out", "dist/CUSA06534/samplegame/data/kettle/loc/pol_pl.db");
const trPath = opt("--translations", "translations/lt.json");

if (!dbPath) {
  console.error("usage: node tools/build.mjs --game <CUSA06534 folder> [--install]");
  console.error("       node tools/build.mjs --db <eng_us.db> [--out pol_pl.db]");
  process.exit(2);
}

const metaPath = dbPath.replace(/\.db$/i, "-meta.xml");
const [bytes, meta, trRaw] = await Promise.all([
  readFile(dbPath),
  readFile(metaPath, "utf8"),
  readFile(trPath, "utf8"),
]);

const translations = JSON.parse(trRaw);
const editor = openEditableFifaDatabase({ database: new Uint8Array(bytes), metadataXml: meta });

const rows = editor.readTable("LanguageStrings").rows;
const byId = new Map(rows.map((r) => [r.stringid, r]));

let updated = 0;
const unknown = [];
for (const [id, text] of Object.entries(translations)) {
  const row = byId.get(id);
  if (!row) { unknown.push(id); continue; }
  if (row.sourcetext === text) continue;
  editor.updateRow("LanguageStrings", { hashid: row.hashid }, { sourcetext: text });
  updated++;
}

const out = editor.serialize();
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, out);

// ship the schema next to the database so the folder is self-contained
// (the game itself ships pol_pl-meta.xml; tools need it to reopen the file)
const polMeta = locDir ? join(locDir, "pol_pl-meta.xml") : null;
const outMeta = outPath.replace(/\.db$/i, "-meta.xml");
await writeFile(outMeta, polMeta && existsSync(polMeta) ? await readFile(polMeta) : meta);

console.log(`strings in base : ${rows.length}`);
console.log(`translations    : ${Object.keys(translations).length} (applied ${updated})`);
if (unknown.length) console.log(`unknown ids     : ${unknown.length} (ignored: ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? "..." : ""})`);
console.log(`written         : ${outPath} (${out.length} bytes)`);

if (flag("--install")) {
  if (!locDir) { console.error("--install needs --game"); process.exit(2); }
  const target = join(locDir, "pol_pl.db");
  if (existsSync(target) && !existsSync(`${target}.bak`)) await copyFile(target, `${target}.bak`);
  await copyFile(outPath, target);
  console.log(`installed       : ${target}`);
  console.log("now set language=16 in %LOCALAPPDATA%\\UFC3Native\\sacredfire.ini");
}
