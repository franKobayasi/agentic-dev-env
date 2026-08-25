# Spec Ready 判定與 auto-pilot 模式

兩種執行模式：**手動（預設）**——規格關、規劃關由人簽核；**auto-pilot**——Spec Ready 全 PASS 的任務可無人中途把關跑完六關：簽核點降為回報點（frontmatter 寫 `status: approved`＋`approved_by: spec-ready`），所有關的判準與兩軸審查照跑。單顆任務由人明說啟用；批次串接由 `ade-dev-auto` 負責。

**Spec Ready 判定**——逐條列 PASS／FAIL，不打分數；任一 FAIL 即不得 auto，並輸出一句話理由（如「G3 不過：沒有可執行的測試指令」）。每條 gate 都帶**評估時機**，時機到了才評；未到時機的 gate 輸出 `DEFERRED` 而非省略，讓清單永遠是完整的 G1–G8。**Gate ID 一旦發布不重編、不回收**：廢止留佔位、新增只往後加——歷史 `notes.md` 與批次總結靠 ID 比對，重編號會讓舊紀錄語意漂移。依據與數字出處：[research-autopilot-readiness.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-autopilot-readiness.md)（採用其 §1.1 的 G1–G8，其中「交付定義完整」併入 G5，G5、G6 移至 plan.md 定稿後評估）、[research-gate-integrity.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-gate-integrity.md)。

**任務啟動前評估**（資訊在 `spec.md` 就齊備）：

- **G1** 需求來自已確認的 PRD，且產品規格有對應的 🚧 區塊
- **G2** `spec.md` 每個行為描述可判定（可直接寫成測試）並指名 ≥ 1 個具體檔案路徑或介面名；無未決 open question（後者只是前提不是充分條件——它可以靠不提問刷出來）
- **G3** 有可執行的驗證指令，動工前基準是綠的，單次執行 < 10 分鐘
- **G4** 驗收測試在 `spec.md` 已定名（展開時只是細化成 Given/When/Then，不是現場發明）
- **G7** 預期改動路徑不碰黑名單：認證授權、金流、DB migration、CI/CD 設定、密鑰與環境變數、對外 API 契約
- **G8** 交付通道受限，且 MR 上有 agent 以外的自動驗證：
  - 只走 MR（`ade-ship`），不得 push 主幹、不得自行 merge，merge 由人執行
  - 目標 repo 有 CI，且會被本任務的 MR 觸發（repo 設定或 CI 設定檔查得到）
  - **無 CI、或 CI 不會在 MR 上跑 → FAIL**，不得 auto（手動模式不受影響）；解法是加一條跑 G3 驗證指令的最小 workflow，加完重評即 PASS
  - 例外只能由人逐案明示並記進 `notes.md`（無 CI 但 MR 描述附可一鍵重跑的驗證指令與預期輸出，人 merge 前自行重跑）——這是人工放行，不得由 agent 自行認定適用

**`plan.md` 定稿後評估**（逐 Phase 檢查，任一 Phase 不過＝整顆任務不 Ready）：

- **G5** 每個 Phase 的交付定義完整到能估出規模（1–3 行寫得清楚、預期改動檔案列得出來），且估出的規模在該 Phase 適用的板機值內（400 行／10 檔）、或超過但已依第 3 關拆分原則處置（切了，或列出白名單內的不拆理由）；auto 模式加嚴：> 3 檔要在 `plan.md` 寫明理由（寫了就算過——要求解釋，不是上限）
- **G6** repo > 800 檔或 > 300K 行時，G5 板機值折半（200 行／5 檔）

手動模式下 G5／G6 由規劃關的人簽核涵蓋；auto 模式的重檢規則見下。

**規劃後就緒重檢（auto 模式必做）**：第 2 關產出 `plan.md` 後、進第 3 關前，逐 Phase 重跑 G5／G6，結果逐條寫進 `notes.md`（auto 模式沒有人簽核，這份紀錄就是規劃關的過關證據）。全 PASS 才進實作關。FAIL 依成因二分處置：

