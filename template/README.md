# __ADE_NAME__

由 [create-agentic-dev-env](https://github.com/franKobayasi/agentic-dev-env) 產生的 Agentic Dev Environment（ADE）知識庫：集中管理團隊的 domain 知識、流程知識與產品規格，讓 agent 在任何工作目錄都能取用並持續回流更新。

## 初始設定（建 repo 後做一次）

1. 填 `package.json` 的 `repository.url`（init 會記錄它作為 update 的來源）
2. Push 到 GitHub / GitLab
3. 開始填 `knowledge/`：服務用 `knowledge/services/_template.yaml` 格式，一服務一檔，並更新 `services/index.md` 總覽

## 使用（團隊成員）

### 首次使用前：設定 SSH

init/update 透過 SSH 存取本 repo。先驗證：

```sh
ssh -T git@github.com   # GitLab 則為 git@gitlab.com；出現歡迎訊息即可跳過以下步驟
```

尚未設定金鑰：

```sh
ssh-keygen -t ed25519 -C "you@company.com"   # 一路 Enter 即可
cat ~/.ssh/id_ed25519.pub                     # 複製輸出，貼到 GitHub/GitLab 帳號設定的 SSH Keys
ssh -T git@github.com                         # 再次驗證
```

### 安裝

在任一工作目錄執行：

```sh
pnpm dlx "git+ssh://git@github.com/ORG/__ADE_NAME__.git" init
```

（public repo 也可用短寫法 `pnpm dlx github:ORG/__ADE_NAME__ init`；private repo 走 `github:` 會因 tarball API 無認證而失敗，請一律用上方 git+ssh 形式）

init 會在當前目錄建立：

- `CLAUDE.md` 的 `<!-- ADE:BEGIN/END -->` managed 區段（原有內容不動）
- `.claude/ade/knowledge/` 知識庫副本、`.claude/skills/ade-*/` skills
- `workspaces/`（agent clone 服務 repo 的作業區，自動加入 .gitignore。已有固定放 repo 的資料夾時用 `init --workspaces <path>` 指向它——`workspaces` 會建成該資料夾的 symlink，`cd workspaces` 即達、已下載的 repo 直接沿用不重 clone）
- `.ade.json`（設定檔：`source` 來源、`commit` 版本、`workspaces` 作業區實際位置（symlink 目標，預設 null）。改 `workspaces` 後跑一次 update 重建 symlink）

之後同指令改跑 `update` 拉取最新知識（update 會直接 clone 最新版，不受 dlx 快取影響）。

### 裝好之後，先記這兩支 skill

- **`/ade-help`** — 「有哪些 skill 可以用？」問它。它即時掃描當前位置真正載得到的 `ade-*` skills 並列出用途，不會像文件一樣過期
- **`/ade-update`** — 說「更新 ADE」，它會先比對版本（一樣就不跑）、提醒手改過的 managed 內容先走 `ade-contribute` 回流（否則被覆蓋），更新完回報版本變化與期間新增的 skill。session 開始偵測到落後時也會主動提醒

## 結構

```
knowledge/
├── README.md    # 知識分層規則（canonical）
├── services/    # 服務 registry：index.md 總覽導航 + 一服務一檔 yaml
├── process/     # 跨服務流程與團隊級慣例
├── specs/       # 產品規格，持續迭代的真相來源
└── prd/         # 一次開發一檔的需求文件，歷史文件不迭代
skills/          # init 時注入工作目錄的 .claude/skills/（十五支，見下方 Skills）
.claude/skills/  # 在本 repo 內工作用的 skills（ade-feedback-upstream ＋ 七支的 symlink）
claude-md/       # CLAUDE.md managed 區段的內容
CONTEXT.md       # ADE 開發流程的統一詞彙表（產品域詞彙另在 knowledge/specs/GLOSSARY.md）
```

## Skills

### 注入工作目錄的 skills（init 後在工作目錄可用）

「本 repo」欄標 ✅ 者在本 ADE repo 內也可用（`.claude/skills/` 有 symlink，單一真相在 `skills/`）。

| Skill | 用途 | 本 repo |
| --- | --- | --- |
| **`ade-help`** | 列出當前位置可用的 ade-* skills 與各自用途（「有哪些 skill」）。清單由 `list-skills.sh` 掃 `.claude/skills/ade-*/SKILL.md` 的 frontmatter 即時產生——不寫死清單，skill 搬家或新增都不用回頭改。 | ✅ |
| **`ade-update`** | 把工作目錄的 managed 內容拉到本 repo 最新版（「更新 ADE」，或 session 開始偵測到落後時）。先用 `git ls-remote` 比對 `.ade.json` 的 `commit`（一樣就不跑）、提醒把 managed 區域的手改先走 `ade-contribute` 回流，才執行 `pnpm dlx <source> update`，最後回報版本變化與期間新增的 skill。只在消費端工作目錄用——本 repo 內用一般 `git pull`。 | — |
| **`ade-contribute`** | 從工作目錄修改本知識庫的**唯一通道**（「改 ADE 的 spec／skill」「回流」）。主動撰寫直接建分支開工；被動回流先查 open issues／PRs 避免重複，沒有才開 issue 記錄缺口、PR 再連回該 issue。工作副本放 `workspaces/<ade-repo-name>/`，已存在就重用、收尾切回主幹。**絕不直接改工作目錄的 `.claude/ade/` 副本**——那是 managed 區域，update 時會被覆蓋。其他 skill 的「開 PR」動作都委派給它。 | — |
| **`ade-add-service`** | 在知識庫註冊新服務（「新增服務」）。依 `knowledge/services/_template.yaml` 建描述檔（`repo` 的 url 與 branch 必填，agent 之後要靠它自主 clone），並同步 `services/index.md` 總覽表。資訊不足會問人，不留空猜測。 | ✅ |
| **`ade-list-service`** | 列出目前所有已註冊的服務（「有哪些服務」）。讀 `services/index.md` 並與目錄下的描述檔比對，回報清單與兩者不一致處。只讀不改。 | ✅ |
| **`ade-create-prd`** | 引導 PO 產出標準化 PRD（「建 PRD」），涵蓋「只有模糊想法」到「照範本填寫」兩種起點。想法未成形先跑 **Discovery** 7 題（一批 2–3 題，已有答案的跳過），接著對照服務總覽、既有 spec 與進行中 PRD 用團隊詞彙寫入 `knowledge/prd/`，再進**盲點拷問**（邊界與錯誤情境、跨服務影響、權限安全、資料相容性、驗收可測性、相鄰功能），最後用 `validate-prd.sh` 機械檢查。**不自動翻狀態**——留「草稿」，PO 確認才改「已確認」。 | ✅ |
| **`ade-prd-to-spec`** | 把已確認的 PRD 落入規格（「PRD 轉 spec」）。找出受影響的 spec（必要時新建），將需求寫成「功能完成後應有的樣子」，並在每個新增／變更的行為區塊上方加 `🚧 尚未實作（PRD: …）`——spec 因此同時承載「已上線現況」與「已定案未開發」，靠標記區分。完成後回填 PRD 的「Spec 異動摘要」，帶 PO 逐項確認。產出即 RD 開發時的規格依據。 | ✅ |
| **`ade-dev`** | 判準制標準開發流程（「開始開發」「繼續開發」）。六關：規格（實作規格，人簽核後凍結）→ 規劃（Phase 地圖）→ 實作（逐 Phase 輪到才展開，TDD 紅→綠，交前兩軸審查）→ 測試審視 → 沉澱 → Ship。每關只定義產出與過關判準，不規定做法；狀態全在 `.ade-dev/`，session 可隨時 `/clear` 換手。內建 **Spec Ready gate G1–G8 與 auto-pilot 模式**，配零容忍煞車與有限重試。規則全在 `knowledge/process/ade-dev-workflow/`，skill 只是指標。 | — |
| **`ade-dev-auto`** | 串接多個 ade-dev 任務的批次執行器（「批次開發」）。列出 `.ade-dev/` 下未完成任務供多選，逐顆跑 Spec Ready 判定，不合格的問人補齊或剔除，全數就緒後依序 auto-pilot 執行。只定義批次層 B1–B4 與批次熔斷，任務內判準全在 ade-dev。 | — |
| **`ade-align-spec`** | 開發收尾的文件對齊（「開發完了更新 spec」）。對照實際實作逐一核對該 PRD 的 `🚧 尚未實作` 標記：做完且一致的移除、有出入的**以實作為準**改 spec 並記差異、沒做的保留；驗收項全完成時 PRD 轉「已實作」。最後開 PR 把差異清單交 PO 判斷。只動屬於這次 PRD 的標記。 | — |
| **`ade-spec-audit`** | spec 的定期健檢（「規格還對嗎」）。PRD 流程只覆蓋計畫內開發，hotfix 與直接改 code 會讓 spec 悄悄失真——這支補上偵測路徑：逐份 spec 對照實作（缺的 repo 會先 clone），找出行為已變／功能已移除／實作有但 spec 沒記載的漂移，產出清單讓人決定修 spec 還是修 code，確認後開 PR。建議 release 後或定期執行。 | — |
| **`ade-commit`** | commit 訊息慣例解析，任何要在服務 repo commit 的場景使用。依序找專案自述（CLAUDE.md／AGENTS.md／CONTRIBUTING）→ commitlint 等設定檔 → 既有 git log 風格 → 都沒有才用 ADE 預設（`knowledge/process/git-commit.md`，Conventional Commits）。一個 commit 一件事。 | — |
| **`ade-ship`** | 從服務 repo 分支發出 MR／PR（「發 MR」「ship」）。偵測平台（GitHub → `gh`、GitLab → `glab`，退 API）、專案自有範本優先（GitHub 六個位置＋組織預設、GitLab 設定層與 `.gitlab/merge_request_templates/`）、沒有就用內建 `templates/mr.md`，依實際 diff 填寫後發出並回報 URL。不自動 merge。 | — |
| **`ade-add-skill`** | 新增 skill 的 meta-skill（「把這個做成 skill」）。先問使用對象再決定位置：消費端工作目錄用 → `skills/ade-*`（init/update 注入）；本 repo 內用 → `.claude/skills/ade-*`；兩邊都用 → 放 `skills/` 加 symlink。並落實 `ade-` 命名規則、context 紀律與 README 同步。 | ✅ |
| **`ade-add-process`** | 建立或修改流程慣例的 meta-skill（「以後都這樣做」）。依三層機制選載體：無條件約束 → `claude-md/section.md` 加一行指標；有觸發時機的程序 → 新增一支 `ade-` 前綴 skill；細節 → `process/` 一主題一檔。並執行 context 紀律：常駐層只寫「何時做＋去哪看」，常駐規則超過 10 行時新增前必須與使用者確認取捨。 | ✅ |

### 在本 ADE repo 內工作用的 skills（PO／維護者在本 repo 開 Claude Code 使用）

| Skill | 用途 |
| --- | --- |
| **`ade-feedback-upstream`** | 把本 repo 演化出的**機制**改良（更好的 skill 寫法、模板結構、流程設計）以 **issue** 回饋給上游 create-agentic-dev-env 框架，由上游維護者決定是否採納，讓所有 ADE repo 受益。改良來源除了日常觀察，也包括本 repo 標題前綴 `[upstream-candidate]` 的 issues（各流程收尾沉澱時經 `ade-contribute` 開出）。鐵律：只回饋機制、**絕不回饋內容**——`knowledge/` 下的公司知識、服務資訊、規格全屬機密，送出前逐行檢查 issue 內文、把公司語彙抽換成通用範例。上游位址記在 `package.json` 的 `ade.upstream`。 |

## PRD / Spec 流程

1. PO 用 `ade-create-prd` 建立標準化 PRD（含 Discovery 與盲點拷問），定案後標「已確認」
2. PO 用 `ade-prd-to-spec` 把 PRD 融入 `specs/`，新行為標 `🚧 尚未實作`，逐項確認對齊
3. RD 在工作目錄走 `ade-dev` 六關開發（`workspaces/`），`ade-ship` 發 MR
4. 開發完成 RD 跑 `ade-align-spec`：核對實作、移除 🚧、PRD 標「已實作」，開 PR 回本 repo
5. 補漏：hotfix 與直接改 code 不會經過上面四步，`ade-spec-audit` 定期抓出這種規格漂移

步驟 1、2 在本 repo 或工作目錄都能跑——在工作目錄時走 `ade-contribute`，改的是 `workspaces/` 下的工作副本，最後開 PR。

## 維護原則

- 工作目錄裡的 ADE 內容是唯讀副本，update 會覆蓋。所有修改都回到本 repo 走 PR——agent 端由 `ade-contribute` 引導完成
- 知識分層：本 repo 只收跨服務知識、取得服務的最小資訊、產品規格三類——完整規則見 `knowledge/README.md`（canonical）
- 使用中演化出的**機制**改良（skill 寫法、模板、流程），用 `ade-feedback-upstream` skill 回饋給 create-agentic-dev-env 上游；公司知識內容絕不外流
