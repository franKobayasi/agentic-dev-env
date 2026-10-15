# 開發指引

本文件是修改本 repo 的入口，目前涵蓋 `seed/`，內容包括首次設定、seed 的定位、seed 各部分的去向、`create` 處理 seed 的步驟，以及修改 seed 後必須同步與驗證的項目。閱讀前需要知道三個名詞：ADE（Agentic Dev Environment）是團隊以 `create` 建立的知識庫 repo；Forge 是團隊成員開發時使用的目錄，由 ADE 注入知識與 skill；runner 是 Generator 中執行 init 與 update 的程式。名詞的定義見[詞彙表](../CONTEXT.md)。

下列主題由其他文件說明：

- Generator 的原則，以及 seed、runner 與 skill 的設計依據，見[核心概念](./core-concepts/README.md)；修改 seed 前應先對照。
- 任務與開發進度以 beads（`bd`，issue tracker 工具）管理，安裝、同步與注意事項見 [issue tracker 的使用方式](./task-tracking.md)。
- runner、ADE 與 Forge 之間的契約，以及 breaking change 的判準，見[依賴關係與相容性契約](./dependency-contract.md)。
- 發版指令見 [README 的開發與發版說明](../README.md#開發與發版)。

## 首次設定

clone 本 repo 後，執行下列指令啟用 repo 內的 git hook：

```sh
git config core.hooksPath .githooks
```

執行過 `npm install` 時，`package.json` 的 `prepare` 腳本已自動完成這項設定。hook 在 commit 時檢查 `docs/adr/` 的 ADR，並重新產生 ADR 的索引表。未啟用 hook 時，CI 仍會執行相同的檢查，但錯誤要到推送後才會發現。執行 `git config core.hooksPath` 輸出 `.githooks` 時，代表設定完成。

## seed 的定位

`seed/` 是 ADE 的初始內容。`create` 只複製一次，之後 ADE 自行演化，對 seed 的修改不會傳到既存的 ADE。既存的 ADE 需要新內容時，依 [`CHANGELOG.md`](../CHANGELOG.md) 手動搬入對應檔案。

這個定位衍生出四條撰寫約束：

- **以 ADE 的視角撰寫。** seed 內的路徑必須以 create 產出的 ADE 根目錄為準，不得出現 `seed/` 或本 repo 的相對路徑。因此 `seed/repo/` 內指向 `hub/` 的相對連結，在 seed 內是斷的，在 ADE 內才成立。提及本 repo 時應稱為「上游 create-agentic-dev-env」；引用本 repo 的檔案（例如 `docs/research/`）時必須使用 GitHub URL。
- **知識庫內的位置寫成 `knowledge/…`。** `knowledge/…` 代表知識庫根目錄，在 ADE 內是 `hub/knowledge/`，在 Forge 內是 `.claude/ade/knowledge/`，這條約定寫在 `seed/repo/CLAUDE.md`。描述 repo 結構本身時，例如判斷所在位置、指定建檔位置或建立 symlink，應寫從 repo 根目錄起算的完整路徑。
- **不含任何公司知識。** `hub/knowledge/` 不得放入公司知識，只放結構、範本與通用流程，實際內容由各團隊在自己的 ADE 填寫。
- **改動只影響新建的 repo。** 因此可以調整 seed 的結構，但 runner 讀取的部分受契約 A（runner 依賴的 ADE 結構）約束，見下一節的表格。

## seed 的分層

seed 只有兩個子目錄，分別是 ADE 兩個部分的原料：

| seed 內 | 在 ADE 成為 | 用途 |
|---|---|---|
| `hub/` | `hub/`（原樣） | init 與 update 注入 Forge 的內容 |
| `repo/` | repo 根目錄（攤平） | ADE 本身：設定檔、根目錄文件、ADE 內可用的 skill |

因此在 ADE 內只有一條規則：`hub/` 的內容會發送到 Forge，其餘內容都屬於 repo 本身。

下表列出 `hub/` 各部分在 Forge 中的去向：

| `hub/` 內 | Forge 內 | runner 是否讀取 |
|---|---|---|
| `knowledge/` | `.claude/ade/knowledge/`，update 時整份刪除後重建 | 是（契約 A，必要） |
| `skills/ade-*/` | `.claude/skills/ade-*/`，update 時依前綴刪除後重建 | 是（契約 A，目錄名稱必須以 `ade-` 開頭） |
| `CLAUDE.section.md` | 注入 `CLAUDE.md` 的 `<!-- ADE:BEGIN -->` 與 `<!-- ADE:END -->` 區段 | 是（契約 A，必要） |

**注意**：常駐區段不得命名為 `CLAUDE.md`。Claude Code 讀取子目錄的檔案時，會自動載入該目錄的 `CLAUDE.md`；維護者在 ADE 內編輯 `hub/` 時，會因此誤載入給 Forge 使用的指引。

下表列出 `repo/` 各部分在 ADE 中的去向：

| `repo/` 內 | 在 ADE 成為 | 說明 |
|---|---|---|
| `skills/` | `.claude/skills/` | ADE 專用的 skill，以實體目錄存放 |
| `githooks/` | `.githooks/` | commit 前產生 ADR 索引並執行知識庫檢查的 hook；`pnpm install` 時由 `package.json` 的 `prepare` 啟用 |
| `gitignore` | `.gitignore` | |
| `package.json`、`cli.js` | 同名 | runner 讀取 `package.json` 的 `repository.url`；`cli.js` 只委派給 runner，不得包含邏輯 |
| `docs/` | 同名 | ADE 維護者閱讀、不注入 Forge 的文件，例如決策紀錄 `adr/` 與開發流程的規則異動紀錄 |
| `CLAUDE.md`、`README.md`、`UPSTREAM-CANDIDATES.md` | 同名 | 前兩者必須位於 repo 根目錄，Claude Code 與程式碼託管平台才會讀取 |

skill 的使用對象由放置位置與 frontmatter 決定，下表列出三種使用對象的放置方式：

| 使用對象 | seed 內放置位置 | ADE 的 `.claude/skills/` |
|---|---|---|
| 只在 Forge | `hub/skills/` | 不出現 |
| 兩邊都用 | `hub/skills/`，並在 frontmatter 的 `metadata` 加上 `ade-scope: both` | create 建立指向 `hub/skills/` 的 symlink |
| 只在 ADE | `repo/skills/` | 實體目錄 |

## create 如何處理 seed

[`bin/create.js`](../bin/create.js) 依下列順序處理 seed：

1. 將 `seed/repo/` 攤平複製為 `<name>/`，並將 `seed/hub/` 複製為 `<name>/hub/`。
2. 將 `gitignore` 改名為 `.gitignore`、`githooks/` 改名為 `.githooks/`，並將 `skills/` 移到 `.claude/skills/`。npm publish 會移除以點開頭的檔案與目錄，因此 seed 內一律以不含點的名稱存放。
3. 為 `hub/skills/` 中宣告 `ade-scope: both` 的 skill，在 `.claude/skills/` 建立 symlink。
4. 掃描所有文字檔，將 `__ADE_NAME__` 替換為 repo 名稱。
5. 在 `package.json` 寫入 `ade.upstream`（本 repo 的 `repository.url`），並將 `create-agentic-dev-env` 依賴鎖定為當下的精確版本。
6. 執行 `git init`。

完成後，`<name>/` 即是一個 ADE。`package.json` 的 `repository.url` 保留 `FILL_ME` 佔位，由團隊填寫；runner 讀到 `FILL_ME` 時會拒絕執行 init。

## 修改 seed 時要同步的項目

修改 seed 時，必須依改動類型一併修改下表右欄的項目：

| 改動 | 一併修改 |
|---|---|
| 新增、刪除或改名 skill | `seed/repo/README.md` 的 skill 說明，以及本 repo [`README.md`](../README.md) 的 Skills 表與支數 |
| 改變 skill 的使用對象 | 依上一節的 skill 使用對象表調整位置或 `ade-scope`；create 會據此建立 symlink，不需另外修改清單 |
| skill 附帶腳本或範本檔 | 可視需要在 [`tests/init.test.js`](../tests/init.test.js) 加入附檔斷言，確認附檔隨目錄注入 |
| 新增以點開頭的檔案或目錄 | 在 `seed/repo/` 內以不含點的名稱存放，並在 [`bin/create.js`](../bin/create.js) 補上歸位步驟 |
| 內容需要 ADE 名稱 | 寫成 `__ADE_NAME__`，create 會替換 |
| 搬動或改名 `hub/knowledge/`、`hub/CLAUDE.section.md`，或改變 skill 目錄規則 | 屬於契約 A，必須先閱讀[依賴關係與相容性契約](./dependency-contract.md) |
| 搬動 `seed/` 內的檔案 | 指向該檔案的相對連結，在 create 產出的 ADE 內檢查（見下一節） |
| 任何 seed 改動 | [`CHANGELOG.md`](../CHANGELOG.md) 的條目 |

## 驗證

修改完成後，執行下列兩個指令：

```sh
npm test
npm pack --dry-run
```

`npm test` 執行 `tests/` 內的端到端測試，分檔涵蓋 create、init、update 與舊的扁平結構，並檢查 seed 各部分的去向。`npm pack --dry-run` 列出套件會打包的檔案，用來確認 `seed/` 已包含在內；打包範圍由 `package.json` 的 `files` 控制。`npm test` 全部通過，且打包清單包含 `seed/` 時，代表 seed 的去向與打包範圍正確。

相對連結必須在 create 產出的 ADE 內檢查，而不是在 seed 內，因為 seed 內的連結以 ADE 為準。檢查步驟如下：

1. 切換到暫存目錄，執行 `node <本 repo 路徑>/bin/create.js demo`，產生名為 `demo` 的 ADE。`create.js` 只接受 repo 名稱，不接受路徑，因此必須先切換目錄。
2. 在 `demo/` 內檢查 Markdown 檔案的相對連結。

所有連結都能解析時，代表 seed 內的路徑寫法正確。
