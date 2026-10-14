---
name: ade-dev
description: 判準制標準開發流程——針對 PRD 或自然語言需求，走「規格→規劃→逐 Phase 實作→測試審視→沉澱→Ship」六關開發；內建 Spec Ready 判定與 auto-pilot 模式（就緒即可無人中途把關跑完）。使用者說「開始開發」「照流程開發這個需求／PRD」「ade-dev」「繼續開發」「接手下一個 Phase」「這個任務 auto 跑」時使用。在服務工作目錄內使用。
---

# ade-dev

規則全部在 ADE `knowledge/process/ade-dev-workflow/`（工作目錄內為 `.claude/ade/knowledge/process/ade-dev-workflow/`），本 skill 不複述。

起手：讀該目錄的 `README.md`，依「誰在什麼時候讀哪份」只載入你這個角色需要的檔——起手一律先讀 `state.md` 做接手判讀與執行模式判讀，再依所在的關載入 `gates.md` 對應段；派審查讀 `review.md`；auto 模式的 orchestrator 另讀 `auto-pilot.md`。派出的 worker 與審查者 prompt 同樣只給它們那一片，不整包貼。
