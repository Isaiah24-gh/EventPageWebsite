#!/usr/bin/env node
/* ==========================================================================
   EJS template syntax check
   OWNERSHIP: Member 3 (CI/CD)

   EJS compiles lazily — a stray `<%` in views/account.ejs is invisible until
   a user hits that page and gets a 500. This walks views/ and compiles every
   template so CI catches it instead.

   Run:  npm run check:views
   ========================================================================== */

const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const VIEWS_DIR = path.join(__dirname, "..", "views");

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    return entry.name.endsWith(".ejs") ? [full] : [];
  });
}

if (!fs.existsSync(VIEWS_DIR)) {
  console.error(`views/ not found at ${VIEWS_DIR}`);
  process.exit(1);
}

const files = collect(VIEWS_DIR);
const failures = [];

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  try {
    ejs.compile(fs.readFileSync(file, "utf8"), { filename: file });
    console.log(`  ok    ${rel}`);
  } catch (err) {
    failures.push({ rel, message: err.message });
    // GitHub Actions annotation — shows up inline on the PR diff.
    console.log(`::error file=${rel}::${err.message.split("\n")[0]}`);
  }
}

console.log(`\n${files.length} template(s) checked, ${failures.length} failed.`);

if (failures.length) {
  for (const f of failures) console.error(`\n${f.rel}\n${f.message}`);
  process.exit(1);
}
