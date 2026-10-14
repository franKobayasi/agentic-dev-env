---
name: ade-add-skill
description: 為 ADE 生態新增 skill（供 ADE repo 內或消費端工作目錄使用）。使用者說「新增 skill」「建一支 skill」「把這個做成 skill」「這個 skill 消費端也要能用」時使用。
---

# 新增 skill

1. **判斷所在位置**：repo 根有 `knowledge/services/` → 你在 ADE repo 內，直接編輯本 repo 檔案；只有 `.claude/ade/knowledge/` → 你在工作目錄，依 `ade-contribute` skill 的流程 clone ADE repo 並建立分支（絕不直接改 `.claude/ade/` 副本）
2. **選使用對象**——這決定放哪，不確定就問使用者：
   - **消費端工作目錄用** → `skills/ade-<name>/`。init/update 會注入各工作目錄的 `.claude/skills/`；**目錄名必須 `ade-` 前綴**，runner 只管理此前綴，非前綴會被拒裝
   - **ADE repo 內用**（PO／維護者）→ `.claude/skills/ade-<name>/`
   - **兩邊都用** → 放 `skills/ade-<name>/`，再建 symlink：`ln -s ../../skills/ade-<name> .claude/skills/ade-<name>`（單一真相在 `skills/`，維護只改一份）
3. 寫 `SKILL.md`：frontmatter 的 `name` 與目錄同名；`description` 寫觸發語（使用者會說什麼、什麼情境該觸發）；body 遵守 context 紀律——只寫「何時做＋去哪看」，超過一頁的細節拆到 `knowledge/process/` 檔並連結（禁止孤兒：細節檔必須被引用）
4. skill 內需要「開 PR 回 ADE repo」的動作一律寫「依 `ade-contribute` 流程」，不要重複實作回流機制
5. 更新本 repo `README.md` 的 Skills 一覽
6. 收尾：ADE repo 內 → 照一般 git 慣例 commit；工作目錄 → 依 `ade-contribute` 流程開 PR
