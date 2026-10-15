---
name: ade-contribute
description: 從 Forge 修改 ADE 的知識或 skill 並開 PR（ADE 只在本地時 push 分支交人 merge）——包含主動撰寫（新增或調整 spec、skill、process、服務描述檔）與被動回流（發現 .claude/ade/knowledge/ 內容過期或缺漏）。使用者說「改 ADE 的 spec／skill」「把這個記回知識庫」「同步到 ADE」「寫回 ADE」「回流」時使用。
---

# 知識回流到 ADE

本地 `.claude/ade/` 是 managed 區域，`update` 時會被整個覆蓋——**永遠不要直接修改本地副本**，一切修改都在 ADE 的工作副本上進行、走 PR 回去。

## 流程

1. 讀 Forge 根目錄的 `.ade.json` 取得 `source`（ADE 的 git url 或本地路徑；為 null 則請使用者補上）。`source` 是檔案系統路徑（`/`、`~`、`.` 開頭或 `file://`）即**本地模式**：ADE 不在 GitHub／GitLab，沒有 issue 與 PR，下列標〔本地〕的替代做法適用
2. **取得工作副本**：`workspaces/<ade-repo-name>/`（repo 名取自 `source`）已存在就直接用，不存在才 `git clone <source>` 到那裡——ADE 與服務 repo 一樣放 workspaces，不用 tmpdir，才不會每次重 clone、也保得住未 push 的工作
   - 開工前 `git fetch origin` 並從最新主幹開分支：`git switch -c <branch> origin/HEAD`（`origin/HEAD` 即遠端預設分支，不假設叫 `main`）
3. **判斷起點**，兩種：
   - **主動撰寫**（使用者明確要求新增或調整 spec、skill、process、服務描述檔）→ 不開 issue，直接進第 4 步
   - **被動回流**（工作中發現知識庫過期或缺漏）→ 先查重：`gh issue list` / `gh pr list`，同一缺口已有記錄就在該 issue/PR 留言補充，到此結束；沒有才開 issue 描述缺什麼／哪裡過期／在哪個工作情境發現的，issue 是查重與追蹤的協調點
   - 〔本地〕查重改看 `git branch -r` 與 `git log origin/HEAD --oneline -30` 有無同一缺口的分支或 commit；不開 issue，缺口描述（缺什麼／哪裡過期／在哪個情境發現）寫進 commit body；`[upstream-candidate]` 類的機制改良則 append 到 ADE 根的 `UPSTREAM-CANDIDATES.md`（同樣走分支）
4. 修改 `knowledge/` 下對應文件
   - 修改前先讀原文，沿用既有格式與詞彙
   - 依[建立知識的規則](kb:process/7caa6d)修改；建立或修改一份知識時可依 `ade-build-knowledge` 的步驟
   - 新增或修改 skill 走 `ade-add-skill`，新增流程慣例走 `ade-add-process`——它們負責放置位置與 README 同步，收尾一樣回到本流程
5. Commit、push 分支，開 PR（GitHub 用 `gh pr create`，GitLab 用 `glab mr create`）；被動回流的 PR 描述加 `Closes #<issue 編號>`
   - gh/glab 不可用或未登入時的降級路徑：push 分支後，把 compare／new-MR 網址給使用者，請人手動開
   - 〔本地〕push 分支即止、不開 PR（非 bare 的本地 repo 也接受 push 到非 checked-out 的分支）；回報分支名與 diff 摘要，**merge 由人在 ADE 內執行**（`git -C <source> merge <branch>`），人當場要求才替他跑
6. 告知使用者 PR 連結（〔本地〕分支名），並把工作副本切回主幹（`git switch <預設分支>`）留給下次；merge 後在 Forge 執行 update 即可取得新版
