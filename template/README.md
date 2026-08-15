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
- 作業區（agent clone 服務 repo 的位置；預設 `workspaces/` 並自動加入 .gitignore。已有固定放 repo 的資料夾時用 `init --workspaces <path>` 指向它，可為相對或絕對路徑，已下載的 repo 直接沿用不重 clone；路徑在本目錄外就不動 .gitignore）
- `.ade.json`（設定檔：`source` 來源、`commit` 版本、`workspaces` 作業區路徑。直接編輯即可改設定，改 `workspaces` 後不需重跑任何指令）

之後同指令改跑 `update` 拉取最新知識（update 會直接 clone 最新版，不受 dlx 快取影響）。

## 結構

```
knowledge/
├── services/    # 服務 registry：index.md 總覽導航 + 一服務一檔
├── process/     # 團隊流程知識
├── specs/       # 當前功能規格，持續迭代的真相來源
└── prd/         # 一次開發一檔的需求文件，歷史文件不迭代
skills/          # init 時注入工作目錄的 .claude/skills/（六支，見下方 Skills 一覽）
.claude/skills/  # 在本 repo 內工作用的 skills（三支＋add-service、add-skill 的 symlink，見下方 Skills 一覽）
claude-md/       # CLAUDE.md managed 區段的內容
```

## Skills 一覽

### 注入工作目錄的 skills（init 後在工作目錄可用）

- **`ade-contribute`** — 知識回流的核心通道。當 agent 在工作中發現知識庫內容與現實不符（服務資訊過期、文件缺漏），或學到值得保存的新知識時觸發。它會先查 ADE repo 的 open issues／PRs 避免重複回流（已有記錄就留言補充），沒有才開 issue 記錄缺口，接著 clone 本 ADE repo、建分支、修改對應文件、開 PR 連結該 issue。人只需要 review PR。**注意：絕不直接改工作目錄裡的 `.claude/ade/` 副本**——那是 managed 區域，update 時會被覆蓋，改了等於白改；這支 skill 存在的意義就是把修改導向正確的地方。其他三支 skill 的「開 PR」動作也都委派給它，所以回流機制只需要維護這一份。

- **`ade-add-service`** — 在知識庫註冊新服務。使用者說「新增服務」「把某某服務加進知識庫」時觸發。它會依 `knowledge/services/_template.yaml` 的欄位結構建立服務描述檔（`repo` 的 url 與 branch 為必填，因為 agent 之後要靠它自主 clone 服務），同步在 `services/index.md` 總覽表加一列。資訊不足時它會問人，不會留空猜測。**本 ADE repo 內也可用**（`.claude/skills/` 有 symlink，這是主要使用場景）：在本 repo 直接編輯、照一般 git 慣例收尾；在工作目錄則走 `ade-contribute` 流程開 PR。

- **`ade-align-spec`** — 開發收尾的文件對齊。RD 完成一個 PRD 的開發後觸發。它對照 `workspaces/` 下的實際實作，逐一核對 spec 中屬於這次 PRD 的 `🚧 尚未實作` 標記：做完且行為一致的移除標記；實作與 spec 有出入的**以實作為準**修改 spec 並記下差異；沒做的保留。全部驗收項完成時把 PRD 狀態改為「已實作」。最後開 PR，把差異清單列給 PO 判斷是否接受。它只動屬於這次 PRD 的標記，同一份 spec 上其他進行中 PRD 的標記不會被誤刪。

- **`ade-spec-audit`** — spec 的定期健檢。PRD 流程只覆蓋「計畫內」的開發，hotfix 和直接改 code 的計畫外變更會讓 spec 悄悄失真——這支 skill 補上這條偵測路徑。觸發後它逐份 spec 對照相關服務的實作（缺的 repo 會先 clone），找出「行為已變、功能已移除、實作有但 spec 沒記載」的漂移，產出清單讓人確認該修 spec 還是該修 code（漂移不一定是文件錯，也可能是實作偏離了規格），確認後開 PR 修正。建議在 release 後或定期執行。

