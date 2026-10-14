---
name: ade-dev-auto
description: 串接多個 ade-dev 任務的批次執行器——列出工作目錄中未完成的開發任務、多選、逐顆確認 Spec Ready，全數就緒後依序以 ade-dev auto-pilot 模式跑完。使用者說「批次開發」「把這些任務自動跑完」「ade-dev-auto」時使用。在服務工作目錄內使用；單顆任務（含單顆 auto 跑）直接用 ade-dev。
---

# ade-dev-auto

規則全部在 ADE `knowledge/process/ade-dev-workflow/`（工作目錄內為 `.claude/ade/knowledge/process/ade-dev-workflow/`），本 skill 不複述。

起手：讀 `state.md`（接手判讀、執行模式判讀）與 `batch.md`（流程、B1–B4、熔斷、`auto-run.md`）；逐顆任務的 Spec Ready 判定與 auto-pilot 執行依 `auto-pilot.md`，其餘依 `ade-dev` 的角色載入規則。
