# Verified facts for Part 2 (lessons 10–12): merge base, two diffs, stale branches, baselines

Retrieved 2026-10-04. Quotes are verbatim from the linked page on that date (git-scm.com at Git 2.56.0; GitHub Docs fetched as rendered Markdown through `docs.github.com/api/article/body`). "Tested locally" items come from the rehearsal described at the end. **Inference** marks a conclusion of mine that the docs do not state in so many words.

## 1. The merge base (`git merge-base`)

- NAME: "git-merge-base - Find as good common ancestors as possible for a merge". The page was "last updated in 2.43.0" and is unchanged through 2.56.0. — [source](https://git-scm.com/docs/git-merge-base)
- Definition: "*git merge-base* finds the best common ancestor(s) between two commits to use in a three-way merge. One common ancestor is *better* than another common ancestor if the latter is an ancestor of the former. A common ancestor that does not have any better common ancestor is a *best common ancestor*, i.e. a *merge base*. Note that there can be more than one merge base for a pair of commits." — [source](https://git-scm.com/docs/git-merge-base#_description)
- Two commits on the command line: "In the most common special case, specifying only two commits on the command line means computing the merge base between the given two commits." — [source](https://git-scm.com/docs/git-merge-base#_operation_modes)
- Output: "Given two commits *A* and *B*, `git merge-base A B` will output a commit which is reachable from both *A* and *B* through the parent relationship." — [source](https://git-scm.com/docs/git-merge-base#_discussion)
- `--all`: "Output all merge bases for the commits, instead of just one." Not taught; the course's histories have one merge base. — [source](https://git-scm.com/docs/git-merge-base#Documentation/git-merge-base.txt---all)
- `--fork-point` is a different mode (it consults the reflog of a ref). This is why the glossary tells students not to call the merge base a "fork point". — [source](https://git-scm.com/docs/git-merge-base#Documentation/git-merge-base.txt---fork-point)
- GitHub's wording: "The merge base is the commit that is the last common ancestor between the topic branch and the base branch." — [source](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-pull-request-reviews-before-merging)
- Tested locally: `git merge-base main add-loader` prints the full 40-character hash. While `main` has not moved it equals `git rev-parse main`. An unknown name gives `fatal: Not a valid object name nope`.

## 2. The two diff forms (`git diff`, page last updated in 2.56.0)

- Two commits, no dots: "This is to view the changes between two arbitrary `<commit>`." — [source](https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-gitdiffoptions--merge-basecommitcommit--path)
- **Two-dot:** `git diff [<options>] <commit>..<commit> [--] [<path>...]`: "This is synonymous to the earlier form (without the `..`) for viewing the changes between two arbitrary `<commit>`. If `<commit>` on one side is omitted, it will have the same effect as using `HEAD` instead." — [source](https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-gitdiffoptionscommitcommit--path)
- **Three-dot:** `git diff [<options>] <commit>...<commit> [--] [<path>...]`: "This form is to view the changes on the branch containing and up to the second `<commit>`, starting at a common ancestor of both `<commit>`. `git diff A...B` is equivalent to `git diff $(git merge-base A B) B`. You can omit any one of `<commit>`, which has the same effect as using `HEAD` instead." — [source](https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-gitdiffoptionscommitcommit--path-1)
- `git diff --merge-base A B` "is equivalent to `git diff $(git merge-base A B) B`", so it is a third spelling of the three-dot diff. Not taught. — [source](https://git-scm.com/docs/git-diff#Documentation/git-diff.txt-gitdiffoptions--merge-basecommitcommit--path)
- The dots mean something else in `git log`: "However, `diff` is about comparing two *endpoints*, not ranges, and the range notations (`<commit>..<commit>` and `<commit>...<commit>`) do not mean a range as defined in the "SPECIFYING RANGES" section in gitrevisions[7]." — [source](https://git-scm.com/docs/git-diff#_description)
- The range meaning, used by `git log HEAD..origin/main`: "you can ask for commits that are reachable from r2 excluding those that are reachable from r1 by `^r1 r2` and it can be written as `r1..r2`." — [source](https://git-scm.com/docs/gitrevisions#_dotted_range_notations)
- **Inference** (follows from the two definitions): in a two-dot diff, a change that landed on the first branch after the split shows up reversed, because the diff describes how to turn the first tip into the second tip and the second tip does not contain that change. Tested locally: after a README line landed on `main`, `git diff main..add-loader` printed that line with a leading `-`, and `git diff main...add-loader` did not mention `README.md`.
- Tested locally: an unknown name gives `fatal: ambiguous argument 'main...nope': unknown revision or path not in the working tree.`

## 3. GitHub: pull requests show a three-dot diff

- "A pull request compares the proposed changes on the head branch with the base branch. ... The **Files changed** tab shows what would change if the pull request merged." — [source](https://docs.github.com/en/pull-requests/reference/branches#comparing-branches-in-pull-requests)
- "The `git diff` command supports two comparison methods. Pull requests on GitHub show a three-dot diff." Table: three-dot (`git diff A...B`) compares "The most recent common commit of both branches (merge base) and the most recent version of the topic branch."; two-dot (`git diff A..B`) compares "The most recent state of the base branch (for example, `main`) and the most recent version of the topic branch." — [source](https://docs.github.com/en/pull-requests/reference/branches#three-dot-and-two-dot-git-diff-comparisons)
- "Because the three-dot comparison uses the merge base, it focuses on "what a pull request introduces."" — [source](https://docs.github.com/en/pull-requests/reference/branches#about-three-dot-comparison-on-github)
- "When you use a two-dot comparison, the diff changes when the base branch is updated, even if you haven't made any changes to the topic branch. A two-dot comparison also focuses on the base branch, which can make the changes introduced by the topic branch harder to understand." — same section
- "In contrast, a three-dot comparison keeps showing the changes introduced by the topic branch since the branches diverged." — same section
- **When the two agree again:** "To avoid confusion, merge the base branch (for example, `main`) into your topic branch frequently. When you merge the base branch, the diffs shown by two-dot and three-dot comparisons are the same." — [source](https://docs.github.com/en/pull-requests/reference/branches#merging-often)

## 4. GitHub: a branch that is out of date with its base

- "Before merging, update your pull request branch with changes from the base branch to catch conflicts or test failures early. You can update the branch from the pull request page when there are no merge conflicts and the branch is behind the base branch." — [source](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch) (the older `collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/...` URL still resolves)
- Where: "In the merge section near the bottom of the page, choose how to update the branch: Click **Update branch** to perform a traditional merge." A dropdown also offers **Update with rebase**. — same page
- "If changes to the base branch cause merge conflicts in your pull request branch, resolve the conflicts before updating the branch." — same page
- **The button is not always shown.** "If you enable the setting to always suggest updating pull request branches in your repository, people with write permissions will always have the ability, on the pull request page, to update a pull request's head branch when it's not up to date with the base branch. When not enabled, the ability to update is only available when the base branch requires branches to be up to date before merging and the branch is not up to date." The setting is under Settings → "Pull Requests" → **Always suggest updating pull request branches**. — [source](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-suggestions-to-update-pull-request-branches)
- Required status checks, strict: "The **Require branches to be up to date before merging** checkbox is checked." / "The branch **must** be up to date with the base branch before merging." / "This is the default behavior for required status checks. More builds may be required, as you'll need to bring the head branch up to date after other collaborators update the target branch." — [source](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- Loose: "The branch **does not** have to be up to date with the base branch before merging." / "Status checks may fail after you merge your branch if there are incompatible changes with the base branch." — same table
- Already in `facts.md` §6: a `pull_request` workflow runs by default on activity types `opened`, `synchronize`, `reopened`, and checks out the merge branch, so "Your CI tests run against the merged result". **Inference:** a merge into the base branch is none of those activity types, so a green check on an open pull request describes the base branch as it was at the pull request's last push. GitHub's strict mode ("More builds may be required … after other collaborators update the target branch") exists for this reason.
- `gh pr update-branch` exists (gh 2.100.0 `--help`: "Update a pull request branch with latest changes of the base branch. … The default behavior is to update with a merge commit"). Not taught; the course updates with `git merge origin/main` so the tests can be rerun locally.
- UNVERIFIED: the exact banner text GitHub shows next to the Update branch button. The lessons name the button and the setting, which the docs do state, and do not quote the banner.

## 5. Updating a branch with `git merge origin/main`

- `git fetch` moves `origin/main` and "will not modify your working directory at all" (`facts.md` §1). So `origin/main` is only as fresh as the last fetch.
- A merge that needs a merge commit opens the editor: `--edit`/`--no-edit`: "Invoke an editor before committing successful mechanical merge to further edit the auto-generated merge message, so that the user can explain and justify the merge. The `--no-edit` option can be used to accept the auto-generated message (this is generally discouraged)." — [source](https://git-scm.com/docs/git-merge#Documentation/git-merge.txt---no-edit)
- Tested locally: on the stale branch, `git merge origin/main` printed `Merge made by the 'ort' strategy.` and the auto-generated message was `Merge remote-tracking branch 'origin/main' into add-loader`. Running it again printed `Already up to date.`

## 6. Worktree at the merge base, and the Python environment

- `git worktree add <path> [<commit-ish>]`: "Create a worktree at `<path>` and checkout `<commit-ish>` into it." `-b <new-branch>`: "With `add`, create a new branch named `<new-branch>` starting at `<commit-ish>`, and check out `<new-branch>` into the new worktree. If `<commit-ish>` is omitted, it defaults to `HEAD`." — [source](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt--bnew-branch)
- Tested locally: `git worktree add ../penguins-lab-baseline -b baseline $(git merge-base main normalize-species)` prints `Preparing worktree (new branch 'baseline')` and `HEAD is now at c3b53d0 …`. `git worktree remove ../penguins-lab-baseline` then `git branch -d baseline` both succeed (the baseline commit is an ancestor of the current branch, so lowercase `-d` is enough).
- Activating a virtual environment "will prepend that directory to your `PATH`, so that running `python` will invoke the environment's Python interpreter". **Inference:** the activation belongs to the shell, so after `cd` into another worktree the same interpreter and packages are used. — [source](https://docs.python.org/3/library/venv.html#how-venvs-work)

## 7. Rehearsal (2026-10-04)

Git 2.52.0.windows.1, Python 3.14.4, pandas 3.0.3. A scratch copy of `penguins-lab` (README, `clean.py` with `drop_missing`, `test_clean.py`, `requirements.txt`) with a local bare repository standing in for GitHub. Every pull request merge was a **squash merge** made the way GitHub makes one: `git merge --squash` and one new commit on `main`, from a second clone, followed by deleting the remote branch. The full transcript is in the pull request that added Part 2.

- **Before `main` moves** the two diffs are identical: `git diff --stat main...add-loader` and `git diff --stat main..add-loader` both print `load.py | 5 +++++`.
- **After another pull request is squash-merged** the open branch is stale. Its merge base with `main` stays at the old commit, `git log --oneline HEAD..origin/main` lists the squash commit, the three-dot diff is unchanged, and the two-dot diff adds `README.md | 2 --`. This is the Lesson 11 claim about parallel agent branches, checked with a squash merge and not a plain merge.
- **After `git merge origin/main` on the branch** the merge base equals `origin/main`'s tip, `git log --oneline HEAD..origin/main` prints nothing, and both diffs again print only `load.py | 5 +++++`.
- After the squash merge of a branch whose remote branch still has a local remote-tracking ref, `git branch -d` deleted the local branch with a warning ("merged to 'refs/remotes/origin/add-loader', but not yet merged to HEAD"). `gh pr merge --squash --delete-branch` removes the local branch itself, as in Lessons 4–9.
- **Lesson 12 scores**, the same on every run of the same commit, and the same under pandas 2.3.3:

  | Run | Commit | Output |
  |---|---|---|
  | 1 | tip of `main` (has the sex-label fix) | `wrong rows: 3 4` / `score: 8/10` |
  | 2 | merge base, in worktree `../penguins-lab-baseline` on branch `baseline` | `wrong rows: 3 4 5 6 7` / `score: 5/10` |
  | 3 | tip of `normalize-species` | `wrong rows: 5 6 7` / `score: 7/10` |
  | 4 | `normalize-species` after `git merge origin/main` | `wrong rows: none` / `score: 10/10` |

  Run 3 against run 1 reports −1 (a loss). Run 3 against run 2 reports +2 (the branch's own change). Run 4 against run 1 reports +2 (what merging does to `main`). The merge of `origin/main` into `normalize-species` auto-merged `pipeline.py` with no conflict, and `python -m pytest -q` still passed.
- The design of the Lesson 12 eval is what testers call a golden-file check: a fixed input and a hand-checked expected output kept in the repository. The lesson describes it in those plain words and does not rely on the term.
