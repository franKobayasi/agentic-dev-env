---
name: ade-contribute
description: 將工作過程中發現的知識缺口、過期文件、新慣例回流到中央 ADE 知識庫。發現 .claude/ade/knowledge/ 內容與現實不符、缺少資訊，或使用者說「把這個記回知識庫」「更新 ADE」「回流」時使用。
---

# ADE 知識回流

本地 `.claude/ade/` 是 managed 區域，`update` 時會被整個覆蓋——**永遠不要直接修改本地副本**，把修正送回中央 ADE repo。

## 流程

1. 讀工作目錄的 `.ade.json` 取得 `source`（ADE repo 的 git url；為 null 則請使用者補上）
2. **查重**：查 ADE repo 的 open issues 與 open PRs（`gh issue list` / `gh pr list`），同一缺口已有記錄 → 在該 issue/PR 留言補充你的發現，到此結束，不重複開
3. **開 issue 記錄缺口**：一段話描述缺什麼／哪裡過期、在哪個工作情境發現的——issue 是查重與追蹤的協調點
4. Clone 到暫存目錄：`git clone <source> <tmpdir>/ade`，建立分支，修改 `knowledge/` 下對應文件
   - 修改前先讀原文，沿用既有格式與詞彙
   - 服務描述檔必須符合 `knowledge/services/_template.yaml` 的欄位結構；收錄範圍遵守 `knowledge/README.md` 的分層規則
5. Commit、push 分支，開 PR 並連結 issue（描述加 `Closes #<issue 編號>`；GitHub 用 `gh pr create`，GitLab 用 `glab mr create`）
   - gh/glab 不可用或未登入時的降級路徑：push 分支後，把 compare／new-MR 網址給使用者，請人手動開
6. 告知使用者 PR 連結；merge 後在工作目錄執行 update 即可取得新版
