---
name: ade-build-knowledge
description: 在 ADE 知識庫建立或修改一份知識：查重、決定位置、產生 id、撰寫並通過檢查。使用者說「新增知識」「寫進知識庫」「把這個整理成知識」「記到 ADE」「調整這份知識」時使用。PRD、服務描述檔與流程慣例改用 ade-create-prd、ade-add-service、ade-add-process。
metadata:
  ade-scope: both
---

# 建立知識

規則全部在[建立知識的規則](kb:process/7caa6d)，本 skill 只寫執行步驟，不重述規則。

0. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，你在 ADE repo 內，直接編輯本 repo 的檔案。只有 `.claude/ade/knowledge/` 時，你在 ADE 中，依 `ade-contribute` 的流程取得工作副本並建立分支；以下所有路徑都指工作副本內的檔案，不得修改 `.claude/ade/` 的副本。
1. **讀規則**：讀[建立知識的規則](kb:process/7caa6d)全文。
2. **查重**：依規則的「查找既有知識」搜尋。已有同一份知識時改為修改它；無法判斷是否相同時，向使用者列出候選檔案並詢問。
3. **判斷歸屬**：依規則的「收錄」判斷內容是否該收錄、是否已有權威來源、哪些部分屬於 skill。不該收錄時，向使用者說明理由後停止。
4. **決定位置**：依規則的「放置」讀根目錄與候選分類的 `README.md`。有多個合理的位置時，用 `AskUserQuestion` 列出選項並標明推薦，由使用者決定。
5. **建檔**：分類有 `_` 開頭的範本時，從範本複製。執行本 skill 目錄的 `new-id.sh hub/knowledge/<分類>` 取得分類內未使用的 id，依規則寫 frontmatter 與內文。
6. **同步**：更新上層入口檔的導覽；用到詞彙表沒有的專有名詞時，先加入詞彙表。
7. **驗證**：在 ADE repo 根目錄執行 `node cli.js check`，修正本次修改的檔案中的錯誤。其他既有檔案的錯誤只向使用者回報，不順手修改。
8. **收尾**：在 ADE repo 內依一般 git 慣例 commit；在 ADE 中依 `ade-contribute` 的流程開 PR。
