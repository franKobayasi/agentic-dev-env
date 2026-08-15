# 流程知識

團隊怎麼工作：開發流程、分支與 PR 慣例、測試策略、PRD 怎麼寫、release 怎麼跑。

## 流程的落地層（放置決策規則）

為環境建立流程時，依強制力需求選載體——強制力與 context 成本成正比：

1. **無條件約束**（任何任務都適用）→ `claude-md/section.md` 加一行指標。section 是每個 session 的固定 context 成本：一條一行、總量克制
2. **有觸發時機的程序** → `skills/` 一支 skill（目錄名必須 `ade-` 前綴），description 寫觸發語
3. **細節**（清單、範例、規格）→ 本目錄一主題一檔，被上兩層引用、按需載入

原則：**預設 context 最小化**——常駐層只寫「何時做＋去哪看」（參考技巧），細節留在本目錄等被載入。用 `ade-add-process` skill 引導整個落地流程。

## 檔案慣例

- 一個主題一個 md 檔，kebab-case 檔名（例：`git-commit.md`、`branching.md`、`release.md`）
- 框架預載的預設檔會在檔頭標示；與團隊實況不符時直接修改，勿讓錯誤的預設值留在庫裡

## 現有主題

- [git-commit.md](./git-commit.md) — commit 訊息採 Conventional Commits
