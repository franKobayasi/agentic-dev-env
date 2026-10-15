# agentic-dev-env

## 維護紀律

- **撰寫或修改任何文件前，必須先讀[寫作指南](docs/writing-style.md)**：本 repo 的主要產出是文件，內容與寫法一律依該指南
- ADE repos 鎖**精確版本**依賴本套件（create 時蓋章）——建立後即與上游迭代解耦，升級是各 ADE repo 顯式改版號的決定。runner 的修改仍必須向後相容舊的 ADE repo 目錄結構與舊工作目錄狀態（升級者會帶著舊結構進來）；結構性 breaking change 一律 major bump 並附遷移說明
- 各 ADE repo 會透過 `ade-feedback-upstream` skill 以 issue 回饋機制改良；review 時檢查不含任何公司知識內容，原則見[知識的流向](docs/core-concepts/knowledge-flow.md)的機制迴圈
- **Context 管理是本專案與所有衍生 ADE 的根原則**：任何文件或流程設計先問「這段內容值得在什麼時機、以什麼成本進入 context？」，原則見 [Context 管理](docs/core-concepts/context-management.md)
- **設計或修改 seed、runner 與 skill 前，應先對照[核心概念](docs/core-concepts/README.md)**：生成器最上層的原則，包括知識的流向、知識與 skill 的分工、知識的形式原則

## Layout 契約（runner ↔ ADE repo ↔ 消費端）

- 依賴鏈、契約清單（ADE repo 結構＋消費端工作目錄狀態）、breaking change 判準與發版程序：**改 runner 或 seed 前必讀 [docs/dependency-contract.md](docs/dependency-contract.md)**；`tests/` 是契約的可執行版本，改契約必改測試
- `docs/research/ade-dev/` 是 `seed/hub/knowledge/process/ade-dev-workflow/` 各規則的證據盤點，**不進 seed**（每個 ADE repo 複製 3K 行研究沒道理）；規則檔以本 repo 的 GitHub URL 引用它，搬動或改名時要同步那些 URL
- **改 seed 前讀 [docs/development-guide.md](docs/development-guide.md)**：seed 的定位、各部分在 ADE repo 與工作目錄的去向、create 的處理步驟、改動時要同步的地方

## Agent skills

### Issue tracker

Issues and epics are tracked with beads (`bd`). See `docs/task-tracking.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus `docs/adr/` (MADR, written with the `adr-madr` skill).
