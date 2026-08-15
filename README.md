# create-agentic-dev-env

為團隊打造 **Agentic Dev Environment（ADE）**：一個集中管理 domain 知識、流程知識、產品規格的知識庫 repo，讓 AI agent 在任何工作目錄都能取用團隊 knowhow、自主拉取服務進行開發，並把新知識持續回流——團隊的知識從「散落在成員腦中」變成「持久化、可迭代的資產」。

## 運作模式

```
┌──────────────────┐   pnpm dlx … init/update    ┌──────────────────────┐
│  ADE repo (xxx)   │ ──────────────────────────▶ │  工作目錄 (hub)       │
│  你團隊的知識庫    │                              │  CLAUDE.md + skills  │
│  knowledge/       │ ◀────────────────────────── │  workspaces/服務A     │
│  skills/          │      contribute PR 回流      │  workspaces/服務B     │
└──────────────────┘                              └──────────────────────┘
```

- **ADE repo**：每間公司／專案一個 private git repo，集中存放服務 registry、流程知識、規格與 PRD
- **工作目錄**：任意目錄跑 `init` 即成為 agent 工作站；agent 讀服務總覽 → clone 服務到 `workspaces/` → 開發
- **回流**：agent 發現知識過期或缺漏時，由內建 skill 引導開 PR 回 ADE repo，人只負責 review

## 快速開始

```sh
# 1. 建立你的 ADE repo
pnpm dlx create-agentic-dev-env my-ade

# 2. 填 my-ade/package.json 的 repository.url，開始填 knowledge/，push 到 GitHub/GitLab

# 3. 團隊成員在任一工作目錄安裝（SSH 設定見生成的 README）
pnpm dlx "git+ssh://git@github.com/ORG/my-ade.git" init

# 4. 之後拉取最新知識
pnpm dlx "git+ssh://git@github.com/ORG/my-ade.git" update
```

`init` 之後的工作目錄：

```
work-dir/
├── CLAUDE.md             # 原有內容不動，插入 <!-- ADE:BEGIN/END --> managed 區段
├── .claude/
│   ├── skills/ade-*/     # managed，update 整目錄覆蓋
│   └── ade/knowledge/    # 知識庫副本
├── .ade.json             # 來源 git url + commit（保鮮檢查用）
└── workspaces/           # agent clone 服務 repo 的作業區（自動 gitignore）
```

## ADE repo 內容

```
knowledge/
├── README.md    # 知識分層規則（canonical）
├── services/    # 服務 registry：index.md 總覽導航 + 一服務一份 YAML
├── process/     # 跨服務的團隊流程知識
├── specs/       # 當前功能規格，持續迭代的真相來源
└── prd/         # 一次開發一檔的需求文件，歷史文件不迭代
skills/          # init 時注入工作目錄（contribute / add-service / align-spec / spec-audit）
.claude/skills/  # 在 ADE repo 內工作用（create-prd / prd-to-spec / feedback-upstream）
claude-md/       # CLAUDE.md managed 區段的內容
```

### 設計重點

- **服務 registry 兩層結構**：`index.md` 是全服務概覽（模擬工程師「先總覽定位、再查細節」的認知路徑），每個服務一份 YAML 記錄 repo 位址、技術棧、依賴關係——agent 據此自主 clone 與開發
- **知識分層**：ADE 只收「跨服務知識、取得服務的最小資訊、產品規格」三類；bootstrap 流程與服務內部慣例歸服務 repo 自己的文件，不複製會過期的副本
- **PRD → Spec 生命週期**：PO 用 skill 建標準化 PRD（含盲點拷問）→ 轉入 spec 並標 `🚧 尚未實作` → RD 開發完成後由 skill 核對實作、移除標記、開 PR 收尾；另有 `ade-spec-audit` 定期巡檢，抓 hotfix 等計畫外變更造成的規格漂移
- **Managed 區塊覆蓋**：工作目錄裡的 ADE 內容視同唯讀，`update` 無條件覆蓋——想改就回 ADE repo 開 PR，強迫知識回流中央
- **機制回饋上游**：各 ADE repo 演化出的 skill／模板改良，由 `ade-feedback-upstream` skill 開 PR 回本專案（只回饋機制，公司知識絕不外流）

## 開發

```sh
node test.js   # 端到端自測：create → init → update
```

零依賴、純 Node（>= 20）。架構與維護紀律見 [AGENTS.md](./AGENTS.md)。

## License

[MIT](./LICENSE)
