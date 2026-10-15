---
status: accepted
date: 2026-10-16
decision-makers: Frank Lin
outcome: "seed 移除開發流程的 skill 與知識（ade-dev、ade-dev-auto、process/ade-dev-workflow/），並刪除其證據盤點 docs/research/；Generator 不提供開發流程，由各 ADE 依需求自行建立或採用社群的 skill"
notes: "既存 ADE 的副本不受影響；ade-ship、ade-commit 等交付與慣例的 skill 保留；研究檔可從 v1.6.0 的 tag 取回"
---

# seed 不提供開發流程的 skill 與知識

## Context and Problem Statement

seed 提供一套開發流程：`ade-dev` 定義六關的判準制開發，`ade-dev-auto` 批次串接多個任務，規則寫在知識庫的 `process/ade-dev-workflow/`，證據盤點放在 Generator 的 `docs/research/ade-dev/`。開發流程目前已有大量社群開源的 skill，且演進的速度快；seed 這一版的流程已經過時。seed 在 create 時複製進每個新的 ADE，過時的流程會隨之進入每個新建的 ADE。問題是：Generator 是否應該提供開發流程的 skill 與知識？

## Decision Drivers

* seed 只複製一次，過時的內容會成為每個新 ADE 的初始內容，並由各 ADE 各自承擔修改的成本。
* 開發流程有大量社群開源的 skill，演進速度快於 Generator 的發版。
* 各團隊的開發流程不同，適合由各 ADE 依自己的需求決定。
* Generator 應專注在知識體系的機制：知識的形式、ADE 與 Forge 之間的流向，以及 PRD 與產品規格的生命週期。

## Considered Options

* 從 seed 移除開發流程的 skill 與知識，Generator 不再提供
* 保留並持續更新 seed 的開發流程
* 保留為不注入 Forge 的範例，由 ADE 自行決定是否啟用

## Decision Outcome

Chosen option: "從 seed 移除開發流程的 skill 與知識，Generator 不再提供", because 開發流程的選擇屬於各團隊，社群已有持續演進的實作，Generator 維護一套會過時的版本，只會把過時的內容帶進每個新的 ADE。

規則如下：

* seed 不提供開發流程的 skill 與知識；各 ADE 依需求在自己的 ADE 中建立，或採用社群的 skill。
* 與開發流程無關的交付與慣例 skill 保留，例如 `ade-ship` 與 `ade-commit`。
* 只為開發流程服務的詞條，例如關、Phase、Spec Ready，從 seed 的詞彙表移除。

### Consequences

* Good, because 新建的 ADE 不再帶入過時的開發流程。
* Good, because Generator 不必追趕社群開發流程的演進，維護範圍縮小。
* Good, because 各團隊自由選擇適合的開發流程。
* Bad, because 新建的 ADE 沒有現成的開發流程，團隊必須自行建立或選用。
* Bad, because 刪除 `docs/research/` 後，ADR-0007 等歷史紀錄中指向研究檔的連結失效；研究檔可從 `v1.6.0` 的 tag 取回。

### Confirmation

以 review 確認：seed 不含開發流程的 skill 與知識，`tests/init.test.js` 注入的 skill 清單不含 `ade-dev` 與 `ade-dev-auto`。

## Pros and Cons of the Options

### 從 seed 移除開發流程的 skill 與知識，Generator 不再提供

* Good, because 維護範圍與 Generator 的定位一致。
* Bad, because 失去一套可以直接使用的開發流程。

### 保留並持續更新 seed 的開發流程

* Good, because 新的 ADE 有現成的開發流程。
* Bad, because Generator 必須持續追趕社群的演進，否則會再次過時。
* Bad, because 一套固定的流程無法適用各團隊不同的需求。

### 保留為不注入 Forge 的範例，由 ADE 自行決定是否啟用

* Good, because 團隊可以參考既有的設計。
* Bad, because 範例同樣會過時，而且仍隨 seed 複製進每個新的 ADE。

## More Information

既存 ADE 中的 `ade-dev`、`ade-dev-auto` 與 `process/ade-dev-workflow/` 不受影響：seed 的修改不會傳到既存的 ADE，是否保留由各 ADE 決定。
