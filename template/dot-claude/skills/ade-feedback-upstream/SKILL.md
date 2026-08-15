---
name: ade-feedback-upstream
description: 將本 ADE repo 演化出的機制改良（skill 寫法、模板結構、流程設計）回饋給上游 create-agentic-dev-env 框架。使用者說「回饋上游」「這個改良應該進框架」「feedback upstream」時使用。
---

# 回饋上游

本 repo 由 create-agentic-dev-env 產生後即與上游脫鉤；在日常使用中演化出的好機制，透過 PR 回饋上游，讓所有 ADE repo 受益。

## 界線（最重要）

- 只回饋**機制**：skill 的寫法改良、模板結構、流程設計、runner 行為建議
- **絕不回饋內容**：`knowledge/` 下的公司知識、服務資訊、規格、PRD 全屬機密，一個字都不能出現在上游 PR。送出前逐行檢查 diff，公司名稱、服務名稱、內部詞彙都要抽換成通用範例

## 流程

1. 取得上游 repo 位址：`package.json` 的 `ade.upstream`（為 null 則詢問使用者）
2. Clone 上游、建立分支，找到對應檔案（機制多在 `template/` 下）
3. 把改良以通用形式套上：去除公司語彙，範例改用佔位內容
4. 開 PR，說明：這個改良解決什麼問題、在本 ADE repo 實際使用的效果如何
