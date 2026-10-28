#!/usr/bin/env node
// Step 1 of 4 — EXTRACT.
// Reads the English language database of the game and dumps every string to JSON.
// You only need this when starting a translation from scratch, or to look up
// which string id is shown on a screen you want to fix.
//
// usage:
//   node tools/extract.mjs --db "<game>/samplegame/data/kettle/loc/eng_us.db" --out translations/en.json
//
// The output is { "TXT_SOME_ID": "English text", ... }, sorted by id.

import { readFile, writeFile } from "node:fs/promises";
import { openFifaDatabase } from "fifa-t3db";

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const dbPath = opt("--db");
const outPath = opt("--out", "translations/en.json");
if (!dbPath) {
  console.error("usage: node tools/extract.mjs --db <eng_us.db> [--out translations/en.json]");
  process.exit(2);
}

const metaPath = dbPath.replace(/\.db$/i, "-meta.xml");
const [bytes, meta] = await Promise.all([readFile(dbPath), readFile(metaPath, "utf8")]);
const db = openFifaDatabase({ database: new Uint8Array(bytes), metadataXml: meta });

const rows = db.readTable("LanguageStrings").rows;
const out = {};
for (const row of rows) out[row.stringid] = row.sourcetext ?? "";
const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));

await writeFile(outPath, JSON.stringify(sorted, null, 1) + "\n", "utf8");
console.log(`${rows.length} strings -> ${outPath}`);
