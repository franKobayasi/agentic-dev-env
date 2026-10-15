---
name: adr-madr
description: 以 MADR 格式建立或修訂架構決策紀錄（ADR）。使用者說「寫 ADR」「記錄這個決策」「這個決定要留紀錄」「新增決策紀錄」「這份 ADR 被取代了」時使用；討論中出現難以反悔、有真實替代方案的決定時，也應主動建議使用。
---

# 撰寫 ADR

本 skill 引導以 [MADR](https://adr.github.io/madr/) 格式建立與修訂 ADR。ADR 存放在 `docs/adr/`，範本是 `docs/adr/_template.md`，目錄的入口檔 `docs/adr/README.md` 說明各個狀態的意義。

## 何時撰寫

下列三個條件同時成立時，才撰寫 ADR：

1. 難以反悔：日後改變這個決定的成本高。
2. 不顯而易見：之後的維護者只看程式碼或文件，很可能不明白為什麼這樣做。
3. 有真實的取捨：當時有具體的替代方案，並且刻意選擇了其中一個。

任一條件不成立時，決定的理由應寫在 commit message，不撰寫 ADR。

## 建立

依下列步驟建立新的 ADR：

1. 列出 `docs/adr/` 中檔名為四位數開頭的檔案，取最大的編號加 1 作為新編號。沒有任何 ADR 時從 `0001` 開始。
2. 複製 `docs/adr/_template.md` 為 `docs/adr/NNNN-kebab-case-slug.md`。
3. 依下一節的規則填寫內容。
4. commit。pre-commit hook 會檢查檔名、編號與欄位，並重新產生 `docs/adr/README.md` 的索引表。

hook 檢查通過、`docs/adr/README.md` 的索引表出現新的 ADR 時，代表建立完成。

## 內容規則

撰寫內容時，遵守下列規則：

- 內文使用繁體中文，但範本的英文段落標題必須維持英文，例如 `## Context and Problem Statement`、`## Considered Options`，以相容於 MADR 的工具。
- frontmatter 的 `status`、`date` 與 `outcome` 必須填寫，`notes` 應填寫。`outcome` 與 `notes` 各寫一行，會原樣出現在索引表。
- `decision-makers`、`consulted` 與 `informed` 只在有明確的人選時填寫，不得推測人名；沒有對象時刪除該欄位。
- `Considered Options` 與 `Pros and Cons of the Options` 必須包含採用的方案，以及至少一個被拒絕的方案。
- 名詞依 repo 根目錄的 `CONTEXT.md`，不另行定義。
- 不得手動編輯 `docs/adr/README.md` 的索引表。

## 修訂

ADR 定案後不得改寫內容，也不得刪除或改名；hook 會擋下刪除與改名。決策改變時，依下列步驟修訂：

1. 依「建立」一節新增一份 ADR，記錄新的決策。
2. 將舊 ADR 的 `status` 改為 `superseded by ADR-NNNN`，`NNNN` 是新 ADR 的編號。
3. 在新 ADR 的 `## More Information` 段落，以相對路徑連結被取代的舊 ADR。

舊 ADR 的索引列顯示 `superseded by ADR-NNNN` 時，代表修訂完成。
