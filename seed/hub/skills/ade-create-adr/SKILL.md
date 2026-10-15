---
name: ade-create-adr
description: 以 MADR 格式建立或修訂架構決策紀錄（ADR），寫進服務 repo 或 ADE 的 docs/adr/。使用者說「寫 ADR」「記錄這個決策」「這個決定要留紀錄」「新增決策紀錄」「這份 ADR 被取代了」時使用；討論中出現難以反悔、有真實替代方案的決定時，也應主動建議使用。
metadata:
  ade-scope: both
---

# 建立 ADR

規則全部在[撰寫 ADR 的規則](kb:process/03737a)，本 skill 只寫執行步驟，不重述規則。本 skill 目錄附有 MADR 範本 `template.md` 與產生索引的腳本 `adr.js`。

1. **讀規則**：讀[撰寫 ADR 的規則](kb:process/03737a)全文，依「何時撰寫」確認這個決定需要 ADR。不需要時，向使用者說明理由，改把理由寫進 commit message。
2. **決定寫到哪個 repo**：依規則的「寫在哪裡」判斷決策的主題，以下以 `<repo>` 指稱目標 repo。主題無法判斷時，用 `AskUserQuestion` 列出選項並標明推薦，由使用者決定。
   - 服務 repo：`<repo>` 是 `workspaces/<服務>/`。該 repo 已有其他格式或位置的 ADR 時，詢問使用者沿用既有慣例或改用本 skill 的格式；沿用既有慣例時，以下的範本與腳本不適用。
   - ADE：repo 根目錄有 `hub/knowledge/` 時，你在 ADE 內，`<repo>` 是本 repo。只有 `.claude/ade/knowledge/` 時，你在 Forge 中，依 `ade-contribute` 的流程取得工作副本並建立分支，`<repo>` 是工作副本。
3. **建檔**：列出 `<repo>/docs/adr/` 中檔名為四位數開頭的檔案，取最大的編號加 1；沒有任何 ADR 時從 `0001` 開始。將 `.claude/skills/ade-create-adr/template.md` 複製為 `<repo>/docs/adr/NNNN-kebab-case-slug.md`，依規則的「內容」填寫。修訂既有決策時，另依規則的「修訂」修改舊 ADR 的 `status`。
4. **產生索引**：執行 `node .claude/skills/ade-create-adr/adr.js sync <repo>/docs/adr`，修正回報的錯誤，直到指令成功。ADE 的 pre-commit hook 在 commit 時也會執行同一項檢查。
5. **收尾**：服務 repo 依 `ade-commit` commit；在 ADE 內依一般 git 慣例 commit；在 Forge 中撰寫 ADE 的 ADR 時，依 `ade-contribute` 的流程開 PR。
