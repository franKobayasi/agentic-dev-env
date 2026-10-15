# 核心概念

本目錄定義 Generator 最上層的指導原則：Generator 如何規範 ADE 的建立與知識的生成，以及這些規範背後的底層概念。名詞的定義見[詞彙表](../../CONTEXT.md)。

## 定位

本目錄的原則是 Generator 其他部分的依據。seed、runner 與 skill 在這些原則的基礎上設計與完善；它們的結構會隨實作改變，原則不隨之改變。因此本目錄只寫原則與背後的思考，不寫 seed 或 runner 的具體結構。

原則之間有主從關係：Context 管理是根原則，其他原則是它在各領域的應用。

## 讀者

本目錄的讀者是 Generator 的維護者。ADE 不閱讀本目錄，而是透過 Generator 產出的內容，接收原則落實後的結果。設計或修改 seed、runner 與 skill 之前，應先對照本目錄的原則。

## 與其他文件的分工

下表列出本目錄與相關文件各自記錄的內容：

| 文件 | 記錄的內容 |
|---|---|
| [詞彙表](../../CONTEXT.md) | 名詞的定義 |
| 本目錄 | 現行的原則與背後的思考 |
| [決策紀錄](../adr/README.md) | 決策當時考慮過的方案與選擇的理由 |

## 導覽

各主題分開記錄，依需要閱讀：

- [Context 管理](./context-management.md)：設計任何會進入 agent context 的內容時閱讀，包括常駐區段、skill 與知識庫
- [知識的流向](./knowledge-flow.md)：設計注入、更新、修改知識的流程，或回饋 Generator 的機制時閱讀
- [知識與 skill](./knowledge-and-skill.md)：判斷一項內容該寫在知識還是 skill，或設計 skill 時閱讀
- [知識的形式原則](./knowledge/README.md)：設計知識庫的結構、檢查規則，或建立知識的流程時閱讀