- **`ade-add-skill`** — 為 ADE 生態新增 skill 的 meta-skill。使用者說「新增 skill」「把這個做成 skill」時觸發。它先問使用對象再決定放置位置：消費端工作目錄用 → `skills/ade-*`（init/update 注入）；本 ADE repo 內用 → `.claude/skills/ade-*`；兩邊都用 → 放 `skills/` 加 symlink。並落實命名規則（`ade-` 前綴）、context 紀律與 README 同步。**本 ADE repo 內也可用**（`.claude/skills/` 有 symlink）。

- **`ade-add-process`** — 為團隊建立或修改流程慣例的 meta-skill。使用者說「以後都這樣做」「定一個慣例」時觸發。它依三層機制選載體：無條件約束 → `claude-md/section.md` 加一行指標；有觸發時機的程序 → 新增一支 `ade-` 前綴 skill；細節 → `process/` 一主題一檔。並執行 context 紀律：常駐層只寫「何時做＋去哪看」（參考技巧）、常駐規則超過 10 行時新增前必須與使用者確認取捨。最後走 `ade-contribute` 流程開 PR。

### 在本 ADE repo 內工作用的 skills（PO／維護者在本 repo 開 Claude Code 使用）

- **`ade-create-prd`** — 引導 PO 產出標準化的 PRD。它依 `knowledge/prd/_template.md` 建檔並逐區塊陪 PO 填寫，過程中會先讀服務總覽與既有 spec，用團隊既有詞彙、找出與現有規格的衝突。填完後進行**盲點拷問**：邊界與錯誤情境、跨服務影響、權限安全、資料相容性、驗收條件是否可測試、最容易被誤會包含在內的相鄰功能——問到每題都有明確答案或明確說「不在範圍」為止。PO 確認後狀態改「已確認」，才能進入下一步。

- **`ade-prd-to-spec`** — 把已確認的 PRD 落入規格。它找出受影響的 spec 檔（必要時新建），將 PRD 需求寫成「功能完成後應有的樣子」，並在每個新增／變更的行為區塊上方加 `🚧 尚未實作（PRD: …）` 標記——spec 因此同時承載「已上線的現況」與「已定案未開發」兩種資訊，靠標記區分。完成後回填 PRD 的「Spec 異動摘要」，帶 PO 逐項確認 spec 與預期相符才算結束。這一步的產出就是 RD 開發時的規格依據。

- **`ade-feedback-upstream`** — 把本 repo 演化出的**機制**改良（更好的 skill 寫法、模板結構、流程設計）以 **issue** 回饋給上游 create-agentic-dev-env 框架，由上游維護者決定是否採納，讓所有 ADE repo 受益。它有一條鐵律：只回饋機制、**絕不回饋內容**——`knowledge/` 下的公司知識、服務資訊、規格全屬機密，送出前會逐行檢查 issue 內文、把公司語彙抽換成通用範例。上游位址記在 `package.json` 的 `ade.upstream`。

## PRD / Spec 流程

1. PO 在本 repo 用 `ade-create-prd` 建立標準化 PRD（含盲點拷問），定案後標「已確認」
2. PO 用 `ade-prd-to-spec` 把 PRD 融入 `specs/`，新行為標 `🚧 尚未實作`，逐項確認對齊
3. RD 在工作目錄開發（`workspaces/`）
4. 開發完成 RD 跑 `ade-align-spec`：核對實作、移除 🚧、PRD 標「已實作」，開 PR 回本 repo

## 維護原則

- 工作目錄裡的 ADE 內容是唯讀副本，update 會覆蓋。所有修改都回到本 repo 走 PR——agent 端由 `ade-contribute` / `ade-add-service` skills 引導完成
- 知識分層：本 repo 只收跨服務知識、取得服務的最小資訊、產品規格三類——完整規則見 `knowledge/README.md`（canonical）
- 使用中演化出的**機制**改良（skill 寫法、模板、流程），用 `ade-feedback-upstream` skill 回饋給 create-agentic-dev-env 上游；公司知識內容絕不外流
