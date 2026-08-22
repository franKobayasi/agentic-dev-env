---
name: ade-update
description: 把工作目錄的 ADE managed 內容（.claude/ade/knowledge/、.claude/skills/ade-*、CLAUDE.md managed 區段）更新到中央 ADE repo 最新版。使用者說「更新 ADE」「拉最新知識」「ade update」「知識庫過期了」，或 session 開始時偵測到版本落後時使用。
---

# 更新 ADE

只在**消費端工作目錄**（有 `.ade.json` 的 hub 根）執行；在 ADE repo 內沒有 managed 副本可更新，用一般 `git pull`。

## 流程

1. 讀 hub 根的 `.ade.json` 取得 `source`（為 null 則請使用者補上）
2. **比對版本**：`git ls-remote <source> HEAD`，hash 與 `.ade.json` 的 `commit` 相同 → 已是最新，回報後結束，不必跑 update
3. **先檢查有沒有未回流的修改**：`.claude/ade/` 與 `.claude/skills/ade-*/` 是 managed 區域，update 會整個覆蓋。有人手改過就先走 `ade-contribute` 把修改送回 ADE repo，否則會被蓋掉
4. 在 hub 根執行（`<source>` 的 `git@host:org/repo.git` 要改寫成 `git+ssh://git@host/org/repo.git`——冒號換斜線）：
   ```bash
   pnpm dlx "git+ssh://git@github.com/ORG/REPO.git" update
   ```
5. 回報更新結果：`.ade.json` 的 `commit` 前後變化，以及這段期間 ADE repo 的 commit 摘要（`git log --oneline <舊 commit>..<新 commit>`，用 `git ls-remote`／既有 clone 取得皆可）——特別點出新增或改名的 skill，使用者才知道多了什麼能用
