# 詞彙表

本檔定義本 ADE 共用的專有名詞，一個名詞一條。撰寫知識、skill 與規格時必須使用這裡的正式名詞，不得使用 `_Avoid_` 列出的同義詞；需要新的專有名詞時，先加入本檔。搜尋知識時，先以 `_Avoid_` 把用詞換成正式名詞再搜尋。

詞條的格式如下：

```md
**名詞（English）**：
一句話定義名詞所指的對象。
_Avoid_：實際發生過混淆的同義詞
```

## ADE

**ADE repo**：
團隊共同維護的知識庫 repo，是知識與 skill 的唯一事實來源；修改都在這裡進行。
_Avoid_：中央 ADE repo、單獨以 ADE 指稱

**ADE（Agentic Dev Environment）**：
團隊成員開發時使用的目錄，由 ADE repo 注入知識庫與 skill；各服務的 repo 位於其中的 `workspaces/`。
_Avoid_：工作目錄、消費端、工作站、hub

**工作副本（Working Copy）**：
ADE 中 ADE repo 的 clone，用於修改知識或 skill 並送回 ADE repo。

## 知識庫

**知識單位（Knowledge Unit）**：
一份知識，是一個 `.md` 檔，或一個帶有入口檔的資料夾；會一起修改的內容放在同一個單位。
_Avoid_：以文件指稱單位

**分類（Category）**：
知識庫根目錄下的第一層資料夾，例如 `process/`、`specs/`。

**入口檔（Entry File）**：
資料夾的 `README.md`，說明這一層並導覽下一層。
_Avoid_：index、首頁

**附件（Attachment）**：
知識單位內 `.md` 以外的檔案，不帶 id，由同一單位的 `.md` 以相對路徑引用。

**符號位址（Symbol Address）**：
知識的引用寫法 `kb:<分類>/<id>`，id 是建立知識時產生、寫在 frontmatter 的不可變隨機值。
_Avoid_：符號連結、kb 連結

## 開發流程

**產品規格（Spec）**：
知識庫 `specs/` 內的長期資產，描述產品當前功能的整體規格，由 PO 持續迭代。
_Avoid_：規格（不加限定詞）

**實作規格（Implementation Spec）**：
開發流程規格關的產出，只描述該次開發範圍的規格，存在 ADE 中。簽核後凍結，停留在該次開發當下，不隨開發過程更新；同步產品規格時以實作結果為準，不以它為準。
_Avoid_：spec（易與產品規格混淆）、技術規格

**關（Gate）**：
開發流程的階段邊界，以「產出＋過關判準」定義，不規定做法。判準是可檢查的狀態，不是動作。
_Avoid_：階段、phase（流程意義）、step

**Phase**：
可獨立交付的開發單位：可單獨開發、驗收、合併交付，不影響主幹安全。規劃時產出 Phase 清單（全貌地圖），輪到才展開。
_Avoid_：增量、功能點、子任務、milestone

**交付定義（Delivery Definition）**：
規劃時每個 Phase 的 1–3 行完成描述，寫明完成後可觀察到什麼行為、為何交付安全；是人工簽核的對象，展開時細化為 AC。
_Avoid_：spec 摘要、goal

**展開（Expansion）**：
輪到某 Phase 開發時，將其交付定義細化為 AC 與 Task 的動作。未輪到的 Phase 維持粗粒度，不預先展開。
_Avoid_：breakdown、拆解（規劃層的拆分）

**AC（Acceptance Criteria，驗收標準）**：
展開時產出的 Given/When/Then 條目，每條須可回溯到交付定義；是 Phase 驗收與測試的契約。
_Avoid_：驗收條件、DoD

**Task**：
Phase 展開後的內部工作項，checklist 一項即可。沒有獨立的驗收契約與獨立的檔案，如何組織由 agent 決定。
_Avoid_：子任務、ticket

**Spec Ready**：
判定一個任務是否就緒、可交給 auto-pilot 的硬性關卡清單，逐條判定 PASS、FAIL 或 DEFERRED（未到評估時機），不打分數；任一條 FAIL 即不得以 auto-pilot 執行。
_Avoid_：就緒分數、readiness score

**Auto-pilot**：
ade-dev 不經人中途把關的執行模式：Spec Ready 全部 PASS 後，簽核點降為回報點，所有關的判準與審查照常執行。
_Avoid_：自動模式（未指明層級）、全自動

**煞車（Brake）**：
任務層的執行期停止條件，由 ade-dev 定義。命中時停下該任務、降回手動，不影響其他任務。
_Avoid_：熔斷（那是批次層）

**熔斷（Circuit Breaker）**：
批次層的停止條件，由 ade-dev-auto 定義。命中時停止整批，針對共因失敗或累計失敗；與單一任務的煞車分層，兩詞不混用。
_Avoid_：煞車（那是任務層）

## 產品領域

產品規格與 PRD 共用的名詞，例如產品的屬性、家族、規格值與型號，由團隊依產品填寫。
