---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "知識庫內的引用改用符號位址 `kb:<分類>/<名稱>`，在分類內遞迴解析，不用路徑連結"
notes: "名稱在分類內唯一；改名時同一次變更改完所有引用，封存的文件也機械改寫；尚未實作標記改用符號並移除 emoji"
---

# 知識庫內的引用改用符號位址

## Context and Problem Statement

知識庫的文件以相對路徑連結或 `knowledge/…` 路徑互相引用。知識單位依份量是一個檔案，或一個帶有入口檔的資料夾，並會隨內容增加而延伸：檔案長成資料夾、資料夾多分一層。每一次這類調整都改變路徑，指向它的引用隨之失效。問題是：知識之間的引用應以什麼形式記錄，才能讓結構調整不破壞引用？

## Decision Drivers

* 知識單位會延伸，巢狀是預期的形態；層數與項目數不設上限，見 [ADR-0001](./0001-no-depth-or-item-limits-in-knowledge-base.md)。
* 結構調整不應迫使修改與調整無關的文件，否則會提高管理成本。
* runner 的檢查必須能機械判斷引用是否有效。
* 規則必須一體適用：換一套完全不同的分類，規則仍然成立；runner 不得依賴 ADE repo 自行設計的分類或狀態。

## Considered Options

* 符號位址 `kb:<分類>/<名稱>`，在分類內遞迴解析
* 相對路徑連結，由 runner 檢查連結是否失效
* 符號位址包含完整路徑，例如 `kb:specs/payment/checkout`

## Decision Outcome

Chosen option: "符號位址 `kb:<分類>/<名稱>`，在分類內遞迴解析", because 它是唯一不受單位延伸與分層影響的方案：符號只記錄分類與名稱，單位在分類內的位置改變時，引用不需要修改。

符號的規則如下：

* 前綴為 `kb:`，與描述位置用的 `knowledge/…` 寫法在外觀上明顯不同，避免兩者混用。
* 名稱不含副檔名：檔案單位取檔名去掉 `.md`，資料夾單位取資料夾名。單位由檔案長成資料夾時，符號不變。
* 符號一律放在 code span 內；runner 只辨識 code span 中以 `kb:` 開頭的字串。
* 符號只指向知識單位，不支援指向章節。
* 名稱在整個分類內必須唯一。
* 改名時，同一次變更必須改完所有引用，不設別名。
* 封存的文件，例如已實作或已廢止的 PRD，允許機械改寫其中的符號。符號是位址，不屬於封存保護的內容。
* spec 的尚未實作標記改為 ``> 尚未實作（PRD: `kb:prd/<檔名>`）``，並移除 emoji。

### Consequences

* Good, because 單位延伸或分層時，引用不需要修改。
* Good, because runner 可以檢查每個符號是否能解析到唯一的單位。
* Good, because 改名時可以用 grep 找出所有引用並機械替換。
* Bad, because 在 GitHub 上無法直接點擊符號跳轉；即時跳轉所需的符號索引可由程式產生，研究確認可行，延後實作。
* Bad, because 名稱必須在整個分類內唯一，分類越大，命名的限制越多。
* Bad, because 封存的文件會在 git 歷史中留下改名造成的 diff。
* Bad, because 尚未實作標記是機器契約，修改格式時必須同步修改加上、移除與略過標記的 skill，以及寫作指南的 emoji 例外。

### Confirmation

runner 的檢查辨識 code span 中所有以 `kb:` 開頭的字串，解析失敗或在分類內對應到多個單位時報錯。

## Pros and Cons of the Options

### 符號位址 `kb:<分類>/<名稱>`，在分類內遞迴解析

* Good, because 解析規則不依賴層數，與單位的延伸方式無關。
* Good, because 可以機械檢查。
* Bad, because 人在 GitHub 上無法直接點擊。
* Bad, because 名稱必須在分類內唯一。

### 相對路徑連結，由 runner 檢查連結是否失效

* Good, because 人在 GitHub 上可以直接點擊。
* Good, because 不需要新的語法。
* Bad, because 每次單位延伸或分層，所有指向它的連結都必須修改；檢查只能發現失效，無法避免修改。
* Bad, because 同一份單位從不同位置引用時，相對路徑的寫法各不相同，無法以 grep 一次找出。

### 符號位址包含完整路徑，例如 `kb:specs/payment/checkout`

* Good, because 不要求名稱在分類內唯一。
* Good, because 從符號即可看出單位的位置。
* Bad, because 本質上仍是路徑，分層時引用仍然失效。

## More Information

本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.7`（引用改用符號位址）、`ade-jeb.8`（在分類內遞迴解析）與 `ade-jeb.13`（語法與規則細節）。
