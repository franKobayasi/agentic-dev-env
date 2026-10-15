---
name: ade-add-service
description: 在 ADE 知識庫註冊新服務。使用者說「新增服務」「註冊服務」「把某某服務加進知識庫」時使用。
metadata:
  ade-scope: both
---

# 新增服務

描述檔的規則見[服務清單的入口檔](kb:services/79bcb9)，建立知識的通用規則見[建立知識的規則](kb:process/7caa6d)。本 skill 只寫執行步驟。

1. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，你在 ADE repo 內，直接編輯本 repo 的檔案。只有 `.claude/ade/knowledge/` 時，你在 ADE 中，依 `ade-contribute` 的流程取得工作副本並建立分支；以下路徑都指工作副本內的檔案，不得修改 `.claude/ade/` 的副本。
2. **確認尚未註冊**：在 `knowledge/services/` 搜尋服務名稱與 repo 的 url。已經存在時，包括同一個 repo 的別名，改為更新既有的描述檔。
3. **建檔**：複製 `knowledge/services/_template.yaml` 為 `<服務名稱>.yaml`，逐欄位填寫。資訊不足時詢問使用者，不留空、不猜測。
4. **驗證與收尾**：在 ADE repo 根目錄執行 `node cli.js check`。在 ADE repo 內依一般 git 慣例 commit；在 ADE 中依 `ade-contribute` 的流程開 PR。
