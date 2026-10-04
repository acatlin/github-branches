# GitHub Branches for Agentic Coding

A twelve-lesson, self-paced HTML course in two parts. Part 1 (Lessons 1–9) teaches data science students to use **GitHub branches, pull requests, and CI/CD** so they can work safely with **Claude Code**. Part 2 (Lessons 10–12), "Judging the agent's work", teaches them to compare an agent's branch with the right commit, in code and in eval scores.

**Read it:** https://acatlin.github.io/github-branches/

| # | Lesson | Win |
|---|--------|-----|
| 1 | What is a branch? | Branch = movable pointer; protect `main` in a simulator |
| 2 | Create, switch, compare | First real branch in `penguins-lab`; three-dot diff |
| 3 | Merge and clean up | Fast-forward vs merge commit; resolve a conflict |
| 4 | Push and pull requests | `push -u`, `gh pr create`, squash merge |
| 5 | CI/CD and branches | pytest on every PR, status checks, deploy from `main` |
| 6 | Claude Code on a branch | Agent branch loop, diff review, recovery options |
| 7 | Parallel sessions with worktrees | `git worktree` and `claude -w` |
| 8 | Notebooks and branches | nbdime and Jupytext |
| 9 | Capstone: the full loop | Interleaved review + end-to-end agentic task |
| 10 | Two diffs, two questions | Merge base; two-dot vs three-dot diff, predicted in the simulator |
| 11 | When `main` moves | Stale branches; update with `git merge origin/main` until the diffs agree |
| 12 | Fair baselines for evals | A deterministic eval; attribute a score change to the agent's branch |

Part 1 is complete on its own and ends at the capstone. Part 2 is appended after it, so no Lesson 1–9 URL changed.

References: [glossary](reference/glossary.html), [cheat sheet](reference/cheatsheet.html), [Claude Code branch workflow](reference/claude-code-workflow.html), [branch practice tutor](reference/practice-tutor.html) (a copy-paste prompt; its source of truth is [`practice-tutor.md`](reference/practice-tutor.md)).

## How this repo is built

- Plain static HTML, no build step. Shared components live in `assets/`: `style.css`, `quiz.js` (immediate-feedback quizzes), `drill.js` (command recall), `branch-sim.js` (an in-browser git that draws its commit graph, and marks the merge base and the commits a diff covers), and `course.js` (theme toggle, saved checklists).
- Every claim cites official docs. The verified fact sheet behind the lessons is [`research/facts.md`](research/facts.md); the one for Part 2, with the rehearsal results behind Lesson 12's scores, is [`research/facts-part-2.md`](research/facts-part-2.md).
- **The repo practises what it teaches.** Changes land through pull requests. [`ci-cd.yml`](.github/workflows/ci-cd.yml) validates HTML, type-checks the JavaScript (`tsc --checkJs`), unit-tests the simulator, and checks internal links on every PR. After CI passes on `main`, it deploys to GitHub Pages.

### Run the checks locally

```bash
npx -y html-validate@9 index.html lessons/*.html reference/*.html
npx -y -p typescript@5 tsc --noEmit --allowJs --checkJs --strict --target es2022 --lib es2022,dom,dom.iterable assets/*.js
node --test tests/branch-sim.test.mjs
node tests/check-quizzes.mjs
node tests/check-links.mjs
node tests/check-tutor-prompt.mjs
```

Teaching-workspace files (`MISSION.md`, `RESOURCES.md`, `NOTES.md`, `learning-records/`) record the course's goals and sources.
