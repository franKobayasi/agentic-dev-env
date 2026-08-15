# agentic-dev-env

## 維護紀律

- 既存 ADE repos 以 `^0.1.0` 依賴本套件，runner 的修改必須向後相容舊的 ADE repo 目錄結構；結構性 breaking change 一律 major bump
- 各 ADE repo 會透過 `ade-feedback-upstream` skill 開 PR 回饋機制改良；review 時檢查 PR 不含任何公司知識內容

## Layout 契約（runner ↔ ADE repo）

runner 對每個生成的 ADE repo 依賴以下結構——上面「向後相容」的對象就是這份清單：

- `knowledge/` — 整份複製到工作目錄 `.claude/ade/knowledge/`（必要）
- `skills/*/` — 逐目錄複製到工作目錄 `.claude/skills/`（可缺）
- `claude-md/section.md` — 注入 CLAUDE.md 的 `<!-- ADE:BEGIN/END -->` 區段內容（必要）
- `package.json` — 讀 `repository.url`（寫入 `.ade.json` 的 source）與 `ade.upstream`（feedback-upstream skill 用）
- 寫入工作目錄 `.ade.json`：`{ source, commit }`——消費者有三個：runner update、CLAUDE.md 區段的保鮮檢查、`ade-contribute` skill
- template 內的 `gitignore` / `dot-claude` 在腳手架時改名為 `.gitignore` / `.claude`（npm publish 會剝 dot 檔）；任何文字檔都可含 `__ADE_NAME__` 佔位符，create 時全檔掃描替換

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus `docs/ADR/`. See `docs/agents/domain.md`.
