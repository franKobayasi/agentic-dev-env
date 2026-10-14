---
name: ade-prd-to-spec
description: 將已確認的 PRD 融入 specs，標記尚未實作區塊，供 PO 確認 PRD 與 spec 對齊。使用者說「PRD 轉 spec」「更新規格」「把 PRD 落到 spec」時使用。
---

# PRD → Spec

前提：PRD 狀態必須是「已確認」，否則請 PO 先走完 `ade-create-prd`。

## 流程

0. **判斷所在位置**：repo 根有 `knowledge/specs/` → 你在 ADE repo 內，直接編輯本 repo 檔案；只有 `.claude/ade/knowledge/` → 你在工作目錄，依 `ade-contribute` skill 的流程取得 ADE 工作副本並建立分支，以下所有 `knowledge/...` 路徑都指工作副本內的檔案（絕不直接改 `.claude/ade/` 副本）

1. 讀目標 PRD 與 `knowledge/specs/` 現況，找出受影響的 spec 檔（沒有對應檔就依 `specs/README.md` 慣例新建）
2. 將 PRD 需求融入 spec：描述「功能完成後應有的樣子」，並在每個新增／變更的行為區塊上方加標記行，**格式逐字照抄、只替換檔名**（align-spec 靠精確匹配移除，變體會漏抓）：
   ```
   > 🚧 尚未實作（PRD: ../prd/YYYY-MM-DD-slug.md）
   ```
   同一區塊已有其他 PRD 的標記時，堆疊一行新標記，勿合併、勿改動他人標記行
3. 只動這次 PRD 涉及的內容，spec 其餘部分一字不改
4. 回填 PRD 的「Spec 異動摘要」：動了哪些檔、各自異動重點
5. 帶 PO 逐項確認 spec 與預期相符，不符就修到對齊為止
6. PO 確認後收尾：ADE repo 內 → 照一般 git 慣例 commit；工作目錄 → 依 `ade-contribute` 流程開 PR

完成後提醒：RD 開發完成後在工作目錄跑 `ade-align-spec` 收尾。
