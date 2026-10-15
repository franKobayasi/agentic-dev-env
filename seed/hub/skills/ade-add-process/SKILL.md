---
name: ade-add-process
description: 為團隊建立或修改流程慣例並落地到 ADE 知識庫。使用者說「建立一個流程」「定一個慣例」「以後都這樣做」「每次都要」「把這個做法固定下來」時使用。
metadata:
  ade-scope: both
---

# 建立／修改流程

把一個流程沉澱進 ADE，讓所有 ADE 中的 agent 都依循。載體的選擇、結構規則與 context 紀律見[流程的入口檔](kb:process/2f0360)，建立知識的規則見[建立知識的規則](kb:process/7caa6d)。本 skill 只寫執行步驟。

0. **判斷所在位置**：repo 根目錄有 `hub/knowledge/` 時，你在 ADE repo 內，直接編輯本 repo 的檔案。只有 `.claude/ade/knowledge/` 時，你在 ADE 中，依 `ade-contribute` 的流程取得工作副本並建立分支；以下路徑都指工作副本內的檔案，不得修改 `.claude/ade/` 的副本。
1. **選載體**：依入口檔的「流程的落地層」判斷這個流程需要常駐一行、一支 skill、`knowledge/process/` 的細節檔，或它們的組合。步驟多或跨角色的流程，依「流程的結構規則」拆成階段 skill 與總覽 skill。
2. **寫細節檔**：依 `ade-build-knowledge` 的步驟，在 `knowledge/process/` 建立細節檔。
3. **建立 skill**：需要 skill 時，依 `ade-add-skill` 建立；skill 以符號位址引用細節檔，不重述。
4. **加常駐行**：需要常駐行時，在 `hub/CLAUDE.section.md` 的適當小節加一行指標。常駐規則已超過 10 行時，新增前必須與使用者確認取捨：合併、降級為 skill 的觸發，或刪除一條舊的。
5. **同步導覽**：更新[流程的入口檔](kb:process/2f0360)的導覽。
6. **收尾**：在 ADE repo 根目錄執行 `node cli.js check`。在 ADE repo 內依一般 git 慣例 commit；在 ADE 中依 `ade-contribute` 的流程開 PR，合併後各 ADE 執行 update 即生效。
