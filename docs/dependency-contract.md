# 依賴關係與相容性契約（framework ↔ ADE repos ↔ 消費端）

本文件說明 `create-agentic-dev-env` 與它生成的每個 ADE repo、以及 ADE repo 的消費端
工作目錄之間的依賴關係——**修改 runner 或 template 前必讀**，這裡定義了什麼樣的改動
會讓已建立的 ADE repo 全部異常。

## 三方角色

```
create-agentic-dev-env（本 repo，發佈到 npm）
├── bin/create.js + template/   …… 腳手架：生成 ADE repo（一次性）
└── lib/runner.js               …… 執行期：init / update 的全部邏輯
        ▲
        │ dependencies: "create-agentic-dev-env": "<精確版號>"（create 時蓋章；cli.js 一行委派 runner）
        │
ADE repo（create 當下 template 的快照）
        ▲
        │ pnpm dlx "git+ssh://…/<ade-repo>.git" init | update
        │
消費端工作目錄（.ade.json / .claude/ade/ / .claude/skills/ade-*/ / CLAUDE.md 區段）
```

## 兩條傳播路徑，都是顯式的

| 路徑 | 傳播方式 | 時效 |
|---|---|---|
| template → ADE repo | `create` 時複製 | **一次性快照**，之後永不自動更新 |
| runner → ADE repo | 消費端 `pnpm dlx` 時安裝 ADE repo **鎖定的精確版本** | **凍結**；升級 = ADE repo 顯式改版號 |

設計意圖：**ADE repo 建立後即與上游迭代解耦**。create 把當下版本寫死進 ADE repo 的
dependencies（不帶 `^`），npm 舊版本永久可裝（publish 逾 72 小時不可 unpublish），
上游怎麼發版都不影響既存 repo。要吃新 runner，就在 ADE repo 改那一行版號、走 git
review——升級點只有一個、可 revert，消費端在下一次 `dlx … update` 跟上。

仍要注意的相容性壓力：ADE repo 各自決定升級時機，新 runner 仍會遇上「**舊版 template
結構的 ADE repo × 舊版 runner 留下的工作目錄狀態**」——契約 A / B 的向後相容仍然必要，
只是破壞的影響範圍從「全部既存 repo 即刻異常」縮小為「升級版號的那個 repo 發現問題、
revert 即可」。

## 契約 A：runner 依賴的 ADE repo 結構

（新增「必要」項目 = breaking change）

- `knowledge/` — 必要；整份複製到工作目錄 `.claude/ade/knowledge/`
- `claude-md/section.md` — 必要；注入 CLAUDE.md 的 `<!-- ADE:BEGIN/END -->` 區段
- `skills/*/` — 可缺；目錄名必須 `ade-` 前綴，runner 拒裝非前綴（update 只清理此前綴）
- `package.json` — `repository.url` 必填（0.2.8 起解析不到就 fail-fast，init 不落地、可重跑）；
  git url 或本地路徑皆可（1.3.0 起明文支援本地路徑：ADE repo 不放 forge，`pnpm dlx file:<path>` 安裝）；
  `ade.upstream` 供 `ade-feedback-upstream` skill 使用
- `cli.js` — 一行委派 `require('create-agentic-dev-env/runner').run(...)`，不得攜帶邏輯

## 契約 B：runner 依賴／管理的消費端工作目錄狀態

（改欄位語意、改標記格式、縮小容忍範圍 = breaking change）

- `.ade.json` — `{ source, commit, workspaces }`；`source` 是 git url 或本地路徑（`git clone`／
  `git ls-remote` 兩者都吃；`ade-contribute` 以路徑形態判定本地模式）；消費者有三個：runner update、CLAUDE.md
  區段的保鮮檢查、`ade-contribute` skill。`commit` 由套件目錄 `git rev-parse` 取得，取不到
  （`file:` 安裝不帶 `.git`）退 `git ls-remote <source> HEAD`。注意歷史狀態：0.2.8 之前的 init 可能留下
  `source: null`；加 `workspaces` 欄位之前的檔案沒有該欄位。讀取端必須容忍缺省。
- `CLAUDE.md` — 只動 `<!-- ADE:BEGIN -->`…`<!-- ADE:END -->` 之間；標記字串本身不可變更
- `.claude/ade/` — 整個目錄視為 managed，update 全刪重建
- `.claude/skills/ade-*` — `ade-` 前綴即 managed，update 全刪重建；前綴規則不可變更，
  否則舊安裝的 skill 變成清不掉的孤兒
- `workspaces` — 目錄或 symlink 兩種形態都合法；`.gitignore` 寫入不帶斜線的 `workspaces`

## Breaking change 的判準與程序

算 breaking（舉例）：契約 A 新增必要檔案或欄位、變更 managed 標記／前綴字串、
變更 `.ade.json` 既有欄位語意、提高 Node 版本門檻超過消費端普遍環境。

程序：

1. **優先向後相容**：讀舊寫新、缺省容忍（參考 `workspaces` 欄位與 `prev.source` fallback 的作法）
2. 做不到才走 breaking：照樣 **major bump** 標示語意，並附遷移說明——鎖版本讓既存 repo
   天然不受影響，版號的作用是讓升級者一眼看出「這次升級需要動結構」
3. template 與 runner 同一 PR 內同步修改，`test.js` 是契約的可執行版本——改契約必改測試，
   並保留「舊結構仍可 update」的案例
4. 發版：`npm version patch && git push --follow-tags`，再 `gh release create vX.Y.Z`
   （release 事件觸發 `.github/workflows/publish.yml` 跑測試並 publish）

## 案例：0.2.8 的 fail-fast

某 ADE repo 未填 `repository.url` 時，舊 runner 的 init 只印警告、照樣寫出
`source: null` 的 `.ade.json`——之後 update 因缺 source 被擋，init 又因「已 init 過」
被擋，消費端死鎖，只能手改 `.ade.json`。觸因在 ADE repo（資料沒填），放大器在 runner
（失敗不乾淨、不可重試）。0.2.8 起改為在寫任何檔案之前 throw，目錄保持乾淨、init 可重跑。
這也是本文件的由來：**資料歸 ADE repo，行為歸 runner**，行為問題永遠要回上游修。
