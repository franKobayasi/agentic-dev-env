# 批次串接：ade-dev-auto

本檔**不定義任何任務內的判準、執行規則、煞車或狀態判讀規則**——Spec Ready 判定、auto-pilot 執行、任務層煞車見 [auto-pilot.md](./auto-pilot.md)，接手判讀見 [state.md](./state.md)。這裡只管批次：選取、就緒把關、依序執行、批次層熔斷。

## 流程

1. **列任務**：掃 `.ade-dev/*/`，對每個目錄套 `ade-dev` 的**接手判讀規則**得出卡在哪一關。供人多選。
2. **逐顆跑 `ade-dev` 的 Spec Ready 判定**，逐條列 PASS／FAIL；就緒報告固定列滿 G1–G8，G5／G6 標 `DEFERRED（待 plan.md 定稿）`，規劃關結束後補判。
3. **不合格的任務**問人：**補齊**（降回 `ade-dev` 手動模式補缺的關，補完歸隊重評）或**剔除**（整顆移出本批，不支援 Phase 級加選）。
4. 全數就緒後**依序**逐顆以 `ade-dev` auto-pilot 模式執行，直到全部完成或命中熔斷。每顆啟動前確認：執行模式判讀為 auto（兩份 `approved_by` 皆 `spec-ready` 且無 `halted:`）、批次累計時間未超 B4 上限。每顆 `plan.md` 定稿後，以實際檔案清單對其他已定稿任務**重驗一次 B1**（啟動時只有預估，真實清單此刻才確定）。

## 批次層判準（僅在此定義；依據 [research-autopilot-readiness.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-autopilot-readiness.md) §1.2、[research-batch-safety.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-batch-safety.md)）

- **B1** 批次內任務的預期改動檔案互不相交（兩兩交集為空）。依序執行下這條防的不是併發寫入，是 MR 被人以未知順序 merge 時的必然衝突，以及熔斷失效時的污染上限（cell 邊界）
- **B2** 一批 ≤ 5 顆，**依序逐顆執行、不併發**——併發加速的是 agent 的 wall-clock，瓶頸卻是人 merge 的頻寬；且兩顆同時跑會讓熔斷的「連續」失去定義。批次規模另受積壓扣減：**本批顆數 ≤ 5 −（目前由 auto-pilot 開出、尚未 merge 也未關閉的 MR 數）**，差額 ≤ 0 就不開批次、先請人清積壓；扣減時明說原因（「本批只能開 2 顆，因為還有 3 個 MR 沒 merge」）
- **B3** 逐顆獨立評估與執行，單顆不合格或失敗只影響該顆
- **B4** 單顆任務 wall-clock ≤ 60 分鐘；**批次總 wall-clock ≤ 4 小時**——每顆任務**開始前**檢查批次累計時間，超過就不再啟動下一顆（軟停，不中斷進行中的任務），輸出總結與未跑的任務清單

## 批次熔斷

任務內何時停由 `ade-dev` 的煞車決定；停下的任務其 `plan.md` 帶 `halted: <原因碼>`。批次層**只讀原因碼**判定，不自己歸納相似度：

- **失敗類別**：`ERROR`（判斷不出來）＝原因碼 `test-env`；其餘原因碼皆為 `FAIL`（產出或規劃是壞的）
- `ERROR` 類**連續 2 顆** → 停整批，不論停在哪一關——環境問題會在不同關爆，用關來判會漏
- `FAIL` 類**連續 2 顆命中同一條原因碼** → 停整批；只是停在同一關但原因碼不同，不算同因
- 其餘單顆失敗 → 該顆降回手動，批次繼續下一顆
- 累計 3 顆失敗（不分類別）→ 停整批
- 環境阻塞（主幹紅、build 壞、依賴服務掛）→ 第一次命中即停整批
- **熔斷狀態不落檔**——接手時依 `auto-run.md` 的順序與各顆 `halted:` 重跑一次本節判定；環境阻塞當下重新觀察，不沿用上一個 session 的結論

## 紀錄

- `.ade-dev/auto-run.md` 是**批次層的決定紀錄，append-only**，一個批次一個 `##` 區段，只記**不會再變的決定**：批次 id（`YYYYMMDD-HHMM`）與建立時間、選入的任務目錄名依執行順序排成有序清單、剔除或要求補齊的任務與一句話理由。**禁記**（全部可從各任務 frontmatter＋checkbox 導出，寫進來就是第二份真相）：各顆卡在哪關、完成與否、批次執行到第幾顆、進度數字、熔斷是否觸發；**本檔不得出現 checkbox**
- **接手續跑**：讀 `auto-run.md` 取得清單與順序 → 對每顆套 `ade-dev` 的接手判讀規則得到現況 → 重跑一次熔斷判定 → 沒熔斷就從第一顆未完成的任務續跑
- Spec Ready 評估結果記進各任務自己的 `notes.md`
- 批次結束輸出總結：交付了哪些 MR、剔除或降手動了誰、每顆停下的原因碼與失敗類別、為什麼
