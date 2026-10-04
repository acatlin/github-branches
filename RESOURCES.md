# GitHub Branches for Agentic Coding — Resources

Verified fact sheet with quotes and deep links: [research/facts.md](research/facts.md) (retrieved 2026-10-04).

## Knowledge

- [Pro Git, ch. 3 "Git Branching" — Chacon & Straub](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
  The canonical explanation of branches as movable pointers, HEAD, merging, remote branches. Use for: every conceptual claim in lessons 1–4.
- [git-scm.com reference docs (Git 2.56)](https://git-scm.com/docs)
  Authoritative command behaviour (`git switch`, `git branch`, `git merge`, `git diff`, `git worktree`). Use for: exact flags and semantics. Note `git switch`/`git restore` are no longer experimental since 2.51.
- [GitHub Docs — Branches reference](https://docs.github.com/en/pull-requests/reference/branches) and [Pull requests reference](https://docs.github.com/en/pull-requests/reference/pull-requests)
  Default branch, head/base, three-dot diffs, draft PRs. Use for: lesson 4.
- [GitHub Docs — About pull request merges](https://docs.github.com/en/pull-requests/reference/pull-request-merges)
  Merge commit vs squash vs rebase. Use for: choosing a merge method for agent branches.
- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
  The six-step branch → PR → merge → delete loop. Use for: the backbone workflow of the course.
- [GitHub Docs — Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
  Required status checks and reviews. Free plan: public repos only.
- [GitHub Actions — workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [Python tutorial](https://docs.github.com/en/actions/tutorials/build-and-test-code/python)
  `on: pull_request` / `push` branch filters, merge ref, pytest CI. Use for: lesson 5.
- [Martin Fowler — Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html) and [Patterns for Managing Source Code Branches](https://martinfowler.com/articles/branching-patterns.html)
  The why behind short-lived branches and healthy mainlines. Use for: CI/CD perspective.
- [Claude Code docs — Best practices](https://code.claude.com/docs/en/best-practices), [Common workflows](https://code.claude.com/docs/en/common-workflows), [Worktrees](https://code.claude.com/docs/en/worktrees), [Checkpointing](https://code.claude.com/docs/en/checkpointing), [CLI reference](https://code.claude.com/docs/en/cli-reference)
  How Claude Code commits, opens PRs, runs in worktrees (`claude -w`), and why checkpoints don't replace git. Use for: lessons 6–7.
- [GitHub CLI manual](https://cli.github.com/manual/)
  `gh repo create`, `gh pr create/checks/merge`. Verified against gh 2.100.0.
- [nbdime docs](https://nbdime.readthedocs.io/en/latest/) and [Jupytext](https://github.com/jupytext/jupytext)
  Notebook-aware diff/merge, and pairing notebooks with `.py` files. Use for: lesson 8.
- Practice: [Learn Git Branching](https://learngitbranching.js.org) (interactive visualiser); GitHub Skills courses — [Review pull requests](https://github.com/skills/review-pull-requests), [Resolve merge conflicts](https://github.com/skills/resolve-merge-conflicts), [Hello GitHub Actions](https://github.com/skills/hello-github-actions), [Test with Actions](https://github.com/skills/test-with-actions).

## Wisdom (Communities)

- [GitHub Community discussions](https://github.com/orgs/community/discussions)
  Official, moderated. Use for: Actions, PR, and branch-protection questions.
- [Anthropic Discord](https://www.anthropic.com/discord)
  Official community. Use for: Claude Code workflow questions, comparing branch/worktree habits with other agentic coders.
- [Stack Overflow `git` tag](https://stackoverflow.com/questions/tagged/git)
  Huge archive of answered git questions; search before asking.
- [Claude Code issues](https://github.com/anthropics/claude-code/issues)
  Bug reports and feature requests for Claude Code itself.

## Gaps

- Fowler's exact definitions of Continuous Delivery vs Deployment were only paraphrased — quote GitHub's CD doc instead.
- ~~`gh api` Pages command unverified~~ — verified 2026-10-04: `gh api -X POST "repos/acatlin/github-branches/pages" -f build_type=workflow` returned build_type `workflow`.
