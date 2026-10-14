# ade-dev workflow：唯一事實來源

`ade-dev`／`ade-dev-auto` 兩支 skill 的全部規則住在本目錄；skill 本身只是觸發與指標，**不複述任何判準的值**（檢查法：任改一個閾值後 grep 全 repo，命中必須恰好 1 處）。每次規則變動記入 [CHANGELOG.md](./CHANGELOG.md)，任務的 `spec.md` 以 `ade_commit` 對應到當時版本。

## 誰在什麼時候讀哪份

按角色載入，不整包讀——規則對讀不到它的人只是噪音。

| 角色／時機 | 讀 |
|---|---|
| 任何 session 起手（接手判讀、執行模式判讀） | [state.md](./state.md) |
| 走第 1、2、4、5、6 關 | [state.md](./state.md)＋[gates.md](./gates.md) 對應關 |
| 第 3 關實作 Phase 的 worker | [gates.md](./gates.md) 第 3 關＋任務檔（`spec.md`、`plan.md`、`notes.md` 全文、本 Phase 的 `phase-N.md`） |
| 派兩軸審查的一方 | [review.md](./review.md) |
| 兩軸審查的審查者（prompt 只含這個） | [review.md](./review.md) 契約段＋diff＋`spec.md`＋`phase-N.md` |
| auto 模式的 orchestrator | [state.md](./state.md)＋[auto-pilot.md](./auto-pilot.md) |
| `ade-dev-auto` 批次 | [state.md](./state.md)＋[batch.md](./batch.md) |
| 維護者回顧某次優化是否有效 | [CHANGELOG.md](./CHANGELOG.md)＋上游 `docs/research/ade-dev/` |

## 檔案

- [state.md](./state.md) — 詞彙、`.ade-dev/` 任務檔定義、狀態規則（單一真相）、接手判讀、執行模式判讀
- [gates.md](./gates.md) — 六關的產出與過關判準
- [review.md](./review.md) — 兩軸審查的派工規則與審查者契約（手動與 auto 同用）
- [auto-pilot.md](./auto-pilot.md) — Spec Ready G1–G8、auto-pilot 執行規則、任務層煞車
- [batch.md](./batch.md) — 批次串接的流程、B1–B4、熔斷、`auto-run.md`
- [CHANGELOG.md](./CHANGELOG.md) — 規則異動紀錄：每次改了什麼、假設、事前寫好的預期痕跡、事後判定。**agent 不載入**
- 各項規則的證據盤點（研究參考，非規則）住在上游框架的 [docs/research/ade-dev/](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev)，不隨 ADE repo 複製；規則檔以 URL 引用，每份檔頭有採用標注指回規則所在。含 `research-skill-boundaries.md`（skill 間引用與內容歸屬原則，`ade-ship` 亦引用）
