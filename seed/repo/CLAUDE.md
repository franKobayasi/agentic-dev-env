# __ADE_NAME__（ADE）

這是團隊的 ADE，知識與 skill 的唯一事實來源。結構與維護原則見 README.md。`hub/` 底下是 init 與 update 注入每個 Forge 的內容，其餘都屬於本 repo 本身。

## PRD 與產品規格的生命週期

PO 用 `ade-create-prd` 建立 PRD，確認後用 `ade-prd-to-spec` 寫入產品規格並加上尚未實作標記；RD 在 Forge 中開發，完成後執行 `ade-align-spec` 開 PR 回本 repo 收尾。文件的定位與狀態規則見 `knowledge/prd/README.md` 與 `knowledge/specs/README.md`。

## 編輯慣例

- 建立或修改知識依 `ade-build-knowledge` skill，規則見 `knowledge/process/build-knowledge.md`
- 知識中的引用 `[文字](kb:<分類>/<id>)` 是符號位址：在 `hub/knowledge/<分類>/` 下搜尋 frontmatter 為 `id: <id>` 的檔案即可找到目標
- 文件與 skill 中的 `knowledge/…` 指知識庫根目錄：本 repo 內是 `hub/knowledge/`，Forge 中是 `.claude/ade/knowledge/`
- 名詞以 `knowledge/CONTEXT.md` 為準；PRD 進入「已實作」或「已廢止」後不再修改
- 設計文件或流程時，常駐內容最小化、細節按需載入，放置規則見 `knowledge/process/README.md`
