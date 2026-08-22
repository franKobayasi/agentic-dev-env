---
name: ade-help
description: 列出當前位置可用的 ade-* skills 與各自用途。使用者說「有哪些 skill」「ade help」「我可以做什麼」「ADE 支援什麼」「skill 一覽」時使用。要列服務用 ade-list-service，不是這支。
---

# ADE skills 一覽

清單一律從 `.claude/skills/` 現況掃出來，**不要憑記憶列**——skill 會搬家、會新增，寫死的清單必然過期。

## 流程

1. 執行：
   ```bash
   bash .claude/skills/ade-help/list-skills.sh
   ```
   輸出每行是 `name<TAB>description`。掃的就是當前位置真正載得到的 skills，所以在工作目錄列到的是注入的那套、在 ADE repo 列到的是 repo 內那套，不需要額外判斷
2. 整理成表格給使用者：skill 名稱、一句話用途（把 description 的觸發語濃縮成「什麼時候用它」，不要整段照貼）
3. 開頭一行說明當前位置：repo 根有 `knowledge/services/` → 「你在 ADE repo，以下是本 repo 內可用的 skills」；只有 `.claude/ade/knowledge/` → 「你在工作目錄，以下是注入的 skills」
4. 使用者想知道某支細節時才讀那支的 `SKILL.md`——一次全讀進 context 是浪費

在 ADE repo 內時補一句：`skills/` 下另有只注入工作目錄、本 repo 不載入的 skills（`bash skills/ade-help/list-skills.sh skills` 可列），要改它們用 `ade-add-skill`。
