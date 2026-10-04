// Fails if the prompt shown on reference/practice-tutor.html drifts from reference/practice-tutor.md.
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const md = readFileSync(join(root, "reference/practice-tutor.md"), "utf8").replace(/\r\n/g, "\n").trimEnd();
const html = readFileSync(join(root, "reference/practice-tutor.html"), "utf8").replace(/\r\n/g, "\n");

const match = html.match(/<pre id="tutor-prompt"><code>([\s\S]*?)<\/code><\/pre>/);
if (!match) { console.error("practice-tutor.html: no <pre id=\"tutor-prompt\"><code> block"); process.exit(1); }
const shown = match[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trimEnd();

if (shown !== md) {
  const a = shown.split("\n"), b = md.split("\n");
  const i = a.findIndex((line, n) => line !== b[n]);
  console.error(`Prompt drift at line ${i + 1}:\n  html: ${a[i]}\n  md:   ${b[i]}`);
  process.exit(1);
}
console.log(`Tutor prompt in sync (${md.split("\n").length} lines).`);
