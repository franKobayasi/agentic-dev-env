---
name: ade-add-skill
description: 為 ADE 新增 skill，供 ADE 內、Forge 中或兩邊使用。使用者說「新增 skill」「建一支 skill」「把這個做成 skill」「這個 skill Forge 也要能用」時使用。
metadata:
  ade-scope: both
---

# 新增 skill

1. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，你在 ADE 內，直接編輯本 repo 的檔案。只有 `.claude/ade/knowledge/` 時，你在 Forge 中，依 `ade-contribute` 的流程取得工作副本並建立分支；以下路徑都指工作副本內的檔案，不得修改 `.claude/ade/` 的副本。
2. **選使用對象**——這決定放哪，不確定就問使用者：
   - **Forge 中使用** → `hub/skills/ade-<name>/`。init 與 update 會注入各 Forge 的 `.claude/skills/`；**目錄名必須 `ade-` 前綴**，runner 只管理此前綴，非前綴會被拒裝
   - **ADE 內用**（PO／維護者）→ `.claude/skills/ade-<name>/`（實體目錄）
   - **兩邊都用** → 放 `hub/skills/ade-<name>/`，frontmatter 加 `metadata:` 下的 `ade-scope: both`，再建 symlink：`ln -s ../../hub/skills/ade-<name> .claude/skills/ade-<name>`
   - `.claude/skills/` 下的實體目錄是 ADE 專用、symlink 是兩邊都用（單一真相在 `hub/skills/`，維護只改一份）
3. 寫 `SKILL.md`：frontmatter 的 `name` 與目錄同名；`description` 寫觸發語（使用者會說什麼、什麼情境該觸發）；body 只寫執行步驟，規則以符號位址引用知識、不重述，人也需要知道的內容寫進知識，見[流程的入口檔](kb:process/2f0360)的結構規則
4. skill 內需要「開 PR 回 ADE」的動作一律寫「依 `ade-contribute` 流程」，不要重複實作回流機制
5. 更新本 repo `README.md` 的 Skills 一覽
6. 收尾：在 ADE 內依一般 git 慣例 commit；在 Forge 中依 `ade-contribute` 的流程開 PR
