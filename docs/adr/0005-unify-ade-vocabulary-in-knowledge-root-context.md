---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "ADE 的詞彙表統一為一份，位於知識庫根目錄的 `CONTEXT.md`"
notes: "seed 的 `repo/CONTEXT.md` 與 `specs/GLOSSARY.md` 收整進 `hub/knowledge/CONTEXT.md`；根目錄的檔案不屬於任何分類，不以符號引用"
---

# ADE 的詞彙表統一為知識庫根目錄的 CONTEXT.md

## Context and Problem Statement

詞彙表定義一個領域內的專有名詞，讓所有參與者對名詞的理解一致；用詞一致也是搜尋的前提。seed 建立的 ADE repo 有兩份詞彙表：ADE repo 根目錄的 `CONTEXT.md` 定義開發流程的名詞，知識庫的 `specs/GLOSSARY.md` 定義產品領域的名詞。同一個概念有兩個檔名；而且 ADE repo 根目錄的檔案不會注入 ADE，在 ADE 中使用開發流程名詞的 skill 讀不到它。問題是：ADE 的詞彙表應以什麼檔名、放在什麼位置？

## Decision Drivers

* 詞彙表的主要讀者是 ADE 中讀 spec、開發服務的 agent，詞彙表必須注入 ADE。
* 同一個概念應只有一個名稱。
* 本 repo 與既有的 skill 以 `CONTEXT.md` 作為詞彙表的檔名。
* runner 依賴的 ADE repo 結構（契約 A）不應為此變更。

## Considered Options

* 統一為知識庫根目錄的 `CONTEXT.md`
* 統一為 `GLOSSARY.md`
* 統一為 ADE repo 根目錄的 `CONTEXT.md`，由 runner 額外注入 ADE
* 統一為 ADE repo 根目錄的 `CONTEXT.md`，不注入 ADE

## Decision Outcome

Chosen option: "統一為知識庫根目錄的 `CONTEXT.md`", because 它讓詞彙表隨知識庫注入 ADE，不需要變更 runner，並沿用既有的檔名慣例。

知識庫根目錄的檔案不屬於任何分類，因此詞彙表不以符號位址引用，也不需要 id，由知識庫根目錄的 `README.md` 說明它的存在。

### Consequences

* Good, because ADE 中的 agent 讀得到詞彙表。
* Good, because 一個 ADE 只有一份詞彙表，同一個概念只有一個檔名。
* Good, because runner 注入整個知識庫，不需要額外的注入規則。
* Bad, because 依賴 repo 根目錄 `CONTEXT.md` 的 skill 在 ADE repo 內找不到它。
* Bad, because 「context」在本專案也指 agent 的 context，檔名在字面上可能與 Context 管理混淆。
* Bad, because 開發流程與產品領域的名詞放在同一份檔案，篇幅會隨團隊的領域擴大。

### Confirmation

以 review 確認：seed 的知識庫根目錄提供 `CONTEXT.md`，且 seed 內沒有其他詞彙表檔案。

## Pros and Cons of the Options

### 統一為知識庫根目錄的 `CONTEXT.md`

* Good, because 隨知識庫注入 ADE。
* Good, because 沿用既有的檔名慣例。
* Bad, because 不在 ADE repo 根目錄，不符合 repo 根目錄放 `CONTEXT.md` 的慣例。

### 統一為 `GLOSSARY.md`

* Good, because 檔名直接表明用途，不會與 Context 管理混淆。
* Bad, because 本 repo 與 ADE repo 根目錄的 `CONTEXT.md` 都必須改名，依賴 `CONTEXT.md` 的 skill 找不到它。

### 統一為 ADE repo 根目錄的 `CONTEXT.md`，由 runner 額外注入 ADE

* Good, because 符合 repo 根目錄放 `CONTEXT.md` 的慣例，ADE 也讀得到。
* Bad, because runner 必須多注入一個檔案，屬於契約 A 的變更，並須處理舊的 ADE repo。

### 統一為 ADE repo 根目錄的 `CONTEXT.md`，不注入 ADE

* Good, because 不需要任何機制。
* Bad, because ADE 中的 agent 讀不到詞彙表，詞彙表失去統一用詞的作用。

## More Information

本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.15`（術語表在搜尋與命名中的角色）。
