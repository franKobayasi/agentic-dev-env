# __ADE_NAME__（ADE 知識庫）

這是團隊的 Agentic Dev Environment 知識庫 repo。結構與維護原則見 README.md。`hub/` 底下是 init／update 注入每個工作目錄的內容，其餘都屬於本 repo 本身。

## PRD / Spec 生命週期

PO 用 `ade-create-prd` 建 PRD → 確認後用 `ade-prd-to-spec` 更新 spec（標 🚧）→ RD 於工作目錄開發 → 開發完成 RD 跑 `ade-align-spec`（注入工作目錄的 skill）開 PR 回本 repo 收尾。文件定位與狀態規則見 `knowledge/prd/README.md`、`knowledge/specs/README.md`。

## 編輯慣例

- **任何文件或流程的設計都遵守 `knowledge/README.md` 的「底層原則：Context 管理」**——常駐最小化、細節按需載入、導航短細節深
- 服務描述檔必須符合 `knowledge/services/_template.yaml` 欄位結構，並同步更新 `services/index.md` 總覽；收錄範圍遵守 `knowledge/README.md` 的分層規則
- 文件與 skill 中的 `knowledge/…` 指知識庫根：本 repo 內是 `hub/knowledge/`，工作目錄內是 `.claude/ade/knowledge/`
- 修改 spec 時沿用既有詞彙；PRD 進入「已實作」或「已廢止」後不再修改
