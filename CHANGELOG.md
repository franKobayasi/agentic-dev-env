# Changelog

格式依 [Keep a Changelog](https://keepachangelog.com/)；版本語意見
`docs/dependency-contract.md`（ADE repos 鎖精確版本，major bump = 升級需動結構）。

## [1.5.0] - 2026-08-26

`ade-dev` 規則校準。只動 template 的 `gates.md`、`auto-pilot.md`；runner 與契約不變，不新增關、不改編號、不改任何數字。

### 第 5 關新增「交付對帳」

**為什麼**：第 3 關的審查只看當前 Phase 的 diff，第 4 關只看測試。規格寫 A、五個 Phase 之後做成 B，沒有任何一關看得到，也不會有測試變紅。

**怎麼做**：沉澱時拿四份文件逐條核對，結論寫進 `notes.md`：

- `spec.md` 每條行為規格 → 達成／以不同方式達成／未達成
- `spec.md` 的範圍表與衝突處置表 → 處置欄寫的和實際做的是不是同一件事
- 各 `phase-N.md` 裡「留給後面決定」的事 → 兌現了，還是掉了
- `plan.md` 的 checkbox → 對得上 commit；順便合計估實差

對出來的東西必須落地（回寫規格、開 issue、修 checkbox），不能只停在紀錄。第 6 關 MR 的「已知差異」改為直接取自這裡；auto 模式對出「未達成」即煞車，沿用 `spec-gap`。

**證據**：一顆 12 Phase 的任務回頭對帳，四項各抓到一件事——6 條規格「以不同方式達成」但散落各處沒人整理、1 列處置寫「改成 X」實際是整檔刪除、1 條承諾從未寫下、最後一個 Phase 的 checkbox 漏勾。下一顆 14 Phase 任務照做：4 條以不同方式達成、0 未達成、15 個 checkbox 全對上 commit。

### 第 3 關「硬觸發即拆」改為「規模板機」

**為什麼**：> 400 行／> 10 檔的閘門判的是估計值，而估計值系統性低估 2.4–3.5 倍，還會往閾值錨定——14 個 Phase 有 4 個預估貼在 400。兩顆任務裡命中閘門而留有裁決的 5 次，全部依原則裁決，沒有一次依數字。

**怎麼做**：命中不再「必拆、停下問人」，改為必做一次拆分判斷，結論寫進 `phase-N.md`：

- 切：依賴方向、可獨立驗證、風險隔離、共用面最小、基礎設施先行——五條原則挑切點
- 不拆：理由限三種——同一不變式的兩面、拆開會有不一致的中間狀態、共用同一條 fixture 鏈
- 真正停下回報的線是板機值的 2 倍（800 行／20 檔）

行數計法多兩項豁免：註解與檔頭說明、表格驅動測試的資料列。`auto-pilot.md` 的 G5、規劃後重檢、煞車同步改為「依原則處置一次」；「硬閾值」一詞統一改「板機值」。

### 已知待校準（下游 issue，尚未落進規則）

- Phase 邊界：交付後明示 `/clear` 邊界、context 檢查點門檻、小 Phase 免審門檻、前對齊／後偏離檢視
- 探針前移：首次接觸第三方寫入／查詢形狀的 Phase，Tasks 第一項固定是拿生產參數原樣實測一次

## [1.4.0] - 2026-08-22

- **`ade-config` skill**：查看／修改工作目錄的安裝設定 `.ade.json`——本地或遠端模式（由 `source` 形態判定）、
  來源 git url 或本地路徑、`workspaces` 作業區位置；改完直接跑 update 重建。在 ADE repo 內則看／改
  `package.json` 的 `repository.url` 與 `ade.upstream`
- **runner：`.ade.json.source` 一經設定即優先**，ADE repo 的 `repository.url` 只在 init 時當初值（原本每次 update
  都用 `repository.url` 蓋回，工作目錄無法自行切換來源或本地／遠端模式）。既有工作目錄行為不變——它們的
  `source` 本來就等於 `repository.url`
- runner：`workspaces` 改指向別處時，既有的**空**實體目錄直接換成 symlink（init 預設就建空目錄，原本會被擋）；非空仍拒絕

## [1.3.3] - 2026-08-22

- `ade-contribute` 不再假設主幹叫 `main`：開分支用 `origin/HEAD`，切回主幹寫「預設分支」
- template README「兩個地方」表補本地模式的修改方式（原文「一律走 PR」與本地模式矛盾）

## [1.3.2] - 2026-08-22

本地模式的完整生命週期。向後相容。

- **runner fail-fast**：ADE repo 尚無 commit 時 init 在寫檔前失敗（原本寫出 `commit: null`，保鮮檢查永遠判定落後）；
  update 先 clone 並驗證來源有 `knowledge/` 才清 managed 區域（原本先清再 clone，來源是空 repo 時留下沒有知識庫、沒有 skills 的殘局）
- template 新增根目錄 `UPSTREAM-CANDIDATES.md`：本地模式沒有 issue tracker，`[upstream-candidate]` 改 append 於此；
  `ade-dev` 第 5 關、`ade-contribute`、`ade-feedback-upstream` 同步
- 兩份 README 的本地模式段改寫：一次性步驟（含 commit）、迭代迴圈 A（在 ADE repo 內直接改）／B（工作目錄回流）、三個提醒

## [1.3.1] - 2026-08-22

- 兩份 README 改版：template README 採下游實際使用後的版面（解決什麼 → 兩個地方 → 四步安裝＋本地模式
  → 核心概念五條 → 場景速查 → Skills 表）；本 repo README 同形式，面向建 ADE repo 的人

## [1.3.0] - 2026-08-22

本地模式：ADE repo 不放 GitHub／GitLab，只是本機或共用磁碟上的 git repo。向後相容。

- runner：`.ade.json` 的 `commit` 在套件目錄無 `.git` 時（`pnpm dlx file:<path>` 安裝不帶）
  退 `git ls-remote <source> HEAD` 取得——否則本地模式的新鮮度檢查永遠判定落後；
  本地路徑的 update 不再帶 `--depth 1`（只會印警告）
- `ade-contribute`：`source` 為路徑即本地模式——查重改看分支與 log、不開 issue、push 分支後
  交人在 ADE repo 內 merge，不開 PR
- `ade-update`：本地路徑用 `pnpm dlx "file:<source>" update`
- template README「本地模式」一節；create 的 next steps 與依賴契約文件同步

## [1.2.0] - 2026-08-22

`ade-dev` 開發流程套件（下游兩顆任務、15 個 Phase 實戰後的 v1）。template 增修，runner 與契約不變。

- **新 skill**：`ade-dev`（判準制六關、Spec Ready G1–G8、auto-pilot、煞車）、`ade-dev-auto`
  （批次 B1–B4、熔斷）。skill 只是指標，規則全在 `knowledge/process/ade-dev-workflow/`
  （`state` / `gates` / `review` / `auto-pilot` / `batch`，按角色載入；`CHANGELOG.md` 只帶
  「預期痕跡＋事後判定」的表頭）
- **研究檔不進 template**：8 份證據盤點放本 repo `docs/research/ade-dev/`，規則檔以 URL 引用
- `CONTEXT.md`：開發流程詞彙表；`knowledge/specs/GLOSSARY.md` 骨架（產品域詞彙）與
  `specs/README.md` 指標——兩份互不重疊
- `ade-ship`／`ade-commit`／`ade-feedback-upstream` 補回對 ade-dev 的引用
- 已知待校準（下游 issue，尚未落進規則）：審查者唯讀與破壞驗證互斥（建議 per-reviewer worktree）；
  Phase 規模估算檔案數維度未校準；Phase 展開第一步固定「先搜既有做法」；破壞驗證三條紀律；
  「已確認」類判準需規定證據形式

## [1.1.0] - 2026-08-22

由下游 ADE repo 實際使用三天後回饋的機制（template 增修，runner 與契約不變，既存 repo 不受影響）。

- **新 skill**：`ade-help`（`list-skills.sh` 掃 frontmatter 即時列出可用 skills）、`ade-update`
  （比對版本、提醒未回流的手改、執行 update、回報新增 skill）、`ade-list-service`、
  `ade-commit`（專案慣例 → commitlint → git log 風格 → ADE 預設）、`ade-ship`（平台偵測、
  GitHub／GitLab 範本查找鏈、內建 `templates/mr.md`、不自動 merge）
- **`ade-create-prd`**：新增 Discovery 7 題（一批 2–3 題、已答跳過）、Q→範本區塊對照表、
  `validate-prd.sh` 機械檢查；不自動翻狀態
- **`ade-contribute`**：工作副本改為 `workspaces/<ade-repo-name>/`（重用、不每次 clone）；
  主動撰寫（不開 issue）／被動回流（查重後開 issue）分流；收尾切回主幹
- **兩邊都可用**：`ade-add-process`、`ade-create-prd`、`ade-prd-to-spec` 加「判斷所在位置」步驟，
  從 `.claude/skills/` 搬到 `skills/` 並由 create 建 symlink（連同 `ade-help`、`ade-list-service`）
- **`ade-feedback-upstream`**：改良來源加入 `[upstream-candidate]` issues
- `claude-md/section.md`：新鮮度檢查改指向 `ade-update`；維護動作一律經 `ade-contribute`
- template README：Skills 改表格、加「本 repo」欄與裝後入口

## [1.0.0] - 2026-08-15

第一個正式版本。0.x 為孵化期，無正式依賴方；自本版起依賴契約穩定。

- **腳手架**（`create-agentic-dev-env <name>`）：由 `template/` 生成 ADE 知識庫 repo——
  `knowledge/`（services registry / process / specs / prd）、`skills/ade-*`、
  CLAUDE.md managed 區段、PRD ↔ Spec 生命週期 skills
- **執行期**（`pnpm dlx <ade-repo> init | update`）：在任意工作目錄安裝／更新知識庫
  唯讀副本與 `ade-*` skills；`--workspaces <path>` 可將作業區指向既有資料夾（symlink）
- **解耦設計**：ADE repo 建立時鎖上游精確版本，之後上游迭代不影響既存 repo；
  升級是各 ADE repo 顯式改版號的決定（詳見 `docs/dependency-contract.md`）
- **fail-fast**：`repository.url` 未設定時 init/update 在寫任何檔案前失敗，
  目錄保持乾淨、init 可重跑
- 發版自動化：GitHub release 觸發測試與 npm publish
