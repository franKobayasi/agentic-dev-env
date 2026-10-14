---
name: ade-ship
description: 從服務 repo 的分支發出 Merge Request / Pull Request——用 gh 或 glab CLI（不可用時退 API），MR 內容依專案自有範本，沒有就用 ADE 內建預設範本。使用者說「發 MR」「開 PR」「ship」「送出 merge request」，或 ade-dev 第 6 關、ade-dev-auto 交付時使用。
---

# ade-ship：發出 MR

## 1. 偵測平台與工具

看 `git remote get-url origin`：GitHub → `gh`；GitLab（含 self-hosted）→ `glab`。CLI 不存在或未登入時退平台 API（環境有 token 才用），都不行就停下請人處理——不要偽造成功。

## 2. 解析範本（找到第一個就停）

檔名比對一律**大小寫不敏感**（`find -iname`）——GitHub／GitLab 文件未保證大小寫敏感，實務上兩種寫法都常見。

**GitHub**（前六項在本地 clone 內，依序找）：

1. `.github/pull_request_template.md`
2. `pull_request_template.md`（repo 根）
3. `docs/pull_request_template.md`
4. `.github/PULL_REQUEST_TEMPLATE/` 目錄
5. `PULL_REQUEST_TEMPLATE/` 目錄（repo 根）
6. `docs/PULL_REQUEST_TEMPLATE/` 目錄
7. 前六項全空 → 查一次組織預設：`gh api repos/<org>/.github/contents/.github/pull_request_template.md`（也試 root 與 `docs/`；404 就是沒有，不重試）

目錄型（4–6）GitHub 不會自動套用、需人指定：恰好一份時直接用並在回報註明來源，多份時問人選哪份。

**GitLab**（依 GitLab 文件的優先順序，設定層高於檔案層）：

1. 專案設定的預設範本：`glab api projects/:id` 的 `merge_requests_template` 欄位非空 → 用它（Premium／Ultimate 才有此設定，其他方案此欄恆空，一次呼叫即可跳過）
2. `.gitlab/merge_request_templates/Default.md`（檔名大小寫不敏感）
3. `.gitlab/merge_request_templates/` 目錄下其他 `.md`（多份時問人）

**都沒有** → 用本 skill 的 [`templates/mr.md`](templates/mr.md)（ADE 預設），並在回報中註明「未找到專案範本，使用 ADE 預設」。

範本一律由本 skill 自己讀檔填寫後以 `--body-file` 送出；`gh pr create --template` 只提供空白起始文字、不做自動探索，非互動流程用不到。查找鏈依據見 [research-skill-boundaries.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-skill-boundaries.md) §3。

## 3. 填寫與發出

- 依分支實際 diff 填範本；範本欄位答不出來就問人，**不留 placeholder 發出**
- 來自 `.ade-dev/` 任務的交付：描述須涵蓋交付定義、AC 驗證證據（測試輸出摘要）、與規格的已知差異
- 發出前 commits 應符合 `ade-commit` 解析出的慣例
- target 為 repo 預設分支（ADE 服務描述檔有指定 branch 時以它為準）
- `gh pr create` / `glab mr create` 發出，回報 MR URL；**不自動 merge**——merge 是人的結果把關
