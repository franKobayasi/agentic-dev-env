<!-- 此區段由 ADE (__ADE_NAME__) 管理，update 時整段覆蓋。勿直接編輯；要修改請至 ADE repo 改，或使用 ade-contribute skill。 -->
## ADE 工作區指引

本目錄是 agent 工作站，知識庫位於 `.claude/ade/knowledge/`。

### Session 開始時

- **檢查知識新鮮度**：讀 `.ade.json`，執行 `git ls-remote <source> HEAD`，若 hash 與 `commit` 不符，提醒使用者用 `ade-update` skill 更新後再繼續（勿自行修改 managed 內容）
- Session 一律從本目錄（hub 根）開啟；在 `workspaces/<service>/` 內開啟會失去 ade skills

### 知識分層

完整規則見 `.claude/ade/knowledge/README.md`。摘要：ADE 只收跨服務知識、取得服務的最小資訊、產品規格；服務內部一切以服務 repo（CLAUDE.md／AGENTS.md／code）為準。發現 ADE 側資訊過期：以服務 repo 為準繼續工作，任務收尾時用 `ade-contribute` 開 PR 修正，無需先徵詢。

### 開發某個服務時

1. 讀 `.claude/ade/knowledge/services/index.md`（全服務總覽）定位目標服務
2. 讀 `.claude/ade/knowledge/services/<service>.yaml` 取得定位、repo、技術棧、依賴關係
3. `workspaces/<service>/` 已存在就直接用，不存在才依 `repo.url` / `repo.branch` clone 到 `workspaces/<service>/`
4. 讀服務 repo 自身的 README／CLAUDE.md／AGENTS.md 完成安裝、啟動、測試；跨服務流程慣例見 `knowledge/process/`，功能規格見 `knowledge/specs/`

### 知識維護

`.claude/ade/` 與 `.claude/skills/ade-*/` 為 managed 區域、視同唯讀；註冊服務、新增 skill／流程、建 PRD、更新 spec 等維護動作由 ade-* skills 引導，一律經 `ade-contribute` 改 `workspaces/` 下的 ADE 工作副本並開 PR。
