# ADE 開發流程

ADE 知識庫與其標準開發流程（判準制、延遲展開）的統一詞彙。

## Language

**產品規格（Spec）**:
ADE `knowledge/specs/` 內的長期資產，描述產品當前功能的整體規格，由 PO 持續迭代。
_Avoid_: 規格（不加限定詞）

**實作規格**:
開發流程規格關的產出，只描述該次開發範圍的規格，活在工作目錄。簽核後凍結，停留在該次開發當下，不隨開發過程更新；同步產品規格時以實作結果為準，不以它為準。
_Avoid_: spec（易與產品規格混淆）、技術規格

**關（Gate）**:
開發流程的階段邊界，以「產出＋過關判準」定義，不規定做法。判準是可檢查的狀態，不是動作。
_Avoid_: 階段、phase（流程意義）、step

**Phase**:
可獨立交付的開發單位——可單獨開發、驗收、合併交付，不影響主幹安全。Plan 產出 Phase 清單（全貌地圖），輪到才展開。
_Avoid_: 增量、功能點、子任務、milestone

**交付定義**:
Plan 時每個 Phase 的 1–3 行完成描述（完成後可觀察到什麼行為、為何交付安全）。人工簽核的對象；展開時細化為 AC。
_Avoid_: spec 摘要、goal

**展開（Expansion）**:
輪到某 Phase 開發時，將其交付定義細化為 AC 與 Tasks 的動作。未輪到的 Phase 維持粗粒度，不預先展開。
_Avoid_: breakdown、拆解（plan 層的拆分）

**AC（驗收標準）**:
展開時產出的 Given/When/Then 條目，每條須可回溯到交付定義；Phase 驗收與測試的契約。
_Avoid_: 驗收條件、DoD

**Task**:
Phase 展開後的內部工作項，checklist 一項即可。無獨立驗收契約、無獨立檔案；是 agent 組織 how 的自由。
_Avoid_: 子任務、ticket

**Spec Ready**:
判定一顆任務是否就緒可交給 auto-pilot 的硬性 gate 清單，逐條 PASS／FAIL／DEFERRED（未到評估時機），不打分數；任一 FAIL 即不得 auto。
_Avoid_: 就緒分數、readiness score

**Auto-pilot**:
ade-dev 的無人中途把關執行模式：Spec Ready 全 PASS 後，簽核點降為回報點，所有關的判準與審查照跑。
_Avoid_: 自動模式（未指明層級）、全自動

**煞車（Brake）**:
任務層的執行期停止條件，由 ade-dev 定義。命中即停下該顆任務、降回手動，不影響其他任務。
_Avoid_: 熔斷（那是批次層）

**熔斷（Circuit breaker）**:
批次層的停止條件，由 ade-dev-auto 定義。命中即停整批——針對共因失敗或累計失敗；與單顆任務的煞車分層，兩詞不混用。
_Avoid_: 煞車（那是任務層）
