---
name: ade-feedback-upstream
description: 將本 ADE repo 演化出的機制改良（skill 寫法、模板結構、流程設計）以 issue 回饋給上游 create-agentic-dev-env 框架。使用者說「回饋上游」「這個改良應該進框架」「feedback upstream」時使用。僅在 ADE repo 內使用。
---

# 回饋上游

本 repo 由 create-agentic-dev-env 產生後即與上游脫鉤；在日常使用中演化出的好機制，透過**開 issue** 回饋上游，由上游維護者決定是否採納實作，讓所有 ADE repo 受益。

## 界線（最重要）

- 只回饋**機制**：skill 的寫法改良、模板結構、流程設計、runner 行為建議
- **絕不回饋內容**：`knowledge/` 下的公司知識、服務資訊、規格、PRD 全屬機密，一個字都不能出現在上游 issue。送出前逐行檢查 issue 內文，公司名稱、服務名稱、內部詞彙都要抽換成通用範例

## 流程

1. 取得上游 repo 位址：`package.json` 的 `ade.upstream`（為 null 則詢問使用者）。改良來源除了日常觀察，也包括本 repo 標題前綴 `[upstream-candidate]` 的 issues（各流程收尾沉澱時經 `ade-contribute` 開出，如 ade-dev 第 5 關）
2. **查重**：查上游的 open issues（`gh issue list -R <upstream>`），同一改良已有記錄 → 在該 issue 留言補充使用經驗，不重複開
3. 開 issue（`gh issue create -R <upstream>`），內容包含：
   - 這個改良解決什麼問題
   - 在本 ADE repo 實際使用的效果
   - 建議的通用作法（範例一律用佔位內容，不含公司語彙）
4. 告知使用者 issue 連結
