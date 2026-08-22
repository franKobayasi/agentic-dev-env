# 六關：產出與過關判準

## 第 1 關：規格

產出：`spec.md`（實作規格）。過關判準：

- 有 PRD 時以 PRD＋產品規格為據（工作目錄的 `.claude/ade/knowledge/` 副本僅供導航，過期以 ADE repo 為準）；無 PRD 時以需求描述為據
- 已比對相關既有規格與服務：關聯、衝突、系統層級不一致已列出，並解決或經人裁決
- 每個行為描述具體到可直接寫成測試
- 所有不明確處已向人提問並得到答案
- **人簽核後過關**（frontmatter 改 `status: approved`），**此後凍結**

## 第 2 關：規劃

產出：`plan.md`（Phase 地圖——看見全貌、分而治之）。過關判準：

- 每個 Phase 只寫 1–3 行**交付定義**：完成後可觀察到什麼行為、為何合併安全（天然惰性的實作順序，或 feature flag）
- 交付定義 3 行內寫不清楚、或「會動到哪些地方」列不出來 → Phase 太大，再拆
- 軟判準（命中＝回頭檢查邊界）：觸及 ≥ 3 個模組、預估超過一兩天人力當量、或依賴另一個未完成 Phase 的產出 → 優先重切
- Phase 依賴構成 DAG；預設依序交付，是否並行、如何隔離是 agent 的自由，不在此規定
- **人簽核後過關**（frontmatter 改 `status: approved`）。之後 agent 可修訂未來 Phase（在 `notes.md` 留痕原因）；動到已交付 Phase 的行為才回人

## 第 3 關：實作（逐 Phase，輪到才展開）

起手讀 `spec.md`＋`plan.md`＋`notes.md` 全文＋本 Phase 的 `phase-N.md`；其他 Phase 的 `phase-N.md` 不讀，除非 `plan.md` 的 checkbox 指過去。展開：建 `phase-N.md`，把交付定義細化為 Given/When/Then AC＋Tasks checklist。未輪到的 Phase 不展開。過關判準：

- 每條 AC 可回溯到交付定義的某一句
- 每完成一個 Task 即勾掉 `phase-N.md` 的 checkbox——這是 Phase 內唯一的進度紀錄，寫在任何 compaction 之前；Phase 內發生 compaction 後的**第一個動作**固定是重讀 `spec.md`＋`phase-N.md`，覆述當前 AC 與下一個未勾 Task 再續（文檔是真相、context 是快取）
- 硬觸發（命中必拆，停下回報）：預估 diff **> 400 行**或改動**> 10 個檔案**——以「人要逐行讀的行數」計，整檔刪除、工具產生的機械 refactor、產生檔豁免。提示訊號（不強制拆但要說明理由）：AC > 8 條；AC 需要先建測試基礎設施才寫得出來 → 把基礎設施抽成前置 Phase。數字依據與校準方式見 [research-phase-sizing.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-phase-sizing.md)
- Phase 交付後在 `notes.md` 記**一行量測**（固定欄位，供跨任務 grep）：`[量測] P<N> 行數=<n> 檔數=<n> 預估行數=<n> 分鐘=<n> compaction=<n> blocking=<真/不成立> 修正輪=<n> 人介入=<n> session=<$CLAUDE_CODE_SESSION_ID> agent=<id或main>`——session 與 agent 用來定位 transcript（`~/.claude/projects/<proj>/<session>/subagents/agent-<id>.jsonl`），回顧時據此判定 agent 實際讀了什麼、派了什麼；審查處置、預估 vs 實際的分析、AC 證據（測試檔名與結果摘要）寫進 `phase-N.md` 的「交付紀錄」段，不進 `notes.md`
- 每條 AC 有自動化測試，且該測試在實作完成前**失敗過**（紅→綠，順序本身就是證據）
- 既有代碼的順手優化僅限本 Phase 觸及的檔案；更大的重構記進 `notes.md`，不做
- 交付前**兩軸審查**：派兩個乾淨 context 的 subagent 平行檢查、分開報告，不合併排名——(a) 規格符合度：對照 `spec.md`＋`phase-N.md`，找缺漏、越界、做錯；(b) 代碼品質：對照本 repo 的慣例與文件化標準。**派工規則**（手動與 auto 同用，依據 [research-orchestrator-subagent.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-orchestrator-subagent.md)）：
  - 派工規則與審查者契約見 [review.md](./review.md)
- 合併後主幹隨時可部署（merge-safe；實際部署節奏與本流程無關）

## 第 4 關：測試審視

全部 Phase 交付後，整體看一次測試。auto 模式由**乾淨 context 的 subagent** 執行（寫測試的人看不出自己的假綠；手動模式由人反問補上這一層）。過關判準：

- 每條 AC 有測試覆蓋，測的是公開介面的行為，不是實作細節（重構不應弄壞測試）
- 沒有恆真測試（期望值用與實作相同的方式算出，永遠通過）
- 沒有驗證第三方套件已保證的行為；沒有重複測同一件事的測項

## 第 5 關：沉澱

過關判準：

- 產品規格與實作一致：有 PRD 走 `ade-align-spec`；無 PRD 但動了產品行為 → 起草產品規格更新、**人確認後**依 `ade-contribute` 流程送出
- `notes.md` 收整成清單給人審視：關鍵發現、決策、流程摩擦與改良建議
- 清單中屬**機制層**的改良（skill 寫法、模板結構、流程設計，非本服務專屬），依 `ade-contribute` 在 ADE repo 開一則標題前綴 `[upstream-candidate]` 的 issue（本地模式沒有 issue：append 到 ADE repo 根的 `UPSTREAM-CANDIDATES.md`）——內文只描述機制、不含服務名稱與程式碼；是否回饋上游由 ADE repo 維護者判斷，**不在本流程內執行**

## 第 6 關：Ship

產出：已發出的 Merge Request。過關判準：

- 分支上的 commits 符合 `ade-commit` 解析出的慣例（專案自有規範優先，無則 ADE 預設）
- MR 依 `ade-ship` 發出：專案有 PR／MR 範本用專案的，沒有用 ADE 內建預設範本
- MR 描述涵蓋交付定義、AC 驗證證據、與規格的已知差異
- 發出即過關；**merge 由人執行**，不等 merge 才勾（Phase 級的合併若也走 MR，同樣用 `ade-ship` 發）。**auto 模式加一條**：MR 發出後 CI 須轉綠才算交付完成——CI 未跑完就結束的任務標記為未完成，不計入批次成功
