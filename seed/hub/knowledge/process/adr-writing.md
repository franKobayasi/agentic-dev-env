---
id: 03737a
description: 何時撰寫 ADR、ADR 寫在哪個 repo、內容與狀態的規則，以及決策改變時如何修訂。
---

# 撰寫 ADR

本文件規範團隊的架構決策紀錄（ADR，Architecture Decision Record）：何時撰寫、寫在哪裡、寫什麼，以及決策改變時如何修訂。ADR 記錄一個決策當時的限制、考慮過的方案與選擇的理由；現況不寫在 ADR，而寫在對應的知識與程式碼中。格式採用 [MADR](https://adr.github.io/madr/)，範本與產生索引的腳本由 `ade-create-adr` skill 提供。

## 何時撰寫

下列三個條件同時成立時，才撰寫 ADR：

1. 難以反悔：日後改變這個決定的成本高。
2. 不顯而易見：之後的維護者只看程式碼或文件，很可能不明白為什麼這樣做。
3. 有真實的取捨：當時有具體的替代方案，並且刻意選擇了其中一個。

任一條件不成立時，決定的理由寫在 commit message，不撰寫 ADR。

## 寫在哪裡

ADR 跟著它約束的對象存放。下表列出決策的主題與 ADR 的位置：

| 決策的主題 | ADR 的位置 | 例子 |
|---|---|---|
| 某個服務的架構或實作 | 該服務 repo 的 `docs/adr/` | 某個服務改用 event sourcing |
| ADE 的知識體系、skill 或團隊流程 | ADE 的 `docs/adr/` | 把一個分類拆成兩個 |

ADE 的 `docs/adr/` 不注入 Forge：ADR 只在改變對應的設計時才需要閱讀，現況已寫在注入的知識中。在 Forge 中撰寫 ADE 的 ADR 時，必須在 ADE 的工作副本中撰寫並送回 ADE，不得寫在 Forge 中。服務 repo 已有自己的 ADR 格式或位置時，應沿用該 repo 的慣例。

## 檔名與索引

檔名格式為 `NNNN-kebab-case-slug.md`，`NNNN` 是四位數流水號，在同一個 `docs/adr/` 內從 `0001` 起連續編號。`docs/adr/INDEX.md` 是由程式產生的索引，列出全部 ADR，不得手動編輯。

## 內容

撰寫內容時，遵守下列規則：

- 內文使用繁體中文，但範本的英文段落標題必須維持英文，例如 `## Context and Problem Statement`、`## Considered Options`，以相容於 MADR 的工具。
- frontmatter 的 `status`、`date` 與 `outcome` 必須填寫，`notes` 應填寫。`outcome` 與 `notes` 各寫一行，會原樣出現在 `INDEX.md`。
- `decision-makers`、`consulted` 與 `informed` 只在有明確的人選時填寫，不得推測人名；沒有對象時刪除該欄位。
- `Considered Options` 與 `Pros and Cons of the Options` 必須包含採用的方案，以及至少一個被拒絕的方案。
- 名詞依知識庫根目錄的 `CONTEXT.md`，不另行定義。

## 狀態

ADR 的 `status` 欄位使用下表的值：

| status | 意義 |
|---|---|
| `proposed` | 草擬中，尚未定案 |
| `accepted` | 已定案並採用，是目前有效的決策 |
| `rejected` | 評估後不採用；保留紀錄，避免同一個方向被重新提案 |
| `deprecated` | 曾經有效，已不再採用，且沒有單一的後繼 ADR |
| `superseded by ADR-NNNN` | 已被 `NNNN` 這份 ADR 取代 |

## 修訂

ADR 定案後不得改寫內容，也不得刪除或改名。決策改變時，依下列步驟修訂：

1. 新增一份 ADR，記錄新的決策。
2. 將舊 ADR 的 `status` 改為 `superseded by ADR-NNNN`，`NNNN` 是新 ADR 的編號。
3. 在新 ADR 的 `## More Information` 段落，以相對路徑連結被取代的舊 ADR。

舊 ADR 在索引中顯示 `superseded by ADR-NNNN` 時，代表修訂完成。
