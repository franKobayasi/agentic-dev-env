# Changelog

格式依 [Keep a Changelog](https://keepachangelog.com/)；版本語意見
`docs/dependency-contract.md`（ADE repos 鎖精確版本，major bump = 升級需動結構）。

## [Unreleased]

ADE 新增 PR 把關的 CI workflow 與 `CODEOWNERS` 範本；runner 的 init 與 update 改為先驗證再寫入、寫入途中失敗時回復原狀，並以參數陣列執行 git。契約 A 不變，契約 B 只新增寫入期間的備份目錄，既存的 ADE 與 Forge 不需要遷移。

### ADE 的 CI workflow 與 `CODEOWNERS` 範本

**為什麼**：pre-commit hook 只在執行過 `pnpm install` 的 clone 中生效，agent 在 Forge 的工作副本開的 PR 通常沒有安裝依賴，知識庫的檢查因此被略過；「agent 開 PR、人 review」也需要明確的 review 負責人。

**怎麼做**：

- seed 新增 `.github/workflows/check.yml`，在 PR 與推送到 `main` 或 `master` 時執行 `node cli.js check` 與 ADR 檢查；以 `npm install` 安裝鎖定版本的 runner，不需要 lockfile 與 pnpm
- seed 新增根目錄的 `CODEOWNERS` 範本，預設全部註解，GitHub 與 GitLab 都會讀取
- ADE 的 README 在初始設定加入「設定 PR 的把關」：把 workflow 設為分支保護的必要檢查、填寫 `CODEOWNERS` 並開啟 code owner review；GitLab 改在 `.gitlab-ci.yml` 執行相同的指令
- `tests/create.test.js` 在新建的 ADE 上執行 workflow 的 `run` 指令，seed 改壞檢查時測試失敗

既存的 ADE 可從本版 seed 複製 `repo/github/workflows/check.yml`（放到 `.github/workflows/`）與 `repo/CODEOWNERS`。

### runner：先驗證再寫入，寫入途中失敗時回復原狀

**為什麼**：update 先清除 managed 區域再逐一寫入，寫入途中失敗（磁碟空間、權限、`workspaces` 的目標無法建立）時，Forge 留下一半新、一半缺的內容；`workspaces` 衝突與 `CLAUDE.md` 標記損壞也要到知識庫與 skill 寫入之後才發現。

**怎麼做**：

- init 與 update 分成兩段：先完成全部讀取與驗證，再寫入；可預見的錯誤都在寫入前擋下，目錄保持原狀
- 寫入前把 managed 區域搬進 `.claude/.ade-backup-*`；寫入途中失敗時刪除寫到一半的內容、搬回備份並還原 `CLAUDE.md`，`.ade.json` 最後寫入，因此保持前一次安裝的紀錄。init 失敗時一併移除本次建立的空目錄，可直接重跑
- 程序中斷而殘留的備份目錄由下一次 init 或 update 刪除

### runner：以參數陣列執行 git

**為什麼**：`git clone` 與 `git ls-remote` 以字串組成 shell 指令，`.ade.json` 的 `source` 含有引號時會被當成 shell 指令執行，以 `-` 開頭時會被當成 git 的選項。

**怎麼做**：改用 `execFileSync` 以參數陣列執行 git，`source` 放在 `--` 之後；`tests/update.test.js` 以兩種惡意的 `source` 驗證不會被執行。

## [1.6.1] - 2026-10-16

seed 移除開發流程的 skill 與知識，Generator 不再提供開發流程，由各 ADE 依需求自行建立或採用社群的 skill；並修正 `adr.js` 在 pre-commit hook 中的誤判。runner 與契約不變。

### 移除 `ade-dev`、`ade-dev-auto` 與開發流程的規則

**為什麼**：開發流程已有大量社群開源的 skill，seed 這一版已經過時；seed 在 create 時複製進每個新的 ADE，過時的流程會隨之進入每個新建的 ADE。決策見 `docs/adr/0013-remove-dev-workflow-skills-from-seed.md`。

**怎麼做**：

- seed 刪除 `hub/skills/ade-dev/`、`hub/skills/ade-dev-auto/`、`hub/knowledge/process/ade-dev-workflow/` 與 `repo/docs/ade-dev-workflow-changelog.md`
- 詞彙表刪除只為開發流程服務的詞條：實作規格、關、Phase、交付定義、展開、AC、Task、Spec Ready、Auto-pilot、煞車、熔斷；產品規格移到「知識庫」一節
- `ade-ship`、`ade-commit`、`ade-feedback-upstream` 移除對 ade-dev 的引用；README 的核心概念「產品規格 ≠ 實作規格」改為「產品規格描述現況與已定案的行為」
- Generator 刪除 `docs/research/`，研究檔可從 `v1.6.0` 的 tag 取回

既存的 ADE 不受影響：seed 的修改不會傳到既存的 ADE，其中的 `ade-dev` 與規則是否保留由各 ADE 決定。

### 修正：`adr.js` 在 pre-commit hook 中把既有 ADR 誤判為刪除

**為什麼**：git 執行 hook 時設定 `GIT_DIR`，git 因而把目前目錄當成 work tree 的根目錄；`adr.js` 在 ADR 目錄內執行 git，目錄外的路徑全部被視為刪除，hook 擋下所有修改 `docs/adr/` 的 commit。1.6.0 的 ADE 與 Generator 都受影響。

**怎麼做**：`adr.js` 執行 git 前移除 `GIT_DIR` 與 `GIT_WORK_TREE`，改由目前目錄找到 repo。`tests/create-adr.test.js` 加入設有 `GIT_DIR` 的案例。既存的 1.6.0 ADE 可從本版 seed 複製 `hub/skills/ade-create-adr/adr.js`。

## [1.6.0] - 2026-10-16

本版改寫 seed 的知識庫為新的形式標準（id、符號位址、詞彙表與入口檔），runner 新增 `check` 與 `index` 子命令，名詞改為 Generator、ADE 與 Forge，並收緊 PRD 的結構與生命週期。runner 對契約 A、B 只有新增、沒有變更，既存 ADE 升級 runner 不需要遷移；想採用新的知識庫標準時，見本版最後一節「既存 ADE 採用新的知識庫標準」。

### 名詞：ADE 指 repository，注入知識的目錄改稱 Forge

**為什麼**：團隊說「同步到 ADE」時指的是 repository，舊名詞卻以「ADE repo」指 repository、以「ADE」指注入知識的目錄，每次溝通都要解釋。

**怎麼做**：ADE 指團隊維護知識體系的 repository（仍可寫作 ADE repo），注入知識與 skill 的目錄改稱 Forge，本套件稱 Generator，見 `docs/adr/0011-rename-ade-repo-to-ade-and-ade-to-forge.md`。文件、seed 與 skill 的觸發語一併改寫，例如 `ade-update` 改由「更新 Forge」觸發。契約識別字不變：`.claude/ade/`、`.ade.json`、`ADE:BEGIN／END` 標記、`ade-` 前綴，既存的 ADE 與 Forge 不需遷移。本版以下各節沿用新名詞。

### runner 新增 `check` 與 `index` 子命令

**為什麼**：知識的 id、description 與引用若只靠 review，壞掉的引用要等 agent 找不到知識時才會發現；由程式產生的 `INDEX.md` 也需要比對一致性的機制。

**怎麼做**：

- `node cli.js check` 在 ADE 根目錄檢查知識庫的語法：每個資料夾有 `README.md`、知識有 `id` 與 `description`、id 在分類內唯一、符號位址恰好解析到一份檔案，以及 `INDEX.md` 與設定一致。語法寫在 `docs/dependency-contract.md` 的「知識庫的語法」
- `node cli.js index` 依資料夾 `README.md` frontmatter 的 `index: [欄位, …]` 產生 `INDEX.md`，欄位從各筆 `.md` 的 frontmatter 取值；seed 不預設任何索引，見 `docs/adr/0012-index-config-in-folder-readme-frontmatter.md`
- update 對取得的 ADE 執行同一檢查，有問題時只印摘要警告，不中斷更新

### 修正：非 `ade-` 前綴的 skill 在清除 managed 區域前擋下

**為什麼**：update 先清除 Forge 的 managed 區域才檢查 skill 的前綴，ADE 有非 `ade-` 前綴的 skill 時，update 失敗並留下被清空的 Forge。

**怎麼做**：前綴檢查移到驗證 ADE 的步驟，在清除任何檔案之前執行。

### seed 的知識庫改寫為新的形式標準

**為什麼**：知識之間以相對路徑互相引用，搬動或改名就斷；詞彙表分散在兩處；skill 重述知識的內容，同一條規則有兩份副本。原則見 `docs/core-concepts/`。

**怎麼做**：

- 每份知識在 frontmatter 寫 6 位十六進位的 `id` 與一句話的 `description`；引用寫成符號位址 `[文字](kb:<分類>/<id>)`，搬動與改名不影響引用
- 詞彙表收整為 `hub/knowledge/CONTEXT.md`；知識庫根目錄的 `README.md` 說明查找方式並導覽各分類
- 服務改為帶 id 的 `services/README.md` 加上不帶 id 的 YAML 描述檔，`services/index.md` 移除
- PRD 的日期、提出者、狀態與廢止原因移到 frontmatter（`date`、`proposer`、`status`、`deprecation_reason`）；尚未實作標記改為 `> 尚未實作（[PRD 標題](kb:prd/<id>)）`，取代 `🚧`
- 新增 `process/build-knowledge.md`（建立知識的規則）、`process/prd-writing.md`（撰寫 PRD）與 `process/adr-writing.md`（撰寫 ADR）；skill 只寫步驟，規則以符號位址引用知識，例如 `ade-commit` 引用 commit 訊息慣例、`ade-create-prd` 的 Discovery 問題與盲點清單移到 `prd-writing.md`

### 新增 `ade-build-knowledge` 與 `ade-create-adr`

**為什麼**：建立知識要查重、決定位置、產生 id 並通過檢查，步驟固定；難以反悔的設計決策沒有固定的記錄方式。

**怎麼做**：兩支 skill 都宣告 `ade-scope: both`，ADE 與 Forge 都能使用。`ade-build-knowledge` 依 `build-knowledge.md` 建立或修改知識，附 `new-id.sh`。`ade-create-adr` 以 MADR 格式撰寫 ADR：服務的決策寫進該服務 repo 的 `docs/adr/`，知識體系與流程的決策寫進 ADE 的 `docs/adr/`（不注入 Forge），附範本與產生索引的 `adr.js`。

### ADE 的 pre-commit hook 與 `docs/`

**為什麼**：知識庫的語法錯誤應在 commit 前發現，而不是在 Forge 中才發現。

**怎麼做**：ADE 新增 `.githooks/pre-commit`，commit 前產生 ADR 與知識庫的索引並執行 `node cli.js check`；`pnpm install` 時由 `package.json` 的 `prepare` 啟用，尚未安裝依賴時略過知識庫檢查。ADE 根目錄新增 `docs/`，收不注入 Forge 的文件：決策紀錄 `docs/adr/`，以及從知識庫移出的開發流程規則異動紀錄 `docs/ade-dev-workflow-changelog.md`。


### 需求描述改為 GWT 決策表，Fallback 欄必填

**為什麼**：使用者故事寫得出正常路徑，寫不出例外路徑；盲點拷問問到的邊界答案沒有固定落點，常散在敘述裡或直接遺失。

**怎麼做**：「需求描述」只允許 `Given / When / Then / Fallback` 決策表，一列一個情境。盲點拷問中「邊界與錯誤」的答案寫成新列或該列的 Fallback。validator 檢查表頭、不允許非表格行、至少一列、每列 Fallback 非空（不適用要寫「不適用：<理由>」）。

### 新增「已廢止」狀態

**為什麼**：PRD 在實作前被取消或被另一份整併時沒有合法狀態可標，只能停在「草稿」或「已確認」，與進行中的需求混在一起；已確認的 PRD 還會在 spec 留下沒人要做的尚未實作標記。

**怎麼做**：`草稿`／`已確認` 可轉 `已廢止`，必填 frontmatter 的 `deprecation_reason`；從已確認廢止時，同一個 PR 撤回它在 spec 帶入的尚未實作標記與內容。`ade-spec-audit` 把指向已廢止 PRD 的尚未實作標記列為漂移，接住漏撤的殘留。

### validator 檢查檔名；修正 macOS 上區塊檢查失效

**為什麼**：PRD 以檔名的日期與 slug 搜尋，格式不一致就搜不到。另外原本用 `awk '$0==s'` 比對中文標題，macOS 內建的 BSD awk 比較多位元組字串恆為真，每個 `##` 標題都被當成命中——「區塊沒內容」在 macOS 上從未報錯過。

**怎麼做**：檔名須為 `YYYY-MM-DD-<kebab-case>.md`；標題改用 `grep -nxF` 定位，awk 只比對 ASCII 的 `^## `。

**證據**：12 份合成 PRD 逐項驗證（合格、檔名錯、slug 非 kebab、缺 Fallback、少一欄、混散文、表頭無 Fallback、無情境列、已廢止有無原因、原封範本、空區塊），結果全數符合預期；修正前同一份空區塊檔在 macOS 上通過檢查。

### 收尾輸出風險與未決清單

**為什麼**：「開放問題」承接的是待 PO 拍板的事；agent 自己沒驗證過的假設（只憑服務總覽推定的相依、沒讀實作就寫的現況行為）沒有出口，PO 看不到。

**怎麼做**：`ade-create-prd` 結束前在對話中列出這類假設，不寫進 PRD；沒有就明確宣告無已知風險。

### `template/` 更名為 `seed/`

**為什麼**：這個目錄在 create 時複製一次就與 ADE repo 脫鉤，「種子」比「範本」更貼近這個語意；也避開與 `_template.md`、`templates/mr.md` 撞名。

**怎麼做**：純搬移，內容不變。只影響本 repo 的 `bin/create.js` 與 `package.json` 的 `files`；下游依賴的是 `create-agentic-dev-env/runner`，不受影響。

### ADE repo 依去向分層：`hub/` 與其餘

**為什麼**：ADE repo 根目錄混放「發給Forge的內容」（`knowledge/`、`skills/`、`claude-md/section.md`）與「repo 本身」（設定檔、文件、ADE repo 專用 skill），維護者無法從結構看出哪些內容會進入Forge；兩邊都用的 skill 另在 `bin/create.js` 與 `test.js` 各維護一份 symlink 清單；常駐區段的名稱也看不出用途。

**怎麼做**：

- `hub/` 收 init／update 注入Forge的全部內容：`hub/knowledge/`、`hub/skills/`、`hub/CLAUDE.section.md`（原 `claude-md/section.md`；不取名 `CLAUDE.md`，避免 Claude Code 在 ADE repo 內編輯 `hub/` 時自動載入Forge的指引）
- 其餘都屬於 repo 本身，留在根目錄；ADE repo 專用的 skill 照舊是 `.claude/skills/` 下的實體目錄
- 兩邊都用的 skill 留在 `hub/skills/`，frontmatter 以 `metadata.ade-scope: both` 宣告，create 據此在 `.claude/skills/` 建立 symlink，寫死的清單移除
- seed 只剩 `hub/` 與 `repo/` 兩個子目錄：`hub/` 原樣成為 ADE repo 的 `hub/`，`repo/` 攤平成 ADE repo 根目錄（`repo/skills/` 成為 `.claude/skills/`，取代原本的 `dot-claude/`）
- runner 相容舊的扁平結構：repo 根沒有 `hub/` 時改讀 `knowledge/`、`claude-md/section.md`、`skills/`，既存 ADE repo 升級 runner 時不需遷移

既存 ADE repo 不遷移也能繼續使用。想改用新結構時，依序：

1. **先升級 runner**：`package.json` 的 `create-agentic-dev-env` 改為本版並 commit，在Forge update 一次確認正常。順序不可對調——鎖定的舊版 runner 讀不懂 `hub/`，先改結構會讓所有Forge的 update 失敗（失敗發生在清除 managed 內容之前，既有安裝不受損）
2. **搬移結構**：在 ADE repo 根執行。兩邊都用的 skill 由原本 `.claude/skills/` 下的 symlink 判定；其中的實體目錄是 ADE repo 專用 skill，不需搬動

   ```sh
   set -e
   both=$(for l in .claude/skills/*; do [ -L "$l" ] && basename "$l"; done)
   mkdir hub
   git mv knowledge hub/knowledge
   git mv skills hub/skills
   git mv claude-md/section.md hub/CLAUDE.section.md && rmdir claude-md
   for s in $both; do
     git rm -q ".claude/skills/$s"
     ln -s "../../hub/skills/$s" ".claude/skills/$s"
     perl -0pi -e 's/\A(---\n(?:.*\n)*?)---\n/$1metadata:\n  ade-scope: both\n---\n/' "hub/skills/$s/SKILL.md"
   done
   git add -A
   ```

   frontmatter 已有 `metadata` 的 skill，會多出第二個 `metadata` 鍵，需手動合併
3. **改寫講 repo 結構的文字**：**不要**以本版 seed 的 skill 整份取代——既存 repo 的 skill 多半已自行演化，也可能有 seed 沒有的自有 skill。用下列指令找出要改的行，對照本版 seed 的寫法逐處改為 `hub/` 路徑：

   ```sh
   grep -rnE 'repo 根有 `knowledge/|claude-md/|dot-claude|`skills/|\.\./\.\./skills/|\]\(knowledge/' hub .claude/skills CLAUDE.md README.md
   ```

   歷史紀錄類檔案（如各 `CHANGELOG.md`）的命中不改。README 的 repo 結構圖要整段重寫（樹狀行 grep 抓不全）。指知識庫內位置的 `knowledge/…` 不必改，在 `CLAUDE.md` 的編輯慣例加一行約定即可，寫法見本版 `seed/repo/CLAUDE.md`
4. **更新自有的檢查腳本**：寫死舊路徑的腳本一併改。注意以 glob 列檔的檢查——舊路徑在新結構下列不到任何檔案時，迴圈不執行、結果顯示通過
5. **驗證**：commit 後在Forge update 一次，確認知識庫、skills 與 `CLAUDE.md` 區段都在

**證據**：`test.js` 涵蓋新結構的 create／init／update 與舊扁平結構的 init／update；將 runner 的結構判斷分別改為「只認新結構」與「只認舊結構」時，測試各自失敗。以一個已演化的既存 ADE repo（16 支 skill，含一支 seed 沒有的自有 skill）實測：不遷移時新舊 runner 產出的Forge逐位元組相同；依上述第 2 步遷移後，新 runner 產出的知識庫與常駐區段與遷移前相同，skill 差異僅為新增的 `ade-scope`；遷移後仍用舊版 runner 則 update 失敗，此即第 1 步順序的依據。

### 既存 ADE 採用新的知識庫標準

seed 的修改不會傳到既存的 ADE。升級 runner 到本版不需要遷移：舊的知識庫照常 init 與 update，只是 update 會印出知識庫檢查的摘要警告，例如知識沒有 id。想採用新的知識庫標準時，依序：

1. **先升級 runner**：`package.json` 的 `create-agentic-dev-env` 改為本版並 commit，在 Forge 執行一次 update 確認正常。
2. **複製機制檔案**：從本版 seed 複製 `githooks/pre-commit`（放到 `.githooks/pre-commit`）、`package.json` 的 `scripts`（`check` 與 `prepare`）、`hub/skills/ade-build-knowledge/`、`hub/skills/ade-create-adr/`、`hub/knowledge/process/build-knowledge.md` 與 `adr-writing.md`、`repo/docs/adr/`。兩支 skill 宣告 `ade-scope: both`，在 `.claude/skills/` 建立指向 `hub/skills/` 的 symlink。check 回報 id 重複時，依錯誤訊息換新 id 並改寫指向它的引用。
3. **補齊 id 與入口檔**：執行 `node cli.js check`，依錯誤為每份知識補上 `id` 與 `description`，為每個資料夾補上 `README.md`。
4. **改寫引用**：知識之間的相對路徑連結改為符號位址 `[文字](kb:<分類>/<id>)`，check 會檢查每個引用能否解析。
5. **改寫 PRD 與服務**：PRD 的日期、提出者、狀態與廢止原因移到 frontmatter；`🚧` 標記改為 `> 尚未實作（[PRD 標題](kb:prd/<id>)）`，以 `grep -rn '🚧' hub` 找出全部標記。`services/index.md` 改為帶 id 的 `services/README.md`。對應的 skill（`ade-create-prd`、`ade-prd-to-spec`、`ade-align-spec`、`ade-spec-audit`、`ade-list-service`）依本版 seed 的寫法調整，不要整份取代，既存的 skill 多半已自行演化。
6. **收整詞彙表**：既有的詞彙表合併為 `hub/knowledge/CONTEXT.md`，詞條格式見本版 seed。

`node cli.js check` 輸出 `ADE check passed` 時，代表遷移完成。

**證據**：`tests/` 依關注點拆成 create、init、update、舊扁平結構、check、index、build-knowledge、create-adr 與 PRD，共 32 個測試；以本版 create 產生的 ADE 通過 `node cli.js check`，pre-commit hook 實測會產生 `INDEX.md` 並加入 commit。

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
