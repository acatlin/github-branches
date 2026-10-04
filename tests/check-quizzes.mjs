// Every option within a quiz question must have the same word count, so
// formatting never hints at the answer. Also requires exactly one correct option.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const words = (html) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, "x").trim().split(/\s+/).filter(Boolean).length;

let problems = 0, total = 0;
for (const f of readdirSync(join(root, "lessons")).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(join(root, "lessons", f), "utf8");
  for (const [, quiz] of html.matchAll(/<div class="quiz">([\s\S]*?)<\/div>/g)) {
    total++;
    const q = (quiz.match(/<p class="q">([\s\S]*?)<\/p>/) || [, "?"])[1].replace(/<[^>]+>/g, "").slice(0, 60);
    const opts = [...quiz.matchAll(/<li( data-correct)?>([\s\S]*?)<\/li>/g)];
    const counts = opts.map((m) => words(m[2]));
    const correct = opts.filter((m) => m[1]).length;
    if (new Set(counts).size > 1) { console.error(`${f}: unequal option lengths ${JSON.stringify(counts)} — "${q}"`); problems++; }
    if (correct !== 1) { console.error(`${f}: ${correct} correct options — "${q}"`); problems++; }
  }
}
console.log(`Checked ${total} quizzes: ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
