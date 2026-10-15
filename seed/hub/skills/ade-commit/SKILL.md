---
name: ade-commit
description: 在服務 repo 產生符合慣例的 git commit——專案自有規範優先，沒有就用 ADE 預設（Conventional Commits）。使用者說「commit」「提交」「幫我 commit」，或任何流程（ade-dev、ade-ship）需要 commit 時使用。
---

# ade-commit：commit 訊息慣例解析

決定這個服務 repo 的 commit 該長什麼樣：依序尋找，找到第一個就停。

1. **專案自述**：服務 repo 的 `CLAUDE.md`、`AGENTS.md` 或 `CONTRIBUTING.md` 中的 commit 規範。
2. **專案設定檔**：commitlint 設定（`.commitlintrc*`、`commitlint.config.*`）或 `.gitmessage` 範本。
3. **既有風格**：`git log --oneline -20` 的風格明顯一致時，沿用它。
4. **ADE 預設**：[commit 訊息慣例](kb:process/beb6dc)。

不論採用哪一個來源的格式，都遵守[commit 訊息慣例](kb:process/beb6dc)的通用原則。同一個 repo 在同一個 session 內只需解析一次，不必每次 commit 重新尋找。
