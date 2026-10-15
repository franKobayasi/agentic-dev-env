---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "知識檔案建立時在 frontmatter 產生不可變的隨機 id，引用寫成 `[文字敘述](kb:<分類>/<id>)`"
notes: "id 為 6 位小寫十六進位、在分類內唯一；檔名不再參與定址；不可更改只靠引用檢查保證；取代 ADR-0003"
---

# 知識庫內的引用以不可變的隨機 id 定址

## Context and Problem Statement

[ADR-0003](./0003-reference-knowledge-by-symbol-address.md) 以名稱定址：符號 `kb:<分類>/<名稱>` 的名稱取自檔名，名稱在分類內必須唯一。套用到既有的知識時，單位內拆出的檔案，例如一個流程資料夾內的 `state.md`、`review.md`，使用通用的檔名，同一分類內再出現另一個流程時就會衝突。此外，改名時必須在同一次變更改完所有引用，連封存的文件也要機械改寫。問題是：知識的位址是否應與檔名脫鉤？

## Decision Drivers

* 檔名應服務讀者對檔案用途的判斷，而不是承擔全域唯一的限制。
* 位址應在改名、搬移與單位延伸時保持不變，避免修改與變更無關的文件，包括封存的文件。
* runner 的檢查必須能機械判斷引用是否有效。
* 引用方在第一次引用時必然知道目標的內容，可以用連結文字說明目標。

## Considered Options

* 不可變的隨機 id，引用以連結文字說明目標
* 不可變的可讀 id，例如 `ade-dev-state`
* 以名稱定址，即 ADR-0003 的做法

## Decision Outcome

Chosen option: "不可變的隨機 id，引用以連結文字說明目標", because 它讓位址與檔名完全脫鉤，改名、搬移與單位延伸都不影響引用；隨機值不會隨內容演變而產生誤導，可讀性由連結文字提供。

規則如下：

* 每份手寫的知識檔案在建立時產生 id，寫在 frontmatter 的 `id` 欄位；YAML 檔寫在頂層的 `id` 欄位。由程式產生的 `INDEX.md` 與 `_` 開頭的範本不需要 id。
* id 為 6 位小寫十六進位，以指令產生，不由 agent 自行編寫。
* id 在分類內必須唯一，建立後不得更改。單位由檔案長成資料夾時，id 移到資料夾的 `README.md`。
* 引用寫成 markdown 連結 `[文字敘述](kb:<分類>/<id>)`，分類是知識庫根目錄下的第一層資料夾。
* 檔名不參與定址，不需要在分類內唯一。

### Consequences

* Good, because 改名、搬移與單位延伸都不需要修改引用，也不需要改寫封存的文件。
* Good, because 檔名可以依用途自由命名，單位內的部分可以使用通用名稱。
* Good, because 連結文字由引用方撰寫，描述的是引用方需要的資訊。
* Bad, because 每份知識檔案都必須有 frontmatter，建立知識的 skill 必須產生 id。
* Bad, because 只看符號無法得知目標，必須依賴連結文字；連結文字可能隨目標的內容演變而過時。
* Bad, because 不可更改沒有專屬的檢查：改 id 並同步改完 ADE repo 內所有引用時，檢查無法發現；ADE repo 以外的引用只能由 skill 的規則約束。
* Bad, because 單位跨分類搬移時，符號中的分類改變，引用失效。

### Confirmation

runner 的檢查辨識所有 `](kb:` 連結，解析失敗或在分類內對應到多個檔案時報錯，並檢查需要 id 的檔案是否都有 id。

## Pros and Cons of the Options

### 不可變的隨機 id，引用以連結文字說明目標

* Good, because 位址與檔名、內容完全脫鉤。
* Good, because 隨機值永遠不會誤導讀者。
* Bad, because 符號本身不可讀，可讀性依賴連結文字。

### 不可變的可讀 id，例如 `ade-dev-state`

* Good, because 符號本身可讀，不依賴連結文字。
* Bad, because 內容演變後，id 的字面意思可能與內容脫節，但仍不得更改，持續誤導讀者。
* Bad, because 命名時仍須避開分類內的所有 id，與以名稱定址有相同的命名限制。

### 以名稱定址，即 ADR-0003 的做法

* Good, because 不需要 frontmatter，符號與檔名一致。
* Bad, because 檔名必須在分類內唯一，通用檔名必須改名。
* Bad, because 改名時必須改完所有引用，包括封存的文件。

## More Information

本決策取代 [ADR-0003](./0003-reference-knowledge-by-symbol-address.md)，在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.10`（分類內的命名規則）。ADR-0003 中前綴 `kb:`、分類的範圍、不寫中間層與尚未實作標記移除 emoji 的決定仍然沿用。
