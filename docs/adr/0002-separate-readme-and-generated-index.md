---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "資料夾的介紹寫在手寫的 README.md，索引寫在由程式產生的 INDEX.md；INDEX.md 不得手寫"
notes: "README.md 每個資料夾必備；INDEX.md 選用，用於集合型資料夾；runner 的檢查比對 INDEX.md 與各筆資料"
---

# 入口檔與索引檔分成 README.md 與程式產生的 INDEX.md

## Context and Problem Statement

知識庫的每個資料夾需要一份入口檔，引導讀者理解這部分的知識並選擇下一步。集合型的資料夾，例如一個服務一份描述檔的分類，另外需要讓讀者依屬性快速找到特定的一筆。問題是：介紹與索引是否放在同一份檔案，以及索引由誰維護？

## Decision Drivers

* 第一次進入的讀者需要介紹，已經知道要找什麼的讀者只需要索引；兩者的閱讀時機不同。
* 集合型資料夾的筆數會持續增加，逐筆維護的內容管理成本高。
* 索引列出的屬性，例如每個服務的定位，同時寫在個別的檔案中；手寫的索引是同一份資訊的第二份副本。
* 不分大小寫的檔案系統會把 `index.md` 與 `INDEX.md` 視為同一個檔案。

## Considered Options

* README.md 介紹，INDEX.md 由程式產生
* 入口檔兼任索引：README.md 同時寫介紹與逐筆的索引
* README.md 介紹，INDEX.md 手寫

## Decision Outcome

Chosen option: "README.md 介紹，INDEX.md 由程式產生", because 它把兩種閱讀時機分給兩份檔案，並讓索引與個別檔案的一致性由程式保證，消除手寫的第二份副本。

### Consequences

* Good, because 第一次進入的讀者不必讀完整的索引，查找特定一筆的讀者也不必讀介紹。
* Good, because 索引不會與個別檔案不一致。
* Bad, because 集合型資料夾的每一筆資料都必須有固定的欄位，供程式取值。
* Bad, because 需要產生與檢查索引的程式，以及在 commit 或 CI 時執行它的機制。

### Confirmation

runner 的檢查重新產生 `INDEX.md` 並與現有內容比較，不一致即報錯。本 repo 的 `docs/adr/` 以 `scripts/adr.js` 依同樣的方式運作。

## Pros and Cons of the Options

### README.md 介紹，INDEX.md 由程式產生

* Good, because 兩種閱讀時機各自只讀需要的部分。
* Good, because 一致性由程式保證。
* Bad, because 需要固定欄位與產生索引的程式。

### 入口檔兼任索引：README.md 同時寫介紹與逐筆的索引

* Good, because 只有一份檔案。
* Bad, because 查找特定一筆的讀者必須讀過介紹，第一次進入的讀者必須讀過整份索引。
* Bad, because 由程式產生索引時，手寫的介紹與產生的內容混在同一份檔案，需要錨點區隔，容易被誤改。

### README.md 介紹，INDEX.md 手寫

* Good, because 不需要額外的程式。
* Bad, because 同一份資訊寫在兩處，任何一邊修改都必須同步另一邊，容易過期。

## More Information

本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.12`。
