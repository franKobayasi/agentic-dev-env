<!-- 此區段由 ADE (__ADE_NAME__) 管理，update 時整段覆蓋。勿直接編輯；要修改請至 ADE repo 改，或使用 ade-contribute skill。 -->
## ADE 工作區指引

本目錄是 ADE，知識庫位於 `.claude/ade/knowledge/`。

### Session 開始時

- **檢查知識新鮮度**：讀 `.ade.json`，執行 `git ls-remote <source> HEAD`，若 hash 與 `commit` 不符，提醒使用者用 `ade-update` skill 更新後再繼續（勿自行修改 managed 內容）
- Session 一律從本目錄的根開啟；在 `workspaces/<service>/` 內開啟會失去 ade skills

### 知識庫

查找方式與各分類的導覽見 `.claude/ade/knowledge/README.md`。知識中的引用 `[文字](kb:<分類>/<id>)` 是符號位址：在 `.claude/ade/knowledge/<分類>/` 下搜尋 frontmatter 為 `id: <id>` 的檔案即可找到目標。

服務內部的規範、架構與建置步驟以服務 repo（CLAUDE.md、AGENTS.md、程式碼）為準，ADE 不另存一份。發現 ADE 的知識過期時，以服務 repo 為準繼續工作，任務收尾時用 `ade-contribute` 開 PR 修正，無需先徵詢。

### 開發某個服務時

1. 讀 `.claude/ade/knowledge/services/<服務名稱>.yaml`，取得定位、repo、技術棧與呼叫的服務；不確定名稱時使用 `ade-list-service`
2. `workspaces/<服務名稱>/` 已存在就直接使用，不存在才依 `repo.url` 與 `repo.branch` clone 到該位置
3. 讀服務 repo 自己的 README、CLAUDE.md 或 AGENTS.md，完成安裝、啟動與測試；跨服務的流程與慣例見 `knowledge/process/`，產品規格見 `knowledge/specs/`

### 知識維護

`.claude/ade/` 與 `.claude/skills/ade-*/` 為 managed 區域、視同唯讀；註冊服務、新增 skill／流程、建 PRD、更新 spec 等維護動作由 ade-* skills 引導，一律經 `ade-contribute` 改 `workspaces/` 下的 ADE 工作副本並開 PR。
