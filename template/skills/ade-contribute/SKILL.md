---
name: ade-contribute
description: 將工作過程中發現的知識缺口、過期文件、新慣例回流到中央 ADE 知識庫。發現 .claude/ade/knowledge/ 內容與現實不符、缺少資訊，或使用者說「把這個記回知識庫」「更新 ADE」「回流」時使用。
---

# ADE 知識回流

本地 `.claude/ade/` 是 managed 區域，`update` 時會被整個覆蓋——**永遠不要直接修改本地副本**，把修正送回中央 ADE repo。

## 流程

1. 讀工作目錄的 `.ade.json` 取得 `source`（ADE repo 的 git url）
2. Clone 到暫存目錄：`git clone <source> <tmpdir>/ade`
3. 在 clone 中建立分支，修改 `knowledge/` 下對應文件
   - 修改前先讀原文，沿用既有格式與詞彙
   - 服務描述檔必須符合 `knowledge/services/_template.yaml` 的欄位結構；收錄範圍遵守 `knowledge/README.md` 的分層規則
4. Commit 並開 PR（GitHub 用 `gh pr create`，GitLab 用 `glab mr create`）
   - PR 描述寫清楚：發現什麼缺口、在哪個工作情境發現的
5. 告知使用者 PR 連結；merge 後在工作目錄執行 update 即可取得新版
