# __ADE_NAME__（ADE 知識庫）

這是團隊的 Agentic Dev Environment 知識庫 repo。結構與維護原則見 README.md。

## PRD / Spec 生命週期

- `knowledge/prd/`：一次開發一檔的需求文件，歷史文件不迭代（草稿 → 已確認 → 已實作）
- `knowledge/specs/`：當前功能的真相來源，持續迭代；`🚧 尚未實作` 標記代表已定案未開發

流程：PO 用 `ade-create-prd` 建 PRD → 確認後用 `ade-prd-to-spec` 更新 spec（標 🚧）→ RD 於工作目錄開發 → 開發完成 RD 跑 `ade-align-spec`（注入工作目錄的 skill）開 PR 回本 repo 收尾。

## 編輯慣例

- 服務文件必須符合 `knowledge/services/_template.md` 區塊結構，並同步更新 `services/index.md` 總覽
- 修改 spec 時沿用既有詞彙；PRD 只在「已實作」前可改
