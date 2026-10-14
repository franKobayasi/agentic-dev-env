# 開發指引

修改本 repo 的入口，目前涵蓋 `seed/`。runner 與 ADE repo、工作目錄之間的契約與 breaking change 判準見 [dependency-contract.md](./dependency-contract.md)；發版指令見 [README〈開發與發版〉](../README.md#開發與發版)。

## seed 的定位

`seed/` 是 ADE repo 的初始內容。`create` 複製一次後，ADE repo 即自行演化，之後對 seed 的修改不會回到既存的 ADE repo；既存 repo 需要時，依 [CHANGELOG](../CHANGELOG.md) 手動搬入對應檔案。

由此衍生四條撰寫約束：

- **以 ADE repo 的視角撰寫**：seed 內的路徑以 create 產出的 ADE repo 根為準，不出現 `seed/` 或本 repo 的相對路徑。因此 `seed/repo/` 內指向 `hub/` 的相對連結，在 seed 內看是斷的、在 ADE repo 內才成立。提及本 repo 時稱「上游 create-agentic-dev-env」；引用本 repo 的檔案（如 `docs/research/`）使用 GitHub URL
- **知識庫內的位置寫 `knowledge/…`**：代表知識庫根，ADE repo 內是 `hub/knowledge/`，工作目錄內是 `.claude/ade/knowledge/`（這條約定寫在 `seed/repo/CLAUDE.md`）。講 repo 結構本身時（判斷所在位置、建檔位置、symlink）寫從 repo 根起算的完整路徑
- **不含任何公司知識**：`hub/knowledge/` 只放結構、範本與通用流程，實際內容由各團隊在自己的 ADE repo 填寫
- **改動只影響新建的 repo**：因此可以調整 seed 的結構，但 runner 讀取的部分受契約 A 約束，見下表

## seed 的分層

seed 只有兩個子目錄，各自是 ADE repo 的一部分原料：

| seed 內 | 在 ADE repo 成為 | 用途 |
|---|---|---|
| `hub/` | `hub/`（原樣） | init／update 注入工作目錄的內容 |
| `repo/` | repo 根目錄（攤平） | ADE repo 本身：設定檔、根目錄文件、ADE repo 內可用的 skill |

在 ADE repo 內因此只有一條規則：`hub/` 是要發給工作目錄的，其餘都屬於 repo 本身。

`hub/` 的內容與去向：

| `hub/` 內 | 消費端工作目錄內 | runner 是否讀取 |
|---|---|---|
| `knowledge/` | `.claude/ade/knowledge/`，update 時整份刪除後重建 | 是（契約 A，必要） |
| `skills/ade-*/` | `.claude/skills/ade-*/`，update 時依前綴刪除後重建 | 是（契約 A，目錄名必須 `ade-` 前綴） |
| `CLAUDE.section.md` | 注入 `CLAUDE.md` 的 `<!-- ADE:BEGIN -->`／`<!-- ADE:END -->` 區段 | 是（契約 A，必要） |

常駐區段不命名為 `CLAUDE.md`：Claude Code 讀取子目錄檔案時會自動載入該目錄的 `CLAUDE.md`，維護者在 ADE repo 內編輯 `hub/` 時會誤載工作目錄的指引。

`repo/` 的內容與去向：

| `repo/` 內 | 在 ADE repo 成為 | 說明 |
|---|---|---|
| `skills/` | `.claude/skills/` | ADE repo 專用的 skill，以實體目錄存放 |
| `gitignore` | `.gitignore` | |
| `package.json`、`cli.js` | 同名 | runner 讀 `package.json` 的 `repository.url`；`cli.js` 只委派 runner，不得攜帶邏輯 |
| `CLAUDE.md`、`README.md`、`CONTEXT.md`、`UPSTREAM-CANDIDATES.md` | 同名 | 前兩者須在 repo 根才會被 Claude Code 與程式碼平台讀到 |

skill 的使用對象由位置與 frontmatter 決定：

| 使用對象 | seed 內放置位置 | ADE repo 的 `.claude/skills/` |
|---|---|---|
| 只在工作目錄 | `hub/skills/` | 不出現 |
| 兩邊都用 | `hub/skills/`，frontmatter 的 `metadata` 加 `ade-scope: both` | create 建立 symlink 指向 `hub/skills/` |
| 只在 ADE repo | `repo/skills/` | 實體目錄 |

## create 對 seed 的處理

依 `bin/create.js` 的執行順序：

1. `seed/repo/` 攤平複製為 `<name>/`，`seed/hub/` 複製為 `<name>/hub/`
2. `gitignore` 改名為 `.gitignore`，`skills/` 移到 `.claude/skills/`。npm publish 會剝除點開頭的檔案與目錄，所以 seed 內一律以無點名稱存放
3. 為 `hub/skills/` 中宣告 `ade-scope: both` 的 skill，在 `.claude/skills/` 建立 symlink
4. 掃描所有文字檔，將 `__ADE_NAME__` 替換為 repo 名稱
5. 在 `package.json` 寫入 `ade.upstream`（本 repo 的 `repository.url`），並將 `create-agentic-dev-env` 依賴鎖為當下的精確版本
6. `git init`

`package.json` 的 `repository.url` 保留 `FILL_ME` 佔位，由團隊填寫；runner 讀到 `FILL_ME` 時拒絕 init。

## 修改 seed 時要同步的地方

| 改動 | 一併修改 |
|---|---|
| 新增、刪除或改名 skill | `seed/repo/README.md` 的 skill 說明；本 repo `README.md` 的 Skills 表與支數 |
| 改變 skill 的使用對象 | 依上方「skill 的使用對象」表調整位置或 `ade-scope`；create 會據此建立 symlink，不需另改清單 |
| skill 附帶腳本或範本檔 | 視需要加入 `test.js` 的附檔斷言，確認附檔隨目錄注入 |
| 新增點開頭的檔案或目錄 | 在 `seed/repo/` 內以無點名稱存放，並在 `bin/create.js` 補上歸位 |
| 內容需要 ADE repo 名稱 | 寫 `__ADE_NAME__`，create 會替換 |
| 搬動或改名 `hub/knowledge/`、`hub/CLAUDE.section.md`，或改變 skill 目錄規則 | 屬契約 A，先讀 [dependency-contract.md](./dependency-contract.md) |
| 搬動 `seed/` 內的檔案 | 指向它的相對連結（在 create 產出的 ADE repo 內檢查，見下節） |
| 任何 seed 改動 | `CHANGELOG.md` 條目 |

## 驗證

```sh
node test.js              # create → init → update 端到端，含 seed 各部分的去向
npm pack --dry-run        # 確認 seed/ 有被打包（package.json 的 files）
```

相對連結要在 create 產出的 ADE repo 內檢查，而不是在 seed 內：`node bin/create.js <暫存目錄>/demo` 後，對產出的 repo 檢查 markdown 相對連結。
