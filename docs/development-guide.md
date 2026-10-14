# 開發指引

修改本 repo 的入口，目前涵蓋 `seed/`。runner 與 ADE repo、工作目錄之間的契約與 breaking change 判準見 [dependency-contract.md](./dependency-contract.md)；發版指令見 [README〈開發與發版〉](../README.md#開發與發版)。

## seed 的定位

`seed/` 是 ADE repo 的初始內容。`create` 複製一次後，ADE repo 即自行演化，之後對 seed 的修改不會回到既存的 ADE repo；既存 repo 需要時，依 [CHANGELOG](../CHANGELOG.md) 手動搬入對應檔案。

由此衍生三條撰寫約束：

- **以 ADE repo 的視角撰寫**：seed 內的路徑以 ADE repo 根為準，不出現 `seed/` 或本 repo 的相對路徑。提及本 repo 時稱「上游 create-agentic-dev-env」；引用本 repo 的檔案（如 `docs/research/`）使用 GitHub URL
- **不含任何公司知識**：`knowledge/` 只放結構、範本與通用流程，實際內容由各團隊在自己的 ADE repo 填寫
- **改動只影響新建的 repo**：因此可以調整 seed 的結構，但 runner 讀取的部分受契約 A 約束，見下表

## seed 各部分的去向

| seed 內 | ADE repo 內 | 消費端工作目錄內 | runner 是否讀取 |
|---|---|---|---|
| `knowledge/` | `knowledge/` | `.claude/ade/knowledge/`，update 時整份刪除後重建 | 是（契約 A，必要） |
| `skills/ade-*/` | `skills/ade-*/` | `.claude/skills/ade-*/`，update 時依前綴刪除後重建 | 是（契約 A，目錄名必須 `ade-` 前綴） |
| `claude-md/section.md` | `claude-md/section.md` | 注入 `CLAUDE.md` 的 `<!-- ADE:BEGIN -->`／`<!-- ADE:END -->` 區段 | 是（契約 A，必要） |
| `dot-claude/` | `.claude/`：ADE repo 專用的 skill，以及 create 建立的 symlink | 不進入 | 否 |
| `package.json`、`cli.js` | 根目錄；`cli.js` 只委派 runner，不得攜帶邏輯 | 不進入 | 讀 `package.json` 的 `repository.url` |
| `gitignore` | `.gitignore` | 不進入 | 否 |
| `CLAUDE.md`、`README.md`、`CONTEXT.md`、`UPSTREAM-CANDIDATES.md` | 根目錄 | 不進入 | 否 |

`skills/` 下的 skill 預設只注入工作目錄。要在 ADE repo 內也能觸發，由 create 建立 symlink（見下節第 3 步）；只在 ADE repo 內使用的 skill 放 `dot-claude/skills/`。

## create 對 seed 的處理

依 `bin/create.js` 的執行順序：

1. 將 `seed/` 整份複製為 `<name>/`
2. `gitignore` 改名為 `.gitignore`，`dot-claude` 改名為 `.claude`。npm publish 會剝除點開頭的檔案與目錄，所以 seed 內一律以無點名稱存放
3. 將 `bin/create.js` 清單內的 skill 從 `.claude/skills/` symlink 到 `skills/`，讓這些 skill 在 ADE repo 內也可觸發，且單一真相在 `skills/`
4. 掃描所有文字檔，將 `__ADE_NAME__` 替換為 repo 名稱
5. 在 `package.json` 寫入 `ade.upstream`（本 repo 的 `repository.url`），並將 `create-agentic-dev-env` 依賴鎖為當下的精確版本
6. `git init`

`package.json` 的 `repository.url` 保留 `FILL_ME` 佔位，由團隊填寫；runner 讀到 `FILL_ME` 時拒絕 init。

## 修改 seed 時要同步的地方

| 改動 | 一併修改 |
|---|---|
| 新增、刪除或改名 skill | `seed/README.md` 的 skill 說明；本 repo `README.md` 的 Skills 表與支數 |
| skill 要在 ADE repo 內也能觸發 | `bin/create.js` 與 `test.js` 的 symlink 清單（兩處清單必須一致） |
| skill 附帶腳本或範本檔 | 視需要加入 `test.js` 的附檔斷言，確認附檔隨目錄注入 |
| 新增點開頭的檔案或目錄 | 在 seed 內以無點名稱存放，並在 `bin/create.js` 補上改名 |
| 內容需要 ADE repo 名稱 | 寫 `__ADE_NAME__`，create 會替換 |
| 搬動或改名 `knowledge/`、`claude-md/section.md`，或改變 skill 目錄規則 | 屬契約 A，先讀 [dependency-contract.md](./dependency-contract.md) |
| 搬動 `seed/` 內的檔案 | seed 內指向它的相對連結 |
| 任何 seed 改動 | `CHANGELOG.md` 條目 |

## 驗證

```sh
node test.js              # create → init → update 端到端，含 seed 各部分的去向
npm pack --dry-run        # 確認 seed/ 有被打包（package.json 的 files）
```
