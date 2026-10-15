---
name: ade-create-prd
description: 依統一範本建立標準化 PRD，寫入 knowledge/prd/。想法還模糊就先用 Discovery 問成形，已想清楚就直接填。使用者說「建 PRD」「寫需求文件」「幫我寫一份 PRD」「把這個想法變成 PRD」「新的開發需求」「這個需求整理一下」「create PRD」時使用。bug fix／refactor／文字調整不用開 PRD。
metadata:
  ade-scope: both
---

# 建立 PRD

PRD 的規則與生命週期見[PRD 的入口檔](kb:prd/c66c02)，要回答的問題、各區塊的內容與盲點見[撰寫 PRD](kb:process/3680c7)，欄位以 `knowledge/prd/_template.md` 為準。本 skill 只寫執行步驟，不重述規則。

0. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，你在 ADE repo 內，直接編輯本 repo 的檔案。只有 `.claude/ade/knowledge/` 時，你在 ADE 中，依 `ade-contribute` 的流程取得工作副本並建立分支；以下的 `knowledge/…` 都指工作副本內的檔案，不得修改 `.claude/ade/` 的副本。
1. **讀規則**：讀上述兩份知識。
2. **Discovery**：依「要回答的問題」，用 `AskUserQuestion` 分批詢問還沒有答案的問題，一批 2–3 題，等回答後再追問。使用者已經回答的問題直接跳過，一次答完時整段略過。
3. **對照既有知識**：讀涉及的服務描述檔、相關的產品規格，以及 `knowledge/prd/` 中 `status` 為「草稿」或「已確認」的 PRD，找出與現有規格的衝突。與進行中的 PRD 重疊時，當場請 PO 決定合併或劃清界線。
4. **建檔**：複製 `knowledge/prd/_template.md` 為 `knowledge/prd/YYYY-MM-DD-<slug>.md`，以 `.claude/skills/ade-build-knowledge/new-id.sh knowledge/prd` 產生 id，`status` 設為「草稿」，依「各區塊的內容」填寫。「產品規格異動摘要」留空。
5. **檢查盲點**：依「盲點」逐項詢問 PO，直到每一項都有答案或明確不在範圍內，並依規則回填。
6. **驗證**：執行 `bash .claude/skills/ade-create-prd/validate-prd.sh <PRD 檔的路徑>` 與 ADE repo 根目錄的 `node cli.js check`，有缺漏就補完再執行。通過後不自動改狀態，`status` 留在「草稿」，由 PO 確認後才改為「已確認」。
7. **收尾**：在 ADE repo 內依一般 git 慣例 commit；在 ADE 中依 `ade-contribute` 的流程開 PR。提醒下一步執行 `ade-prd-to-spec`。
8. **回報風險**：向使用者列出本次無法自行驗證、或沒有把握的假設，例如只憑服務描述檔推定的服務相依、沒讀實作就寫下的現況行為。待 PO 決定的事已在「開放問題」，不重複列出；沒有風險時明確說明「本 PRD 無已知的未確定風險」。
