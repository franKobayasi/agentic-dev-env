---
name: ade-spec-audit
description: 巡檢 spec 與各服務實作的一致性，找出計畫外變更（hotfix、直接改 code）造成的規格漂移。使用者說「巡檢 spec」「檢查規格漂移」「spec audit」「規格還對嗎」時使用。
---

# Spec 巡檢

spec 平時只靠 PRD 流程更新；hotfix 與計畫外變更會讓 spec 悄悄漂移。本 skill 補上這條偵測路徑。

## 流程

1. **先確保副本最新**：執行 update（或確認 `.ade.json` 的 commit 與遠端 HEAD 一致）——拿過期的 spec 副本去比對會誤報漂移
2. 列出 `.claude/ade/knowledge/specs/` 下的 spec；範圍大時請使用者指定優先巡檢的部分（建議：最近有 release 的服務相關）
3. 對每份 spec 找出涉及的服務（文內連結與 `services/index.md`），缺的 repo 依服務檔 clone 進作業區（`.ade.json` 的 `workspaces` 路徑）
4. 逐項對照實作與 spec 敘述，記錄不一致：行為已變、功能已移除、實作有但 spec 未記載
   - `🚧 尚未實作` 區塊屬「已定案未開發」，不算漂移，跳過
5. 向使用者報告漂移清單，確認哪些該修 spec（也可能是實作錯了該修 code）
6. 確認後依 `ade-contribute` skill 流程開 PR 修正 spec
