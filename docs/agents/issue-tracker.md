# Issue tracker: beads (bd)

Issues, epics and their dependencies for this repo are tracked with [beads](https://beads.gascity.com/) (`bd`), issue prefix `ade`. Issue data lives in a local Dolt database under `.beads/` and syncs only through the git remote's `refs/dolt/data` ref. Nothing bd creates is committed: `.gitignore` excludes `.beads*`, and `bd bootstrap` finds `refs/dolt/data` on `origin` by itself.

## Setup on a new machine

```sh
brew install beads                      # also installs dolt
bd config set metrics.disabled true     # usage metrics are sent to an external endpoint by default
git clone git@github.com:franKobayasi/agentic-dev-env.git
cd agentic-dev-env
bd bootstrap                            # clones the issue database from refs/dolt/data
bd list
```

Do not run `bd init` in an existing clone: it creates a new, empty database instead of restoring the shared one.

## Sync

Issue changes do not travel with `git push`.

- `bd dolt pull` before starting work
- `bd dolt push` after changing issues, and before switching machines
- Pushing needs the same write access to `origin` as `git push`

**Note**: `origin` is a public repo, so issue titles, descriptions and comments are public. Do not record company names, internal service names or any other company knowledge.

## Cautions

- `bd init` creates a git commit by itself. After running a `bd` command for the first time, check `git log` for commits it made

## When a skill says "publish to the issue tracker"

`bd create "<title>" -d "<description>"`; attach to an epic with `--parent <epic-id>`.

## When a skill says "fetch the relevant ticket"

`bd show <id>`. The user will normally pass the issue ID directly.

## Status and comments

- Status: `bd update <id> --status <open|in_progress|closed>`, or `bd close <id> --reason "<reason>"`
- Comments: `bd comments add <id> "<text>"`

## Wayfinding operations

Used by `/wayfinder`.

- **Map**: an epic, `bd create "<effort>" -t epic`. Its description holds Notes / Decisions-so-far / Fog
- **Child ticket**: `bd create "<question>" --parent <epic-id> -l <research|prototype|grilling|task>`; the label records the ticket type
- **Blocking**: `bd dep add <blocked-id> <blocker-id>`
- **Frontier**: `bd ready --parent <epic-id>` lists open, unblocked children
- **Claim**: `bd update <id> --claim` before any work
- **Resolve**: record the answer with `bd comments add <id> "<answer>"`, then `bd close <id> --reason "<gist>"`, then append a pointer to the map with `bd update <epic-id> --append-notes "<id>: <gist>"`
