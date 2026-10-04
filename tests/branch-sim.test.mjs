// Unit tests for the branch simulator's git model (no DOM needed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL("../assets/branch-sim.js", import.meta.url), "utf8"), ctx);
const { run, createState } = ctx.window.BranchSim;

function fresh(...cmds) {
  const s = createState();
  for (const c of cmds) run(s, c);
  return s;
}

test("commit advances the current branch", () => {
  const s = fresh("git commit -m 'a'", "git commit -m 'b'");
  assert.equal(s.commits.length, 2);
  assert.equal(s.branches.main, s.commits[1].id);
  assert.deepEqual([...s.commits[1].parents], [s.commits[0].id]);
});

test("switch -c creates a branch pointing at the same commit", () => {
  const s = fresh("git commit", "git switch -c clean-data");
  assert.equal(s.head, "clean-data");
  assert.equal(s.branches["clean-data"], s.branches.main);
  assert.match(run(s, "git switch -c clean-data").out, /already exists/);
});

test("checkout -b behaves like switch -c", () => {
  const s = fresh("git commit", "git checkout -b x");
  assert.equal(s.head, "x");
});

test("switch to a missing branch errors", () => {
  const s = fresh("git commit");
  const r = run(s, "git switch nope");
  assert.ok(r.err);
  assert.match(r.out, /invalid reference/);
});

test("merge fast-forwards when main has not moved", () => {
  const s = fresh("git commit", "git switch -c f", "git commit", "git switch main");
  const r = run(s, "git merge f");
  assert.match(r.out, /Fast-forward/);
  assert.equal(s.branches.main, s.branches.f);
  assert.equal(s.mergeCommits().length, 0);
});

test("merge creates a merge commit when histories diverge", () => {
  const s = fresh("git commit", "git switch -c f", "git commit", "git switch main", "git commit");
  const r = run(s, "git merge f");
  assert.match(r.out, /ort/);
  assert.equal(s.mergeCommits().length, 1);
  assert.ok(s.isAncestor(s.branches.f, s.branches.main));
});

test("--no-ff forces a merge commit", () => {
  const s = fresh("git commit", "git switch -c f", "git commit", "git switch main", "git merge --no-ff f");
  assert.equal(s.mergeCommits().length, 1);
});

test("branch -d refuses unmerged work, -D forces", () => {
  const s = fresh("git commit", "git switch -c f", "git commit", "git switch main");
  assert.match(run(s, "git branch -d f").out, /not fully merged/);
  assert.ok(s.branches.f);
  run(s, "git branch -D f");
  assert.equal(s.branches.f, undefined);
});

test("cannot delete the checked-out branch", () => {
  const s = fresh("git commit", "git switch -c f");
  assert.ok(run(s, "git branch -d f").err);
});

test("ahead counts commits not on base", () => {
  const s = fresh("git commit", "git switch -c f", "git commit", "git commit");
  assert.equal(s.ahead("f", "main"), 2);
  assert.equal(s.ahead("main", "f"), 0);
});

test("push -u publishes and sets upstream", () => {
  const s = fresh("git commit", "git switch -c f");
  assert.match(run(s, "git push").out, /no upstream/);
  run(s, "git push -u origin f");
  assert.equal(s.remotes.f, s.branches.f);
  assert.equal(s.upstream.f, "f");
  run(s, "git commit");
  assert.match(run(s, "git status").out, /ahead of 'origin\/f'/);
  run(s, "git push");
  assert.equal(s.remotes.f, s.branches.f);
});

test("log lists reachable commits newest first with refs", () => {
  const s = fresh("git commit -m one", "git commit -m two");
  const out = run(s, "git log --oneline").out.split("\n");
  assert.equal(out.length, 2);
  assert.match(out[0], /HEAD -> main.*two/);
});
