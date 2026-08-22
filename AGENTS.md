# agentic-dev-env

## 維護紀律

- ADE repos 鎖**精確版本**依賴本套件（create 時蓋章）——建立後即與上游迭代解耦，升級是各 ADE repo 顯式改版號的決定。runner 的修改仍必須向後相容舊的 ADE repo 目錄結構與舊工作目錄狀態（升級者會帶著舊結構進來）；結構性 breaking change 一律 major bump 並附遷移說明
- 各 ADE repo 會透過 `ade-feedback-upstream` skill 以 issue 回饋機制改良；review 時檢查不含任何公司知識內容
- **Context 管理是本專案與所有衍生 ADE 的底層設計原則**（canonical 定義在 `template/knowledge/README.md`）：任何文件或流程設計先問「這段內容值得在什麼時機、以什麼成本進入 context？」——常駐層最小化、細節分檔按需載入、導航短細節深

## Layout 契約（runner ↔ ADE repo ↔ 消費端）

- 依賴鏈、契約清單（ADE repo 結構＋消費端工作目錄狀態）、breaking change 判準與發版程序：**改 runner 或 template 前必讀 [docs/dependency-contract.md](docs/dependency-contract.md)**；`test.js` 是契約的可執行版本，改契約必改測試
- `docs/research/ade-dev/` 是 `template/knowledge/process/ade-dev-workflow/` 各規則的證據盤點，**不進 template**（每個 ADE repo 複製 3K 行研究沒道理）；規則檔以本 repo 的 GitHub URL 引用它，搬動或改名時要同步那些 URL
- template 內的 `gitignore` / `dot-claude` 在腳手架時改名為 `.gitignore` / `.claude`（npm publish 會剝 dot 檔）；任何文字檔都可含 `__ADE_NAME__` 佔位符，create 時全檔掃描替換

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus `docs/ADR/`. See `docs/agents/domain.md`.
