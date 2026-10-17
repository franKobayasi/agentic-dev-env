# 依賴關係與相容性契約（Generator ↔ ADE ↔ Forge）

本文件說明 `create-agentic-dev-env` 與它生成的每個 ADE、以及每個 ADE 注入的
Forge 之間的依賴關係——**修改 runner 或 seed 前必讀**，這裡定義了什麼樣的改動
會讓已建立的 ADE 全部異常。

## 三方角色

```
create-agentic-dev-env（本 repo，發佈到 npm）
├── bin/create.js + seed/       …… 腳手架：生成 ADE（一次性）
└── lib/runner.js               …… 執行期：init / update 的全部邏輯
        ▲
        │ dependencies: "create-agentic-dev-env": "<精確版號>"（create 時蓋章；cli.js 一行委派 runner）
        │
ADE（create 當下 seed 的快照）
        ▲
        │ pnpm dlx "git+ssh://…/<ade-repo>.git" init | update
        │
Forge（.ade.json / .claude/ade/ / .claude/skills/ade-*/ / CLAUDE.md 區段）
```

## 兩條傳播路徑，都是顯式的

| 路徑 | 傳播方式 | 時效 |
|---|---|---|
| seed → ADE | `create` 時複製 | **一次性快照**，之後永不自動更新 |
| runner → ADE | 在 Forge 執行 `pnpm dlx` 時安裝 ADE **鎖定的精確版本** | **凍結**；升級 = ADE 顯式改版號 |

設計意圖：**ADE 建立後即與上游迭代解耦**。create 把當下版本寫死進 ADE 的
dependencies（不帶 `^`），npm 舊版本永久可裝（publish 逾 72 小時不可 unpublish），
上游怎麼發版都不影響既存 repo。要吃新 runner，就在 ADE 改那一行版號、走 git
review——升級點只有一個、可 revert，Forge 在下一次 `dlx … update` 跟上。

仍要注意的相容性壓力：ADE 各自決定升級時機，新 runner 仍會遇上「**舊版 seed
結構的 ADE × 舊版 runner 留下的 Forge 狀態**」——契約 A / B 的向後相容仍然必要，
只是破壞的影響範圍從「全部既存 repo 即刻異常」縮小為「升級版號的那個 repo 發現問題、
revert 即可」。

## 契約 A：runner 依賴的 ADE 結構

（新增「必要」項目 = breaking change）

- `hub/knowledge/` — 必要；整份複製到 Forge `.claude/ade/knowledge/`
- `hub/CLAUDE.section.md` — 必要；注入 CLAUDE.md 的 `<!-- ADE:BEGIN/END -->` 區段
- `hub/skills/*/` — 可缺；目錄名必須 `ade-` 前綴，runner 拒裝非前綴（update 只清理此前綴）
- 扁平結構 — repo 根沒有 `hub/` 時，runner 改讀 `knowledge/`、`claude-md/section.md`、`skills/*/`，規則同上。
  1.6.0 之前 create 的 ADE 都是這個結構，升級 runner 時不需先遷移；`tests/legacy-layout.test.js` 保留此案例
- `package.json` — `repository.url` 必填（0.2.8 起解析不到就 fail-fast，init 不落地、可重跑）；
  git url 或本地路徑皆可（1.3.0 起明文支援本地路徑：ADE 不放 GitHub／GitLab，`pnpm dlx file:<path>` 安裝）；
  `ade.upstream` 供 `ade-feedback-upstream` skill 使用
- `cli.js` — 一行委派 `require('create-agentic-dev-env/runner').run(...)`，不得攜帶邏輯

## 知識庫的語法（`check` 讀取）

`check` 子命令在 ADE 根目錄執行，檢查下列語法，有錯誤時以非 0 結束；`index` 子命令依同一份設定重新產生 `INDEX.md`，逐行印出有變動的檔案，供 pre-commit hook 加入 commit；update 對取得的 ADE 執行同一檢查，只印出摘要警告，不中斷更新。下列語法不影響 init 與 update 的成敗，因此新增檢查項目不是 breaking change；改變既有語法會讓 ADE 的引用失效，屬於 breaking change。

- 掃描範圍：知識庫、skill 目錄與常駐區段，依契約 A 的兩種結構之一
- 知識庫的每個資料夾都必須有 `README.md`
- 知識庫內的 `.md` 必須在 frontmatter 寫 `id` 與 `description`；知識庫根目錄的檔案、`INDEX.md` 與 `_` 開頭的檔案除外
- `id` 為 6 位小寫十六進位，在分類內唯一；分類是知識庫根目錄下的第一層資料夾
- 符號位址寫成 markdown 連結 `[文字](kb:<分類>/<id>)`，必須在分類內恰好解析到一份檔案；程式碼區塊與 code span 內的不檢查
- 資料夾 `README.md` 的 frontmatter 可寫 `index: [欄位, …]`，只接受這種單行寫法；設了 `index` 的資料夾必須有與 `index` 子命令產生結果一致的 `INDEX.md`，沒有設定的資料夾不得有 `INDEX.md`。改變 `INDEX.md` 的產生格式時，既有的 `INDEX.md` 重新產生即可，不屬於 breaking change

