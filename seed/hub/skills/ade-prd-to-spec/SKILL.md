---
name: ade-prd-to-spec
description: 將已確認的 PRD 寫入產品規格，並在尚未開發的區塊加上尚未實作標記，供 PO 確認 PRD 與產品規格一致。使用者說「PRD 轉 spec」「更新規格」「把 PRD 落到 spec」時使用。
metadata:
  ade-scope: both
---

# PRD 寫入產品規格

產品規格的規則與尚未實作標記的格式見[產品規格的入口檔](kb:specs/f2e5d1)，PRD 的生命週期見[PRD 的入口檔](kb:prd/c66c02)。本 skill 只寫執行步驟。

前提：PRD 的 `status` 必須是「已確認」，否則請 PO 先走完 `ade-create-prd`。

0. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，你在 ADE 內，直接編輯本 repo 的檔案。只有 `.claude/ade/knowledge/` 時，你在 Forge 中，依 `ade-contribute` 的流程取得工作副本並建立分支；以下的 `knowledge/…` 都指工作副本內的檔案，不得修改 `.claude/ade/` 的副本。
1. 讀目標 PRD 與 `knowledge/specs/` 的現況，找出受影響的產品規格；沒有對應的檔案時，依[建立知識的規則](kb:process/7caa6d)新建。
2. 將 PRD 的需求寫入產品規格，描述功能完成後應有的樣子，並在每個新增或變更的行為區塊上方加上尚未實作標記：格式照入口檔逐字撰寫，連結文字是 PRD 的標題，符號位址是 PRD 的 id。同一區塊已有其他 PRD 的標記時，堆疊一行新標記，不合併、不修改其他 PRD 的標記。
3. 只修改這份 PRD 涉及的內容，產品規格的其他部分一字不改。
4. 回填 PRD 的「產品規格異動摘要」：動了哪些檔案、各自的異動重點。
5. 帶 PO 逐項確認產品規格與預期相符，不符就修改到一致為止。
6. 在 ADE 根目錄執行 `node cli.js check`，確認標記的符號位址都能解析。
7. PO 確認後收尾：在 ADE 內依一般 git 慣例 commit；在 Forge 中依 `ade-contribute` 的流程開 PR。

完成後提醒：RD 開發完成後，在 Forge 中執行 `ade-align-spec` 收尾。
