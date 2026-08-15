<!-- 此區段由 ADE (__ADE_NAME__) 管理，update 時整段覆蓋。勿直接編輯；要修改請至 ADE repo 改，或使用 ade-contribute skill。 -->
## ADE 工作區指引

本目錄是 agent 工作站，知識庫位於 `.claude/ade/knowledge/`。

### 開發某個服務時

1. 讀 `.claude/ade/knowledge/services/index.md`（全服務總覽）定位目標服務
2. 讀 `.claude/ade/knowledge/services/<service>.md` 取得該服務的定位、repo、技術棧、開發指令
3. 若 `workspaces/<service>/` 不存在，依該檔「Repo」區塊 clone 到 `workspaces/<service>/`
4. 依「本地開發」區塊操作（安裝、啟動、測試）；流程慣例見 `knowledge/process/`，功能規格見 `knowledge/specs/`

### 知識維護

- 發現知識過期、缺漏，或學到新慣例 → 用 `ade-contribute` skill 開 PR 回 ADE repo
- 要註冊新服務 → 用 `ade-add-service` skill
- `.claude/ade/` 與 `.claude/skills/ade-*/` 為 managed 區域，勿直接修改
