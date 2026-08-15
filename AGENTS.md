# agentic-dev-env

## 維護紀律

- 既存 ADE repos 以 `^0.1.0` 依賴本套件，runner 的修改必須向後相容舊的 ADE repo 目錄結構；結構性 breaking change 一律 major bump
- 各 ADE repo 會透過 `ade-feedback-upstream` skill 開 PR 回饋機制改良；review 時檢查 PR 不含任何公司知識內容

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus `docs/ADR/`. See `docs/agents/domain.md`.
