# Extra facts (lessons 6–7) — retrieved 2026-10-04

## Python virtual environments
- Create: `python -m venv /path/to/new/virtual/environment`; activate on POSIX bash/zsh with `source <venv>/bin/activate`; on Windows PowerShell `<venv>\Scripts\Activate.ps1`, cmd `<venv>\Scripts\activate.bat`. — [source](https://docs.python.org/3/library/venv.html)
- Venvs "should not be checked into source control systems such as Git"; they are "disposable"; environments are non-portable, so "recreate it at the desired location" rather than moving it. — [source](https://docs.python.org/3/library/venv.html)

## Locally verified git behaviour (git 2.52.0.windows.1, scratch repo)
- `git worktree add ../penguins-lab-plot -b add-species-plot` prints `Preparing worktree (new branch 'add-species-plot')`.
- `git worktree list` prints each worktree path, short hash, and `[branch]`; main worktree first.
- Adding/switching to a branch already checked out in another worktree: `fatal: 'add-species-plot' is already used by worktree at '<path>'` (both `git worktree add` and `git switch`).
- `git branch -D` on a branch checked out in a worktree: `error: cannot delete branch 'add-species-plot' used by worktree at '<path>'`.
- `git branch -vv` marks branches checked out in other worktrees with `+` and shows the worktree path.
- `git worktree remove` on a worktree with untracked files: `fatal: '../penguins-lab-plot' contains modified or untracked files, use --force to delete it`.
- `git worktree remove` keeps the branch; delete it separately.
- After a squash merge (`git merge --squash` + commit), `git branch -d feat` refuses: `error: the branch 'feat' is not fully merged` — use `-D` once the PR is confirmed merged.
