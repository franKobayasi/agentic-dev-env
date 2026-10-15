---
status: accepted
date: 2026-10-15
decision-makers: Frank Lin
outcome: "知識體系的現況寫在注入 ADE 的入口檔：根目錄 README.md 導覽分類，各分類 README.md 寫定位、文件類型與範本；體系設計的理由寫在 ADE repo 的 ADR，不注入"
notes: "不另寫一份知識體系設計文件；修正 ade-jeb.1「repo/ 層決定分類與定位」的說法，repo/ 層只保留理由"
---

# 知識體系的現況寫在注入的入口檔，理由寫在 ADE repo 的 ADR

## Context and Problem Statement

收錄哪些內容、分成哪些分類，屬於 ADE repo 的知識體系設計，見 [ADR-0007](./0007-knowledge-records-facts-skill-wraps-execution.md) 與 `docs/core-concepts/knowledge/scope.md`。知識地圖先前的決策寫著「ADE repo 的 `repo/` 層決定分類與定位」，即體系設計放在不注入 ADE 的位置。然而 ADE 中的 agent 在新增知識時，必須知道新知識屬於哪個分類、該分類收錄什麼、使用什麼範本；修改雖然在 ADE repo 的工作副本進行，判斷與導覽仍從 ADE 開始。問題是：描述知識體系的內容應放在哪裡？

## Decision Drivers

* ADE 中查找與建立知識的人與 agent，必須讀得到分類的定位。
* 只在改變體系結構時需要的內容，不應注入 ADE，以免增加 context 成本。
* 各分類的定位不應有兩份副本。

## Considered Options

* 現況寫在注入的入口檔，理由寫在 ADE repo 的 ADR
* 在 ADE repo 的 `repo/` 層另寫一份知識體系設計文件

## Decision Outcome

Chosen option: "現況寫在注入的入口檔，理由寫在 ADE repo 的 ADR", because 它讓需要定位的讀者在 ADE 中讀得到，只有改變結構時才需要的理由留在 ADE repo，且各分類的定位只寫在一處。

規則如下：

* 知識庫根目錄的 `README.md` 導覽各分類，寫明何時閱讀哪一個。
* 各分類的 `README.md` 寫該分類的定位、文件類型與範本。
* 分類方式的理由與考慮過的方案，由 ADE repo 以 ADR 記錄，不注入 ADE。

### Consequences

* Good, because ADE 中的 agent 可以從注入的入口檔判斷新知識的位置。
* Good, because 現況與理由的分工和生成器一致：core-concepts 記現況，ADR 記理由。
* Good, because 不需要新的文件類型。
* Bad, because ADE repo 必須有撰寫 ADR 的機制，依賴 seed 提供 ADR 的 skill。
* Bad, because 沒有一份文件能一次看到整個體系的全貌，必須從根目錄的 `README.md` 逐一閱讀各分類的 `README.md`。

### Confirmation

以 review 確認：seed 的知識庫根目錄 `README.md` 導覽各分類，各分類的 `README.md` 記錄定位，seed 內沒有另一份重複描述分類定位的文件。

## Pros and Cons of the Options

### 現況寫在注入的入口檔，理由寫在 ADE repo 的 ADR

* Good, because 定位只有一份，且在 ADE 中讀得到。
* Bad, because 全貌分散在多份入口檔。

### 在 ADE repo 的 `repo/` 層另寫一份知識體系設計文件

* Good, because 維護者在一份文件中就能看到體系的全貌。
* Bad, because 這份文件不注入 ADE，ADE 中的 agent 讀不到，各分類的 `README.md` 仍須寫定位，同一份內容變成兩份。
* Bad, because 若定位只寫在這份文件，ADE 中的 agent 無法判斷新知識的位置。

## More Information

本決策修正知識地圖上 `ade-jeb.1` 的說法：`repo/` 層不決定分類與定位，只保留理由。ADE repo 撰寫 ADR 的機制對應 bd 的 issue `ade-337`。本決策在知識框架的 wayfinder 地圖上定案，對應 bd 的 issue `ade-jeb.18`（ADE repo 的 repo/ 層描述知識體系的文件）。
