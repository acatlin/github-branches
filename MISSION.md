# Mission: GitHub Branches for Agentic Coding

## Why
Data science students who already commit and push to GitHub need to work safely and in parallel with an AI coding agent (Claude Code). Branches let them hand the agent a sandbox, review its changes as a pull request, and let CI vet the work before anything touches `main`.

## Success looks like
- Explain what a branch is (a movable pointer to a commit) and read a branch graph.
- Create, switch, push, merge, and delete branches from the command line without looking things up.
- Open, review, and merge a pull request on GitHub; resolve a simple merge conflict.
- Explain how CI checks run on pull requests and how CD deploys from `main`.
- Run a full Claude Code task on its own branch: brief → branch → agent commits → diff review → PR → green CI → merge.
- Run two Claude Code sessions in parallel using git worktrees.

## Constraints
- Audience: data science students, basic GitHub skills (clone/add/commit/push), no branch experience.
- Lessons must be short (≈15 min each), self-contained HTML, shareable via GitHub Pages.
- All claims grounded in official documentation, with citations.

## Out of scope
- Advanced history rewriting (interactive rebase, cherry-pick, reflog surgery).
- Enterprise branching models (GitFlow release trains, monorepo tooling).
- Writing complex CI pipelines beyond a minimal test workflow.