這些語法背後的原則見[知識的形式原則](./core-concepts/knowledge/README.md)。

## 契約 B：runner 依賴／管理的 Forge 狀態

（改欄位語意、改標記格式、縮小容忍範圍 = breaking change）

- `.ade.json` — `{ source, commit, workspaces }`；`source` 是 git url 或本地路徑（`git clone`／
  `git ls-remote` 兩者都吃；`ade-contribute` 以路徑形態判定本地模式）。**已設定的 `source` 優先**：
  ADE 的 `repository.url` 只在 init 時當初值，之後 update 不覆寫（1.4.0 起；`ade-config` 靠此讓 Forge
  自行切換來源或本地／遠端模式）；消費者有三個：runner update、CLAUDE.md
  區段的保鮮檢查、`ade-contribute` skill。`commit` 由套件目錄 `git rev-parse` 取得，取不到
  （`file:` 安裝不帶 `.git`）退 `git ls-remote <source> HEAD`；兩者都取不到（repo 尚無 commit）init 在寫檔前失敗。
  update 先 clone 並驗證知識庫與常駐區段（依上面兩種結構之一）存在才清 managed 區域——來源是空 repo 時既有安裝原封不動。注意歷史狀態：0.2.8 之前的 init 可能留下
  `source: null`；加 `workspaces` 欄位之前的檔案沒有該欄位。讀取端必須容忍缺省。
- `CLAUDE.md` — 只動 `<!-- ADE:BEGIN -->`…`<!-- ADE:END -->` 之間；標記字串本身不可變更
- `.claude/ade/` — 整個目錄視為 managed，update 全刪重建
- 寫入的原子性 — init 與 update 先完成全部讀取與驗證（source、commit、skill 前綴、`CLAUDE.md` 標記、`workspaces` 的現況）才寫入任何檔案；寫入途中失敗時，runner 刪除寫到一半的 managed 內容，搬回 managed 區域的備份並還原 `CLAUDE.md`，`.ade.json` 最後寫入，因此保持前一次安裝的紀錄。備份在寫入期間位於 `.claude/.ade-backup-*`，成功或回復後刪除；程序中斷而殘留的備份由下一次 init 或 update 刪除，managed 區域隨該次寫入整份重建
- `.claude/skills/ade-*` — `ade-` 前綴即 managed，update 全刪重建；前綴規則不可變更，
  否則舊安裝的 skill 變成清不掉的孤兒
- `workspaces` — 目錄或 symlink 兩種形態都合法；`.gitignore` 寫入不帶斜線的 `workspaces`

## Breaking change 的判準與程序

算 breaking（舉例）：契約 A 新增必要檔案或欄位、變更 managed 標記／前綴字串、
變更 `.ade.json` 既有欄位語意、提高 Node 版本門檻超過 Forge 普遍使用的環境。

程序：

1. **優先向後相容**：讀舊寫新、缺省容忍（參考 `workspaces` 欄位與 `prev.source` fallback 的作法）
2. 做不到才走 breaking：照樣 **major bump** 標示語意，並附遷移說明——鎖版本讓既存 repo
   天然不受影響，版號的作用是讓升級者一眼看出「這次升級需要動結構」
3. seed 與 runner 同一 PR 內同步修改，`tests/` 是契約的可執行版本——改契約必改測試，
   並保留「舊結構仍可 update」的案例
4. 發版：`npm version patch && git push --follow-tags`，再 `gh release create vX.Y.Z`
   （release 事件觸發 `.github/workflows/publish.yml` 跑測試並 publish）

## 案例：0.2.8 的 fail-fast

某 ADE 未填 `repository.url` 時，舊 runner 的 init 只印警告、照樣寫出
`source: null` 的 `.ade.json`——之後 update 因缺 source 被擋，init 又因「已 init 過」
被擋，Forge 死鎖，只能手改 `.ade.json`。觸因在 ADE（資料沒填），放大器在 runner
（失敗不乾淨、不可重試）。0.2.8 起改為在寫任何檔案之前 throw，目錄保持乾淨、init 可重跑。
這也是本文件的由來：**資料歸 ADE，行為歸 runner**，行為問題永遠要回上游修。
