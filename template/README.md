# __ADE_NAME__

由 [create-agentic-dev-env](https://github.com/) 產生的 Agentic Dev Environment（ADE）知識庫：集中管理團隊的 domain 知識、流程知識與產品規格，讓 agent 在任何工作目錄都能取用並持續回流更新。

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
- `workspaces/`（agent clone 服務 repo 的作業區，自動加入 .gitignore）
- `.ade.json`（記錄來源與版本）

之後同指令改跑 `update` 拉取最新知識（update 會直接 clone 最新版，不受 dlx 快取影響）。

## 結構

```
knowledge/
├── services/    # 服務 registry：index.md 總覽導航 + 一服務一檔
├── process/     # 團隊流程知識
├── specs/       # 當前功能規格，持續迭代的真相來源
└── prd/         # 一次開發一檔的需求文件，歷史文件不迭代
skills/          # init 時注入工作目錄的 .claude/skills/
.claude/skills/  # 在本 repo 內工作用的 skills（PO 建 PRD、轉 spec）
claude-md/       # CLAUDE.md managed 區段的內容
```

## PRD / Spec 流程

1. PO 在本 repo 用 `ade-create-prd` 建立標準化 PRD（含盲點拷問），定案後標「已確認」
2. PO 用 `ade-prd-to-spec` 把 PRD 融入 `specs/`，新行為標 `🚧 尚未實作`，逐項確認對齊
3. RD 在工作目錄開發（`workspaces/`）
4. 開發完成 RD 跑 `ade-align-spec`：核對實作、移除 🚧、PRD 標「已實作」，開 PR 回本 repo

## 維護原則

- 工作目錄裡的 ADE 內容是唯讀副本，update 會覆蓋。所有修改都回到本 repo 走 PR——agent 端由 `ade-contribute` / `ade-add-service` skills 引導完成
- 知識分層：本 repo 只收跨服務知識、取得服務的最小資訊、產品規格三類——完整規則見 `knowledge/README.md`（canonical）
- 使用中演化出的**機制**改良（skill 寫法、模板、流程），用 `ade-feedback-upstream` skill 回饋給 create-agentic-dev-env 上游；公司知識內容絕不外流
