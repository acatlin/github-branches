// Fails if any relative href/src in the site's HTML points at a missing file or #anchor.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const pages = ["index.html", ...["lessons", "reference"].flatMap((d) =>
  readdirSync(join(root, d)).filter((f) => f.endsWith(".html")).map((f) => join(d, f)))];

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = readFileSync(file, "utf8");
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
};

let broken = 0;
for (const page of pages) {
  const abs = join(root, page);
  const html = readFileSync(abs, "utf8");
  for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    const [path, hash] = url.split("#");
    const target = path ? resolve(dirname(abs), path) : abs;
    if (!existsSync(target)) { console.error(`${page}: missing file ${url}`); broken++; continue; }
    if (hash && target.endsWith(".html") && !idsOf(target).has(hash)) {
      console.error(`${page}: missing anchor ${url}`); broken++;
    }
  }
}
console.log(`Checked ${pages.length} pages: ${broken} broken link(s).`);
process.exit(broken ? 1 : 0);
