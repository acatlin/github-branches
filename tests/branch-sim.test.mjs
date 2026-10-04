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

// A branch f with two commits; main either stays put or moves on by one commit.
const diverged = () => fresh("git commit -m base", "git switch -c f", "git commit -m f1", "git commit -m f2", "git switch main", "git commit -m m1");
const sorted = (ids) => [...ids].sort();

test("merge-base of two diverged branches is the commit where they split", () => {
  const s = diverged();
  const r = run(s, "git merge-base main f");
  assert.equal(r.out, s.commits[0].id);
  assert.equal(s.mergeBase, s.commits[0].id);
  assert.equal(s.highlight, null);
});

test("merge-base is the older tip when one branch is an ancestor of the other", () => {
  const s = fresh("git commit", "git commit", "git switch -c f", "git commit");
  assert.equal(run(s, "git merge-base main f").out, s.branches.main);
  assert.equal(run(s, "git merge-base f main").out, s.branches.main);
});

test("three-dot diff stays on the branch when main moves", () => {
  const s = diverged();
  run(s, "git diff main...f");
  assert.equal(s.mergeBase, s.commits[0].id);
  assert.equal(s.highlight.form, "...");
  assert.deepEqual(sorted(s.highlight.added), sorted([s.commits[1].id, s.commits[2].id]));
  assert.deepEqual([...s.highlight.reversed], []);
});

test("two-dot diff also covers main's commits, reversed, when main moves", () => {
  const s = diverged();
  const r = run(s, "git diff main..f");
  assert.equal(s.highlight.form, "..");
  assert.deepEqual(sorted(s.highlight.added), sorted([s.commits[1].id, s.commits[2].id]));
  assert.deepEqual([...s.highlight.reversed], [s.commits[3].id]);
  assert.match(r.out, /reversed/);
  run(s, "git diff main f");
  assert.deepEqual([...s.highlight.reversed], [s.commits[3].id]);
});

test("both diff forms cover the same commits while main has not moved", () => {
  const s = fresh("git commit", "git switch -c f", "git commit", "git commit", "git switch main");
  run(s, "git diff main..f");
  const twoDot = { added: sorted(s.highlight.added), reversed: [...s.highlight.reversed] };
  run(s, "git diff main...f");
  assert.deepEqual({ added: sorted(s.highlight.added), reversed: [...s.highlight.reversed] }, twoDot);
  assert.equal(twoDot.added.length, 2);
  assert.deepEqual(twoDot.reversed, []);
});

test("both diff forms agree again after the branch merges main", () => {
  const s = diverged();
  run(s, "git switch f");
  run(s, "git merge main");
  assert.equal(run(s, "git merge-base main f").out, s.branches.main);
  run(s, "git diff main..f");
  const twoDot = sorted(s.highlight.added);
  assert.deepEqual([...s.highlight.reversed], []);
  run(s, "git diff main...HEAD");
  assert.deepEqual(sorted(s.highlight.added), twoDot);
  assert.deepEqual([...s.highlight.reversed], []);
});

test("merge-base and diff reject an unknown branch name", () => {
  const s = diverged();
  const mb = run(s, "git merge-base main nope");
  assert.ok(mb.err);
  assert.match(mb.out, /Not a valid object name nope/);
  const d = run(s, "git diff main...nope");
  assert.ok(d.err);
  assert.match(d.out, /unknown revision/);
  assert.equal(s.mergeBase, null);
  assert.equal(s.highlight, null);
});

test("a new commit clears the marks from the last diff", () => {
  const s = diverged();
  run(s, "git diff main..f");
  run(s, "git commit");
  assert.equal(s.mergeBase, null);
  assert.equal(s.highlight, null);
});
