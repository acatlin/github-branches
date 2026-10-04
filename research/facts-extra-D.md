# Extra verified facts (lessons 8–9)

- nbformat `display_data` outputs carry image data inline: the schema example shows `"image/png": "[base64-encoded-multiline-png-data]"` inside an output's `data` dict, so plots are stored in the notebook file itself. — [source](https://nbformat.readthedocs.io/en/latest/format_description.html#display-data)
- `gh issue create` flags (verified locally, gh 2.100.0 `--help`): `-t/--title`, `-b/--body`, `-F/--body-file`, `-l/--label`, `-a/--assignee` ("@me" to self-assign), `-w/--web`. — [manual](https://cli.github.com/manual/gh_issue_create)

## Tested locally (2026-10-04, Git 2.52.0)
- After a squash merge (`git merge --squash feat` + commit on main, push, remote branch deleted, `git fetch --prune`), `git branch -d feat` refuses: "error: the branch 'feat' is not fully merged" with hint to use `git branch -D feat`. Squash creates a new commit, so feat's tip is not reachable from main. Learners must use `-D` (or GitHub's auto-delete + `-D` locally) after squash-merging.
