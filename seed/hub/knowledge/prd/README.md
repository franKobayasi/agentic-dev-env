---
id: c66c02
description: 一次開發需求一份的需求文件，定案後成為產品規格與開發的依據，實作完成或廢止後封存。
---

# PRD

## 規則

PRD 遵守下列規則：

- 一次開發需求一份 PRD，檔名為 `YYYY-MM-DD-<slug>.md`，日期是建立當天，slug 使用 kebab-case；依 `_template.md` 撰寫，撰寫方式見[撰寫 PRD](kb:process/3680c7)。
- PRD 是歷史文件：狀態為「已實作」或「已廢止」後即封存，不再修改。產品功能目前的樣子以[產品規格](kb:specs/f2e5d1)為準。
- 產品規格與其他知識以 PRD 的 id 引用它，因此 PRD 不得刪除。

除了 `id` 與 `description`，PRD 的 frontmatter 另有下表的欄位：

| 欄位 | 內容 |
|---|---|
| `date` | 建立日期，格式為 `YYYY-MM-DD` |
| `proposer` | 提出者 |
| `status` | 狀態，值為下一節的四種之一 |
| `deprecation_reason` | 廢止的原因，或取代它的 PRD 的符號位址；只在狀態為「已廢止」時填寫 |

## 生命週期

PRD 的狀態依下表推進：

| 狀態 | 意義 | 何時設定 |
|---|---|---|
| 草稿 | 撰寫中 | 建立時 |
| 已確認 | PO 定案，可以寫入產品規格 | PO 確認後由 PO 設定 |
| 已實作 | 開發完成，產品規格中的尚未實作標記已移除 | `ade-align-spec` 收尾時 |
| 已廢止 | 實作前取消，或被另一份 PRD 整併取代 | 從「草稿」或「已確認」改設 |

從「已確認」改為「已廢止」時，必須在同一個 PR 撤回已寫入產品規格的內容：刪除指向本 PRD 的尚未實作標記；該區塊沒有其他 PRD 的標記時，內容一併還原成寫入前的樣子，動過哪些檔案見本 PRD 的「產品規格異動摘要」。區塊上還有其他 PRD 的標記時，只撤回本 PRD 寫入的部分。

## 導覽

本資料夾是集合型，依需要選用下列方式：

- 新增 PRD：使用 `ade-create-prd`，或複製 `_template.md` 後依[撰寫 PRD](kb:process/3680c7)填寫。
- 找特定 PRD：以檔名的日期與 slug 搜尋，或搜尋 frontmatter 的 `description` 與 `status`。
- PRD 多到以搜尋查找不便時：依[建立知識的規則](kb:process/7caa6d)的「索引」在本檔加上 `index`。
