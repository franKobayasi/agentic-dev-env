---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "框架只定義生成器的機制必須讀取的 frontmatter 欄位，即必填的 `id` 與 `description`；其他欄位由 ADE repo 依文件類型自行加入"
notes: "分類、標題與 `status` 不由框架定義；會被程式或 skill 讀取的屬性應寫在 frontmatter；資料夾 README.md 開頭的一句話改由 `description` 擔任"
---

# frontmatter 的欄位由讀取它的機制決定

## Context and Problem Statement

知識檔案以 frontmatter 的 `id` 定址，見 [ADR-0004](./0004-address-knowledge-by-immutable-random-id.md)。除了 `id`，frontmatter 還可以記錄摘要、分類、標題與狀態等屬性。文件類型與生命週期由 ADE repo 定義，框架若定義狀態這類欄位，等於替 ADE repo 設計文件類型；框架若不定義任何欄位，runner 與 skill 又無從得知該讀哪個欄位。問題是：哪些欄位由框架定義？

## Decision Drivers

* 每個欄位都是需要維護的內容，沒有讀取者的欄位只增加管理成本。
* 文件類型與生命週期由 ADE repo 定義，框架不得預設它們的欄位。
* 搜尋命中多份檔案時，agent 需要低成本地判斷每份檔案的內容。
* 同一份資訊不應有兩份副本，例如分類與資料夾位置、標題與一級標題。

## Considered Options

* 只定義生成器的機制必須讀取的欄位
* 定義一組完整的通用欄位

## Decision Outcome

Chosen option: "只定義生成器的機制必須讀取的欄位", because 每個由框架定義的欄位都有確定的讀取者，不替 ADE repo 設計文件類型，也不產生資料夾位置與標題的副本。

規則如下：

* 框架只定義生成器的機制，即 runner 的檢查或生成器提供的 skill，必須讀取的欄位。
* `id` 必填，由 runner 解析符號位址。
* `description` 必填，範圍與 `id` 相同；內容是一句話說明這份知識是什麼。搜尋命中多份檔案時，查找知識的 skill 先讀 `description` 篩選；`INDEX.md` 可以從它取值。資料夾 `README.md` 開頭說明這一層收錄什麼的一句話，改由 `description` 擔任，內文不重述。
* 分類、標題與 `status` 不由框架定義。
* ADE repo 依文件類型自行加入欄位；會被程式或 skill 讀取的屬性應寫在 frontmatter，內文不重述。

### Consequences

* Good, because agent 可以只讀 `description` 判斷多份檔案的內容，不必逐份讀全文。
* Good, because 框架定義的欄位都有讀取者，不產生無人維護的欄位。
* Good, because 文件類型的欄位完全由 ADE repo 決定。
* Bad, because 每份需要 id 的檔案都必須撰寫並維護 `description`，內容演變時可能過期。
* Bad, because 跨文件類型沒有統一的狀態欄位，無法以同一種方式查詢所有文件的狀態。

### Confirmation

runner 的檢查確認需要 id 的檔案都有 `id` 與 `description`。

## Pros and Cons of the Options

### 只定義生成器的機制必須讀取的欄位

* Good, because 欄位最少，每個欄位都有用途。
* Bad, because ADE repo 之間的欄位名稱可能不一致。

### 定義一組完整的通用欄位

例如 `id`、`title`、`description`、`status`、`tags`、`updated`，由 ADE repo 依需要填寫。

* Good, because 各 ADE repo 與各文件類型的欄位名稱一致。
* Bad, because `title` 與一級標題重複，`updated` 與 git 的紀錄重複。
* Bad, because 各文件類型的狀態值不同，`status` 無法統一語意。
* Bad, because 大部分欄位沒有任何機制讀取，只增加管理成本。

`description` 另外考慮過選填與不定義、以內文第一段代替兩種做法。選填時搜尋無法依賴它；以內文第一段代替時，長度與寫法不固定，無法以 grep 一次取出，兩者都讓 agent 仍須逐份讀全文。

## More Information

本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.25`（知識檔案 frontmatter 的欄位定義）。
