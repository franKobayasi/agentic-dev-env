---
name: ade-align-spec
description: 功能開發完成後，核對 spec 與實作是否一致，移除尚未實作標記並將 PRD 標為已實作。使用者說「開發完了更新 spec」「對齊 spec」「align spec」「收尾文件」時使用。
---

# Spec 與實作對齊

開發完成後的文件收尾：讓 spec 回到「描述現況」的狀態。

## 流程

1. 確認這次開發對應的 PRD 與受影響 spec（從使用者、branch 或 PR 上下文取得；不確定就問）
2. 依 `ade-contribute` skill 的流程 clone ADE repo——**核對與修改都以這份 fresh clone 為唯一基準**。工作目錄的 `.claude/ade/` 副本可能過期（例如 PO merge 了 prd-to-spec 之後沒人跑過 update，本地根本沒有那些標記），只能當導航用
3. 找出本次 PRD 的標記：在 clone 的 spec 上先用 `grep -n "🚧" <spec>` 列出**全部**標記行（寬鬆匹配，連格式變體一起抓），再逐行看 PRD 檔名判斷歸屬——只處理含本次 PRD 檔名的行，其他 PRD 的標記與其描述的內容一律不碰
4. 逐項核對：對照作業區（`.ade.json` 的 `workspaces` 路徑）下的實際實作，檢查每個屬於本次 PRD 的 `🚧` 區塊
   - 已實作且行為一致 → 移除該標記行（整行刪除，內容保留）
   - 實作與 spec 不符 → 以**實作為準**修改 spec 內容，並記下差異
   - 沒做的項目 → 保留標記，記下
5. 在 clone 中套用修改；全部驗收項完成時，把 PRD 狀態改為「已實作」
6. 依 `ade-contribute` 的慣例開 PR（含查重與 gh/glab 降級路徑），描述中列出：移除了哪些標記、spec 與原規劃的差異（給 PO 判斷是否接受）、未完成保留的項目
