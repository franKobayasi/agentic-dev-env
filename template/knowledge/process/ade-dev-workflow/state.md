# 狀態與檔案

每一關只定義「產出＋過關判準」。判準是可檢查的狀態，不是動作；**如何達成由 agent 自行決定**。狀態全部活在檔案裡，任何 session 讀檔即可接手（每個 Phase 交付後建議 `/clear` 換新 session 接續，控管 context）。

## 詞彙

- **關**＝流程階段邊界；**Phase**＝可獨立交付的開發單位，輪到才展開；**Task**＝Phase 展開後的 checklist 項，無獨立契約
- **產品規格**＝ADE `knowledge/specs/` 的長期資產，只有人能拍板；**實作規格**＝只描述本次開發範圍，簽核後凍結
- **煞車**＝任務層的執行期停止條件（本 skill 定義）；**熔斷**＝批次層的停止條件（`ade-dev-auto` 定義），兩詞不混用

## 檔案

```
.ade-dev/{YYYYMMDD}-{slug}/
├── spec.md      # 實作規格（規格關簽核後凍結，不再更新）（frontmatter：status／approved_by／ade_commit）
├── plan.md      # Phase 地圖（活的：每 Phase 1–3 行交付定義＋checkbox＋依賴）（frontmatter：status／approved_by／停機時 halted）
├── phase-N.md   # 展開產物（輪到才建：AC＋Tasks checklist）＋交付紀錄（審查處置、預估 vs 實際的分析、AC 證據）——一個 Phase 的完整故事，只讀當前
└── notes.md     # 跨 Phase 仍有效的事（append-only；每則以 [裁決]／[發現]／[摩擦]／[失敗]／[修訂] 開頭）：人裁決、規格關發現、環境坑、失敗路徑【做了什麼／預期／實際／推論】、plan 修訂原因、Spec Ready 結果、每 Phase 一行量測
```

狀態規則（單一真相，每個事實只記一處，不另設 status.json／progress.md——第二份真相必漂移，依據見 [research-devflow-state.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-devflow-state.md)、[research-auto-state.md](https://github.com/franKobayasi/agentic-dev-env/blob/main/docs/research/ade-dev/research-auto-state.md)）：

- `spec.md`、`plan.md` 檔頭 YAML frontmatter `status: draft`，**過關時**改為 `status: approved`（逐字一致，工具靠精確匹配）
- `spec.md` 建檔時寫 `ade_commit: <工作目錄 .ade.json 的 commit>`——任務跑在哪個版本的流程下；中途 `ade-update` 換版在 `notes.md` 記一則 `[修訂]`。這是日後回顧「某次流程優化是否有效」的分組依據
- 同一次寫入 `approved_by`：人簽核寫 `human`，auto-pilot 由 Spec Ready 替代簽核寫 `spec-ready`。**此欄位一經寫入不得修改**——它記的是當時誰簽的，不是現在的模式；缺席視同 `human`。人事後補審 auto 簽的文件，在 `notes.md` append 一則，不回頭改本欄位
- Phase 進度只記在 `plan.md` 的 checkbox（`- [ ]`／`- [x]`，小寫 x）；`phase-N.md` 不重複記自己的完成狀態
- `plan.md` 底部固定三個收尾項：`- [ ] 測試審視`、`- [ ] 沉澱`、`- [ ] Ship`，對應第 4、5、6 關過關時勾掉
- **留給後續的事項**（審查確認但不在本 Phase 修、交接點、留給第 4 關的）寫成 `plan.md` 目標 Phase 或收尾項底下的子 checkbox——待辦是活的，不進 append-only 的 `notes.md`

**接手判讀**（任何 session 讀檔即可接手；依序判斷，**讀到能決定下一步就停**）：

1. 沒有 `spec.md` → 從第 1 關開始
2. `spec.md` 的 `status` 不是 `approved` → 卡在第 1 關
3. 沒有 `plan.md`，或其 `status` 不是 `approved` → 卡在第 2 關
4. `plan.md` 有 `halted:` → **停**。不論其他狀態如何都不得自動續跑；把原因碼與 `notes.md` 最後一則交給人裁決，人刪掉該行才恢復
5. `plan.md` 有未勾的 Phase → 卡在第 3 關。該 Phase 已有 `phase-N.md` 就從未勾的 Task 續，沒有就展開它
6. Phase 全勾 → 底部三個收尾項第一個未勾者即所在的關（測試審視＝第 4 關、沉澱＝第 5 關、Ship＝第 6 關）
7. 全部勾完 → 已完成

**執行模式判讀**：`spec.md` 與 `plan.md` 的 `approved_by` **皆為** `spec-ready`、且無 `halted:` → 續跑 auto-pilot；其餘一切情形（任一為 `human`、任一缺欄位、任一檔案不存在）→ **手動模式**。判不出來就是手動，不猜。
