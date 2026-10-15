---
name: ade-config
description: 查看或修改 Forge 的安裝設定（.ade.json）——本地或遠端模式、來源 ADE 的 git url 或本地路徑、workspaces 作業區位置；在 ADE 內則是 package.json 的 repository.url。使用者說「Forge 設定」「ade config」「看目前設定」「改成本地模式」「來源改成…」「workspaces 指到…」「作業區換位置」時使用。
metadata:
  ade-scope: both
---

# Forge 設定

1. **判斷所在位置**：當前目錄有 `.ade.json` → Forge；repo 根有 `hub/knowledge/` 與帶 `ade` 欄位的 `package.json` → ADE 內；都不是 → 請使用者到 Forge 或 ADE 的根目錄再執行

## Forge：`.ade.json`

2. **查看**：讀 `.ade.json`，顯示
   - **模式**：`source` 是檔案系統路徑（`/`、`~`、`.` 開頭或 `file://`）→ 本地模式；否則遠端模式（列出 host）
   - `source`、`commit`（對照 `git ls-remote <source> HEAD` 標示是否最新）
   - `workspaces`：`null` 表示就在 Forge 根目錄底下；有值時列出目標，並確認 `workspaces` 真的是指向它的 symlink
3. **修改**：改 `.ade.json` 對應欄位後，**直接**執行 update（不經 `ade-update` 的版本比對——換來源或換作業區時即使 commit 相同也要重建）：
   ```bash
   pnpm dlx "<dlx 形式的 source>" update
   ```
   dlx 形式：`git@host:org/repo.git` → `git+ssh://git@host/org/repo.git`（冒號換斜線）；本地路徑 → `file:<絕對路徑>`
   - **切換本地／遠端、換來源**：`source` 改成新的 git url 或絕對路徑。本地路徑必須是有 commit 的 git repo（runner 會擋沒有 commit 的）。runner 以 `.ade.json` 的 `source` 為準，不會被 ADE 的 `repository.url` 蓋回——所以「團隊 repo 在 GitHub、我本機用自己的 clone 當來源快速迭代」是可行的，改回 url 即回到遠端
   - **換作業區**：`workspaces` 改成目標路徑（相對 Forge 根目錄或絕對路徑）。`workspaces/` 是空目錄或 symlink 時 runner 直接換成新 symlink；**實體目錄且非空**會被拒絕——先請使用者把內容搬到目標再試；改回 `null` 時先 `rm workspaces`（舊 symlink），update 才會建回實體目錄
4. 回報 `.ade.json` 前後差異與 update 結果；來源換了就順帶列新舊 commit 之間的變化（同 `ade-update` 第 5 步）

## ADE 內：`package.json`

5. 顯示／修改 `repository.url`（init 時寫進各 Forge `.ade.json.source` 的**初值**，git url 或絕對路徑；已 init 過的 Forge 不受影響，要換用上面的流程）與 `ade.upstream`（`ade-feedback-upstream` 的回饋對象）。改完照一般 git 慣例 commit