- **規模超標**（交付定義清楚，但估出的規模超過適用板機值、且尚未處置）→ 依第 3 關拆分原則**處置一次**：切（只能拆更小，不得改 `spec.md`、不得靠合併或改寫交付定義來壓低估計值——與「不得改測試斷言」同類漏洞）或列白名單內的不拆理由，寫進 `notes.md`。處置後重跑 G5／G6：切了仍超標、或不拆理由不在白名單內即停、降回手動
- **資訊不足**（3 行寫不清楚、列不出預期改動檔案）→ **零容忍立即停**，不重切——這是規格層問題，重試零幫助

**Auto-pilot 執行規則**：每個 Phase 派一個乾淨 context 的 subagent（worker）執行（等同手動模式的 `/clear` 換手）；每 Phase 一個 commit（merge-safe，訊息依 `ade-commit`）疊在任務分支上，任務結束依 `ade-ship` 發 MR。派工的主 session（orchestrator）是**可拋棄的派工者**，依據 [research-orchestrator-subagent.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-orchestrator-subagent.md)：

- 每個 Phase 邊界**重跑一次接手判讀**，依檔案行事、不憑記憶；orchestrator 自身的 compaction 不構成煞車，也不需要記錄
- worker **不得向人提問**（subagent 等人輸入是最典型的卡死）——不明確處即 `spec-gap` 停；不再派 subagent；單 Phase wall-clock 上限 30 分鐘（校準值；實戰 `pnpm migrate` 互動確認曾無聲卡死），逾時由 orchestrator 停掉它並煞車
- worker 回傳**固定短格式**：`done` 或 `halted: <原因碼>`、實際行數／檔案數、最後一次測試摘要；AC 證據寫進 `phase-N.md` 交付紀錄、一行量測寫進 `notes.md`，不回傳。orchestrator 只依回傳行事，細節去檔案讀
- worker 的 compaction 次數以其 transcript（`~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl`）中的 `compact_boundary` 事件數為準——被 compaction 刪過記憶的 agent，對自己 compaction 過幾次的自述不可信；worker 自報僅供比對
- **修正輪**：兩軸審查有 blocking → 以 agentId 續用原 worker（SendMessage，保留完整實作脈絡）修正 → 換新的乾淨審查者重審。**預設 1 輪、最多 2 輪**，仍有 blocking 才煞車（輪數是工程判斷：Phase ≤ 400 行，兩輪修不掉就是規格或規劃問題）

**Auto-pilot 煞車**（任務層）：

- 零容忍即停：修改既有測試的斷言使其變綠／diff 碰到 G7 黑名單路徑／要動產品行為但 spec 無依據／第 5 關交付對帳出現**未達成**的行為規格（與前一項同記 `spec-gap`）／兩軸審查**經修正輪後仍有** blocking finding（僅限影響正確性或違反明訂需求者，其餘列為建議不煞車；審查者幾乎必報 finding，未經修正輪就停等於停在恆真訊號上）／規劃後 G5／G6 重檢不過（規模超標者可依拆分原則處置一次，仍不過即停）／實際規模超過**該 Phase 適用板機值的 2 倍**——即 800 行／20 檔，命中 G6 折半後為 400 行／10 檔；兩維度分別判定，任一超過即停；行數計法與豁免項沿用第 3 關
- 有限重試（兩個計數器分開）：測試紅了連續 3 次停，**CI 紅併入此計數器**；測試跑不起來（環境問題）另計連續 3 次停，**CI 跑不起來或長時間 pending 併入此計數器**；subagent 逾時（worker 單 Phase 30 分鐘、審查者重派一次仍逾時）直接記 `test-env` 停，不計次；worker 的 context compaction > 1 次記進 `notes.md`、> 2 次停（計法見執行規則）
- 停下時**第一個動作**是在 `plan.md` frontmatter 寫 `halted: <原因碼>`，取值對應煞車條款：`test-tampering`／`blacklist-path`／`spec-gap`／`review-blocking`／`plan-recheck`／`oversize`／`test-red`／`test-env`／`compaction`。**存在即為不得自動續跑**，人裁決處理完刪除該行
- 停下必附情境：停在哪個 Phase、哪條判準、最後一次測試輸出（frontmatter 記機器判讀用的原因碼，`notes.md` 記完整情境）
