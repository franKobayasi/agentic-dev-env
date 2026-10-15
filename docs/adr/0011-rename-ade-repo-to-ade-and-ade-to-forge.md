---
status: accepted
date: 2026-10-16
decision-makers: Frank Lin
outcome: "ADE 改指團隊維護知識體系的 repository（原 ADE repo，也可寫作 ADE repo）；注入知識的目錄改稱 Forge（原 ADE）；框架的正式名詞改為 Generator（原 生成器）"
notes: "契約識別字（.claude/ade/、.ade.json、ADE:BEGIN／END 標記、ade- 前綴）不變；ADR-0001 至 0010 與已推送的 issue 使用舊名詞，以本 ADR 的對照表解讀"
---

# ADE 指 repository，注入知識的目錄改稱 Forge

## Context and Problem Statement

詞彙表以「ADE repo」指團隊維護知識體系的 repository，以「ADE」指注入知識與 skill、團隊成員實際開發的目錄。實務上團隊談到 ADE 時，直覺指的是 repository，例如「把這份知識同步到 ADE」；名詞與日常用法相反，溝通時必須反覆解釋。問題是：三個核心名詞應如何命名，才能與團隊的直覺一致？

## Decision Drivers

* 正式名詞應與團隊溝通時的直覺一致，避免每次溝通都要解釋。
* 同一個名稱不應同時指兩種東西。
* 改名不得破壞 runner 依賴的契約，也不得要求既有的 ADE 與 Forge 遷移。

## Considered Options

* ADE 指 repository，注入知識的目錄改稱 Forge，框架稱 Generator
* 維持現狀：ADE repo 指 repository，ADE 指注入知識的目錄

## Decision Outcome

Chosen option: "ADE 指 repository，注入知識的目錄改稱 Forge，框架稱 Generator", because 它讓 ADE 回到團隊直覺中的意思，注入知識的目錄另有一個不會混淆的名稱。

下表列出新舊名詞的對應：

| 指的對象 | 新名詞 | 舊名詞 |
|---|---|---|
| 規範並建立 ADE 的框架，即 create-agentic-dev-env 套件 | Generator | 生成器 |
| 團隊建立並持續迭代知識體系的 repository | ADE，也可寫作 ADE repo | ADE repo |
| 運用 ADE 的知識，由人與 AI 協作產出程式碼、軟體或執行結果的目錄 | Forge | ADE、工作目錄 |

產生鏈因此是：Generator 建立 ADE，ADE 注入成 Forge。

### Consequences

* Good, because 「同步到 ADE」「寫回 ADE」這類日常說法直接對應 repository。
* Good, because Forge 是新名稱，不會與 ADE 混淆。
* Bad, because ADR-0001 至 0010 與已推送的 issue 使用舊名詞，閱讀時必須依本 ADR 的對照表換算。
* Bad, because 契約識別字仍以 ade 命名，例如 Forge 中的 `.claude/ade/` 與 `.ade.json`，識別字與名詞並不一一對應。
* Bad, because 「ADE」與「ADE repo」兩種寫法並存，搜尋時兩種都要考慮。

### Confirmation

以 review 確認：Generator 的文件與 seed 不再以 ADE 指稱注入知識的目錄，也不再使用「生成器」「工作目錄」「消費端」。

## Pros and Cons of the Options

### ADE 指 repository，注入知識的目錄改稱 Forge，框架稱 Generator

* Good, because 名詞與團隊的直覺一致。
* Bad, because 需要一次改寫所有文件與 seed，並重新整理 skill 的觸發語，例如「更新 ADE」改為「更新 Forge」。

### 維持現狀：ADE repo 指 repository，ADE 指注入知識的目錄

* Good, because 不需要改寫。
* Bad, because 團隊說「ADE」時，仍要每次說明指的是 repository 還是目錄。

## More Information

契約識別字不改名，因為依 `docs/dependency-contract.md`，變更 managed 標記、前綴或 `.ade.json` 的欄位屬於 breaking change。本決策對應 bd 的 issue `ade-jeb.24`（既有文件改用詞彙表的名詞）。
