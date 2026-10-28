#!/usr/bin/env node
// Step 3 of 4 — VALIDATE.
// Every translated string must keep the game's formatting intact, otherwise the
// game either shows broken text or crashes. This checks, per string:
//   - the id exists in the English database
//   - all markup tokens appear in the same ORDER as the original
//     (^X^ button names, %1s/%2d placeholders, <font ...> tags, | separators)
//   - the number of line breaks is unchanged
//   - the text is not empty
//
// usage:
//   node tools/validate.mjs --game "E:\...\CUSA06534"
//   node tools/validate.mjs --db "<...>/eng_us.db"
//
// Exit code 0 = clean, 1 = problems found (printed line by line).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { openFifaDatabase } from "fifa-t3db";

const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const game = opt("--game");
const dbPath = opt("--db", game ? join(game, "samplegame", "data", "kettle", "loc", "eng_us.db") : null);
const trPath = opt("--translations", "translations/lt.json");

if (!dbPath) {
  console.error("usage: node tools/validate.mjs --game <CUSA06534 folder>");
  process.exit(2);
}

const TOKEN = /\^[A-Z0-9_]+\^|%[0-9]*[sd]|<[^>]+>|\|/g;
const tokens = (s) => (s.match(TOKEN) ?? []).join("|");
const newlines = (s) => (s.match(/\n/g) ?? []).length;

const meta = await readFile(dbPath.replace(/\.db$/i, "-meta.xml"), "utf8");
const bytes = await readFile(dbPath);
const db = openFifaDatabase({ database: new Uint8Array(bytes), metadataXml: meta });
const en = new Map(db.readTable("LanguageStrings").rows.map((r) => [r.stringid, r.sourcetext ?? ""]));

const translations = JSON.parse(await readFile(trPath, "utf8"));

let ok = 0;
const problems = [];
for (const [id, text] of Object.entries(translations)) {
  if (!en.has(id)) { problems.push(`NO SUCH ID      ${id}`); continue; }
  const src = en.get(id);
  if (typeof text !== "string" || text.trim() === "") { problems.push(`EMPTY            ${id}`); continue; }
  const tSrc = tokens(src), tLt = tokens(text);
  if (tSrc !== tLt) { problems.push(`TOKENS           ${id}\n  en: ${tSrc}\n  lt: ${tLt}`); continue; }
  const nSrc = newlines(src), nLt = newlines(text);
  if (nSrc !== nLt) { problems.push(`LINEBREAKS       ${id} (${nSrc} -> ${nLt})`); continue; }
  ok++;
}

console.log(`checked : ${Object.keys(translations).length}`);
console.log(`ok      : ${ok}`);
console.log(`problems: ${problems.length}`);
if (problems.length) {
  console.log("");
  for (const p of problems) console.log(p);
  process.exit(1);
}
