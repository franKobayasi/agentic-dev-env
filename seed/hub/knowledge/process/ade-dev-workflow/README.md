---
id: 5ee9e6
description: ade-dev 與 ade-dev-auto 的全部規則，依角色與時機分檔載入：狀態、六關、審查、auto-pilot 與批次。
---

# ade-dev workflow：唯一事實來源

`ade-dev`／`ade-dev-auto` 兩支 skill 的全部規則住在本目錄；skill 本身只是觸發與指標，**不複述任何判準的值**（檢查法：任改一個閾值後 grep 全 repo，命中必須恰好 1 處）。每次規則變動記入 ADE repo 的 `docs/ade-dev-workflow-changelog.md`，任務的 `spec.md` 以 `ade_commit` 對應到當時版本；這份紀錄只給維護者回顧，不注入 ADE。

## 誰在什麼時候讀哪份

按角色載入，不整包讀——規則對讀不到它的人只是噪音。

| 角色／時機 | 讀 |
|---|---|
| 任何 session 起手（接手判讀、執行模式判讀） | [開發任務的狀態與檔案](kb:process/8ac32d) |
| 走第 1、2、4、5、6 關 | [開發任務的狀態與檔案](kb:process/8ac32d)＋[六關的產出與過關判準](kb:process/8707ca) 對應關 |
| 第 3 關實作 Phase 的 worker | [六關的產出與過關判準](kb:process/8707ca) 第 3 關＋任務檔（`spec.md`、`plan.md`、`notes.md` 全文、本 Phase 的 `phase-N.md`） |
| 派兩軸審查的一方 | [兩軸審查的契約](kb:process/5d2867) |
| 兩軸審查的審查者（prompt 只含這個） | [兩軸審查的契約](kb:process/5d2867) 契約段＋diff＋`spec.md`＋`phase-N.md` |
| auto 模式的 orchestrator | [開發任務的狀態與檔案](kb:process/8ac32d)＋[Spec Ready 與 auto-pilot 的規則](kb:process/724d2e) |
| `ade-dev-auto` 批次 | [開發任務的狀態與檔案](kb:process/8ac32d)＋[批次串接的規則](kb:process/d1e46f) |
| 維護者回顧某次優化是否有效 | ADE repo 的 `docs/ade-dev-workflow-changelog.md`＋上游 `docs/research/ade-dev/` |

## 證據

各項規則的證據盤點（研究參考，非規則）住在上游框架的 [docs/research/ade-dev/](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev)，不隨 ADE repo 複製；規則檔以 URL 引用，每份檔頭有採用標注指回規則所在。含 `research-skill-boundaries.md`（skill 間引用與內容歸屬原則，`ade-ship` 亦引用）
