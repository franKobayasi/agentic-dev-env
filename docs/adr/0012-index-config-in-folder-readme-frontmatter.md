---
status: accepted
date: 2026-10-16
decision-makers: Frank Lin
outcome: "資料夾是否產生 INDEX.md、列哪些欄位，寫在該資料夾 README.md 的 frontmatter `index`；欄位只從 .md 的 frontmatter 取值；INDEX.md commit 進 ADE，由 check 比對"
notes: "index 是框架定義的第三個欄位，選用，沿用 ADR-0009 的判準；seed 不預設任何 INDEX；並行的 PR 可能在 INDEX.md 衝突，重新產生即可解決"
---

# INDEX.md 的設定寫在資料夾入口檔的 frontmatter

## Context and Problem Statement

[ADR-0002](./0002-separate-readme-and-generated-index.md) 決定集合型資料夾的索引寫在由程式產生的 `INDEX.md`，並由 runner 的檢查比對一致性。程式必須知道哪些資料夾要產生 `INDEX.md`，以及每一列列出哪些欄位；這份設定會寫進每個 ADE，日後改變位置，所有 ADE 都必須遷移。問題是：這份設定寫在哪裡，以及 `INDEX.md` 何時產生？

## Decision Drivers

* 設定應與它約束的資料夾放在一起，讀者在資料夾內就能得知索引的欄位。
* Forge 中的人與 agent 應看得到設定，才能理解索引的內容。
* 「`INDEX.md` 不得手寫」不應有例外。
* runner 維持零依賴。

## Considered Options

* 資料夾 `README.md` 的 frontmatter
* `INDEX.md` 的表頭自我描述
* ADE 的 `package.json` 集中設定

## Decision Outcome

Chosen option: "資料夾 `README.md` 的 frontmatter", because 設定與資料夾放在一起，隨入口檔注入 Forge，而且符合 [ADR-0009](./0009-frontmatter-fields-defined-by-reading-mechanism.md) 的判準：`index` 有確定的讀取者，即 runner。

規則如下：

* 資料夾 `README.md` 的 frontmatter 寫 `index: [欄位, …]` 時，該資料夾必須有由程式產生的 `INDEX.md`；沒有 `index` 的資料夾不得有 `INDEX.md`。
* 每一列對應資料夾內的一筆資料，欄位從該筆 `.md` 的 frontmatter 取值；YAML 等其他格式的檔案不支援。
* `INDEX.md` commit 進 ADE。runner 的 `index` 子命令產生它，`check` 重新產生後與現有內容比較，不一致即報錯。
* seed 不預設任何 `INDEX.md`，由團隊在筆數多到搜尋不便時開啟。

另外考慮過在注入 Forge 時才產生 `INDEX.md`、不進版控，以避免衝突；但 ADE 內工作的人與 agent 將沒有索引可讀，因此不採用。

### Consequences

* Good, because 讀者在資料夾的入口檔就能看到索引列出哪些欄位。
* Good, because `INDEX.md` 沒有任何手寫的部分。
* Good, because ADE 與 Forge 都讀得到索引。
* Bad, because 框架定義的欄位從兩個增為三個，`index` 只用於資料夾的 `README.md`。
* Bad, because 同時新增資料的並行 PR 會在 `INDEX.md` 衝突，必須在本地重新產生後再推送。
* Bad, because 以 YAML 記錄的集合，例如服務描述檔，無法產生 `INDEX.md`。

### Confirmation

runner 的檢查確認設了 `index` 的資料夾有一致的 `INDEX.md`，且沒有 `index` 的資料夾沒有 `INDEX.md`；`tests/index.test.js` 涵蓋這些情況。

## Pros and Cons of the Options

### 資料夾 `README.md` 的 frontmatter

* Good, because 設定與資料夾放在一起，並注入 Forge。
* Good, because 沿用既有的 frontmatter 解析。
* Bad, because frontmatter 多一個由框架定義的欄位。

### `INDEX.md` 的表頭自我描述

資料夾內有 `INDEX.md` 就產生，欄位從現有 `INDEX.md` 的表頭讀取。

* Good, because 不需要另外的設定。
* Bad, because 開啟索引時必須手寫一份只有表頭的 `INDEX.md`，「`INDEX.md` 不得手寫」因此有例外。
* Bad, because 表頭必須寫原始的欄位名稱，無法改寫成讀者容易理解的名稱。

### ADE 的 `package.json` 集中設定

在 `package.json` 的 `ade.index` 以資料夾路徑對應欄位清單。

* Good, because 全部設定集中在一處。
* Bad, because 設定離資料夾很遠，搬動或改名資料夾時容易漏改。
* Bad, because `package.json` 不注入 Forge，Forge 中看不到設定。

## More Information

本決策對應 bd 的 issue `ade-jeb.26`（INDEX.md 的產生與一致性檢查），延續 [ADR-0002](./0002-separate-readme-and-generated-index.md) 與 [ADR-0009](./0009-frontmatter-fields-defined-by-reading-mechanism.md)。
