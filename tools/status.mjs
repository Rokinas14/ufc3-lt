#!/usr/bin/env node
// Progress report — compares a built pol_pl.db with the English base and says
// how many strings really differ. Ground truth, unlike counting the JSON file.
//
// usage:
//   node tools/status.mjs --game "E:\...\CUSA06534"
//   node tools/status.mjs --game "E:\...\CUSA06534" --list 40     (also print 40 still-English strings)
//
// Author: fan translation project. No game files are modified by this script.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { openFifaDatabase } from "fifa-t3db";

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const game = opt("--game");
const locDir = game ? join(game, "samplegame", "data", "kettle", "loc") : null;
const basePath = opt("--db", locDir ? join(locDir, "eng_us.db") : null);
const modPath = opt("--mod", locDir ? join(locDir, "pol_pl.db") : null);
const listCount = Number(opt("--list", "0"));

if (!basePath || !modPath) {
  console.error('usage: node tools/status.mjs --game <CUSA06534 folder> [--list N]');
  process.exit(2);
}

async function readAll(path) {
  const meta = await readFile(path.replace(/\.db$/i, "-meta.xml"), "utf8");
  const bytes = await readFile(path);
  const db = openFifaDatabase({ database: new Uint8Array(bytes), metadataXml: meta });
  return db.readTable("LanguageStrings").rows;
}

const [base, mod] = await Promise.all([readAll(basePath), readAll(modPath)]);
const baseById = new Map(base.map((r) => [r.stringid, r.sourcetext ?? ""]));

let changed = 0, same = 0;
const stillEnglish = [];
for (const row of mod) {
  const en = baseById.get(row.stringid);
  if (en === undefined) continue;
  if ((row.sourcetext ?? "") !== en) changed++;
  else { same++; stillEnglish.push({ stringid: row.stringid, en }); }
}

const total = changed + same;
const pct = ((changed / total) * 100).toFixed(1);
console.log(`strings in the game : ${total}`);
console.log(`translated          : ${changed} (${pct}%)`);
console.log(`left English        : ${same}`);

if (listCount > 0) {
  console.log(`\n--- ${Math.min(listCount, stillEnglish.length)} left as English ---`);
  for (const row of stillEnglish.slice(0, listCount)) {
    const text = row.en.replace(/\r?\n/g, "\\n");
    console.log(`${row.stringid} :: ${text.length > 110 ? text.slice(0, 110) + "…" : text}`);
  }
}
