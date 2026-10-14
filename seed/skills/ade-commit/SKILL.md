---
name: ade-commit
description: 在服務 repo 產生符合慣例的 git commit——專案自有規範優先，沒有就用 ADE 預設（Conventional Commits）。使用者說「commit」「提交」「幫我 commit」，或任何流程（ade-dev、ade-ship）需要 commit 時使用。
---

# ade-commit：commit 訊息慣例解析

決定「這個 repo 的 commit 該長什麼樣」，依序找，找到第一個就停：

1. **專案自述**：服務 repo 的 `CLAUDE.md`／`AGENTS.md`（有哪個讀哪個）、`CONTRIBUTING.md` 中的 commit 規範
2. **專案設定檔**：commitlint 設定（`.commitlintrc*`、`commitlint.config.*`）、`.gitmessage` 範本
3. **既有風格**：`git log --oneline -20` 的實際風格明顯一致時，沿用它
4. **ADE 預設**：`.claude/ade/knowledge/process/git-commit.md`（Conventional Commits）

規則：

- 一個 commit 一件事；混雜多個意圖時拆開
- body 說「為什麼改」，不重述 diff
- 同一 repo 同一 session 內解析一次即可，不必每次 commit 重找
