---
name: ade-add-process
description: 為團隊建立或修改流程慣例並落地到 ADE 知識庫。使用者說「建立一個流程」「定一個慣例」「以後都這樣做」「每次都要」「把這個做法固定下來」時使用。
---

# 建立／修改流程

把一個流程沉澱進 ADE，讓所有工作目錄的 agent 都 follow。核心是**選對載體**——強制力與 context 成本成正比（放置規則詳見 `knowledge/process/README.md`）。

## 1. 分類：這個流程是哪一種？

- **無條件約束**（任何任務都適用，如 commit 風格）→ `claude-md/section.md` 加**一行**指標
- **有觸發時機的多步驟程序**（如 release、開發收尾）→ `skills/` 新增一支 skill
- **被引用的細節**（清單、範例、規格）→ `knowledge/process/<主題>.md`

多數流程是組合：常駐一行（或一支 skill）＋ process 細節檔。

**大流程要拆**：步驟多或跨角色的流程，拆成多支自足的階段 skill ＋ 一支薄總覽 skill（只放階段地圖與進度判斷）。階段交接狀態必須外部化到檔案，各階段 skill 開場先讀檔判斷進度；執行痕跡重的階段建議交 subagent 隔離（結構規則詳見 `knowledge/process/README.md`）。

## 2. Context 紀律（每一步都遵守）

- **參考技巧**：常駐層與 skill body 只寫「何時做＋去哪看」，細節放 process/ 檔按需載入——預設 context 越小越好
- section.md 常駐規則一條一行；**常駐規則超過 10 行時，新增前必須與使用者確認取捨**（合併、降級為 skill 觸發、或刪一條舊的）
- skill 的 description 寫觸發語、body 精簡；超過一頁的細節拆到 process/ 檔並連結
- **禁止孤兒**：新增的 process/ 文件必須被 skill 或常駐行引用，否則它永遠不會進入 context

## 3. 落地

0. **判斷所在位置**：repo 根有 `knowledge/process/` → 你在 ADE repo 內，直接編輯本 repo 檔案；只有 `.claude/ade/knowledge/` → 你在工作目錄，依 `ade-contribute` skill 的流程取得 ADE 工作副本並建立分支（含查重：同一流程已有 issue/PR 就別重開），以下所有路徑都指工作副本內的檔案（絕不直接改 `.claude/ade/` 副本）
1. 寫 `knowledge/process/<主題>.md`（細節層，kebab-case 檔名）
2. 需要 skill 的：依 `ade-add-skill` skill 建立（它管使用對象選擇、放置位置與命名規則）
3. 需要常駐行的：在 `claude-md/section.md` 適當小節加一行指標
4. 更新 `process/README.md` 的主題索引
5. 收尾：ADE repo 內 → 照一般 git 慣例 commit；工作目錄 → 依 `ade-contribute` 流程開 PR。merge 後各工作目錄 update 即生效
